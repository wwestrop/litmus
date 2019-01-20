import React = require('react');


type EmptyScreenViewModel = {
	header: string,
	imageUrl: string,
	callToActionText?: string,
	callToActionPrefix?: string,
	callToActionClicked?(): void,
	callToActionSuffix?: string,
	hint?: string,
};


/** Useful for onboarding, interstitals, or otherwise modal status displays that take up the entire main part of the app window */
export class EmptyScreen extends React.Component<EmptyScreenViewModel> {

	render() {

		const hint = (this.props.hint
			? <div className="hint">Hint: {this.props.hint}</div>
			: <></>);

		return (
			<div className="welcome">
				<div className="leftColumn">
					<img src={this.props.imageUrl} />
				</div>
				<div className="rightColumn">
					<div>
						<h1>{this.props.header}</h1>
						{this.getCallToAction()}
						{hint}
					</div>
				</div>
			</div>
		);
	}

	private getCallToAction() {
		let prefix = this.props.callToActionPrefix;
		const callToAction = this.props.callToActionText;
		let suffix = this.props.callToActionSuffix;

		if (prefix && callToAction) {
			prefix += " ";
		}

		if (callToAction && suffix) {
			suffix = " " + suffix;
		}

		const hyperlink = (callToAction
			? <a id="lnkWelcomeOpen" onClick={e => this.callToActionTextClicked(e)}>{this.props.callToActionText}</a>
			: <></>);

		return <h2>{prefix}{hyperlink}{suffix}</h2>;
	}

	private callToActionTextClicked(e: React.SyntheticEvent<MouseEvent>) {
		if (this.props.callToActionClicked)
		{
			this.props.callToActionClicked();
		}

		e.stopPropagation();
	}
}