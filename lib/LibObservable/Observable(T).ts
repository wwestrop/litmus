
export class Observable<T> {

	constructor(private readonly generatorFunc: (observer: Observer<T>) => void) {
	}

	/** @param callback Called as each new value is delivered
	 *  @param completedCallback Called when all available values have been exhausted */
	subscribe(callback: (value: T) => void, completedCallback?: () => void) {
		const observer: Observer<T> = new Observer<T>(callback, completedCallback);
		this.generatorFunc(observer);
	}

}

export class Observer<T> {

	private _completed = false;

	constructor(
		private readonly callback: (value: T) => void,
		private readonly completedCallback?: () => void) {
	}

	next(value: T): void {
		this.callback(value);
	}

	complete(): void {

		if (this._completed) {
			return;
		}

		this._completed = true;
		if (this.completedCallback) {
			this.completedCallback();
		}
	}

	error(error: Error) {
		// TODO what behaviour should this have?
	}

}