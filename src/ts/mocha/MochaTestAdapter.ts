import { NpmPackage } from '../types/NpmPackage';
import { ITestRunner } from '../logic/ITestRunner';
import { ITestAdapter } from '../logic/ITestAdapter';
import { LitmusContext } from '../types/LitmusContext';
//import * as Mocha from 'mocha';
import { MochaTestRunner } from './MochaTestRunner';
import * as Path from 'path';
import * as Fs from 'fs';

export class MochaTestAdapter implements ITestAdapter {

	public isFileCompatible(directory: string, foo: number, ctxt?: LitmusContext): boolean {
		return false;
	}

	public isCompatible(directory: string, ctxt?: LitmusContext): boolean {

		const npmPackageFile = this.locatePackageJson(directory);
		if (!npmPackageFile) {
			// TODO test for all these dropout cases
			return false;
		}

		const fileContent = Fs.readFileSync(npmPackageFile, "utf8");
		const packageDeps = JSON.parse(<string>fileContent) as NpmPackage;
		if (packageDeps.dependencies["mocha"] || packageDeps.devDependencies["mocha"])
		{
			// TODO only supports having installed mocha via npm???
			return true;
		}

		return false;

		// TODO parse each file to see if it "somehow" includes mocha module???
		// Check for each ES6 type of syntax?
		// Check for Node require()'s
		// ^ Proper parser...... Or just grep the file and we're likely to get a good enough answer
	}

	public buildTestRunner(directory: string, ctxt?: LitmusContext): ITestRunner {
		return new MochaTestRunner(directory);
	}

	// TODO test this, since for some reason it doesn't come built in :'-(
	private locatePackageJson(directory: string): string | undefined {

		const probePath = Path.join(directory, "package.json");
		if (Fs.existsSync(probePath))
		{
			return probePath;
		}
		else {
			const parentDir = Path.join(directory, "..");
			if (parentDir === directory) {
				// This is already the root directory.
				// TODO. With JS you can *SEE* why you need tests so much. In any sensible language, I'd expect this to be built in, and not even *THINK* about having to test it
				return undefined;
			}
			else {
				return this.locatePackageJson(parentDir)
			}
		}
	}
}