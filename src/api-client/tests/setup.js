function mockResponse(response = {}) {
  const body = response.body ?? '';
  return {
    status: 200,
    statusText: 'OK',
    headers: {},
    body,
    ...response,
    text: async () => body,
    json: async () => JSON.parse(body),
  };
}

const mocks = [];

function matchOnce(request, response) {
  mocks.push({request, response});
}

function nextMock(request) {
  const index = mocks.findIndex(condition => {
    for (const key of Object.keys(condition.request)) {
      if (request[key] !== condition.request[key]) {
        return false;
      }
    }
    return true;
  });
  if (index < 0) {
    return null;
  }
  const nextMock = mocks[index];
  mocks.splice(index, 1);
  return nextMock;
}

async function fetch(url, options) {
  options = {...options};
  const request = {url, options};
  let response = options.response ?? nextMock(request);
  if (!response) {
    throw Error('Could not find response to mock.');
  }
  if ('function' === typeof response) {
    response = await response();
  }
  if (true === request.options.signal?.aborted) {
    const error = new Error;
    error.name = 'AbortError';
    throw error;
  }
  delete options.response;
  response.request = request;
  return mockResponse(response);
}

class Headers {
  constructor(init = {}) {
    Object.assign(this, init);
  }

  keys() {
    return Object.keys(this);
  }

  get(key) {
    return this[key] ?? null;
  }
}

module.exports = {fetch, Headers, mockResponse, matchOnce, mocks};
