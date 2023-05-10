export default interface Filter<T> {
    normalize(): T;

    denormalize(input: any): Promise<void>;
}
