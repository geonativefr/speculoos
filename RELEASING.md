# Releasing

Speculoos is not published on a registry: applications install it from this git repository and
resolve versions from its git tags. The committed `dist/` is what they execute, so it must always
be the build of `src/` (the CI checks it on every pull request).

## Making a release

1. Open a pull request against `main` that:
   - sets `version` in `package.json` to the new version (`1.14.0`, no `v` prefix);
   - lists the changes since the previous tag in `CHANGELOG.md`.
2. Once the CI is green, a maintainer merges it.
3. On the push to `main`, the `Release Workflow` sees that `version` changed and creates the git
   tag of that name on the merged commit. If the tag already exists, it does nothing.

Any other pull request leaves `version` untouched, so merging it creates no tag.

Optionally, create a GitHub release from the new tag to publish release notes.

## Picking up a release in an application

Applications declare the dependency as a git URL with a semver range on tags:

```json
"speculoos": "git+https://github.com/geonativefr/speculoos#^1.14.0"
```

Yarn resolves the range against the repository's tags and records the commit in the
application's `yarn.lock`. A new tag is therefore only picked up on an explicit upgrade:

```bash
yarn upgrade speculoos
```

Commit the updated `yarn.lock` (and `package.json` if the range changed).
