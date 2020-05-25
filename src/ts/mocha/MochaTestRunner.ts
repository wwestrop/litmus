import { ITestRunner } from '../logic/ITestRunner';
import { LitmusContext } from '../types/LitmusContext';
import { TestCaseOutcome } from '../types/TestCaseOutcome';
import { TestCase } from '../types/TestCase';
import { Observer, Observable } from '../../../lib/LibObservable/Observable(T)';
import { Directory } from '../../../lib/LibFs/Fs';
import { TestStatus } from '../types/TestStatus';
import Module = require('module');
import Mocha = require('mocha');
import { TestFailureInfo } from '../types/TestFailureInfo';
import { IFileLocatorStrategy } from '../logic/common/IFileLocatorStrategy';
import { KeywordSamplingFileLocatorStrategy, MochaKeywords } from '../logic/common/KeywordSamplingFileLocatorStrategy';
import { LitmusRunnerEvent, IndividualTestFinished, TestRunStarted, IndividualTestStarted, TestRunFinished } from '../types/LitmusRunnerEvent';


export class MochaTestRunner implements ITestRunner {

	private readonly _fileLocatorStrategy: IFileLocatorStrategy = new KeywordSamplingFileLocatorStrategy(MochaKeywords);

	private mochaRunner?: Mocha.Runner;
	private currentRun: Observable<LitmusRunnerEvent>;

	constructor (private readonly _directory: Directory) {
	}

	public run(ctxt?: LitmusContext): Observable<LitmusRunnerEvent> {
		// TODO since replacing rxjs with my library - it doesn't do .share()
		if (!this.currentRun) {
			this.currentRun = new Observable<LitmusRunnerEvent>((observer: Observer<LitmusRunnerEvent>) => this.createObservable(observer));
		}

		return this.currentRun;
	}

	public preRun(): void {
		throw new Error('Not implemented yet.');
	}

	private createObservable(observer: Observer<LitmusRunnerEvent>): void {
		const mocha = new Mocha();

		const that = this;
		const jsFiles = this._directory.getFilesRecursive()
			.filter(f => f.name.fullName.toLowerCase().endsWith(".js"))  // TODO exclude node_modules ??????? Which means we have to do directory separators
			.filter(f => this._fileLocatorStrategy.isFileAcceptable(f)); // TODO cache files between runs and only re-check if it has changed
		jsFiles.forEach(f => {
			//this.uncache(f.fullPath);
			that.uncache(f.fullPath);
			mocha.addFile(f.fullPath);
		});

		//mocha.unloadFiles();

		this.mochaRunner = mocha.run((_failures: number) => {
			observer.next(new TestRunFinished());
			observer.complete();
		});
		const totalTests = this.mochaRunner.total;

		//Mocha.unloadFiles();

		this.mochaRunner.on('fail', (t: Mocha.Test | Mocha.Hook) => {
			if (t.type === 'hook' && t.originalTitle === '"before each" hook') {
				// TODO handle all the other types of hooks that could go wrong
				// TODO add something to the error message so it's clear that a hook is failing, not the test itself
				failDescendants(t.parent!, (t as any).err); // TODO the docs are wrong, `.error()` does not in fact get `err`
			}
		});

		let isFirst = true;
		this.mochaRunner.on('test', (t: Mocha.Test) => {
			if (isFirst) {
				isFirst = false;

				// Inform Litmus UI of the parameters it will be dealing with before delivering the test results
				const event = new TestRunStarted(["Suite", "File"], totalTests);
				observer.next(event);
			}

			announceNewTest(t);
		});

		this.mochaRunner.on('test end', (t: Mocha.Test) => {
			pushResult(t);
		});

		function pushResult(t: Mocha.Test) {
			const testDuration = t.duration || 0;
			const testStatus = that.getTestStatus(t);

			const testCase = buildTestCase(t);

			const failureInfo = that.getFailureInfo(t);

			const thisOutcome = new TestCaseOutcome(testCase, testStatus, testDuration, failureInfo);

			const event = new IndividualTestFinished(thisOutcome);
			observer.next(event);
		}

		function buildTestCase(t: Mocha.Test): TestCase {
			const testCase = new TestCase();
			testCase.displayName = t.title;
			const hierarchy = that.constructHierarchy(t);
			const fileName = t.file || "";

			testCase.groupingKeys["Suite"] = hierarchy;
			testCase.groupingKeys["File"] = [fileName];

			return testCase;
		}

		/** On failure of a suite hook, pushes that failure down onto the child tests too, so that
		 *  they show as failed on the UI (with the reason) */
		function failDescendants(suite: Mocha.Suite, err: Error) {
			for (const t of suite.tests) {
				const updatedTest = t;

				t.state = "failed";
				t.err = err;

				announceNewTest(updatedTest);

				pushResult(updatedTest);
			}
			for (const s of suite.suites) {
				failDescendants(s, err);
			}
		}

		function announceNewTest(t: Mocha.Test): void {
			const testcase = buildTestCase(t);
			observer.next(new IndividualTestStarted(testcase));
		}
	}

	public abort(): void {
		if (this.mochaRunner) {
			this.mochaRunner.abort();
			this.mochaRunner = undefined;
		}
	}

	private uncache(filepath: string) {
		// https://github.com/mochajs/mocha/issues/3084
		// TODO may have to watch package.json in case any deps get updated and blat the cache entirely

		// TODO depending where this is run - node, browser via requireJs, browser via parcelJs - these things are or are not available

		if ((Module as any)._cache) {
			delete (Module as any)._cache[filepath];
		}
		else if (require && require.cache) {
			delete require.cache[filepath];
		}
		else {
			throw "Cannot uncache previously require'd JS modules. Mocha will not show the latest test state unless the process restarts"
		}
	}

	private getTestStatus(test: Mocha.Test): TestStatus {
		if (test.pending) {
			return "Skipped";
		}
		else if (test.state === "passed") {
			return "Passed";
		}
		else if (test.state === "failed") {
			return "Failed";
		}
		else {
			throw `Unknown test status, '${test.state}'`;
			// TODO observable.error????
		}
	}

	private getFailureInfo(test: Mocha.Test): TestFailureInfo | null {
		const status = this.getTestStatus(test);

		if (status === "Failed" && test.err) {
			// TODO truncate stack after a few lines or something........
			return new TestFailureInfo(test.err.message, test.err.stack);
		}
		else {
			return null;
		}
	}

	private constructHierarchy(test: Mocha.Test): string[] {
		return this.constructHierarchy2(test.parent);
	}

	// TODO better name than "2 suffix".
	// Won't support method overloading
	// Could do type A | B - but they are interface types at compile-time only, then need some typeguard or whatnot
	private constructHierarchy2(suite: Mocha.Suite | undefined): string[] {
		if (!suite || !suite.parent) {
			return [];
		}

		return [...this.constructHierarchy2(suite.parent), suite.title];
	}
}