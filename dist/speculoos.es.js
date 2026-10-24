var Jt = Object.defineProperty;
var Qt = (r, t, e) => t in r ? Jt(r, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : r[t] = e;
var m = (r, t, e) => (Qt(r, typeof t != "symbol" ? t + "" : t, e), e);
import { whenever as Wt } from "@vueuse/core";
import { unref as v, isRef as it, ref as W, reactive as rt, readonly as dt, inject as At, computed as mt, watch as Bt, onUnmounted as Gt, toRaw as yt, effectScope as Kt, watchEffect as Xt } from "vue";
import jt from "clone-deep";
import te from "md5";
import F from "is-empty";
import { useRoute as ee, useRouter as re, onBeforeRouteUpdate as ne } from "vue-router";
import { URI as at, QueryString as ft } from "psr7-js";
import { v4 as se } from "uuid";
import ie from "mitt";
import ae from "uri-templates";
class oe extends Error {
  constructor(t) {
    super(t.statusText), this.response = t, this.statusCode = parseInt(this.response.status);
  }
  isStatusCode(t) {
    const e = (n) => parseInt(n) === this.statusCode;
    for (let n of arguments)
      if (e(n))
        return !0;
    return !1;
  }
  isClientError() {
    return this.statusCode >= 400 && this.statusCode < 500;
  }
  isServerError() {
    return this.statusCode >= 500;
  }
  static guard(t) {
    if (t.status >= 400)
      throw new this(t);
    return t;
  }
}
class ue extends Error {
  constructor(t) {
    super(), this.name = "AbortError", this.reason = t;
  }
}
const $t = (r) => {
  if (!(r instanceof Headers))
    return r;
  const t = {};
  for (let e of r.keys())
    t[e] = r.get(e);
  return t;
}, Dt = (...r) => {
  const t = {};
  for (const e of r) {
    const n = $t(e) ?? {};
    for (const s of Object.keys(n)) {
      for (const i of Object.keys(t))
        i.toLowerCase() === s.toLowerCase() && delete t[i];
      t[s] = n[s];
    }
  }
  return t;
}, ce = {
  Accept: "application/ld+json, application/json"
}, fe = async (r) => {
  try {
    const t = await r.text();
    try {
      r.data = JSON.parse(t), r.json = () => new Promise((e) => e(r.data));
    } catch {
      r.data = t, r.json = () => new Promise((n) => n(r.data));
    }
  } catch {
  }
  return r;
}, lt = /* @__PURE__ */ new WeakMap(), gt = (r) => (lt.has(r) || lt.set(r, fe(r)), lt.get(r));
class fr {
  constructor({ baseUri: t = "", options: e = {}, fetcher: n } = {}) {
    m(this, "baseUri");
    m(this, "options");
    m(this, "fetch");
    var s;
    this.baseUri = t, this.options = e, n = n ?? ((s = window.fetch) == null ? void 0 : s.bind(window)), this.fetch = async (i, a) => n(i, a).then(gt);
  }
  resolve(t) {
    return new URL(t, this.baseUri).toString();
  }
  mergeOptions(t) {
    let e = { ...this.options };
    Object.keys(e).includes("headers") && (e.headers = $t(e.headers));
    for (let n of arguments) {
      let s = { ...n };
      Object.keys(s).includes("headers") && (s.headers = Dt(e.headers, s.headers)), e = { ...jt(e), ...jt(s) };
    }
    return e;
  }
  async request(t, e, n) {
    e = `${v(e)}`, n = this.mergeOptions({ method: t }, n), Object.keys(n).includes("headers") && (n.headers = new Headers(Dt(ce, n.headers)));
    let s = () => {
    };
    try {
      if (it(n == null ? void 0 : n.isLoading) && (n.isLoading.value = !0), it(n == null ? void 0 : n.aborted)) {
        const i = new AbortController(), { signal: a } = i;
        n.signal = a, s = Wt(n.aborted, () => i.abort(), { immediate: !0 });
      }
      try {
        const i = await this.fetch(e, n);
        return oe.guard(i);
      } catch (i) {
        throw i.name === "AbortError" ? new ue(i.reason) : i;
      }
    } finally {
      s(), it(n == null ? void 0 : n.isLoading) && (n.isLoading.value = !1);
    }
  }
  async get(t, e = {}) {
    return await this.request("GET", this.resolve(t), this.mergeOptions(e));
  }
  async post(t, e, n = {}) {
    return await this.request("POST", this.resolve(t), this.mergeOptions(
      {
        body: JSON.stringify(v(e)),
        headers: {
          "Content-Type": "application/json"
        }
      },
      n
    ));
  }
  async put(t, e, n = {}) {
    return await this.request("PUT", this.resolve(t), this.mergeOptions(
      {
        body: JSON.stringify(v(e)),
        headers: {
          "Content-Type": "application/json"
        }
      },
      n
    ));
  }
  async delete(t, e = {}) {
    return await this.request("DELETE", this.resolve(t), this.mergeOptions(e));
  }
}
const le = (r) => (r == null ? void 0 : r.signal) == null && ((r == null ? void 0 : r.body) == null || typeof r.body == "string"), he = (r, t) => {
  const e = $t(t == null ? void 0 : t.headers) ?? {}, n = Object.keys(e).map((s) => [s.toLowerCase(), `${e[s]}`]).sort(([s], [i]) => s < i ? -1 : s > i ? 1 : 0);
  return te(JSON.stringify({
    method: t == null ? void 0 : t.method,
    url: `${r}`,
    body: t == null ? void 0 : t.body,
    headers: n,
    credentials: t == null ? void 0 : t.credentials,
    mode: t == null ? void 0 : t.mode,
    cache: t == null ? void 0 : t.cache,
    redirect: t == null ? void 0 : t.redirect
  }));
};
class de {
  constructor(t = ((e) => (e = window.fetch) == null ? void 0 : e.bind(window))()) {
    m(this, "fetch");
    m(this, "pendingRequests", []);
    return this.fetch = t, (n, s) => {
      if (!le(s))
        return this.fetch(n, s).then(gt);
      const i = he(n, s), a = this.pendingRequests.findIndex((l) => i === l.hash);
      if (a >= 0)
        return this.pendingRequests[a].promise;
      const o = this.fetch(n, s).then(gt);
      return this.pendingRequests.push({ hash: i, promise: o }), o.then(
        (l) => (this.removePendingRequest(i), l),
        (l) => {
          throw this.removePendingRequest(i), l;
        }
      );
    };
  }
  removePendingRequest(t) {
    const e = this.pendingRequests.findIndex((n) => t === n.hash);
    e >= 0 && this.pendingRequests.splice(e, 1);
  }
}
function lr(r = void 0) {
  return new de(r);
}
const me = {
  Date: Date.prototype.getTime,
  RegExp: Object.getOwnPropertyDescriptor(RegExp.prototype, "source").get,
  Map: Map.prototype.has,
  Set: Set.prototype.has
};
function et(r, t) {
  if (!(r instanceof t))
    return !1;
  try {
    return me[t.name].call(r), !0;
  } catch {
    return !1;
  }
}
function ye(r) {
  if (et(r, Date))
    return new Date(r.getTime());
  if (et(r, RegExp)) {
    const t = new RegExp(r.source, r.flags);
    return t.lastIndex = r.lastIndex, t;
  }
  return et(r, Map) ? /* @__PURE__ */ new Map() : et(r, Set) ? /* @__PURE__ */ new Set() : null;
}
function ge(r) {
  const t = ye(r);
  return t == null ? Object.create(Object.getPrototypeOf(r)) : Object.setPrototypeOf(t, Object.getPrototypeOf(r));
}
const K = (r, t = !0, e = []) => {
  if (typeof r != "object" || r == null)
    return r;
  const n = e.find((a) => a.orig === r);
  if (n != null)
    return n.cloned;
  let s = Object.assign(ge(r), r);
  Array.isArray(r) && (s = Object.values(s)), e.push({ orig: r, cloned: s });
  const i = (a) => t ? K(a, t, e) : a;
  if (et(r, Map) && r.forEach((a, o) => s.set(i(o), i(a))), et(r, Set) && r.forEach((a) => s.add(i(a))), t)
    for (const a in s)
      typeof s[a] == "object" && s[a] != null && (s[a] = K(s[a], t, e));
  return "__clone" in s && typeof s.__clone == "function" && s.__clone(), s;
};
class J {
  normalize() {
    throw Error("This method is meant to be overriden.");
  }
  async denormalize(t) {
    throw Error("This method is meant to be overriden.");
  }
}
class hr extends J {
  constructor(e = []) {
    super();
    m(this, "values");
    this.values = e;
  }
  normalize() {
    return this.values;
  }
  async denormalize(e) {
    if (typeof e == "string" && (e = e.trim()), [void 0, null, ""].includes(e)) {
      this.values = [];
      return;
    }
    Array.isArray(e) || (e = [e]), this.values = e;
  }
}
var wt = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function St(r) {
  return r && r.__esModule && Object.prototype.hasOwnProperty.call(r, "default") ? r.default : r;
}
var Ct = { exports: {} };
(function(r, t) {
  (function(e, n) {
    r.exports = n();
  })(wt, function() {
    var e = 1e3, n = 6e4, s = 36e5, i = "millisecond", a = "second", o = "minute", l = "hour", S = "day", O = "week", z = "month", T = "quarter", D = "year", $ = "date", h = "Invalid Date", w = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/, Y = /\[([^\]]+)]|YYYY|YY|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g, E = { name: "en", weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"), months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"), ordinal: function(y) {
      var f = ["th", "st", "nd", "rd"], u = y % 100;
      return "[" + y + (f[(u - 20) % 10] || f[u] || f[0]) + "]";
    } }, x = function(y, f, u) {
      var d = String(y);
      return !d || d.length >= f ? y : "" + Array(f + 1 - d.length).join(u) + y;
    }, L = { s: x, z: function(y) {
      var f = -y.utcOffset(), u = Math.abs(f), d = Math.floor(u / 60), c = u % 60;
      return (f <= 0 ? "+" : "-") + x(d, 2, "0") + ":" + x(c, 2, "0");
    }, m: function y(f, u) {
      if (f.date() < u.date())
        return -y(u, f);
      var d = 12 * (u.year() - f.year()) + (u.month() - f.month()), c = f.clone().add(d, z), g = u - c < 0, p = f.clone().add(d + (g ? -1 : 1), z);
      return +(-(d + (u - c) / (g ? c - p : p - c)) || 0);
    }, a: function(y) {
      return y < 0 ? Math.ceil(y) || 0 : Math.floor(y);
    }, p: function(y) {
      return { M: z, y: D, w: O, d: S, D: $, h: l, m: o, s: a, ms: i, Q: T }[y] || String(y || "").toLowerCase().replace(/s$/, "");
    }, u: function(y) {
      return y === void 0;
    } }, P = "en", R = {};
    R[P] = E;
    var V = "$isDayjsObject", q = function(y) {
      return y instanceof Z || !(!y || !y[V]);
    }, H = function y(f, u, d) {
      var c;
      if (!f)
        return P;
      if (typeof f == "string") {
        var g = f.toLowerCase();
        R[g] && (c = g), u && (R[g] = u, c = g);
        var p = f.split("-");
        if (!c && p.length > 1)
          return y(p[0]);
      } else {
        var j = f.name;
        R[j] = f, c = j;
      }
      return !d && c && (P = c), c || !d && P;
    }, M = function(y, f) {
      if (q(y))
        return y.clone();
      var u = typeof f == "object" ? f : {};
      return u.date = y, u.args = arguments, new Z(u);
    }, b = L;
    b.l = H, b.i = q, b.w = function(y, f) {
      return M(y, { locale: f.$L, utc: f.$u, x: f.$x, $offset: f.$offset });
    };
    var Z = function() {
      function y(u) {
        this.$L = H(u.locale, null, !0), this.parse(u), this.$x = this.$x || u.x || {}, this[V] = !0;
      }
      var f = y.prototype;
      return f.parse = function(u) {
        this.$d = function(d) {
          var c = d.date, g = d.utc;
          if (c === null)
            return /* @__PURE__ */ new Date(NaN);
          if (b.u(c))
            return /* @__PURE__ */ new Date();
          if (c instanceof Date)
            return new Date(c);
          if (typeof c == "string" && !/Z$/i.test(c)) {
            var p = c.match(w);
            if (p) {
              var j = p[2] - 1 || 0, I = (p[7] || "0").substring(0, 3);
              return g ? new Date(Date.UTC(p[1], j, p[3] || 1, p[4] || 0, p[5] || 0, p[6] || 0, I)) : new Date(p[1], j, p[3] || 1, p[4] || 0, p[5] || 0, p[6] || 0, I);
            }
          }
          return new Date(c);
        }(u), this.init();
      }, f.init = function() {
        var u = this.$d;
        this.$y = u.getFullYear(), this.$M = u.getMonth(), this.$D = u.getDate(), this.$W = u.getDay(), this.$H = u.getHours(), this.$m = u.getMinutes(), this.$s = u.getSeconds(), this.$ms = u.getMilliseconds();
      }, f.$utils = function() {
        return b;
      }, f.isValid = function() {
        return this.$d.toString() !== h;
      }, f.isSame = function(u, d) {
        var c = M(u);
        return this.startOf(d) <= c && c <= this.endOf(d);
      }, f.isAfter = function(u, d) {
        return M(u) < this.startOf(d);
      }, f.isBefore = function(u, d) {
        return this.endOf(d) < M(u);
      }, f.$g = function(u, d, c) {
        return b.u(u) ? this[d] : this.set(c, u);
      }, f.unix = function() {
        return Math.floor(this.valueOf() / 1e3);
      }, f.valueOf = function() {
        return this.$d.getTime();
      }, f.startOf = function(u, d) {
        var c = this, g = !!b.u(d) || d, p = b.p(u), j = function(G, k) {
          var Q = b.w(c.$u ? Date.UTC(c.$y, k, G) : new Date(c.$y, k, G), c);
          return g ? Q : Q.endOf(S);
        }, I = function(G, k) {
          return b.w(c.toDate()[G].apply(c.toDate("s"), (g ? [0, 0, 0, 0] : [23, 59, 59, 999]).slice(k)), c);
        }, A = this.$W, U = this.$M, N = this.$D, tt = "set" + (this.$u ? "UTC" : "");
        switch (p) {
          case D:
            return g ? j(1, 0) : j(31, 11);
          case z:
            return g ? j(1, U) : j(0, U + 1);
          case O:
            var B = this.$locale().weekStart || 0, nt = (A < B ? A + 7 : A) - B;
            return j(g ? N - nt : N + (6 - nt), U);
          case S:
          case $:
            return I(tt + "Hours", 0);
          case l:
            return I(tt + "Minutes", 1);
          case o:
            return I(tt + "Seconds", 2);
          case a:
            return I(tt + "Milliseconds", 3);
          default:
            return this.clone();
        }
      }, f.endOf = function(u) {
        return this.startOf(u, !1);
      }, f.$set = function(u, d) {
        var c, g = b.p(u), p = "set" + (this.$u ? "UTC" : ""), j = (c = {}, c[S] = p + "Date", c[$] = p + "Date", c[z] = p + "Month", c[D] = p + "FullYear", c[l] = p + "Hours", c[o] = p + "Minutes", c[a] = p + "Seconds", c[i] = p + "Milliseconds", c)[g], I = g === S ? this.$D + (d - this.$W) : d;
        if (g === z || g === D) {
          var A = this.clone().set($, 1);
          A.$d[j](I), A.init(), this.$d = A.set($, Math.min(this.$D, A.daysInMonth())).$d;
        } else
          j && this.$d[j](I);
        return this.init(), this;
      }, f.set = function(u, d) {
        return this.clone().$set(u, d);
      }, f.get = function(u) {
        return this[b.p(u)]();
      }, f.add = function(u, d) {
        var c, g = this;
        u = Number(u);
        var p = b.p(d), j = function(U) {
          var N = M(g);
          return b.w(N.date(N.date() + Math.round(U * u)), g);
        };
        if (p === z)
          return this.set(z, this.$M + u);
        if (p === D)
          return this.set(D, this.$y + u);
        if (p === S)
          return j(1);
        if (p === O)
          return j(7);
        var I = (c = {}, c[o] = n, c[l] = s, c[a] = e, c)[p] || 1, A = this.$d.getTime() + u * I;
        return b.w(A, this);
      }, f.subtract = function(u, d) {
        return this.add(-1 * u, d);
      }, f.format = function(u) {
        var d = this, c = this.$locale();
        if (!this.isValid())
          return c.invalidDate || h;
        var g = u || "YYYY-MM-DDTHH:mm:ssZ", p = b.z(this), j = this.$H, I = this.$m, A = this.$M, U = c.weekdays, N = c.months, tt = c.meridiem, B = function(k, Q, st, ct) {
          return k && (k[Q] || k(d, g)) || st[Q].slice(0, ct);
        }, nt = function(k) {
          return b.s(j % 12 || 12, k, "0");
        }, G = tt || function(k, Q, st) {
          var ct = k < 12 ? "AM" : "PM";
          return st ? ct.toLowerCase() : ct;
        };
        return g.replace(Y, function(k, Q) {
          return Q || function(st) {
            switch (st) {
              case "YY":
                return String(d.$y).slice(-2);
              case "YYYY":
                return b.s(d.$y, 4, "0");
              case "M":
                return A + 1;
              case "MM":
                return b.s(A + 1, 2, "0");
              case "MMM":
                return B(c.monthsShort, A, N, 3);
              case "MMMM":
                return B(N, A);
              case "D":
                return d.$D;
              case "DD":
                return b.s(d.$D, 2, "0");
              case "d":
                return String(d.$W);
              case "dd":
                return B(c.weekdaysMin, d.$W, U, 2);
              case "ddd":
                return B(c.weekdaysShort, d.$W, U, 3);
              case "dddd":
                return U[d.$W];
              case "H":
                return String(j);
              case "HH":
                return b.s(j, 2, "0");
              case "h":
                return nt(1);
              case "hh":
                return nt(2);
              case "a":
                return G(j, I, !0);
              case "A":
                return G(j, I, !1);
              case "m":
                return String(I);
              case "mm":
                return b.s(I, 2, "0");
              case "s":
                return String(d.$s);
              case "ss":
                return b.s(d.$s, 2, "0");
              case "SSS":
                return b.s(d.$ms, 3, "0");
              case "Z":
                return p;
            }
            return null;
          }(k) || p.replace(":", "");
        });
      }, f.utcOffset = function() {
        return 15 * -Math.round(this.$d.getTimezoneOffset() / 15);
      }, f.diff = function(u, d, c) {
        var g, p = this, j = b.p(d), I = M(u), A = (I.utcOffset() - this.utcOffset()) * n, U = this - I, N = function() {
          return b.m(p, I);
        };
        switch (j) {
          case D:
            g = N() / 12;
            break;
          case z:
            g = N();
            break;
          case T:
            g = N() / 3;
            break;
          case O:
            g = (U - A) / 6048e5;
            break;
          case S:
            g = (U - A) / 864e5;
            break;
          case l:
            g = U / s;
            break;
          case o:
            g = U / n;
            break;
          case a:
            g = U / e;
            break;
          default:
            g = U;
        }
        return c ? g : b.a(g);
      }, f.daysInMonth = function() {
        return this.endOf(z).$D;
      }, f.$locale = function() {
        return R[this.$L];
      }, f.locale = function(u, d) {
        if (!u)
          return this.$L;
        var c = this.clone(), g = H(u, d, !0);
        return g && (c.$L = g), c;
      }, f.clone = function() {
        return b.w(this.$d, this);
      }, f.toDate = function() {
        return new Date(this.valueOf());
      }, f.toJSON = function() {
        return this.isValid() ? this.toISOString() : null;
      }, f.toISOString = function() {
        return this.$d.toISOString();
      }, f.toString = function() {
        return this.$d.toUTCString();
      }, y;
    }(), X = Z.prototype;
    return M.prototype = X, [["$ms", i], ["$s", a], ["$m", o], ["$H", l], ["$W", S], ["$M", z], ["$y", D], ["$D", $]].forEach(function(y) {
      X[y[1]] = function(f) {
        return this.$g(f, y[0], y[1]);
      };
    }), M.extend = function(y, f) {
      return y.$i || (y(f, Z, M), y.$i = !0), M;
    }, M.locale = H, M.isDayjs = q, M.unix = function(y) {
      return M(1e3 * y);
    }, M.en = R[P], M.Ls = R, M.p = {}, M;
  });
})(Ct);
var pe = Ct.exports;
const C = /* @__PURE__ */ St(pe);
var Yt = { exports: {} };
(function(r, t) {
  (function(e, n) {
    r.exports = n();
  })(wt, function() {
    var e = "minute", n = /[+-]\d\d(?::?\d\d)?/g, s = /([+-]|\d\d)/g;
    return function(i, a, o) {
      var l = a.prototype;
      o.utc = function(h) {
        var w = { date: h, utc: !0, args: arguments };
        return new a(w);
      }, l.utc = function(h) {
        var w = o(this.toDate(), { locale: this.$L, utc: !0 });
        return h ? w.add(this.utcOffset(), e) : w;
      }, l.local = function() {
        return o(this.toDate(), { locale: this.$L, utc: !1 });
      };
      var S = l.parse;
      l.parse = function(h) {
        h.utc && (this.$u = !0), this.$utils().u(h.$offset) || (this.$offset = h.$offset), S.call(this, h);
      };
      var O = l.init;
      l.init = function() {
        if (this.$u) {
          var h = this.$d;
          this.$y = h.getUTCFullYear(), this.$M = h.getUTCMonth(), this.$D = h.getUTCDate(), this.$W = h.getUTCDay(), this.$H = h.getUTCHours(), this.$m = h.getUTCMinutes(), this.$s = h.getUTCSeconds(), this.$ms = h.getUTCMilliseconds();
        } else
          O.call(this);
      };
      var z = l.utcOffset;
      l.utcOffset = function(h, w) {
        var Y = this.$utils().u;
        if (Y(h))
          return this.$u ? 0 : Y(this.$offset) ? z.call(this) : this.$offset;
        if (typeof h == "string" && (h = function(P) {
          P === void 0 && (P = "");
          var R = P.match(n);
          if (!R)
            return null;
          var V = ("" + R[0]).match(s) || ["-", 0, 0], q = V[0], H = 60 * +V[1] + +V[2];
          return H === 0 ? 0 : q === "+" ? H : -H;
        }(h), h === null))
          return this;
        var E = Math.abs(h) <= 16 ? 60 * h : h;
        if (E === 0)
          return this.utc(w);
        var x = this.clone();
        if (w)
          return x.$offset = E, x.$u = !1, x;
        var L = this.$u ? this.toDate().getTimezoneOffset() : -1 * this.utcOffset();
        return (x = this.local().add(E + L, e)).$offset = E, x.$x.$localOffset = L, x;
      };
      var T = l.format;
      l.format = function(h) {
        var w = h || (this.$u ? "YYYY-MM-DDTHH:mm:ss[Z]" : "");
        return T.call(this, w);
      }, l.valueOf = function() {
        var h = this.$utils().u(this.$offset) ? 0 : this.$offset + (this.$x.$localOffset || this.$d.getTimezoneOffset());
        return this.$d.valueOf() - 6e4 * h;
      }, l.isUTC = function() {
        return !!this.$u;
      }, l.toISOString = function() {
        return this.toDate().toISOString();
      }, l.toString = function() {
        return this.toDate().toUTCString();
      };
      var D = l.toDate;
      l.toDate = function(h) {
        return h === "s" && this.$offset ? o(this.format("YYYY-MM-DD HH:mm:ss:SSS")).toDate() : D.call(this);
      };
      var $ = l.diff;
      l.diff = function(h, w, Y) {
        if (h && this.$u === h.$u)
          return $.call(this, h, w, Y);
        var E = this.local(), x = o(h).local();
        return $.call(E, x, w, Y);
      };
    };
  });
})(Yt);
var ve = Yt.exports;
const _t = /* @__PURE__ */ St(ve);
var Ut = { exports: {} };
(function(r, t) {
  (function(e, n) {
    r.exports = n();
  })(wt, function() {
    var e = { year: 0, month: 1, day: 2, hour: 3, minute: 4, second: 5 }, n = {};
    return function(s, i, a) {
      var o, l = function(T, D, $) {
        $ === void 0 && ($ = {});
        var h = new Date(T), w = function(Y, E) {
          E === void 0 && (E = {});
          var x = E.timeZoneName || "short", L = Y + "|" + x, P = n[L];
          return P || (P = new Intl.DateTimeFormat("en-US", { hour12: !1, timeZone: Y, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: x }), n[L] = P), P;
        }(D, $);
        return w.formatToParts(h);
      }, S = function(T, D) {
        for (var $ = l(T, D), h = [], w = 0; w < $.length; w += 1) {
          var Y = $[w], E = Y.type, x = Y.value, L = e[E];
          L >= 0 && (h[L] = parseInt(x, 10));
        }
        var P = h[3], R = P === 24 ? 0 : P, V = h[0] + "-" + h[1] + "-" + h[2] + " " + R + ":" + h[4] + ":" + h[5] + ":000", q = +T;
        return (a.utc(V).valueOf() - (q -= q % 1e3)) / 6e4;
      }, O = i.prototype;
      O.tz = function(T, D) {
        if (T === void 0 && (T = o), !this.isValid())
          return this;
        var $, h = this.utcOffset(), w = this.toDate(), Y = w.toLocaleString("en-US", { timeZone: T }), E = S(+w, T);
        if (!Number(E))
          $ = this.utcOffset(0, D);
        else if ($ = a(Y, { locale: this.$L }).$set("millisecond", this.$ms).utcOffset(E, !0), D) {
          var x = $.utcOffset();
          $ = $.add(h - x, "minute");
        }
        return $.$x.$timezone = T, $;
      }, O.offsetName = function(T) {
        var D = this.$x.$timezone || a.tz.guess(), $ = l(this.valueOf(), D, { timeZoneName: T }).find(function(h) {
          return h.type.toLowerCase() === "timezonename";
        });
        return $ && $.value;
      };
      var z = O.startOf;
      O.startOf = function(T, D) {
        if (!this.$x || !this.$x.$timezone)
          return z.call(this, T, D);
        var $ = a(this.format("YYYY-MM-DD HH:mm:ss:SSS"), { locale: this.$L });
        return z.call($, T, D).tz(this.$x.$timezone, !0);
      }, a.tz = function(T, D, $) {
        var h = $ && D, w = $ || D || o, Y = S(+a(), w);
        if (typeof T != "string")
          return a(T).tz(w);
        var E = a.utc(T, h).valueOf();
        if (Number.isNaN(E)) {
          var x = a(NaN);
          return x.$x.$timezone = w, x;
        }
        var L = function(q, H, M) {
          var b = q - 60 * H * 1e3, Z = S(b, M);
          if (H === Z)
            return [b, H];
          var X = S(b -= 60 * (Z - H) * 1e3, M);
          return Z === X ? [b, Z] : [q - 60 * Math.min(Z, X) * 1e3, Math.max(Z, X)];
        }(E, Y, w), P = L[0], R = L[1], V = a(P).utcOffset(R);
        return V.$x.$timezone = w, V;
      }, a.tz.guess = function() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      }, a.tz.setDefault = function(T) {
        o = T;
      };
    };
  });
})(Ut);
var be = Ut.exports;
const Rt = /* @__PURE__ */ St(be);
C.extend(_t);
C.extend(Rt);
class $e extends J {
  constructor({ after: e = null, before: n = null } = {}, { withTime: s = !0, useUserTimezone: i = !0 } = {}) {
    super();
    m(this, "after");
    m(this, "before");
    m(this, "normalizedFormat");
    m(this, "useUserTimezone");
    m(this, "withTime");
    this.after = e, this.before = n, this.normalizedFormat = s ? "YYYY-MM-DD[T]HH:mm:ss[Z]" : "YYYY-MM-DD", this.useUserTimezone = i, this.withTime = s;
  }
  normalize() {
    this.constructor.ensureTimezoneIsSet();
    const e = this.useUserTimezone ? this.constructor.userTimezone : "UTC";
    let n = null, s = null;
    return this.withTime ? (F(this.after) || (n = C.tz(this.after, e).hour(0).minute(0).second(0).tz("UTC").format(this.normalizedFormat)), F(this.before) || (s = C.tz(this.before, e).hour(0).minute(0).second(0).add(1, "day").subtract(1, "second").tz("UTC").format(this.normalizedFormat)), { after: n, before: s }) : (F(this.after) || (n = C.tz(this.after, e).format(this.normalizedFormat)), F(this.before) || (s = C.tz(this.before, e).format(this.normalizedFormat)), { after: n, before: s });
  }
  async denormalize(e) {
    this.constructor.ensureTimezoneIsSet();
    const n = this.useUserTimezone && this.withTime;
    this.after = null, this.before = null, F(e.after) || (this.after = n ? C.tz(e.after, "UTC").tz(this.constructor.userTimezone) : C.tz(e.after, "UTC"), this.after = this.after.hour(0).minute(0).second(0).format("YYYY-MM-DD")), F(e.before) || (this.before = n ? C.tz(e.before, "UTC").tz(this.constructor.userTimezone) : C.tz(e.before, "UTC"), this.before = this.before.hour(0).minute(0).second(0).add(1, "day").subtract(1, "second").format("YYYY-MM-DD"));
  }
  static ensureTimezoneIsSet() {
    this.constructor.userTimezone = this.constructor.userTimezone ?? (C.tz.guess() || "UTC");
  }
}
m($e, "userTimezone");
C.extend(_t);
C.extend(Rt);
class we extends J {
  constructor({ after: e = null, before: n = null } = {}) {
    super();
    m(this, "after");
    m(this, "before");
    this.after = e, this.before = n;
  }
  normalize() {
    this.constructor.ensureTimezoneIsSet();
    let e = null, n = null;
    return F(this.after) || (e = C.tz(this.after, this.constructor.userTimezone).tz("UTC").format("YYYY-MM-DD[T]HH:mm:ss[Z]")), F(this.before) || (n = C.tz(this.before, this.constructor.userTimezone).tz("UTC").format("YYYY-MM-DD[T]HH:mm:ss[Z]")), { after: e, before: n };
  }
  async denormalize(e) {
    this.constructor.ensureTimezoneIsSet(), this.after = null, this.before = null, F(e.after) || (this.after = C.tz(e.after, "UTC").tz(this.constructor.userTimezone).format("YYYY-MM-DD[T]HH:mm:ss[Z]")), F(e.before) || (this.before = C.tz(e.before, "UTC").tz(this.constructor.userTimezone).format("YYYY-MM-DD[T]HH:mm:ss[Z]"));
  }
  static ensureTimezoneIsSet() {
    this.constructor.userTimezone = this.constructor.userTimezone ?? (C.tz.guess() || "UTC");
  }
}
m(we, "userTimezone");
function Se(r) {
  return r == null ? !0 : typeof r == "string" ? r.trim().length === 0 : typeof r == "function" || Array.isArray(r) ? r.length === 0 : r instanceof Object ? Object.keys(r).length === 0 : !1;
}
function pt(r) {
  if (!(r instanceof Object))
    return r;
  if (Array.isArray(r))
    return r.map(pt);
  const t = { ...r };
  return Object.keys(t).forEach((e) => {
    t[e] instanceof Object && (t[e] = pt(t[e])), Se(t[e]) && delete t[e];
  }), t;
}
function Oe(r) {
  if (typeof r != "object" || r == null)
    return !1;
  const t = Object.getPrototypeOf(r);
  return t == null || Object.prototype === t;
}
function ze(r) {
  return Oe(r) && Object.values(r).every((t) => typeof t != "function");
}
function xt(r) {
  const t = {};
  return Object.keys(r).forEach((e) => {
    const n = r[e];
    Array.isArray(n) ? t[e] = [...n] : ze(n) ? t[e] = { ...n } : t[e] = n;
  }), t;
}
function kt(r, t) {
  Object.defineProperty(r, "_initialStates", {
    value: t,
    writable: !0,
    configurable: !0,
    enumerable: !1
  });
}
class dr {
  constructor(t = {}) {
    m(this, "_filters", []);
    if (!(t instanceof Object))
      throw Error("A FilterCollection expects an object.");
    kt(this, {}), Object.keys(t).forEach((e) => {
      if (!(t[e] instanceof J))
        throw Error(`Filter ${e} doesn't extend the Filter class.`);
      this[e] = t[e], this._filters.push(e), this._initialStates[e] = xt(t[e]);
    });
  }
  normalize() {
    const t = {};
    return this._filters.forEach((e) => {
      const n = this[e];
      t[e] = n.normalize();
    }), pt(t);
  }
  async denormalize(t) {
    var n;
    const e = [];
    for (const s of this._filters) {
      const i = this[s];
      i instanceof J && (typeof t[s] < "u" ? e.push(i.denormalize(t[s])) : ((n = this._initialStates) == null ? void 0 : n[s]) != null && Object.assign(i, xt(this._initialStates[s])));
    }
    return e.length > 0 && await Promise.all(e), this;
  }
}
async function mr(r = {}, t = {
  preserveQuery: !1,
  targetRoute: void 0
}) {
  if (typeof r != "function")
    throw Error("initialState should be provided as a function.");
  const e = ee(), n = re(), s = W(r());
  async function i(S) {
    kt(v(s), r()._initialStates), Object.assign(v(s), await v(s).denormalize(S.query));
  }
  function a() {
    s.value = K(r());
  }
  function o(S = {}) {
    const O = {};
    return t.preserveQuery === !0 && Object.assign(O, e.query), Object.assign(O, v(s).normalize(), S);
  }
  async function l(S = {}) {
    const O = v(t.targetRoute) ?? e;
    await n.push(Object.assign({ ...O }, { query: o(S) }));
  }
  return ne((S) => i(S)), await i(e), {
    filters: s,
    buildQueryParams: o,
    submit: l,
    clear: a
  };
}
const yr = async ({ state: r = {}, methods: t = {}, name: e = "store" } = {}) => {
  r = rt(r);
  const n = [], s = {
    name: e,
    state: r,
    ...Object.keys(t).reduce(function(i, a) {
      const o = t[a];
      return i[a] = function() {
        return o(r, ...arguments);
      }, i;
    }, {}),
    async use(i) {
      return n.push(i), await i.install(this), this;
    },
    async reconciliate(i = !1) {
      const a = n.filter(({ reconciliate: o }) => typeof o == "function");
      if (i === !1)
        return Promise.all(a.map((o) => o.reconciliate(this)));
      for (const o of a)
        await o.reconciliate(this);
    }
  };
  return s.install = (i) => i.provide(e, { ...s, state: dt(r) }), s;
}, Lt = (r = "store") => At(r);
class Te {
  constructor(t) {
    Object.keys(t).forEach((e) => {
      this[e] = new Ot(t[e]);
    });
  }
  for(t) {
    if (typeof t == "string" && Object.keys(this).includes(t))
      return this[t];
    if (!Object.keys(this).includes(t["@type"]))
      throw Error(`Endpoint not found for item ${t["@type"]}.`);
    return this[t["@type"]];
  }
}
class Ot {
  constructor(t) {
    m(this, "endpoint");
    this.endpoint = t;
  }
  toString() {
    return this.endpoint;
  }
  toJSON() {
    return this.endpoint;
  }
  buildIri(t) {
    let e = new at(this.endpoint);
    return e = e.withPath(`${e.getPath()}/${t}`), e.toString();
  }
  withQuery(t) {
    const e = new at(this.endpoint), n = new ft(e).withParams(t);
    return new Ot(e.withQuery(n.toString()).toString());
  }
  paginated(t, e = !1) {
    t = v(t), e = v(e);
    const n = {
      pagination: t === !1 ? 0 : 1,
      partial: e === !1 ? void 0 : 1,
      itemsPerPage: void 0
    };
    return t !== !1 && (n.itemsPerPage = t), this.withQuery(n);
  }
  synchronize(t = window.location.href) {
    return this.withQuery(new ft(new at(t)).getParams());
  }
}
const gr = (r, t) => Lt(t).state.endpoints[r];
function ot(r) {
  return r = v(r), r == null ? !1 : Object.keys(r).includes("@id") && r["@id"] != null;
}
function _(r) {
  return r = v(r), r === null ? null : typeof r == "string" ? r : (zt(r), r["@id"]);
}
function je(r) {
  const t = _(r);
  return t.substring(t.lastIndexOf("/") + 1);
}
function pr(r) {
  return r.map(_);
}
function vr(r) {
  return r.map(je);
}
function zt(r, t = null) {
  if (typeof r != "object" || !("@id" in r))
    throw Error("Invalid item.");
  if (t !== null) {
    if (typeof t == "string" && t !== r["@type"])
      throw Error(`Expected item of type "${t}", got "${r["@type"]}".`);
    if (Array.isArray(t) && t.includes(r["@type"]) === !1)
      throw Error(`Expected item of any "${t.join("|")}", got "${r["@type"]}".`);
  }
}
function ut(r, t) {
  return _(r) === _(t);
}
function De(r, t) {
  if (r = v(r), r = Array.from(r).map(v), t = v(t), Array.isArray(t)) {
    const e = t;
    for (const n of e)
      if (De(r, n))
        return !0;
    return !1;
  }
  for (const e of r)
    if (ut(e, t))
      return !0;
  return !1;
}
function br(r, t) {
  const e = r.findIndex((n) => ut(n, t));
  return e >= 0 && r.splice(e, 1), r;
}
function $r(r, t) {
  const e = r.find((n) => ut(n, t));
  return typeof e > "u" ? null : e;
}
function wr(r, t) {
  return r.findIndex((e) => ut(e, t));
}
function Sr(r, t) {
  return r.filter((e) => e["@type"] === t);
}
function Or(r) {
  Object.assign(r, r.map((t) => _(t)));
}
function zr(r, t) {
  return r = v(r), zt(r), Object.assign({ "@id": r["@id"], "@type": r["@type"] }, t);
}
class Ht extends Error {
  constructor() {
    super(...arguments);
    m(this, "statusCode");
  }
  get title() {
    return this["hydra:title"];
  }
  get description() {
    return this["hydra:description"];
  }
}
class xe {
  constructor() {
    m(this, "id");
    m(this, "propertyPath");
    m(this, "message");
    m(this, "code");
    this.id = se();
  }
}
class Me extends Ht {
  constructor(e) {
    super();
    m(this, "_violations", []);
    Object.assign(
      this,
      {
        *[Symbol.iterator]() {
          yield* this.violations;
        }
      }
    ), Object.assign(this, e);
  }
  /**
   * @returns Array<Violation>
   */
  get violations() {
    return this._violations;
  }
  set violations(e) {
    this._violations = e.map((n) => Object.assign(new xe(), n));
  }
  getPropertyPaths() {
    return [...new Set(this.violations.map(({ propertyPath: e }) => e))];
  }
  getViolations(e) {
    const n = Array.from(arguments);
    return n.length === 0 ? this.violations : F(n[0]) ? this.violations.filter((s) => F(s.propertyPath)) : this.violations.filter((s) => e === s.propertyPath);
  }
}
class Ie {
  constructor(t = {}) {
    Object.assign(
      this,
      {
        ...t,
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
  forEach(t) {
    return (this["hydra:member"] || []).forEach(t);
  }
  map(t) {
    return (this["hydra:member"] || []).map(t);
  }
  filter(t) {
    return (this["hydra:member"] || []).filter(t);
  }
  find(t) {
    return (this["hydra:member"] || []).find(t);
  }
  findIndex(t) {
    return (this["hydra:member"] || []).findIndex(t);
  }
}
function Ee(r) {
  if (typeof r != "object" || r == null)
    throw Error("Invalid object.");
  return Object.keys(r).forEach((t) => delete r[t]), r;
}
function Mt(r) {
  return ot(r) ? _(r) : r;
}
function Pe(r) {
  const t = K(r), e = Object.keys(t);
  for (const n of e) {
    const s = t[n];
    Array.isArray(s) ? t[n] = s.map((i) => Mt(i)) : typeof s == "object" && s != null && (t[n] = Mt(s));
  }
  return t;
}
function It(r, t) {
  return r = Ee(r), Object.assign(r, t);
}
function Tr(r) {
  const t = Lt(), e = W(v(r)), n = rt(K(v(r))), s = mt(() => !ot(v(n))), i = W(!1);
  let a;
  it(r) && Bt(r, () => a = void 0, { deep: !0, flush: "sync" });
  const o = mt(() => JSON.stringify(v(n)) !== JSON.stringify(v(e)));
  return { item: n, isUnsavedDraft: o, isCreationMode: s, isSubmitting: i, reset: (O) => It(n, K(v(O ?? a ?? r))), submit: async (O) => {
    it(O) && (O = v(O));
    try {
      i.value = !0;
      const z = await t.upsertItem(Pe(O ?? n));
      return z === void 0 ? void 0 : (e.value = z, a = z, It(n, K(z)), z);
    } finally {
      i.value = !1;
    }
  } };
}
function jr() {
  const r = W([]), t = (i) => {
    i = v(i), i.querySelectorAll("[name]").forEach(function(a) {
      a.setCustomValidity("");
    }), r.value = [];
  }, e = (i, a = !0) => {
    i = v(i);
    const o = i.checkValidity();
    return !o && a && i.reportValidity(), o;
  }, n = (i, a) => {
    t(i), Array.from(a).forEach((o) => s(i, o)), e(i);
  }, s = (i, { propertyPath: a, message: o }) => {
    i = v(i);
    const l = i.querySelector(`[name='${a}']`);
    l == null || l.setCustomValidity(o), l || r.value.push({ propertyPath: a, message: o });
  };
  return { resetValidity: t, bindViolations: n, unmappedViolations: r, validate: e };
}
let vt;
const Ae = 1, Ce = 2;
class Ye {
  constructor(t, e) {
    m(this, "readyState", Ae);
    m(this, "url");
    m(this, "withCredentials");
    this.url = t, this.withCredentials = (e == null ? void 0 : e.withCredentials) ?? !1, setTimeout(() => this.onopen(), 10);
  }
  onerror() {
  }
  onmessage() {
  }
  onopen() {
  }
  close() {
    this.readyState = Ce;
  }
  triggerEvent(t) {
    this.onmessage(t);
  }
  triggerError(t) {
    this.onerror(t);
  }
}
const _e = () => {
  var r, t, e;
  return typeof process < "u" && ((r = process == null ? void 0 : process.env) == null ? void 0 : r.NODE_ENV) === "test" || ((e = (t = import.meta) == null ? void 0 : t.env) == null ? void 0 : e.NODE_ENV) === "test";
};
_e() ? vt = Ye : vt = window.EventSource;
const Ue = vt, Dr = (r, t) => {
  const e = new Le(r, t);
  return Object.assign(e, {
    install(n) {
      n.provide("mercure", e);
    }
  });
}, Re = () => At("mercure");
function ke(r, t) {
  return r.length === t.length && r.every((e) => t.includes(e));
}
class Le {
  constructor(t, e = {}) {
    m(this, "hub");
    m(this, "options");
    m(this, "connection");
    m(this, "subscribedTopics");
    m(this, "endpoint");
    m(this, "emitter");
    m(this, "lastEventId");
    Object.assign(this, { hub: t, options: rt(e) }), this.lastEventId = W(), this.subscribedTopics = W([]), this.endpoint = mt(() => {
      const n = new URL(this.hub), s = v(this.subscribedTopics);
      return s.includes("*") ? n.searchParams.append("topic", "*") : s.forEach((i) => n.searchParams.append("topic", i)), v(this.lastEventId) && n.searchParams.append("Last-Event-ID", v(this.lastEventId)), n.toString();
    }), this.emitter = ie();
  }
  subscribe(t = ["*"], e = !0) {
    Array.isArray(t) || (t = [t]);
    const n = Array.from(v(this.subscribedTopics)), s = [.../* @__PURE__ */ new Set([...v(this.subscribedTopics), ...t])];
    this.subscribedTopics.value = s, e && !ke(n, s) && this.listen();
  }
  unsubscribe(t) {
    Array.isArray(t) || (t = [t]), this.subscribedTopics.value = this.subscribedTopics.value.filter((e) => !t.includes(e)), this.connection && this.listen();
  }
  addListener(t) {
    return this.emitter.on("message", t);
  }
  removeListener(t) {
    return this.emitter.off("message", t);
  }
  listen() {
    if (v(this.subscribedTopics).length === 0) {
      this.stop();
      return;
    }
    this.connection || this.connect();
  }
  connect() {
    this.stop(), this.connection = new Ue(v(this.endpoint), this.options), this.connection.onopen = () => this.emitter.emit("open", { endpoint: v(this.endpoint) }), this.connection.onmessage = (t) => (this.lastEventId.value = t.lastEventId, this.emitter.emit("message", t)), this.connection.onerror = (t) => {
      this.emitter.emit("error", t), typeof this.options.reconnectInterval == "number" && (this.stop(), setTimeout(() => this.connect(), this.options.reconnectInterval));
    };
  }
  stop() {
    var t;
    (t = this.connection) == null || t.close(), this.connection = void 0;
  }
}
const Nt = (r, t) => Object.assign(t, r), Ft = () => {
};
function He(r, t, e = ["*"], n = Nt, s = Ft) {
  Array.isArray(t) || (t = [t]), Array.isArray(e) || (e = [e]);
  const i = (a) => {
    try {
      const o = JSON.parse(a.data);
      if (!ot(o))
        return;
      if (Object.keys(o).length === 1) {
        s(_(o));
        return;
      }
      for (const l of t)
        ut(_(o), l) && n(o, v(l));
    } catch (o) {
      console.debug(o);
    }
  };
  return r.addListener(i), r.subscribe(e), i;
}
const Ne = (r, t, e) => {
  Array.isArray(t) || (t = [t]);
  const n = (s) => {
    let i;
    try {
      i = JSON.parse(s.data);
    } catch (a) {
      console.debug(a);
      return;
    }
    if (typeof i != "object") {
      console.debug("Received an event which is not an object.");
      return;
    }
    try {
      for (const a of t)
        if (typeof ae(a).fromUri(_(i)) < "u") {
          e(i);
          break;
        }
    } catch (a) {
      console.error(a);
    }
  };
  return r.addListener(n), r.subscribe(t), n;
}, xr = (r, t = { removeListenersOnUnmount: !0 }) => {
  r = r ?? Re();
  const e = [];
  return t.removeListenersOnUnmount && Gt(() => {
    for (const s of e)
      r.removeListener(s);
  }), {
    synchronize: (s, i = ["*"], a = Nt, o = Ft) => {
      const l = He(r, s, i, a, o);
      return e.push(l), l;
    },
    on(s, i) {
      const a = Ne(r, s, i);
      return e.push(a), a;
    }
  };
}, Fe = {
  "hydra:Collection": Ie,
  "hydra:Error": Ht,
  ConstraintViolationList: Me
};
function bt(r, t, e = /* @__PURE__ */ new WeakMap()) {
  var i;
  if (r = yt(r), t = yt(t), Object.is(r, t))
    return !0;
  if (typeof r != "object" || typeof t != "object" || r === null || t === null)
    return !1;
  if ((i = e.get(r)) != null && i.has(t))
    return !0;
  if (e.has(r) || e.set(r, /* @__PURE__ */ new Set()), e.get(r).add(t), Array.isArray(r) || Array.isArray(t))
    return Array.isArray(r) && Array.isArray(t) && r.length === t.length && r.every((a, o) => bt(a, t[o], e));
  const n = Object.prototype.toString.call(r);
  if (n !== Object.prototype.toString.call(t) || Object.getPrototypeOf(r) !== Object.getPrototypeOf(t))
    return !1;
  if (n === "[object Date]")
    return r.getTime() === t.getTime();
  if (n !== "[object Object]")
    return !1;
  const s = Object.keys(r);
  return s.length === Object.keys(t).length && s.every((a) => Object.prototype.hasOwnProperty.call(t, a) && bt(r[a], t[a], e));
}
class Et {
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
  forEach(t) {
    return Array.from(this).forEach(t);
  }
  map(t) {
    return Array.from(this).map(t);
  }
  filter(t) {
    return Array.from(this).filter(t);
  }
  find(t) {
    return Array.from(this).find(t);
  }
  findIndex(t) {
    return Array.from(this).findIndex(t);
  }
}
const Vt = (r, t) => t in r && Object.prototype.hasOwnProperty.call(r, t), ht = (r, t) => Vt(r, t) ? r[t] : null, Pt = (r, t, e) => new Promise((n, s) => {
  const i = Kt(), a = W();
  let o = 0, l = !1;
  i.run(() => Xt(async () => {
    const S = ++o, O = r();
    if (!t(O))
      try {
        const z = await e(O);
        if (S !== o)
          return;
        a.value = z, l || (l = !0, n(a));
      } catch (z) {
        S === o && !l && (l = !0, i.stop(), s(z));
      }
  }));
}), Ve = function(r) {
  throw r;
};
class Mr {
  constructor(t, e = {}) {
    m(this, "api");
    m(this, "endpoints");
    m(this, "classmap");
    this.api = t;
    const { endpoints: n, classmap: s } = e;
    this.endpoints = new Te(n ?? {}), this.classmap = { ...Fe, ...s }, this.errorHandler = e.errorHandler ?? Ve;
  }
  factory(t, e) {
    for (const n in this.classmap)
      if (n === (t["@type"] ?? t)) {
        const s = this.classmap[n];
        return t instanceof s ? t : (t = Object.assign(new s(), t), e && Object.assign(t, { statusCode: e }), rt(t));
      }
    return t;
  }
  storeItem({ state: t }, e) {
    const n = _(e);
    if (!Vt(t.items, n))
      t.items[n] = W(e);
    else {
      const s = t.items[n], i = yt(s);
      for (const a of Object.keys(e))
        (!(a in i) || !bt(i[a], e[a])) && (s[a] = e[a]);
    }
    return t.items[n];
  }
  removeItem({ state: t }, e) {
    const n = _(e);
    delete t.items[n];
  }
  async clearItems({ state: t }) {
    t.items = rt(new Et());
  }
  async handle(t, { errorHandler: e = this.errorHandler } = {}) {
    var n, s, i, a;
    try {
      const { data: o } = await t();
      return this.factory(o);
    } catch (o) {
      typeof ((n = o.response) == null ? void 0 : n.data) == "object" && ((s = o.response) == null ? void 0 : s.data) != null && (o = this.factory(o.response.data, (i = o.response) == null ? void 0 : i.status)), o.statusCode = o.statusCode ?? ((a = o.response) == null ? void 0 : a.status), e(o);
    }
  }
  async fetchItem({ state: t }, e, n) {
    let s = new at(_(e));
    n != null && n.groups && (s = s.withQuery(`${new ft(s.getQuery()).withParam("groups", n.groups)}`));
    let i = await this.handle(() => this.api.get(`${s}`, n), n);
    return i === void 0 ? void 0 : (i = this.factory(i), (n == null ? void 0 : n.store) ?? !0 ? this.storeItem({ state: t }, i) : i);
  }
  async getItem({ state: t }, e, n) {
    if (e === null)
      return null;
    const s = _(e), i = ht(t.items, s);
    return i ?? await this.fetchItem({ state: t }, s, n);
  }
  async fetchCollection({ state: t }, e, n) {
    let s = new at(`${e}`);
    n != null && n.groups && (s = s.withQuery(`${new ft(s.getQuery()).withParam("groups", n.groups)}`));
    const i = await this.handle(() => this.api.get(`${s}`, n), n);
    if (i === void 0)
      return;
    i["hydra:member"] = i["hydra:member"].map((l) => this.factory(l));
    const a = this.factory(i);
    if ((n == null ? void 0 : n.store) ?? !1)
      for (const l of a["hydra:member"])
        this.storeItem({ state: t }, l);
    return a;
  }
  async createItem({ state: t }, e, n) {
    const s = this.endpoints.for(e);
    return e = await this.handle(() => this.api.post(s, e, n), n), e === void 0 ? void 0 : (n == null ? void 0 : n.store) ?? !0 ? this.storeItem({ state: t }, e) : e;
  }
  async updateItem({ state: t }, e, n) {
    return zt(e), e = await this.handle(() => this.api.put(_(e), e, n), n), e === void 0 ? void 0 : (n == null ? void 0 : n.store) ?? !0 ? this.storeItem({ state: t }, e) : e;
  }
  async upsertItem({ state: t }, e, n) {
    return ot(e) ? this.updateItem({ state: t }, e, n) : this.createItem({ state: t }, e, n);
  }
  async deleteItem({ state: t }, e, n) {
    const s = _(e);
    await this.handle(() => this.api.delete(s, n), n), e = ht(t.items, s), e !== null && this.removeItem({ state: t }, e);
  }
  async getRelation({ state: t }, e, n = {}) {
    if (e === null)
      return null;
    if (typeof e == "function")
      return Pt(e, (i) => i === void 0, (i) => this.getRelation({ state: t }, i, n));
    const s = (n.useExisting ?? !0) !== !1;
    if (s && (typeof v(e) == "string" || ot(e))) {
      const i = ht(t.items, _(e));
      if (i != null)
        return i;
    }
    if (typeof e == "object" && (n.force ?? !1) === !1 && s) {
      const i = this.factory(e);
      return (n == null ? void 0 : n.store) ?? !1 ? this.storeItem({ state: t }, i) : i;
    }
    return await this.getItem({ state: t }, e, n);
  }
  async getRelations({ state: t }, e, n) {
    return typeof e == "function" ? Pt(e, (s) => s == null, (s) => this.getRelations({ state: t }, s, n)) : Promise.all(e.map((s) => this.getRelation({ state: t }, s, n)));
  }
  async install(t) {
    t.state.items = rt(new Et()), t.state.endpoints = dt(this.endpoints), t.state.classmap = dt(this.classmap), t.storeItem = (e) => this.storeItem(t, e), t.removeItem = (e) => this.removeItem(t, e), t.clearItems = () => this.clearItems(t), t.getItem = (e, n) => this.getItem(t, e, n), t.fetchItem = (e, n) => this.fetchItem(t, e, n), t.fetchCollection = (e, n) => this.fetchCollection(t, e, n), t.createItem = (e, n) => this.createItem(t, e, n), t.updateItem = (e, n) => this.updateItem(t, e, n), t.upsertItem = (e, n) => this.upsertItem(t, e, n), t.deleteItem = (e, n) => this.deleteItem(t, e, n), t.getRelation = (e, n) => this.getRelation(t, e, n), t.getRelations = (e, n) => this.getRelations(t, e, n), t.endpoint = (e) => t.state.endpoints[e], t.getItemsByType = (e) => t.state.items.filter((n) => e === n["@type"]), t.factory = (e, n) => (n = n ?? e, typeof e == "string" && (n["@type"] = e), this.factory(n));
  }
}
function qt(r) {
  if (typeof r == "string")
    return r;
  try {
    return _(r);
  } catch {
    return null;
  }
}
function qe(r) {
  return r.map((t) => qt(t));
}
async function Zt(r, t) {
  try {
    return await t.getItem(r);
  } catch {
    return null;
  }
}
async function Ze(r, t) {
  return Promise.all(r.map((e) => Zt(e, t)));
}
class Ir extends J {
  constructor(e, { store: n, multiple: s = !1 }) {
    super();
    m(this, "items", []);
    m(this, "multiple");
    m(this, "store");
    this.items = Array.isArray(e) ? e : [e], this.store = n, this.multiple = s;
  }
  get item() {
    return this.items[0] ?? null;
  }
  set item(e) {
    this.items = [e], this.multiple = !1;
  }
  normalize() {
    return this.multiple || this.items.length > 1 ? qe(this.items) : qt(this.item);
  }
  async denormalize(e) {
    if (Array.isArray(e)) {
      this.items = await Ze(e, this.store);
      return;
    }
    this.items = [await Zt(e, this.store)];
  }
}
const Je = {
  asc: "desc",
  desc: "asc"
};
class Er extends J {
  constructor(e = {}) {
    super();
    m(this, "order");
    this.order = e;
  }
  revert() {
    const e = {};
    for (const n in this.order) {
      const s = this.order[n];
      e[n] = Je[s] ?? s;
    }
    return this.order = e, this;
  }
  normalize() {
    return this.order;
  }
  async denormalize(e) {
    this.order = {}, typeof e == "object" && e != null && (this.order = e);
  }
}
class Pr extends J {
  constructor(t, e, n = !0, s = !0) {
    super(), this.left = t, this.right = e, this.includeLeft = n, this.includeRight = s;
  }
  normalize() {
    const t = {};
    return this.left != null && (t[this.includeLeft ? "gte" : "gt"] = `${this.left}`), this.right != null && (t[this.includeRight ? "lte" : "lt"] = `${this.right}`), Object.keys(t).length > 0 ? t : void 0;
  }
  async denormalize(t) {
    t == null || typeof t != "object" || (Object.keys(t).includes("gt") && (this.left = parseFloat(t.gt), this.includeLeft = !1), Object.keys(t).includes("gte") && (this.left = parseFloat(t.gte), this.includeLeft = !0), Object.keys(t).includes("lt") && (this.right = parseFloat(t.lt), this.includeRight = !1), Object.keys(t).includes("lte") && (this.right = parseFloat(t.lte), this.includeRight = !0));
  }
}
class Ar extends J {
  constructor(e = null) {
    super();
    m(this, "_value");
    this.value = e;
  }
  get value() {
    return this._value;
  }
  set value(e) {
    this._value = e && e.toString();
  }
  normalize() {
    var e;
    return [void 0, null, ""].includes((e = this.value) == null ? void 0 : e.trim()) ? null : this.value.trim();
  }
  async denormalize(e) {
    if (typeof e == "string" && (e = e.trim()), [void 0, null, ""].includes(e)) {
      this.value = null;
      return;
    }
    this.value = e;
  }
}
class Cr extends J {
  constructor(e = null) {
    super();
    m(this, "value");
    this.value = e;
  }
  normalize() {
    return this.value == null ? null : this.value ? "true" : "false";
  }
  async denormalize(e) {
    if (e == null) {
      this.value = null;
      return;
    }
    e = `${e}`.trim(), this.value = ["true", "on", "yes", "1"].includes(e.toLowerCase());
  }
}
function Yr({ itemsPerPage: r, currentPage: t, totalItems: e }) {
  return e == null ? new Be({ itemsPerPage: r, currentPage: t }) : new We({ itemsPerPage: r, currentPage: t, totalItems: e });
}
function Qe(r) {
  return Array.from({ length: r }, (t, e) => e + 1);
}
class Tt {
  constructor({ itemsPerPage: t, currentPage: e }) {
    m(this, "itemsPerPage");
    m(this, "totalItems");
    m(this, "currentPage");
    m(this, "previousPage");
    m(this, "nextPage");
    m(this, "lastPage");
    m(this, "offset");
    m(this, "_pages");
    this.itemsPerPage = parseInt(t), this.currentPage = parseInt(e), this.offset = Math.max(0, e * t - t), this.previousPage = Math.max(1, this.currentPage - 1);
  }
  get pages() {
    return this._pages === void 0 && (this._pages = Qe(this.lastPage)), this._pages;
  }
  isPartial() {
    return this.totalItems == null;
  }
  isFirstPage(t = void 0) {
    return parseInt(t ?? this.currentPage) === 1;
  }
  isPreviousPage(t) {
    return parseInt(t) === this.previousPage;
  }
  isCurrentPage(t) {
    return parseInt(t) === this.currentPage;
  }
  isNextPage(t) {
    return parseInt(t) === this.nextPage;
  }
  isLastPage(t = void 0) {
    return parseInt(t ?? this.currentPage) === this.lastPage;
  }
  *[Symbol.iterator]() {
    yield* this.pages;
  }
  truncate(t, e = !1) {
    return new Ge(this, t, e);
  }
}
class We extends Tt {
  constructor({ itemsPerPage: t, currentPage: e, totalItems: n }) {
    super({ itemsPerPage: t, currentPage: e }), this.totalItems = parseInt(n), this.lastPage = Math.max(1, Math.ceil(this.totalItems / Math.max(1, this.itemsPerPage))), this.nextPage = Math.min(this.lastPage, this.currentPage + 1);
  }
}
class Be extends Tt {
  constructor({ itemsPerPage: t, currentPage: e, totalItems: n }) {
    super({ itemsPerPage: t, currentPage: e, totalItems: n }), this.nextPage = this.lastPage = this.currentPage + 1;
  }
}
class Ge extends Tt {
  constructor(t, e, n = !1) {
    super(t), Object.assign(this, t);
    const s = [];
    n && s.push(1);
    for (let i = 1; i <= this.lastPage; i++)
      i === this.currentPage && s.push(i), i < this.currentPage && i >= this.currentPage - e && s.push(i), i > this.currentPage && i <= this.currentPage + e && s.push(i);
    n && s.push(this.lastPage), this._pages = [...new Set(s)];
  }
}
class Ke {
  constructor() {
    m(this, "fields");
    m(this, "preload");
  }
  get headers() {
    var e, n;
    const t = {};
    return (((e = this.preload) == null ? void 0 : e.length) ?? 0) !== 0 && (t.preload = [...new Set(this.preload)].map((s) => `"${s}"`).join(", ")), (((n = this.fields) == null ? void 0 : n.length) ?? 0) !== 0 && (t.fields = [.../* @__PURE__ */ new Set([...this.fields, ...this.preload ?? []])].map((s) => `"${s}"`).join(", ")), t;
  }
}
function _r({ fields: r, preload: t } = {}) {
  return Object.assign(new Ke(), { fields: r }, { preload: t }).headers;
}
export {
  ue as AbortError,
  fr as ApiClient,
  hr as ArrayFilter,
  Me as ConstraintViolationList,
  $e as DateRangeFilter,
  we as DatetimeRangeFilter,
  Ye as FakeEventSource,
  dr as FilterCollection,
  oe as HttpError,
  Ie as HydraCollection,
  Ot as HydraEndpoint,
  Te as HydraEndpoints,
  Ht as HydraError,
  Mr as HydraPlugin,
  Ir as ItemFilter,
  Le as Mercure,
  Er as OrderFilter,
  Pr as RangeFilter,
  Ar as TextFilter,
  Cr as TruthyFilter,
  xe as Violation,
  ut as areSameIris,
  zt as checkValidItem,
  K as clone,
  De as containsIri,
  Dr as createMercure,
  Yr as createPager,
  yr as createStore,
  je as getId,
  vr as getIds,
  _ as getIri,
  pr as getIris,
  $r as getItemByIri,
  wr as getItemIndexByIri,
  Sr as getItemsByType,
  ot as hasIri,
  He as mercureSync,
  Or as normalizeIris,
  Pe as normalizeItemRelations,
  Ne as on,
  zr as partialItem,
  gr as useEndpoint,
  mr as useFilters,
  jr as useFormValidation,
  Tr as useItemForm,
  Re as useMercure,
  xr as useMercureSync,
  Lt as useStore,
  _r as vulcain,
  lr as withoutDuplicates,
  br as withoutIri
};
