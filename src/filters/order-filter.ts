import Filter from './filter';

type order = 'asc' | 'desc';

const reverts: { [k in order]: order } = {
    asc: 'desc',
    desc: 'asc',
};

type Order = { [k: string]: order };

export class OrderFilter implements Filter<Order> {
    constructor(private order: Order = {}) {}

    revert(): OrderFilter {
        const order: Order = {};
        Object.keys(this.order).forEach((key) => {
            const value = this.order[key];
            order[key] = reverts[value] ?? value;
        });

        this.order = order;
        return this;
    }

    normalize(): Order {
        return this.order;
    }

    async denormalize(input?: Order) {
        this.order = {};

        if ('object' === typeof input && null != input) {
            this.order = input;
        }
    }
}
