# sync-fetch-undici
Synchronous wrapper around the Fetch API. Uses the builtin version of `fetch`, based on [`undici`](https://github.com/nodejs/undici).
See [sync-fetch](https://npmjs.com/package/sync-fetch) for a similar package based on [`node-fetch`](https://github.com/node-fetch/node-fetch).

[![npm](https://img.shields.io/npm/v/sync-fetch-undici?style=flat-square)](https://npmjs.com/package/sync-fetch-undici)
[![npm monthly downloads](https://img.shields.io/npm/dm/sync-fetch-undici?style=flat-square)](https://npm-stat.com/charts.html?package=sync-fetch-undici)

## Install

    npm install sync-fetch-undici

In the browser, a browserify bundle can be loaded from CDNs like unpkg.com.

```html
<script src="https://unpkg.com/sync-fetch-undici"></script>
<script src="https://unpkg.com/sync-fetch-undici@VERSION"></script>
```

## Use

```js
const fetch = require('sync-fetch-undici')

const metadata = fetch('https://doi.org/10.7717/peerj-cs.214', {
  headers: {
    Accept: 'application/vnd.citationstyles.csl+json'
  }
}).json()
// arrayBuffer(), blob(), buffer(), json(), and text() supported
```

## Limitations

### Node.js

  - Does not support `Stream` or `Blob` as input body since they cannot be read or serialized synchronously
  - Does not support `FormData` as input body yet as it can contain a `Blob`
  - Does not support `signal` as it cannot be implemented synchronously; instead does support the non-standard
    option `timeout` (a `number` of seconds)
  - `undici` applies some parts of the specification more suited to browser usage; for example setting
    the `Host` header or other ["forbidden request headers"](https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_request_header)
    is not possible.
  - `undici` versions below `7.20.0` contain [a bug](https://github.com/nodejs/undici/issues/4789) breaking
    redirects of `POST` and `PATCH` requests with request bodies. The patched version of `undici` is shipped
    starting with Node.js v24.14.0; no backport for v22 has been made.

### Browser

  - Does not support most options, since `XMLHttpRequest` is pretty limited. Supported are:
    - `method`
    - `body`
    - `headers`
    - `credentials` (but not `omit`)
    - (Non-spec) `timeout`
  - The non-standard `buffer()` and `textConverted()` methods are not supported
  - CORS limitations apply; note they may be stricter for synchronous requests
