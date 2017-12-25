import { TestCaseOutcome } from '../types/TestCaseOutcome';
import { Observable } from 'rxjs/Rx';
import { ITestRun } from "../types/ITestRun";
import { IRunner } from 'mocha';
import { Observer } from 'rxjs/Observer';

// import { TestStatus } from './TestStatus';
// import { TestCaseOutcome } from './TestCaseOutcome';
// import { Observable } from 'rxjs/Rx';

export class MochaTestRun implements ITestRun {

	private readonly _mochaRunner: IRunner;

	public readonly IndividualTestResults: TestCaseOutcome[];
	public readonly Duration: number;
	public readonly Progress: Observable<number>;

	private _progressSink: Observer<number>; // TODO any?????

	/**
	 *
	 * @param mocha The configured mocha object, ready to run */
	constructor(mocha: Mocha) {
		// attach applicable event handlers
		this._mochaRunner = mocha.run((e: any) => this.onRunCompleted(e));

		this.Progress = Observable.create((observer: any) => this.initialiseProgress(observer));

		this._mochaRunner.on('start', (_a: any) => {
			// Seems we cannot catch the start event as it's already fired. I guess we know
			// Because of the fact we called `.run()`
			console.log('>>>>>>>>  Overall mocha start');
		})
		.on('suite', (_a: any) => {
			console.log('>>>>>>>>  suite');
		})
		.on('suite end', (_a: any) => {
			console.log('>>>>>>>>  suite end');
		})
		.on('beforeAll', (_a: any) => {
			console.log('>>>>>>>>  before all');
		})
		.on('hook', (_a: any) => {
			console.log('>>>>>>>>  hook');
		})
		.on('test', (_a: any) => {
			console.log('>>>>>>>>  Test');
		})
		.on('test end', (_a: any) => {
			console.log('>>>>>>>>  Test end');
		})
		.on('pass', (_a: any) => {
			console.log('>>>>>>>>  pass');
		})
		.on('fail', (_a: any, _err: any) => {
			console.log('>>>>>>>>  fail');
		})
		.on('waiting', (_a: any) => {
			console.log('>>>>>>>>  Waiting');
		})
		.on('end', (_a: any) => {
			console.log('>>>>>>>>  end');
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

// /** Object returned when invoking a test run */
// export interface ITestRun {

//	 private _progress: Observable<number>;
//	 private _overallResult: TestStatus;
//	 public individualTestResults: TestCaseOutcome[] = [];
//	 public _duration: number = 0;

//	 constructor() {

//		 this._progress = Observable.create((o: any) => {
//			 o.next(24);
//			 o.next(66);
//			 o.next(88);
//			 o.next(100);

//			 o.complete();
//		 });

//	 }

//	 public get Duration(): number {
//		 return this._duration;
//	 }

//	 public get Progress(): Observable<number> {
//		 return this._progress;
//	 }

//	 // TODO - but then is that the coverage of just the last run??
//	 // TODO I could make all of this simpler by enforcing the "auto re-run on any change" rule
//	 // Perhaps with a debounce - if another file saved within 2s, hold the tests????? Might get annoying if you genuinely want tests NOW
//	 /*public get Coverage(): number {
//		 return this._coverage;
//	 }*/
// }