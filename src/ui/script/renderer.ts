import { ipcRenderer } from 'electron';
import { TestRun } from '../../ts/types/TestRun';
import { TestStatus } from '../../ts/types/TestStatus';
import { TestCaseOutcome } from '../../ts/types/TestCaseOutcome';
import * as reactTree from './reactTree';

// TODO factor constant
ipcRenderer.on("update-test-results", (e: Event, f: TestRun) => {

	const convertedForReact = convertToTreeNodes(f.IndividualTestResults, "suite");
	reactTree.render(convertedForReact);
});

ipcRenderer.on("dev-reset", (e: Event) => {
	// TOOD dev aid only
	const el = document.getElementsByTagName("x-resultstree")[0];
	el.innerHTML = "";
});

ipcRenderer.on("focusSearchBox", (e: Event) => {
	const searchBox = document.getElementById("tests-searchbox") as HTMLInputElement;
	searchBox.focus();
	searchBox.selectionStart = 0;
	searchBox.selectionEnd = searchBox.value.length;
});

/**
 * @param testCaseOutcomes All available test results. These are what will be converted into a tree
 * @param groupingKey The key by which to form the tree hierarchy
 */
function convertToTreeNodes(testCaseOutcomes: TestCaseOutcome[], groupingKey: string): TreeNode<TestCaseOutcome>[] {

	// Bin every test against it's hierarchical key
	const testsGroupedByKey = groupBy(testCaseOutcomes, groupingKey);

	// This should all be shoved off into a testable class anyway, when I have a better idea what I'm doing.......
	// But testing every test against every other test => cartesian product
	const roots = findRoots(testsGroupedByKey);

	// Convert each grouping into a treenode containing its children (the grouped items) and any sub-nodes
	const rootNodes = roots.map(r => convertGroupingToTreeNode(r, testsGroupedByKey));
	return rootNodes;
}

function findRoots(fromList: Grouping<TestCaseOutcome>[]): Grouping<TestCaseOutcome>[] {
	// Each grouping for which there does not exist another having a key that is shorter, but otherwise has the same prefix

	// TODO analyse if I can cut out the filter for shorter keys - if I made isPrefix do this job (ie would that break anything else)
	// TODO the logic made sense when I wrote it, but it's IMMEDIATELY difficult to read back
	return fromList.filter(c => !fromList.filter(i => i.key.length < c.key.length).some(a => isPrefixEqual(a.key, c.key)));
}

type Grouping<T> = {key: string[], binned: T[]};

// TODO should use lodash methods but spent too long trying to get module loaders sorted in node and browser that I wrote the thing myself
function groupBy(testCaseOutcomes: TestCaseOutcome[], groupingKey: string): Grouping<TestCaseOutcome>[] {

	const result: Grouping<TestCaseOutcome>[] = [];

	for (const test of testCaseOutcomes) {
		const thisKey = test.TestCase.groupingKeys[groupingKey];

		let thisBin = result.find(r => isEqual(r.key, thisKey));
		if (!thisBin) {
			thisBin = {key: thisKey, binned: []};
			result.push(thisBin);
		}

		thisBin.binned.push(test);
	}

	return result;
}

/**
 * @param itemToConvert The grouping (a grouping key, and all its direct children - the tests) to turn into a treenode
 * @param allItems The set of all items that will end up in the tree. Items are picked from here to slot into the hierarchy
 */
function convertGroupingToTreeNode(itemToConvert: Grouping<TestCaseOutcome>, allItems: Grouping<TestCaseOutcome>[]): TreeNode<TestCaseOutcome> {
	// TODO This misses gaps in the hierarchy (ie suites that contain only other suites, no tests of their own)
	const nodeTitle = itemToConvert.key[itemToConvert.key.length - 1]; // TODO for "roots" that are >1 level, this discards the upper levels
	const convertedNode = new TreeNode(nodeTitle, itemToConvert.binned);

	const myHierarchyKey = itemToConvert.key;

	// Groupings that are beneath this one (same prefix), but one level down
	const childGroupings = allItems
		.filter(o => isPrefixEqual(myHierarchyKey, o.key))
		.filter(o => o.key.length === myHierarchyKey.length + 1);

	const childNodes = childGroupings.map(s => convertGroupingToTreeNode(s, allItems));
	convertedNode.children = childNodes;

	// Cascade up the status so that any failed children show up as red on the parent nodes too
	if (childNodes.some(n => n.status === "Failed") || itemToConvert.binned.some(t => t.Result === "Failed")) {
		convertedNode.status = "Failed";
	}
	else {
		convertedNode.status = "Passed";
	}

	return convertedNode;
}

/**
 * Tests if @param testedKey begins with @param prefix
 */
function isPrefixEqual(prefix: string[], testedKey: string[]): boolean {
	const testedKeyPrefix = testedKey.slice(0, prefix.length);
	return isEqual(prefix, testedKeyPrefix);
}

// TODO should use lodash methods but spent too long trying to get module loaders sorted in node and browser that I wrote the thing myself
function isEqual(p1: string[], p2: string[]): boolean {

	if (p1.length !== p2.length) {
		return false;
	}

	for (let i = 0; i < p1.length; i++) {
		if (p1[i] !== p2[i]) {
			return false;
		}
	}

	return true;
}

export class TreeNode<T> {
	public status: TestStatus;
	public failureInfo: string | null;

	public children: TreeNode<T>[];

	public constructor(public title: string, public data: T[]) {
	}
}