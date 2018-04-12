import { IRunner, ITest } from "mocha";

declare module "mocha" {
	export interface IRunner extends NodeJS.EventEmitter {
		total: number;
	}

	 export interface ITest {
		duration: number;
		file?: string;
	}
}

