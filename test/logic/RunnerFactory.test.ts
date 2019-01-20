import { RunnerFactory } from "../../src/ts/logic/RunnerFactory";
import { ITestAdapter } from '../../src/ts/logic/ITestAdapter';
import { mock, when, anything, instance } from "ts-mockito";
import { TestsNotDiscoveredException } from "../../src/ts/exceptions/TestsNotDiscoveredException";
import { Directory } from "../../lib/LibFs/Fs";
import { MochaTestAdapter } from "../../src/ts/mocha/MochaTestAdapter";
import { LitmusContext } from "../../src/ts/types/LitmusContext";
import { ITestRunner } from "../../src/ts/logic/ITestRunner";
import { throws } from "assert";
import { assert } from 'chai';


// TODO ts-mokito wouldn't let me mock an interface ITestAdapter
abstract class MyAdapter implements ITestAdapter {

	isCompatible(directory: Directory, ctxt?: LitmusContext): boolean {
		throw new Error("Method not implemented.");
	}

	buildTestRunner(directory: Directory, ctxt?: LitmusContext): ITestRunner {
		throw new Error("Method not implemented.");
	}
}

describe("RunnerFactory", () => {

	let incompatibleRunner: ITestAdapter;
	let compatibleRunner: ITestAdapter;

	beforeEach(() => {

		incompatibleRunner = mock(MyAdapter);
		compatibleRunner = mock(MyAdapter);

		when(incompatibleRunner.isCompatible(anything(), anything())).thenReturn(false);
		when(compatibleRunner.isCompatible(anything(), anything())).thenReturn(true);

		incompatibleRunner = instance(incompatibleRunner);
		compatibleRunner = instance(compatibleRunner);
	});


	it("should have some tests", () => {
		throw "It doesn't have any tests";
	});

	it("should return the runner compatible with the inspected directory", () => {
		throw "It doesn't have any tests";
	});

	xit("should return a composite runner if multiple compatible frameworks found in directory", () => {
		throw "TODO we don't support this scenario. Should we?";
	});

	it("should throw if no compatible frameworks found", () => {
		const dir = new Directory("");

		const sut =  new RunnerFactory([incompatibleRunner]);
		try {
			sut.build(dir);
		}
		catch (ex) {
			if (ex instanceof TestsNotDiscoveredException) {
				// Success
				return;
			}
		}

		assert.fail();
	});

});