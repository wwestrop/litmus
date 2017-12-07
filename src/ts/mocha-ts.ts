import * as Mocha from "mocha";

var mi = new Mocha();

//var er: Mocha.IRunner;

//e.


mi.addFile("K:\\Users\\Will\\Git\\langserver-puppet\\client\\server\\test\\contextResolver.test.js");


const e = mi.run(done)
    .on('start', _a => {
        // Seems we cannot catch the start event as it's already fired. I guess we know
        // Because of the fact we called `.run()`
        console.log('Overall mocha start');
    })
    .on('suite', _a => {
        console.log('Overall mocha start');
    })
    .on('suite end', _a => {
        console.log('Overall mocha start');
    })
    .on('beforeAll', _a => {
        console.log('Overall mocha start');
    })
    .on('hook', _a => {
        console.log('Overall mocha start');
    })
    /*.on('test', function(test) {
        console.log('Test started: '+test.title);
        var we = e.started;
    })
    .on('test end', function(test) {
        console.log('Test done: '+test.title);
    })
    .on('pass', function(test) {
        console.log('Test passed');
        console.log(test);
    })
    .on('fail', function(test, err) {
        console.log('Test fail');
        console.log(test);
        console.log(err);
    })*/
    .on('waiting', _a => {
        console.log('All done');
    })
    .on('end', _a => {
        console.log('All done');
    });

console.log("began, the clone wars have");

/*console.log(e);


console.log(m);*/

function done(failnums: number): void {
    console.log("here we are");
    console.log(failnums);
    console.log(e);
}