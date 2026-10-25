# Speculoos

**Speculoos** is an opinionated set of components to use with Vue and Hydra APIs.

## Components

- [Store](src/store) - A lightweight, extensible global state management store.
- [Api Client](src/api-client) - A JSON-oriented Http Client built on top of _fetch_.
- [Mercure](src/mercure) - A Mercure client.
- [Hydra Plugin](src/hydra) - A hydra plugin for the store.
- [Filters](src/filters) - Manage filters from query string.
- [Vulcain](src/vulcain) - Generate Vulcain headers.
- [Clone](src/clone) - (Deep) clone objects, keeping their prototypes.

## Tests

```bash
yarn test
```

### End-to-end tests

They run a small Vue application on the committed `dist/` (run `yarn build` after changing `src/`) in Chromium, against
the fake API Platform and Mercure hub of `e2e/server`, on ports 4270 and 4271 (`E2E_APP_PORT`, `E2E_API_PORT`).
`SPECULOOS_BUILD=<path to a speculoos.es.js> yarn e2e` runs them on another build.

```bash
npx playwright install chromium # once
yarn e2e
```

## Lint

```bash
yarn lint
```

### Fix

```bash
yarn lint --fix
```

## Build

Please build after each commit.

```bash
yarn build
```
