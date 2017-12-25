import { ITestRunner } from '../logic/ITestRunner';
import { ITestAdapter } from '../logic/ITestAdapter';
import { LitmusContext } from '../types/LitmusContext';
//import * as Mocha from 'mocha';
import { MochaTestRunner } from './MochaTestRunner';

export class MochaTestAdapter implements ITestAdapter {

	public isCompatible(directory: string, ctxt?: LitmusContext): boolean {

		// TODO actually implement
		return true;

		// TODO parse each file to see if it "somehow" includes mocha module???
		// Check for each ES6 type of syntax?
		// Check for Node require()'s
		// ^ Proper parser...... Or just grep the file and we're likely to get a good enough answer
	}

	public buildTestRunner(directory: string, ctxt?: LitmusContext): ITestRunner {

		/* interface ReporterConstructor {
		new(runner: Mocha.IRunner, options: any): any;
		}*/

		//let m: Mocha = new Mocha();

		// // TODO not recursive?
		// let files = Fs.readdirSync(directory).map(f => Path.join(directory, f)).filter(f => f.endsWith(".js"));
		// files.forEach(f => m.addFile(f));

		// m.run()
		//	 .on("start", (_f: any) => {
		//		 console.log("");
		//	 });

		return new MochaTestRunner(directory);
	}
}