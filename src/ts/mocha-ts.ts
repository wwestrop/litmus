//import * as Mocha from "mocha";
import { RunnerFactory } from './logic/RunnerFactory';
import { MochaTestAdapter } from "./mocha/MochaTestAdapter";
import { Directory } from '../lib/LibFs/Fs';



const rf = new RunnerFactory([new MochaTestAdapter()]);

const directory = new Directory("C:\\Users\\Will\\Documents\\Git\\langserver-puppet\\client\\server\\test");
const runner = rf.build(directory);
const testRun = runner.run();

testRun.subscribe(n => console.log(`######## ${n.NumPassed}+${n.NumFailed} Progress: ${n.Progress}%   [${(n.Duration / 1000).toFixed(1)}s]`));
// testRun.Progress.finally(() => console.log("DONE"));

// throw "Kill it";
