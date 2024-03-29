var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const import_meta = {};
import { whenever, asyncComputed, until } from "@vueuse/core";
import { unref, isRef, ref, reactive, readonly, inject, computed, onUnmounted } from "vue";
import clone$1 from "clone-deep";
import md5 from "md5";
import empty from "is-empty";
import { useRoute, useRouter, onBeforeRouteUpdate } from "vue-router";
import { URI, QueryString } from "psr7-js";
import { v4 } from "uuid";
import mitt from "mitt";
import uriTemplate from "uri-templates";
class HttpError extends Error {
  constructor(response) {
    super(response.statusText);
    this.response = response;
    this.statusCode = parseInt(this.response.status);
  }
  isStatusCode(statusCode) {
    const valid = (statusCode2) => parseInt(statusCode2) === this.statusCode;
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
class AbortError extends Error {
  constructor(reason) {
    super();
    this.name = "AbortError";
    this.reason = reason;
  }
}
const normalizeHeaders = (headers) => {
  if (!(headers instanceof Headers)) {
    return headers;
  }
  const output = {};
  for (let key of headers.keys()) {
    output[key] = headers.get(key);
  }
  return output;
};
const defaultHeaders = {
  Accept: "application/ld+json, application/json"
};
const tapResponse = async (response) => {
  try {
    const body = await response.text();
    try {
      response.data = JSON.parse(body);
      response.json = () => new Promise((resolve) => resolve(response.data));
    } catch (e) {
      response.data = body;
      response.json = () => new Promise((resolve) => resolve(response.data));
    }
  } catch (e) {
  }
  return response;
};
class ApiClient {
  constructor({ baseUri = "", options = {}, fetcher } = {}) {
    __publicField(this, "baseUri");
    __publicField(this, "options");
    __publicField(this, "fetch");
    var _a;
    this.baseUri = baseUri;
    this.options = options;
    fetcher = fetcher != null ? fetcher : (_a = window.fetch) == null ? void 0 : _a.bind(window);
    this.fetch = async (url, options2) => fetcher(url, options2).then(tapResponse);
  }
  resolve(uri) {
    return new URL(uri, this.baseUri).toString();
  }
  mergeOptions(options) {
    let output = { ...this.options };
    if (Object.keys(output).includes("headers")) {
      output.headers = normalizeHeaders(output.headers);
    }
    for (let argument of arguments) {
      let options2 = { ...argument };
      if (Object.keys(options2).includes("headers")) {
        options2.headers = { ...normalizeHeaders(options2.headers) };
      }
      output = { ...clone$1(output), ...clone$1(options2) };
    }
    return output;
  }
  async request(method, url, options) {
    url = `${unref(url)}`;
    options = this.mergeOptions({ method }, options);
    if (Object.keys(options).includes("headers")) {
      options.headers = new Headers({ ...defaultHeaders, ...normalizeHeaders(options.headers) });
    }
    try {
      if (isRef(options == null ? void 0 : options.isLoading)) {
        options.isLoading.value = true;
      }
      if (isRef(options == null ? void 0 : options.aborted)) {
        const controller = new AbortController();
        const { signal } = controller;
        options.signal = signal;
        whenever(options.aborted, () => controller.abort(), { immediate: true });
      }
      try {
        const response = await this.fetch(url, options);
        return HttpError.guard(response);
      } catch (e) {
        if ("AbortError" === e.name) {
          throw new AbortError(e.reason);
        }
        throw e;
      }
    } finally {
      if (isRef(options == null ? void 0 : options.isLoading)) {
        options.isLoading.value = false;
      }
    }
  }
  async get(uri, options = {}) {
    return await this.request("GET", this.resolve(uri), this.mergeOptions(options));
  }
  async post(uri, data, options = {}) {
    return await this.request("POST", this.resolve(uri), this.mergeOptions(
      {
        body: JSON.stringify(unref(data)),
        headers: {
          "Content-Type": "application/json"
        }
      },
      options
    ));
  }
  async put(uri, data, options = {}) {
    return await this.request("PUT", this.resolve(uri), this.mergeOptions(
      {
        body: JSON.stringify(unref(data)),
        headers: {
          "Content-Type": "application/json"
        }
      },
      options
    ));
  }
  async delete(uri, options = {}) {
    return await this.request("DELETE", this.resolve(uri), this.mergeOptions(options));
  }
}
class PreventDuplicates {
  constructor(fetcher = ((_a) => (_a = window.fetch) == null ? void 0 : _a.bind(window))()) {
    __publicField(this, "fetch");
    __publicField(this, "pendingRequests", []);
    this.fetch = fetcher;
    return (url, options) => {
      try {
        const hash = md5(JSON.stringify({ url, ...options }));
        const index = this.pendingRequests.findIndex((pending) => hash === pending.hash);
        if (index >= 0) {
          return this.pendingRequests[index].promise;
        }
        const promise = this.fetch(url, options).then(tapResponse);
        this.pendingRequests.push({ hash, promise });
        return promise.then(
          (result) => {
            this.removePendingRequest(hash);
            return result;
          },
          (error) => {
            this.removePendingRequest(hash);
            throw error;
          }
        );
      } catch (e) {
        return this.fetch(url, options);
      }
    };
  }
  removePendingRequest(hash) {
    const index = this.pendingRequests.findIndex((pending) => hash === pending.hash);
    if (index >= 0) {
      this.pendingRequests.splice(index, 1);
    }
  }
}
function withoutDuplicates(fetcher = void 0) {
  return new PreventDuplicates(fetcher);
}
const clone = (orig, deep = true, duplicates = []) => {
  if ("object" !== typeof orig || null == orig) {
    return orig;
  }
  const duplicate = duplicates.find((item) => item.orig === orig);
  if (null != duplicate) {
    return duplicate.cloned;
  }
  let cloned = Object.assign(Object.create(Object.getPrototypeOf(orig)), orig);
  if (Array.isArray(orig)) {
    cloned = Object.values(cloned);
  }
  duplicates.push({ orig, cloned });
  if (deep) {
    for (const prop in cloned) {
      if ("object" === typeof cloned[prop] && null != cloned[prop]) {
        cloned[prop] = clone(cloned[prop], deep, duplicates);
      }
    }
  }
  if ("__clone" in cloned && "function" === typeof cloned.__clone) {
    cloned.__clone();
  }
  return cloned;
};
class Filter {
  normalize() {
    throw Error("This method is meant to be overriden.");
  }
  async denormalize(input) {
    throw Error("This method is meant to be overriden.");
  }
}
class ArrayFilter extends Filter {
  constructor(values = []) {
    super();
    __publicField(this, "values");
    this.values = values;
  }
  normalize() {
    return this.values;
  }
  async denormalize(input) {
    if ("string" === typeof input) {
      input = input.trim();
    }
    if ([void 0, null, ""].includes(input)) {
      this.values = [];
      return;
    }
    if (!Array.isArray(input)) {
      input = [input];
    }
    this.values = input;
  }
}
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
var dayjs_min = { exports: {} };
(function(module, exports) {
  !function(t, e) {
    module.exports = e();
  }(commonjsGlobal, function() {
    var t = 1e3, e = 6e4, n = 36e5, r = "millisecond", i = "second", s = "minute", u = "hour", a = "day", o = "week", f = "month", h = "quarter", c = "year", d = "date", $ = "Invalid Date", l = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/, y = /\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g, M = { name: "en", weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"), months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_") }, m = function(t2, e2, n2) {
      var r2 = String(t2);
      return !r2 || r2.length >= e2 ? t2 : "" + Array(e2 + 1 - r2.length).join(n2) + t2;
    }, g = { s: m, z: function(t2) {
      var e2 = -t2.utcOffset(), n2 = Math.abs(e2), r2 = Math.floor(n2 / 60), i2 = n2 % 60;
      return (e2 <= 0 ? "+" : "-") + m(r2, 2, "0") + ":" + m(i2, 2, "0");
    }, m: function t2(e2, n2) {
      if (e2.date() < n2.date())
        return -t2(n2, e2);
      var r2 = 12 * (n2.year() - e2.year()) + (n2.month() - e2.month()), i2 = e2.clone().add(r2, f), s2 = n2 - i2 < 0, u2 = e2.clone().add(r2 + (s2 ? -1 : 1), f);
      return +(-(r2 + (n2 - i2) / (s2 ? i2 - u2 : u2 - i2)) || 0);
    }, a: function(t2) {
      return t2 < 0 ? Math.ceil(t2) || 0 : Math.floor(t2);
    }, p: function(t2) {
      return { M: f, y: c, w: o, d: a, D: d, h: u, m: s, s: i, ms: r, Q: h }[t2] || String(t2 || "").toLowerCase().replace(/s$/, "");
    }, u: function(t2) {
      return void 0 === t2;
    } }, v = "en", D = {};
    D[v] = M;
    var p = function(t2) {
      return t2 instanceof _;
    }, S = function t2(e2, n2, r2) {
      var i2;
      if (!e2)
        return v;
      if ("string" == typeof e2) {
        var s2 = e2.toLowerCase();
        D[s2] && (i2 = s2), n2 && (D[s2] = n2, i2 = s2);
        var u2 = e2.split("-");
        if (!i2 && u2.length > 1)
          return t2(u2[0]);
      } else {
        var a2 = e2.name;
        D[a2] = e2, i2 = a2;
      }
      return !r2 && i2 && (v = i2), i2 || !r2 && v;
    }, w = function(t2, e2) {
      if (p(t2))
        return t2.clone();
      var n2 = "object" == typeof e2 ? e2 : {};
      return n2.date = t2, n2.args = arguments, new _(n2);
    }, O = g;
    O.l = S, O.i = p, O.w = function(t2, e2) {
      return w(t2, { locale: e2.$L, utc: e2.$u, x: e2.$x, $offset: e2.$offset });
    };
    var _ = function() {
      function M2(t2) {
        this.$L = S(t2.locale, null, true), this.parse(t2);
      }
      var m2 = M2.prototype;
      return m2.parse = function(t2) {
        this.$d = function(t3) {
          var e2 = t3.date, n2 = t3.utc;
          if (null === e2)
            return new Date(NaN);
          if (O.u(e2))
            return new Date();
          if (e2 instanceof Date)
            return new Date(e2);
          if ("string" == typeof e2 && !/Z$/i.test(e2)) {
            var r2 = e2.match(l);
            if (r2) {
              var i2 = r2[2] - 1 || 0, s2 = (r2[7] || "0").substring(0, 3);
              return n2 ? new Date(Date.UTC(r2[1], i2, r2[3] || 1, r2[4] || 0, r2[5] || 0, r2[6] || 0, s2)) : new Date(r2[1], i2, r2[3] || 1, r2[4] || 0, r2[5] || 0, r2[6] || 0, s2);
            }
          }
          return new Date(e2);
        }(t2), this.$x = t2.x || {}, this.init();
      }, m2.init = function() {
        var t2 = this.$d;
        this.$y = t2.getFullYear(), this.$M = t2.getMonth(), this.$D = t2.getDate(), this.$W = t2.getDay(), this.$H = t2.getHours(), this.$m = t2.getMinutes(), this.$s = t2.getSeconds(), this.$ms = t2.getMilliseconds();
      }, m2.$utils = function() {
        return O;
      }, m2.isValid = function() {
        return !(this.$d.toString() === $);
      }, m2.isSame = function(t2, e2) {
        var n2 = w(t2);
        return this.startOf(e2) <= n2 && n2 <= this.endOf(e2);
      }, m2.isAfter = function(t2, e2) {
        return w(t2) < this.startOf(e2);
      }, m2.isBefore = function(t2, e2) {
        return this.endOf(e2) < w(t2);
      }, m2.$g = function(t2, e2, n2) {
        return O.u(t2) ? this[e2] : this.set(n2, t2);
      }, m2.unix = function() {
        return Math.floor(this.valueOf() / 1e3);
      }, m2.valueOf = function() {
        return this.$d.getTime();
      }, m2.startOf = function(t2, e2) {
        var n2 = this, r2 = !!O.u(e2) || e2, h2 = O.p(t2), $2 = function(t3, e3) {
          var i2 = O.w(n2.$u ? Date.UTC(n2.$y, e3, t3) : new Date(n2.$y, e3, t3), n2);
          return r2 ? i2 : i2.endOf(a);
        }, l2 = function(t3, e3) {
          return O.w(n2.toDate()[t3].apply(n2.toDate("s"), (r2 ? [0, 0, 0, 0] : [23, 59, 59, 999]).slice(e3)), n2);
        }, y2 = this.$W, M3 = this.$M, m3 = this.$D, g2 = "set" + (this.$u ? "UTC" : "");
        switch (h2) {
          case c:
            return r2 ? $2(1, 0) : $2(31, 11);
          case f:
            return r2 ? $2(1, M3) : $2(0, M3 + 1);
          case o:
            var v2 = this.$locale().weekStart || 0, D2 = (y2 < v2 ? y2 + 7 : y2) - v2;
            return $2(r2 ? m3 - D2 : m3 + (6 - D2), M3);
          case a:
          case d:
            return l2(g2 + "Hours", 0);
          case u:
            return l2(g2 + "Minutes", 1);
          case s:
            return l2(g2 + "Seconds", 2);
          case i:
            return l2(g2 + "Milliseconds", 3);
          default:
            return this.clone();
        }
      }, m2.endOf = function(t2) {
        return this.startOf(t2, false);
      }, m2.$set = function(t2, e2) {
        var n2, o2 = O.p(t2), h2 = "set" + (this.$u ? "UTC" : ""), $2 = (n2 = {}, n2[a] = h2 + "Date", n2[d] = h2 + "Date", n2[f] = h2 + "Month", n2[c] = h2 + "FullYear", n2[u] = h2 + "Hours", n2[s] = h2 + "Minutes", n2[i] = h2 + "Seconds", n2[r] = h2 + "Milliseconds", n2)[o2], l2 = o2 === a ? this.$D + (e2 - this.$W) : e2;
        if (o2 === f || o2 === c) {
          var y2 = this.clone().set(d, 1);
          y2.$d[$2](l2), y2.init(), this.$d = y2.set(d, Math.min(this.$D, y2.daysInMonth())).$d;
        } else
          $2 && this.$d[$2](l2);
        return this.init(), this;
      }, m2.set = function(t2, e2) {
        return this.clone().$set(t2, e2);
      }, m2.get = function(t2) {
        return this[O.p(t2)]();
      }, m2.add = function(r2, h2) {
        var d2, $2 = this;
        r2 = Number(r2);
        var l2 = O.p(h2), y2 = function(t2) {
          var e2 = w($2);
          return O.w(e2.date(e2.date() + Math.round(t2 * r2)), $2);
        };
        if (l2 === f)
          return this.set(f, this.$M + r2);
        if (l2 === c)
          return this.set(c, this.$y + r2);
        if (l2 === a)
          return y2(1);
        if (l2 === o)
          return y2(7);
        var M3 = (d2 = {}, d2[s] = e, d2[u] = n, d2[i] = t, d2)[l2] || 1, m3 = this.$d.getTime() + r2 * M3;
        return O.w(m3, this);
      }, m2.subtract = function(t2, e2) {
        return this.add(-1 * t2, e2);
      }, m2.format = function(t2) {
        var e2 = this, n2 = this.$locale();
        if (!this.isValid())
          return n2.invalidDate || $;
        var r2 = t2 || "YYYY-MM-DDTHH:mm:ssZ", i2 = O.z(this), s2 = this.$H, u2 = this.$m, a2 = this.$M, o2 = n2.weekdays, f2 = n2.months, h2 = function(t3, n3, i3, s3) {
          return t3 && (t3[n3] || t3(e2, r2)) || i3[n3].slice(0, s3);
        }, c2 = function(t3) {
          return O.s(s2 % 12 || 12, t3, "0");
        }, d2 = n2.meridiem || function(t3, e3, n3) {
          var r3 = t3 < 12 ? "AM" : "PM";
          return n3 ? r3.toLowerCase() : r3;
        }, l2 = { YY: String(this.$y).slice(-2), YYYY: this.$y, M: a2 + 1, MM: O.s(a2 + 1, 2, "0"), MMM: h2(n2.monthsShort, a2, f2, 3), MMMM: h2(f2, a2), D: this.$D, DD: O.s(this.$D, 2, "0"), d: String(this.$W), dd: h2(n2.weekdaysMin, this.$W, o2, 2), ddd: h2(n2.weekdaysShort, this.$W, o2, 3), dddd: o2[this.$W], H: String(s2), HH: O.s(s2, 2, "0"), h: c2(1), hh: c2(2), a: d2(s2, u2, true), A: d2(s2, u2, false), m: String(u2), mm: O.s(u2, 2, "0"), s: String(this.$s), ss: O.s(this.$s, 2, "0"), SSS: O.s(this.$ms, 3, "0"), Z: i2 };
        return r2.replace(y, function(t3, e3) {
          return e3 || l2[t3] || i2.replace(":", "");
        });
      }, m2.utcOffset = function() {
        return 15 * -Math.round(this.$d.getTimezoneOffset() / 15);
      }, m2.diff = function(r2, d2, $2) {
        var l2, y2 = O.p(d2), M3 = w(r2), m3 = (M3.utcOffset() - this.utcOffset()) * e, g2 = this - M3, v2 = O.m(this, M3);
        return v2 = (l2 = {}, l2[c] = v2 / 12, l2[f] = v2, l2[h] = v2 / 3, l2[o] = (g2 - m3) / 6048e5, l2[a] = (g2 - m3) / 864e5, l2[u] = g2 / n, l2[s] = g2 / e, l2[i] = g2 / t, l2)[y2] || g2, $2 ? v2 : O.a(v2);
      }, m2.daysInMonth = function() {
        return this.endOf(f).$D;
      }, m2.$locale = function() {
        return D[this.$L];
      }, m2.locale = function(t2, e2) {
        if (!t2)
          return this.$L;
        var n2 = this.clone(), r2 = S(t2, e2, true);
        return r2 && (n2.$L = r2), n2;
      }, m2.clone = function() {
        return O.w(this.$d, this);
      }, m2.toDate = function() {
        return new Date(this.valueOf());
      }, m2.toJSON = function() {
        return this.isValid() ? this.toISOString() : null;
      }, m2.toISOString = function() {
        return this.$d.toISOString();
      }, m2.toString = function() {
        return this.$d.toUTCString();
      }, M2;
    }(), T = _.prototype;
    return w.prototype = T, [["$ms", r], ["$s", i], ["$m", s], ["$H", u], ["$W", a], ["$M", f], ["$y", c], ["$D", d]].forEach(function(t2) {
      T[t2[1]] = function(e2) {
        return this.$g(e2, t2[0], t2[1]);
      };
    }), w.extend = function(t2, e2) {
      return t2.$i || (t2(e2, _, w), t2.$i = true), w;
    }, w.locale = S, w.isDayjs = p, w.unix = function(t2) {
      return w(1e3 * t2);
    }, w.en = D[v], w.Ls = D, w.p = {}, w;
  });
})(dayjs_min);
var dayjs = dayjs_min.exports;
var utc$1 = { exports: {} };
(function(module, exports) {
  !function(t, i) {
    module.exports = i();
  }(commonjsGlobal, function() {
    var t = "minute", i = /[+-]\d\d(?::?\d\d)?/g, e = /([+-]|\d\d)/g;
    return function(s, f, n) {
      var u = f.prototype;
      n.utc = function(t2) {
        var i2 = { date: t2, utc: true, args: arguments };
        return new f(i2);
      }, u.utc = function(i2) {
        var e2 = n(this.toDate(), { locale: this.$L, utc: true });
        return i2 ? e2.add(this.utcOffset(), t) : e2;
      }, u.local = function() {
        return n(this.toDate(), { locale: this.$L, utc: false });
      };
      var o = u.parse;
      u.parse = function(t2) {
        t2.utc && (this.$u = true), this.$utils().u(t2.$offset) || (this.$offset = t2.$offset), o.call(this, t2);
      };
      var r = u.init;
      u.init = function() {
        if (this.$u) {
          var t2 = this.$d;
          this.$y = t2.getUTCFullYear(), this.$M = t2.getUTCMonth(), this.$D = t2.getUTCDate(), this.$W = t2.getUTCDay(), this.$H = t2.getUTCHours(), this.$m = t2.getUTCMinutes(), this.$s = t2.getUTCSeconds(), this.$ms = t2.getUTCMilliseconds();
        } else
          r.call(this);
      };
      var a = u.utcOffset;
      u.utcOffset = function(s2, f2) {
        var n2 = this.$utils().u;
        if (n2(s2))
          return this.$u ? 0 : n2(this.$offset) ? a.call(this) : this.$offset;
        if ("string" == typeof s2 && (s2 = function(t2) {
          void 0 === t2 && (t2 = "");
          var s3 = t2.match(i);
          if (!s3)
            return null;
          var f3 = ("" + s3[0]).match(e) || ["-", 0, 0], n3 = f3[0], u3 = 60 * +f3[1] + +f3[2];
          return 0 === u3 ? 0 : "+" === n3 ? u3 : -u3;
        }(s2), null === s2))
          return this;
        var u2 = Math.abs(s2) <= 16 ? 60 * s2 : s2, o2 = this;
        if (f2)
          return o2.$offset = u2, o2.$u = 0 === s2, o2;
        if (0 !== s2) {
          var r2 = this.$u ? this.toDate().getTimezoneOffset() : -1 * this.utcOffset();
          (o2 = this.local().add(u2 + r2, t)).$offset = u2, o2.$x.$localOffset = r2;
        } else
          o2 = this.utc();
        return o2;
      };
      var h = u.format;
      u.format = function(t2) {
        var i2 = t2 || (this.$u ? "YYYY-MM-DDTHH:mm:ss[Z]" : "");
        return h.call(this, i2);
      }, u.valueOf = function() {
        var t2 = this.$utils().u(this.$offset) ? 0 : this.$offset + (this.$x.$localOffset || this.$d.getTimezoneOffset());
        return this.$d.valueOf() - 6e4 * t2;
      }, u.isUTC = function() {
        return !!this.$u;
      }, u.toISOString = function() {
        return this.toDate().toISOString();
      }, u.toString = function() {
        return this.toDate().toUTCString();
      };
      var l = u.toDate;
      u.toDate = function(t2) {
        return "s" === t2 && this.$offset ? n(this.format("YYYY-MM-DD HH:mm:ss:SSS")).toDate() : l.call(this);
      };
      var c = u.diff;
      u.diff = function(t2, i2, e2) {
        if (t2 && this.$u === t2.$u)
          return c.call(this, t2, i2, e2);
        var s2 = this.local(), f2 = n(t2).local();
        return c.call(s2, f2, i2, e2);
      };
    };
  });
})(utc$1);
var utc = utc$1.exports;
var timezone$1 = { exports: {} };
(function(module, exports) {
  !function(t, e) {
    module.exports = e();
  }(commonjsGlobal, function() {
    var t = { year: 0, month: 1, day: 2, hour: 3, minute: 4, second: 5 }, e = {};
    return function(n, i, o) {
      var r, a = function(t2, n2, i2) {
        void 0 === i2 && (i2 = {});
        var o2 = new Date(t2), r2 = function(t3, n3) {
          void 0 === n3 && (n3 = {});
          var i3 = n3.timeZoneName || "short", o3 = t3 + "|" + i3, r3 = e[o3];
          return r3 || (r3 = new Intl.DateTimeFormat("en-US", { hour12: false, timeZone: t3, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: i3 }), e[o3] = r3), r3;
        }(n2, i2);
        return r2.formatToParts(o2);
      }, u = function(e2, n2) {
        for (var i2 = a(e2, n2), r2 = [], u2 = 0; u2 < i2.length; u2 += 1) {
          var f2 = i2[u2], s2 = f2.type, m = f2.value, c = t[s2];
          c >= 0 && (r2[c] = parseInt(m, 10));
        }
        var d = r2[3], l = 24 === d ? 0 : d, v = r2[0] + "-" + r2[1] + "-" + r2[2] + " " + l + ":" + r2[4] + ":" + r2[5] + ":000", h = +e2;
        return (o.utc(v).valueOf() - (h -= h % 1e3)) / 6e4;
      }, f = i.prototype;
      f.tz = function(t2, e2) {
        void 0 === t2 && (t2 = r);
        var n2 = this.utcOffset(), i2 = this.toDate(), a2 = i2.toLocaleString("en-US", { timeZone: t2 }), u2 = Math.round((i2 - new Date(a2)) / 1e3 / 60), f2 = o(a2).$set("millisecond", this.$ms).utcOffset(15 * -Math.round(i2.getTimezoneOffset() / 15) - u2, true);
        if (e2) {
          var s2 = f2.utcOffset();
          f2 = f2.add(n2 - s2, "minute");
        }
        return f2.$x.$timezone = t2, f2;
      }, f.offsetName = function(t2) {
        var e2 = this.$x.$timezone || o.tz.guess(), n2 = a(this.valueOf(), e2, { timeZoneName: t2 }).find(function(t3) {
          return "timezonename" === t3.type.toLowerCase();
        });
        return n2 && n2.value;
      };
      var s = f.startOf;
      f.startOf = function(t2, e2) {
        if (!this.$x || !this.$x.$timezone)
          return s.call(this, t2, e2);
        var n2 = o(this.format("YYYY-MM-DD HH:mm:ss:SSS"));
        return s.call(n2, t2, e2).tz(this.$x.$timezone, true);
      }, o.tz = function(t2, e2, n2) {
        var i2 = n2 && e2, a2 = n2 || e2 || r, f2 = u(+o(), a2);
        if ("string" != typeof t2)
          return o(t2).tz(a2);
        var s2 = function(t3, e3, n3) {
          var i3 = t3 - 60 * e3 * 1e3, o2 = u(i3, n3);
          if (e3 === o2)
            return [i3, e3];
          var r2 = u(i3 -= 60 * (o2 - e3) * 1e3, n3);
          return o2 === r2 ? [i3, o2] : [t3 - 60 * Math.min(o2, r2) * 1e3, Math.max(o2, r2)];
        }(o.utc(t2, i2).valueOf(), f2, a2), m = s2[0], c = s2[1], d = o(m).utcOffset(c);
        return d.$x.$timezone = a2, d;
      }, o.tz.guess = function() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      }, o.tz.setDefault = function(t2) {
        r = t2;
      };
    };
  });
})(timezone$1);
var timezone = timezone$1.exports;
dayjs.extend(utc);
dayjs.extend(timezone);
class DateRangeFilter extends Filter {
  constructor({ after = null, before = null } = {}, { withTime = true, useUserTimezone = true } = {}) {
    super();
    __publicField(this, "after");
    __publicField(this, "before");
    __publicField(this, "normalizedFormat");
    __publicField(this, "useUserTimezone");
    this.after = after;
    this.before = before;
    this.normalizedFormat = withTime ? "YYYY-MM-DD[T]HH:mm:ss[Z]" : "YYYY-MM-DD";
    this.useUserTimezone = useUserTimezone;
  }
  normalize() {
    this.constructor.ensureTimezoneIsSet();
    const timezone2 = this.useUserTimezone ? this.constructor.userTimezone : "UTC";
    let after = null;
    let before = null;
    if (!empty(this.after)) {
      after = dayjs.tz(this.after, timezone2).hour(0).minute(0).second(0).tz("UTC").format(this.normalizedFormat);
    }
    if (!empty(this.before)) {
      before = dayjs.tz(this.before, timezone2).hour(0).minute(0).second(0).add(1, "day").subtract(1, "second").tz("UTC").format(this.normalizedFormat);
    }
    return { after, before };
  }
  async denormalize(input) {
    this.constructor.ensureTimezoneIsSet();
    this.after = null;
    this.before = null;
    if (!empty(input.after)) {
      this.after = this.useUserTimezone ? dayjs.tz(input.after, "UTC").tz(this.constructor.userTimezone) : dayjs.tz(input.after, "UTC");
      this.after = this.after.hour(0).minute(0).second(0).format("YYYY-MM-DD");
    }
    if (!empty(input.before)) {
      this.before = this.useUserTimezone ? dayjs.tz(input.before, "UTC").tz(this.constructor.userTimezone) : dayjs.tz(input.before, "UTC");
      this.before = this.before.hour(0).minute(0).second(0).add(1, "day").subtract(1, "second").format("YYYY-MM-DD");
    }
  }
  static ensureTimezoneIsSet() {
    var _a;
    this.constructor.userTimezone = (_a = this.constructor.userTimezone) != null ? _a : dayjs.tz.guess() || "UTC";
  }
}
__publicField(DateRangeFilter, "userTimezone");
dayjs.extend(utc);
dayjs.extend(timezone);
class DatetimeRangeFilter extends Filter {
  constructor({ after = null, before = null } = {}) {
    super();
    __publicField(this, "after");
    __publicField(this, "before");
    this.after = after;
    this.before = before;
  }
  normalize() {
    this.constructor.ensureTimezoneIsSet();
    let after = null;
    let before = null;
    if (!empty(this.after)) {
      after = dayjs.tz(this.after, this.constructor.userTimezone).tz("UTC").format("YYYY-MM-DD[T]HH:mm:ss[Z]");
    }
    if (!empty(this.before)) {
      before = dayjs.tz(this.before, this.constructor.userTimezone).tz("UTC").format("YYYY-MM-DD[T]HH:mm:ss[Z]");
    }
    return { after, before };
  }
  async denormalize(input) {
    this.constructor.ensureTimezoneIsSet();
    this.after = null;
    this.before = null;
    if (!empty(input.after)) {
      this.after = dayjs.tz(input.after, "UTC").tz(this.constructor.userTimezone).format("YYYY-MM-DD[T]HH:mm:ss[Z]");
    }
    if (!empty(input.before)) {
      this.before = dayjs.tz(input.before, "UTC").tz(this.constructor.userTimezone).format("YYYY-MM-DD[T]HH:mm:ss[Z]");
    }
  }
  static ensureTimezoneIsSet() {
    var _a;
    this.constructor.userTimezone = (_a = this.constructor.userTimezone) != null ? _a : dayjs.tz.guess() || "UTC";
  }
}
__publicField(DatetimeRangeFilter, "userTimezone");
function isBlank(val) {
  if (null == val) {
    return true;
  }
  if ("string" == typeof val) {
    return val.trim().length === 0;
  }
  if ("function" == typeof val) {
    return val.length === 0;
  }
  if (Array.isArray(val)) {
    return val.length === 0;
  }
  if (val instanceof Object) {
    return Object.keys(val).length === 0;
  }
  return false;
}
function deepPrune(input) {
  if (!(input instanceof Object)) {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map(deepPrune);
  }
  const output = { ...input };
  Object.keys(output).forEach((key) => {
    if (output[key] instanceof Object) {
      output[key] = deepPrune(output[key]);
    }
    if (isBlank(output[key])) {
      delete output[key];
    }
  });
  return output;
}
class FilterCollection {
  constructor(filters = {}) {
    __publicField(this, "_filters", []);
    if (!(filters instanceof Object)) {
      throw Error("A FilterCollection expects an object.");
    }
    Object.keys(filters).forEach((key) => {
      if (!(filters[key] instanceof Filter)) {
        throw Error(`Filter ${key} doesn't extend the Filter class.`);
      }
      this[key] = filters[key];
      this._filters.push(key);
    });
  }
  normalize() {
    const output = {};
    this._filters.forEach((key) => {
      const filter = this[key];
      output[key] = filter.normalize();
    });
    return deepPrune(output);
  }
  async denormalize(input) {
    const promises = [];
    for (const key of this._filters) {
      const filter = this[key];
      if (filter instanceof Filter && "undefined" !== typeof input[key]) {
        promises.push(filter.denormalize(input[key]));
      }
    }
    if (promises.length > 0) {
      await Promise.all(promises);
    }
    return this;
  }
}
async function useFilters(initialState = {}, options = {
  preserveQuery: false,
  targetRoute: void 0
}) {
  if ("function" !== typeof initialState) {
    throw Error("initialState should be provided as a function.");
  }
  const currentRoute = useRoute();
  const router = useRouter();
  const filters = ref(initialState());
  async function hydrateFiltersFromRoute(route) {
    Object.assign(unref(filters), await unref(filters).denormalize(route.query));
  }
  function clear() {
    filters.value = clone(initialState());
  }
  function buildQueryParams(additionalParams = {}) {
    const output = {};
    if (true === options.preserveQuery) {
      Object.assign(output, currentRoute.query);
    }
    return Object.assign(output, unref(filters).normalize(), additionalParams);
  }
  async function submit(additionalParams = {}) {
    var _a;
    const route = (_a = unref(options.targetRoute)) != null ? _a : currentRoute;
    await router.push(Object.assign({ ...route }, { query: buildQueryParams(additionalParams) }));
  }
  onBeforeRouteUpdate((to) => hydrateFiltersFromRoute(to));
  await hydrateFiltersFromRoute(currentRoute);
  return {
    filters,
    buildQueryParams,
    submit,
    clear
  };
}
const createStore = async ({ state = {}, methods = {}, name = "store" } = {}) => {
  state = reactive(state);
  const plugins = [];
  const store = {
    name,
    state,
    ...Object.keys(methods).reduce(function(resolvedMethods, name2) {
      const func = methods[name2];
      resolvedMethods[name2] = function() {
        return func(state, ...arguments);
      };
      return resolvedMethods;
    }, {}),
    async use(plugin) {
      plugins.push(plugin);
      await plugin.install(this);
      return this;
    },
    async reconciliate(sequentially = false) {
      const reconcilablePlugins = plugins.filter(({ reconciliate }) => "function" === typeof reconciliate);
      if (false === sequentially) {
        return Promise.all(reconcilablePlugins.map((plugin) => plugin.reconciliate(this)));
      }
      for (const plugin of reconcilablePlugins) {
        await plugin.reconciliate(this);
      }
    }
  };
  store.install = (app) => app.provide(name, { ...store, state: readonly(state) });
  return store;
};
const useStore = (name = "store") => inject(name);
class HydraEndpoints {
  constructor(data) {
    Object.keys(data).forEach((type) => {
      this[type] = new HydraEndpoint(data[type]);
    });
  }
  for(type) {
    if ("string" === typeof type && Object.keys(this).includes(type)) {
      return this[type];
    }
    if (!Object.keys(this).includes(type["@type"])) {
      throw Error(`Endpoint not found for item ${type["@type"]}.`);
    }
    return this[type["@type"]];
  }
}
class HydraEndpoint {
  constructor(endpoint) {
    __publicField(this, "endpoint");
    this.endpoint = endpoint;
  }
  toString() {
    return this.endpoint;
  }
  toJSON() {
    return this.endpoint;
  }
  buildIri(id) {
    let uri = new URI(this.endpoint);
    uri = uri.withPath(`${uri.getPath()}/${id}`);
    return uri.toString();
  }
  withQuery(params) {
    const uri = new URI(this.endpoint);
    const qs = new QueryString(uri).withParams(params);
    return new HydraEndpoint(uri.withQuery(qs.toString()).toString());
  }
  paginated(itemsPerPageOrFalse, partial = false) {
    itemsPerPageOrFalse = unref(itemsPerPageOrFalse);
    partial = unref(partial);
    const pager = {
      pagination: false === itemsPerPageOrFalse ? 0 : 1,
      partial: false === partial ? void 0 : 1,
      itemsPerPage: void 0
    };
    if (false !== itemsPerPageOrFalse) {
      pager.itemsPerPage = itemsPerPageOrFalse;
    }
    return this.withQuery(pager);
  }
  synchronize(location = window.location.href) {
    return this.withQuery(new QueryString(new URI(location)).getParams());
  }
}
const useEndpoint = (endpoint, storeName) => {
  const store = useStore(storeName);
  return store.state.endpoints[endpoint];
};
function hasIri(item) {
  item = unref(item);
  if (null == item) {
    return false;
  }
  return Object.keys(item).includes("@id") && null != item["@id"];
}
function getIri(itemOrIRI) {
  itemOrIRI = unref(itemOrIRI);
  if (null === itemOrIRI) {
    return null;
  }
  if ("string" === typeof itemOrIRI) {
    return itemOrIRI;
  }
  checkValidItem(itemOrIRI);
  return itemOrIRI["@id"];
}
function getId(itemOrIRI) {
  const iri = getIri(itemOrIRI);
  return iri.substring(iri.lastIndexOf("/") + 1);
}
function getIris(itemsOrIRIs) {
  return itemsOrIRIs.map(getIri);
}
function getIds(itemsOrIRIs) {
  return itemsOrIRIs.map(getId);
}
function checkValidItem(item, type = null) {
  if ("object" !== typeof item || !("@id" in item)) {
    throw Error("Invalid item.");
  }
  if (null !== type) {
    if ("string" === typeof type && type !== item["@type"]) {
      throw Error(`Expected item of type "${type}", got "${item["@type"]}".`);
    }
    if (Array.isArray(type) && false === type.includes(item["@type"])) {
      throw Error(`Expected item of any "${type.join("|")}", got "${item["@type"]}".`);
    }
  }
}
function areSameIris(a, b) {
  return getIri(a) === getIri(b);
}
function containsIri(itemsOrIris, iriOrItem) {
  itemsOrIris = unref(itemsOrIris);
  itemsOrIris = Array.from(itemsOrIris).map(unref);
  iriOrItem = unref(iriOrItem);
  if (Array.isArray(iriOrItem)) {
    const items = iriOrItem;
    for (const iriOrItem2 of items) {
      if (containsIri(itemsOrIris, iriOrItem2)) {
        return true;
      }
    }
    return false;
  }
  for (const itemOrIri of itemsOrIris) {
    if (areSameIris(itemOrIri, iriOrItem)) {
      return true;
    }
  }
  return false;
}
function withoutIri(itemsOrIris, itemOrIri) {
  const index = itemsOrIris.findIndex((item) => areSameIris(item, itemOrIri));
  if (index >= 0) {
    itemsOrIris.splice(index, 1);
  }
  return itemsOrIris;
}
function getItemByIri(items, iri) {
  const item = items.find((item2) => areSameIris(item2, iri));
  return "undefined" === typeof item ? null : item;
}
function getItemIndexByIri(items, iri) {
  return items.findIndex((item) => areSameIris(item, iri));
}
function getItemsByType(items, type) {
  return items.filter((item) => item["@type"] === type);
}
function normalizeIris(itemOrIris) {
  Object.assign(itemOrIris, itemOrIris.map((itemOrIri) => getIri(itemOrIri)));
}
function partialItem(item, mergeWith) {
  item = unref(item);
  checkValidItem(item);
  return Object.assign({ "@id": item["@id"], "@type": item["@type"] }, mergeWith);
}
class HydraError extends Error {
  constructor() {
    super(...arguments);
    __publicField(this, "statusCode");
  }
  get title() {
    return this["hydra:title"];
  }
  get description() {
    return this["hydra:description"];
  }
}
class Violation {
  constructor() {
    __publicField(this, "id");
    __publicField(this, "propertyPath");
    __publicField(this, "message");
    __publicField(this, "code");
    this.id = v4();
  }
}
class ConstraintViolationList extends HydraError {
  constructor(data) {
    super();
    __publicField(this, "_violations", []);
    Object.assign(
      this,
      {
        *[Symbol.iterator]() {
          yield* this.violations;
        }
      }
    );
    Object.assign(this, data);
  }
  get violations() {
    return this._violations;
  }
  set violations(violations) {
    this._violations = violations.map((violation) => Object.assign(new Violation(), violation));
  }
  getPropertyPaths() {
    return [...new Set(this.violations.map(({ propertyPath }) => propertyPath))];
  }
  getViolations(propertyPath) {
    const propertyPaths = Array.from(arguments);
    if (0 === propertyPaths.length) {
      return this.violations;
    }
    if (empty(propertyPaths[0])) {
      return this.violations.filter((violation) => empty(violation.propertyPath));
    }
    return this.violations.filter((violation) => propertyPath === violation.propertyPath);
  }
}
class HydraCollection {
  constructor(data = {}) {
    Object.assign(
      this,
      {
        ...data,
        *[Symbol.iterator]() {
          yield* this["hydra:member"] || [];
        }
      }
    );
  }
  get length() {
    return this.items.length;
  }
  get totalItems() {
    return this["hydra:totalItems"] || 0;
  }
  get items() {
    return this["hydra:member"] || [];
  }
  forEach(callback) {
    return (this["hydra:member"] || []).forEach(callback);
  }
  map(callback) {
    return (this["hydra:member"] || []).map(callback);
  }
  filter(callback) {
    return (this["hydra:member"] || []).filter(callback);
  }
  find(callback) {
    return (this["hydra:member"] || []).find(callback);
  }
  findIndex(callback) {
    return (this["hydra:member"] || []).findIndex(callback);
  }
}
function clearObject(object) {
  if ("object" !== typeof object || null == object) {
    throw Error("Invalid object.");
  }
  Object.keys(object).forEach((key) => delete object[key]);
  return object;
}
function normalizeRelation(relation) {
  return hasIri(relation) ? getIri(relation) : relation;
}
function normalizeItemRelations(item) {
  const cloned = clone(item);
  const props = Object.keys(cloned);
  for (const prop of props) {
    const value = cloned[prop];
    if (Array.isArray(value)) {
      cloned[prop] = value.map((relation) => normalizeRelation(relation));
    } else if ("object" === typeof value && null != value) {
      cloned[prop] = normalizeRelation(value);
    }
  }
  return cloned;
}
function recreateState(object, withObject) {
  object = clearObject(object);
  return Object.assign(object, withObject);
}
function useItemForm(itemInitialState) {
  const store = useStore();
  const initialState = ref(unref(itemInitialState));
  const item = reactive(clone(unref(itemInitialState)));
  const isCreationMode = computed(() => !hasIri(unref(item)));
  const isSubmitting = ref(false);
  const isUnsavedDraft = computed(() => JSON.stringify(unref(item)) !== JSON.stringify(unref(initialState)));
  const reset = (resetItem) => recreateState(item, clone(unref(resetItem != null ? resetItem : itemInitialState)));
  const submit = async (submittedItem) => {
    if (isRef(submittedItem)) {
      submittedItem = unref(submittedItem);
    }
    try {
      isSubmitting.value = true;
      const updatedItem = await store.upsertItem(normalizeItemRelations(submittedItem != null ? submittedItem : item));
      initialState.value = updatedItem;
      recreateState(item, clone(updatedItem));
      return updatedItem;
    } finally {
      isSubmitting.value = false;
    }
  };
  return { item, isUnsavedDraft, isCreationMode, isSubmitting, reset, submit };
}
function useFormValidation() {
  const resetValidity = (FormHTMLElement) => {
    FormHTMLElement = unref(FormHTMLElement);
    FormHTMLElement.querySelectorAll("[name]").forEach(function(element) {
      element.setCustomValidity("");
    });
  };
  const validate = (FormHTMLElement, report = true) => {
    FormHTMLElement = unref(FormHTMLElement);
    const isValid = FormHTMLElement.checkValidity();
    if (!isValid && report) {
      FormHTMLElement.reportValidity();
    }
    return isValid;
  };
  const bindViolations = (FormHTMLElement, violations) => {
    resetValidity(FormHTMLElement);
    Array.from(violations).forEach((violation) => addViolation(FormHTMLElement, violation));
    validate(FormHTMLElement);
  };
  const addViolation = (FormHTMLElement, { propertyPath, message }) => {
    var _a;
    FormHTMLElement = unref(FormHTMLElement);
    (_a = FormHTMLElement.querySelector(`[name='${propertyPath}']`)) == null ? void 0 : _a.setCustomValidity(message);
  };
  return { resetValidity, bindViolations, validate };
}
let EventSource;
const EVENTSOURCE_READYSTATE_OPEN = 1;
const EVENTSOURCE_READYSTATE_CLOSED = 2;
class FakeEventSource {
  constructor(url, configuration) {
    __publicField(this, "readyState", EVENTSOURCE_READYSTATE_OPEN);
    __publicField(this, "url");
    __publicField(this, "withCredentials");
    var _a;
    this.url = url;
    this.withCredentials = (_a = configuration == null ? void 0 : configuration.withCredentials) != null ? _a : false;
    setTimeout(() => this.onopen(), 10);
  }
  onerror() {
  }
  onmessage() {
  }
  onopen() {
  }
  close() {
    this.readyState = EVENTSOURCE_READYSTATE_CLOSED;
  }
  triggerEvent(event) {
    this.onmessage(event);
  }
  triggerError(error) {
    this.onerror(error);
  }
}
const isTestEnv = () => {
  var _a, _b;
  if ("undefined" !== typeof process && "test" === ((_a = process == null ? void 0 : process.env) == null ? void 0 : _a.NODE_ENV)) {
    return true;
  }
  if ("test" === ((_b = import_meta == null ? void 0 : import_meta.env) == null ? void 0 : _b.NODE_ENV)) {
    return true;
  }
  return false;
};
if (isTestEnv()) {
  EventSource = FakeEventSource;
} else {
  EventSource = window.EventSource;
}
var EventSource$1 = EventSource;
const createMercure = (hub, options) => {
  const mercure = new Mercure(hub, options);
  return Object.assign(mercure, {
    install(app) {
      app.provide("mercure", mercure);
    }
  });
};
const useMercure = () => {
  return inject("mercure");
};
function areSameTopicSets(a, b) {
  return a.length === b.length && a.every((topic) => b.includes(topic));
}
class Mercure {
  constructor(hub, options = {}) {
    __publicField(this, "hub");
    __publicField(this, "options");
    __publicField(this, "connection");
    __publicField(this, "subscribedTopics");
    __publicField(this, "endpoint");
    __publicField(this, "emitter");
    __publicField(this, "lastEventId");
    Object.assign(this, { hub, options: reactive(options) });
    this.lastEventId = ref();
    this.subscribedTopics = ref([]);
    this.endpoint = computed(() => {
      const url = new URL(this.hub);
      const subscribedTopics = unref(this.subscribedTopics);
      if (subscribedTopics.includes("*")) {
        url.searchParams.append("topic", "*");
      } else {
        subscribedTopics.forEach((topic) => url.searchParams.append("topic", topic));
      }
      if (unref(this.lastEventId)) {
        url.searchParams.append("Last-Event-ID", unref(this.lastEventId));
      }
      return url.toString();
    });
    this.emitter = mitt();
  }
  subscribe(topics = ["*"], listen = true) {
    if (!Array.isArray(topics)) {
      topics = [topics];
    }
    const formerTopicSet = Array.from(unref(this.subscribedTopics));
    const newTopicSet = [.../* @__PURE__ */ new Set([...unref(this.subscribedTopics), ...topics])];
    this.subscribedTopics.value = newTopicSet;
    if (listen && !areSameTopicSets(formerTopicSet, newTopicSet)) {
      this.listen();
    }
  }
  unsubscribe(topics) {
    if (!Array.isArray(topics)) {
      topics = [topics];
    }
    this.subscribedTopics.value = this.subscribedTopics.value.filter((subscribedTopic) => !topics.includes(subscribedTopic));
    if (this.connection) {
      this.listen();
    }
  }
  addListener(callback) {
    return this.emitter.on("message", callback);
  }
  removeListener(callback) {
    return this.emitter.off("message", callback);
  }
  listen() {
    const subscribedTopics = unref(this.subscribedTopics);
    if (0 === subscribedTopics.length) {
      this.stop();
      return;
    }
    if (!this.connection) {
      this.connect();
    }
  }
  connect() {
    this.stop();
    this.connection = new EventSource$1(unref(this.endpoint), this.options);
    this.connection.onopen = () => this.emitter.emit("open", { endpoint: unref(this.endpoint) });
    this.connection.onmessage = (event) => {
      this.lastEventId.value = event.lastEventId;
      return this.emitter.emit("message", event);
    };
    this.connection.onerror = (error) => {
      this.emitter.emit("error", error);
      if ("number" === typeof this.options.reconnectInterval) {
        this.stop();
        setTimeout(() => this.connect(), this.options.reconnectInterval);
      }
    };
  }
  stop() {
    var _a;
    (_a = this.connection) == null ? void 0 : _a.close();
    this.connection = void 0;
  }
}
const defaultUpdater = (update, item) => Object.assign(item, update);
const defaultRemover = () => {
};
function mercureSync(mercure, items, topics = ["*"], onUpdate = defaultUpdater, onDelete = defaultRemover) {
  if (!Array.isArray(items)) {
    items = [items];
  }
  if (!Array.isArray(topics)) {
    topics = [topics];
  }
  const listener = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (!hasIri(data)) {
        return;
      }
      if (1 === Object.keys(data).length) {
        onDelete(getIri(data));
        return;
      }
      for (const item of items) {
        if (areSameIris(getIri(data), item)) {
          onUpdate(data, unref(item));
        }
      }
    } catch (e) {
      console.debug(e);
    }
  };
  mercure.addListener(listener);
  mercure.subscribe(topics);
  return listener;
}
const on = (mercure, topics, callback) => {
  if (!Array.isArray(topics)) {
    topics = [topics];
  }
  const wrapper = (event) => {
    let item;
    try {
      item = JSON.parse(event.data);
    } catch (e) {
      console.debug(e);
      return;
    }
    if ("object" !== typeof item) {
      console.debug("Received an event which is not an object.");
      return;
    }
    try {
      for (const topic of topics) {
        if ("undefined" !== typeof uriTemplate(topic).fromUri(getIri(item))) {
          callback(item);
          break;
        }
      }
    } catch (e) {
      console.error(e);
    }
  };
  mercure.addListener(wrapper);
  mercure.subscribe(topics);
  return wrapper;
};
const useMercureSync = (mercure) => {
  mercure = mercure != null ? mercure : useMercure();
  const listeners = [];
  onUnmounted(() => {
    for (const listener of listeners) {
      mercure.removeListener(listener);
    }
  });
  const synchronize = (items, topics = ["*"], onUpdate = defaultUpdater, onDelete = defaultRemover) => {
    listeners.push(mercureSync(mercure, items, topics, onUpdate, onDelete));
  };
  return {
    synchronize,
    on(topics, callback) {
      const listener = on(mercure, topics, callback);
      listeners.push(listener);
      return listener;
    }
  };
};
const DEFAULT_CLASSMAP = {
  "hydra:Collection": HydraCollection,
  "hydra:Error": HydraError,
  "ConstraintViolationList": ConstraintViolationList
};
class Items {
  constructor() {
    Object.assign(
      this,
      {
        *[Symbol.iterator]() {
          yield* Object.values(this);
        }
      }
    );
  }
  get length() {
    return Array.from(this).length;
  }
  forEach(callback) {
    return Array.from(this).forEach(callback);
  }
  map(callback) {
    return Array.from(this).map(callback);
  }
  filter(callback) {
    return Array.from(this).filter(callback);
  }
  find(callback) {
    return Array.from(this).find(callback);
  }
  findIndex(callback) {
    return Array.from(this).findIndex(callback);
  }
}
const DEFAULT_ERROR_HANDLER = function(error) {
  throw error;
};
class HydraPlugin {
  constructor(api, options = {}) {
    __publicField(this, "api");
    __publicField(this, "endpoints");
    __publicField(this, "classmap");
    var _a;
    this.api = api;
    const { endpoints, classmap } = options;
    this.endpoints = new HydraEndpoints(endpoints != null ? endpoints : {});
    this.classmap = { ...DEFAULT_CLASSMAP, ...classmap };
    this.errorHandler = (_a = options.errorHandler) != null ? _a : DEFAULT_ERROR_HANDLER;
  }
  factory(item, statusCode) {
    var _a;
    for (const type in this.classmap) {
      if (type === ((_a = item["@type"]) != null ? _a : item)) {
        const className = this.classmap[type];
        if (item instanceof className) {
          return item;
        }
        item = Object.assign(new className(), item);
        if (statusCode) {
          Object.assign(item, { statusCode });
        }
        return reactive(item);
      }
    }
    return item;
  }
  storeItem({ state }, item) {
    const iri = getIri(item);
    if (!Object.keys(state.items).includes(iri)) {
      state.items[iri] = ref(item);
    } else {
      Object.assign(state.items[iri], item);
    }
    return state.items[iri];
  }
  removeItem({ state }, item) {
    const iri = getIri(item);
    delete state.items[iri];
  }
  async clearItems({ state }) {
    state.items = reactive(new Items());
  }
  async handle(call, { errorHandler = this.errorHandler } = {}) {
    var _a, _b, _c, _d, _e;
    try {
      const { data } = await call();
      return this.factory(data);
    } catch (error) {
      if ("object" === typeof ((_a = error.response) == null ? void 0 : _a.data) && null != ((_b = error.response) == null ? void 0 : _b.data)) {
        error = this.factory(error.response.data, (_c = error.response) == null ? void 0 : _c.status);
      }
      error.statusCode = (_e = error.statusCode) != null ? _e : (_d = error.response) == null ? void 0 : _d.status;
      errorHandler(error);
    }
  }
  async fetchItem({ state }, itemOrIri, options) {
    var _a;
    let uri = new URI(getIri(itemOrIri));
    if (options == null ? void 0 : options.groups) {
      uri = uri.withQuery(`${new QueryString(uri.getQuery()).withParam("groups", options.groups)}`);
    }
    let item = await this.handle(() => this.api.get(`${uri}`, options), options);
    item = this.factory(item);
    const shouldStore = (_a = options == null ? void 0 : options.store) != null ? _a : true;
    return shouldStore ? this.storeItem({ state }, item) : item;
  }
  async getItem({ state }, itemOrIri, options) {
    if (null === itemOrIri) {
      return null;
    }
    const iri = getIri(itemOrIri);
    const existingItem = getItemByIri(state.items, iri);
    if (null != existingItem) {
      return existingItem;
    }
    return await this.fetchItem({ state }, iri, options);
  }
  async fetchCollection({ state }, iri, options) {
    var _a;
    let uri = new URI(`${iri}`);
    if (options == null ? void 0 : options.groups) {
      uri = uri.withQuery(`${new QueryString(uri.getQuery()).withParam("groups", options.groups)}`);
    }
    const data = await this.handle(() => this.api.get(`${uri}`, options), options);
    data["hydra:member"] = data["hydra:member"].map((item) => this.factory(item));
    const collection = this.factory(data);
    collection["hydra:member"] = collection["hydra:member"].map((item) => this.factory(item));
    const shouldStore = (_a = options == null ? void 0 : options.store) != null ? _a : false;
    if (shouldStore) {
      for (const item of collection["hydra:member"]) {
        this.storeItem({ state }, item);
      }
    }
    return collection;
  }
  async createItem({ state }, item, options) {
    var _a;
    const endpoint = this.endpoints.for(item);
    item = await this.handle(() => this.api.post(endpoint, item, options), options);
    const shouldStore = (_a = options == null ? void 0 : options.store) != null ? _a : true;
    return shouldStore ? this.storeItem({ state }, item) : item;
  }
  async updateItem({ state }, item, options) {
    var _a;
    checkValidItem(item);
    item = await this.handle(() => this.api.put(getIri(item), item, options), options);
    const shouldStore = (_a = options == null ? void 0 : options.store) != null ? _a : true;
    return shouldStore ? this.storeItem({ state }, item) : item;
  }
  async upsertItem({ state }, item, options) {
    return hasIri(item) ? this.updateItem({ state }, item, options) : this.createItem({ state }, item, options);
  }
  async deleteItem({ state }, item, options) {
    const iri = getIri(item);
    await this.handle(() => this.api.delete(iri, options), options);
    item = getItemByIri(state.items, iri);
    if (null !== item) {
      this.removeItem({ state }, item);
    }
  }
  async getRelation({ state }, itemOrIri, options = {}) {
    var _a, _b, _c;
    if (null === itemOrIri) {
      return null;
    }
    if ("function" === typeof itemOrIri) {
      const synchronizedRelation = asyncComputed(() => this.getRelation({ state }, itemOrIri(), options));
      await until(synchronizedRelation).not.toBe(void 0);
      return synchronizedRelation;
    }
    if (true === ((_a = options.useExisting) != null ? _a : true)) {
      const existingItem = getItemByIri(state.items, itemOrIri);
      if (null != existingItem) {
        return existingItem;
      }
    }
    if ("object" === typeof itemOrIri && false === ((_b = options.force) != null ? _b : false)) {
      const item = this.factory(itemOrIri);
      const shouldStore = (_c = options == null ? void 0 : options.store) != null ? _c : false;
      return shouldStore ? this.storeItem({ state }, item) : item;
    }
    return await this.getItem({ state }, itemOrIri, options);
  }
  async getRelations({ state }, itemsOrIris, options) {
    if ("function" === typeof itemsOrIris) {
      const synchronizedRelations = asyncComputed(() => this.getRelations({ state }, itemsOrIris(), options));
      await until(synchronizedRelations).not.toBe(void 0);
      return synchronizedRelations;
    }
    return Promise.all(itemsOrIris.map((itemOrIri) => this.getRelation({ state }, itemOrIri, options)));
  }
  async install(store) {
    store.state.items = reactive(new Items());
    store.state.endpoints = readonly(this.endpoints);
    store.state.classmap = readonly(this.classmap);
    store.storeItem = (item) => this.storeItem(store, item);
    store.removeItem = (item) => this.removeItem(store, item);
    store.clearItems = () => this.clearItems(store);
    store.getItem = (itemOrIri, options) => this.getItem(store, itemOrIri, options);
    store.fetchItem = (iri, options) => this.fetchItem(store, iri, options);
    store.fetchCollection = (iri, options) => this.fetchCollection(store, iri, options);
    store.createItem = (item, options) => this.createItem(store, item, options);
    store.updateItem = (item, options) => this.updateItem(store, item, options);
    store.upsertItem = (item, options) => this.upsertItem(store, item, options);
    store.deleteItem = (itemOrIri, options) => this.deleteItem(store, itemOrIri, options);
    store.getRelation = (itemOrIri, options) => this.getRelation(store, itemOrIri, options);
    store.getRelations = (itemsOrIris, options) => this.getRelations(store, itemsOrIris, options);
    store.endpoint = (name) => store.state.endpoints[name];
    store.getItemsByType = (type) => store.state.items.filter((item) => type === item["@type"]);
    store.factory = (typeOrObject, object) => {
      object = object != null ? object : typeOrObject;
      if ("string" === typeof typeOrObject) {
        object["@type"] = typeOrObject;
      }
      return this.factory(object);
    };
  }
}
function normalizeSingle(item) {
  if ("string" === typeof item) {
    return item;
  }
  try {
    return getIri(item);
  } catch (e) {
    return null;
  }
}
function normalizeMultiple(items) {
  return items.map((item) => normalizeSingle(item));
}
async function denormalizeSingle(item, store) {
  try {
    return await store.getItem(item);
  } catch (e) {
    return null;
  }
}
async function denormalizeMultiple(items, store) {
  return Promise.all(items.map((item) => denormalizeSingle(item, store)));
}
class ItemFilter extends Filter {
  constructor(items, { store, multiple = false }) {
    super();
    __publicField(this, "items", []);
    __publicField(this, "multiple");
    __publicField(this, "store");
    this.items = Array.isArray(items) ? items : [items];
    this.store = store;
    this.multiple = multiple;
  }
  get item() {
    var _a;
    return (_a = this.items[0]) != null ? _a : null;
  }
  set item(item) {
    this.items = [item];
    this.multiple = false;
  }
  normalize() {
    return this.multiple || this.items.length > 1 ? normalizeMultiple(this.items) : normalizeSingle(this.item);
  }
  async denormalize(input) {
    if (Array.isArray(input)) {
      this.items = await denormalizeMultiple(input, this.store);
      return;
    }
    this.items = [await denormalizeSingle(input, this.store)];
  }
}
const reverts = {
  asc: "desc",
  desc: "asc"
};
class OrderFilter extends Filter {
  constructor(order = {}) {
    super();
    __publicField(this, "order");
    this.order = order;
  }
  revert() {
    var _a;
    const order = {};
    for (const key in this.order) {
      const value = this.order[key];
      order[key] = (_a = reverts[value]) != null ? _a : value;
    }
    this.order = order;
    return this;
  }
  normalize() {
    return this.order;
  }
  async denormalize(input) {
    this.order = {};
    if ("object" === typeof input && null != input) {
      this.order = input;
    }
  }
}
class RangeFilter extends Filter {
  constructor(left, right, includeLeft = true, includeRight = true) {
    super();
    this.left = left;
    this.right = right;
    this.includeLeft = includeLeft;
    this.includeRight = includeRight;
  }
  normalize() {
    const output = {};
    if (null != this.left) {
      output[this.includeLeft ? "gte" : "gt"] = `${this.left}`;
    }
    if (null != this.right) {
      output[this.includeRight ? "lte" : "lt"] = `${this.right}`;
    }
    return Object.keys(output).length > 0 ? output : void 0;
  }
  async denormalize(input) {
    if (null == input || "object" !== typeof input) {
      return;
    }
    if (Object.keys(input).includes("gt")) {
      this.left = parseFloat(input["gt"]);
      this.includeLeft = false;
    }
    if (Object.keys(input).includes("gte")) {
      this.left = parseFloat(input["gte"]);
      this.includeLeft = true;
    }
    if (Object.keys(input).includes("lt")) {
      this.right = parseFloat(input["lt"]);
      this.includeRight = false;
    }
    if (Object.keys(input).includes("lte")) {
      this.right = parseFloat(input["lte"]);
      this.includeRight = true;
    }
  }
}
class TextFilter extends Filter {
  constructor(value = null) {
    super();
    __publicField(this, "_value");
    this.value = value;
  }
  get value() {
    return this._value;
  }
  set value(value) {
    this._value = !value ? value : value.toString();
  }
  normalize() {
    var _a;
    if ([void 0, null, ""].includes((_a = this.value) == null ? void 0 : _a.trim())) {
      return null;
    }
    return this.value.trim();
  }
  async denormalize(input) {
    if ("string" === typeof input) {
      input = input.trim();
    }
    if ([void 0, null, ""].includes(input)) {
      this.value = null;
      return;
    }
    this.value = input;
  }
}
class TruthyFilter extends Filter {
  constructor(value = null) {
    super();
    __publicField(this, "value");
    this.value = value;
  }
  normalize() {
    if (null == this.value) {
      return null;
    }
    return this.value ? "true" : "false";
  }
  async denormalize(input) {
    if (null == input) {
      this.value = null;
      return;
    }
    input = `${input}`.trim();
    this.value = ["true", "on", "yes", "1"].includes(input.toLowerCase());
  }
}
function createPager({ itemsPerPage, currentPage, totalItems }) {
  if (null == totalItems) {
    return new PartialPager({ itemsPerPage, currentPage });
  }
  return new StandardPager({ itemsPerPage, currentPage, totalItems });
}
function generatePages(lastPage) {
  return Array.from({ length: lastPage }, (_, i) => i + 1);
}
class Pager {
  constructor({ itemsPerPage, currentPage }) {
    __publicField(this, "itemsPerPage");
    __publicField(this, "totalItems");
    __publicField(this, "currentPage");
    __publicField(this, "previousPage");
    __publicField(this, "nextPage");
    __publicField(this, "lastPage");
    __publicField(this, "offset");
    __publicField(this, "_pages");
    this.itemsPerPage = parseInt(itemsPerPage);
    this.currentPage = parseInt(currentPage);
    this.offset = Math.max(0, currentPage * itemsPerPage - itemsPerPage);
    this.previousPage = Math.max(1, this.currentPage - 1);
  }
  get pages() {
    if (void 0 === this._pages) {
      this._pages = generatePages(this.lastPage);
    }
    return this._pages;
  }
  isPartial() {
    return null == this.totalItems;
  }
  isFirstPage(page = void 0) {
    return parseInt(page != null ? page : this.currentPage) === 1;
  }
  isPreviousPage(page) {
    return parseInt(page) === this.previousPage;
  }
  isCurrentPage(page) {
    return parseInt(page) === this.currentPage;
  }
  isNextPage(page) {
    return parseInt(page) === this.nextPage;
  }
  isLastPage(page = void 0) {
    return parseInt(page != null ? page : this.currentPage) === this.lastPage;
  }
  *[Symbol.iterator]() {
    yield* this.pages;
  }
  truncate(delta, includeEdges = false) {
    return new TruncatedPager(this, delta, includeEdges);
  }
}
class StandardPager extends Pager {
  constructor({ itemsPerPage, currentPage, totalItems }) {
    super({ itemsPerPage, currentPage });
    this.totalItems = parseInt(totalItems);
    this.lastPage = Math.max(1, Math.ceil(this.totalItems / Math.max(1, this.itemsPerPage)));
    this.nextPage = Math.min(this.lastPage, this.currentPage + 1);
  }
}
class PartialPager extends Pager {
  constructor({ itemsPerPage, currentPage, totalItems }) {
    super({ itemsPerPage, currentPage, totalItems });
    this.nextPage = this.lastPage = this.currentPage + 1;
  }
}
class TruncatedPager extends Pager {
  constructor(pager, delta, includeEdges = false) {
    super(pager);
    Object.assign(this, pager);
    const pages = [];
    if (includeEdges) {
      pages.push(1);
    }
    for (let page = 1; page <= this.lastPage; page++) {
      if (page === this.currentPage) {
        pages.push(page);
      }
      if (page < this.currentPage && page >= this.currentPage - delta) {
        pages.push(page);
      }
      if (page > this.currentPage && page <= this.currentPage + delta) {
        pages.push(page);
      }
    }
    if (includeEdges) {
      pages.push(this.lastPage);
    }
    this._pages = [...new Set(pages)];
  }
}
class Vulcain {
  constructor() {
    __publicField(this, "fields");
    __publicField(this, "preload");
  }
  get headers() {
    var _a, _b, _c, _d, _e;
    const output = {};
    if (0 !== ((_b = (_a = this.preload) == null ? void 0 : _a.length) != null ? _b : 0)) {
      output.preload = [...new Set(this.preload)].map((field) => `"${field}"`).join(", ");
    }
    if (0 !== ((_d = (_c = this.fields) == null ? void 0 : _c.length) != null ? _d : 0)) {
      output.fields = [.../* @__PURE__ */ new Set([...this.fields, ...(_e = this.preload) != null ? _e : []])].map((field) => `"${field}"`).join(", ");
    }
    return output;
  }
}
function vulcain({ fields, preload } = {}) {
  return Object.assign(new Vulcain(), { fields }, { preload }).headers;
}
export { AbortError, ApiClient, ArrayFilter, ConstraintViolationList, DateRangeFilter, DatetimeRangeFilter, FakeEventSource, FilterCollection, HttpError, HydraCollection, HydraEndpoint, HydraEndpoints, HydraError, HydraPlugin, ItemFilter, Mercure, OrderFilter, RangeFilter, TextFilter, TruthyFilter, Violation, areSameIris, checkValidItem, clone, containsIri, createMercure, createPager, createStore, getId, getIds, getIri, getIris, getItemByIri, getItemIndexByIri, getItemsByType, hasIri, mercureSync, normalizeIris, normalizeItemRelations, on, partialItem, useEndpoint, useFilters, useFormValidation, useItemForm, useMercure, useMercureSync, useStore, vulcain, withoutDuplicates, withoutIri };
