import { app, Menu, ipcMain } from "electron";
import { TestStatus } from "./ts/types/TestStatus";;
import { Directory } from '../lib/LibFs/Fs';
import { MruManager } from './ts/MruManager';
import { MenuBuilder } from "./MenuBuilder";
import { ApplicationStatus } from './ui/script/applicationStatus';
import { LitmusMainWindow } from "./LitmusMainWindow";
import * as KbShortcuts from 'electron-localshortcut';
import { LitmusRunnerEvent } from './ts/types/LitmusRunnerEvent';

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

app.on("ready", initMainWindow);

function initMainWindow() {

	initMainMenu();

	// If this isn't done before instantiating a BrowserWindow, it never works thereafter
	new MruManager().getMru(); // it auto-populates now

	LitmusMainWindow.init();

	LitmusMainWindow.on("closed", () => {
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

	KbShortcuts.register("CmdOrCtrl+F", () => LitmusMainWindow.focusSearchBox());
	KbShortcuts.register("F3", () => LitmusMainWindow.focusSearchBox());

	registerIpcHandlers();
}

function registerIpcHandlers() {

	ipcMain.on("setProgressBar", (_e: Electron.Event, progress: number, failed: boolean ) => {
		LitmusMainWindow.setProgressBar(progress, failed);
	});

	ipcMain.on("update-test-results", (_e: Event, lastEvent: LitmusRunnerEvent) => {
		// TODO - this now serves only as a trampoline too
		// updating the taskbar overlay subsumed with setting the taskbar progress

		// TODO to avoid lots of parsing and serialisation on large test runs - ship off to the UI only the latest test run??
		LitmusMainWindow.updateTestResults(lastEvent);
	});


	ipcMain.on("trampoline", (_e: Electron.Event, messageName: string, ...args: any[]) => {
		LitmusMainWindow.trampoline(messageName, ...args);
	});
}

/** Also sets-up application keyboard shortcuts */
function initMainMenu() {
	const menuBar = menuManager.initMainMenu();

	// TODO On Mac set the menu - macOS requires it anyway.
	// TODO Win/Lin, Litmus is simple enough there's no need for a menu. Instead set null -> But set the KB shortcuts instead
	Menu.setApplicationMenu(menuBar);
}

ipcMain.on("applicationStatusChanged", (e: Electron.Event, applicationStatus: ApplicationStatus) => {
	menuManager.setApplicationStatus(applicationStatus);
});

ipcMain.on("directoryOpened", (_e: Electron.Event, selectedDir: Directory) => {
	// Persist MRU
	new MruManager().addMruItem(selectedDir);

	// Jumplist
	//new JumplistBuilder().addMruItem(selectedDir);

	// Menu (needs to be fully re-initialised as we can't remove/rearrange the MRU items in-place)
	Menu.setApplicationMenu(menuManager.initMainMenu());
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
				LitmusMainWindow.openSpecificDirectory(requestedFolder);
			}
		}
	}
	else {
		const requestedFolder = process.argv[1]; // TODO is there a better way than sniffing out positional parameters
		if (requestedFolder) {
			LitmusMainWindow.openSpecificDirectory(requestedFolder);
		}
	}
}