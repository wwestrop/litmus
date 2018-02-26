import { MochaTestAdapter } from '../../src/ts/mocha/MochaTestAdapter';
import { assert } from 'chai';
import { Directory, File } from '../../src/lib/LibFs/Fs';
import { mock, when, instance } from 'ts-mockito';
import * as Fs from 'fs';

describe("MochaTestAdapter", () => {

	let sut: MochaTestAdapter;
	let otherRandomFile = mock(File);
	let packageJson = mock(File);

	beforeEach(() => {
		sut = new MochaTestAdapter();

		when(otherRandomFile.name.fullName).thenReturn("otherRandomFile.ts");
		when(packageJson.name.fullName).thenReturn("package.json");
	});

	function Given_PackageJson_Contains_WellFormed_Mocha() {
		when(packageJson.readSync("utf8"))
			.thenReturn("{\"dependencies\": {\"thing1\": \"version1\", \"mocha\": \"5.5532\"}}");
	}

	function Given_PackageJson_WellFormed_But_DoesntContain_Mocha() {
		when(packageJson.readSync("utf8"))
			.thenReturn("{\"dependencies\": {\"thing1\": \"version1\", \"thing2\": \"5.5532\"}}");
	}

	function Given_PackageJson_Malformed() {
		when(packageJson.readSync("utf8")).thenReturn("BLAERG!");
	}

	it("isCompatible returns false if no package file found", () => {

		const mockfs = mock(File);
		when(mockfs.fullPath).thenReturn("C:\\ohno\\ohyes.txt");
		when(mockfs.readSync("utf8")).thenReturn("i'm file contnet");
		// when(mockfs.readSync(null)).thenReturn("i'm file contnet");


		Given_PackageJson_Contains_WellFormed_Mocha();

		//let mymock = mock(Fs);
		const mdir = mock(Directory);
		when(mdir.contents).thenReturn([
			instance(otherRandomFile),
			instance(packageJson)
		]);

		const result2 = sut.isCompatible(instance(mdir));

		//sut.bvo(instance(mockfs));

		// we replicate the interface of the mocked type.
		// we also stub-in the 'mock' property. A sort of mixin?
		// this property replicates the interface too, except the types are wrapped in Mock<>
		// this Mock<> has the features we want to do setup/verification on

		// or.... the properties are actually assigned to a DERIVED type
		// we can then do mock(mockfs.myproperty).setup....
		// it can then cast mockfs.myproperty to the derived type that it really as and perform mocking on that
		// the normal code is unaware that its anything other than the mocked type

		/*
		var fsmock = mock.of(Fs);
		fsmock.mock.readFilesSync("foo", "bar").returns(null);
		var mySut = new Sut(fsmock);
		*/


		// How can I possibly test-first a testing library,
		// when the only reason I'm writing it in the first
		// place is I'm unsatisfied with the options I would use to do such a thing

		// With Javascript, in fact, the reason I started creating this tool in the first place,
		// Is I'm sick of being presented a million choices, all half-baked.
		// This time it's mocking libraries that I'm fed up with

		// const mockFile = td.constructor(File);
		// mockFile.prototype.fff = "gjei";
		// var e = new mockFile();
		// // mockFile.name = "paRkage.json"; // TODO cannot do, readonly. So wassa point of a mock then?

		// const dir = td.constructor(Directory);
		// // td.when(dir.getFilesRecursive()).thenReturn([ mockFile ]);

		// // const s = sut.isCompatible(dir);

		// // Arrange
		// const directory = {
		// 	fullPath: "",
		// 	contents: [],
		// 	getFilesRecursive(): File[] {
		// 		return [];
		// 		// TODO should investigate a mocking library. This is going to get tedious to type out every time
		// 	}
		// };

		// // Act
		// const result = sut.isCompatible(directory as any as Directory);

		// // Assert
		// assert.isUndefined(result);
	});

	it("isCompatible returns false if package file does not contain Mocha", () => {
		throw "It doesn't have any tests";
	});

	it("isCompatible returns true if suitable Mocha version located in package file", () => {
		// TODO tests if its using a version of Mocha that we're compatible with???
		throw "It doesn't have any tests";
	});

});