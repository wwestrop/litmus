//import * as Mocha from "mocha";
import { RunnerFactory } from './logic/RunnerFactory';
import { MochaTestAdapter } from "./mocha/MochaTestAdapter";
import { Directory } from '../lib/LibFs/Fs';
import { TestCase } from './types/TestCase';
import { TestRun } from './types/TestRun';



const rf = new RunnerFactory([new MochaTestAdapter()]);

const directory = new Directory("C:\\Users\\Will\\Documents\\Git\\langserver-puppet\\client\\server\\test");
const runner = rf.build(directory);
const testRun = runner.run();

testRun.subscribe(n => console.log(`######## ${n.NumPassed}+${n.NumFailed} Progress: ${n.Progress}%   [${(n.Duration / 1000).toFixed(1)}s]  - ${bar(n)}`));
// testRun.Progress.finally(() => console.log("DONE"));

// throw "Kill it";

function foo(bar: string[]): string {
	return bar.join(" > ");
}

function bar(foobar: TestRun): string {
	return foo(foobar.IndividualTestResults[foobar.IndividualTestResults.length - 1].TestCase.hierarchy);
}