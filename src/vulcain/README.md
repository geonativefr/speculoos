# Vulcain

Little helper to create Vulcain `fields` and/or `preload` headers.

## Usage

```js
import { vulcain } from 'speculoos';
vulcain({fields: ['id', 'name'], preload: ['foo']})
```

Will produce:

```js
{
  fields: '"id", "name", "foo"',
  preload: '"foo"',
}
```
