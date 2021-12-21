class Vulcain {
  fields;
  preload;

  get headers() {
    const output = {};

    if (0 !== (this.preload?.length ?? 0)) {
      output.preload = [...new Set(this.preload)]
        .map(field => `"${field}"`)
        .join(', ');
    }

    if (0 !== (this.fields?.length ?? 0)) {
      output.fields = [...new Set([...this.fields, ...(this.preload ?? [])])]
        .map(field => `"${field}"`)
        .join(', ');
    }

    return output;
  }
}

export function vulcain({fields, preload} = {}) {
  return Object.assign(new Vulcain(), {fields}, {preload}).headers;
}
