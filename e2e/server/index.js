const http = require('http');
const { randomUUID } = require('crypto');
const { API_PORT } = require('../ports.js');

/*
 * A fake API Platform serving books and authors in JSON-LD, and a fake Mercure hub on /.well-known/mercure.
 *
 * Each request picks its Hydra form with the X-Hydra-Prefix header: `false` answers as API Platform 4 does by
 * default (hydra_prefix: false, ConstraintViolation), anything else with the `hydra:` prefix.
 *
 * The /_e2e/ endpoints drive the server from the tests: reset the data, read the requests received, make the next
 * matching request fail, publish an update on the hub, list and drop its open streams.
 */

const fixtures = () => ({
  authors: {
    '/api/authors/1': {'@id': '/api/authors/1', '@type': 'Author', name: 'Frank Herbert'},
    '/api/authors/2': {'@id': '/api/authors/2', '@type': 'Author', name: 'Ursula K. Le Guin'},
  },
  books: {
    '/api/books/1': {
      '@id': '/api/books/1',
      '@type': 'Book',
      title: 'Dune',
      author: '/api/authors/1',
      tags: ['fiction'],
      publishedAt: '1965-08-01',
    },
    '/api/books/2': {
      '@id': '/api/books/2',
      '@type': 'Book',
      title: 'The Dispossessed',
      author: '/api/authors/2',
      tags: ['fiction', 'history'],
      publishedAt: '1974-05-01',
    },
  },
  nextBookId: 3,
});

let data = fixtures();
let requests = [];
let failures = [];
const streams = new Set();

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

function send(res, status, body) {
  res.writeHead(status, {...CORS_HEADERS, 'Content-Type': 'application/ld+json; charset=utf-8'});
  res.end(undefined === body ? undefined : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function parseJson(body) {
  try {
    return JSON.parse(body);
  } catch (e) {
    return undefined;
  }
}

function collection(id, members, prefixed) {
  return prefixed
    ? {'@context': '/api/contexts/Book', '@id': id, '@type': 'hydra:Collection', 'hydra:totalItems': members.length, 'hydra:member': members}
    : {'@context': '/api/contexts/Book', '@id': id, '@type': 'Collection', totalItems: members.length, member: members};
}

function error(status, title, detail, prefixed) {
  const body = {'@context': '/api/contexts/Error', '@id': `/api/errors/${status}`, status, detail};
  return prefixed
    ? {...body, '@type': 'hydra:Error', 'hydra:title': title, 'hydra:description': detail}
    : {...body, '@type': 'Error', title, description: detail};
}

function constraintViolations(violations, prefixed) {
  const detail = violations.map(({propertyPath, message}) => `${propertyPath}: ${message}`).join('\n');
  const body = {'@id': `/api/validation_errors/${randomUUID()}`, status: 422, detail, violations};
  return prefixed
    ? {
      ...body,
      '@context': '/api/contexts/ConstraintViolationList',
      '@type': 'ConstraintViolationList',
      'hydra:title': 'An error occurred',
      'hydra:description': detail,
    }
    : {
      ...body,
      '@context': '/api/contexts/ConstraintViolation',
      '@type': 'ConstraintViolation',
      title: 'An error occurred',
      description: detail,
    };
}

function validateBook(book) {
  if ('string' !== typeof book.title || 0 === book.title.trim().length) {
    return [{propertyPath: 'title', message: 'This value should not be blank.', code: 'c1051bb4-d103-4f74-8988-acbcafc7fdc3'}];
  }
  return [];
}

// The query keys of the collection filters: title, tags[] (or tags[0], tags[1]…), publishedAt[after], publishedAt[before]
function filterBooks(books, searchParams) {
  const title = searchParams.get('title');
  const tags = [...searchParams.keys()].filter(key => key.startsWith('tags[')).map(key => searchParams.get(key));
  const after = searchParams.get('publishedAt[after]');
  const before = searchParams.get('publishedAt[before]');

  return books
    .filter(book => null == title || book.title.toLowerCase().includes(title.toLowerCase()))
    .filter(book => 0 === tags.length || tags.some(tag => book.tags.includes(tag)))
    .filter(book => null == after || book.publishedAt >= after)
    .filter(book => null == before || book.publishedAt <= before);
}

async function handleApi(req, res, url, body, prefixed) {
  const path = url.pathname;
  const payload = parseJson(body) ?? {};

  if ('/api/books' === path && 'GET' === req.method) {
    return send(res, 200, collection(path, filterBooks(Object.values(data.books), url.searchParams), prefixed));
  }

  if ('/api/books' === path && 'POST' === req.method) {
    const violations = validateBook(payload);
    if (violations.length > 0) {
      return send(res, 422, constraintViolations(violations, prefixed));
    }
    const iri = `/api/books/${data.nextBookId++}`;
    data.books[iri] = {tags: [], publishedAt: null, author: null, ...payload, '@id': iri, '@type': 'Book'};
    return send(res, 201, data.books[iri]);
  }

  if (path in data.books && 'GET' === req.method) {
    return send(res, 200, data.books[path]);
  }

  if (path in data.books && 'PUT' === req.method) {
    const violations = validateBook(payload);
    if (violations.length > 0) {
      return send(res, 422, constraintViolations(violations, prefixed));
    }
    data.books[path] = {...data.books[path], ...payload, '@id': path, '@type': 'Book'};
    return send(res, 200, data.books[path]);
  }

  if (path in data.books && 'DELETE' === req.method) {
    delete data.books[path];
    return send(res, 204);
  }

  if (path in data.authors && 'GET' === req.method) {
    return send(res, 200, data.authors[path]);
  }

  return send(res, 404, error(404, 'Not Found', `No route found for "${req.method} ${path}".`, prefixed));
}

function openStream(req, res, url) {
  const topics = url.searchParams.getAll('topic');
  if (0 === topics.length) {
    res.writeHead(400, {...CORS_HEADERS, 'Content-Type': 'text/plain'});
    res.end('Missing "topic" parameter');
    return;
  }
  res.socket.setTimeout(0);
  res.writeHead(200, {...CORS_HEADERS, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache'});
  res.write(':\n\n');
  const stream = {topics, res};
  streams.add(stream);
  res.on('close', () => streams.delete(stream));
}

function publish({topic, data: update}) {
  const event = `id: urn:uuid:${randomUUID()}\ndata: ${JSON.stringify(update)}\n\n`;
  let delivered = 0;
  for (const stream of streams) {
    if (stream.topics.includes(topic) || stream.topics.includes('*')) {
      stream.res.write(event);
      delivered++;
    }
  }
  return delivered;
}

function dropStreams() {
  const dropped = streams.size;
  for (const stream of streams) {
    stream.res.destroy();
  }
  streams.clear();
  return dropped;
}

async function handleControl(req, res, url, body) {
  const payload = parseJson(body) ?? {};
  switch (`${req.method} ${url.pathname}`) {
    case 'GET /_e2e/health':
      return send(res, 200, {ok: true});
    case 'POST /_e2e/reset':
      data = fixtures();
      requests = [];
      failures = [];
      dropStreams();
      return send(res, 200, {ok: true});
    case 'GET /_e2e/requests':
      return send(res, 200, requests);
    case 'POST /_e2e/fail':
      failures.push(payload);
      return send(res, 200, {ok: true});
    case 'POST /_e2e/publish':
      return send(res, 200, {delivered: publish(payload)});
    case 'GET /_e2e/streams':
      return send(res, 200, [...streams].map(({topics}) => ({topics})));
    case 'POST /_e2e/drop':
      return send(res, 200, {dropped: dropStreams()});
    default:
      return send(res, 404, {error: `Unknown control endpoint ${req.method} ${url.pathname}`});
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if ('OPTIONS' === req.method) {
      res.writeHead(204, CORS_HEADERS);
      res.end();
      return;
    }

    const body = await readBody(req);
    if (url.pathname.startsWith('/_e2e/')) {
      await handleControl(req, res, url, body);
      return;
    }

    requests.push({
      method: req.method,
      path: url.pathname,
      search: url.search,
      topics: url.searchParams.getAll('topic'),
      headers: req.headers,
      body,
    });

    if ('/.well-known/mercure' === url.pathname && 'GET' === req.method) {
      openStream(req, res, url);
      return;
    }

    const prefixed = 'false' !== req.headers['x-hydra-prefix'];
    const failure = failures.find(({method, path}) => method === req.method && path === url.pathname);
    if (failure) {
      failures.splice(failures.indexOf(failure), 1);
      send(res, failure.status, error(failure.status, http.STATUS_CODES[failure.status], 'The server failed on purpose.', prefixed));
      return;
    }

    await handleApi(req, res, url, body, prefixed);
  } catch (e) {
    console.error(e);
    send(res, 500, {error: e.message});
  }
});

server.listen(API_PORT, '127.0.0.1', () => {
  console.log(`Fake API and Mercure hub listening on http://127.0.0.1:${API_PORT}`);
});
