//import * as Mocha from "mocha";
import { RunnerFactory } from './logic/RunnerFactory';
import { MochaTestAdapter } from "./mocha/MochaTestAdapter";
import { Directory } from '../../lib/LibFs/Fs';
import { TestRun } from './types/TestRun';



const rf = new RunnerFactory([new MochaTestAdapter()]);

const directory = new Directory("K:\\Users\\Will\\Git\\langserver-puppet\\client\\server\\test");
const runner = rf.build(directory);
const testRun = runner.run();

testRun.subscribe(n => {
	console.log(`######## ${n.type}`);
});
// testRun.Progress.finally(() => console.log("DONE"));

// throw "Kill it";
