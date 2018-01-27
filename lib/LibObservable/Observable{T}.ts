
export class Observable<T> {

    constructor(private readonly generatorFunc: (observer: Observer<T>) => void) {
    }

    subscribe(callback: (value: T) => void) {
        let observer: Observer<T> = new Observer<T>(this, callback);
        this.generatorFunc(observer);
    }

}

export class Observer<T> {

    constructor(private readonly observable: Observable<T>, private readonly callback: (value: T) => void) {
    }

    next(value: T): void {
        this.callback(value);
    }

    complete(): void {
        // TODO what behaviour should this have?
	}

	error(error: Error) {
		// TODO what behaviour should this have?
	}

}