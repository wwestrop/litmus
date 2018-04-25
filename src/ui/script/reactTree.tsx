// import ReactDOM from 'react-dom';
// import React from 'react';
import ReactDOM = require('react-dom');
import React = require('react');
import { TreeNode } from './renderer';
import { TestCaseOutcome } from '../../ts/types/TestCaseOutcome';


interface ITreeTopLevel {
	treeData: TreeNode<TestCaseOutcome>[];
}

interface INode {
	nodeData: TreeNode<TestCaseOutcome> | TestCaseOutcome;
}

// declare module JSX {
// 	interface IntrinsicElements {
// 		"x-node": any;
// 		"x-nodeHeader": any;
// 		"x-twistie": any;
// 		"x-statusIcon": any;
// 		"nodeTitle": any;
// 	}
// }

class TreeTopLevel extends React.Component<ITreeTopLevel> {
	render() {
		return (
			<div className="treeWrapper">
				{this.props.treeData.map(d => <Node nodeData={d} />)}
			</div>
		);
	}
}

// TODO why typescript wanted the return type here for `render`, but not above??????
class Node extends React.Component<INode> {
	render(): React.ReactNode { // TODO Give each node a unique key. Applies to the namespaces (groupings) too

		const nodeTitle = isSuite(this.props.nodeData) ? this.props.nodeData.title : this.props.nodeData.TestCase.displayName;

		// TODO - ICK! NESTED TERNARIES! MY EYES!!!! Again - rectify naming inconsistencies
		const nodeStatus = isSuite(this.props.nodeData)
			? (this.props.nodeData.status === "Passed" ? "passed" : "failed") 
			: (this.props.nodeData.Result === "Passed" ? "passed" : "failed");
		//const mappedThing = this.props.nodeData.children || [];
		const cssClassName = `${nodeStatus} expanded ${isSuite(this.props.nodeData) ? "expandable" : ""}`;

		return (
			<x-node class={cssClassName} onclick="onNodeClick(this)">
				<x-nodeHeader>
					<x-twistie />
					<x-statusIcon />
					<x-nodeTitle>{nodeTitle}</x-nodeTitle>
				</x-nodeHeader>

				{isSuite(this.props.nodeData) ? this.props.nodeData.children.map(suite => <Node nodeData={suite} />) : []}

				{isSuite(this.props.nodeData) ? this.props.nodeData.data.map(test => <Node nodeData={test} />) : []}
			</x-node>
		);
	}
}


// TODO - I'm shoving two slightly diff things through the same treenode, and it's a bit awkward
// TODO - It also highlights some inconsistent naming
function isSuite(input: TreeNode<TestCaseOutcome> | TestCaseOutcome): input is TreeNode<TestCaseOutcome> {
	return (input as any).children !== undefined;
}


// TODO - shove all the tree grouping, treeNode converting stuff within this file too, out of main renderer.ts
// Allow us to chop and change the view here too - grouping key, selected filter-option, free-text search, etc
export function render(testResults: TreeNode<TestCaseOutcome>[]) {
	const area = document.getElementsByTagName("x-resultstree")[0];
	ReactDOM.render(
		<TreeTopLevel treeData={testResults}/>,
		area);
}