import ReactDOM = require('react-dom');
import React = require('react');
import { TreeNode } from './renderer';
import { TestCaseOutcome } from '../../ts/types/TestCaseOutcome';
import AnimateHeight from 'react-animate-height';
import { shell, remote } from 'electron';
import { LibFs } from '../../../lib/LibFs/Fs';


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
					<x-nodeHeader
						onContextMenu={(e: React.SyntheticEvent<any>) => this.onNodeRightClick(e)}
						onClick={(e: React.SyntheticEvent<any>) => this.onNodeClick(e)}>

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

	onNodeRightClick(e: React.SyntheticEvent<any>) {

		const that = this;

		/** Gets a test file for the shell to open. It is "representative" of the one selected in the UI,
		 *  as e.g. when "opening" a group, rather than an individual test, we might be inferring which file to open. */
		function getRepresentativeFile() {
			// TODO - make "File" a constant, if this is a mandatory grouping key
			// TODO - in the case of a "grouping" tree node (file, suite, etc), rather than a test leaf,
			// TODO - this pick the first child as "representative"
			//        This works when grouped by file.
			//        Grouped by suite works too - at least in Mocha, suites cannot span files https://github.com/mochajs/mocha/issues/1413
			//        It would give nonsensical behaviour if grouped by e.g. speed
			//
			// TODO - this opens the JS file. If it was a transpiled source file, find and open the original
			const filename = !isSuite(that.props.nodeData)
				? that.props.nodeData.TestCase.groupingKeys["File"].join(LibFs.separator)
				: that.props.nodeData.data[0].TestCase.groupingKeys["File"].join(LibFs.separator); // TODO that assumes there is a [0]

			return filename;
		}

		const menu = new remote.Menu();

		menu.append(new remote.MenuItem ({
			label: 'Run',
			click() {
				if (isSuite(that.props.nodeData)) {
					// TODO Grab all child tests, or invoke runner with a filter (same as if searchbox used...............)
					return;
				}
			}
		}));
		menu.append(new remote.MenuItem ({
			label: 'Debug',
			enabled: false,
		}));

		menu.append(new remote.MenuItem({type: 'separator'}));

		menu.append(new remote.MenuItem ({
			label: 'Open',
			click() {
				shell.openItem(getRepresentativeFile());
			}
		}));
		menu.append(new remote.MenuItem ({
			label: 'Open folder',
			click() {
				shell.showItemInFolder(getRepresentativeFile());
			}
		}));
		menu.append(new remote.MenuItem ({
			label: 'View coverage',
			enabled: false,
		}));
		menu.append(new remote.MenuItem ({
			label: 'Skip',
			enabled: false,
		}));

		menu.append(new remote.MenuItem({type: 'separator'}));

		menu.append(new remote.MenuItem ({
			label: 'Properties',
			enabled: false,
		}));

		e.stopPropagation();

		menu.popup({});
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