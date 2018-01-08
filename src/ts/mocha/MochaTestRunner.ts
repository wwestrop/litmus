import { ITestRunner } from '../logic/ITestRunner';
import { LitmusContext } from '../types/LitmusContext';
import { TestRun } from '../types/TestRun';
import * as Mocha from 'mocha';
import { ITest } from 'mocha';
import { TestCaseOutcome } from '../types/TestCaseOutcome';
import { TestCase } from '../types/TestCase';
import { Observable, Observer } from 'rxjs/Rx';

export class MochaTestRunner implements ITestRunner {

	constructor (/*private readonly*/ _directory: string) {
	}

	public run(ctxt?: LitmusContext): Observable<TestRun> {

		//const o = Observable.create((observer: Observer<TestRun>) => this.createObservable(observer));
		const o = Observable.create((observer: any) => this.createObservable(observer));

		// TODO I don't know why Observable.create wants a different signature when the observer is strongly typeds
		// Possiblity because I've got two lots of typings. Conflicting??
		return (<Observable<TestRun>>o).share();
	}

	public preRun(): void {
		throw new Error('Not implemented yet.');
	}

	private createObservable(observer: Observer<TestRun>): void {
		let m = new Mocha();
		m.addFile("C:\\Users\\Will\\Documents\\Git\\langserver-puppet\\client\\server\\test\\contextResolver.test.js"); // - TODO

		const mochaRunner = m.run((e: any) => observer.complete());
		const totalTests = mochaRunner.total;

		// TODO use linked list
		// Right now we're sharing the array between every `TestRun`, but really we want each to be independant
		// Copying the array every time will take up lots of space
		const allResults = new Array<TestCaseOutcome>();
		let numTestsRun: number = 0;

		mochaRunner.on('test end', (t: ITest) => {
			if (t.pending) {
				allResults.push(new TestCaseOutcome(new TestCase(), "Skipped", t.duration || 0));
			}
			else if (t.state === "passed") {
				allResults.push(new TestCaseOutcome(new TestCase(), "Passed", t.duration || 0));
			}
			else if (t.state === "failed") {
				allResults.push(new TestCaseOutcome(new TestCase(), "Failed", t.duration || 0));
			}
			else {
				throw `Unknown test status, '${t.state}'`;
				// TODO observable.error????
			}

			numTestsRun++;
			const pct = this.capProgress((numTestsRun / totalTests) * 100); // TODO totalTests === 0 > DIV/0 error

			const testRun = new TestRun(allResults, pct);
			observer.next(testRun);
		});
	}

	private capProgress(progress: number): number {
		progress = Math.max(progress, 0);
		progress = Math.min(progress, 100)

		return progress;
	}
}