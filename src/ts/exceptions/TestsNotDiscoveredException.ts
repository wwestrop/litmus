import { Directory } from '../../../lib/LibFs/Fs';
export class TestsNotDiscoveredException extends Error {

	/** @param directory The dir which was searched and yielded no tests */
	constructor(public readonly directory: Directory) {
		super(`The directory '${directory.name}' does not contain any tests compatible with Litmus.`);
	}
}