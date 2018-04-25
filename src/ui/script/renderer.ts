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

	// The groupings with the shortest keys are the roots
	const rootDepth = testsGroupedByKey.reduce(
		(acc, vc) => Math.min(acc, vc.key.length),
		Number.MAX_SAFE_INTEGER);

	const roots = testsGroupedByKey.filter(o => o.key.length === rootDepth);

	// Convert each grouping into a treenode containing its children (the grouped items) and any sub-nodes
	const rootNodes = roots.map(r => convertGroupingToTreeNode(r, testsGroupedByKey));
	return rootNodes;
}

// TODO should use lodash methods but spent too long trying to get module loaders sorted in node and browser that I wrote the thing myself
function groupBy(testCaseOutcomes: TestCaseOutcome[], groupingKey: string): {key: string[], binned: TestCaseOutcome[]}[] {

	const result: {key: string[], binned: TestCaseOutcome[]}[] = [];

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
function convertGroupingToTreeNode(itemToConvert: {key: string[], binned: TestCaseOutcome[]}, allItems: {key: string[], binned: TestCaseOutcome[]}[]): TreeNode<TestCaseOutcome> {
	// TODO This misses gaps in the hierarchy (ie suites that contain only other suites, no tests of their own)
	// TODO the grouping type, `{key: string[], binned: TestCaseOutcome[]}`, is a bit raw. Alias it or promote to its own type
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