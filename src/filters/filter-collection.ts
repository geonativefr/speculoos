import Filter from './filter';
import empty from 'is-empty';
import { ref, unref } from 'vue';
import { RouteLocation, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import { clone } from '../clone';

function deepPrune(input: any): any {
    if (Array.isArray(input)) {
        return input.map(deepPrune);
    }

    if (!(input instanceof Object)) {
        return input;
    }

    const output = { ...input };
    Object.keys(output).forEach((key) => {
        if (output[key] instanceof Object) {
            output[key] = deepPrune(output[key]);
        }
        if (empty(output[key])) {
            delete output[key];
        }
    });

    return output;
}

type Map<T> = { [k: string]: T };
type FilterMap<T> = Map<Filter<T>>;

export class FilterCollection<T> implements Filter<Map<T>> {
    constructor(private _filters: FilterMap<T> = {}) {}

    normalize(): Map<T> {
        const output: Map<T> = {};
        Object.keys(this._filters).forEach((key) => {
            const filter = this._filters[key];
            output[key] = filter.normalize();
        });

        // Remove filters with null values
        return deepPrune(output);
    }

    async denormalize(input: any) {
        const promises: Promise<void>[] = [];
        Object.keys(this._filters).forEach((key) => {
            const filter = this._filters[key];
            if (input[key]) {
                promises.push(filter.denormalize(input[key]));
            }
        });

        if (promises.length > 0) {
            await Promise.all(promises);
        }
    }
}

export async function useFilters(
    initialState: Function = () => {},
    options = {
        preserveQuery: false,
        targetRoute: undefined,
    }
) {
    const currentRoute = useRoute();
    const router = useRouter();
    const filters = ref(initialState());

    const hydrateFiltersFromRoute = async (route: RouteLocation) => {
        Object.assign(unref(filters), await unref(filters).denormalize(route.query));
    };

    const clear = () => {
        filters.value = clone(initialState());
    };

    const buildQueryParams = (additionalParams = {}) => {
        const output = {};
        if (true === options.preserveQuery) {
            Object.assign(output, currentRoute.query);
        }
        return Object.assign(output, unref(filters).normalize(), additionalParams);
    };

    const submit = async (additionalParams = {}) => {
        const route = unref(options.targetRoute) ?? currentRoute;
        await router.push(Object.assign({ ...route }, { query: buildQueryParams(additionalParams) }));
    };

    onBeforeRouteUpdate((to) => hydrateFiltersFromRoute(to));
    await hydrateFiltersFromRoute(currentRoute);

    return {
        filters,
        buildQueryParams,
        submit,
        clear,
    };
}
