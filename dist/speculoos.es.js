var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const import_meta = {};
import { unref, isRef, ref, reactive, readonly, inject, computed, watch, onUnmounted } from "vue";
import clone from "clone-deep";
import md5 from "md5";
import empty from "is-empty";
import { useRoute, useRouter, onBeforeRouteUpdate } from "vue-router";
import { URI, QueryString } from "psr7-js";
import { v4 } from "uuid";
import mitt from "mitt";
import uriTemplate from "uri-templates";
import { asyncComputed } from "@vueuse/core";
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
  constructor({ baseUri = "", options = {}, fetcher = window.fetch.bind(window) } = {}) {
    __publicField(this, "baseUri");
    __publicField(this, "options");
    __publicField(this, "fetch");
    this.baseUri = baseUri;
    this.options = options;
    this.fetch = async (url, options2) => fetcher(url, options2).then(tapResponse);
  }
  resolve(uri) {
    return new URL(uri, this.baseUri).toString();
  }
  mergeOptions(options) {
    let output = __spreadValues({}, this.options);
    if (Object.keys(output).includes("headers")) {
      output.headers = normalizeHeaders(output.headers);
    }
    for (let argument of arguments) {
      let options2 = __spreadValues({}, argument);
      if (Object.keys(options2).includes("headers")) {
        options2.headers = __spreadValues({}, normalizeHeaders(options2.headers));
      }
      output = __spreadValues(__spreadValues({}, clone(output)), clone(options2));
    }
    return output;
  }
  async request(method, url, options) {
    url = `${unref(url)}`;
    options = this.mergeOptions({ method }, options);
    if (Object.keys(options).includes("headers")) {
      options.headers = new Headers(__spreadValues(__spreadValues({}, defaultHeaders), normalizeHeaders(options.headers)));
    }
    try {
      if (isRef(options == null ? void 0 : options.isLoading)) {
        options.isLoading.value = true;
      }
      const response = await this.fetch(url, options);
      return HttpError.guard(response);
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
    return await this.request("POST", this.resolve(uri), this.mergeOptions({
      body: JSON.stringify(unref(data)),
      headers: {
        "Content-Type": "application/json"
      }
    }, options));
  }
  async put(uri, data, options = {}) {
    return await this.request("PUT", this.resolve(uri), this.mergeOptions({
      body: JSON.stringify(unref(data)),
      headers: {
        "Content-Type": "application/json"
      }
    }, options));
  }
  async delete(uri, options = {}) {
    return await this.request("DELETE", this.resolve(uri), this.mergeOptions(options));
  }
}
class PreventDuplicates {
  constructor(fetcher = window.fetch.bind(window)) {
    __publicField(this, "fetch");
    __publicField(this, "pendingRequests", []);
    this.fetch = fetcher;
    return (url, options) => {
      try {
        const hash = md5(JSON.stringify(__spreadValues({ url }, options)));
        const index = this.pendingRequests.findIndex((pending) => hash === pending.hash);
        if (index >= 0) {
          return this.pendingRequests[index].promise;
        }
        const promise = this.fetch(url, options).then(tapResponse);
        this.pendingRequests.push({ hash, promise });
        return promise.then((result) => {
          const index2 = this.pendingRequests.findIndex((pending) => hash === pending.hash);
          if (index2 >= 0) {
            this.pendingRequests.splice(index2, 1);
          }
          return result;
        });
      } catch (e) {
        return this.fetch(url, options);
      }
    };
  }
}
function withoutDuplicates(fetcher = void 0) {
  return new PreventDuplicates(fetcher);
}
class Filter {
  normalize() {
    throw Error("This method is meant to be overriden.");
  }
  static denormalize(input) {
    throw Error("This method is meant to be overriden.");
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
      return t2 === void 0;
    } }, D = "en", v = {};
    v[D] = M;
    var p = function(t2) {
      return t2 instanceof _;
    }, S = function(t2, e2, n2) {
      var r2;
      if (!t2)
        return D;
      if (typeof t2 == "string")
        v[t2] && (r2 = t2), e2 && (v[t2] = e2, r2 = t2);
      else {
        var i2 = t2.name;
        v[i2] = t2, r2 = i2;
      }
      return !n2 && r2 && (D = r2), r2 || !n2 && D;
    }, w = function(t2, e2) {
      if (p(t2))
        return t2.clone();
      var n2 = typeof e2 == "object" ? e2 : {};
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
          if (e2 === null)
            return new Date(NaN);
          if (O.u(e2))
            return new Date();
          if (e2 instanceof Date)
            return new Date(e2);
          if (typeof e2 == "string" && !/Z$/i.test(e2)) {
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
            var D2 = this.$locale().weekStart || 0, v2 = (y2 < D2 ? y2 + 7 : y2) - D2;
            return $2(r2 ? m3 - v2 : m3 + (6 - v2), M3);
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
          return t3 && (t3[n3] || t3(e2, r2)) || i3[n3].substr(0, s3);
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
        var l2, y2 = O.p(d2), M3 = w(r2), m3 = (M3.utcOffset() - this.utcOffset()) * e, g2 = this - M3, D2 = O.m(this, M3);
        return D2 = (l2 = {}, l2[c] = D2 / 12, l2[f] = D2, l2[h] = D2 / 3, l2[o] = (g2 - m3) / 6048e5, l2[a] = (g2 - m3) / 864e5, l2[u] = g2 / n, l2[s] = g2 / e, l2[i] = g2 / t, l2)[y2] || g2, $2 ? D2 : O.a(D2);
      }, m2.daysInMonth = function() {
        return this.endOf(f).$D;
      }, m2.$locale = function() {
        return v[this.$L];
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
    }(), b = _.prototype;
    return w.prototype = b, [["$ms", r], ["$s", i], ["$m", s], ["$H", u], ["$W", a], ["$M", f], ["$y", c], ["$D", d]].forEach(function(t2) {
      b[t2[1]] = function(e2) {
        return this.$g(e2, t2[0], t2[1]);
      };
    }), w.extend = function(t2, e2) {
      return t2.$i || (t2(e2, _, w), t2.$i = true), w;
    }, w.locale = S, w.isDayjs = p, w.unix = function(t2) {
      return w(1e3 * t2);
    }, w.en = v[D], w.Ls = v, w.p = {}, w;
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
        if (typeof s2 == "string" && (s2 = function(t2) {
          t2 === void 0 && (t2 = "");
          var s3 = t2.match(i);
          if (!s3)
            return null;
          var f3 = ("" + s3[0]).match(e) || ["-", 0, 0], n3 = f3[0], u3 = 60 * +f3[1] + +f3[2];
          return u3 === 0 ? 0 : n3 === "+" ? u3 : -u3;
        }(s2)) === null)
          return this;
        var u2 = Math.abs(s2) <= 16 ? 60 * s2 : s2, o2 = this;
        if (f2)
          return o2.$offset = u2, o2.$u = s2 === 0, o2;
        if (s2 !== 0) {
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
        var t2 = this.$utils().u(this.$offset) ? 0 : this.$offset + (this.$x.$localOffset || new Date().getTimezoneOffset());
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
        return t2 === "s" && this.$offset ? n(this.format("YYYY-MM-DD HH:mm:ss:SSS")).toDate() : l.call(this);
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
        i2 === void 0 && (i2 = {});
        var o2 = new Date(t2);
        return function(t3, n3) {
          n3 === void 0 && (n3 = {});
          var i3 = n3.timeZoneName || "short", o3 = t3 + "|" + i3, r2 = e[o3];
          return r2 || (r2 = new Intl.DateTimeFormat("en-US", { hour12: false, timeZone: t3, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: i3 }), e[o3] = r2), r2;
        }(n2, i2).formatToParts(o2);
      }, u = function(e2, n2) {
        for (var i2 = a(e2, n2), r2 = [], u2 = 0; u2 < i2.length; u2 += 1) {
          var f2 = i2[u2], s2 = f2.type, m = f2.value, c = t[s2];
          c >= 0 && (r2[c] = parseInt(m, 10));
        }
        var d = r2[3], l = d === 24 ? 0 : d, v = r2[0] + "-" + r2[1] + "-" + r2[2] + " " + l + ":" + r2[4] + ":" + r2[5] + ":000", h = +e2;
        return (o.utc(v).valueOf() - (h -= h % 1e3)) / 6e4;
      }, f = i.prototype;
      f.tz = function(t2, e2) {
        t2 === void 0 && (t2 = r);
        var n2 = this.utcOffset(), i2 = this.toDate(), a2 = i2.toLocaleString("en-US", { timeZone: t2 }), u2 = Math.round((i2 - new Date(a2)) / 1e3 / 60), f2 = o(a2).$set("millisecond", this.$ms).utcOffset(15 * -Math.round(i2.getTimezoneOffset() / 15) - u2, true);
        if (e2) {
          var s2 = f2.utcOffset();
          f2 = f2.add(n2 - s2, "minute");
        }
        return f2.$x.$timezone = t2, f2;
      }, f.offsetName = function(t2) {
        var e2 = this.$x.$timezone || o.tz.guess(), n2 = a(this.valueOf(), e2, { timeZoneName: t2 }).find(function(t3) {
          return t3.type.toLowerCase() === "timezonename";
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
        if (typeof t2 != "string")
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
const _DateRangeFilter = class extends Filter {
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
      after = dayjs.tz(this.after, this.constructor.userTimezone).hour(0).minute(0).second(0).tz("UTC").format("YYYY-MM-DD[T]HH:mm:ss[Z]");
    }
    if (!empty(this.before)) {
      before = dayjs.tz(this.before, this.constructor.userTimezone).hour(0).minute(0).second(0).add(1, "day").subtract(1, "second").tz("UTC").format("YYYY-MM-DD[T]HH:mm:ss[Z]");
    }
    return { after, before };
  }
  static denormalize(input) {
    this.ensureTimezoneIsSet();
    let after = null;
    let before = null;
    if (!empty(input.after)) {
      after = dayjs.tz(input.after, "UTC").tz(_DateRangeFilter.userTimezone).hour(0).minute(0).second(0).format("YYYY-MM-DD");
    }
    if (!empty(input.before)) {
      before = dayjs.tz(input.before, "UTC").tz(_DateRangeFilter.userTimezone).hour(0).minute(0).second(0).add(1, "day").subtract(1, "second").format("YYYY-MM-DD");
    }
    return new this({ after, before });
  }
  static ensureTimezoneIsSet() {
    var _a;
    this.userTimezone = (_a = this.userTimezone) != null ? _a : dayjs.tz.guess() || "UTC";
  }
};
let DateRangeFilter = _DateRangeFilter;
__publicField(DateRangeFilter, "userTimezone");
function isBlank(val) {
  if (val == null) {
    return true;
  }
  if (typeof val == "string") {
    return val.trim().length === 0;
  }
  if (typeof val == "function") {
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
    return input.filter(deepPrune);
  }
  const output = __spreadValues({}, input);
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
  async denormalize(input, options) {
    for (const key of this._filters) {
      if (typeof input[key] !== "undefined") {
        this[key] = await Object.getPrototypeOf(this[key]).constructor.denormalize(input[key], options);
      }
    }
    return this;
  }
}
async function useFilters(initialState = {}, options = {}) {
  if (typeof initialState !== "function") {
    throw Error("initialState should be provided as a function.");
  }
  const route = useRoute();
  const router = useRouter();
  const filters = ref(initialState());
  async function hydrateFiltersFromRoute(route2) {
    Object.assign(unref(filters), await unref(filters).denormalize(route2.query, options));
  }
  function clear() {
    filters.value = clone(initialState());
  }
  function buildQueryParams(additionalParams = {}) {
    return Object.assign({}, route.query, unref(filters).normalize(), additionalParams);
  }
  async function submit(additionalParams = {}) {
    await router.push(Object.assign(__spreadValues({}, route), { query: buildQueryParams(additionalParams) }));
  }
  onBeforeRouteUpdate((to) => hydrateFiltersFromRoute(to));
  await hydrateFiltersFromRoute(route);
  return {
    filters,
    buildQueryParams,
    submit,
    clear
  };
}
class HydraEndpoints {
  constructor(data) {
    Object.keys(data).forEach((type) => {
      this[type] = new HydraEndpoint(data[type]);
    });
  }
  for(type) {
    if (typeof type === "string" && Object.keys(this).includes(type)) {
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
  withQuery(params) {
    const uri = new URI(this.endpoint);
    const qs = new QueryString(uri).withParams(params);
    return new HydraEndpoint(uri.withQuery(qs.toString()).toString());
  }
  paginated(itemsPerPageOrFalse) {
    if (itemsPerPageOrFalse === false) {
      return this.withQuery({
        pagination: 0
      });
    }
    const pager = { pagination: 1 };
    if (itemsPerPageOrFalse) {
      pager.itemsPerPage = itemsPerPageOrFalse;
    }
    return this.withQuery(pager);
  }
  synchronize(location = window.location.href) {
    return this.withQuery(new QueryString(new URI(location)).getParams());
  }
}
function hasIri(item) {
  item = unref(item);
  if (item == null) {
    return false;
  }
  return Object.keys(item).includes("@id") && item["@id"] != null;
}
function getIri(itemOrIRI) {
  itemOrIRI = unref(itemOrIRI);
  if (itemOrIRI === null) {
    return null;
  }
  if (typeof itemOrIRI === "string") {
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
  if (typeof item !== "object" || !("@id" in item)) {
    throw Error("Invalid item.");
  }
  if (type !== null) {
    if (typeof type === "string" && type !== item["@type"]) {
      throw Error(`Expected item of type "${type}", got "${item["@type"]}".`);
    }
    if (Array.isArray(type) && type.includes(item["@type"]) === false) {
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
  return typeof item === "undefined" ? null : item;
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
const createStore = async ({ state = {}, methods = {}, name = "store" } = {}) => {
  state = reactive(state);
  const store = __spreadProps(__spreadValues({
    name,
    state
  }, Object.keys(methods).reduce(function(resolvedMethods, name2) {
    const func = methods[name2];
    resolvedMethods[name2] = function() {
      return func(state, ...arguments);
    };
    return resolvedMethods;
  }, {})), {
    async use(plugin) {
      await plugin.install(this);
      return this;
    }
  });
  store.install = (app) => app.provide(name, __spreadProps(__spreadValues({}, store), { state: readonly(state) }));
  return store;
};
const useStore = (name = "store") => inject(name);
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
    Object.assign(this, {
      *[Symbol.iterator]() {
        yield* this.violations;
      }
    });
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
    if (propertyPaths.length === 0) {
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
    Object.assign(this, __spreadProps(__spreadValues({}, data), {
      *[Symbol.iterator]() {
        yield* this["hydra:member"] || [];
      }
    }));
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
  if (typeof object !== "object" || object == null) {
    throw Error("Invalid object.");
  }
  Object.keys(object).forEach((key) => delete object[key]);
  return object;
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
  watch(initialState, (newInitialState) => recreateState(item, newInitialState));
  const isUnsavedDraft = computed(() => JSON.stringify(unref(item)) !== JSON.stringify(unref(initialState)));
  const reset = () => recreateState(item, clone(unref(itemInitialState)));
  const submit = async () => {
    try {
      isSubmitting.value = true;
      const updatedItem = await store.upsertItem(item);
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
}
const isTestEnv = () => {
  var _a, _b;
  if (typeof process !== "undefined" && ((_a = process == null ? void 0 : process.env) == null ? void 0 : _a.NODE_ENV) === "test") {
    return true;
  }
  if (((_b = import_meta == null ? void 0 : import_meta.env) == null ? void 0 : _b.NODE_ENV) === "test") {
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
    Object.assign(this, { hub, options: reactive(options) });
    this.subscribedTopics = ref([]);
    this.endpoint = computed(() => {
      const url = new URL(this.hub);
      unref(this.subscribedTopics).forEach((topic) => url.searchParams.append("topic", topic));
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
    return this.emitter.on("mercure", callback);
  }
  removeListener(callback) {
    return this.emitter.off("mercure", callback);
  }
  listen() {
    const subscribedTopics = unref(this.subscribedTopics);
    if (subscribedTopics.length === 0) {
      this.stop();
      return;
    }
    this.connect();
  }
  connect() {
    this.stop();
    this.connection = new EventSource$1(unref(this.endpoint), this.options);
    this.connection.onmessage = (event) => this.emitter.emit("mercure", event);
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
      if (Object.keys(data).length === 1) {
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
  const on = (topics, callback) => {
    if (!Array.isArray(topics)) {
      topics = [topics];
    }
    const wrapper = (event) => {
      try {
        const item = JSON.parse(event.data);
        for (const topic of topics) {
          if (typeof uriTemplate(topic).fromUri(getIri(item)) !== "undefined") {
            callback(item);
            break;
          }
        }
      } catch (e) {
      }
    };
    listeners.push(wrapper);
    mercure.addListener(wrapper);
    mercure.subscribe(topics);
  };
  return { synchronize, on };
};
const DEFAULT_CLASSMAP = {
  "hydra:Collection": HydraCollection,
  "hydra:Error": HydraError,
  "ConstraintViolationList": ConstraintViolationList
};
const computedAsPromise = async (callback, defaultValue) => {
  const evaluating = ref(false);
  const value = asyncComputed(callback, defaultValue, { evaluating });
  return new Promise((resolve) => {
    watch(evaluating, (isEvaluating) => {
      if (isEvaluating === false) {
        resolve(value);
      }
    });
  });
};
class Items {
  constructor() {
    Object.assign(this, {
      *[Symbol.iterator]() {
        yield* Object.values(this);
      }
    });
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
    this.classmap = __spreadValues(__spreadValues({}, DEFAULT_CLASSMAP), classmap);
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
      if (typeof ((_a = error.response) == null ? void 0 : _a.data) === "object" && ((_b = error.response) == null ? void 0 : _b.data) != null) {
        error = this.factory(error.response.data, (_c = error.response) == null ? void 0 : _c.status);
      }
      error.statusCode = (_e = error.statusCode) != null ? _e : (_d = error.response) == null ? void 0 : _d.status;
      errorHandler(error);
    }
  }
  async fetchItem({ state }, itemOrIri, options) {
    const iri = getIri(itemOrIri);
    const item = await this.handle(() => this.api.get(iri, options), options);
    return this.storeItem({ state }, this.factory(item));
  }
  async getItem({ state }, itemOrIri, options) {
    if (itemOrIri === null) {
      return null;
    }
    const iri = getIri(itemOrIri);
    const existingItem = getItemByIri(state.items, iri);
    if (existingItem != null) {
      return existingItem;
    }
    if (typeof itemOrIri === "object") {
      const item = this.factory(itemOrIri);
      return this.storeItem({ state }, item);
    }
    return await this.fetchItem({ state }, iri, options);
  }
  async fetchCollection({ state }, iri, options) {
    const data = await this.handle(() => this.api.get(iri, options), options);
    data["hydra:member"] = data["hydra:member"].map((item) => this.factory(item));
    const collection = this.factory(data);
    collection["hydra:member"] = collection["hydra:member"].map((item) => this.factory(item));
    return collection;
  }
  async createItem({ state }, item, options) {
    const endpoint = this.endpoints.for(item);
    item = await this.handle(() => this.api.post(endpoint, item, options), options);
    return this.storeItem({ state }, item);
  }
  async updateItem({ state }, item, options) {
    checkValidItem(item);
    item = await this.handle(() => this.api.put(getIri(item), item, options), options);
    return this.storeItem({ state }, item);
  }
  async upsertItem({ state }, item, options) {
    return hasIri(item) ? this.updateItem({ state }, item, options) : this.createItem({ state }, item, options);
  }
  async deleteItem({ state }, item, options) {
    const iri = getIri(item);
    await this.handle(() => this.api.delete(iri, options), options);
    item = getItemByIri(state.items, iri);
    if (item !== null) {
      this.removeItem({ state }, item);
    }
  }
  async getRelation({ state }, itemOrIri, options) {
    if (itemOrIri === null) {
      return null;
    }
    if (typeof itemOrIri === "object") {
      return itemOrIri;
    }
    if (typeof itemOrIri === "function") {
      return computedAsPromise(() => this.getRelation({ state }, itemOrIri(), options));
    }
    return await this.getItem({ state }, itemOrIri, options);
  }
  async getRelations({ state }, itemsOrIris, options) {
    if (typeof itemsOrIris === "function") {
      return computedAsPromise(() => this.getRelations({ state }, itemsOrIris(), options), []);
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
  }
}
function normalizeSingle(item) {
  if (typeof item === "string") {
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
  constructor(items, multiple = false) {
    super();
    __publicField(this, "items", []);
    __publicField(this, "multiple");
    this.items = Array.isArray(items) ? items : [items];
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
  static async denormalize(input, { store, multiple }) {
    if (Array.isArray(input)) {
      return new this(await denormalizeMultiple(input), multiple != null ? multiple : true);
    }
    return new this([await denormalizeSingle(input, store)], multiple != null ? multiple : false);
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
  static denormalize(input) {
    if (typeof input === "object" && input != null) {
      return new this(input);
    }
    return new this();
  }
}
class TextFilter extends Filter {
  constructor(value = null) {
    super();
    __publicField(this, "value");
    this.value = value;
  }
  normalize() {
    var _a;
    if ([void 0, null, ""].includes((_a = this.value) == null ? void 0 : _a.trim())) {
      return null;
    }
    return this.value.trim();
  }
  static denormalize(input) {
    if ([void 0, null, ""].includes(input == null ? void 0 : input.trim())) {
      return new this(null);
    }
    return new this(input.trim());
  }
}
class TruthyFilter extends Filter {
  constructor(value = false) {
    super();
    __publicField(this, "value");
    this.value = value;
  }
  normalize() {
    return this.value ? "true" : "false";
  }
  static denormalize(input) {
    var _a;
    if ([void 0, null, ""].includes(input == null ? void 0 : input.trim())) {
      return new this(false);
    }
    if (typeof input === "boolean") {
      return new this(input);
    }
    return new this(["true", "on", "yes", "1"].includes((_a = input == null ? void 0 : input.trim()) == null ? void 0 : _a.toLowerCase()));
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
    if (((_b = (_a = this.preload) == null ? void 0 : _a.length) != null ? _b : 0) !== 0) {
      output.preload = [...new Set(this.preload)].map((field) => `"${field}"`).join(", ");
    }
    if (((_d = (_c = this.fields) == null ? void 0 : _c.length) != null ? _d : 0) !== 0) {
      output.fields = [.../* @__PURE__ */ new Set([...this.fields, ...(_e = this.preload) != null ? _e : []])].map((field) => `"${field}"`).join(", ");
    }
    return output;
  }
}
function vulcain({ fields, preload } = {}) {
  return Object.assign(new Vulcain(), { fields }, { preload }).headers;
}
export { ApiClient, ConstraintViolationList, DateRangeFilter, FakeEventSource, FilterCollection, HttpError, HydraCollection, HydraEndpoint, HydraEndpoints, HydraError, HydraPlugin, ItemFilter, Mercure, OrderFilter, TextFilter, TruthyFilter, Violation, areSameIris, checkValidItem, containsIri, createMercure, createStore, getId, getIds, getIri, getIris, getItemByIri, getItemIndexByIri, getItemsByType, hasIri, mercureSync, normalizeIris, partialItem, useFilters, useFormValidation, useItemForm, useMercure, useMercureSync, useStore, vulcain, withoutDuplicates, withoutIri };
