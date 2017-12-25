import { TestCaseOutcome } from './TestCaseOutcome';
import { Observable } from 'rxjs/Rx';

/** Object returned when invoking a test run */
export interface ITestRun {
	
	readonly IndividualTestResults: TestCaseOutcome[];

	readonly Duration: number;

	readonly Progress: Observable<number>;

	// TODO - but then is that the coverage of just the last run??
	// TODO I could make all of this simpler by enforcing the "auto re-run on any change" rule
	// Perhaps with a debounce - if another file saved within 2s, hold the tests????? Might get annoying if you genuinely want tests NOW
	/*public get Coverage(): number {
		return this._coverage;
	}*/
}