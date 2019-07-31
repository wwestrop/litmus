import { TestCaseOutcome } from './TestCaseOutcome';

/** Object returned when invoking a test run */
// TODO - this is now more of the "view model". Individual results are now what is returned from the test run
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

	public markAllStale(): void{
		for (const t of this.IndividualTestResults) {
			t.IsStale = true;
		}
	}

	public static get Empty(): TestRun {
		return new TestRun([], 0);
	}
}