import { app, BrowserWindow, Menu, MenuItem, dialog, nativeImage, ipcRenderer, ipcMain } from "electron";
import { File, Directory } from './lib/LibFs/Fs';
import { RunnerFactory } from './ts/logic/RunnerFactory';
import { MochaTestAdapter } from "./ts/mocha/MochaTestAdapter";
import { TestsNotDiscoveredException } from './ts/exceptions/TestsNotDiscoveredException';
import { prototype } from "events";

/*export*/ let mainWindow: BrowserWindow; // so other processes can poke at it (eg when runner has sth to report, poke in a message via its webcontents, set its progressbar from the main thread - shoulg that win be responsible for setting its own progress? probably. would invilve an extra RPC call though)
let backgroundWorker: BrowserWindow;


app.on("ready", initMainWindow);

function initMainWindow() {

	initMainMenu();

	backgroundWorker = new BrowserWindow({show: false});
	backgroundWorker.loadURL(`file://${__dirname}/ui/backgroundTestRunnerWorker.html`);

	mainWindow = new BrowserWindow({
		width: 1100,
		height: 700,
		// minWidth: 750,
		// minHeight: 350,
		title: "Litmus",
		backgroundColor: "#6F719D", // TODO factor colour from SASS/CSS somehow?
		show: true,
		//icon: "",
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
}

/** Also sets-up application keyboard shortcuts */
function initMainMenu() {
	const menu = new Menu();

	menu.append(new MenuItem({
		label: "DevTools",
		accelerator: "F12",
		click: () => {
			mainWindow.webContents.toggleDevTools();
			backgroundWorker.webContents.toggleDevTools();
		}
	}));
	menu.append(new MenuItem({
		label: "Search",
		accelerator: "F2",
		click: () => {
			// console.log("Search");
			// const fname = `file://${__dirname}/ui/taskbarBadge-pass.png`;
			// console.log(fname);

			// /** TODO only works in render process */
			// mainWindow.setOverlayIcon(
			// 	nativeImage.createFromPath("file://C:\\Users\\Will\\Documents\\Git\\Litmus\\bin\\src\\ui\\taskbarBadge-pass.png"),
			// 	"Passed");
		}
	}));
	menu.append(new MenuItem({
		label: "Re-run tests",
		accelerator: "F5",
		click: () => {
			console.log("re-run tests");
			mainWindow.webContents.send("dev-reset"); // TODO
		}
	}));
	menu.append(new MenuItem({
		label: "Open",
		accelerator: "CmdOrCtrl+O",
		click: () => {
			console.log("open a project directory");

			dialog.showOpenDialog(
				mainWindow,
				{
					properties: [ "openDirectory" ]
				},
				(s: string[]) => {
					if (s) {
						const dir = new Directory(s[0]);
						mainWindow.setTitle(`${dir.name} - Litmus`);

						// TODO maybe can get rid of the de-caching issue by always restarting the child process/BrowserWindow
						// TODO Investigate requireTaskPool
						backgroundWorker.webContents.send("testrun-rpc-start", s[0]);
					}
				});
		}
	}));

	Menu.setApplicationMenu(menu);
}

ipcMain.on("setProgressBar", (e: Event, progress: number, progbarState: Electron.ProgressBarOptions) => {
	mainWindow.setProgressBar(progress, progbarState);
});

// TODO ICKY string. But multiple serialsiation roundtrips going on here
// to communciate from a hidden processing window to the main window
ipcMain.on("update-test-results", (e: Event, testrunJson: string) => {
	mainWindow.webContents.send("update-test-results", testrunJson); // TODO not sync - out of order messages?
});

// function flashTaskbarIcon() {
// 	mainWindow.flashFrame(true);
// 	setTimeout(() => {
// 		mainWindow.flashFrame(false);
// 	}, 400);
// }