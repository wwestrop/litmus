import { File } from "../../src/ts/fileAccess/GenericFileAccess";

describe("GenericFileAccess", () => {

	it("Testing", () => {
		let f = new File("C:\\Users\\Will\\Documents\\Git\\langserver-puppet\\server\\src\\completionContexts\\ParameterValueContext.ts");
		let d = f.directory;
		let n = f.nameEx;
		let e = f.nameEx.extension;
	});

});