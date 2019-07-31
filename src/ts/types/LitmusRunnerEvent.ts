import { TestCaseOutcome } from "./TestCaseOutcome";
import { TestCase } from './TestCase';


export type LitmusRunnerEvent = TestRunStarted | TestRunFinished | IndividualTestStarted | IndividualTestFinished;


/** Event emitted when a test run begins. Informs Litmus of various properties of the test run. */
export class TestRunStarted {

	public constructor(groupingKeys: string[], numTests: number) {
		this.groupingKeys = groupingKeys;	// TODO REALLY should be consistent with casing
		this.numTests = numTests;
	}

	/** Enumerates the grouping keys that this test runner will provide for each of the tests it runs */
	public readonly groupingKeys: string[] = [];

	/** The expected number of tests in this run, for calculating progress */
	public readonly numTests: number;

	public readonly type: "TestRunStarted" = "TestRunStarted";
}

/** Event emitted when a test run finishes completely, or is stopped after being requested by the user */
export class TestRunFinished {
	public readonly type: "TestRunFinished" = "TestRunFinished";
}


export class IndividualTestStarted {

	public constructor(testcase: TestCase) {
		this.Testcase = testcase;
	}

	public Testcase: TestCase;
	public readonly type: "IndividualTestStarted" = "IndividualTestStarted";
}


// TODO set status *AWAY* from "running", to whatever it was
export class IndividualTestFinished {

	public constructor(testResult: TestCaseOutcome) {
		this.TestResult = testResult;
	}

	public TestResult: TestCaseOutcome;

	// !!! TODO !!!!
	// !!! TODO !!!!
	// !!! TODO !!!!
	// !!! TODO !!!!
	// NO! It has to be here somewhere, for the main process to update the taskbar. Unless we call back from the main thread to do that. Along w/ the icon (so it needs state of all tests run thus far). We need to keep "running state"
	//
	// TODO calculate this ourselves on the front-end
	// public Progress: number;
	//public RunningState: RunningState;

	/** Indicates no filter being applied and we're returning all results (ie clobber all existing UI state, don't merge).
	 *  Will also be true for the first run of any given project */
	public isFromScratch: boolean; // isFullRun / isDifferentialRun / isPartial

	public readonly type: "IndividualTestFinished" = "IndividualTestFinished";
}