import { TestCase } from './TestCase';
import { TestStatus } from './TestStatus';
import { TestFailureInfo } from './TestFailureInfo';

export class TestCaseOutcome {

	public IsStale: boolean = false;

	constructor(
		/** The test which this result applies to */
		public readonly TestCase: TestCase,
		public readonly Result: TestStatus,
		public readonly Duration: number,
		/** Textual description of the reason for the test failure, if any */
		public readonly FailureInfo: TestFailureInfo | null) {
	}
}