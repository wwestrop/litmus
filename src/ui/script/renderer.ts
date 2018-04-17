import { ipcRenderer } from 'electron';
import { TestRun } from '../../ts/types/TestRun';
import { TestStatus } from '../../ts/types/TestStatus';
import { TestCaseOutcome } from '../../ts/types/TestCaseOutcome';

// TODO factor constant
ipcRenderer.on("update-test-results", (e: Event, f: TestRun) => {

	//console.log(new Date().getTime());
	if (f.IndividualTestResults.length > 32) {
		groupByAgain(f.IndividualTestResults, "suite");
	}

	const el = document.getElementsByTagName("x-resultstree")[0];

	const lastTest = f.IndividualTestResults[f.IndividualTestResults.length - 1];
	const testPath = `${lastTest.TestCase.hierarchy.join(" > ")} > ${lastTest.TestCase.displayName}`;

	const btn = document.createElement("p");
	btn.style.color = lastTest.Result === "Failed" ? "#FE4E4E" : null;
	btn.title = lastTest.TestCase.fileName; // The tooltip
	const t = document.createTextNode(`>> ${f.Progress.toFixed(0)}%   @${(f.Duration / 1000).toFixed(1)}s         ::::   ${testPath}`);
	btn.appendChild(t);                                // Append the text to <button>
	el.appendChild(btn);
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


function groupByAgain(testCaseOutcomes: TestCaseOutcome[], groupingKey: string): TreeNode<TestCaseOutcome>[] {

	const binned = myGroupBy(testCaseOutcomes, "suite");

	// find the shortest grouping key. that gives us our first level (the "roots", even though the root is a virtual one above that)
	const rootDepth = binned.reduce(
		(acc, vc) => Math.min(acc, vc.key.length),
		Number.MAX_SAFE_INTEGER);

	const roots = testCaseOutcomes.filter(o => o.TestCase.groupingKeys[groupingKey].length === rootDepth);

	// const rootNodes = roots.map(r => convertToTreeNode(r, groupingKey, testCaseOutcomes));

	throw "Not implemented";

}

// TODO somehow build the TestCaseOutcome by merging the results of the previous run, with the results we're getting in now
function groupBy(testCaseOutcomes: TestCaseOutcome[], groupingKey: string): TreeNode<TestCaseOutcome>[] {

	// find the shortest grouping key. that gives us our first level (the "roots", even though the root is a virtual one above that)
	const rootDepth = testCaseOutcomes.reduce(
		(vp, vc) => Math.min(vp, vc.TestCase.groupingKeys[groupingKey].length),
		Number.MAX_SAFE_INTEGER);

	// find all the items where the grouped key is zero elements long. these are the roots
	const roots = testCaseOutcomes.filter(o => o.TestCase.groupingKeys[groupingKey].length === rootDepth);

	const rootNodes = roots.map(r => convertToTreeNode(r, groupingKey, testCaseOutcomes));

	return rootNodes;
	//const virtualRoot = new TreeNode<TestCaseOutcome>(null);

	// const rootNodes = roots.map(o => new TreeNode<TestCaseOutcome>(o));

	// TODO maybe we need to create a fake root?

	// const nextLevel = testCaseOutcomes.filter(o => o.TestCase.groupingKeys[groupingKey].length === rootDepth + 1);

	// // bin all of the next-levels up into the one with a matching prefix
	// for (let i = 0; i < roots.length; i++) {
	// 	const root = roots[i];
	// 	const childTests = testCaseOutcomes.filter(o => isEqual(root.TestCase.groupingKeys[groupingKey], o.TestCase.groupingKeys[groupingKey]));
	// 	const childSuites = nextLevel.filter(o => isPrefixEqual(root.TestCase.groupingKeys[groupingKey], o.TestCase.groupingKeys[groupingKey]));
	// 	console.log(`${root.TestCase.displayName} ===> ${childTests.length} child tests (${childSuites.length} direct child suites)`);

	// 	const rootNode = new TreeNode(root);
	// 	// rootNode.children = // recurse
	// }

	// throw "Not implemented";

	/*
		groupBy their key. then hierarchicalize those bins based on subkeys?
		groupBy is a reduce function: {key -> list<data>}
	*/

}

// TODO it'd really be nice to not have to write this myself
// TODO.... but dealing with layers of transpilation, and webpack, and module formats and bundling bullshit.....
// Wheel reinvention is bad (and I don't want to be doing it)..... But when I just gave up trying to get that to work and just wrote the damn thing myself,
// it took mintues, vs days
function myGroupBy(testCaseOutcomes: TestCaseOutcome[], groupingKey: string): {key: string[], binned: TestCaseOutcome[]}[] {

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
 * TODO effectively converts `me` to a treeNode representation
 * @param all Every single value, from where we pick the children to assign. TODO We *may* mutate this list as we go along, as nodes are assigned
 * @param groupingKey
 */
function convertToTreeNode(me: TestCaseOutcome, groupingKey: string, all: TestCaseOutcome[]): TreeNode<TestCaseOutcome> {
	const meMe = new TreeNode(me);

	const myHierarchyKey = me.TestCase.groupingKeys[groupingKey];

	const childTests = all.filter(o => isEqual(myHierarchyKey, o.TestCase.groupingKeys[groupingKey]));
	const nextLevel = all.filter(o => o.TestCase.groupingKeys[groupingKey].length === myHierarchyKey.length + 1);
	const childSuites = nextLevel.filter(o => isPrefixEqual(myHierarchyKey, o.TestCase.groupingKeys[groupingKey]));

	const childrenNodes = childSuites.map(s => convertToTreeNode(s, groupingKey, all));
	meMe.children = childrenNodes;

	return meMe;
}

function isPrefixEqual(prefix: string[], p2: string[]): boolean {
	var p2prefix = p2.slice(0, prefix.length);
	return isEqual(prefix, p2prefix);
}

// TODO use lodash helpful methods if can get these damn module loaders sorted
// otherwise it's just easiet to reinvent every wheel
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
	public title: string;
	public status: TestStatus;
	public failureInfo: string | null;

	public children: TreeNode<T>[];

	public constructor(public data: T) {
	}
}