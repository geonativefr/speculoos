var te = Object.defineProperty;
var ee = (r, t, e) => t in r ? te(r, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : r[t] = e;
var d = (r, t, e) => (ee(r, typeof t != "symbol" ? t + "" : t, e), e);
import { whenever as re } from "@vueuse/core";
import { unref as b, isRef as at, ref as B, reactive as nt, readonly as yt, inject as Nt, computed as gt, watch as ne, onScopeDispose as se, toRaw as pt, effectScope as ie, watchEffect as ae } from "vue";
import Mt from "clone-deep";
import oe from "md5";
import V from "is-empty";
import { useRoute as ue, useRouter as ce, onBeforeRouteUpdate as fe } from "vue-router";
import { URI as ot, QueryString as lt } from "psr7-js";
import { v4 as le } from "uuid";
import he from "mitt";
import de from "uri-templates";
class me extends Error {
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
class ye extends Error {
  constructor(t) {
    super(), this.name = "AbortError", this.reason = t;
  }
}
const Tt = (r) => {
  if (!(r instanceof Headers))
    return r;
  const t = {};
  for (let e of r.keys())
    t[e] = r.get(e);
  return t;
}, Et = (...r) => {
  const t = {};
  for (const e of r) {
    const n = Tt(e) ?? {};
    for (const s of Object.keys(n)) {
      for (const i of Object.keys(t))
        i.toLowerCase() === s.toLowerCase() && delete t[i];
      t[s] = n[s];
    }
  }
  return t;
}, ge = {
  Accept: "application/ld+json, application/json"
}, pe = async (r) => {
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
}, ht = /* @__PURE__ */ new WeakMap(), bt = (r) => (ht.has(r) || ht.set(r, pe(r)), ht.get(r));
class yr {
  constructor({ baseUri: t = "", options: e = {}, fetcher: n } = {}) {
    d(this, "baseUri");
    d(this, "options");
    d(this, "fetch");
    var s;
    this.baseUri = t, this.options = e, n = n ?? ((s = window.fetch) == null ? void 0 : s.bind(window)), this.fetch = async (i, a) => n(i, a).then(bt);
  }
  resolve(t) {
    return new URL(t, this.baseUri).toString();
  }
  mergeOptions(t) {
    let e = { ...this.options };
    Object.keys(e).includes("headers") && (e.headers = Tt(e.headers));
    for (let n of arguments) {
      let s = { ...n };
      Object.keys(s).includes("headers") && (s.headers = Et(e.headers, s.headers)), e = { ...Mt(e), ...Mt(s) };
    }
    return e;
  }
  async request(t, e, n) {
    e = `${b(e)}`, n = this.mergeOptions({ method: t }, n), Object.keys(n).includes("headers") && (n.headers = new Headers(Et(ge, n.headers)));
    let s = () => {
    };
    try {
      if (at(n == null ? void 0 : n.isLoading) && (n.isLoading.value = !0), at(n == null ? void 0 : n.aborted)) {
        const i = new AbortController(), { signal: a } = i;
        n.signal = a, s = re(n.aborted, () => i.abort(), { immediate: !0 });
      }
      try {
        const i = await this.fetch(e, n);
        return me.guard(i);
      } catch (i) {
        throw i.name === "AbortError" ? new ye(i.reason) : i;
      }
    } finally {
      s(), at(n == null ? void 0 : n.isLoading) && (n.isLoading.value = !1);
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
const be = (r) => (r == null ? void 0 : r.signal) == null && ((r == null ? void 0 : r.body) == null || typeof r.body == "string"), ve = (r, t) => {
  const e = Tt(t == null ? void 0 : t.headers) ?? {}, n = Object.keys(e).map((s) => [s.toLowerCase(), `${e[s]}`]).sort(([s], [i]) => s < i ? -1 : s > i ? 1 : 0);
  return oe(JSON.stringify({
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
class we {
  constructor(t = ((e) => (e = window.fetch) == null ? void 0 : e.bind(window))()) {
    d(this, "fetch");
    d(this, "pendingRequests", []);
    return this.fetch = t, (n, s) => {
      if (!be(s))
        return this.fetch(n, s).then(bt);
      const i = ve(n, s), a = this.pendingRequests.findIndex((l) => i === l.hash);
      if (a >= 0)
        return this.pendingRequests[a].promise;
      const f = this.fetch(n, s).then(bt);
      return this.pendingRequests.push({ hash: i, promise: f }), f.then(
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
function gr(r = void 0) {
  return new we(r);
}
const $e = {
  Date: Date.prototype.getTime,
  RegExp: Object.getOwnPropertyDescriptor(RegExp.prototype, "source").get,
  Map: Map.prototype.has,
  Set: Set.prototype.has
};
function et(r, t) {
  if (!(r instanceof t))
    return !1;
  try {
    return $e[t.name].call(r), !0;
  } catch {
    return !1;
  }
}
function Se(r) {
  if (et(r, Date))
    return new Date(r.getTime());
  if (et(r, RegExp)) {
    const t = new RegExp(r.source, r.flags);
    return t.lastIndex = r.lastIndex, t;
  }
  return et(r, Map) ? /* @__PURE__ */ new Map() : et(r, Set) ? /* @__PURE__ */ new Set() : null;
}
function Te(r) {
  const t = Se(r);
  return t == null ? Object.create(Object.getPrototypeOf(r)) : Object.setPrototypeOf(t, Object.getPrototypeOf(r));
}
const Q = (r, t = !0, e = []) => {
  if (typeof r != "object" || r == null)
    return r;
  const n = e.find((a) => a.orig === r);
  if (n != null)
    return n.cloned;
  let s = Object.assign(Te(r), r);
  Array.isArray(r) && (s = Object.values(s)), e.push({ orig: r, cloned: s });
  const i = (a) => t ? Q(a, t, e) : a;
  if (et(r, Map) && r.forEach((a, f) => s.set(i(f), i(a))), et(r, Set) && r.forEach((a) => s.add(i(a))), t)
    for (const a in s)
      typeof s[a] == "object" && s[a] != null && (s[a] = Q(s[a], t, e));
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
class pr extends W {
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
var Ot = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function zt(r) {
  return r && r.__esModule && Object.prototype.hasOwnProperty.call(r, "default") ? r.default : r;
}
var Ht = { exports: {} };
(function(r, t) {
  (function(e, n) {
    r.exports = n();
  })(Ot, function() {
    var e = 1e3, n = 6e4, s = 36e5, i = "millisecond", a = "second", f = "minute", l = "hour", $ = "day", T = "week", O = "month", z = "quarter", j = "year", w = "date", h = "Invalid Date", S = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/, C = /\[([^\]]+)]|YYYY|YY|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g, I = { name: "en", weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"), months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"), ordinal: function(y) {
      var c = ["th", "st", "nd", "rd"], o = y % 100;
      return "[" + y + (c[(o - 20) % 10] || c[o] || c[0]) + "]";
    } }, x = function(y, c, o) {
      var m = String(y);
      return !m || m.length >= c ? y : "" + Array(c + 1 - m.length).join(o) + y;
    }, N = { s: x, z: function(y) {
      var c = -y.utcOffset(), o = Math.abs(c), m = Math.floor(o / 60), u = o % 60;
      return (c <= 0 ? "+" : "-") + x(m, 2, "0") + ":" + x(u, 2, "0");
    }, m: function y(c, o) {
      if (c.date() < o.date())
        return -y(o, c);
      var m = 12 * (o.year() - c.year()) + (o.month() - c.month()), u = c.clone().add(m, O), g = o - u < 0, p = c.clone().add(m + (g ? -1 : 1), O);
      return +(-(m + (o - u) / (g ? u - p : p - u)) || 0);
    }, a: function(y) {
      return y < 0 ? Math.ceil(y) || 0 : Math.floor(y);
    }, p: function(y) {
      return { M: O, y: j, w: T, d: $, D: w, h: l, m: f, s: a, ms: i, Q: z }[y] || String(y || "").toLowerCase().replace(/s$/, "");
    }, u: function(y) {
      return y === void 0;
    } }, P = "en", U = {};
    U[P] = I;
    var F = "$isDayjsObject", q = function(y) {
      return y instanceof Z || !(!y || !y[F]);
    }, H = function y(c, o, m) {
      var u;
      if (!c)
        return P;
      if (typeof c == "string") {
        var g = c.toLowerCase();
        U[g] && (u = g), o && (U[g] = o, u = g);
        var p = c.split("-");
        if (!u && p.length > 1)
          return y(p[0]);
      } else {
        var D = c.name;
        U[D] = c, u = D;
      }
      return !m && u && (P = u), u || !m && P;
    }, M = function(y, c) {
      if (q(y))
        return y.clone();
      var o = typeof c == "object" ? c : {};
      return o.date = y, o.args = arguments, new Z(o);
    }, v = N;
    v.l = H, v.i = q, v.w = function(y, c) {
      return M(y, { locale: c.$L, utc: c.$u, x: c.$x, $offset: c.$offset });
    };
    var Z = function() {
      function y(o) {
        this.$L = H(o.locale, null, !0), this.parse(o), this.$x = this.$x || o.x || {}, this[F] = !0;
      }
      var c = y.prototype;
      return c.parse = function(o) {
        this.$d = function(m) {
          var u = m.date, g = m.utc;
          if (u === null)
            return /* @__PURE__ */ new Date(NaN);
          if (v.u(u))
            return /* @__PURE__ */ new Date();
          if (u instanceof Date)
            return new Date(u);
          if (typeof u == "string" && !/Z$/i.test(u)) {
            var p = u.match(S);
            if (p) {
              var D = p[2] - 1 || 0, E = (p[7] || "0").substring(0, 3);
              return g ? new Date(Date.UTC(p[1], D, p[3] || 1, p[4] || 0, p[5] || 0, p[6] || 0, E)) : new Date(p[1], D, p[3] || 1, p[4] || 0, p[5] || 0, p[6] || 0, E);
            }
          }
          return new Date(u);
        }(o), this.init();
      }, c.init = function() {
        var o = this.$d;
        this.$y = o.getFullYear(), this.$M = o.getMonth(), this.$D = o.getDate(), this.$W = o.getDay(), this.$H = o.getHours(), this.$m = o.getMinutes(), this.$s = o.getSeconds(), this.$ms = o.getMilliseconds();
      }, c.$utils = function() {
        return v;
      }, c.isValid = function() {
        return this.$d.toString() !== h;
      }, c.isSame = function(o, m) {
        var u = M(o);
        return this.startOf(m) <= u && u <= this.endOf(m);
      }, c.isAfter = function(o, m) {
        return M(o) < this.startOf(m);
      }, c.isBefore = function(o, m) {
        return this.endOf(m) < M(o);
      }, c.$g = function(o, m, u) {
        return v.u(o) ? this[m] : this.set(u, o);
      }, c.unix = function() {
        return Math.floor(this.valueOf() / 1e3);
      }, c.valueOf = function() {
        return this.$d.getTime();
      }, c.startOf = function(o, m) {
        var u = this, g = !!v.u(m) || m, p = v.p(o), D = function(K, k) {
          var J = v.w(u.$u ? Date.UTC(u.$y, k, K) : new Date(u.$y, k, K), u);
          return g ? J : J.endOf($);
        }, E = function(K, k) {
          return v.w(u.toDate()[K].apply(u.toDate("s"), (g ? [0, 0, 0, 0] : [23, 59, 59, 999]).slice(k)), u);
        }, _ = this.$W, R = this.$M, L = this.$D, tt = "set" + (this.$u ? "UTC" : "");
        switch (p) {
          case j:
            return g ? D(1, 0) : D(31, 11);
          case O:
            return g ? D(1, R) : D(0, R + 1);
          case T:
            var G = this.$locale().weekStart || 0, st = (_ < G ? _ + 7 : _) - G;
            return D(g ? L - st : L + (6 - st), R);
          case $:
          case w:
            return E(tt + "Hours", 0);
          case l:
            return E(tt + "Minutes", 1);
          case f:
            return E(tt + "Seconds", 2);
          case a:
            return E(tt + "Milliseconds", 3);
          default:
            return this.clone();
        }
      }, c.endOf = function(o) {
        return this.startOf(o, !1);
      }, c.$set = function(o, m) {
        var u, g = v.p(o), p = "set" + (this.$u ? "UTC" : ""), D = (u = {}, u[$] = p + "Date", u[w] = p + "Date", u[O] = p + "Month", u[j] = p + "FullYear", u[l] = p + "Hours", u[f] = p + "Minutes", u[a] = p + "Seconds", u[i] = p + "Milliseconds", u)[g], E = g === $ ? this.$D + (m - this.$W) : m;
        if (g === O || g === j) {
          var _ = this.clone().set(w, 1);
          _.$d[D](E), _.init(), this.$d = _.set(w, Math.min(this.$D, _.daysInMonth())).$d;
        } else
          D && this.$d[D](E);
        return this.init(), this;
      }, c.set = function(o, m) {
        return this.clone().$set(o, m);
      }, c.get = function(o) {
        return this[v.p(o)]();
      }, c.add = function(o, m) {
        var u, g = this;
        o = Number(o);
        var p = v.p(m), D = function(R) {
          var L = M(g);
          return v.w(L.date(L.date() + Math.round(R * o)), g);
        };
        if (p === O)
          return this.set(O, this.$M + o);
        if (p === j)
          return this.set(j, this.$y + o);
        if (p === $)
          return D(1);
        if (p === T)
          return D(7);
        var E = (u = {}, u[f] = n, u[l] = s, u[a] = e, u)[p] || 1, _ = this.$d.getTime() + o * E;
        return v.w(_, this);
      }, c.subtract = function(o, m) {
        return this.add(-1 * o, m);
      }, c.format = function(o) {
        var m = this, u = this.$locale();
        if (!this.isValid())
          return u.invalidDate || h;
        var g = o || "YYYY-MM-DDTHH:mm:ssZ", p = v.z(this), D = this.$H, E = this.$m, _ = this.$M, R = u.weekdays, L = u.months, tt = u.meridiem, G = function(k, J, it, ft) {
          return k && (k[J] || k(m, g)) || it[J].slice(0, ft);
        }, st = function(k) {
          return v.s(D % 12 || 12, k, "0");
        }, K = tt || function(k, J, it) {
          var ft = k < 12 ? "AM" : "PM";
          return it ? ft.toLowerCase() : ft;
        };
        return g.replace(C, function(k, J) {
          return J || function(it) {
            switch (it) {
              case "YY":
                return String(m.$y).slice(-2);
              case "YYYY":
                return v.s(m.$y, 4, "0");
              case "M":
                return _ + 1;
              case "MM":
                return v.s(_ + 1, 2, "0");
              case "MMM":
                return G(u.monthsShort, _, L, 3);
              case "MMMM":
                return G(L, _);
              case "D":
                return m.$D;
              case "DD":
                return v.s(m.$D, 2, "0");
              case "d":
                return String(m.$W);
              case "dd":
                return G(u.weekdaysMin, m.$W, R, 2);
              case "ddd":
                return G(u.weekdaysShort, m.$W, R, 3);
              case "dddd":
                return R[m.$W];
              case "H":
                return String(D);
              case "HH":
                return v.s(D, 2, "0");
              case "h":
                return st(1);
              case "hh":
                return st(2);
              case "a":
                return K(D, E, !0);
              case "A":
                return K(D, E, !1);
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
      }, c.utcOffset = function() {
        return 15 * -Math.round(this.$d.getTimezoneOffset() / 15);
      }, c.diff = function(o, m, u) {
        var g, p = this, D = v.p(m), E = M(o), _ = (E.utcOffset() - this.utcOffset()) * n, R = this - E, L = function() {
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
          case f:
            g = R / n;
            break;
          case a:
            g = R / e;
            break;
          default:
            g = R;
        }
        return u ? g : v.a(g);
      }, c.daysInMonth = function() {
        return this.endOf(O).$D;
      }, c.$locale = function() {
        return U[this.$L];
      }, c.locale = function(o, m) {
        if (!o)
          return this.$L;
        var u = this.clone(), g = H(o, m, !0);
        return g && (u.$L = g), u;
      }, c.clone = function() {
        return v.w(this.$d, this);
      }, c.toDate = function() {
        return new Date(this.valueOf());
      }, c.toJSON = function() {
        return this.isValid() ? this.toISOString() : null;
      }, c.toISOString = function() {
        return this.$d.toISOString();
      }, c.toString = function() {
        return this.$d.toUTCString();
      }, y;
    }(), X = Z.prototype;
    return M.prototype = X, [["$ms", i], ["$s", a], ["$m", f], ["$H", l], ["$W", $], ["$M", O], ["$y", j], ["$D", w]].forEach(function(y) {
      X[y[1]] = function(c) {
        return this.$g(c, y[0], y[1]);
      };
    }), M.extend = function(y, c) {
      return y.$i || (y(c, Z, M), y.$i = !0), M;
    }, M.locale = H, M.isDayjs = q, M.unix = function(y) {
      return M(1e3 * y);
    }, M.en = U[P], M.Ls = U, M.p = {}, M;
  });
})(Ht);
var Oe = Ht.exports;
const A = /* @__PURE__ */ zt(Oe);
var Lt = { exports: {} };
(function(r, t) {
  (function(e, n) {
    r.exports = n();
  })(Ot, function() {
    var e = "minute", n = /[+-]\d\d(?::?\d\d)?/g, s = /([+-]|\d\d)/g;
    return function(i, a, f) {
      var l = a.prototype;
      f.utc = function(h) {
        var S = { date: h, utc: !0, args: arguments };
        return new a(S);
      }, l.utc = function(h) {
        var S = f(this.toDate(), { locale: this.$L, utc: !0 });
        return h ? S.add(this.utcOffset(), e) : S;
      }, l.local = function() {
        return f(this.toDate(), { locale: this.$L, utc: !1 });
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
        var x = this.clone();
        if (S)
          return x.$offset = I, x.$u = !1, x;
        var N = this.$u ? this.toDate().getTimezoneOffset() : -1 * this.utcOffset();
        return (x = this.local().add(I + N, e)).$offset = I, x.$x.$localOffset = N, x;
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
        return h === "s" && this.$offset ? f(this.format("YYYY-MM-DD HH:mm:ss:SSS")).toDate() : j.call(this);
      };
      var w = l.diff;
      l.diff = function(h, S, C) {
        if (h && this.$u === h.$u)
          return w.call(this, h, S, C);
        var I = this.local(), x = f(h).local();
        return w.call(I, x, S, C);
      };
    };
  });
})(Lt);
var ze = Lt.exports;
const Vt = /* @__PURE__ */ zt(ze);
var Ft = { exports: {} };
(function(r, t) {
  (function(e, n) {
    r.exports = n();
  })(Ot, function() {
    var e = { year: 0, month: 1, day: 2, hour: 3, minute: 4, second: 5 }, n = {};
    return function(s, i, a) {
      var f, l = function(z, j, w) {
        w === void 0 && (w = {});
        var h = new Date(z), S = function(C, I) {
          I === void 0 && (I = {});
          var x = I.timeZoneName || "short", N = C + "|" + x, P = n[N];
          return P || (P = new Intl.DateTimeFormat("en-US", { hour12: !1, timeZone: C, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: x }), n[N] = P), P;
        }(j, w);
        return S.formatToParts(h);
      }, $ = function(z, j) {
        for (var w = l(z, j), h = [], S = 0; S < w.length; S += 1) {
          var C = w[S], I = C.type, x = C.value, N = e[I];
          N >= 0 && (h[N] = parseInt(x, 10));
        }
        var P = h[3], U = P === 24 ? 0 : P, F = h[0] + "-" + h[1] + "-" + h[2] + " " + U + ":" + h[4] + ":" + h[5] + ":000", q = +z;
        return (a.utc(F).valueOf() - (q -= q % 1e3)) / 6e4;
      }, T = i.prototype;
      T.tz = function(z, j) {
        if (z === void 0 && (z = f), !this.isValid())
          return this;
        var w, h = this.utcOffset(), S = this.toDate(), C = S.toLocaleString("en-US", { timeZone: z }), I = $(+S, z);
        if (!Number(I))
          w = this.utcOffset(0, j);
        else if (w = a(C, { locale: this.$L }).$set("millisecond", this.$ms).utcOffset(I, !0), j) {
          var x = w.utcOffset();
          w = w.add(h - x, "minute");
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
        var h = w && j, S = w || j || f, C = $(+a(), S);
        if (typeof z != "string")
          return a(z).tz(S);
        var I = a.utc(z, h).valueOf();
        if (Number.isNaN(I)) {
          var x = a(NaN);
          return x.$x.$timezone = S, x;
        }
        var N = function(q, H, M) {
          var v = q - 60 * H * 1e3, Z = $(v, M);
          if (H === Z)
            return [v, H];
          var X = $(v -= 60 * (Z - H) * 1e3, M);
          return Z === X ? [v, Z] : [q - 60 * Math.min(Z, X) * 1e3, Math.max(Z, X)];
        }(I, C, S), P = N[0], U = N[1], F = a(P).utcOffset(U);
        return F.$x.$timezone = S, F;
      }, a.tz.guess = function() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      }, a.tz.setDefault = function(z) {
        f = z;
      };
    };
  });
})(Ft);
var De = Ft.exports;
const qt = /* @__PURE__ */ zt(De);
A.extend(Vt);
A.extend(qt);
class je extends W {
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
d(je, "userTimezone");
A.extend(Vt);
A.extend(qt);
class xe extends W {
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
d(xe, "userTimezone");
function Me(r) {
  return r == null ? !0 : typeof r == "string" ? r.trim().length === 0 : typeof r == "function" || Array.isArray(r) ? r.length === 0 : r instanceof Object ? Object.keys(r).length === 0 : !1;
}
function vt(r) {
  if (!(r instanceof Object))
    return r;
  if (Array.isArray(r))
    return r.map(vt);
  const t = { ...r };
  return Object.keys(t).forEach((e) => {
    t[e] instanceof Object && (t[e] = vt(t[e])), Me(t[e]) && delete t[e];
  }), t;
}
function Ee(r) {
  if (typeof r != "object" || r == null)
    return !1;
  const t = Object.getPrototypeOf(r);
  return t == null || Object.prototype === t;
}
function Ie(r) {
  return Ee(r) && Object.values(r).every((t) => typeof t != "function");
}
function It(r) {
  const t = {};
  return Object.keys(r).forEach((e) => {
    const n = r[e];
    Array.isArray(n) ? t[e] = [...n] : Ie(n) ? t[e] = { ...n } : t[e] = n;
  }), t;
}
function Zt(r, t) {
  Object.defineProperty(r, "_initialStates", {
    value: t,
    writable: !0,
    configurable: !0,
    enumerable: !1
  });
}
class br {
  constructor(t = {}) {
    d(this, "_filters", []);
    if (!(t instanceof Object))
      throw Error("A FilterCollection expects an object.");
    Zt(this, {}), Object.keys(t).forEach((e) => {
      if (!(t[e] instanceof W))
        throw Error(`Filter ${e} doesn't extend the Filter class.`);
      this[e] = t[e], this._filters.push(e), this._initialStates[e] = It(t[e]);
    });
  }
  normalize() {
    const t = {};
    return this._filters.forEach((e) => {
      const n = this[e];
      t[e] = n.normalize();
    }), vt(t);
  }
  async denormalize(t) {
    var n;
    const e = [];
    for (const s of this._filters) {
      const i = this[s];
      i instanceof W && (typeof t[s] < "u" ? e.push(i.denormalize(t[s])) : ((n = this._initialStates) == null ? void 0 : n[s]) != null && Object.assign(i, It(this._initialStates[s])));
    }
    return e.length > 0 && await Promise.all(e), this;
  }
}
async function vr(r = {}, t = {
  preserveQuery: !1,
  targetRoute: void 0
}) {
  if (typeof r != "function")
    throw Error("initialState should be provided as a function.");
  const e = ue(), n = ce(), s = B(r());
  async function i($) {
    Zt(b(s), r()._initialStates), Object.assign(b(s), await b(s).denormalize($.query));
  }
  function a() {
    s.value = Q(r());
  }
  function f($ = {}) {
    const T = {};
    return t.preserveQuery === !0 && Object.assign(T, e.query), Object.assign(T, b(s).normalize(), $);
  }
  async function l($ = {}) {
    const T = b(t.targetRoute) ?? e;
    await n.push(Object.assign({ ...T }, { query: f($) }));
  }
  return fe(($) => i($)), await i(e), {
    filters: s,
    buildQueryParams: f,
    submit: l,
    clear: a
  };
}
const wr = async ({ state: r = {}, methods: t = {}, name: e = "store" } = {}) => {
  r = nt(r);
  const n = [], s = {
    name: e,
    state: r,
    ...Object.keys(t).reduce(function(i, a) {
      const f = t[a];
      return i[a] = function() {
        return f(r, ...arguments);
      }, i;
    }, {}),
    async use(i) {
      return n.push(i), await i.install(this), this;
    },
    async reconciliate(i = !1) {
      const a = n.filter(({ reconciliate: f }) => typeof f == "function");
      if (i === !1)
        return Promise.all(a.map((f) => f.reconciliate(this)));
      for (const f of a)
        await f.reconciliate(this);
    }
  };
  return s.install = (i) => i.provide(e, { ...s, state: yt(r) }), s;
}, Wt = (r = "store") => Nt(r);
class Pe {
  constructor(t) {
    Object.keys(t).forEach((e) => {
      this[e] = new Dt(t[e]);
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
class Dt {
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
    let e = new ot(this.endpoint);
    return e = e.withPath(`${e.getPath()}/${t}`), e.toString();
  }
  withQuery(t) {
    const e = new ot(this.endpoint), n = new lt(e).withParams(t);
    return new Dt(e.withQuery(n.toString()).toString());
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
    return this.withQuery(new lt(new ot(t)).getParams());
  }
}
const $r = (r, t) => Wt(t).state.endpoints[r];
function ut(r) {
  return r = b(r), r == null ? !1 : Object.keys(r).includes("@id") && r["@id"] != null;
}
function Y(r) {
  return r = b(r), r === null ? null : typeof r == "string" ? r : (jt(r), r["@id"]);
}
function _e(r) {
  const t = Y(r);
  return t.substring(t.lastIndexOf("/") + 1);
}
function Sr(r) {
  return r.map(Y);
}
function Tr(r) {
  return r.map(_e);
}
function jt(r, t = null) {
  if (typeof r != "object" || !("@id" in r))
    throw Error("Invalid item.");
  if (t !== null) {
    if (typeof t == "string" && t !== r["@type"])
      throw Error(`Expected item of type "${t}", got "${r["@type"]}".`);
    if (Array.isArray(t) && t.includes(r["@type"]) === !1)
      throw Error(`Expected item of any "${t.join("|")}", got "${r["@type"]}".`);
  }
}
function ct(r, t) {
  return Y(r) === Y(t);
}
function Ae(r, t) {
  if (r = b(r), r = Array.from(r).map(b), t = b(t), Array.isArray(t)) {
    const e = t;
    for (const n of e)
      if (Ae(r, n))
        return !0;
    return !1;
  }
  for (const e of r)
    if (ct(e, t))
      return !0;
  return !1;
}
function Or(r, t) {
  const e = r.findIndex((n) => ct(n, t));
  return e >= 0 && r.splice(e, 1), r;
}
function zr(r, t) {
  const e = r.find((n) => ct(n, t));
  return typeof e > "u" ? null : e;
}
function Dr(r, t) {
  return r.findIndex((e) => ct(e, t));
}
function jr(r, t) {
  return r.filter((e) => e["@type"] === t);
}
function xr(r) {
  Object.assign(r, r.map((t) => Y(t)));
}
function Mr(r, t) {
  return r = b(r), jt(r), Object.assign({ "@id": r["@id"], "@type": r["@type"] }, t);
}
const rt = (r, t, e) => {
  const n = `hydra:${t}`;
  Object.prototype.hasOwnProperty.call(r, n) || (r[n] = e);
};
class wt extends Error {
  constructor() {
    super(...arguments);
    d(this, "statusCode");
  }
  get title() {
    return this["hydra:title"];
  }
  set title(e) {
    rt(this, "title", e);
  }
  get description() {
    return this["hydra:description"];
  }
  set description(e) {
    rt(this, "description", e);
  }
}
class Ce {
  constructor() {
    d(this, "id");
    d(this, "propertyPath");
    d(this, "message");
    d(this, "code");
    this.id = le();
  }
}
class Pt extends wt {
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
    this._violations = e.map((n) => Object.assign(new Ce(), n));
  }
  getPropertyPaths() {
    return [...new Set(this.violations.map(({ propertyPath: e }) => e))];
  }
  getViolations(e) {
    const n = Array.from(arguments);
    return n.length === 0 ? this.violations : V(n[0]) ? this.violations.filter((s) => V(s.propertyPath)) : this.violations.filter((s) => e === s.propertyPath);
  }
}
class _t {
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
  set totalItems(t) {
    rt(this, "totalItems", t);
  }
  get member() {
    return this["hydra:member"];
  }
  set member(t) {
    rt(this, "member", t);
  }
  get view() {
    return this["hydra:view"];
  }
  set view(t) {
    rt(this, "view", t);
  }
  get search() {
    return this["hydra:search"];
  }
  set search(t) {
    rt(this, "search", t);
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
function Ye(r) {
  if (typeof r != "object" || r == null)
    throw Error("Invalid object.");
  return Object.keys(r).forEach((t) => delete r[t]), r;
}
function At(r) {
  return ut(r) ? Y(r) : r;
}
function Re(r) {
  const t = Q(r), e = Object.keys(t);
  for (const n of e) {
    const s = t[n];
    Array.isArray(s) ? t[n] = s.map((i) => At(i)) : typeof s == "object" && s != null && (t[n] = At(s));
  }
  return t;
}
function Ct(r, t) {
  return r = Ye(r), Object.assign(r, t);
}
function Er(r) {
  const t = Wt(), e = B(b(r)), n = nt(Q(b(r))), s = gt(() => !ut(b(n))), i = B(!1);
  let a;
  at(r) && ne(r, () => a = void 0, { deep: !0, flush: "sync" });
  const f = gt(() => JSON.stringify(b(n)) !== JSON.stringify(b(e)));
  return { item: n, isUnsavedDraft: f, isCreationMode: s, isSubmitting: i, reset: (T) => Ct(n, Q(b(T ?? a ?? r))), submit: async (T) => {
    at(T) && (T = b(T));
    try {
      i.value = !0;
      const O = await t.upsertItem(Re(T ?? n));
      return O === void 0 ? void 0 : (e.value = O, a = O, Ct(n, Q(O)), O);
    } finally {
      i.value = !1;
    }
  } };
}
function Ir() {
  const r = B([]), t = (i) => {
    i = b(i), i.querySelectorAll("[name]").forEach(function(a) {
      a.setCustomValidity("");
    }), r.value = [];
  }, e = (i, a = !0) => {
    i = b(i);
    const f = i.checkValidity();
    return !f && a && i.reportValidity(), f;
  }, n = (i, a) => {
    t(i), Array.from(a).forEach((f) => s(i, f)), e(i);
  }, s = (i, { propertyPath: a, message: f }) => {
    i = b(i);
    const l = i.querySelector(`[name='${a}']`);
    l == null || l.setCustomValidity(f), l || r.value.push({ propertyPath: a, message: f });
  };
  return { resetValidity: t, bindViolations: n, unmappedViolations: r, validate: e };
}
let $t;
const Ue = 1, ke = 2;
class Ne {
  constructor(t, e) {
    d(this, "readyState", Ue);
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
    this.readyState = ke;
  }
  triggerEvent(t) {
    this.onmessage(t);
  }
  triggerError(t) {
    this.onerror(t);
  }
}
const He = () => {
  var r, t, e;
  return typeof process < "u" && ((r = process == null ? void 0 : process.env) == null ? void 0 : r.NODE_ENV) === "test" || ((e = (t = import.meta) == null ? void 0 : t.env) == null ? void 0 : e.NODE_ENV) === "test";
};
He() ? $t = Ne : $t = window.EventSource;
const Le = $t, Pr = (r, t) => {
  const e = new qe(r, t);
  return Object.assign(e, {
    install(n) {
      n.provide("mercure", e);
    }
  });
}, Ve = () => Nt("mercure"), Fe = 3e4;
function Yt(r, t) {
  return r.length === t.length && r.every((e) => t.includes(e));
}
function Rt(r) {
  return r.includes("*") ? ["*"] : r;
}
class qe {
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
    Object.assign(this, { hub: t, options: nt(e) }), this.lastEventId = B(), this.subscribedTopics = B([]), this.endpoint = gt(() => {
      const n = new URL(this.hub), s = b(this.subscribedTopics);
      return s.includes("*") ? n.searchParams.append("topic", "*") : s.forEach((i) => n.searchParams.append("topic", i)), b(this.lastEventId) && n.searchParams.append("Last-Event-ID", b(this.lastEventId)), n.toString();
    }), this.emitter = he();
  }
  subscribe(t = ["*"], e = !0) {
    Array.isArray(t) || (t = [t]);
    const n = Array.from(b(this.subscribedTopics)), s = [.../* @__PURE__ */ new Set([...b(this.subscribedTopics), ...t])];
    this.subscribedTopics.value = s, !Yt(n, s) && (this.connection ? this._updateConnectionTopics() : e && this.listen());
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
      const t = Rt(this._connectedTopics);
      Yt(t, Rt(b(this.subscribedTopics))) || this.connect();
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
    const t = new Le(b(this.endpoint), this.options);
    this.connection = t, this._connectedTopics = Array.from(b(this.subscribedTopics)), this.connection.onopen = () => {
      t === this.connection && (this._failedReconnections = 0), this.emitter.emit("open", { endpoint: b(this.endpoint) });
    }, this.connection.onmessage = (e) => (this.lastEventId.value = e.lastEventId, this.emitter.emit("message", e)), this.connection.onerror = (e) => {
      typeof this.options.reconnectInterval == "number" && (this.stop(), this._reconnectTimer = setTimeout(() => this._reconnect(), this._reconnectDelay())), this.emitter.emit("error", e);
    };
  }
  /*
   * The first retry waits the reconnection interval, and each consecutive failure doubles it, up to
   * 30 seconds (or the reconnection interval if it is longer).
   */
  _reconnectDelay() {
    const { reconnectInterval: t } = this.options, e = Math.min(
      t * 2 ** this._failedReconnections,
      Math.max(Fe, t)
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
const Qt = (r, t) => Object.assign(t, r), Jt = () => {
}, dt = /* @__PURE__ */ new WeakMap();
function Bt(r) {
  if (!dt.has(r)) {
    let e;
    try {
      e = { data: JSON.parse(r.data) };
    } catch (n) {
      e = { error: n };
    }
    dt.set(r, e);
  }
  const t = dt.get(r);
  if ("error" in t)
    throw t.error;
  return t.data;
}
function Ze(r, t, e = ["*"], n = Qt, s = Jt) {
  Array.isArray(e) || (e = [e]);
  const i = (a) => {
    try {
      const f = Bt(a);
      if (!ut(f))
        return;
      if (Object.keys(f).length === 1) {
        s(Y(f));
        return;
      }
      let l = b(t);
      Array.isArray(l) || (l = [l]);
      for (const $ of l)
        ct(Y(f), $) && n(Q(f), b($));
    } catch (f) {
      console.debug(f);
    }
  };
  return r.addListener(i), r.subscribe(e), i;
}
const We = (r, t, e) => {
  Array.isArray(t) || (t = [t]);
  const n = (s) => {
    let i;
    try {
      i = Bt(s);
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
        if (typeof de(a).fromUri(Y(i)) < "u") {
          e(Q(i));
          break;
        }
    } catch (a) {
      console.error(a);
    }
  };
  return r.addListener(n), r.subscribe(t), n;
}, _r = (r, { removeListenersOnUnmount: t = !0 } = {}) => {
  r = r ?? Ve();
  const e = [];
  return t && se(() => {
    for (const s of e)
      r.removeListener(s);
  }), {
    synchronize: (s, i = ["*"], a = Qt, f = Jt) => {
      const l = Ze(r, s, i, a, f);
      return e.push(l), l;
    },
    on(s, i) {
      const a = We(r, s, i);
      return e.push(a), a;
    }
  };
}, Qe = {
  "hydra:Collection": _t,
  "hydra:Error": wt,
  ConstraintViolationList: Pt,
  // The types API Platform 4 sends by default
  Collection: _t,
  Error: wt,
  ConstraintViolation: Pt
};
function St(r, t, e = /* @__PURE__ */ new WeakMap()) {
  var i;
  if (r = pt(r), t = pt(t), Object.is(r, t))
    return !0;
  if (typeof r != "object" || typeof t != "object" || r === null || t === null)
    return !1;
  if ((i = e.get(r)) != null && i.has(t))
    return !0;
  if (e.has(r) || e.set(r, /* @__PURE__ */ new Set()), e.get(r).add(t), Array.isArray(r) || Array.isArray(t))
    return Array.isArray(r) && Array.isArray(t) && r.length === t.length && r.every((a, f) => St(a, t[f], e));
  const n = Object.prototype.toString.call(r);
  if (n !== Object.prototype.toString.call(t) || Object.getPrototypeOf(r) !== Object.getPrototypeOf(t))
    return !1;
  if (n === "[object Date]")
    return r.getTime() === t.getTime();
  if (n !== "[object Object]")
    return !1;
  const s = Object.keys(r);
  return s.length === Object.keys(t).length && s.every((a) => Object.prototype.hasOwnProperty.call(t, a) && St(r[a], t[a], e));
}
class Ut {
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
const Gt = (r, t) => t in r && Object.prototype.hasOwnProperty.call(r, t), mt = (r, t) => Gt(r, t) ? r[t] : null, kt = (r, t, e) => new Promise((n, s) => {
  const i = ie(), a = B();
  let f = 0, l = !1;
  i.run(() => ae(async () => {
    const $ = ++f, T = r();
    if (!t(T))
      try {
        const O = await e(T);
        if ($ !== f)
          return;
        a.value = O, l || (l = !0, n(a));
      } catch (O) {
        $ === f && !l && (l = !0, i.stop(), s(O));
      }
  }));
}), Je = function(r) {
  throw r;
};
class Ar {
  constructor(t, e = {}) {
    d(this, "api");
    d(this, "endpoints");
    d(this, "classmap");
    this.api = t;
    const { endpoints: n, classmap: s } = e;
    this.endpoints = new Pe(n ?? {}), this.classmap = { ...Qe, ...s }, this.errorHandler = e.errorHandler ?? Je;
  }
  factory(t, e) {
    for (const n in this.classmap)
      if (n === (t["@type"] ?? t)) {
        const s = this.classmap[n];
        return t instanceof s ? t : (t = Object.assign(new s(), t), e && Object.assign(t, { statusCode: e }), nt(t));
      }
    return t;
  }
  storeItem({ state: t }, e) {
    const n = Y(e);
    if (!Gt(t.items, n))
      t.items[n] = B(e);
    else {
      const s = t.items[n], i = pt(s);
      for (const a of Object.keys(e))
        (!(a in i) || !St(i[a], e[a])) && (s[a] = e[a]);
    }
    return t.items[n];
  }
  removeItem({ state: t }, e) {
    const n = Y(e);
    delete t.items[n];
  }
  async clearItems({ state: t }) {
    t.items = nt(new Ut());
  }
  async handle(t, { errorHandler: e = this.errorHandler } = {}) {
    var n, s, i;
    try {
      const { data: a } = await t();
      return this.factory(a);
    } catch (a) {
      const f = (n = a.response) == null ? void 0 : n.status;
      typeof ((s = a.response) == null ? void 0 : s.data) == "object" && ((i = a.response) == null ? void 0 : i.data) != null && (a = this.factory(a.response.data, f)), a.statusCode = a.statusCode ?? f, e(a);
    }
  }
  async fetchItem({ state: t }, e, n) {
    let s = new ot(Y(e));
    n != null && n.groups && (s = s.withQuery(`${new lt(s.getQuery()).withParam("groups", n.groups)}`));
    let i = await this.handle(() => this.api.get(`${s}`, n), n);
    return i === void 0 ? void 0 : (i = this.factory(i), (n == null ? void 0 : n.store) ?? !0 ? this.storeItem({ state: t }, i) : i);
  }
  async getItem({ state: t }, e, n) {
    if (e === null)
      return null;
    const s = Y(e), i = mt(t.items, s);
    return i ?? await this.fetchItem({ state: t }, s, n);
  }
  async fetchCollection({ state: t }, e, n) {
    let s = new ot(`${e}`);
    n != null && n.groups && (s = s.withQuery(`${new lt(s.getQuery()).withParam("groups", n.groups)}`));
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
    return jt(e), e = await this.handle(() => this.api.put(Y(e), e, n), n), e === void 0 ? void 0 : (n == null ? void 0 : n.store) ?? !0 ? this.storeItem({ state: t }, e) : e;
  }
  async upsertItem({ state: t }, e, n) {
    return ut(e) ? this.updateItem({ state: t }, e, n) : this.createItem({ state: t }, e, n);
  }
  async deleteItem({ state: t }, e, n) {
    const s = Y(e);
    await this.handle(() => this.api.delete(s, n), n), e = mt(t.items, s), e !== null && this.removeItem({ state: t }, e);
  }
  async getRelation({ state: t }, e, n = {}) {
    if (e === null)
      return null;
    if (typeof e == "function")
      return kt(e, (i) => i === void 0, (i) => this.getRelation({ state: t }, i, n));
    const s = (n.useExisting ?? !0) !== !1;
    if (s && (typeof b(e) == "string" || ut(e))) {
      const i = mt(t.items, Y(e));
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
    return typeof e == "function" ? kt(e, (s) => s == null, (s) => this.getRelations({ state: t }, s, n)) : Promise.all(e.map((s) => this.getRelation({ state: t }, s, n)));
  }
  async install(t) {
    t.state.items = nt(new Ut()), t.state.endpoints = yt(this.endpoints), t.state.classmap = yt(this.classmap), t.storeItem = (e) => this.storeItem(t, e), t.removeItem = (e) => this.removeItem(t, e), t.clearItems = () => this.clearItems(t), t.getItem = (e, n) => this.getItem(t, e, n), t.fetchItem = (e, n) => this.fetchItem(t, e, n), t.fetchCollection = (e, n) => this.fetchCollection(t, e, n), t.createItem = (e, n) => this.createItem(t, e, n), t.updateItem = (e, n) => this.updateItem(t, e, n), t.upsertItem = (e, n) => this.upsertItem(t, e, n), t.deleteItem = (e, n) => this.deleteItem(t, e, n), t.getRelation = (e, n) => this.getRelation(t, e, n), t.getRelations = (e, n) => this.getRelations(t, e, n), t.endpoint = (e) => t.state.endpoints[e], t.getItemsByType = (e) => t.state.items.filter((n) => e === n["@type"]), t.factory = (e, n) => (n = n ?? e, typeof e == "string" && (n["@type"] = e), this.factory(n));
  }
}
function Kt(r) {
  if (typeof r == "string")
    return r;
  try {
    return Y(r);
  } catch {
    return null;
  }
}
function Be(r) {
  return r.map((t) => Kt(t));
}
async function Xt(r, t) {
  try {
    return await t.getItem(r);
  } catch {
    return null;
  }
}
async function Ge(r, t) {
  return Promise.all(r.map((e) => Xt(e, t)));
}
class Cr extends W {
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
    return this.multiple || this.items.length > 1 ? Be(this.items) : Kt(this.item);
  }
  async denormalize(e) {
    if (Array.isArray(e)) {
      this.items = await Ge(e, this.store);
      return;
    }
    this.items = [await Xt(e, this.store)];
  }
}
const Ke = {
  asc: "desc",
  desc: "asc"
};
class Yr extends W {
  constructor(e = {}) {
    super();
    d(this, "order");
    this.order = e;
  }
  revert() {
    const e = {};
    for (const n in this.order) {
      const s = this.order[n];
      e[n] = Ke[s] ?? s;
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
class Rr extends W {
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
class Ur extends W {
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
class kr extends W {
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
function Nr({ itemsPerPage: r, currentPage: t, totalItems: e }) {
  return e == null ? new er({ itemsPerPage: r, currentPage: t }) : new tr({ itemsPerPage: r, currentPage: t, totalItems: e });
}
function Xe(r) {
  return Array.from({ length: r }, (t, e) => e + 1);
}
class xt {
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
    return new rr(this, t, e);
  }
}
class tr extends xt {
  constructor({ itemsPerPage: t, currentPage: e, totalItems: n }) {
    super({ itemsPerPage: t, currentPage: e }), this.totalItems = parseInt(n), this.lastPage = Math.max(1, Math.ceil(this.totalItems / Math.max(1, this.itemsPerPage))), this.nextPage = Math.min(this.lastPage, this.currentPage + 1);
  }
}
class er extends xt {
  constructor({ itemsPerPage: t, currentPage: e, totalItems: n }) {
    super({ itemsPerPage: t, currentPage: e, totalItems: n }), this.nextPage = this.lastPage = this.currentPage + 1;
  }
}
class rr extends xt {
  constructor(t, e, n = !1) {
    super(t), Object.assign(this, t);
    const s = [];
    n && s.push(1);
    for (let i = 1; i <= this.lastPage; i++)
      i === this.currentPage && s.push(i), i < this.currentPage && i >= this.currentPage - e && s.push(i), i > this.currentPage && i <= this.currentPage + e && s.push(i);
    n && s.push(this.lastPage), this._pages = [...new Set(s)];
  }
}
class nr {
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
function Hr({ fields: r, preload: t } = {}) {
  return Object.assign(new nr(), { fields: r }, { preload: t }).headers;
}
export {
  ye as AbortError,
  yr as ApiClient,
  pr as ArrayFilter,
  Pt as ConstraintViolationList,
  je as DateRangeFilter,
  xe as DatetimeRangeFilter,
  Ne as FakeEventSource,
  br as FilterCollection,
  me as HttpError,
  _t as HydraCollection,
  Dt as HydraEndpoint,
  Pe as HydraEndpoints,
  wt as HydraError,
  Ar as HydraPlugin,
  Cr as ItemFilter,
  qe as Mercure,
  Yr as OrderFilter,
  Rr as RangeFilter,
  Ur as TextFilter,
  kr as TruthyFilter,
  Ce as Violation,
  ct as areSameIris,
  jt as checkValidItem,
  Q as clone,
  Ae as containsIri,
  Pr as createMercure,
  Nr as createPager,
  wr as createStore,
  _e as getId,
  Tr as getIds,
  Y as getIri,
  Sr as getIris,
  zr as getItemByIri,
  Dr as getItemIndexByIri,
  jr as getItemsByType,
  ut as hasIri,
  Ze as mercureSync,
  xr as normalizeIris,
  Re as normalizeItemRelations,
  We as on,
  Mr as partialItem,
  $r as useEndpoint,
  vr as useFilters,
  Ir as useFormValidation,
  Er as useItemForm,
  Ve as useMercure,
  _r as useMercureSync,
  Wt as useStore,
  Hr as vulcain,
  gr as withoutDuplicates,
  Or as withoutIri
};
