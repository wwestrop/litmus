import { app, BrowserWindow, Menu, nativeImage, ipcMain } from "electron";
import * as Path from 'path';
import { TestStatus } from "./ts/types/TestStatus";
import * as KbShortcuts from 'electron-localshortcut';
import { DEV_MODE } from './ts/Consts';
import { LitmusRunnerEvent } from "./ts/types/LitmusRunnerEvent";
import { Directory } from '../lib/LibFs/Fs';
import { MruManager } from './ts/MruManager';
import { MenuBuilder } from "./MenuBuilder";

// TODO factor out the ipcmain thing as well so that's injected?
namespace BootTracker { // TODO module instead of namespace?
	let processesBootstrapped = 0;
	export let onBooted = () => {};

	ipcMain.on("worker-bootstrapped", (_e: Electron.Event) => {
		processesBootstrapped++;
		if (processesBootstrapped === 2) {
			onBooted();
		}
	});

	ipcMain.on("renderer-bootstrapped", (_e: Electron.Event) => {
		processesBootstrapped++;
		if (processesBootstrapped === 2) {
			onBooted();
		}
	});
}
BootTracker.onBooted = applicationBooted;

const menuManager = new MenuBuilder(new MruManager());

// TODO export, urgh, everything has to have reference to everything else. Even the logic of building the menu. Should we poke in these as event handlers, rather than spaghetti-linking all the functions in all the different files?
// TODO Or should we encapsulate, e.g. `mainWindow` in it's own (static) module (=> single-window-app) and expose access to the IPC via the interface exposed there?
// TODO since a lot of what this index.ts file is doing is sending messages back and forth
// TODO can multiple places receive an IPC event (even the same one?). Then the menu class can just listen when files are opened and automatically change itself
export let mainWindow: BrowserWindow;

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
 	const menuBar = menuManager.initMainMenu();

 	// TODO On Mac set the menu - macOS requires it anyway.
 	// TODO Win/Lin, Litmus is simple enough there's no need for a menu. Instead set null -> But set the KB shortcuts instead
 	Menu.setApplicationMenu(menuBar);
}

ipcMain.on("open.disabled", (e: Electron.Event, disabled: boolean) => {
	menuManager.setApplicationIsBusy(disabled);
});

ipcMain.on("runAll.disabled", (e: Electron.Event, disabled: boolean) => {
	menuManager.setApplicationIsBusy(disabled);
});

ipcMain.on("runVisible.disabled", (e: Electron.Event, disabled: boolean) => {
	menuManager.setApplicationIsBusy(disabled);
});

ipcMain.on("stop.disabled", (e: Electron.Event, disabled: boolean) => {
	menuManager.setApplicationIsBusy(disabled);
});

export function toggleDevTools() {
	mainWindow.webContents.toggleDevTools();
}

export function openDirectory() {
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

export function runTests() {
	mainWindow.webContents.send("request-runTests");
}

export function stopTests() {
	mainWindow.webContents.send("request-stop");
}

export function onFilterMenuChanged(selectedFilter: TestStatus | null): void {
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
	menuManager.setSelectedTestFilter(selectedFilter);
});

function applicationBooted() {

	// If requested to open a directory as part of bootup, pass that information to the renderer
	if (!app.isPackaged) {
		const requestedFolderArgumentIndex = process.argv.findIndex(a => a === "bin/src");
		if (requestedFolderArgumentIndex !== -1) {
			const requestedFolder = process.argv[requestedFolderArgumentIndex + 1];
			if (requestedFolder) {
				mainWindow.webContents.send("openSpecificDirectory", new Directory(requestedFolder));
			}
		}
	}
	else {
		const requestedFolder = process.argv[1]; // TODO is there a better way than sniffing out positional parameters
		if (requestedFolder) {
			mainWindow.webContents.send("openSpecificDirectory", new Directory(requestedFolder));
		}
	}
}


// function flashTaskbarIcon() {
//  app.dock.bounce();
// 	mainWindow.flashFrame(true);
// 	setTimeout(() => {
// 		mainWindow.flashFrame(false);
// 	}, 400);
// }
