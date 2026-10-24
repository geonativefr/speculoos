var Gt = Object.defineProperty;
var Xt = (r, t, e) => t in r ? Gt(r, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : r[t] = e;
var d = (r, t, e) => (Xt(r, typeof t != "symbol" ? t + "" : t, e), e);
import { whenever as Kt } from "@vueuse/core";
import { unref as b, isRef as it, ref as J, reactive as rt, readonly as mt, inject as Yt, computed as yt, watch as te, onScopeDispose as ee, toRaw as gt, effectScope as re, watchEffect as ne } from "vue";
import jt from "clone-deep";
import se from "md5";
import V from "is-empty";
import { useRoute as ie, useRouter as ae, onBeforeRouteUpdate as oe } from "vue-router";
import { URI as at, QueryString as ft } from "psr7-js";
import { v4 as ue } from "uuid";
import ce from "mitt";
import fe from "uri-templates";
class le extends Error {
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
class he extends Error {
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
}, Mt = (...r) => {
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
}, de = {
  Accept: "application/ld+json, application/json"
}, me = async (r) => {
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
}, lt = /* @__PURE__ */ new WeakMap(), pt = (r) => (lt.has(r) || lt.set(r, me(r)), lt.get(r));
class mr {
  constructor({ baseUri: t = "", options: e = {}, fetcher: n } = {}) {
    d(this, "baseUri");
    d(this, "options");
    d(this, "fetch");
    var s;
    this.baseUri = t, this.options = e, n = n ?? ((s = window.fetch) == null ? void 0 : s.bind(window)), this.fetch = async (i, a) => n(i, a).then(pt);
  }
  resolve(t) {
    return new URL(t, this.baseUri).toString();
  }
  mergeOptions(t) {
    let e = { ...this.options };
    Object.keys(e).includes("headers") && (e.headers = $t(e.headers));
    for (let n of arguments) {
      let s = { ...n };
      Object.keys(s).includes("headers") && (s.headers = Mt(e.headers, s.headers)), e = { ...jt(e), ...jt(s) };
    }
    return e;
  }
  async request(t, e, n) {
    e = `${b(e)}`, n = this.mergeOptions({ method: t }, n), Object.keys(n).includes("headers") && (n.headers = new Headers(Mt(de, n.headers)));
    let s = () => {
    };
    try {
      if (it(n == null ? void 0 : n.isLoading) && (n.isLoading.value = !0), it(n == null ? void 0 : n.aborted)) {
        const i = new AbortController(), { signal: a } = i;
        n.signal = a, s = Kt(n.aborted, () => i.abort(), { immediate: !0 });
      }
      try {
        const i = await this.fetch(e, n);
        return le.guard(i);
      } catch (i) {
        throw i.name === "AbortError" ? new he(i.reason) : i;
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
        body: JSON.stringify(b(e)),
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
        body: JSON.stringify(b(e)),
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
const ye = (r) => (r == null ? void 0 : r.signal) == null && ((r == null ? void 0 : r.body) == null || typeof r.body == "string"), ge = (r, t) => {
  const e = $t(t == null ? void 0 : t.headers) ?? {}, n = Object.keys(e).map((s) => [s.toLowerCase(), `${e[s]}`]).sort(([s], [i]) => s < i ? -1 : s > i ? 1 : 0);
  return se(JSON.stringify({
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
class pe {
  constructor(t = ((e) => (e = window.fetch) == null ? void 0 : e.bind(window))()) {
    d(this, "fetch");
    d(this, "pendingRequests", []);
    return this.fetch = t, (n, s) => {
      if (!ye(s))
        return this.fetch(n, s).then(pt);
      const i = ge(n, s), a = this.pendingRequests.findIndex((l) => i === l.hash);
      if (a >= 0)
        return this.pendingRequests[a].promise;
      const o = this.fetch(n, s).then(pt);
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
function yr(r = void 0) {
  return new pe(r);
}
const be = {
  Date: Date.prototype.getTime,
  RegExp: Object.getOwnPropertyDescriptor(RegExp.prototype, "source").get,
  Map: Map.prototype.has,
  Set: Set.prototype.has
};
function et(r, t) {
  if (!(r instanceof t))
    return !1;
  try {
    return be[t.name].call(r), !0;
  } catch {
    return !1;
  }
}
function ve(r) {
  if (et(r, Date))
    return new Date(r.getTime());
  if (et(r, RegExp)) {
    const t = new RegExp(r.source, r.flags);
    return t.lastIndex = r.lastIndex, t;
  }
  return et(r, Map) ? /* @__PURE__ */ new Map() : et(r, Set) ? /* @__PURE__ */ new Set() : null;
}
function we(r) {
  const t = ve(r);
  return t == null ? Object.create(Object.getPrototypeOf(r)) : Object.setPrototypeOf(t, Object.getPrototypeOf(r));
}
const X = (r, t = !0, e = []) => {
  if (typeof r != "object" || r == null)
    return r;
  const n = e.find((a) => a.orig === r);
  if (n != null)
    return n.cloned;
  let s = Object.assign(we(r), r);
  Array.isArray(r) && (s = Object.values(s)), e.push({ orig: r, cloned: s });
  const i = (a) => t ? X(a, t, e) : a;
  if (et(r, Map) && r.forEach((a, o) => s.set(i(o), i(a))), et(r, Set) && r.forEach((a) => s.add(i(a))), t)
    for (const a in s)
      typeof s[a] == "object" && s[a] != null && (s[a] = X(s[a], t, e));
  return "__clone" in s && typeof s.__clone == "function" && s.__clone(), s;
};
class W {
  normalize() {
    throw Error("This method is meant to be overriden.");
  }
  async denormalize(t) {
    throw Error("This method is meant to be overriden.");
  }
}
class gr extends W {
  constructor(e = []) {
    super();
    d(this, "values");
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
var St = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Tt(r) {
  return r && r.__esModule && Object.prototype.hasOwnProperty.call(r, "default") ? r.default : r;
}
var Rt = { exports: {} };
(function(r, t) {
  (function(e, n) {
    r.exports = n();
  })(St, function() {
    var e = 1e3, n = 6e4, s = 36e5, i = "millisecond", a = "second", o = "minute", l = "hour", $ = "day", T = "week", O = "month", z = "quarter", j = "year", w = "date", h = "Invalid Date", S = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/, C = /\[([^\]]+)]|YYYY|YY|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g, I = { name: "en", weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"), months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"), ordinal: function(y) {
      var f = ["th", "st", "nd", "rd"], u = y % 100;
      return "[" + y + (f[(u - 20) % 10] || f[u] || f[0]) + "]";
    } }, M = function(y, f, u) {
      var m = String(y);
      return !m || m.length >= f ? y : "" + Array(f + 1 - m.length).join(u) + y;
    }, N = { s: M, z: function(y) {
      var f = -y.utcOffset(), u = Math.abs(f), m = Math.floor(u / 60), c = u % 60;
      return (f <= 0 ? "+" : "-") + M(m, 2, "0") + ":" + M(c, 2, "0");
    }, m: function y(f, u) {
      if (f.date() < u.date())
        return -y(u, f);
      var m = 12 * (u.year() - f.year()) + (u.month() - f.month()), c = f.clone().add(m, O), g = u - c < 0, p = f.clone().add(m + (g ? -1 : 1), O);
      return +(-(m + (u - c) / (g ? c - p : p - c)) || 0);
    }, a: function(y) {
      return y < 0 ? Math.ceil(y) || 0 : Math.floor(y);
    }, p: function(y) {
      return { M: O, y: j, w: T, d: $, D: w, h: l, m: o, s: a, ms: i, Q: z }[y] || String(y || "").toLowerCase().replace(/s$/, "");
    }, u: function(y) {
      return y === void 0;
    } }, P = "en", U = {};
    U[P] = I;
    var F = "$isDayjsObject", q = function(y) {
      return y instanceof Z || !(!y || !y[F]);
    }, H = function y(f, u, m) {
      var c;
      if (!f)
        return P;
      if (typeof f == "string") {
        var g = f.toLowerCase();
        U[g] && (c = g), u && (U[g] = u, c = g);
        var p = f.split("-");
        if (!c && p.length > 1)
          return y(p[0]);
      } else {
        var D = f.name;
        U[D] = f, c = D;
      }
      return !m && c && (P = c), c || !m && P;
    }, x = function(y, f) {
      if (q(y))
        return y.clone();
      var u = typeof f == "object" ? f : {};
      return u.date = y, u.args = arguments, new Z(u);
    }, v = N;
    v.l = H, v.i = q, v.w = function(y, f) {
      return x(y, { locale: f.$L, utc: f.$u, x: f.$x, $offset: f.$offset });
    };
    var Z = function() {
      function y(u) {
        this.$L = H(u.locale, null, !0), this.parse(u), this.$x = this.$x || u.x || {}, this[F] = !0;
      }
      var f = y.prototype;
      return f.parse = function(u) {
        this.$d = function(m) {
          var c = m.date, g = m.utc;
          if (c === null)
            return /* @__PURE__ */ new Date(NaN);
          if (v.u(c))
            return /* @__PURE__ */ new Date();
          if (c instanceof Date)
            return new Date(c);
          if (typeof c == "string" && !/Z$/i.test(c)) {
            var p = c.match(S);
            if (p) {
              var D = p[2] - 1 || 0, E = (p[7] || "0").substring(0, 3);
              return g ? new Date(Date.UTC(p[1], D, p[3] || 1, p[4] || 0, p[5] || 0, p[6] || 0, E)) : new Date(p[1], D, p[3] || 1, p[4] || 0, p[5] || 0, p[6] || 0, E);
            }
          }
          return new Date(c);
        }(u), this.init();
      }, f.init = function() {
        var u = this.$d;
        this.$y = u.getFullYear(), this.$M = u.getMonth(), this.$D = u.getDate(), this.$W = u.getDay(), this.$H = u.getHours(), this.$m = u.getMinutes(), this.$s = u.getSeconds(), this.$ms = u.getMilliseconds();
      }, f.$utils = function() {
        return v;
      }, f.isValid = function() {
        return this.$d.toString() !== h;
      }, f.isSame = function(u, m) {
        var c = x(u);
        return this.startOf(m) <= c && c <= this.endOf(m);
      }, f.isAfter = function(u, m) {
        return x(u) < this.startOf(m);
      }, f.isBefore = function(u, m) {
        return this.endOf(m) < x(u);
      }, f.$g = function(u, m, c) {
        return v.u(u) ? this[m] : this.set(c, u);
      }, f.unix = function() {
        return Math.floor(this.valueOf() / 1e3);
      }, f.valueOf = function() {
        return this.$d.getTime();
      }, f.startOf = function(u, m) {
        var c = this, g = !!v.u(m) || m, p = v.p(u), D = function(G, k) {
          var Q = v.w(c.$u ? Date.UTC(c.$y, k, G) : new Date(c.$y, k, G), c);
          return g ? Q : Q.endOf($);
        }, E = function(G, k) {
          return v.w(c.toDate()[G].apply(c.toDate("s"), (g ? [0, 0, 0, 0] : [23, 59, 59, 999]).slice(k)), c);
        }, _ = this.$W, R = this.$M, L = this.$D, tt = "set" + (this.$u ? "UTC" : "");
        switch (p) {
          case j:
            return g ? D(1, 0) : D(31, 11);
          case O:
            return g ? D(1, R) : D(0, R + 1);
          case T:
            var B = this.$locale().weekStart || 0, nt = (_ < B ? _ + 7 : _) - B;
            return D(g ? L - nt : L + (6 - nt), R);
          case $:
          case w:
            return E(tt + "Hours", 0);
          case l:
            return E(tt + "Minutes", 1);
          case o:
            return E(tt + "Seconds", 2);
          case a:
            return E(tt + "Milliseconds", 3);
          default:
            return this.clone();
        }
      }, f.endOf = function(u) {
        return this.startOf(u, !1);
      }, f.$set = function(u, m) {
        var c, g = v.p(u), p = "set" + (this.$u ? "UTC" : ""), D = (c = {}, c[$] = p + "Date", c[w] = p + "Date", c[O] = p + "Month", c[j] = p + "FullYear", c[l] = p + "Hours", c[o] = p + "Minutes", c[a] = p + "Seconds", c[i] = p + "Milliseconds", c)[g], E = g === $ ? this.$D + (m - this.$W) : m;
        if (g === O || g === j) {
          var _ = this.clone().set(w, 1);
          _.$d[D](E), _.init(), this.$d = _.set(w, Math.min(this.$D, _.daysInMonth())).$d;
        } else
          D && this.$d[D](E);
        return this.init(), this;
      }, f.set = function(u, m) {
        return this.clone().$set(u, m);
      }, f.get = function(u) {
        return this[v.p(u)]();
      }, f.add = function(u, m) {
        var c, g = this;
        u = Number(u);
        var p = v.p(m), D = function(R) {
          var L = x(g);
          return v.w(L.date(L.date() + Math.round(R * u)), g);
        };
        if (p === O)
          return this.set(O, this.$M + u);
        if (p === j)
          return this.set(j, this.$y + u);
        if (p === $)
          return D(1);
        if (p === T)
          return D(7);
        var E = (c = {}, c[o] = n, c[l] = s, c[a] = e, c)[p] || 1, _ = this.$d.getTime() + u * E;
        return v.w(_, this);
      }, f.subtract = function(u, m) {
        return this.add(-1 * u, m);
      }, f.format = function(u) {
        var m = this, c = this.$locale();
        if (!this.isValid())
          return c.invalidDate || h;
        var g = u || "YYYY-MM-DDTHH:mm:ssZ", p = v.z(this), D = this.$H, E = this.$m, _ = this.$M, R = c.weekdays, L = c.months, tt = c.meridiem, B = function(k, Q, st, ct) {
          return k && (k[Q] || k(m, g)) || st[Q].slice(0, ct);
        }, nt = function(k) {
          return v.s(D % 12 || 12, k, "0");
        }, G = tt || function(k, Q, st) {
          var ct = k < 12 ? "AM" : "PM";
          return st ? ct.toLowerCase() : ct;
        };
        return g.replace(C, function(k, Q) {
          return Q || function(st) {
            switch (st) {
              case "YY":
                return String(m.$y).slice(-2);
              case "YYYY":
                return v.s(m.$y, 4, "0");
              case "M":
                return _ + 1;
              case "MM":
                return v.s(_ + 1, 2, "0");
              case "MMM":
                return B(c.monthsShort, _, L, 3);
              case "MMMM":
                return B(L, _);
              case "D":
                return m.$D;
              case "DD":
                return v.s(m.$D, 2, "0");
              case "d":
                return String(m.$W);
              case "dd":
                return B(c.weekdaysMin, m.$W, R, 2);
              case "ddd":
                return B(c.weekdaysShort, m.$W, R, 3);
              case "dddd":
                return R[m.$W];
              case "H":
                return String(D);
              case "HH":
                return v.s(D, 2, "0");
              case "h":
                return nt(1);
              case "hh":
                return nt(2);
              case "a":
                return G(D, E, !0);
              case "A":
                return G(D, E, !1);
              case "m":
                return String(E);
              case "mm":
                return v.s(E, 2, "0");
              case "s":
                return String(m.$s);
              case "ss":
                return v.s(m.$s, 2, "0");
              case "SSS":
                return v.s(m.$ms, 3, "0");
              case "Z":
                return p;
            }
            return null;
          }(k) || p.replace(":", "");
        });
      }, f.utcOffset = function() {
        return 15 * -Math.round(this.$d.getTimezoneOffset() / 15);
      }, f.diff = function(u, m, c) {
        var g, p = this, D = v.p(m), E = x(u), _ = (E.utcOffset() - this.utcOffset()) * n, R = this - E, L = function() {
          return v.m(p, E);
        };
        switch (D) {
          case j:
            g = L() / 12;
            break;
          case O:
            g = L();
            break;
          case z:
            g = L() / 3;
            break;
          case T:
            g = (R - _) / 6048e5;
            break;
          case $:
            g = (R - _) / 864e5;
            break;
          case l:
            g = R / s;
            break;
          case o:
            g = R / n;
            break;
          case a:
            g = R / e;
            break;
          default:
            g = R;
        }
        return c ? g : v.a(g);
      }, f.daysInMonth = function() {
        return this.endOf(O).$D;
      }, f.$locale = function() {
        return U[this.$L];
      }, f.locale = function(u, m) {
        if (!u)
          return this.$L;
        var c = this.clone(), g = H(u, m, !0);
        return g && (c.$L = g), c;
      }, f.clone = function() {
        return v.w(this.$d, this);
      }, f.toDate = function() {
        return new Date(this.valueOf());
      }, f.toJSON = function() {
        return this.isValid() ? this.toISOString() : null;
      }, f.toISOString = function() {
        return this.$d.toISOString();
      }, f.toString = function() {
        return this.$d.toUTCString();
      }, y;
    }(), K = Z.prototype;
    return x.prototype = K, [["$ms", i], ["$s", a], ["$m", o], ["$H", l], ["$W", $], ["$M", O], ["$y", j], ["$D", w]].forEach(function(y) {
      K[y[1]] = function(f) {
        return this.$g(f, y[0], y[1]);
      };
    }), x.extend = function(y, f) {
      return y.$i || (y(f, Z, x), y.$i = !0), x;
    }, x.locale = H, x.isDayjs = q, x.unix = function(y) {
      return x(1e3 * y);
    }, x.en = U[P], x.Ls = U, x.p = {}, x;
  });
})(Rt);
var $e = Rt.exports;
const A = /* @__PURE__ */ Tt($e);
var Ut = { exports: {} };
(function(r, t) {
  (function(e, n) {
    r.exports = n();
  })(St, function() {
    var e = "minute", n = /[+-]\d\d(?::?\d\d)?/g, s = /([+-]|\d\d)/g;
    return function(i, a, o) {
      var l = a.prototype;
      o.utc = function(h) {
        var S = { date: h, utc: !0, args: arguments };
        return new a(S);
      }, l.utc = function(h) {
        var S = o(this.toDate(), { locale: this.$L, utc: !0 });
        return h ? S.add(this.utcOffset(), e) : S;
      }, l.local = function() {
        return o(this.toDate(), { locale: this.$L, utc: !1 });
      };
      var $ = l.parse;
      l.parse = function(h) {
        h.utc && (this.$u = !0), this.$utils().u(h.$offset) || (this.$offset = h.$offset), $.call(this, h);
      };
      var T = l.init;
      l.init = function() {
        if (this.$u) {
          var h = this.$d;
          this.$y = h.getUTCFullYear(), this.$M = h.getUTCMonth(), this.$D = h.getUTCDate(), this.$W = h.getUTCDay(), this.$H = h.getUTCHours(), this.$m = h.getUTCMinutes(), this.$s = h.getUTCSeconds(), this.$ms = h.getUTCMilliseconds();
        } else
          T.call(this);
      };
      var O = l.utcOffset;
      l.utcOffset = function(h, S) {
        var C = this.$utils().u;
        if (C(h))
          return this.$u ? 0 : C(this.$offset) ? O.call(this) : this.$offset;
        if (typeof h == "string" && (h = function(P) {
          P === void 0 && (P = "");
          var U = P.match(n);
          if (!U)
            return null;
          var F = ("" + U[0]).match(s) || ["-", 0, 0], q = F[0], H = 60 * +F[1] + +F[2];
          return H === 0 ? 0 : q === "+" ? H : -H;
        }(h), h === null))
          return this;
        var I = Math.abs(h) <= 16 ? 60 * h : h;
        if (I === 0)
          return this.utc(S);
        var M = this.clone();
        if (S)
          return M.$offset = I, M.$u = !1, M;
        var N = this.$u ? this.toDate().getTimezoneOffset() : -1 * this.utcOffset();
        return (M = this.local().add(I + N, e)).$offset = I, M.$x.$localOffset = N, M;
      };
      var z = l.format;
      l.format = function(h) {
        var S = h || (this.$u ? "YYYY-MM-DDTHH:mm:ss[Z]" : "");
        return z.call(this, S);
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
      var j = l.toDate;
      l.toDate = function(h) {
        return h === "s" && this.$offset ? o(this.format("YYYY-MM-DD HH:mm:ss:SSS")).toDate() : j.call(this);
      };
      var w = l.diff;
      l.diff = function(h, S, C) {
        if (h && this.$u === h.$u)
          return w.call(this, h, S, C);
        var I = this.local(), M = o(h).local();
        return w.call(I, M, S, C);
      };
    };
  });
})(Ut);
var Se = Ut.exports;
const kt = /* @__PURE__ */ Tt(Se);
var Nt = { exports: {} };
(function(r, t) {
  (function(e, n) {
    r.exports = n();
  })(St, function() {
    var e = { year: 0, month: 1, day: 2, hour: 3, minute: 4, second: 5 }, n = {};
    return function(s, i, a) {
      var o, l = function(z, j, w) {
        w === void 0 && (w = {});
        var h = new Date(z), S = function(C, I) {
          I === void 0 && (I = {});
          var M = I.timeZoneName || "short", N = C + "|" + M, P = n[N];
          return P || (P = new Intl.DateTimeFormat("en-US", { hour12: !1, timeZone: C, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: M }), n[N] = P), P;
        }(j, w);
        return S.formatToParts(h);
      }, $ = function(z, j) {
        for (var w = l(z, j), h = [], S = 0; S < w.length; S += 1) {
          var C = w[S], I = C.type, M = C.value, N = e[I];
          N >= 0 && (h[N] = parseInt(M, 10));
        }
        var P = h[3], U = P === 24 ? 0 : P, F = h[0] + "-" + h[1] + "-" + h[2] + " " + U + ":" + h[4] + ":" + h[5] + ":000", q = +z;
        return (a.utc(F).valueOf() - (q -= q % 1e3)) / 6e4;
      }, T = i.prototype;
      T.tz = function(z, j) {
        if (z === void 0 && (z = o), !this.isValid())
          return this;
        var w, h = this.utcOffset(), S = this.toDate(), C = S.toLocaleString("en-US", { timeZone: z }), I = $(+S, z);
        if (!Number(I))
          w = this.utcOffset(0, j);
        else if (w = a(C, { locale: this.$L }).$set("millisecond", this.$ms).utcOffset(I, !0), j) {
          var M = w.utcOffset();
          w = w.add(h - M, "minute");
        }
        return w.$x.$timezone = z, w;
      }, T.offsetName = function(z) {
        var j = this.$x.$timezone || a.tz.guess(), w = l(this.valueOf(), j, { timeZoneName: z }).find(function(h) {
          return h.type.toLowerCase() === "timezonename";
        });
        return w && w.value;
      };
      var O = T.startOf;
      T.startOf = function(z, j) {
        if (!this.$x || !this.$x.$timezone)
          return O.call(this, z, j);
        var w = a(this.format("YYYY-MM-DD HH:mm:ss:SSS"), { locale: this.$L });
        return O.call(w, z, j).tz(this.$x.$timezone, !0);
      }, a.tz = function(z, j, w) {
        var h = w && j, S = w || j || o, C = $(+a(), S);
        if (typeof z != "string")
          return a(z).tz(S);
        var I = a.utc(z, h).valueOf();
        if (Number.isNaN(I)) {
          var M = a(NaN);
          return M.$x.$timezone = S, M;
        }
        var N = function(q, H, x) {
          var v = q - 60 * H * 1e3, Z = $(v, x);
          if (H === Z)
            return [v, H];
          var K = $(v -= 60 * (Z - H) * 1e3, x);
          return Z === K ? [v, Z] : [q - 60 * Math.min(Z, K) * 1e3, Math.max(Z, K)];
        }(I, C, S), P = N[0], U = N[1], F = a(P).utcOffset(U);
        return F.$x.$timezone = S, F;
      }, a.tz.guess = function() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      }, a.tz.setDefault = function(z) {
        o = z;
      };
    };
  });
})(Nt);
var Te = Nt.exports;
const Ht = /* @__PURE__ */ Tt(Te);
A.extend(kt);
A.extend(Ht);
class Oe extends W {
  constructor({ after: e = null, before: n = null } = {}, { withTime: s = !0, useUserTimezone: i = !0 } = {}) {
    super();
    d(this, "after");
    d(this, "before");
    d(this, "normalizedFormat");
    d(this, "useUserTimezone");
    d(this, "withTime");
    this.after = e, this.before = n, this.normalizedFormat = s ? "YYYY-MM-DD[T]HH:mm:ss[Z]" : "YYYY-MM-DD", this.useUserTimezone = i, this.withTime = s;
  }
  normalize() {
    this.constructor.ensureTimezoneIsSet();
    const e = this.useUserTimezone ? this.constructor.userTimezone : "UTC";
    let n = null, s = null;
    return this.withTime ? (V(this.after) || (n = A.tz(this.after, e).hour(0).minute(0).second(0).tz("UTC").format(this.normalizedFormat)), V(this.before) || (s = A.tz(this.before, e).hour(0).minute(0).second(0).add(1, "day").subtract(1, "second").tz("UTC").format(this.normalizedFormat)), { after: n, before: s }) : (V(this.after) || (n = A.tz(this.after, e).format(this.normalizedFormat)), V(this.before) || (s = A.tz(this.before, e).format(this.normalizedFormat)), { after: n, before: s });
  }
  async denormalize(e) {
    this.constructor.ensureTimezoneIsSet();
    const n = this.useUserTimezone && this.withTime;
    this.after = null, this.before = null, V(e.after) || (this.after = n ? A.tz(e.after, "UTC").tz(this.constructor.userTimezone) : A.tz(e.after, "UTC"), this.after = this.after.hour(0).minute(0).second(0).format("YYYY-MM-DD")), V(e.before) || (this.before = n ? A.tz(e.before, "UTC").tz(this.constructor.userTimezone) : A.tz(e.before, "UTC"), this.before = this.before.hour(0).minute(0).second(0).add(1, "day").subtract(1, "second").format("YYYY-MM-DD"));
  }
  static ensureTimezoneIsSet() {
    this.constructor.userTimezone = this.constructor.userTimezone ?? (A.tz.guess() || "UTC");
  }
}
d(Oe, "userTimezone");
A.extend(kt);
A.extend(Ht);
class ze extends W {
  constructor({ after: e = null, before: n = null } = {}) {
    super();
    d(this, "after");
    d(this, "before");
    this.after = e, this.before = n;
  }
  normalize() {
    this.constructor.ensureTimezoneIsSet();
    let e = null, n = null;
    return V(this.after) || (e = A.tz(this.after, this.constructor.userTimezone).tz("UTC").format("YYYY-MM-DD[T]HH:mm:ss[Z]")), V(this.before) || (n = A.tz(this.before, this.constructor.userTimezone).tz("UTC").format("YYYY-MM-DD[T]HH:mm:ss[Z]")), { after: e, before: n };
  }
  async denormalize(e) {
    this.constructor.ensureTimezoneIsSet(), this.after = null, this.before = null, V(e.after) || (this.after = A.tz(e.after, "UTC").tz(this.constructor.userTimezone).format("YYYY-MM-DD[T]HH:mm:ss[Z]")), V(e.before) || (this.before = A.tz(e.before, "UTC").tz(this.constructor.userTimezone).format("YYYY-MM-DD[T]HH:mm:ss[Z]"));
  }
  static ensureTimezoneIsSet() {
    this.constructor.userTimezone = this.constructor.userTimezone ?? (A.tz.guess() || "UTC");
  }
}
d(ze, "userTimezone");
function De(r) {
  return r == null ? !0 : typeof r == "string" ? r.trim().length === 0 : typeof r == "function" || Array.isArray(r) ? r.length === 0 : r instanceof Object ? Object.keys(r).length === 0 : !1;
}
function bt(r) {
  if (!(r instanceof Object))
    return r;
  if (Array.isArray(r))
    return r.map(bt);
  const t = { ...r };
  return Object.keys(t).forEach((e) => {
    t[e] instanceof Object && (t[e] = bt(t[e])), De(t[e]) && delete t[e];
  }), t;
}
function je(r) {
  if (typeof r != "object" || r == null)
    return !1;
  const t = Object.getPrototypeOf(r);
  return t == null || Object.prototype === t;
}
function Me(r) {
  return je(r) && Object.values(r).every((t) => typeof t != "function");
}
function xt(r) {
  const t = {};
  return Object.keys(r).forEach((e) => {
    const n = r[e];
    Array.isArray(n) ? t[e] = [...n] : Me(n) ? t[e] = { ...n } : t[e] = n;
  }), t;
}
function Lt(r, t) {
  Object.defineProperty(r, "_initialStates", {
    value: t,
    writable: !0,
    configurable: !0,
    enumerable: !1
  });
}
class pr {
  constructor(t = {}) {
    d(this, "_filters", []);
    if (!(t instanceof Object))
      throw Error("A FilterCollection expects an object.");
    Lt(this, {}), Object.keys(t).forEach((e) => {
      if (!(t[e] instanceof W))
        throw Error(`Filter ${e} doesn't extend the Filter class.`);
      this[e] = t[e], this._filters.push(e), this._initialStates[e] = xt(t[e]);
    });
  }
  normalize() {
    const t = {};
    return this._filters.forEach((e) => {
      const n = this[e];
      t[e] = n.normalize();
    }), bt(t);
  }
  async denormalize(t) {
    var n;
    const e = [];
    for (const s of this._filters) {
      const i = this[s];
      i instanceof W && (typeof t[s] < "u" ? e.push(i.denormalize(t[s])) : ((n = this._initialStates) == null ? void 0 : n[s]) != null && Object.assign(i, xt(this._initialStates[s])));
    }
    return e.length > 0 && await Promise.all(e), this;
  }
}
async function br(r = {}, t = {
  preserveQuery: !1,
  targetRoute: void 0
}) {
  if (typeof r != "function")
    throw Error("initialState should be provided as a function.");
  const e = ie(), n = ae(), s = J(r());
  async function i($) {
    Lt(b(s), r()._initialStates), Object.assign(b(s), await b(s).denormalize($.query));
  }
  function a() {
    s.value = X(r());
  }
  function o($ = {}) {
    const T = {};
    return t.preserveQuery === !0 && Object.assign(T, e.query), Object.assign(T, b(s).normalize(), $);
  }
  async function l($ = {}) {
    const T = b(t.targetRoute) ?? e;
    await n.push(Object.assign({ ...T }, { query: o($) }));
  }
  return oe(($) => i($)), await i(e), {
    filters: s,
    buildQueryParams: o,
    submit: l,
    clear: a
  };
}
const vr = async ({ state: r = {}, methods: t = {}, name: e = "store" } = {}) => {
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
  return s.install = (i) => i.provide(e, { ...s, state: mt(r) }), s;
}, Vt = (r = "store") => Yt(r);
class xe {
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
    d(this, "endpoint");
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
    t = b(t), e = b(e);
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
const wr = (r, t) => Vt(t).state.endpoints[r];
function ot(r) {
  return r = b(r), r == null ? !1 : Object.keys(r).includes("@id") && r["@id"] != null;
}
function Y(r) {
  return r = b(r), r === null ? null : typeof r == "string" ? r : (zt(r), r["@id"]);
}
function Ee(r) {
  const t = Y(r);
  return t.substring(t.lastIndexOf("/") + 1);
}
function $r(r) {
  return r.map(Y);
}
function Sr(r) {
  return r.map(Ee);
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
  return Y(r) === Y(t);
}
function Ie(r, t) {
  if (r = b(r), r = Array.from(r).map(b), t = b(t), Array.isArray(t)) {
    const e = t;
    for (const n of e)
      if (Ie(r, n))
        return !0;
    return !1;
  }
  for (const e of r)
    if (ut(e, t))
      return !0;
  return !1;
}
function Tr(r, t) {
  const e = r.findIndex((n) => ut(n, t));
  return e >= 0 && r.splice(e, 1), r;
}
function Or(r, t) {
  const e = r.find((n) => ut(n, t));
  return typeof e > "u" ? null : e;
}
function zr(r, t) {
  return r.findIndex((e) => ut(e, t));
}
function Dr(r, t) {
  return r.filter((e) => e["@type"] === t);
}
function jr(r) {
  Object.assign(r, r.map((t) => Y(t)));
}
function Mr(r, t) {
  return r = b(r), zt(r), Object.assign({ "@id": r["@id"], "@type": r["@type"] }, t);
}
class Ft extends Error {
  constructor() {
    super(...arguments);
    d(this, "statusCode");
  }
  get title() {
    return this["hydra:title"];
  }
  get description() {
    return this["hydra:description"];
  }
}
class Pe {
  constructor() {
    d(this, "id");
    d(this, "propertyPath");
    d(this, "message");
    d(this, "code");
    this.id = ue();
  }
}
class _e extends Ft {
  constructor(e) {
    super();
    d(this, "_violations", []);
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
    this._violations = e.map((n) => Object.assign(new Pe(), n));
  }
  getPropertyPaths() {
    return [...new Set(this.violations.map(({ propertyPath: e }) => e))];
  }
  getViolations(e) {
    const n = Array.from(arguments);
    return n.length === 0 ? this.violations : V(n[0]) ? this.violations.filter((s) => V(s.propertyPath)) : this.violations.filter((s) => e === s.propertyPath);
  }
}
class Ae {
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
function Ce(r) {
  if (typeof r != "object" || r == null)
    throw Error("Invalid object.");
  return Object.keys(r).forEach((t) => delete r[t]), r;
}
function Et(r) {
  return ot(r) ? Y(r) : r;
}
function Ye(r) {
  const t = X(r), e = Object.keys(t);
  for (const n of e) {
    const s = t[n];
    Array.isArray(s) ? t[n] = s.map((i) => Et(i)) : typeof s == "object" && s != null && (t[n] = Et(s));
  }
  return t;
}
function It(r, t) {
  return r = Ce(r), Object.assign(r, t);
}
function xr(r) {
  const t = Vt(), e = J(b(r)), n = rt(X(b(r))), s = yt(() => !ot(b(n))), i = J(!1);
  let a;
  it(r) && te(r, () => a = void 0, { deep: !0, flush: "sync" });
  const o = yt(() => JSON.stringify(b(n)) !== JSON.stringify(b(e)));
  return { item: n, isUnsavedDraft: o, isCreationMode: s, isSubmitting: i, reset: (T) => It(n, X(b(T ?? a ?? r))), submit: async (T) => {
    it(T) && (T = b(T));
    try {
      i.value = !0;
      const O = await t.upsertItem(Ye(T ?? n));
      return O === void 0 ? void 0 : (e.value = O, a = O, It(n, X(O)), O);
    } finally {
      i.value = !1;
    }
  } };
}
function Er() {
  const r = J([]), t = (i) => {
    i = b(i), i.querySelectorAll("[name]").forEach(function(a) {
      a.setCustomValidity("");
    }), r.value = [];
  }, e = (i, a = !0) => {
    i = b(i);
    const o = i.checkValidity();
    return !o && a && i.reportValidity(), o;
  }, n = (i, a) => {
    t(i), Array.from(a).forEach((o) => s(i, o)), e(i);
  }, s = (i, { propertyPath: a, message: o }) => {
    i = b(i);
    const l = i.querySelector(`[name='${a}']`);
    l == null || l.setCustomValidity(o), l || r.value.push({ propertyPath: a, message: o });
  };
  return { resetValidity: t, bindViolations: n, unmappedViolations: r, validate: e };
}
let vt;
const Re = 1, Ue = 2;
class ke {
  constructor(t, e) {
    d(this, "readyState", Re);
    d(this, "url");
    d(this, "withCredentials");
    this.url = t, this.withCredentials = (e == null ? void 0 : e.withCredentials) ?? !1, setTimeout(() => this.onopen(), 10);
  }
  onerror() {
  }
  onmessage() {
  }
  onopen() {
  }
  close() {
    this.readyState = Ue;
  }
  triggerEvent(t) {
    this.onmessage(t);
  }
  triggerError(t) {
    this.onerror(t);
  }
}
const Ne = () => {
  var r, t, e;
  return typeof process < "u" && ((r = process == null ? void 0 : process.env) == null ? void 0 : r.NODE_ENV) === "test" || ((e = (t = import.meta) == null ? void 0 : t.env) == null ? void 0 : e.NODE_ENV) === "test";
};
Ne() ? vt = ke : vt = window.EventSource;
const He = vt, Ir = (r, t) => {
  const e = new Fe(r, t);
  return Object.assign(e, {
    install(n) {
      n.provide("mercure", e);
    }
  });
}, Le = () => Yt("mercure"), Ve = 3e4;
function Pt(r, t) {
  return r.length === t.length && r.every((e) => t.includes(e));
}
function _t(r) {
  return r.includes("*") ? ["*"] : r;
}
class Fe {
  constructor(t, e = {}) {
    d(this, "hub");
    d(this, "options");
    d(this, "connection");
    d(this, "subscribedTopics");
    d(this, "endpoint");
    d(this, "emitter");
    d(this, "lastEventId");
    d(this, "_reconnectTimer");
    d(this, "_connectedTopics");
    d(this, "_failedReconnections", 0);
    Object.assign(this, { hub: t, options: rt(e) }), this.lastEventId = J(), this.subscribedTopics = J([]), this.endpoint = yt(() => {
      const n = new URL(this.hub), s = b(this.subscribedTopics);
      return s.includes("*") ? n.searchParams.append("topic", "*") : s.forEach((i) => n.searchParams.append("topic", i)), b(this.lastEventId) && n.searchParams.append("Last-Event-ID", b(this.lastEventId)), n.toString();
    }), this.emitter = ce();
  }
  subscribe(t = ["*"], e = !0) {
    Array.isArray(t) || (t = [t]);
    const n = Array.from(b(this.subscribedTopics)), s = [.../* @__PURE__ */ new Set([...b(this.subscribedTopics), ...t])];
    this.subscribedTopics.value = s, !Pt(n, s) && (this.connection ? this._updateConnectionTopics() : e && this.listen());
  }
  unsubscribe(t) {
    Array.isArray(t) || (t = [t]), this.subscribedTopics.value = this.subscribedTopics.value.filter((e) => !t.includes(e)), this.connection && (this.listen(), this._updateConnectionTopics());
  }
  /*
   * The topic changes of one synchronous run reconnect once, at the end of the run, and only if the
   * effective topics differ from those of the open connection.
   */
  _updateConnectionTopics() {
    Promise.resolve().then(() => {
      if (!this.connection)
        return;
      const t = _t(this._connectedTopics);
      Pt(t, _t(b(this.subscribedTopics))) || this.connect();
    });
  }
  addListener(t) {
    return this.emitter.on("message", t);
  }
  removeListener(t) {
    return this.emitter.off("message", t);
  }
  listen() {
    if (b(this.subscribedTopics).length === 0) {
      this.stop();
      return;
    }
    this.connection || this.connect();
  }
  connect() {
    this.stop();
    const t = new He(b(this.endpoint), this.options);
    this.connection = t, this._connectedTopics = Array.from(b(this.subscribedTopics)), this.connection.onopen = () => {
      t === this.connection && (this._failedReconnections = 0), this.emitter.emit("open", { endpoint: b(this.endpoint) });
    }, this.connection.onmessage = (e) => (this.lastEventId.value = e.lastEventId, this.emitter.emit("message", e)), this.connection.onerror = (e) => {
      this.emitter.emit("error", e), typeof this.options.reconnectInterval == "number" && (this.stop(), this._reconnectTimer = setTimeout(() => this._reconnect(), this._reconnectDelay()));
    };
  }
  /*
   * The first retry waits the reconnection interval, and each consecutive failure doubles it, up to
   * 30 seconds (or the reconnection interval if it is longer).
   */
  _reconnectDelay() {
    const { reconnectInterval: t } = this.options, e = Math.min(
      t * 2 ** this._failedReconnections,
      Math.max(Ve, t)
    );
    return this._failedReconnections++, e;
  }
  _reconnect() {
    this._reconnectTimer = void 0, 0 < b(this.subscribedTopics).length && this.connect();
  }
  stop() {
    var t;
    clearTimeout(this._reconnectTimer), this._reconnectTimer = void 0, (t = this.connection) == null || t.close(), this.connection = void 0;
  }
}
const qt = (r, t) => Object.assign(t, r), Zt = () => {
}, ht = /* @__PURE__ */ new WeakMap();
function Wt(r) {
  if (!ht.has(r)) {
    let e;
    try {
      e = { data: JSON.parse(r.data) };
    } catch (n) {
      e = { error: n };
    }
    ht.set(r, e);
  }
  const t = ht.get(r);
  if ("error" in t)
    throw t.error;
  return t.data;
}
function qe(r, t, e = ["*"], n = qt, s = Zt) {
  Array.isArray(e) || (e = [e]);
  const i = (a) => {
    try {
      const o = Wt(a);
      if (!ot(o))
        return;
      if (Object.keys(o).length === 1) {
        s(Y(o));
        return;
      }
      let l = b(t);
      Array.isArray(l) || (l = [l]);
      for (const $ of l)
        ut(Y(o), $) && n(o, b($));
    } catch (o) {
      console.debug(o);
    }
  };
  return r.addListener(i), r.subscribe(e), i;
}
const Ze = (r, t, e) => {
  Array.isArray(t) || (t = [t]);
  const n = (s) => {
    let i;
    try {
      i = Wt(s);
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
        if (typeof fe(a).fromUri(Y(i)) < "u") {
          e(i);
          break;
        }
    } catch (a) {
      console.error(a);
    }
  };
  return r.addListener(n), r.subscribe(t), n;
}, Pr = (r, { removeListenersOnUnmount: t = !0 } = {}) => {
  r = r ?? Le();
  const e = [];
  return t && ee(() => {
    for (const s of e)
      r.removeListener(s);
  }), {
    synchronize: (s, i = ["*"], a = qt, o = Zt) => {
      const l = qe(r, s, i, a, o);
      return e.push(l), l;
    },
    on(s, i) {
      const a = Ze(r, s, i);
      return e.push(a), a;
    }
  };
}, We = {
  "hydra:Collection": Ae,
  "hydra:Error": Ft,
  ConstraintViolationList: _e
};
function wt(r, t, e = /* @__PURE__ */ new WeakMap()) {
  var i;
  if (r = gt(r), t = gt(t), Object.is(r, t))
    return !0;
  if (typeof r != "object" || typeof t != "object" || r === null || t === null)
    return !1;
  if ((i = e.get(r)) != null && i.has(t))
    return !0;
  if (e.has(r) || e.set(r, /* @__PURE__ */ new Set()), e.get(r).add(t), Array.isArray(r) || Array.isArray(t))
    return Array.isArray(r) && Array.isArray(t) && r.length === t.length && r.every((a, o) => wt(a, t[o], e));
  const n = Object.prototype.toString.call(r);
  if (n !== Object.prototype.toString.call(t) || Object.getPrototypeOf(r) !== Object.getPrototypeOf(t))
    return !1;
  if (n === "[object Date]")
    return r.getTime() === t.getTime();
  if (n !== "[object Object]")
    return !1;
  const s = Object.keys(r);
  return s.length === Object.keys(t).length && s.every((a) => Object.prototype.hasOwnProperty.call(t, a) && wt(r[a], t[a], e));
}
class At {
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
const Qt = (r, t) => t in r && Object.prototype.hasOwnProperty.call(r, t), dt = (r, t) => Qt(r, t) ? r[t] : null, Ct = (r, t, e) => new Promise((n, s) => {
  const i = re(), a = J();
  let o = 0, l = !1;
  i.run(() => ne(async () => {
    const $ = ++o, T = r();
    if (!t(T))
      try {
        const O = await e(T);
        if ($ !== o)
          return;
        a.value = O, l || (l = !0, n(a));
      } catch (O) {
        $ === o && !l && (l = !0, i.stop(), s(O));
      }
  }));
}), Qe = function(r) {
  throw r;
};
class _r {
  constructor(t, e = {}) {
    d(this, "api");
    d(this, "endpoints");
    d(this, "classmap");
    this.api = t;
    const { endpoints: n, classmap: s } = e;
    this.endpoints = new xe(n ?? {}), this.classmap = { ...We, ...s }, this.errorHandler = e.errorHandler ?? Qe;
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
    const n = Y(e);
    if (!Qt(t.items, n))
      t.items[n] = J(e);
    else {
      const s = t.items[n], i = gt(s);
      for (const a of Object.keys(e))
        (!(a in i) || !wt(i[a], e[a])) && (s[a] = e[a]);
    }
    return t.items[n];
  }
  removeItem({ state: t }, e) {
    const n = Y(e);
    delete t.items[n];
  }
  async clearItems({ state: t }) {
    t.items = rt(new At());
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
    let s = new at(Y(e));
    n != null && n.groups && (s = s.withQuery(`${new ft(s.getQuery()).withParam("groups", n.groups)}`));
    let i = await this.handle(() => this.api.get(`${s}`, n), n);
    return i === void 0 ? void 0 : (i = this.factory(i), (n == null ? void 0 : n.store) ?? !0 ? this.storeItem({ state: t }, i) : i);
  }
  async getItem({ state: t }, e, n) {
    if (e === null)
      return null;
    const s = Y(e), i = dt(t.items, s);
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
    return zt(e), e = await this.handle(() => this.api.put(Y(e), e, n), n), e === void 0 ? void 0 : (n == null ? void 0 : n.store) ?? !0 ? this.storeItem({ state: t }, e) : e;
  }
  async upsertItem({ state: t }, e, n) {
    return ot(e) ? this.updateItem({ state: t }, e, n) : this.createItem({ state: t }, e, n);
  }
  async deleteItem({ state: t }, e, n) {
    const s = Y(e);
    await this.handle(() => this.api.delete(s, n), n), e = dt(t.items, s), e !== null && this.removeItem({ state: t }, e);
  }
  async getRelation({ state: t }, e, n = {}) {
    if (e === null)
      return null;
    if (typeof e == "function")
      return Ct(e, (i) => i === void 0, (i) => this.getRelation({ state: t }, i, n));
    const s = (n.useExisting ?? !0) !== !1;
    if (s && (typeof b(e) == "string" || ot(e))) {
      const i = dt(t.items, Y(e));
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
    return typeof e == "function" ? Ct(e, (s) => s == null, (s) => this.getRelations({ state: t }, s, n)) : Promise.all(e.map((s) => this.getRelation({ state: t }, s, n)));
  }
  async install(t) {
    t.state.items = rt(new At()), t.state.endpoints = mt(this.endpoints), t.state.classmap = mt(this.classmap), t.storeItem = (e) => this.storeItem(t, e), t.removeItem = (e) => this.removeItem(t, e), t.clearItems = () => this.clearItems(t), t.getItem = (e, n) => this.getItem(t, e, n), t.fetchItem = (e, n) => this.fetchItem(t, e, n), t.fetchCollection = (e, n) => this.fetchCollection(t, e, n), t.createItem = (e, n) => this.createItem(t, e, n), t.updateItem = (e, n) => this.updateItem(t, e, n), t.upsertItem = (e, n) => this.upsertItem(t, e, n), t.deleteItem = (e, n) => this.deleteItem(t, e, n), t.getRelation = (e, n) => this.getRelation(t, e, n), t.getRelations = (e, n) => this.getRelations(t, e, n), t.endpoint = (e) => t.state.endpoints[e], t.getItemsByType = (e) => t.state.items.filter((n) => e === n["@type"]), t.factory = (e, n) => (n = n ?? e, typeof e == "string" && (n["@type"] = e), this.factory(n));
  }
}
function Jt(r) {
  if (typeof r == "string")
    return r;
  try {
    return Y(r);
  } catch {
    return null;
  }
}
function Je(r) {
  return r.map((t) => Jt(t));
}
async function Bt(r, t) {
  try {
    return await t.getItem(r);
  } catch {
    return null;
  }
}
async function Be(r, t) {
  return Promise.all(r.map((e) => Bt(e, t)));
}
class Ar extends W {
  constructor(e, { store: n, multiple: s = !1 }) {
    super();
    d(this, "items", []);
    d(this, "multiple");
    d(this, "store");
    this.items = Array.isArray(e) ? e : [e], this.store = n, this.multiple = s;
  }
  get item() {
    return this.items[0] ?? null;
  }
  set item(e) {
    this.items = [e], this.multiple = !1;
  }
  normalize() {
    return this.multiple || this.items.length > 1 ? Je(this.items) : Jt(this.item);
  }
  async denormalize(e) {
    if (Array.isArray(e)) {
      this.items = await Be(e, this.store);
      return;
    }
    this.items = [await Bt(e, this.store)];
  }
}
const Ge = {
  asc: "desc",
  desc: "asc"
};
class Cr extends W {
  constructor(e = {}) {
    super();
    d(this, "order");
    this.order = e;
  }
  revert() {
    const e = {};
    for (const n in this.order) {
      const s = this.order[n];
      e[n] = Ge[s] ?? s;
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
class Yr extends W {
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
class Rr extends W {
  constructor(e = null) {
    super();
    d(this, "_value");
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
class Ur extends W {
  constructor(e = null) {
    super();
    d(this, "value");
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
function kr({ itemsPerPage: r, currentPage: t, totalItems: e }) {
  return e == null ? new tr({ itemsPerPage: r, currentPage: t }) : new Ke({ itemsPerPage: r, currentPage: t, totalItems: e });
}
function Xe(r) {
  return Array.from({ length: r }, (t, e) => e + 1);
}
class Dt {
  constructor({ itemsPerPage: t, currentPage: e }) {
    d(this, "itemsPerPage");
    d(this, "totalItems");
    d(this, "currentPage");
    d(this, "previousPage");
    d(this, "nextPage");
    d(this, "lastPage");
    d(this, "offset");
    d(this, "_pages");
    this.itemsPerPage = parseInt(t), this.currentPage = parseInt(e), this.offset = Math.max(0, e * t - t), this.previousPage = Math.max(1, this.currentPage - 1);
  }
  get pages() {
    return this._pages === void 0 && (this._pages = Xe(this.lastPage)), this._pages;
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
    return new er(this, t, e);
  }
}
class Ke extends Dt {
  constructor({ itemsPerPage: t, currentPage: e, totalItems: n }) {
    super({ itemsPerPage: t, currentPage: e }), this.totalItems = parseInt(n), this.lastPage = Math.max(1, Math.ceil(this.totalItems / Math.max(1, this.itemsPerPage))), this.nextPage = Math.min(this.lastPage, this.currentPage + 1);
  }
}
class tr extends Dt {
  constructor({ itemsPerPage: t, currentPage: e, totalItems: n }) {
    super({ itemsPerPage: t, currentPage: e, totalItems: n }), this.nextPage = this.lastPage = this.currentPage + 1;
  }
}
class er extends Dt {
  constructor(t, e, n = !1) {
    super(t), Object.assign(this, t);
    const s = [];
    n && s.push(1);
    for (let i = 1; i <= this.lastPage; i++)
      i === this.currentPage && s.push(i), i < this.currentPage && i >= this.currentPage - e && s.push(i), i > this.currentPage && i <= this.currentPage + e && s.push(i);
    n && s.push(this.lastPage), this._pages = [...new Set(s)];
  }
}
class rr {
  constructor() {
    d(this, "fields");
    d(this, "preload");
  }
  get headers() {
    var e, n;
    const t = {};
    return (((e = this.preload) == null ? void 0 : e.length) ?? 0) !== 0 && (t.preload = [...new Set(this.preload)].map((s) => `"${s}"`).join(", ")), (((n = this.fields) == null ? void 0 : n.length) ?? 0) !== 0 && (t.fields = [.../* @__PURE__ */ new Set([...this.fields, ...this.preload ?? []])].map((s) => `"${s}"`).join(", ")), t;
  }
}
function Nr({ fields: r, preload: t } = {}) {
  return Object.assign(new rr(), { fields: r }, { preload: t }).headers;
}
export {
  he as AbortError,
  mr as ApiClient,
  gr as ArrayFilter,
  _e as ConstraintViolationList,
  Oe as DateRangeFilter,
  ze as DatetimeRangeFilter,
  ke as FakeEventSource,
  pr as FilterCollection,
  le as HttpError,
  Ae as HydraCollection,
  Ot as HydraEndpoint,
  xe as HydraEndpoints,
  Ft as HydraError,
  _r as HydraPlugin,
  Ar as ItemFilter,
  Fe as Mercure,
  Cr as OrderFilter,
  Yr as RangeFilter,
  Rr as TextFilter,
  Ur as TruthyFilter,
  Pe as Violation,
  ut as areSameIris,
  zt as checkValidItem,
  X as clone,
  Ie as containsIri,
  Ir as createMercure,
  kr as createPager,
  vr as createStore,
  Ee as getId,
  Sr as getIds,
  Y as getIri,
  $r as getIris,
  Or as getItemByIri,
  zr as getItemIndexByIri,
  Dr as getItemsByType,
  ot as hasIri,
  qe as mercureSync,
  jr as normalizeIris,
  Ye as normalizeItemRelations,
  Ze as on,
  Mr as partialItem,
  wr as useEndpoint,
  br as useFilters,
  Er as useFormValidation,
  xr as useItemForm,
  Le as useMercure,
  Pr as useMercureSync,
  Vt as useStore,
  Nr as vulcain,
  yr as withoutDuplicates,
  Tr as withoutIri
};
