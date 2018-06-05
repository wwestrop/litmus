import { File } from '../../../../lib/LibFs/Fs';


/** Strategy for determining which of the files in a directory
 * are suitable for loading into the test runner. */
export interface IFileLocatorStrategy {
	isFileAcceptable(file: File): boolean;
}