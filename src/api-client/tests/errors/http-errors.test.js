import {
  HTTP_BAD_GATEWAY,
  HTTP_BAD_REQUEST,
  HTTP_FORBIDDEN, HTTP_INTERNAL_SERVER_ERROR, HTTP_SERVICE_UNAVAILABLE,
  HTTP_UNAUTHORIZED,
  HttpError,
} from '../../errors/HttpError.js';

it('does nothing on successful response', () => {
  try {
    HttpError.guard({status: 200});
    HttpError.guard({status: 301});
    expect(true).toBeTruthy(); // No exception should have been raised
  } catch (e) {
    expect(true).toBeFalsy(); // Should not get here
  }
});

it('throws an HttpError when response has a 400+ or a 500+ status', () => {
  const response = {status: 401};
  try {
    HttpError.guard(response);
    expect(false).toBeTruthy(); // Should not get here
  } catch (e) {
    expect(e).toBeInstanceOf(HttpError);
    expect(e.response).toBe(response);
  }
});

it('returns the appropriate status code', () => {
  const Unauthorized = new HttpError({status: 401});
  expect(Unauthorized.statusCode).toBe(401);
  expect(Unauthorized.isClientError()).toBeTruthy();
  expect(Unauthorized.isServerError()).toBeFalsy();
  expect(Unauthorized.isStatusCode(HTTP_UNAUTHORIZED)).toBeTruthy();
  expect(Unauthorized.isStatusCode(HTTP_BAD_REQUEST, HTTP_UNAUTHORIZED)).toBeTruthy();
  expect(Unauthorized.isStatusCode(HTTP_BAD_REQUEST, HTTP_FORBIDDEN)).toBeFalsy();

  const ServiceUnavailable = new HttpError({status: 503});
  expect(ServiceUnavailable.statusCode).toBe(503);
  expect(ServiceUnavailable.isClientError()).toBeFalsy();
  expect(ServiceUnavailable.isServerError()).toBeTruthy();
  expect(ServiceUnavailable.isStatusCode(HTTP_SERVICE_UNAVAILABLE)).toBeTruthy();
  expect(ServiceUnavailable.isStatusCode(HTTP_BAD_GATEWAY, HTTP_SERVICE_UNAVAILABLE)).toBeTruthy();
  expect(ServiceUnavailable.isStatusCode(HTTP_BAD_GATEWAY, HTTP_INTERNAL_SERVER_ERROR)).toBeFalsy();
});
