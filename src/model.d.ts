export type Item = { '@type': string; '@id': string; 'hydra:member'?: Item[] };
export type Collection = Item & { 'hydra:member': Item[] };
export type ClassMap = { [k: string]: class };
