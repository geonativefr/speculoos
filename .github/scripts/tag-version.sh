#!/usr/bin/env bash
#
# Tags the current commit with the package.json version when a push changed it.
#
# BEFORE is the commit the branch pointed to before the push (github.event.before). When it is
# missing or unknown locally, the version is compared with the first parent of HEAD instead.
# Tags are lightweight and carry no "v" prefix, like the existing ones (1.13.0, 1.13.1...).

set -euo pipefail

read_version() {
  node -e 'process.stdout.write(String(JSON.parse(require("fs").readFileSync(0, "utf8")).version ?? ""))'
}

version=$(git show HEAD:package.json | read_version)

base=''
if [[ -n "${BEFORE:-}" && ! "${BEFORE}" =~ ^0+$ ]] && git cat-file -e "${BEFORE}^{commit}" 2>/dev/null; then
  base=${BEFORE}
elif git rev-parse --verify --quiet 'HEAD^' >/dev/null; then
  base='HEAD^'
fi

previous=''
if [[ -n "${base}" ]] && git cat-file -e "${base}:package.json" 2>/dev/null; then
  previous=$(git show "${base}:package.json" | read_version)
fi

if [[ "${version}" == "${previous}" ]]; then
  echo "Version unchanged (${version}): nothing to tag."
  exit 0
fi

if [[ ! "${version}" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
  echo "::error::package.json version \"${version}\" is not a semantic version." >&2
  exit 1
fi

if [[ -n "$(git ls-remote --tags origin "refs/tags/${version}")" ]]; then
  echo "Version changed from ${previous:-none} to ${version}, but tag ${version} already exists: nothing to do."
  exit 0
fi

echo "Version changed from ${previous:-none} to ${version}: tagging $(git rev-parse --short HEAD)."
git tag "${version}" HEAD
git push origin "refs/tags/${version}"
