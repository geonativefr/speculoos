import Filter from './filter';

type Comparison = 'gte' | 'gt' | 'lte' | 'lt';

type Range = {
    [k in Comparison]?: string;
};

export class RangeFilter implements Filter<Range | undefined> {
    constructor(
        private left: number,
        private right: number,
        private includeLeft: boolean = true,
        private includeRight: boolean = true
    ) {}

    normalize(): Range | undefined {
        const output: Range = {};
        if (null != this.left) {
            output[this.includeLeft ? 'gte' : 'gt'] = `${this.left}`;
        }
        if (null != this.right) {
            output[this.includeRight ? 'lte' : 'lt'] = `${this.right}`;
        }

        return Object.keys(output).length > 0 ? output : undefined;
    }

    async denormalize(input: any) {
        if (null == input || 'object' !== typeof input) {
            return;
        }

        if (Object.keys(input).includes('gt')) {
            this.left = parseFloat(input['gt']);
            this.includeLeft = false;
        }

        if (Object.keys(input).includes('gte')) {
            this.left = parseFloat(input['gte']);
            this.includeLeft = true;
        }

        if (Object.keys(input).includes('lt')) {
            this.right = parseFloat(input['lt']);
            this.includeRight = false;
        }

        if (Object.keys(input).includes('lte')) {
            this.right = parseFloat(input['lte']);
            this.includeRight = true;
        }
    }
}
