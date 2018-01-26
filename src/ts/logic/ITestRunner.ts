import { TestRun } from '../types/TestRun';
import { LitmusContext } from '../types/LitmusContext';
import { Observable } from '../../lib/LibObservable/Observable{T}';

export interface ITestRunner {

	// TODO is this lifecycle method needed?
	// Set up the instrumentation for Instanbul-coverage or something?
	// Or should it not be a lifecycle method, and the runner has to store its
	// own state of whether it's been run or not?
	// Matter of fact, why do I even want to separate out the TestAdapter factory,
	// from the thing that actually runs the tests? 

	// The 'Adapter's live forever, and server only to say, "yes, Mocha supports this folder, here's the runner for it"
	// The `RunnerFactory` - is really just wrapping up a collection of these

	// This lifecycle method implies a postRun()

	// Or................
	// Have the Instanbul instrumentation done automatically for all runners
	// (as the test run result should contain the coverage figure)
	// ..... but what if you run some tests but not all
	// ..... should I calculate the *actual* coverage, based on the unchanged tests???
	// ..... or can coverage only be calculated when running the full shebang?
	// ..... e.g. to account for new tests
	// ..... or new lines of code, driving the percentage down
	// ..... or just display "Coverage: Unavailable" until a full suite run is performed
	preRun(): void;

	run(ctxt?: LitmusContext): Observable<TestRun>;
}