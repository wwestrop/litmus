import { LitmusContext } from '../types/LitmusContext';
import { ITestRunner } from './ITestRunner';

/** "Entry point" for adding test frameworks to Litmus.
 *  Consumed by `RunnerFactory` and used to instiate the objects that will be later used to interact with the user's test cases */
export interface ITestAdapter {

	/** Examines a directory and determines if it contains */ // TODO pass ctxt here? As this interface is exposed to third parties, either we do or we don't, i'm not making it optional
	isCompatible(directory: string, ctxt?: LitmusContext): boolean;

	buildTestRunner(directory: string, ctxt?: LitmusContext): ITestRunner;
}