//import * as Mocha from "mocha";
import { RunnerFactory } from './logic/RunnerFactory';
import { MochaTestAdapter } from "./mocha/MochaTestAdapter";



let rf = new RunnerFactory([new MochaTestAdapter()]);

var runner = rf.build("C:\\Users\\Will\\Documents\\Git\\langserver-puppet\\client\\server\\test");
var testRun = runner.run();

testRun.subscribe(n => console.log(`######## ${n.NumPassed}+${n.NumFailed} Progress: ${n.Progress}%   [${(n.Duration / 1000).toFixed(1)}s]`));
// testRun.Progress.finally(() => console.log("DONE"));

// throw "Kill it";
