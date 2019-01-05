import { remote } from "electron";
import * as Path from 'path';
import { TestRun } from "../../ts/types/TestRun";


const currentWindow = remote.getCurrentWindow();

const failedTaskbarOverlay = remote.nativeImage.createFromPath(Path.resolve(__dirname, "../res", "failBadge_taskbar.png"));
const passedTaskbarOverlay = remote.nativeImage.createFromPath(Path.resolve(__dirname, "../res", "passBadge_taskbar.png"));


export function setTaskbarStatus(testRun: TestRun) {
	setTaskbarOverlay(testRun);
	setTaskbarProgress(testRun);
}

/** Adds a badge Litmus's taskbar icon indicating the overall success or failure of the given test run */
function setTaskbarOverlay(testRun: TestRun){
	// TODO ICKY string. But multiple serialsiation roundtrips going on here
	// to communciate from a hidden processing window to the main window

	// TODO to avoid lots of parsing and serialisation on large test runs - ship off to the UI only the latest test run??
	const failed = testRun.IndividualTestResults.some(r => r.Result === "Failed");

	const overlayIcon = failed ? failedTaskbarOverlay : passedTaskbarOverlay;
	const caption = `Tests ${failed ? "failed" : "passed"}`;

	currentWindow.setOverlayIcon(overlayIcon, caption);
}

function setTaskbarProgress(testRun: TestRun) {
	let progress = testRun.Progress / 100;
	progress = progress < 0 || progress >= 1 ? -1 : progress; // TODO do I want the progress to disappear immediately?

	const progbarState = testRun.NumFailed === 0 ? "normal": "error";

	currentWindow.setProgressBar(progress, {mode: progbarState});
}