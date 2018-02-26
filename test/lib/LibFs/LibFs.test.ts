import { Directory, File, FileName, LibFs } from '../../../src/lib/LibFs/Fs';
import { assert } from "chai";
import * as Path from 'path';


describe("LibFs", () => {

	function Given() {
		// Force the directory separator to make the tests work cross-platform
		(LibFs.separator as any) = "/";		// Override the const-ness for the tests
	}

	// TODO mock out filesystem access for other component's calls to this library
	// TODO mock out the path separator (tests break in different environments)
	describe("FileName", () => {
		it("fromFullPath parses name", () => {
			Given();

			const sut = FileName.fromFullPath("/etc/xyz/config.yaml");

			assert.equal(sut.extension, "yaml");
			assert.equal(sut.prefix, "config");
		});

		// file with no extension (how does it know if its a file or directory - trailing slash with/without)
		// file which is all extension (e.g. .htaccess)
	});

	// TODO TDD interface

	describe("File", () => {
		it("ctor parses name", () => {
			Given();

			// TODO - this is cheating
			// We technically have a dependency on Fs.sep
			// But who the hell can be bothered to inject that, for one single character, that basically will only be one of two things
			const sut = new File("/etc/xyz/config.yaml");
			assert.equal(sut.directory.fullPath, "/etc/xyz/");

			assert.equal(sut.name.fullName, "config.yaml");
			assert.equal(sut.name.extension, "yaml");
			assert.equal(sut.name.prefix, "config");
		});
	});

	describe("Directory", () => {

		it("ctor parses dirname with trailing slash", () => {
			Given();

			const sut = new Directory("/etc/xyz/");

			assert.equal(sut.fullPath, "/etc/xyz/");
			assert.equal(sut.name, "xyz");
			assert.isFalse(sut.isRoot);
			assert.equal(sut.parent!.name, "etc");
		});

		it("ctor parses dirname without trailing slash", () => {
			Given();

			const sut = new Directory("/etc/xyz");

			assert.equal(sut.fullPath, "/etc/xyz/");
			assert.equal(sut.name, "xyz");
			assert.isFalse(sut.isRoot);
			assert.equal(sut.parent!.name, "etc");
		});

		it("ctor parses dirname containing a dot", () => {
			Given();

			const sut = new Directory("/etc/xyz.foo/");

			assert.equal(sut.fullPath, "/etc/xyz.foo/");
			assert.equal(sut.name, "xyz.foo");
			assert.isFalse(sut.isRoot);
			assert.equal(sut.parent!.name, "etc");
		});

		it("detects when it is the root dir", () => {
			Given();

			// The underlying Node logic appears to be filesystem-specific
			let sut = new Directory("/");
			assert.isTrue(sut.isRoot);

			sut = new Directory("C:\\");
			assert.isTrue(sut.isRoot);

			sut = new Directory("D:\\");
			assert.isTrue(sut.isRoot);

			sut = new Directory("file://");
			assert.isTrue(sut.isRoot);

			sut = new Directory("\\\\UncHost\\");
			assert.isTrue(sut.isRoot);
		});

	});
});