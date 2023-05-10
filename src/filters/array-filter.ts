import Filter from './filter';

export class ArrayFilter<T> implements Filter<T[]> {
    private values: T[];

    constructor(values = []) {
        this.values = values;
    }

    normalize(): T[] {
        return this.values;
    }

    async denormalize(input: any) {
        if ('string' === typeof input) {
            input = input.trim();
        }

        if ([undefined, null, ''].includes(input)) {
            this.values = [];

            return;
        }

        if (!Array.isArray(input)) {
            input = [input];
        }

        this.values = input;
    }
}
