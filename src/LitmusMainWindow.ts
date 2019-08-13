import { TestStatus } from "./ts/types/TestStatus";
import { DEV_MODE } from "./ts/Consts";
import { BrowserWindow, nativeImage } from "electron";
import * as Path from 'path';
import { Directory } from '../lib/LibFs/Fs';
import { LitmusRunnerEvent } from './ts/types/LitmusRunnerEvent';


/** Wraps the main `BrowserWindow` and exposes an API for managing and interacting with it */
export namespace LitmusMainWindow {

	let onClosedListener = () => {};

	let mainWindow: BrowserWindow;

	export function init() {

		mainWindow = new BrowserWindow({
			width: 1100,
			height: 700,
			title: "Litmus",
			backgroundColor: "#6F719D", // TODO factor colour from SASS/CSS somehow?
			show: true,
			webPreferences: {
				//scrollBounce: true,
				nodeIntegration: true,
			},

			icon: nativeImage.createFromPath(Path.resolve(__dirname, "res", "icons", "48x48.png")),
			//titleBarStyle: "", // depend if macOS?
		});

		// TODO these files will be packaged nicely somewhere else
		mainWindow.loadURL(`file://${__dirname}/ui/index.html`);

		// TODO two finger scrolling v. unrepsonsive (Windows 10 / precision touchpad)
		// https://github.com/electron/electron/issues/8960 it"s a bug. resize window fixes it

		mainWindow.on("closed", () => {
			onClosedListener();
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
	}

	export function on(event: "closed", listener: () => void): void {
		onClosedListener = listener;
	}

	export function openDirectory(): void {
		mainWindow.webContents.send("request-openDirectory");
	}

	export function openSpecificDirectory(requestedFolder: string): void {
		mainWindow.webContents.send("openSpecificDirectory", new Directory(requestedFolder));
	}

	export function runTests(): void {
		mainWindow.webContents.send("request-runTests");
	}

	export function stopTests(): void {
		mainWindow.webContents.send("request-stop");
	}

	export function onFilterMenuChanged(selectedFilter: TestStatus | null): void {
		mainWindow.webContents.send("menu-filter-changed", selectedFilter);
	}

	export function toggleDevTools(): void {
		mainWindow.webContents.toggleDevTools();
	}

	export function zoomIn(): void {
		mainWindow.webContents.setZoomFactor(mainWindow.webContents.getZoomFactor() + 0.1);
	}

	export function zoomOut(): void {
		mainWindow.webContents.setZoomFactor(mainWindow.webContents.getZoomFactor() - 0.1);
	}

	export function toggleFullScreen(): void {
		mainWindow.setFullScreen(!mainWindow.isFullScreen());
	}

	export function focusSearchBox(): void {
		mainWindow.webContents.send("focusSearchBox")
	}

	export function setProgressBar(progress: number, failed: boolean): void {
		const failedTaskbarOverlay = nativeImage.createFromPath(Path.resolve(__dirname, "res", "failBadge_taskbar.png"));
		const passedTaskbarOverlay = nativeImage.createFromPath(Path.resolve(__dirname, "res", "passBadge_taskbar.png"));

		const progbarState = failed ? "error" : "normal";

		const overlayIcon = failed ? failedTaskbarOverlay : passedTaskbarOverlay;
		const caption = `Tests ${failed ? "failed" : "passed"}`;

		mainWindow.setOverlayIcon(overlayIcon, caption);

		mainWindow.setProgressBar(progress, {mode: progbarState});
	}

	export function updateTestResults(lastEvent: LitmusRunnerEvent): void {
		mainWindow.webContents.send("update-test-results", lastEvent); // TODO not sync - out of order messages?
	}

	export function trampoline(messageName: string, ...args: any[]): void {
		mainWindow.webContents.send(messageName, ...args);
	}
}
