import { ipcRenderer, remote } from 'electron';
import { LitmusContext } from '../../ts/types/LitmusContext';
import { Directory } from '../../../lib/LibFs/Fs';
import { RunnerFactory } from '../../ts/logic/RunnerFactory';
import { MochaTestAdapter } from '../../ts/mocha/MochaTestAdapter';
import { TestsNotDiscoveredException } from '../../ts/exceptions/TestsNotDiscoveredException';
import { parentWindow } from './parentWindow.module';


const runnerFactory = new RunnerFactory([new MochaTestAdapter()]);

// TOOD this is not part of the UI
// It's just in this folder as its run by an invisible browser window
// (to not block the main Electron process, which causes problems)

ipcRenderer.on("testrun-rpc-start", (e: Electron.Event, dir: string) => {
	runTests(dir);
});

ipcRenderer.on("request-stop", (e: Electron.Event) => {
});


function runTests(directory: string, ctxt?: LitmusContext) {
	const dir = new Directory(directory);

	try {
		const runner = runnerFactory.build(dir);

		runner.run()
			.subscribe(tr => {
				console.log(`${tr.IndividualTestResults.length} @ ${tr.Duration}s (${tr.Progress} %)`);
				let progress = tr.Progress / 100;
				progress = progress < 0 || progress >= 1 ? -1 : progress; // TODO do I want the progress to disappear immediately?

				const progbarState = tr.NumFailed === 0 ? "normal": "error";

				ipcRenderer.send("setProgressBar", progress, {mode: progbarState});

				console.log(`>${new Date().getTime()}`);
				ipcRenderer.send("update-test-results", tr.toJSON());
				// TODO passing round JSON string is gross. But it's going over two process boundaries
				// backgroundWindow -> main -> foregroundWindow
				// TODO merge both above RPCs into one call?

				// if (progress < 0 && progbarState === "error") {
				// 	flashTaskbarIcon();
				// }
			},
			() => {
				trampoline("test-run-finished");
			}
		);
	}
	catch (ex) {
		if (ex instanceof TestsNotDiscoveredException) {
			remote.dialog.showErrorBox(
				"Couldn't find any tests",
				`We couldn't find any tests in "${ex.directory.name}", or we don't have support for your testing framework yet.`);
		}
		else {
			console.error(ex);
			remote.dialog.showErrorBox(
				"Error",
				"An unhandled error occurred while running tests. See log for details. ");
			throw ex;
		}
	}
}

/** Bounces messages to the parent "UI" window via IPC */
function trampoline(messageName: string, ...args: any[]) {
	parentWindow.webContents.send(messageName, ...args);
}