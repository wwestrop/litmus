import { ITestRunner } from '../logic/ITestRunner';
import { LitmusContext } from '../types/LitmusContext';
import { TestRun } from '../types/TestRun';
import { ITest } from 'mocha';
import { TestCaseOutcome } from '../types/TestCaseOutcome';
import { TestCase } from '../types/TestCase';
import { Observer, Observable } from '../../../lib/LibObservable/Observable{T}';
import * as Fs from 'fs';
import * as Path from 'path';
import { Directory } from '../../../lib/LibFs/Fs';
//import "../../typings/mocha"; - works, but is emitted in the JS and breaks running under Node
import { TestStatus } from '../types/TestStatus';
import Module = require('module');
import Mocha = require('mocha');
import { TestFailureInfo } from '../types/TestFailureInfo';

export class MochaTestRunner implements ITestRunner {

	constructor (private readonly _directory: Directory) {
	}

	public run(ctxt?: LitmusContext): Observable<TestRun> {
		// TODO since replacing rxjs with my library - it doesn't do .share()
		return new Observable<TestRun>((observer: Observer<TestRun>) => this.createObservable(observer));
	}

	public preRun(): void {
		throw new Error('Not implemented yet.');
	}

	private createObservable(observer: Observer<TestRun>): void {
		const mocha = new Mocha();

		const jsFiles = this._directory.getFilesRecursive()
			.filter(f => f.name.fullName.toLowerCase().endsWith(".js")); // TODO exclude node_modules ??????? Which means we have to do directory separators
		jsFiles.forEach(f => {
			this.uncache(f.fullPath);
			mocha.addFile(f.fullPath);
		});

		const mochaRunner = mocha.run((failures: number) => observer.complete());
		const totalTests = mochaRunner.total;

		// TODO use linked list
		// Right now we're sharing the array between every `TestRun`, but really we want each to be independant
		// Copying the array every time will take up lots of space (and lots of garbage collection)
		const allResults = new Array<TestCaseOutcome>();
		let numTestsRun: number = 0;

		mochaRunner.on('test end', (t: ITest) => {
			const testDuration = t.duration || 0;
			const testStatus = this.getTestStatus(t);

			const testCase = new TestCase();
			testCase.displayName = t.title;
			const hierarchy = this.constructHierarchy(t);
			const fileName = t.file || "";

			testCase.groupingKeys["Suite"] = hierarchy;
			testCase.groupingKeys["File"] = [fileName];

			const failureInfo = this.getFailureInfo(t);

			allResults.push(new TestCaseOutcome(testCase, testStatus, testDuration, failureInfo));

			numTestsRun++;
			const pct = this.capProgress((numTestsRun / totalTests) * 100); // TODO totalTests === 0 > DIV/0 error

			const testRun = new TestRun(allResults, pct);
			observer.next(testRun);
		});
	}

	private uncache(filepath: string) {
		// https://github.com/mochajs/mocha/issues/3084
		// TODO may have to watch package.json in case any deps get updated and blat the cache entirely

		// TODO depending where this is run - node, browser via requireJs, browser via parcelJs - these things are or are not available

		if (require && require.cache) {
			delete require.cache[filepath];
		}
		else {
			delete (Module as any)._cache[filepath];
		}
	}

	private getTestStatus(test: ITest): TestStatus {
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

	private getFailureInfo(test: ITest): TestFailureInfo | null {
		const status = this.getTestStatus(test);

		if (status === "Failed") {
			// TODO are we always guaranteed these members on an error object? Also, ICKY casting 😩
			// TODO truncate this after a few lines or something........
			// return `${(<any>test).err.message} \n ${(<any>test).err.stack}`;
			return new TestFailureInfo((<any>test).err.message, (<any>test).err.stack);
		}
		else {
			return null;
		}
	}

	private constructHierarchy(test: ITest): string[] {
		return this.constructHierarchy2(test.parent);
	}

	// TODO better name than "2 suffix".
	// Won't support method overloading
	// Could do type A | B - but they are interface types at compile-time only, then need some typeguard or whatnot
	private constructHierarchy2(suite: Mocha.ISuite): string[] {
		if (!suite || !suite.parent) {
			return [];
		}

		return [...this.constructHierarchy2(suite.parent), suite.title];
	}

	private capProgress(progress: number): number {
		progress = Math.max(progress, 0);
		progress = Math.min(progress, 100);

		return progress;
	}
}