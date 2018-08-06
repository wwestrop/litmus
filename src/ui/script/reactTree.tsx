import ReactDOM = require('react-dom');
import React = require('react');
import { TreeNode } from './renderer';
import { TestCaseOutcome } from '../../ts/types/TestCaseOutcome';
import AnimateHeight from 'react-animate-height';


interface ITreeTopLevel {
	treeData: TreeNode<TestCaseOutcome>[];
}

interface INode {
	nodeData: TreeNode<TestCaseOutcome> | TestCaseOutcome;
}

interface INodeState {
	expanded: boolean;
}

declare global {
	module JSX {
		interface IntrinsicElements {
			"x-node": any;
			"x-nodeHeader": any;
			"x-twistie": any;
			"x-statusIcon": any;
			"x-nodeTitle": any;
			"x-nodeDetails": any;
		}
	}
}

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
class Node extends React.Component<INode, INodeState> {

	constructor(props: INode, context?: any) {
		super(props, context);

		this.state = {
			expanded: true,
		};
	}

	render(): React.ReactNode { // TODO Give each node a unique key. Applies to the namespaces (groupings) too

		const nodeTitle = isSuite(this.props.nodeData) ? this.props.nodeData.title : this.props.nodeData.TestCase.displayName;

		// TODO - ICK! NESTED TERNARIES! MY EYES!!!! Again - rectify naming inconsistencies
		const nodeStatus = isSuite(this.props.nodeData)         // TODO - do better than lowercasing a fixed string, make it consistent across things
			? (this.props.nodeData.status.toLowerCase())        // sub-folders in the view (which contain more tests themselves)
			: (this.props.nodeData.Result.toLowerCase());       // individual tests

		const cssClassName = `${nodeStatus} ${this.state.expanded ? "expanded" : ""} ${isSuite(this.props.nodeData) ? "expandable" : ""}`;
		const failureInfoMsg = !isSuite(this.props.nodeData) && this.props.nodeData.FailureInfo
			? this.props.nodeData.FailureInfo.message
			: null;

		return (
			<AnimateHeight duration={150} height={this.state.expanded ? 'auto' : 24} easing={'ease-in-out'}>
				<x-node class={cssClassName}>
					<x-nodeHeader onClick={(e: React.SyntheticEvent<any>) => this.onNodeClick(e)}>
						<x-twistie />
						<x-statusIcon />
						<x-nodeTitle title={failureInfoMsg}>{nodeTitle}</x-nodeTitle>
					</x-nodeHeader>

					{!isSuite(this.props.nodeData) && this.props.nodeData.FailureInfo
						? <x-nodeDetails>
							{this.props.nodeData.FailureInfo.message}
							<br />
							{this.props.nodeData.FailureInfo.stackTrace}
						</x-nodeDetails>
						: []}

					{isSuite(this.props.nodeData) ? this.props.nodeData.children.map(suite => <Node nodeData={suite} />) : []}

					{isSuite(this.props.nodeData) ? this.props.nodeData.data.map(test => <Node nodeData={test} />) : []}
				</x-node>
			</AnimateHeight>
		);
	}

	onNodeClick(e: React.SyntheticEvent<any>) {
		this.setState((prev: INodeState, props: INode) => ({expanded: !prev.expanded}));
		e.stopPropagation();
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