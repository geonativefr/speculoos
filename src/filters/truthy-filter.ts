import Filter from './filter';

type Truthy = string | null;

export class TruthyFilter implements Filter<Truthy> {
    constructor(private value: boolean | null = null) {
        this.value = value;
    }

    normalize(): Truthy {
        if (null == this.value) {
            return null;
        }

        return this.value ? 'true' : 'false';
    }

    async denormalize(input: any) {
        if (null == input) {
            this.value = null;
            return;
        }

        input = `${input}`.trim();

        this.value = ['true', 'on', 'yes', '1'].includes(input.toLowerCase());
    }
}
