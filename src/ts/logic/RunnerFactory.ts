import { ITestAdapter } from './ITestAdapter';
import { LitmusContext } from '../types/LitmusContext';
import { ITestRunner } from './ITestRunner';
import { Directory } from '../../../lib/LibFs/Fs';
import { TestsNotDiscoveredException } from '../exceptions/TestsNotDiscoveredException';

export class RunnerFactory {

	constructor(private readonly _adapters: ITestAdapter[]) {
	}

	public build(directory: Directory, ctxt?: LitmusContext): ITestRunner {
		const suitableTestAdapter = this._adapters.find(a => a.isCompatible(directory, ctxt));
		if (!suitableTestAdapter) {
			throw new TestsNotDiscoveredException(directory);
		}

		return suitableTestAdapter.buildTestRunner(directory, ctxt);
	}
}