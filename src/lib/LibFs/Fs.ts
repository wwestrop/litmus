import * as Fs from 'fs';
import * as Path from 'path';

// TODO this whole thing should be exported as a module. I'm frankly shocked the built in libs
// have you dealing with such raw primitives
export class FileName {
	constructor(public readonly prefix?: string, public readonly extension?: string) {
	}

	static fromFullPath(fullPath: string): FileName {

		let prefix: string | undefined;
		let extension: string | undefined;

		const i = fullPath.lastIndexOf(Path.sep);
		const fileName = fullPath.substring(i + 1);

		const j = fileName.lastIndexOf(".");
		if (j === -1)
		{
			// No dot ==> entire name is the prefix (no extension)
			prefix = fileName;
		}
		else {
			// TODO test with names like .htaccess
			prefix = fileName.substr(0, j);
			extension = fileName.substring(j + 1);
		}

		return new FileName(prefix, extension)
	}
}

export class File {
	constructor(public readonly fullPath: string) {
		this.nameEx = FileName.fromFullPath(fullPath);
	}

	public get directory(): Directory {
		// TODO not really any need to compute these every time, though it does separate out each bit of parsing
		// TODO would make Javascript interop easier, as they wouldn't have to call it as a getter function
		const nameLen = this.name.length;
		const dirName = this.fullPath.substring(0, this.fullPath.length - nameLen);

		return new Directory(dirName);
	}

	// TODO unsure of this API. Should I expose just name, extension, and nameWithExtension?
	public readonly nameEx: FileName;

	public get name(): string {
		return `${this.nameEx.prefix}.${this.nameEx.extension}`;
	}

	// TODO unsure of this API
	// public get stat(): Fs.Stats {
	// 	return Fs.statSync(this.fullPath);
	// }

	public readSync(encoding: string | null): string | Buffer {
		return Fs.readFileSync(this.fullPath, encoding);
	}
}

export class Directory {
	constructor(public readonly fullPath: string) {
		if (fullPath.endsWith(Path.sep)) {
			fullPath = fullPath.substring(0, fullPath.length - Path.sep.length);
		}

		const i = fullPath.lastIndexOf(Path.sep);
		this.name = fullPath.substring(i + 1);
	}

	public get contents(): (File | Directory)[] {
		return Fs.readdirSync(this.fullPath)
			.map(f => {
				const fullPath = Path.join(this.fullPath, f);
				if (Fs.statSync(fullPath).isDirectory()) {
					return new Directory(fullPath);
				}
				else {
					return new File(fullPath);
				}
			});
	}

	public getFilesRecursive(): File[] {
		return this.walkSync(this.fullPath, []);
	}

	// Adapted from https://gist.github.com/kethinov/6658166
	/** List all files in a directory in Node.js recursively in a synchronous fashion */
	private walkSync(dir: string, accumulator: File[]): File[] {
		const files = Fs.readdirSync(dir);
		files.forEach((file: string) => {
			const fsEntryPath = Path.join(dir, file);
			if (Fs.statSync(fsEntryPath).isDirectory()) {
				accumulator = this.walkSync(fsEntryPath, accumulator);
			}
			else {
				const fileObj = new File(fsEntryPath);
				accumulator.push(fileObj);
			}
		});

		return accumulator;
	}

	public get isRoot(): boolean {
		return !this.parent;
	}

	public readonly name: string;

	public get parent(): Directory | undefined {
		const parentDir = Path.join(this.fullPath, "..");
		if (parentDir === this.fullPath) {
			// This is already the root directory.
			// TODO. Test it works with Linux, UNC, HTTP, whatever paths
			return undefined;
		}
		else {
			return new Directory(parentDir);
		}
	}
}