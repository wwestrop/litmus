import { IRunner, ITest } from "mocha";

declare module "mocha" {
	export interface IRunner extends NodeJS.EventEmitter {
		total: number;
	}

	export interface ITest {
		duration: number;
		file?: string;
		err?: Error;
		type: 'test';
	}

	export interface ISuite extends NodeJS.EventEmitter {
		// These properties not documented as public or private (only the methods have this documentation)
		// Thus, not sharing these publically in case they break
		suites: ISuite[];
		tests: ITest[];
		pending: boolean;
		root: boolean;

		duration: number;
		file?: string;

		type: 'suite';
	}

	export interface IHook {
		parent: ISuite;
		state: 'failed' | 'passed' | undefined;
		err?: Error;
		type: 'hook';            // the discriminating property

		originalTitle: '"before each" hook' | '"after each" hook' | '"before all" hook' | '"after all" hook';
	}
}

