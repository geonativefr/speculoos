# Changelog

Notable changes for applications that install Speculoos from this repository. Versions are the git
tags; see `RELEASING.md` for how a release is made.

## Unreleased

- `vue` and `vue-router` are now peer dependencies (`vue ^3.2.25`, `vue-router ^4.0.12 || ^5.0.0`), so
  applications can use vue-router 5 and no longer get a second copy of either package.
- `yarn.lock` is committed: installs and builds are reproducible.
- The CI runs lint, tests and build on Node 22 with a frozen lockfile, and fails when the committed
  `dist/` is not the build of `src/`.
- Pushing a change of `version` in `package.json` to `main` now creates the matching git tag.
- `dist/` is rebuilt with the locked toolchain. The bundled dayjs moves to 1.11.23, with two
  behaviour differences:
  - `tz()` on an invalid date returns an invalid date instead of throwing;
  - the format regex changes from `Y{1,4}` to `YYYY|YY`, so a `YYY` or `Y` token is no longer
    parsed as a year.
- A request's own headers, including the `Content-Type` of `post()` and `put()`, are merged into the
  client's headers instead of replacing them: writes and Vulcain requests now keep the client's
  `Accept-Language`, `Authorization`… A request's header replaces the client's header of the same
  name, whatever its case.
- `HttpError.isServerError()` is true for a 500.
- When the `errorHandler` returns without throwing, `fetchItem()`, `getItem()`, `fetchCollection()`,
  `createItem()` and `updateItem()` resolve to `undefined` instead of failing with a `TypeError`.
- `getRelation(fn)` and `getRelations(fn)` reject with the error when the relation cannot be fetched,
  instead of never settling, and stop synchronizing it.
- Cached items are looked up by IRI: storing and getting items no longer slows down as the cache
  grows, and an effect that gets an item no longer runs again when another item is stored.
- `getRelation()` on an embedded object without `@id` returns the object, instead of throwing
  `Invalid item.` when the cache holds any item.
- `fetchCollection()` types each member once instead of twice.
- A request made with an `aborted` ref stops watching it once the request is over.
- `withoutDuplicates()` shares a pending request only with one of the same method, URL, body and
  headers, never shares a request that carries a signal or a body other than a string, and no longer
  turns itself off when the options hold a watched ref such as `isLoading`.
- With `withoutDuplicates()`, a response body is read once.
- `useItemForm().reset()` without argument goes back to the last saved item instead of the initial
  one: after a creation, the form stays in edition mode and the next `submit()` no longer creates a
  duplicate.
- `clone()` copies `Date`, `RegExp`, `Map` and `Set` instances with their data, so a form whose item
  holds a `Date` can be submitted. Private fields (`#field`) are still not supported.
- `FilterCollection.denormalize()` puts the filters missing from the query back to their initial
  state, so navigating to a list without query empties its filter fields. `useFilters()` takes that
  initial state from its `initialState()` function, called again on each route change.
- A filter whose initial value is not empty and that the user empties is dropped from the query, so
  it gets its initial value back after `submit()`.
- `DateRangeFilter` with `withTime: false` puts the picked dates in the query as they are, and reads
  them back as they are, whatever the user's timezone (east of UTC, `after` was a day early).

## 1.13.1

Existing tag `1.13.1`.
