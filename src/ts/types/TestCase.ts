/** Class describing a test to be run (does not include the test outcome, as this can vary between runs)./
 *  Used as an identifier for test cases, instead of a string */
export class TestCase {
	// TODO. tempting to put the test status in here..... but that kinda means I can't
	// serve an immutable set of "test results", I'd have to mutate this "status" field during a run,
	// or copy everything at that point
	// BUT - if I keep them distinct, it means some code to map the results back against the cases list
	public displayName: string;

	/** An associative array of all the fields supported by a test runner frameowrk,
	 *  of which the tests can be grouped in the UI. May be hierarchical (ie a list of strings) */
	// public groupingKeys: {[groupingField: string]: string[] | string; } = {};
	public groupingKeys: {[groupingField: string]: string[]} = {};

	// tslint:disable-next-line:no-any `any` is _exactly_ what it is
	public toJSON(): any {
		return {
			displayName: this.displayName,
			groupingKeys: this.groupingKeys,
		};
	}
}