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

## 1.13.1

Existing tag `1.13.1`.
