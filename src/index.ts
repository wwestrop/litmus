import { app, BrowserWindow, Menu, MenuItem, dialog, nativeImage, ipcRenderer, ipcMain } from "electron";
import { File, Directory } from './lib/LibFs/Fs';
import { RunnerFactory } from './ts/logic/RunnerFactory';
import { MochaTestAdapter } from "./ts/mocha/MochaTestAdapter";
import { TestsNotDiscoveredException } from './ts/exceptions/TestsNotDiscoveredException';
import { prototype } from "events";

let mainWindow: BrowserWindow;
let backgroundWorker: BrowserWindow;


app.on("ready", initMainWindow);

function initMainWindow() {

	initMainMenu();

	backgroundWorker = new BrowserWindow({show: false});

	mainWindow = new BrowserWindow({
		width: 1100,
		height: 700,
		// minWidth: 750,
		// minHeight: 350,
		title: "Litmus",
		backgroundColor: "#6F719D", // TODO factor colour from SASS/CSS somehow?
		//show: false,
		//icon: "",
		//titleBarStyle: "", // depend if macOS?
	});

	// TODO these files will be packaged nicely somewhere else
	mainWindow.loadURL(`file://${__dirname}/ui/index.html`);

	//mainWindow.setProgressBar(0.67);

	// TODO icon
	// TODO background colour

	// TODO two finger scrolling v. unrepsonsive (Windows 10 / precision touchpad)
	// https://github.com/electron/electron/issues/8960 it"s a bug. resize window fixes it

	mainWindow.on("closed", () => {
		// TODO are both these handlers necessary?
		// MainWindow is non-null for the entire duration of the application
		// It's only upon closing that we null it, hence force-casting here to avoid type assertions everywhere else
		//(mainWindow as any) = null;
		app.quit();
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
						const appTitle = `${dir.name} - Litmus`;
						console.log(`Selected '${appTitle}'`);

						// TODO factor out
						// TODO push to another BrowserWindow ( = new process) as the main Electon process is a bottleneck for the renderer
						// TODO maybe can get rid of the de-caching issue by always restarting the child process
						try {
							const runnerFactory = new RunnerFactory([new MochaTestAdapter()]); // TODO init only once
							const runner = runnerFactory.build(dir);

							runner.run()
								.subscribe(tr => {
									console.log(`${tr.IndividualTestResults.length} @ ${tr.Duration}s (${tr.Progress} %)`);
									let progress = tr.Progress / 100;
									progress = progress < 0 || progress >= 1 ? -1 : progress; // TODO do I want the progress to disappear immediately?

									const progbarState = tr.NumFailed === 0 ? "normal": "error";

									mainWindow.setProgressBar(progress, {mode: progbarState});

									// ipcRenderer.send("update-test-results", tr);
									// ipcMain.
									console.log(`>${new Date().getTime()}`);
									mainWindow.webContents.send("update-test-results", tr.toJSON()); // TODO not sync - out of order messages?

									// if (progress < 0 && progbarState === "error") {
									// 	flashTaskbarIcon();
									// }
								});
						}
						catch (ex) {
							if (ex instanceof TestsNotDiscoveredException) {
								dialog.showErrorBox(
									"Couldn't find any tests",
									`We couldn't find any tests in "${ex.directory.name}", or we don't have support for your testing framework yet.`);
							}
							else {
								throw ex;
							}
						}
					}
				});
		}
	}));

	Menu.setApplicationMenu(menu);
}

// function flashTaskbarIcon() {
// 	mainWindow.flashFrame(true);
// 	setTimeout(() => {
// 		mainWindow.flashFrame(false);
// 	}, 400);
// }