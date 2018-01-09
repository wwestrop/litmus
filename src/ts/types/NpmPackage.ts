/** Holds a representation of an npm `package.json` file */
export class NpmPackage {
	public devDependencies: {[packageName: string]: string; }
	public dependencies: {[packageName: string]: string; };
}