import { ITestAdapter } from './ITestAdapter';
import { LitmusContext } from '../types/LitmusContext';
import { ITestRunner } from './ITestRunner';

export class RunnerFactory {

	/*private readonly _adapters: ITestAdapter[] = [
		new MochaTestAdapter(),
		new JasmineTestAdapter(),
	];*/

	constructor(private readonly _adapters: ITestAdapter[]) {
	}

	public build(directory: string, ctxt?: LitmusContext): ITestRunner {

		const suitableTestAdapter = this._adapters.find(a => a.isCompatible(directory, ctxt));
		if (!suitableTestAdapter) {
			throw `The directory '${directory}' does not contain any tests compatible with Litmus.`
		}

		// throw "Not implemented";
		return suitableTestAdapter.buildTestRunner(directory, ctxt);
	}
}