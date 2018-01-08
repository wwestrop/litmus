import { TestCaseOutcome } from './TestCaseOutcome';

/** Object returned when invoking a test run */
export class TestRun {

	public get Duration(): number {
		// TODO count these things recursively
		return this.IndividualTestResults
			.map(r => r.Duration)
			.reduce((n1, n2) => n1 + n2, 0);
	}

	public get NumPassed(): number {
		// TODO count these things recursively
		return this.IndividualTestResults.filter(r => r.Result === "Passed").length;
	}

	public get NumFailed(): number {
		// TODO count these things recursively
		return this.IndividualTestResults.filter(r => r.Result === "Failed").length;
	}

	public get NumSkipped(): number {
		// TODO count these things recursively
		return this.IndividualTestResults.filter(r => r.Result === "Skipped").length;
	}

	constructor(
		public readonly IndividualTestResults: TestCaseOutcome[],
		public readonly Progress: number) {
	}

	// TODO - but then is that the coverage of just the last run??
	// TODO I could make all of this simpler by enforcing the "auto re-run on any change" rule
	// Perhaps with a debounce - if another file saved within 2s, hold the tests????? Might get annoying if you genuinely want tests NOW
	/*public get Coverage(): number {
		return this._coverage;
	}*/
}