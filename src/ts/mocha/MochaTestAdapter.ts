import { NpmPackage } from '../types/NpmPackage';
import { ITestRunner } from '../logic/ITestRunner';
import { ITestAdapter } from '../logic/ITestAdapter';
import { LitmusContext } from '../types/LitmusContext';
import { MochaTestRunner } from './MochaTestRunner';
import * as Path from 'path';
import * as Fs from 'fs';
import { Directory, File } from '../../lib/LibFs/Fs';

export class MochaTestAdapter implements ITestAdapter {

	public isCompatible(directory: Directory, ctxt?: LitmusContext): boolean {

		const npmPackageFile = this.locatePackageJson(directory);
		if (!npmPackageFile) {
			// TODO test for all these dropout cases
			return false;
		}

		const fileContent = npmPackageFile.readSync("utf8");
		const packageDeps = JSON.parse(<string>fileContent) as NpmPackage;
		if (packageDeps.dependencies["mocha"] || packageDeps.devDependencies["mocha"])
		{
			// TODO also check npm scripts "test", "tests", etc to see if mocha is called there (ie installed globally)
			// TODO only supports having installed mocha via npm???
			return true;
		}

		return false;

		// TODO parse each file to see if it "somehow" includes mocha module???
		// Check for each ES6 type of syntax?
		// Check for Node require()'s
		// ^ Proper parser...... Or just grep the file and we're likely to get a good enough answer
	}

	public buildTestRunner(directory: Directory, ctxt?: LitmusContext): ITestRunner {
		return new MochaTestRunner(directory);
	}

	// TODO test this, since for some reason finding a directory parent, or if we're at root doesn't come built in :'-(
	private locatePackageJson(directory: Directory): File | undefined {

		// TODO e:any is a workaround to a bug in the TS compiler
		// https://github.com/Microsoft/TypeScript/issues/18562
		const packageJsonFile = directory.contents
			.filter((e: any): e is File => e instanceof File)
			.filter(e => e.name.fullName.toLowerCase() === "package.json");

		// TODO what does npm do in the presence of differently-cased "packaged.json"'s ????
		if (packageJsonFile.length === 1) {
			return packageJsonFile[0];
		}
		else {
			if (!directory.parent) {
				return undefined;
			}
			else {
				return this.locatePackageJson(directory.parent);
			}
		}
	}
}