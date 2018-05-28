import { ipcRenderer } from 'electron';
import { TestRun } from '../../ts/types/TestRun';
import { TestStatus } from '../../ts/types/TestStatus';
import { TestCaseOutcome } from '../../ts/types/TestCaseOutcome';
import * as reactTree from './reactTree';
import _ = require('lodash');

let lastRunResults: TestRun | null;

// TODO factor constant
/** Fired to update the display as new information is streamed from the test runner */
ipcRenderer.on("update-test-results", (e: Event, f: TestRun) => {

	lastRunResults = f;

	if (f.IndividualTestResults.length === 1) { // TODO done to avoid unnecessarily re-doing this step; find a nicer way
		LitmusDom.groupByDropDown.onchange = null;

		const keys = getAvailableGroupingKeys(f.IndividualTestResults);
		LitmusDom.groupByDropDown.innerHTML = ""; // TODO people can't agree on what method is faster. Benchmark myself, if it proves an issue
		keys.forEach(k => {
			const kElement = document.createElement("option");
			kElement.value = k;
			kElement.text = k;
			LitmusDom.groupByDropDown.appendChild(kElement);
		});

		const selectedGroupingKey = getDesiredGroupingKey(f.IndividualTestResults);
		LitmusDom.groupByDropDown.value = selectedGroupingKey;

		// reattach handler. TODO yuck
		LitmusDom.groupByDropDown.onchange = onGroupingChanged;
	}

	pushTestState();
});

ipcRenderer.on("dev-reset", (e: Event) => {
	// TOOD dev aid only
	const el = document.getElementsByTagName("x-resultstree")[0];
	el.innerHTML = "";
});

ipcRenderer.on("focusSearchBox", (e: Event) => {
	LitmusDom.searchBox.focus();
	LitmusDom.searchBox.selectionStart = 0;
	LitmusDom.searchBox.selectionEnd = LitmusDom.searchBox.value.length;
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

	// For each root node, find its furthest descendants
	const allKeys = testsGroupedByKey.map(g => g.key);
	const leavesByRoot = roots.map(r => ({
		rootKey: r.key,
		leaves: findLeafKeys(r.key, allKeys)
	}));

	for (const r of leavesByRoot) {
		for (const l of r.leaves) {
			// Walk back up from each leaf to its root, insert empty grouping bins if necessary so the hierarchy has no gaps
			for (let i = l.length - 1; i > r.rootKey.length; i--) {
				const subkey = l.slice(0, i);
				if (!testsGroupedByKey.some(a => isEqual(a.key, subkey))) {
					testsGroupedByKey.push({ key: subkey, binned: [] });
				}
			}
		}
	}

	// Convert each grouping into a treenode containing its children (the grouped items) and any sub-nodes
	const rootNodes = roots.map(r => convertGroupingToTreeNode(r, testsGroupedByKey));
	return rootNodes;
}


function findLeafKeys(descendantOf: string[], allKeys: string[][]): string[][] {
	const allDescendants = findAllLeafKeys(allKeys).filter(k => isPrefixEqual(descendantOf, k));
	return allDescendants;
}

function findAllLeafKeys(allKeys: string[][]): string[][] {
	// Keys with no children
	return allKeys.filter(k => !allKeys.some(c => c.length > k.length && isPrefixEqual(k, c)));
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

/**
 * When some state is changed that would change the tests displayed on the UI (the tests themselves, a filter or search etc),
 * this function is invoked to update the display
 */
function pushTestState() {
	const selectedGroupingKey = LitmusDom.groupByDropDown.value;

	const convertedForReact = convertToTreeNodes(lastRunResults!.IndividualTestResults, selectedGroupingKey);

	const filtered = filterTree(convertedForReact, filterTest);

	reactTree.render(filtered);
}

function getSelectedGroupingKey(): string {
	const widget = LitmusDom.groupByDropDown;
	const currentlySelectedKey = widget.options[widget.selectedIndex].value;

	return currentlySelectedKey;
}

function getDesiredGroupingKey(allTestCaseOutcomes: TestCaseOutcome[]): string {

	// TODO lots of cases for this - these need tests more than most things
	const possibles = getAvailableGroupingKeys(allTestCaseOutcomes);
	if (possibles.length === 0) {
		return ""; // No option to select anything TODO empty string here sentintel value probably won't work
	}

	const currentlySelectedKey = getSelectedGroupingKey();

	if (currentlySelectedKey === "") { // TODO empty string?
		// User had nothing selected. Pick the default for them.
		return possibles[0];
	}
	else if (_.includes(possibles, currentlySelectedKey)) {
		// Keep the users current selection
		return currentlySelectedKey;
	}
	else {
		// This new set of tests doesn't include the key we were already using (switched to diff framework maybe)
		return possibles[0];
	}
}

/**
 * TODO make it an explicit part of a contract somewhere somehow, that every key is present on every test result
 */
function getAvailableGroupingKeys(allTestCaseOutcomes: TestCaseOutcome[]): string[] {
	if (allTestCaseOutcomes.length === 0) {
		return [];
	}
	else {
		// TODO If simply presenting the internal groupingkey name on the UI, won't be great if Litmus is ever internationalised.
		// TODO Then again, that's on the person implementing the test-runner, as the keys were designed to be flexible
		// depending on the needs or particular features of any given test framework.
		// Can we expect an implementor to translate their keys for every language there might be?
		const candidateTest = allTestCaseOutcomes[0].TestCase;
		return Object.keys(candidateTest.groupingKeys);
	}
}

// TODO move type into own file
export class TreeNode<T> {
	public status: TestStatus;
	public failureInfo: string | null;

	public children: TreeNode<T>[];

	public constructor(public title: string, public data: T[]) {
	}
}


function onGroupingChanged (this: HTMLElement, a: Event): any {
	pushTestState();
}

function onSearchChanged (this: HTMLElement, a: Event): any {
	pushTestState();
}

/** Looks at the options on the UI and determines if a given test should be visible, given the options selected. */
function filterTest(t: TestCaseOutcome): boolean {
	let result = true;

	const searchText = LitmusDom.getSearchText(); // TODO already tolower'ed - make the more explicit
	if (searchText) {
		const textSearchFunction = (t: TestCaseOutcome) => {
			// TODO this assumes these two grouping keys always present, on every testrunner framework
			// TODO also assumes we want to fitler on everything, even if it may not be visible on screen. Do we?
			return t.TestCase.displayName.toLowerCase().includes(searchText)
				|| t.TestCase.groupingKeys["File"].some(k => k.toLowerCase().includes(searchText))
				|| t.TestCase.groupingKeys["Suite"].some(k => k.toLowerCase().includes(searchText));
		};

		result = result && textSearchFunction(t);
	}

	const statusFilter = LitmusDom.getStatusFilter();
	if (statusFilter) {
		const statusFilterFunction = (t: TestCaseOutcome) => {
				return t.Result === statusFilter;
		};

		result = result && statusFilterFunction(t);
	}

	return result;
}


function filterTree<T>(tree: TreeNode<T>[], filterFunc: (t: T) => boolean): TreeNode<T>[] {
	// Filter out all the tests. Need to remove any nodes where all their children have been filtered out
	const filtered = tree.map(t => filterNode(t, filterFunc));

	// This can leave useless branches on the tree, which now have nothnig in them - clean this up
	const fakeRoot = new TreeNode<T>("", []);
	fakeRoot.children = filtered;
	pruneTree(fakeRoot);
	return fakeRoot.children;
	// TODO dealing with unrooted tree sligthly awkward (it's really a collection of root-level trees)
}

function filterNode<T>(node: TreeNode<T>, filterFunc: (t: T) => boolean): TreeNode<T> {
	// Clone existing node
	const newNode = new TreeNode<T>(node.title, []);
	newNode.status = node.status;
	newNode.children = [];
	newNode.failureInfo = node.failureInfo;

	// Filter data (tests at this level)
	newNode.data = node.data.filter(filterFunc);

	// Recurse down to children
	newNode.children = node.children.map(c => filterNode(c, filterFunc));

	return newNode;
}


/** Removes the child nodes from this treeNode where there are no tests anywhere down the hierarchy
 *  (as can happen when tests have been filtered out by the user's filter choices) */
function pruneTree<T>(node: TreeNode<T>): void {
	node.children.map(c => pruneTree(c));
	node.children = node.children.filter(c => c.children.length > 0 || c.data.length > 0);
}

function hasDescendants<T>(node: TreeNode<T>): boolean {
	return node.children.every(c => hasDescendants(c))
		&& node.data.length > 0;
}





/** Abstraction over the UI */
// TODO rather than grabbing something out the DOM, probably should make the /ENTIRE/ UI in React
abstract class LitmusDom {

	public static readonly groupByDropDown = document.getElementById("groupByDropdown")! as HTMLSelectElement;
	public static readonly searchBox = document.getElementById("tests-searchbox")! as HTMLInputElement;

	public static readonly filterAll = document.getElementById("rStatusFilterAll")! as HTMLInputElement;
	public static readonly filterPassed = document.getElementById("rStatusFilterPassed")! as HTMLInputElement;
	public static readonly filterFailed = document.getElementById("rStatusFilterFailed")! as HTMLInputElement;
	public static readonly filterSkipped = document.getElementById("rStatusFilterSkipped")! as HTMLInputElement;

	private static readonly placeholder: string ="Type to search…"; // TODO really should embed in component. CBA right now

	public static getSearchText(): string | null {
		const text = LitmusDom.searchBox.value.trim();

		if (text === "" || text === LitmusDom.placeholder) {
			return null;
		}
		else {
			return text.toLowerCase().trim();
		}
	}

	public static getStatusFilter(): TestStatus | null {
		if (LitmusDom.filterAll.checked) {
			return null;
		}
		else if (LitmusDom.filterPassed.checked) {
			return "Passed";
		}
		else if (LitmusDom.filterFailed.checked) {
			return "Failed";
		}
		else {
			return "Skipped";
		}
	}
}



// Since DOM code can't reach in to this module (can't it? is there a way?) and refer to the event handlers,
// we reach the other way, to the DOM, and set them ourselves
LitmusDom.groupByDropDown.onchange = onGroupingChanged;
LitmusDom.searchBox.oninput = onSearchChanged;
LitmusDom.filterAll.onchange = onSearchChanged;
LitmusDom.filterPassed.onchange = onSearchChanged;
LitmusDom.filterFailed.onchange = onSearchChanged;
LitmusDom.filterSkipped.onchange = onSearchChanged;

function fixMacAccelerator(accelerator: string): string {
	return process.platform === 'darwin' ? accelerator.replace("Ctrl", "Cmd") : accelerator;
}

function populateTooltipAccelerators() {
	const buttons = document.querySelectorAll("x-toolbar button")
	for(const b of buttons) {
		if (b.hasAttribute("data-accelerator")) {
			let accel = b.getAttribute("data-accelerator")!;
			accel = fixMacAccelerator(accel);

			(<HTMLButtonElement>b).title = `${(<HTMLButtonElement>b).title} (${accel})`;
		}
	}
}

populateTooltipAccelerators();