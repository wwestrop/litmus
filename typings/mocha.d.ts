
//// <reference types="Mocha" />

//// <reference types="node" />

// TODO - why are there two files for these typings, with two syntaxes?

declare namespace Mocha {
   interface IRunner extends NodeJS.EventEmitter {
       total: number;
   }

   interface ISuite extends NodeJS.EventEmitter {
       // These properties not documented as public or private (only the methods have this documentation)
       // Thus, not sharing these publically in case they break
       suites: ISuite[];
       tests: Mocha.ITest[];
       pending: boolean;
       root: boolean;

       duration: number;
       file?: string;
   }
}