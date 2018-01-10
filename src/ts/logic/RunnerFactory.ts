import { ITestAdapter } from './ITestAdapter';
import { LitmusContext } from '../types/LitmusContext';
import { ITestRunner } from './ITestRunner';
import { Directory } from '../fileAccess/GenericFileAccess';

export class RunnerFactory {

	constructor(private readonly _adapters: ITestAdapter[]) {
	}

	public build(directory: Directory, ctxt?: LitmusContext): ITestRunner {
		const suitableTestAdapter = this._adapters.find(a => a.isCompatible(directory, ctxt));
		if (!suitableTestAdapter) {
			throw `The directory '${directory}' does not contain any tests compatible with Litmus.`
		}

		return suitableTestAdapter.buildTestRunner(directory, ctxt);
	}
}