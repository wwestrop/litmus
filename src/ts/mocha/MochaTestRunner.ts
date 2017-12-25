import { MochaTestRun } from './MochaTestRun';
import { ITestRunner } from '../logic/ITestRunner';
import { LitmusContext } from '../types/LitmusContext';
import { ITestRun } from '../types/ITestRun';
import * as Fs from 'fs';
import * as Path from 'path';
import * as Mocha from 'mocha';

export class MochaTestRunner implements ITestRunner {

	constructor (private readonly _directory: string) {
	}

	public run(ctxt?: LitmusContext): ITestRun {

		let m = new Mocha();

		// TODO not recursive?
		let files = Fs.readdirSync(this._directory).map(f => Path.join(this._directory, f)).filter(f => f.endsWith(".js"));
		files.forEach(f => m.addFile(f));

		//m.grep(); - if running only a subset of the tests, not all, etc, etc, etc

		return new MochaTestRun(m);
	}

	public preRun(): void {
		throw new Error('Not implemented yet.');
	}

}