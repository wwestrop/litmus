import { app, BrowserWindow, Menu, MenuItem, dialog, nativeImage, ipcMain, shell } from "electron";
import { File, Directory } from '../lib/LibFs/Fs';
import { RunnerFactory } from './ts/logic/RunnerFactory';
import { MochaTestAdapter } from "./ts/mocha/MochaTestAdapter";
import { TestsNotDiscoveredException } from './ts/exceptions/TestsNotDiscoveredException';
import { prototype } from "events";
import * as Path from 'path';
import { TestRun } from './ts/types/TestRun';
import { TestStatus } from "./ts/types/TestStatus";
import * as KbShortcuts from 'electron-localshortcut';
import { DEV_MODE } from './ts/Consts';

/*export*/ let mainWindow: BrowserWindow; // so other processes can poke at it (eg when runner has sth to report, poke in a message via its webcontents, set its progressbar from the main thread - shoulg that win be responsible for setting its own progress? probably. would invilve an extra RPC call though)
let backgroundWorker: BrowserWindow;

let selectedDir: Directory | null; // TODO fixing the "selected dir" state across whole app is un-Mac-like where using multiple windows in an app. But then again I want to keep it SIMPLE above all!!

// TODO these menuItem references are for the *SINGLETON* UI window (so if we ever want to allow multiple windows......)
const menus = {
	fileOpenFolder: new MenuItem({
		label: "Open folder…",
		accelerator: "CmdOrCtrl+O",
		click: () => {
			openDirectory();
		}
	}),
	//////////////////////////////////////////////////////////////
	viewAll: new MenuItem({
		label: "View &all tests",
		accelerator: "CmdOrCtrl+1",
		type: "radio",
		checked: true,
		click: () => onFilterMenuChanged(null),
	}),
	viewPassed: new MenuItem({
		label: "View &passed tests",
		accelerator: "CmdOrCtrl+2",
		type: "radio",
		click: () => onFilterMenuChanged("Passed"),
	}),
	viewFailed: new MenuItem({
		label: "View &failed tests",
		accelerator: "CmdOrCtrl+3",
		type: "radio",
		click: () => onFilterMenuChanged("Failed"),
	}),
	viewSkipped: new MenuItem({
		label: "View &skipped tests",
		accelerator: "CmdOrCtrl+4",
		type: "radio",
		click: () => onFilterMenuChanged("Skipped"),
	}),
	//////////////////////////////////////////////////////////////
	testsRunAll: new MenuItem({
		label: "Run all tests",
		accelerator: "F5",
		enabled: false,
		click: () => {
			runTests(selectedDir);
		}
	}),
	testsRunVisible: new MenuItem({
		label: "Run visible tests only",
		accelerator: "F6",
		enabled: false,
		click: () => {
			dialog.showErrorBox("Not implemented", "Not implemented");
		}
	}),
	testsStop: new MenuItem({
		label: "Stop running tests",
		enabled: false,
		accelerator: "Esc",
		click: () => {
			backgroundWorker.webContents.send("request-stop");
		}
	}),
};


app.on("ready", initMainWindow);

function initMainWindow() {

	initMainMenu();

	backgroundWorker = new BrowserWindow({show: DEV_MODE, closable: false});
	backgroundWorker.loadURL(`file://${__dirname}/ui/backgroundTestRunnerWorker.html`);

	mainWindow = new BrowserWindow({
		width: 1100,
		height: 700,
		// minWidth: 750,
		// minHeight: 350,
		title: "Litmus",
		backgroundColor: "#6F719D", // TODO factor colour from SASS/CSS somehow?
		show: true,
		// webPreferences: {
		// 	devTools: DEV_MODE,
		// 	scrollBounce: true,
		// }

		icon: nativeImage.createFromPath(Path.resolve(__dirname, "res", "icons", "48x48.png")),
		//titleBarStyle: "", // depend if macOS?
	});

	// TODO these files will be packaged nicely somewhere else
	mainWindow.loadURL(`file://${__dirname}/ui/index.html`);

	// TODO icon

	// TODO two finger scrolling v. unrepsonsive (Windows 10 / precision touchpad)
	// https://github.com/electron/electron/issues/8960 it"s a bug. resize window fixes it

	mainWindow.on("closed", () => {
		// TODO are both these handlers necessary?
		// MainWindow is non-null for the entire duration of the application
		// It's only upon closing that we null it, hence force-casting here to avoid type assertions everywhere else
		//(mainWindow as any) = null;
		app.exit();
	});

	// app.on("window-all-closed", () => {
	// 	if (process.platform !== "darwin") {
	// 		// macOS
	// 		app.quit();
	// 	}
	// });

	if (DEV_MODE) {
		mainWindow.webContents.openDevTools();
		backgroundWorker.webContents.openDevTools();
	}

	KbShortcuts.register("CmdOrCtrl+F", () => mainWindow.webContents.send("focusSearchBox"));
	KbShortcuts.register("F3", () => mainWindow.webContents.send("focusSearchBox"));
}

/** Also sets-up application keyboard shortcuts */
function initMainMenu() {
	const menuBar = new Menu();

	menuBar.append(new MenuItem({
		label: "&Litmus",
		submenu: [
			{
				label: "About Litmus",
				role: "about"
			},
			{
				type: "separator",
			},
			{
				role: "services",
			},
			{
				type: "separator",
			},
			{
				role: "hide",
			},
			{
				role: "hideothers",
			},
			{
				type: "separator",
			},
			{
				role: "quit"
			},
		]
	}));

	const fileMenuContents = new Menu();
	fileMenuContents.append(menus.fileOpenFolder);
	menuBar.append(new MenuItem({
		label: "&File",
		submenu: fileMenuContents,
	}));

	menuBar.append(new MenuItem({
		label: "&Edit",
		role: "editMenu",
	}));

	const viewMenuContents = new Menu();
	viewMenuContents.append(menus.viewAll);
	viewMenuContents.append(menus.viewPassed);
	viewMenuContents.append(menus.viewFailed);
	viewMenuContents.append(menus.viewSkipped);
	viewMenuContents.append(new MenuItem({
		type: "separator",
	}));
	viewMenuContents.append(new MenuItem({
		label: "Test &results",
		type: "radio",
		checked: true,
	}));
	viewMenuContents.append(new MenuItem({
		label: "Test &coverage",
		type: "radio",
		enabled: false,
	}));
	viewMenuContents.append(new MenuItem({
		type: "separator",
	}));
	viewMenuContents.append(new MenuItem({
		label: "Zoom In",
		accelerator: "CmdOrCtrl+Shift+Plus",						// TODO bug in Electron makes this appear as Ctrl+Shift+=
		click: () => {
			mainWindow.webContents.getZoomFactor(f => {
				mainWindow.webContents.setZoomFactor(f + 0.1);
			});
		},
	}));
	viewMenuContents.append(new MenuItem({
		label: "Zoom Out",
		accelerator: "CmdOrCtrl+Shift+-",
		click: () => {
			mainWindow.webContents.getZoomFactor(f => {
				let newZoomFactor = f - 0.1;
				newZoomFactor = newZoomFactor <= 0 ? f : newZoomFactor;
				mainWindow.webContents.setZoomFactor(newZoomFactor);
			});
		},
	}));
	viewMenuContents.append(new MenuItem({
		type: "separator",
	}));
	if (DEV_MODE) {
		viewMenuContents.append(new MenuItem({
			label: "Developer tools",
			accelerator: "F12",
			click: () => {
				mainWindow.webContents.toggleDevTools();
				backgroundWorker.webContents.toggleDevTools();
			}
		}));
	}
	viewMenuContents.append(new MenuItem({
		type: "separator",
	}));
	viewMenuContents.append(new MenuItem({
		label: "Full screen",
		accelerator: "F11",
		type: "checkbox",
		click: () => {
			mainWindow.setFullScreen(!mainWindow.isFullScreen());
		},
	}));

	menuBar.append(new MenuItem({
		label: "&View",
		submenu: viewMenuContents,
	}));

	const testMenuContents = new Menu();
	testMenuContents.append(menus.testsRunAll);
	testMenuContents.append(menus.testsRunVisible);
	testMenuContents.append(new MenuItem({
		type: "separator",
	}));
	testMenuContents.append(menus.testsStop);
	menuBar.append(new MenuItem({
		label: "&Test",
		submenu: testMenuContents,
	}));


	menuBar.append(new MenuItem({
		label: "&Window",
		role: "windowMenu"
	}));

	menuBar.append(new MenuItem({
		label: "&Help",
		submenu: [
			{
				label: "Online documentation",
				accelerator: "F1",
				click: () => shell.openExternal("https://litmus-js.app")
			}
		]
	}));

	// TODO On Mac set the menu - macOS requires it anyway.
	// TODO Win/Lin, Litmus is simple enough there's no need for a menu. Instead set null -> But set the KB shortcuts instead
	Menu.setApplicationMenu(menuBar);
}

ipcMain.on("request-open-directory", (e: Event, testrunJson: string) => {
	openDirectory();
});

ipcMain.on("open.disabled", (e: Event, disabled: boolean) => {
	menus.fileOpenFolder.enabled = !disabled;
});

ipcMain.on("runAll.disabled", (e: Event, disabled: boolean) => {
	menus.testsRunAll.enabled = !disabled;
});

ipcMain.on("runVisible.disabled", (e: Event, disabled: boolean) => {
	menus.testsRunVisible.enabled = !disabled;
});

ipcMain.on("stop.disabled", (e: Event, disabled: boolean) => {
	menus.testsStop.enabled = !disabled;
});

function openDirectory(): void {
	dialog.showOpenDialog(
		mainWindow,
		{
			properties: [ "openDirectory" ]
		},
		(s: string[]) => {
			if (s) {
				selectedDir = new Directory(s[0]);
				runTests(selectedDir);
			}
		});
}

ipcMain.on("request-runTests", () => {
	runTests(selectedDir);
});


// TODO not necessary to pass the dir in everywhere. It's only ever taken from one place
// but I like the explicitness about what parameters we're dealing with, rather than spaghetti globals
function runTests(dir: Directory | null): void {

	if (!dir) {
		// TODO In the ideal world, the UI doesn't allow this at all
		// TODO But that makes the UI stateful, and don't want to deal with that at this point
		return;
	}

	mainWindow.setTitle(`${dir.name} - Litmus`);

	// TODO maybe can get rid of the de-caching issue by always restarting the child process/BrowserWindow
	// TODO Investigate requireTaskPool
	mainWindow.webContents.send("testrun-rpc-start");
	backgroundWorker.webContents.send("testrun-rpc-start", dir.fullPath);
}

function onFilterMenuChanged(selectedFilter: TestStatus | null): void {
	mainWindow.webContents.send("menu-filter-changed", selectedFilter);
}


ipcMain.on("setProgressBar", (e: Event, progress: number, progbarState: Electron.ProgressBarOptions) => {
	mainWindow.setProgressBar(progress, progbarState);
});

const failedTaskbarOverlay = nativeImage.createFromPath(Path.resolve(__dirname, "res", "failBadge_taskbar.png"));
const passedTaskbarOverlay = nativeImage.createFromPath(Path.resolve(__dirname, "res", "passBadge_taskbar.png"));

// TODO ICKY string. But multiple serialsiation roundtrips going on here
// to communciate from a hidden processing window to the main window
ipcMain.on("update-test-results", (e: Event, testrunJson: string) => {

	// TODO to avoid lots of parsing and serialisation on large test runs - ship off to the UI only the latest test run??
	const failed = (<any>testrunJson).IndividualTestResults.some((r: any) => r.Result === "Failed");

	const overlayIcon = failed ? failedTaskbarOverlay : passedTaskbarOverlay;
	const caption = `Tests ${failed ? "failed" : "passed"}`;

	mainWindow.setOverlayIcon(overlayIcon, caption);

	mainWindow.webContents.send("update-test-results", testrunJson); // TODO not sync - out of order messages?
});

ipcMain.on("trampoline", (_e: Event, messageName: string, ...args: any[]) => {
	mainWindow.webContents.send(messageName, ...args);
});

ipcMain.on("set-menu-filter-checkbox", (e: Event, selectedFilter: TestStatus | null) => {

	let menuItem: MenuItem;
	switch (selectedFilter) {
		case "Passed":
			menuItem = menus.viewPassed;
			break;
		case "Failed":
			menuItem = menus.viewFailed;
			break;
		case "Skipped":
			menuItem = menus.viewSkipped;
			break;
		default:
			menuItem = menus.viewAll;
			break;
	}

	if (menuItem.checked === false) {
		menuItem.checked = true;
	}
});

// function flashTaskbarIcon() {
//  app.dock.bounce();
// 	mainWindow.flashFrame(true);
// 	setTimeout(() => {
// 		mainWindow.flashFrame(false);
// 	}, 400);
// }