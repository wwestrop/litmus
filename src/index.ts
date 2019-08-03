import { app, BrowserWindow, Menu, MenuItem, dialog, nativeImage, ipcMain, shell, ipcRenderer } from "electron";
import * as Path from 'path';
import { TestStatus } from "./ts/types/TestStatus";
import * as KbShortcuts from 'electron-localshortcut';
import { DEV_MODE } from './ts/Consts';
import { LitmusRunnerEvent } from "./ts/types/LitmusRunnerEvent";
import { Directory } from '../lib/LibFs/Fs';
import { MruManager } from "./ts/MruManager";

let mainWindow: BrowserWindow;

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
			runTests();
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
			stopTests();
		}
	}),
};


app.on("ready", initMainWindow);

function initMainWindow() {

	initMainMenu();

	// If this isn't done before instantiating a BrowserWindow, it never works thereafter
	new MruManager().getMru(); // it auto-populates now

	mainWindow = new BrowserWindow({
		width: 1100,
		height: 700,
		// minWidth: 750,
		// minHeight: 350,
		title: "Litmus",
		backgroundColor: "#6F719D", // TODO factor colour from SASS/CSS somehow?
		show: true,
		webPreferences: {
			//devTools: DEV_MODE,
			//scrollBounce: true,
			nodeIntegration: true,
		},

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
	fileMenuContents.append(new MenuItem({
		type: "separator",
	}));
	appendMru();
	menuBar.append(new MenuItem({
		label: "&File",
		submenu: fileMenuContents,
	}));

	function appendMru(): void {
		const mruList = new MruManager().getMru();
		if (mruList.length === 0) {
			fileMenuContents.append(new MenuItem({
				enabled: false,
				label: "(Recently opened projects)",
			}));
		}
		else {
			const mruMenuItems = buildMruMenu(mruList);
			for (let i = 0; i < mruMenuItems.length; i++) {
				fileMenuContents.append(mruMenuItems[i]);
			}
		}
	}

	function buildMruMenu(mruList: Directory[]): MenuItem[] {
		const mruMenuItems: MenuItem[] = [];
		for (let i = 1; i <= mruList.length; i++) {
			const mru = mruList[i-1];
			mruMenuItems.push(new MenuItem({
				label: `&${i} ${mru.name}`,
				click: () => { mainWindow.webContents.send("openSpecificDirectory", new Directory(mru.fullPath)); },
				// TODO MRU list must be inactive while tests are running AARRGGGHHHH, UI is so horrible 😱😱😱😱😱😱😱😱
			}));
		}

		return mruMenuItems;
	}

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
				toggleDevTools();
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

ipcMain.on("open.disabled", (e: Electron.Event, disabled: boolean) => {
	menus.fileOpenFolder.enabled = !disabled;
});

ipcMain.on("runAll.disabled", (e: Electron.Event, disabled: boolean) => {
	menus.testsRunAll.enabled = !disabled;
});

ipcMain.on("runVisible.disabled", (e: Electron.Event, disabled: boolean) => {
	menus.testsRunVisible.enabled = !disabled;
});

ipcMain.on("stop.disabled", (e: Electron.Event, disabled: boolean) => {
	menus.testsStop.enabled = !disabled;
});

function toggleDevTools() {
	mainWindow.webContents.toggleDevTools();
}

function openDirectory() {
	mainWindow.webContents.send("request-openDirectory");
}

ipcMain.on("directoryOpened", (_e: Electron.Event, selectedDir: Directory) => {
	// Persist MRU
	new MruManager().addMruItem(selectedDir);

	// Jumplist
	//new JumplistBuilder().addMruItem(selectedDir);

	// Menu
	// const mru = new MruBuilder().getMru();
	//new JumplistBuilder().addMruItem(selectedDir);
});

function runTests() {
	mainWindow.webContents.send("request-runTests");
}

function stopTests() {
	mainWindow.webContents.send("request-stop");
}

function onFilterMenuChanged(selectedFilter: TestStatus | null): void {
	mainWindow.webContents.send("menu-filter-changed", selectedFilter);
}

ipcMain.on("setProgressBar", (_e: Electron.Event, progress: number, failed: boolean ) => {

	const failedTaskbarOverlay = nativeImage.createFromPath(Path.resolve(__dirname, "res", "failBadge_taskbar.png"));
	const passedTaskbarOverlay = nativeImage.createFromPath(Path.resolve(__dirname, "res", "passBadge_taskbar.png"));

	const progbarState = failed ? "error" : "normal";

	const overlayIcon = failed ? failedTaskbarOverlay : passedTaskbarOverlay;
	const caption = `Tests ${failed ? "failed" : "passed"}`;

	mainWindow.setOverlayIcon(overlayIcon, caption);

	mainWindow.setProgressBar(progress, {mode: progbarState});
});

ipcMain.on("update-test-results", (_e: Event, lastEvent: LitmusRunnerEvent) => {

	// TODO - this now serves only as a trampoline too
	// updating the taskbar overlay subsumed with setting the taskbar progress

	// TODO to avoid lots of parsing and serialisation on large test runs - ship off to the UI only the latest test run??

	mainWindow.webContents.send("update-test-results", lastEvent); // TODO not sync - out of order messages?
});


ipcMain.on("trampoline", (_e: Electron.Event, messageName: string, ...args: any[]) => {
	mainWindow.webContents.send(messageName, ...args);
});

ipcMain.on("set-menu-filter-checkbox", (_e: Electron.Event, selectedFilter: TestStatus | null) => {

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
