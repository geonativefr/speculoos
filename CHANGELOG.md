# Changelog

Notable changes for applications that install Speculoos from this repository. Versions are the git
tags; see `RELEASING.md` for how a release is made.

## 1.14.0

- `vue` and `vue-router` are now peer dependencies (`vue ^3.2.25`, `vue-router ^4.0.12 || ^5.0.0`), so
  applications can use vue-router 5 and no longer get a second copy of either package. They are no
  longer installed with Speculoos: applications must provide `vue` and `vue-router` themselves.
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
- When the `errorHandler` takes care of a failed save without throwing, `useItemForm().submit()`
  resolves to `undefined` and the form keeps what was typed and its last saved state, instead of
  being emptied and switching to creation mode.
- `clone()` copies `Date`, `RegExp`, `Map` and `Set` instances with their data, so a form whose item
  holds a `Date` can be submitted. Private fields (`#field`) are still not supported.
- `FilterCollection.denormalize()` puts the filters missing from the query back to their initial
  state, so navigating to a list without query empties its filter fields. `useFilters()` takes that
  initial state from its `initialState()` function, called again on each route change.
- A filter whose initial value is not empty and that the user empties is dropped from the query, so
  it gets its initial value back after `submit()`.
- `DateRangeFilter` with `withTime: false` puts the picked dates in the query as they are, and reads
  them back as they are, whatever the user's timezone: east of UTC, `after` was one day early; west
  of UTC, `before` was one day late and reading the query back gave the previous day.
- With `reconnectInterval`, a Mercure connection stopped, or left without topics, after an error is
  no longer reopened. Each consecutive failure doubles the delay before the next attempt, up to
  30 seconds (or `reconnectInterval` if it is longer); an open connection resets it.
- Subscribing to or unsubscribing from a topic while the Mercure connection is open reconnects it
  with the new topics, once for all the changes made in the same tick. Nothing changes while `*` is
  subscribed.
- `useMercureSync(mercure, {...})` removes its listeners on unmount unless the options say
  `removeListenersOnUnmount: false`, and also removes them when its effect scope is disposed. Topics
  stay subscribed.
- `mercureSync()` and `synchronize()` accept a ref of an item or of an array, read when each update
  arrives, and each Mercure update is parsed once for all the listeners.
- The Mercure documentation no longer shows a `headers` option: `EventSource` cannot send headers.
- Collections, errors and validation errors of API Platform 4 are read with or without the `hydra:`
  prefix (`hydra_prefix: false`): `member`, `totalItems`, `view`, `search`, `title` and
  `description` are read under their `hydra:` names too, and a `ConstraintViolation` is a
  `ConstraintViolationList`:
  - when a payload carries a key under its `hydra:` name, writing the unprefixed name (`member`,
    `totalItems`, `view`, `search`, `title`, `description`) on the object is ignored: the `hydra:`
    value is kept;
  - a resource whose `@type` is `Collection` or `Error` is now built as a `HydraCollection` or a
    `HydraError`, unless the application's `classmap` maps that type;
  - a `classmap` that replaces the classes of `hydra:Collection`, `hydra:Error` or
    `ConstraintViolationList` does not replace them for `Collection`, `Error` and
    `ConstraintViolation`: map those too.

## 1.13.1

Existing tag `1.13.1`.
