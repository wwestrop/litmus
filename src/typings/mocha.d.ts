import { IRunner, ITest } from "mocha";

declare namespace Mocha {
	// export interface IRunner extends NodeJS.EventEmitter {
	// 	total: number;
	// }

	// export interface ITest {
	// 	duration: number;
	// 	file?: string;
	// 	err?: Error;
	// 	type: 'test';
	// }

	// export interface ISuite extends NodeJS.EventEmitter {
	// 	// These properties not documented as public or private (only the methods have this documentation)
	// 	// Thus, not sharing these publically in case they break
	// 	suites: ISuite[];
	// 	tests: ITest[];
	// 	pending: boolean;
	// 	root: boolean;

	// 	duration: number;
	// 	file?: string;

	// 	type: 'suite';
	// }

	class Hook {
	// 	//parent: ISuite;
	// 	state: 'failed' | 'passed' | undefined;
	// 	err?: Error;
		type: 'hook';            // the discriminating property

		originalTitle: '"before each" hook' | '"after each" hook' | '"before all" hook' | '"after all" hook';
		foobar: number;
	}

	// namespace Mocha {
	// 	class Hook {
	// 		originalTitle: '"before each" hook' | '"after each" hook' | '"before all" hook' | '"after all" hook';
	// 	}
	// }
}

