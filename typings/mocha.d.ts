
//// <reference types="Mocha" />

//// <reference types="node" />

declare namespace Mocha {
   interface IRunner extends NodeJS.EventEmitter {
   }

   interface ISuite extends NodeJS.EventEmitter {
       // These properties not documented as public or private (only the methods have this documentation)
       // Thus, not sharing these publically in case they break
       suites: ISuite[];
       tests: Mocha.ITest[];
       pending: boolean;
       root: boolean;
   }
}