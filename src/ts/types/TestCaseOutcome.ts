import { TestCase } from './TestCase';
import { TestStatus } from './TestStatus';

export class TestCaseOutcome {
	/** @param TestCase The test which this result applies to */
	constructor(public readonly TestCase: TestCase, public readonly Result: TestStatus, public readonly Duration: number) {
	}
}