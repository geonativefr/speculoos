import Filter from './filter';

type Text = string | null;

export class TextFilter implements Filter<Text> {
    constructor(private _value: Text = null) {}

    get value() {
        return this._value;
    }

    set value(value) {
        this._value = !value ? value : value.toString();
    }

    normalize(): Text {
        if ([undefined, null, ''].includes(this.value?.trim())) {
            return null;
        }

        return this.value?.trim() ?? null;
    }

    async denormalize(input: any) {
        if ('string' === typeof input) {
            input = input.trim();
        }

        if ([undefined, null, ''].includes(input)) {
            this.value = null;

            return;
        }

        this.value = input;
    }
}
