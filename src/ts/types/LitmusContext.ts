import { TestCase } from "./TestCase";

export class LitmusContext {
	/** The tests to be run, or `undefined` to runn all discovered tests */
	// TODO not used at present, we are currently re-running all tests
	public Tests: TestCase[] | undefined;
}