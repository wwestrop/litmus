import { File } from '../../../../lib/LibFs/Fs';
import { IFileLocatorStrategy } from './IFileLocatorStrategy';


/** Heuristic which reads a portion of the file and scans for the occurence of key words
 *  No parsing or analysis is attempted, so the mere presence of the key words may not be meaningful.
 */
export class KeywordSamplingFileLocatorStrategy implements IFileLocatorStrategy {

	private readonly matchers: RegExp[];

	/** @param keywords  The words to watch out for */
	/** @param threshold The number of times ones of the keywords should appear, for us to
	 *                   have confidence that this file should be consumed. */
	constructor(keywords: string[], private readonly threshold: number = 3) {
		this.matchers = keywords.map(k => new RegExp(`\\b${k}\\b`, "g"));
	}

	isFileAcceptable(file: File): boolean {

		const sampledFileContent = file.peek(2048, "utf8");

		let count = 0;
		for(const m of this.matchers) {
			const matches = sampledFileContent.match(m);
			count += matches ? matches.length : 0;

			if (count >= this.threshold) {
				return true;
			}
		}

		return false;
	}
}

export const MochaKeywords = [
	"describe", "it", "context", "specify", "before", "after", "beforeEach", "afterEach",          // BDD
	// "suite", "test", "suiteSetup", "suiteTeardown", "setup", "teardown",
	// TDD, everything else, basically (no support in Litmus for detecting this and configuring the runner yet)
];