export const HTTP_BAD_REQUEST = 400;
export const HTTP_UNAUTHORIZED = 401;
export const HTTP_PAYMENT_REQUIRED = 402;
export const HTTP_FORBIDDEN = 403;
export const HTTP_NOT_FOUND = 404;
export const HTTP_METHOD_NOT_ALLOWED = 405;
export const HTTP_NOT_ACCEPTABLE = 406;
export const HTTP_PROXY_AUTHENTICATION_REQUIRED = 407;
export const HTTP_REQUEST_TIMEOUT = 408;
export const HTTP_CONFLICT = 409;
export const HTTP_GONE = 410;
export const HTTP_LENGTH_REQUIRED = 411;
export const HTTP_PRECONDITION_FAILED = 412;
export const HTTP_REQUEST_ENTITY_TOO_LARGE = 413;
export const HTTP_REQUEST_URI_TOO_LONG = 414;
export const HTTP_UNSUPPORTED_MEDIA_TYPE = 415;
export const HTTP_REQUESTED_RANGE_NOT_SATISFIABLE = 416;
export const HTTP_EXPECTATION_FAILED = 417;
export const HTTP_I_AM_A_TEAPOT = 418;                                               // RFC2324
export const HTTP_MISDIRECTED_REQUEST = 421;                                         // RFC7540
export const HTTP_UNPROCESSABLE_ENTITY = 422;                                        // RFC4918
export const HTTP_LOCKED = 423;                                                      // RFC4918
export const HTTP_FAILED_DEPENDENCY = 424;                                           // RFC4918
export const HTTP_TOO_EARLY = 425;                                                   // RFC-ietf-httpbis-replay-04
export const HTTP_UPGRADE_REQUIRED = 426;                                            // RFC2817
export const HTTP_PRECONDITION_REQUIRED = 428;                                       // RFC6585
export const HTTP_TOO_MANY_REQUESTS = 429;                                           // RFC6585
export const HTTP_REQUEST_HEADER_FIELDS_TOO_LARGE = 431;                             // RFC6585
export const HTTP_UNAVAILABLE_FOR_LEGAL_REASONS = 451;
export const HTTP_INTERNAL_SERVER_ERROR = 500;
export const HTTP_NOT_IMPLEMENTED = 501;
export const HTTP_BAD_GATEWAY = 502;
export const HTTP_SERVICE_UNAVAILABLE = 503;
export const HTTP_GATEWAY_TIMEOUT = 504;
export const HTTP_VERSION_NOT_SUPPORTED = 505;
export const HTTP_VARIANT_ALSO_NEGOTIATES_EXPERIMENTAL = 506;                        // RFC2295
export const HTTP_INSUFFICIENT_STORAGE = 507;                                        // RFC4918
export const HTTP_LOOP_DETECTED = 508;                                               // RFC5842
export const HTTP_NOT_EXTENDED = 510;                                                // RFC2774
export const HTTP_NETWORK_AUTHENTICATION_REQUIRED = 511;                             // RFC6585

export class HttpError extends Error {
  constructor(response) {
    super(response.statusText);
    this.response = response;
    this.statusCode = parseInt(this.response.status);
  }

  isStatusCode(statusCode) {
    const valid = (statusCode) => parseInt(statusCode) === this.statusCode;
    for (let value of arguments) {
      if (valid(value)) {
        return true;
      }
    }

    return false;
  }

  isClientError() {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  isServerError() {
    return this.statusCode > 500;
  }

  static guard(response) {
    if (response.status >= 400) {
      throw new this(response);
    }

    return response;
  }
}
