import ReactDOM = require('react-dom');
import React = require('react');
import { TestRun } from '../../ts/types/TestRun';
import { ApplicationStatus } from './applicationStatus';


interface IStatusDisplay {
	testRun: TestRun;
	applicationStatus: ApplicationStatus;
}

declare global {
	module JSX {
		interface IntrinsicElements {
			"x-statusDisplay": any;
			"x-progressBar": any;
		}
	}
}

class StatusDisplay extends React.Component<IStatusDisplay> {

	render() {
		if (this.props.applicationStatus === "welcome") {
			return <><b>Status: </b>No project loaded</>;
		}

		if (this.props.applicationStatus === "stopping") {
			return <>Stopping</>;
		}

		const overallStatus_CssClass = this.props.testRun.NumFailed > 0 ? "failed" : "passed";
		const overallStatus_display = this.props.testRun.NumFailed > 0 ? "Failed" : "Passed";
		const durationSeconds = (this.props.testRun.Duration / 1000).toFixed(1);

		return (
			<>
				<ProgressBar testRun={this.props.testRun} applicationStatus={this.props.applicationStatus} />
				<table style={{fontSize: '10pt', height: '100%'}}>
					<tbody>
						<tr>
							<td className="icon-column" rowSpan={2}>
								<div className={`statusIcon ${overallStatus_CssClass}`}></div>
							</td>
							<td>
								<span className="statusText">{overallStatus_display}</span>
							</td>
							<td className="sundry-column">
								<div className="sundryIcon duration"></div>
								<span className="sundryLabel">Duration: {durationSeconds}s</span>
							</td>
						</tr>
						<tr>
							<td>
								<StatusNumberDetails testRun={this.props.testRun} />
							</td>
							<td className="sundry-column">
								<div className="sundryIcon coverage"></div>
								<span className="sundryLabel">Coverage: N/A</span>
							</td>
						</tr>
					</tbody>
				</table>
			</>
		);
	}
}

/** Micro-widget displaying a breakdown of the test numbers by pass/fail/skipped (the format differs if any failed or not) */
class StatusNumberDetails extends React.Component<{testRun: TestRun}> {
	render() {
		if (this.props.testRun.NumFailed === 0) {
			return (
				<span>{this.props.testRun.IndividualTestResults.length} tests</span>
			);
		}
		else {
			return (
				<span>
					<span className="passFailBadge" style={{padding: '0 3px 0 3px', backgroundColor: '#FE4E4E', color: '#fff', borderRadius: '4px'}}>{this.props.testRun.NumFailed}</span> failed / <span className="passNumberBadge" style={{padding: '0 3px 0 3px', backgroundColor: '#5ED21E', color: '#fff', borderRadius: '4px'}}>{this.props.testRun.NumPassed}</span> passed
				</span>
			);
		}
	}
}

/** Another micro-widget. This actually displays _outside_ of the table layout */
class ProgressBar extends React.Component<IStatusDisplay> {
	render() {
		const percentage = this.props.testRun.Progress;
		const overallStatus_CssClass = this.props.testRun.NumFailed > 0 ? "failed" : "passed";
		const opacity = this.props.applicationStatus === "testing" ? 1 : 0;

		return (
			<x-progressBar class={overallStatus_CssClass} style={{width: `${percentage}%`, opacity: opacity}}></x-progressBar>
		);
	}
}

export function render(testResults: TestRun, applicationStatus: ApplicationStatus) {
	const area = document.getElementsByTagName("x-statusDisplay")[0];
	ReactDOM.render(
		<StatusDisplay testRun={testResults} applicationStatus={applicationStatus} />,
		area);
}