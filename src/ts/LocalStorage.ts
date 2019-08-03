import { LibFs } from '../../lib/LibFs/Fs';
import { app } from 'electron';
import * as Fs from 'fs';


const BASE_DIR = `${app.getPath("home")}${LibFs.separator}.litmus`;

export function save<T>(entity: T, filename: string): void {

	const fullFilename = `${BASE_DIR}${LibFs.separator}${filename}.json`;

	const fileContent = JSON.stringify(entity, undefined, 2);

	if (!Fs.existsSync(BASE_DIR)) {
		Fs.mkdirSync(BASE_DIR, 0o600);
	}

	Fs.writeFileSync(fullFilename, fileContent);
}

export function load<T>(filename: string): T | undefined {

	const fullFilename = `${BASE_DIR}${LibFs.separator}${filename}.json`;

	if (!Fs.existsSync(fullFilename)) {
		return undefined;
	}

	const fileContent = Fs.readFileSync(fullFilename, { encoding: "utf8" });

	return JSON.parse(fileContent);
}