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