import * as Fs from 'fs';
import * as Path from 'path';

export module LibFs {
	export const separator: string = Path.sep;
}

function isDirectory(path: string): boolean | undefined {
	try {
		return Fs.statSync(path).isDirectory();
	}
	catch {
		// TODO don't like swalling any exception like this.
		// Is there ***REALLY*** no way to tell if a path is a directoty or not,
		// without accessing the thing?

		// TODO be more picky with the error codes if I can, still not ideal though

		// TODO and related, does this mean (as I did supect) that perf of all these
		// .stat() calls will be horrific??
		return undefined;
	}
}

// TODO this whole thing should be exported as a module. I'm frankly shocked the built in libs
// have you dealing with such raw primitives
export class FileName {

	public get fullName(): string {
		if (this.prefix && this.extension) {
			return `${this.prefix}.${this.extension}`;
		}
		else if (this.prefix) {
			return this.prefix;
		}
		else {
			return `.${this.extension}`;
		}
	}

	constructor(public readonly prefix?: string, public readonly extension?: string) {
	}

	static fromFullPath(fullPath: string): FileName {

		let prefix: string | undefined;
		let extension: string | undefined;

		const i = fullPath.lastIndexOf(LibFs.separator);
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

		return new FileName(prefix, extension);
	}
}

export class File {
	constructor(public readonly fullPath: string) {
		this.name = FileName.fromFullPath(fullPath);
	}

	public get directory(): Directory {
		// TODO not really any need to compute these every time, though it does separate out each bit of parsing
		// TODO would make Javascript interop easier, as they wouldn't have to call it as a getter function
		const nameLen = this.name.fullName.length;
		const dirName = this.fullPath.substring(0, this.fullPath.length - nameLen);

		return new Directory(dirName);
	}

	public readonly name: FileName;

	// TODO unsure of this API
	// public get stat(): Fs.Stats {
	// 	return Fs.statSync(this.fullPath);
	// }

	public readSync(encoding: string | null): string | Buffer {
		return Fs.readFileSync(this.fullPath, encoding);
	}

	public peek(length: number, encoding: string = "utf8"): string {

		let descriptor: number = 0;
		try {
			descriptor = Fs.openSync(this.fullPath, "r", 0o666);

			const buffer = Buffer.alloc(4096, 0, 'utf8');
			const bytesRead = Fs.readSync(descriptor, buffer, 0, buffer.length, 0);

			return buffer.toString(encoding);
		}
		finally {
			Fs.closeSync(descriptor);
		}
	}
}

export class Directory {
	constructor(public readonly fullPath: string) {
		if (fullPath.endsWith(LibFs.separator)) {
			fullPath = fullPath.substring(0, fullPath.length - LibFs.separator.length);
		}

		const i = fullPath.lastIndexOf(LibFs.separator);
		this.name = fullPath.substring(i + 1);
	}

	public get contents(): (File | Directory)[] {
		return Fs.readdirSync(this.fullPath)
			.map(f => {
				const fullPath = Path.join(this.fullPath, f);
				const isDir = isDirectory(fullPath);
				if (isDir === true) {
					return new Directory(fullPath);
				}
				else if (isDir === false) {
					return new File(fullPath);
				}
				else {
					return undefined;
				}
			})
			.filter(this.isFileSystemEntity);
	}

	public getFilesRecursive(): File[] {
		return this.walkSync(this.fullPath, []);
	}

	private isFileSystemEntity(e: File | Directory | undefined): e is File | Directory {
		return e instanceof File || e instanceof Directory;
	}

	// Adapted from https://gist.github.com/kethinov/6658166
	/** List all files in a directory in Node.js recursively in a synchronous fashion */
	private walkSync(dir: string, accumulator: File[]): File[] {
		const files = Fs.readdirSync(dir);
		files.forEach((file: string) => {
			const fsEntryPath = Path.join(dir, file);
			if (isDirectory(fsEntryPath) === true) {
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