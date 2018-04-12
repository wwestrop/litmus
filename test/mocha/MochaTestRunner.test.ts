
describe("MochaTestRunner", () => {

	it("detects the style of interface used (BDD/TDD/QUnit, etc)", () => {
		// TODO check for a .mocharc file (or equivalent)
		// TODO check npm scripts to see if the interface is passed to Mocha there
		// if not specified anywhere, attempt to infer it, falling back to BDD (the default) if not possible

		// TODO also do this for all other options Mocha may take (gloabls etc????)
		throw "It doesn't have any tests";
	});

	it("filters the tests as requested", () => {
		throw "It doesn't have any tests";
	});

	it("emits TestRun after each test completes", () => {

		// Containing correct percentage
		// Summing the duration
		// With the outcome expected

		throw "It doesn't have any tests";
	});

	it("instruments for code coverage and executes tests based on that", () => {
		// TODO. Can we get sourcemaps when instrumented for coverage?
		// TODO. May be useful to jump to failing line, for debugging tests
		// Research Istanbul -> NYC -> and "nyc mocha"
		throw "It doesn't have any tests";
	});

	it("correctly sets up for async tests", () => {
		// TODO. I've not written any async tests. I don't know how this needs to work
		throw "It doesn't have any tests";
	});

});