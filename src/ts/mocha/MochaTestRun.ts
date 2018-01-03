import { TestCaseOutcome } from '../types/TestCaseOutcome';
import { Observable } from 'rxjs/Rx';
import { ITestRun } from "../types/ITestRun";
import { IRunner, ITest } from 'mocha';
import { Observer } from 'rxjs/Observer';

// import { TestStatus } from './TestStatus';
// import { TestCaseOutcome } from './TestCaseOutcome';
// import { Observable } from 'rxjs/Rx';

export class MochaTestRun implements ITestRun {

	private readonly _mochaRunner: IRunner;

	public readonly IndividualTestResults: TestCaseOutcome[];
	public readonly Duration: number;
	public readonly Progress: Observable<number>;

	public NumPassed: number = 0;
	public NumFailed: number = 0;
	public NumSkipped: number = 0;

	private totalTests = 0;

	private _progressSink: Observer<number>; // TODO any?????

	/**
	 *
	 * @param mocha The configured mocha object, ready to run */
	constructor(mocha: Mocha) {
		// attach applicable event handlers
		this._mochaRunner = mocha.run((e: any) => this.onRunCompleted(e));
		this.totalTests = this._mochaRunner.total;

		this.Progress = Observable.create((observer: any) => this.initialiseProgress(observer));

		this._mochaRunner.on('test end', (a: ITest) => {
			if (a.pending) {
				this.NumSkipped++;
			}
			else if (a.state === "passed") {
				this.NumPassed++;
			}
			else if (a.state === "failed") {
				this.NumFailed++;
			}
			else {
				throw `Unknown test status, '${a.state}'`;
			}

			var numDone = this.NumFailed + this.NumPassed + this.NumSkipped;
			var pct = (numDone / this.totalTests) * 100; // TODO totalTests === 0 > DIV/0 error

			this.reportProgress(pct);
		});
	}

	private initialiseProgress(observer: Observer<number>): void {
		this._progressSink = observer;

		this.reportProgress(0);
	}

	private onRunCompleted(e: any) {
		// TODO don't actually know if this is necessary
		this._mochaRunner.removeAllListeners();

		this.reportProgress(100);

		// This definitely is necessary
		this._progressSink.complete();
	}

	private reportProgress(progress: number): void {
		progress = Math.max(progress, 0)
		progress = Math.min(progress, 100)

		this._progressSink.next(progress);
	}
}
