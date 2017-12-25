//import * as Mocha from "mocha";
import { RunnerFactory } from './logic/RunnerFactory';
import { MochaTestAdapter } from "./mocha/MochaTestAdapter";


let rf = new RunnerFactory([new MochaTestAdapter()]);

var runner = rf.build("C:\\Users\\Will\\Documents\\Git\\langserver-puppet\\client\\server\\test");
var testRun = runner.run();

testRun.Progress.subscribe(n => console.log(`########  Progress: ${n}%\n`));

// throw "Kill it";






// var mi = new Mocha();

// //var er: Mocha.IRunner;

// //e.


// mi.addFile("K:\\Users\\Will\\Git\\langserver-puppet\\client\\server\\test\\contextResolver.test.js");


// const e = mi.run(done)
//	 .on('start', (_a: any) => {
//		 // Seems we cannot catch the start event as it's already fired. I guess we know
//		 // Because of the fact we called `.run()`
//		 console.log('Overall mocha start');
//	 })
//	 .on('suite', (_a: any) => {
//		 console.log('suite');
//	 })
//	 .on('suite end', (_a: any) => {
//		 console.log('suite end');
//	 })
//	 .on('beforeAll', (_a: any) => {
//		 console.log('before all');
//	 })
//	 .on('hook', (_a: any) => {
//		 console.log('hook');
//	 })
//	 .on('test', (_a: any) => {
//		 console.log('Test');
//	 })
//	 .on('test end', (_a: any) => {
//		 console.log('Test end');
//	 })
//	 .on('pass', (_a: any) => {
//		 console.log('pass');
//	 })
//	 .on('fail', (_a: any, _err: any) => {
//		 console.log('fail');
//	 })
//	 .on('waiting', (_a: any) => {
//		 console.log('Waiting');
//	 })
//	 .on('end', (_a: any) => {
//		 console.log('end');
//	 });

// console.log("began, the clone wars have");

// /*console.log(e);


// console.log(m);*/

// function done(failnums: number): void {
//	 console.log("here we are");
//	 console.log(failnums);
//	 console.log(e);
// }