import { ipcRenderer, remote } from 'electron';
import { LitmusContext } from '../../ts/types/LitmusContext';
import { Directory } from '../../../lib/LibFs/Fs';
import { RunnerFactory } from '../../ts/logic/RunnerFactory';
import { MochaTestAdapter } from '../../ts/mocha/MochaTestAdapter';
import { TestsNotDiscoveredException } from '../../ts/exceptions/TestsNotDiscoveredException';
import { ITestRunner } from '../../ts/logic/ITestRunner';
import { parentWindow } from './parentWindow.module';


const runnerFactory = new RunnerFactory([new MochaTestAdapter()]);

let runner: ITestRunner | undefined;

// TOOD this is not part of the UI
// It's just in this folder as its run by an invisible browser window
// (to not block the main Electron process, which causes problems)

ipcRenderer.on("testrun-rpc-start", (e: Electron.Event, dir: string) => {
	runTests(dir);
});

ipcRenderer.on("request-stop", (e: Electron.Event) => {
	if (runner)
	{
		runner.abort();
		runner = undefined;
	}
});


function runTests(directory: string, ctxt?: LitmusContext) {
	const dir = new Directory(directory);

	try {
		if (runner) {
			console.warn("Attempted to run tests before the current run was stopped. Discarding");
			return;
		}

		let numTestsExpected: number = 0;
		let numTestsPassed: number = 0;
		let numTestsFailed: number = 0;
		let numTestsSkipped: number = 0;

		runner = runnerFactory.build(dir);

		runner.run()
			.subscribe(tr => {

				switch (tr.type) {
					case "TestRunStarted": {
						numTestsExpected = tr.numTests;
						numTestsPassed = 0;
						numTestsFailed = 0;
						numTestsSkipped = 0;
						break;
					}
					case "IndividualTestFinished": {
						if (tr.TestResult.Result === "Passed") numTestsPassed++;
						if (tr.TestResult.Result === "Failed") numTestsFailed++;
						if (tr.TestResult.Result === "Skipped") numTestsSkipped++;

						// TODO - now my taskbar "failure badge" is only looking at tests in THE LAST RUN
						// TODO - really if *ANY* on screen are failing........ Leave that logic to the UI? As it holds all the state?
						// TODO - this gets hairy if a test fails. we fix and rename it. but because it's renamed, we won't be able to update it in-memory without a full re-run 😐
						// TODO - the progression info *STILL* isnt passed to UI - its "statusDisplay" has to yet again re-build this state
						let numTestsRun = numTestsPassed + numTestsFailed + numTestsSkipped;
						let progress = numTestsRun / numTestsExpected;
						progress = progress < 0 || progress >= 1 ? -1 : progress; // TODO do I want the progress to disappear immediately?

						const failed = numTestsFailed > 0;

						ipcRenderer.send("setProgressBar", progress, failed);
						break;
					}
					default : {
						// TODO
						// throw "handle this, preferrably at compile-time please?";
					}
				}

				// In all cases, forward the event onto the UI for presentation
				ipcRenderer.send("update-test-results", tr);

				// TODO passing round JSON string is gross. But it's going over two process boundaries
				// backgroundWindow -> main -> foregroundWindow
				// TODO merge both above RPCs into one call?

				// if (progress < 0 && progbarState === "error") {
				// 	flashTaskbarIcon();
				// }
			},
			() => {
				runner = undefined;
				trampoline("test-run-finished");
			}
		);
	}
	catch (ex) {
		// TODO the remote makes it much more straightforward with none of the IPC noise
		// But makes testing those sid effects harder to test than emitted events
		// (which themselves go via an IPC, so would have to be wrapped in a facade anyway)
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

ipcRenderer.send("worker-bootstrapped");