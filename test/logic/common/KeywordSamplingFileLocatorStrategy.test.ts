import { KeywordSamplingFileLocatorStrategy } from "../../../src/ts/logic/common/KeywordSamplingFileLocatorStrategy";
import { mock, when, instance, verify, anyNumber, anyString } from "ts-mockito/lib/ts-mockito";
import { Directory, File, FileName } from '../../../lib/LibFs/Fs';
import { assert } from "chai";


describe("The keyword-sampling FileLocatorStrategy", () => {

	let sut: KeywordSamplingFileLocatorStrategy;
	beforeEach(() => {
		sut = new KeywordSamplingFileLocatorStrategy(["foo", "bar"]);
	});

	function given_a_file(withContents: string): File {
		const file = mock(File);
		when(file.peek(anyNumber(), anyString())).thenReturn(withContents);
		return instance(file);
	}

	it("Rejects a file without any of the keywords", () => {
		const file = given_a_file("Lorem ipsum dolor sit amet, consectetur adipiscing elit");
		assert.isFalse(sut.isFileAcceptable(file));
	});

	it("Rejects a file if the match is a partial word", () => {
		const file = given_a_file("bar barrrrrrrrr foo");
		assert.isFalse(sut.isFileAcceptable(file));
	});

	it("Accepts a file if the match is a partial word (but word is broken by punctation marks)", () => {
		const file = given_a_file("bar= foo( bar(\"hello\" foo.");
		assert.isTrue(sut.isFileAcceptable(file));
	});

	it("Rejects a file with too few of the keywords", () => {
		const file = given_a_file("bar far foo");
		assert.isFalse(sut.isFileAcceptable(file));
	});

	it("Accepts a file with enough of the keywords", () => {
		const file = given_a_file("hello world bar far car bar bar bar bar tar char bar");
		assert.isTrue(sut.isFileAcceptable(file));
	});

	it("Accepts a file with enough of multiple keywords", () => {
		const file = given_a_file("hello foo far car bar foo char tsar");
		assert.isTrue(sut.isFileAcceptable(file));
	});

});