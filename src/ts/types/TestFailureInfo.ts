/** TODO basically wrapper round an `Error` object but that doesn't serialise properly across the Electron?
 *  Is there a way to make it work? */
export class TestFailureInfo {
	constructor(public readonly message: string, public readonly stackTrace?: string) {
	}

	public toJSON(): any {
		return {
			message: this.message,
			stackTrace: this.stackTrace,
		};
	}
}