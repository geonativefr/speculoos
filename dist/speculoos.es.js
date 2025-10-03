var Lt = Object.defineProperty;
var Nt = (n, t, e) => t in n ? Lt(n, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : n[t] = e;
var d = (n, t, e) => (Nt(n, typeof t != "symbol" ? t + "" : t, e), e);
import { whenever as kt, asyncComputed as $t, until as wt } from "@vueuse/core";
import { unref as b, isRef as st, ref as W, reactive as G, readonly as ht, inject as Mt, computed as lt, onUnmounted as Vt } from "vue";
import St from "clone-deep";
import Ft from "md5";
import V from "is-empty";
import { useRoute as qt, useRouter as Zt, onBeforeRouteUpdate as Jt } from "vue-router";
import { URI as et, QueryString as it } from "psr7-js";
import { v4 as Qt } from "uuid";
import Wt from "mitt";
import Bt from "uri-templates";
class Gt extends Error {
  constructor(t) {
    super(t.statusText), this.response = t, this.statusCode = parseInt(this.response.status);
  }
  isStatusCode(t) {
    const e = (r) => parseInt(r) === this.statusCode;
    for (let r of arguments)
      if (e(r))
        return !0;
    return !1;
  }
  isClientError() {
    return this.statusCode >= 400 && this.statusCode < 500;
  }
  isServerError() {
    return this.statusCode > 500;
  }
  static guard(t) {
    if (t.status >= 400)
      throw new this(t);
    return t;
  }
}
class Kt extends Error {
  constructor(t) {
    super(), this.name = "AbortError", this.reason = t;
  }
}
const ut = (n) => {
  if (!(n instanceof Headers))
    return n;
  const t = {};
  for (let e of n.keys())
    t[e] = n.get(e);
  return t;
}, Xt = {
  Accept: "application/ld+json, application/json"
}, It = async (n) => {
  try {
    const t = await n.text();
    try {
      n.data = JSON.parse(t), n.json = () => new Promise((e) => e(n.data));
    } catch {
      n.data = t, n.json = () => new Promise((r) => r(n.data));
    }
  } catch {
  }
  return n;
};
class qe {
  constructor({ baseUri: t = "", options: e = {}, fetcher: r } = {}) {
    d(this, "baseUri");
    d(this, "options");
    d(this, "fetch");
    var s;
    this.baseUri = t, this.options = e, r = r ?? ((s = window.fetch) == null ? void 0 : s.bind(window)), this.fetch = async (i, a) => r(i, a).then(It);
  }
  resolve(t) {
    return new URL(t, this.baseUri).toString();
  }
  mergeOptions(t) {
    let e = { ...this.options };
    Object.keys(e).includes("headers") && (e.headers = ut(e.headers));
    for (let r of arguments) {
      let s = { ...r };
      Object.keys(s).includes("headers") && (s.headers = { ...ut(s.headers) }), e = { ...St(e), ...St(s) };
    }
    return e;
  }
  async request(t, e, r) {
    e = `${b(e)}`, r = this.mergeOptions({ method: t }, r), Object.keys(r).includes("headers") && (r.headers = new Headers({ ...Xt, ...ut(r.headers) }));
    try {
      if (st(r == null ? void 0 : r.isLoading) && (r.isLoading.value = !0), st(r == null ? void 0 : r.aborted)) {
        const s = new AbortController(), { signal: i } = s;
        r.signal = i, kt(r.aborted, () => s.abort(), { immediate: !0 });
      }
      try {
        const s = await this.fetch(e, r);
        return Gt.guard(s);
      } catch (s) {
        throw s.name === "AbortError" ? new Kt(s.reason) : s;
      }
    } finally {
      st(r == null ? void 0 : r.isLoading) && (r.isLoading.value = !1);
    }
  }
  async get(t, e = {}) {
    return await this.request("GET", this.resolve(t), this.mergeOptions(e));
  }
  async post(t, e, r = {}) {
    return await this.request("POST", this.resolve(t), this.mergeOptions(
      {
        body: JSON.stringify(b(e)),
        headers: {
          "Content-Type": "application/json"
        }
      },
      r
    ));
  }
  async put(t, e, r = {}) {
    return await this.request("PUT", this.resolve(t), this.mergeOptions(
      {
        body: JSON.stringify(b(e)),
        headers: {
          "Content-Type": "application/json"
        }
      },
      r
    ));
  }
  async delete(t, e = {}) {
    return await this.request("DELETE", this.resolve(t), this.mergeOptions(e));
  }
}
class te {
  constructor(t = ((e) => (e = window.fetch) == null ? void 0 : e.bind(window))()) {
    d(this, "fetch");
    d(this, "pendingRequests", []);
    return this.fetch = t, (r, s) => {
      try {
        const i = Ft(JSON.stringify({ url: r, ...s })), a = this.pendingRequests.findIndex((f) => i === f.hash);
        if (a >= 0)
          return this.pendingRequests[a].promise;
        const c = this.fetch(r, s).then(It);
        return this.pendingRequests.push({ hash: i, promise: c }), c.then(
          (f) => (this.removePendingRequest(i), f),
          (f) => {
            throw this.removePendingRequest(i), f;
          }
        );
      } catch {
        return this.fetch(r, s);
      }
    };
  }
  removePendingRequest(t) {
    const e = this.pendingRequests.findIndex((r) => t === r.hash);
    e >= 0 && this.pendingRequests.splice(e, 1);
  }
}
function Ze(n = void 0) {
  return new te(n);
}
const K = (n, t = !0, e = []) => {
  if (typeof n != "object" || n == null)
    return n;
  const r = e.find((i) => i.orig === n);
  if (r != null)
    return r.cloned;
  let s = Object.assign(Object.create(Object.getPrototypeOf(n)), n);
  if (Array.isArray(n) && (s = Object.values(s)), e.push({ orig: n, cloned: s }), t)
    for (const i in s)
      typeof s[i] == "object" && s[i] != null && (s[i] = K(s[i], t, e));
  return "__clone" in s && typeof s.__clone == "function" && s.__clone(), s;
};
class F {
  normalize() {
    throw Error("This method is meant to be overriden.");
  }
  async denormalize(t) {
    throw Error("This method is meant to be overriden.");
  }
}
class Je extends F {
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
var mt = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function yt(n) {
  return n && n.__esModule && Object.prototype.hasOwnProperty.call(n, "default") ? n.default : n;
}
var xt = { exports: {} };
(function(n, t) {
  (function(e, r) {
    n.exports = r();
  })(mt, function() {
    var e = 1e3, r = 6e4, s = 36e5, i = "millisecond", a = "second", c = "minute", f = "hour", $ = "day", E = "week", A = "month", O = "quarter", D = "year", T = "date", h = "Invalid Date", S = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/, C = /\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g, M = { name: "en", weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"), months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_") }, I = function(p, l, o) {
      var m = String(p);
      return !m || m.length >= l ? p : "" + Array(l + 1 - m.length).join(o) + p;
    }, N = { s: I, z: function(p) {
      var l = -p.utcOffset(), o = Math.abs(l), m = Math.floor(o / 60), u = o % 60;
      return (l <= 0 ? "+" : "-") + I(m, 2, "0") + ":" + I(u, 2, "0");
    }, m: function p(l, o) {
      if (l.date() < o.date())
        return -p(o, l);
      var m = 12 * (o.year() - l.year()) + (o.month() - l.month()), u = l.clone().add(m, A), g = o - u < 0, y = l.clone().add(m + (g ? -1 : 1), A);
      return +(-(m + (o - u) / (g ? u - y : y - u)) || 0);
    }, a: function(p) {
      return p < 0 ? Math.ceil(p) || 0 : Math.floor(p);
    }, p: function(p) {
      return { M: A, y: D, w: E, d: $, D: T, h: f, m: c, s: a, ms: i, Q: O }[p] || String(p || "").toLowerCase().replace(/s$/, "");
    }, u: function(p) {
      return p === void 0;
    } }, P = "en", R = {};
    R[P] = M;
    var H = function(p) {
      return p instanceof Z;
    }, k = function p(l, o, m) {
      var u;
      if (!l)
        return P;
      if (typeof l == "string") {
        var g = l.toLowerCase();
        R[g] && (u = g), o && (R[g] = o, u = g);
        var y = l.split("-");
        if (!u && y.length > 1)
          return p(y[0]);
      } else {
        var w = l.name;
        R[w] = l, u = w;
      }
      return !m && u && (P = u), u || !m && P;
    }, z = function(p, l) {
      if (H(p))
        return p.clone();
      var o = typeof l == "object" ? l : {};
      return o.date = p, o.args = arguments, new Z(o);
    }, v = N;
    v.l = k, v.i = H, v.w = function(p, l) {
      return z(p, { locale: l.$L, utc: l.$u, x: l.$x, $offset: l.$offset });
    };
    var Z = function() {
      function p(o) {
        this.$L = k(o.locale, null, !0), this.parse(o);
      }
      var l = p.prototype;
      return l.parse = function(o) {
        this.$d = function(m) {
          var u = m.date, g = m.utc;
          if (u === null)
            return /* @__PURE__ */ new Date(NaN);
          if (v.u(u))
            return /* @__PURE__ */ new Date();
          if (u instanceof Date)
            return new Date(u);
          if (typeof u == "string" && !/Z$/i.test(u)) {
            var y = u.match(S);
            if (y) {
              var w = y[2] - 1 || 0, j = (y[7] || "0").substring(0, 3);
              return g ? new Date(Date.UTC(y[1], w, y[3] || 1, y[4] || 0, y[5] || 0, y[6] || 0, j)) : new Date(y[1], w, y[3] || 1, y[4] || 0, y[5] || 0, y[6] || 0, j);
            }
          }
          return new Date(u);
        }(o), this.$x = o.x || {}, this.init();
      }, l.init = function() {
        var o = this.$d;
        this.$y = o.getFullYear(), this.$M = o.getMonth(), this.$D = o.getDate(), this.$W = o.getDay(), this.$H = o.getHours(), this.$m = o.getMinutes(), this.$s = o.getSeconds(), this.$ms = o.getMilliseconds();
      }, l.$utils = function() {
        return v;
      }, l.isValid = function() {
        return this.$d.toString() !== h;
      }, l.isSame = function(o, m) {
        var u = z(o);
        return this.startOf(m) <= u && u <= this.endOf(m);
      }, l.isAfter = function(o, m) {
        return z(o) < this.startOf(m);
      }, l.isBefore = function(o, m) {
        return this.endOf(m) < z(o);
      }, l.$g = function(o, m, u) {
        return v.u(o) ? this[m] : this.set(u, o);
      }, l.unix = function() {
        return Math.floor(this.valueOf() / 1e3);
      }, l.valueOf = function() {
        return this.$d.getTime();
      }, l.startOf = function(o, m) {
        var u = this, g = !!v.u(m) || m, y = v.p(o), w = function(B, L) {
          var Q = v.w(u.$u ? Date.UTC(u.$y, L, B) : new Date(u.$y, L, B), u);
          return g ? Q : Q.endOf($);
        }, j = function(B, L) {
          return v.w(u.toDate()[B].apply(u.toDate("s"), (g ? [0, 0, 0, 0] : [23, 59, 59, 999]).slice(L)), u);
        }, x = this.$W, Y = this.$M, J = this.$D, q = "set" + (this.$u ? "UTC" : "");
        switch (y) {
          case D:
            return g ? w(1, 0) : w(31, 11);
          case A:
            return g ? w(1, Y) : w(0, Y + 1);
          case E:
            var X = this.$locale().weekStart || 0, tt = (x < X ? x + 7 : x) - X;
            return w(g ? J - tt : J + (6 - tt), Y);
          case $:
          case T:
            return j(q + "Hours", 0);
          case f:
            return j(q + "Minutes", 1);
          case c:
            return j(q + "Seconds", 2);
          case a:
            return j(q + "Milliseconds", 3);
          default:
            return this.clone();
        }
      }, l.endOf = function(o) {
        return this.startOf(o, !1);
      }, l.$set = function(o, m) {
        var u, g = v.p(o), y = "set" + (this.$u ? "UTC" : ""), w = (u = {}, u[$] = y + "Date", u[T] = y + "Date", u[A] = y + "Month", u[D] = y + "FullYear", u[f] = y + "Hours", u[c] = y + "Minutes", u[a] = y + "Seconds", u[i] = y + "Milliseconds", u)[g], j = g === $ ? this.$D + (m - this.$W) : m;
        if (g === A || g === D) {
          var x = this.clone().set(T, 1);
          x.$d[w](j), x.init(), this.$d = x.set(T, Math.min(this.$D, x.daysInMonth())).$d;
        } else
          w && this.$d[w](j);
        return this.init(), this;
      }, l.set = function(o, m) {
        return this.clone().$set(o, m);
      }, l.get = function(o) {
        return this[v.p(o)]();
      }, l.add = function(o, m) {
        var u, g = this;
        o = Number(o);
        var y = v.p(m), w = function(Y) {
          var J = z(g);
          return v.w(J.date(J.date() + Math.round(Y * o)), g);
        };
        if (y === A)
          return this.set(A, this.$M + o);
        if (y === D)
          return this.set(D, this.$y + o);
        if (y === $)
          return w(1);
        if (y === E)
          return w(7);
        var j = (u = {}, u[c] = r, u[f] = s, u[a] = e, u)[y] || 1, x = this.$d.getTime() + o * j;
        return v.w(x, this);
      }, l.subtract = function(o, m) {
        return this.add(-1 * o, m);
      }, l.format = function(o) {
        var m = this, u = this.$locale();
        if (!this.isValid())
          return u.invalidDate || h;
        var g = o || "YYYY-MM-DDTHH:mm:ssZ", y = v.z(this), w = this.$H, j = this.$m, x = this.$M, Y = u.weekdays, J = u.months, q = function(L, Q, at, nt) {
          return L && (L[Q] || L(m, g)) || at[Q].slice(0, nt);
        }, X = function(L) {
          return v.s(w % 12 || 12, L, "0");
        }, tt = u.meridiem || function(L, Q, at) {
          var nt = L < 12 ? "AM" : "PM";
          return at ? nt.toLowerCase() : nt;
        }, B = { YY: String(this.$y).slice(-2), YYYY: this.$y, M: x + 1, MM: v.s(x + 1, 2, "0"), MMM: q(u.monthsShort, x, J, 3), MMMM: q(J, x), D: this.$D, DD: v.s(this.$D, 2, "0"), d: String(this.$W), dd: q(u.weekdaysMin, this.$W, Y, 2), ddd: q(u.weekdaysShort, this.$W, Y, 3), dddd: Y[this.$W], H: String(w), HH: v.s(w, 2, "0"), h: X(1), hh: X(2), a: tt(w, j, !0), A: tt(w, j, !1), m: String(j), mm: v.s(j, 2, "0"), s: String(this.$s), ss: v.s(this.$s, 2, "0"), SSS: v.s(this.$ms, 3, "0"), Z: y };
        return g.replace(C, function(L, Q) {
          return Q || B[L] || y.replace(":", "");
        });
      }, l.utcOffset = function() {
        return 15 * -Math.round(this.$d.getTimezoneOffset() / 15);
      }, l.diff = function(o, m, u) {
        var g, y = v.p(m), w = z(o), j = (w.utcOffset() - this.utcOffset()) * r, x = this - w, Y = v.m(this, w);
        return Y = (g = {}, g[D] = Y / 12, g[A] = Y, g[O] = Y / 3, g[E] = (x - j) / 6048e5, g[$] = (x - j) / 864e5, g[f] = x / s, g[c] = x / r, g[a] = x / e, g)[y] || x, u ? Y : v.a(Y);
      }, l.daysInMonth = function() {
        return this.endOf(A).$D;
      }, l.$locale = function() {
        return R[this.$L];
      }, l.locale = function(o, m) {
        if (!o)
          return this.$L;
        var u = this.clone(), g = k(o, m, !0);
        return g && (u.$L = g), u;
      }, l.clone = function() {
        return v.w(this.$d, this);
      }, l.toDate = function() {
        return new Date(this.valueOf());
      }, l.toJSON = function() {
        return this.isValid() ? this.toISOString() : null;
      }, l.toISOString = function() {
        return this.$d.toISOString();
      }, l.toString = function() {
        return this.$d.toUTCString();
      }, p;
    }(), bt = Z.prototype;
    return z.prototype = bt, [["$ms", i], ["$s", a], ["$m", c], ["$H", f], ["$W", $], ["$M", A], ["$y", D], ["$D", T]].forEach(function(p) {
      bt[p[1]] = function(l) {
        return this.$g(l, p[0], p[1]);
      };
    }), z.extend = function(p, l) {
      return p.$i || (p(l, Z, z), p.$i = !0), z;
    }, z.locale = k, z.isDayjs = H, z.unix = function(p) {
      return z(1e3 * p);
    }, z.en = R[P], z.Ls = R, z.p = {}, z;
  });
})(xt);
var ee = xt.exports;
const _ = /* @__PURE__ */ yt(ee);
var Et = { exports: {} };
(function(n, t) {
  (function(e, r) {
    n.exports = r();
  })(mt, function() {
    var e = "minute", r = /[+-]\d\d(?::?\d\d)?/g, s = /([+-]|\d\d)/g;
    return function(i, a, c) {
      var f = a.prototype;
      c.utc = function(h) {
        var S = { date: h, utc: !0, args: arguments };
        return new a(S);
      }, f.utc = function(h) {
        var S = c(this.toDate(), { locale: this.$L, utc: !0 });
        return h ? S.add(this.utcOffset(), e) : S;
      }, f.local = function() {
        return c(this.toDate(), { locale: this.$L, utc: !1 });
      };
      var $ = f.parse;
      f.parse = function(h) {
        h.utc && (this.$u = !0), this.$utils().u(h.$offset) || (this.$offset = h.$offset), $.call(this, h);
      };
      var E = f.init;
      f.init = function() {
        if (this.$u) {
          var h = this.$d;
          this.$y = h.getUTCFullYear(), this.$M = h.getUTCMonth(), this.$D = h.getUTCDate(), this.$W = h.getUTCDay(), this.$H = h.getUTCHours(), this.$m = h.getUTCMinutes(), this.$s = h.getUTCSeconds(), this.$ms = h.getUTCMilliseconds();
        } else
          E.call(this);
      };
      var A = f.utcOffset;
      f.utcOffset = function(h, S) {
        var C = this.$utils().u;
        if (C(h))
          return this.$u ? 0 : C(this.$offset) ? A.call(this) : this.$offset;
        if (typeof h == "string" && (h = function(P) {
          P === void 0 && (P = "");
          var R = P.match(r);
          if (!R)
            return null;
          var H = ("" + R[0]).match(s) || ["-", 0, 0], k = H[0], z = 60 * +H[1] + +H[2];
          return z === 0 ? 0 : k === "+" ? z : -z;
        }(h), h === null))
          return this;
        var M = Math.abs(h) <= 16 ? 60 * h : h, I = this;
        if (S)
          return I.$offset = M, I.$u = h === 0, I;
        if (h !== 0) {
          var N = this.$u ? this.toDate().getTimezoneOffset() : -1 * this.utcOffset();
          (I = this.local().add(M + N, e)).$offset = M, I.$x.$localOffset = N;
        } else
          I = this.utc();
        return I;
      };
      var O = f.format;
      f.format = function(h) {
        var S = h || (this.$u ? "YYYY-MM-DDTHH:mm:ss[Z]" : "");
        return O.call(this, S);
      }, f.valueOf = function() {
        var h = this.$utils().u(this.$offset) ? 0 : this.$offset + (this.$x.$localOffset || this.$d.getTimezoneOffset());
        return this.$d.valueOf() - 6e4 * h;
      }, f.isUTC = function() {
        return !!this.$u;
      }, f.toISOString = function() {
        return this.toDate().toISOString();
      }, f.toString = function() {
        return this.toDate().toUTCString();
      };
      var D = f.toDate;
      f.toDate = function(h) {
        return h === "s" && this.$offset ? c(this.format("YYYY-MM-DD HH:mm:ss:SSS")).toDate() : D.call(this);
      };
      var T = f.diff;
      f.diff = function(h, S, C) {
        if (h && this.$u === h.$u)
          return T.call(this, h, S, C);
        var M = this.local(), I = c(h).local();
        return T.call(M, I, S, C);
      };
    };
  });
})(Et);
var re = Et.exports;
const Pt = /* @__PURE__ */ yt(re);
var jt = { exports: {} };
(function(n, t) {
  (function(e, r) {
    n.exports = r();
  })(mt, function() {
    var e = { year: 0, month: 1, day: 2, hour: 3, minute: 4, second: 5 }, r = {};
    return function(s, i, a) {
      var c, f = function(O, D, T) {
        T === void 0 && (T = {});
        var h = new Date(O), S = function(C, M) {
          M === void 0 && (M = {});
          var I = M.timeZoneName || "short", N = C + "|" + I, P = r[N];
          return P || (P = new Intl.DateTimeFormat("en-US", { hour12: !1, timeZone: C, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: I }), r[N] = P), P;
        }(D, T);
        return S.formatToParts(h);
      }, $ = function(O, D) {
        for (var T = f(O, D), h = [], S = 0; S < T.length; S += 1) {
          var C = T[S], M = C.type, I = C.value, N = e[M];
          N >= 0 && (h[N] = parseInt(I, 10));
        }
        var P = h[3], R = P === 24 ? 0 : P, H = h[0] + "-" + h[1] + "-" + h[2] + " " + R + ":" + h[4] + ":" + h[5] + ":000", k = +O;
        return (a.utc(H).valueOf() - (k -= k % 1e3)) / 6e4;
      }, E = i.prototype;
      E.tz = function(O, D) {
        O === void 0 && (O = c);
        var T = this.utcOffset(), h = this.toDate(), S = h.toLocaleString("en-US", { timeZone: O }), C = Math.round((h - new Date(S)) / 1e3 / 60), M = a(S).$set("millisecond", this.$ms).utcOffset(15 * -Math.round(h.getTimezoneOffset() / 15) - C, !0);
        if (D) {
          var I = M.utcOffset();
          M = M.add(T - I, "minute");
        }
        return M.$x.$timezone = O, M;
      }, E.offsetName = function(O) {
        var D = this.$x.$timezone || a.tz.guess(), T = f(this.valueOf(), D, { timeZoneName: O }).find(function(h) {
          return h.type.toLowerCase() === "timezonename";
        });
        return T && T.value;
      };
      var A = E.startOf;
      E.startOf = function(O, D) {
        if (!this.$x || !this.$x.$timezone)
          return A.call(this, O, D);
        var T = a(this.format("YYYY-MM-DD HH:mm:ss:SSS"));
        return A.call(T, O, D).tz(this.$x.$timezone, !0);
      }, a.tz = function(O, D, T) {
        var h = T && D, S = T || D || c, C = $(+a(), S);
        if (typeof O != "string")
          return a(O).tz(S);
        var M = function(R, H, k) {
          var z = R - 60 * H * 1e3, v = $(z, k);
          if (H === v)
            return [z, H];
          var Z = $(z -= 60 * (v - H) * 1e3, k);
          return v === Z ? [z, v] : [R - 60 * Math.min(v, Z) * 1e3, Math.max(v, Z)];
        }(a.utc(O, h).valueOf(), C, S), I = M[0], N = M[1], P = a(I).utcOffset(N);
        return P.$x.$timezone = S, P;
      }, a.tz.guess = function() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      }, a.tz.setDefault = function(O) {
        c = O;
      };
    };
  });
})(jt);
var ne = jt.exports;
const Ct = /* @__PURE__ */ yt(ne);
_.extend(Pt);
_.extend(Ct);
class se extends F {
  constructor({ after: e = null, before: r = null } = {}, { withTime: s = !0, useUserTimezone: i = !0 } = {}) {
    super();
    d(this, "after");
    d(this, "before");
    d(this, "normalizedFormat");
    d(this, "useUserTimezone");
    this.after = e, this.before = r, this.normalizedFormat = s ? "YYYY-MM-DD[T]HH:mm:ss[Z]" : "YYYY-MM-DD", this.useUserTimezone = i;
  }
  normalize() {
    this.constructor.ensureTimezoneIsSet();
    const e = this.useUserTimezone ? this.constructor.userTimezone : "UTC";
    let r = null, s = null;
    return V(this.after) || (r = _.tz(this.after, e).hour(0).minute(0).second(0).tz("UTC").format(this.normalizedFormat)), V(this.before) || (s = _.tz(this.before, e).hour(0).minute(0).second(0).add(1, "day").subtract(1, "second").tz("UTC").format(this.normalizedFormat)), { after: r, before: s };
  }
  async denormalize(e) {
    this.constructor.ensureTimezoneIsSet(), this.after = null, this.before = null, V(e.after) || (this.after = this.useUserTimezone ? _.tz(e.after, "UTC").tz(this.constructor.userTimezone) : _.tz(e.after, "UTC"), this.after = this.after.hour(0).minute(0).second(0).format("YYYY-MM-DD")), V(e.before) || (this.before = this.useUserTimezone ? _.tz(e.before, "UTC").tz(this.constructor.userTimezone) : _.tz(e.before, "UTC"), this.before = this.before.hour(0).minute(0).second(0).add(1, "day").subtract(1, "second").format("YYYY-MM-DD"));
  }
  static ensureTimezoneIsSet() {
    this.constructor.userTimezone = this.constructor.userTimezone ?? (_.tz.guess() || "UTC");
  }
}
d(se, "userTimezone");
_.extend(Pt);
_.extend(Ct);
class ie extends F {
  constructor({ after: e = null, before: r = null } = {}) {
    super();
    d(this, "after");
    d(this, "before");
    this.after = e, this.before = r;
  }
  normalize() {
    this.constructor.ensureTimezoneIsSet();
    let e = null, r = null;
    return V(this.after) || (e = _.tz(this.after, this.constructor.userTimezone).tz("UTC").format("YYYY-MM-DD[T]HH:mm:ss[Z]")), V(this.before) || (r = _.tz(this.before, this.constructor.userTimezone).tz("UTC").format("YYYY-MM-DD[T]HH:mm:ss[Z]")), { after: e, before: r };
  }
  async denormalize(e) {
    this.constructor.ensureTimezoneIsSet(), this.after = null, this.before = null, V(e.after) || (this.after = _.tz(e.after, "UTC").tz(this.constructor.userTimezone).format("YYYY-MM-DD[T]HH:mm:ss[Z]")), V(e.before) || (this.before = _.tz(e.before, "UTC").tz(this.constructor.userTimezone).format("YYYY-MM-DD[T]HH:mm:ss[Z]"));
  }
  static ensureTimezoneIsSet() {
    this.constructor.userTimezone = this.constructor.userTimezone ?? (_.tz.guess() || "UTC");
  }
}
d(ie, "userTimezone");
function oe(n) {
  return n == null ? !0 : typeof n == "string" ? n.trim().length === 0 : typeof n == "function" || Array.isArray(n) ? n.length === 0 : n instanceof Object ? Object.keys(n).length === 0 : !1;
}
function ft(n) {
  if (!(n instanceof Object))
    return n;
  if (Array.isArray(n))
    return n.map(ft);
  const t = { ...n };
  return Object.keys(t).forEach((e) => {
    t[e] instanceof Object && (t[e] = ft(t[e])), oe(t[e]) && delete t[e];
  }), t;
}
class Qe {
  constructor(t = {}) {
    d(this, "_filters", []);
    if (!(t instanceof Object))
      throw Error("A FilterCollection expects an object.");
    Object.keys(t).forEach((e) => {
      if (!(t[e] instanceof F))
        throw Error(`Filter ${e} doesn't extend the Filter class.`);
      this[e] = t[e], this._filters.push(e);
    });
  }
  normalize() {
    const t = {};
    return this._filters.forEach((e) => {
      const r = this[e];
      t[e] = r.normalize();
    }), ft(t);
  }
  async denormalize(t) {
    const e = [];
    for (const r of this._filters) {
      const s = this[r];
      s instanceof F && typeof t[r] < "u" && e.push(s.denormalize(t[r]));
    }
    return e.length > 0 && await Promise.all(e), this;
  }
}
async function We(n = {}, t = {
  preserveQuery: !1,
  targetRoute: void 0
}) {
  if (typeof n != "function")
    throw Error("initialState should be provided as a function.");
  const e = qt(), r = Zt(), s = W(n());
  async function i($) {
    Object.assign(b(s), await b(s).denormalize($.query));
  }
  function a() {
    s.value = K(n());
  }
  function c($ = {}) {
    const E = {};
    return t.preserveQuery === !0 && Object.assign(E, e.query), Object.assign(E, b(s).normalize(), $);
  }
  async function f($ = {}) {
    const E = b(t.targetRoute) ?? e;
    await r.push(Object.assign({ ...E }, { query: c($) }));
  }
  return Jt(($) => i($)), await i(e), {
    filters: s,
    buildQueryParams: c,
    submit: f,
    clear: a
  };
}
const Be = async ({ state: n = {}, methods: t = {}, name: e = "store" } = {}) => {
  n = G(n);
  const r = [], s = {
    name: e,
    state: n,
    ...Object.keys(t).reduce(function(i, a) {
      const c = t[a];
      return i[a] = function() {
        return c(n, ...arguments);
      }, i;
    }, {}),
    async use(i) {
      return r.push(i), await i.install(this), this;
    },
    async reconciliate(i = !1) {
      const a = r.filter(({ reconciliate: c }) => typeof c == "function");
      if (i === !1)
        return Promise.all(a.map((c) => c.reconciliate(this)));
      for (const c of a)
        await c.reconciliate(this);
    }
  };
  return s.install = (i) => i.provide(e, { ...s, state: ht(n) }), s;
}, At = (n = "store") => Mt(n);
class ae {
  constructor(t) {
    Object.keys(t).forEach((e) => {
      this[e] = new gt(t[e]);
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
class gt {
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
    let e = new et(this.endpoint);
    return e = e.withPath(`${e.getPath()}/${t}`), e.toString();
  }
  withQuery(t) {
    const e = new et(this.endpoint), r = new it(e).withParams(t);
    return new gt(e.withQuery(r.toString()).toString());
  }
  paginated(t, e = !1) {
    t = b(t), e = b(e);
    const r = {
      pagination: t === !1 ? 0 : 1,
      partial: e === !1 ? void 0 : 1,
      itemsPerPage: void 0
    };
    return t !== !1 && (r.itemsPerPage = t), this.withQuery(r);
  }
  synchronize(t = window.location.href) {
    return this.withQuery(new it(new et(t)).getParams());
  }
}
const Ge = (n, t) => At(t).state.endpoints[n];
function ot(n) {
  return n = b(n), n == null ? !1 : Object.keys(n).includes("@id") && n["@id"] != null;
}
function U(n) {
  return n = b(n), n === null ? null : typeof n == "string" ? n : (pt(n), n["@id"]);
}
function ue(n) {
  const t = U(n);
  return t.substring(t.lastIndexOf("/") + 1);
}
function Ke(n) {
  return n.map(U);
}
function Xe(n) {
  return n.map(ue);
}
function pt(n, t = null) {
  if (typeof n != "object" || !("@id" in n))
    throw Error("Invalid item.");
  if (t !== null) {
    if (typeof t == "string" && t !== n["@type"])
      throw Error(`Expected item of type "${t}", got "${n["@type"]}".`);
    if (Array.isArray(t) && t.includes(n["@type"]) === !1)
      throw Error(`Expected item of any "${t.join("|")}", got "${n["@type"]}".`);
  }
}
function rt(n, t) {
  return U(n) === U(t);
}
function ce(n, t) {
  if (n = b(n), n = Array.from(n).map(b), t = b(t), Array.isArray(t)) {
    const e = t;
    for (const r of e)
      if (ce(n, r))
        return !0;
    return !1;
  }
  for (const e of n)
    if (rt(e, t))
      return !0;
  return !1;
}
function tr(n, t) {
  const e = n.findIndex((r) => rt(r, t));
  return e >= 0 && n.splice(e, 1), n;
}
function ct(n, t) {
  const e = n.find((r) => rt(r, t));
  return typeof e > "u" ? null : e;
}
function er(n, t) {
  return n.findIndex((e) => rt(e, t));
}
function rr(n, t) {
  return n.filter((e) => e["@type"] === t);
}
function nr(n) {
  Object.assign(n, n.map((t) => U(t)));
}
function sr(n, t) {
  return n = b(n), pt(n), Object.assign({ "@id": n["@id"], "@type": n["@type"] }, t);
}
class Yt extends Error {
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
class he {
  constructor() {
    d(this, "id");
    d(this, "propertyPath");
    d(this, "message");
    d(this, "code");
    this.id = Qt();
  }
}
class zt extends Yt {
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
    this._violations = e.map((r) => Object.assign(new he(), r));
  }
  getPropertyPaths() {
    return [...new Set(this.violations.map(({ propertyPath: e }) => e))];
  }
  getViolations(e) {
    const r = Array.from(arguments);
    return r.length === 0 ? this.violations : V(r[0]) ? this.violations.filter((s) => V(s.propertyPath)) : this.violations.filter((s) => e === s.propertyPath);
  }
}
class le {
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
function fe(n) {
  if (typeof n != "object" || n == null)
    throw Error("Invalid object.");
  return Object.keys(n).forEach((t) => delete n[t]), n;
}
function Tt(n) {
  return ot(n) ? U(n) : n;
}
function de(n) {
  const t = K(n), e = Object.keys(t);
  for (const r of e) {
    const s = t[r];
    Array.isArray(s) ? t[r] = s.map((i) => Tt(i)) : typeof s == "object" && s != null && (t[r] = Tt(s));
  }
  return t;
}
function Ot(n, t) {
  return n = fe(n), Object.assign(n, t);
}
function ir(n) {
  const t = At(), e = W(b(n)), r = G(K(b(n))), s = lt(() => !ot(b(r))), i = W(!1), a = lt(() => JSON.stringify(b(r)) !== JSON.stringify(b(e)));
  return { item: r, isUnsavedDraft: a, isCreationMode: s, isSubmitting: i, reset: ($) => Ot(r, K(b($ ?? n))), submit: async ($) => {
    st($) && ($ = b($));
    try {
      i.value = !0;
      const E = await t.upsertItem(de($ ?? r));
      return e.value = E, Ot(r, K(E)), E;
    } finally {
      i.value = !1;
    }
  } };
}
function or() {
  const n = W([]), t = (i) => {
    i = b(i), i.querySelectorAll("[name]").forEach(function(a) {
      a.setCustomValidity("");
    }), n.value = [];
  }, e = (i, a = !0) => {
    i = b(i);
    const c = i.checkValidity();
    return !c && a && i.reportValidity(), c;
  }, r = (i, a) => {
    t(i), Array.from(a).forEach((c) => s(i, c)), e(i);
  }, s = (i, { propertyPath: a, message: c }) => {
    i = b(i);
    const f = i.querySelector(`[name='${a}']`);
    f == null || f.setCustomValidity(c), f || n.value.push({ propertyPath: a, message: c });
  };
  return { resetValidity: t, bindViolations: r, unmappedViolations: n, validate: e };
}
let dt;
const me = 1, ye = 2;
class ge {
  constructor(t, e) {
    d(this, "readyState", me);
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
    this.readyState = ye;
  }
  triggerEvent(t) {
    this.onmessage(t);
  }
  triggerError(t) {
    this.onerror(t);
  }
}
const pe = () => {
  var n, t, e;
  return typeof process < "u" && ((n = process == null ? void 0 : process.env) == null ? void 0 : n.NODE_ENV) === "test" || ((e = (t = import.meta) == null ? void 0 : t.env) == null ? void 0 : e.NODE_ENV) === "test";
};
pe() ? dt = ge : dt = window.EventSource;
const ve = dt, ar = (n, t) => {
  const e = new we(n, t);
  return Object.assign(e, {
    install(r) {
      r.provide("mercure", e);
    }
  });
}, be = () => Mt("mercure");
function $e(n, t) {
  return n.length === t.length && n.every((e) => t.includes(e));
}
class we {
  constructor(t, e = {}) {
    d(this, "hub");
    d(this, "options");
    d(this, "connection");
    d(this, "subscribedTopics");
    d(this, "endpoint");
    d(this, "emitter");
    d(this, "lastEventId");
    Object.assign(this, { hub: t, options: G(e) }), this.lastEventId = W(), this.subscribedTopics = W([]), this.endpoint = lt(() => {
      const r = new URL(this.hub), s = b(this.subscribedTopics);
      return s.includes("*") ? r.searchParams.append("topic", "*") : s.forEach((i) => r.searchParams.append("topic", i)), b(this.lastEventId) && r.searchParams.append("Last-Event-ID", b(this.lastEventId)), r.toString();
    }), this.emitter = Wt();
  }
  subscribe(t = ["*"], e = !0) {
    Array.isArray(t) || (t = [t]);
    const r = Array.from(b(this.subscribedTopics)), s = [.../* @__PURE__ */ new Set([...b(this.subscribedTopics), ...t])];
    this.subscribedTopics.value = s, e && !$e(r, s) && this.listen();
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
    if (b(this.subscribedTopics).length === 0) {
      this.stop();
      return;
    }
    this.connection || this.connect();
  }
  connect() {
    this.stop(), this.connection = new ve(b(this.endpoint), this.options), this.connection.onopen = () => this.emitter.emit("open", { endpoint: b(this.endpoint) }), this.connection.onmessage = (t) => (this.lastEventId.value = t.lastEventId, this.emitter.emit("message", t)), this.connection.onerror = (t) => {
      this.emitter.emit("error", t), typeof this.options.reconnectInterval == "number" && (this.stop(), setTimeout(() => this.connect(), this.options.reconnectInterval));
    };
  }
  stop() {
    var t;
    (t = this.connection) == null || t.close(), this.connection = void 0;
  }
}
const _t = (n, t) => Object.assign(t, n), Ut = () => {
};
function Se(n, t, e = ["*"], r = _t, s = Ut) {
  Array.isArray(t) || (t = [t]), Array.isArray(e) || (e = [e]);
  const i = (a) => {
    try {
      const c = JSON.parse(a.data);
      if (!ot(c))
        return;
      if (Object.keys(c).length === 1) {
        s(U(c));
        return;
      }
      for (const f of t)
        rt(U(c), f) && r(c, b(f));
    } catch (c) {
      console.debug(c);
    }
  };
  return n.addListener(i), n.subscribe(e), i;
}
const ze = (n, t, e) => {
  Array.isArray(t) || (t = [t]);
  const r = (s) => {
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
        if (typeof Bt(a).fromUri(U(i)) < "u") {
          e(i);
          break;
        }
    } catch (a) {
      console.error(a);
    }
  };
  return n.addListener(r), n.subscribe(t), r;
}, ur = (n, t = { removeListenersOnUnmount: !0 }) => {
  n = n ?? be();
  const e = [];
  return t.removeListenersOnUnmount && Vt(() => {
    for (const s of e)
      n.removeListener(s);
  }), {
    synchronize: (s, i = ["*"], a = _t, c = Ut) => {
      const f = Se(n, s, i, a, c);
      return e.push(f), f;
    },
    on(s, i) {
      const a = ze(n, s, i);
      return e.push(a), a;
    }
  };
}, Te = {
  "hydra:Collection": le,
  "hydra:Error": Yt,
  ConstraintViolation: zt,
  ConstraintViolationList: zt
};
class Dt {
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
const Oe = function(n) {
  throw n;
};
class cr {
  constructor(t, e = {}) {
    d(this, "api");
    d(this, "endpoints");
    d(this, "classmap");
    this.api = t;
    const { endpoints: r, classmap: s } = e;
    this.endpoints = new ae(r ?? {}), this.classmap = { ...Te, ...s }, this.errorHandler = e.errorHandler ?? Oe;
  }
  factory(t, e) {
    for (const r in this.classmap)
      if (r === (t["@type"] ?? t)) {
        const s = this.classmap[r];
        return t instanceof s ? t : (t = Object.assign(new s(), t), e && Object.assign(t, { statusCode: e }), G(t));
      }
    return t;
  }
  storeItem({ state: t }, e) {
    const r = U(e);
    return Object.keys(t.items).includes(r) ? Object.assign(t.items[r], e) : t.items[r] = W(e), t.items[r];
  }
  removeItem({ state: t }, e) {
    const r = U(e);
    delete t.items[r];
  }
  async clearItems({ state: t }) {
    t.items = G(new Dt());
  }
  async handle(t, { errorHandler: e = this.errorHandler } = {}) {
    var r, s, i, a;
    try {
      const { data: c } = await t();
      return this.factory(c);
    } catch (c) {
      typeof ((r = c.response) == null ? void 0 : r.data) == "object" && ((s = c.response) == null ? void 0 : s.data) != null && (c = this.factory(c.response.data, (i = c.response) == null ? void 0 : i.status)), c.statusCode = c.statusCode ?? ((a = c.response) == null ? void 0 : a.status), e(c);
    }
  }
  async fetchItem({ state: t }, e, r) {
    let s = new et(U(e));
    r != null && r.groups && (s = s.withQuery(`${new it(s.getQuery()).withParam("groups", r.groups)}`));
    let i = await this.handle(() => this.api.get(`${s}`, r), r);
    return i = this.factory(i), (r == null ? void 0 : r.store) ?? !0 ? this.storeItem({ state: t }, i) : i;
  }
  async getItem({ state: t }, e, r) {
    if (e === null)
      return null;
    const s = U(e), i = ct(t.items, s);
    return i ?? await this.fetchItem({ state: t }, s, r);
  }
  async fetchCollection({ state: t }, e, r) {
    let s = new et(`${e}`);
    r != null && r.groups && (s = s.withQuery(`${new it(s.getQuery()).withParam("groups", r.groups)}`));
    const i = await this.handle(() => this.api.get(`${s}`, r), r);
    i["hydra:member"] = i["hydra:member"].map((f) => this.factory(f));
    const a = this.factory(i);
    if (a["hydra:member"] = a["hydra:member"].map((f) => this.factory(f)), (r == null ? void 0 : r.store) ?? !1)
      for (const f of a["hydra:member"])
        this.storeItem({ state: t }, f);
    return a;
  }
  async createItem({ state: t }, e, r) {
    const s = this.endpoints.for(e);
    return e = await this.handle(() => this.api.post(s, e, r), r), (r == null ? void 0 : r.store) ?? !0 ? this.storeItem({ state: t }, e) : e;
  }
  async updateItem({ state: t }, e, r) {
    return pt(e), e = await this.handle(() => this.api.put(U(e), e, r), r), (r == null ? void 0 : r.store) ?? !0 ? this.storeItem({ state: t }, e) : e;
  }
  async upsertItem({ state: t }, e, r) {
    return ot(e) ? this.updateItem({ state: t }, e, r) : this.createItem({ state: t }, e, r);
  }
  async deleteItem({ state: t }, e, r) {
    const s = U(e);
    await this.handle(() => this.api.delete(s, r), r), e = ct(t.items, s), e !== null && this.removeItem({ state: t }, e);
  }
  async getRelation({ state: t }, e, r = {}) {
    if (e === null)
      return null;
    if (typeof e == "function") {
      const s = $t(() => this.getRelation({ state: t }, e(), r));
      return await wt(s).not.toBe(void 0), s;
    }
    if ((r.useExisting ?? !0) === !0) {
      const s = ct(t.items, e);
      if (s != null)
        return s;
    }
    if (typeof e == "object" && (r.force ?? !1) === !1) {
      const s = this.factory(e);
      return (r == null ? void 0 : r.store) ?? !1 ? this.storeItem({ state: t }, s) : s;
    }
    return await this.getItem({ state: t }, e, r);
  }
  async getRelations({ state: t }, e, r) {
    if (typeof e == "function") {
      const s = $t(() => this.getRelations({ state: t }, e(), r));
      return await wt(s).not.toBe(void 0), s;
    }
    return Promise.all(e.map((s) => this.getRelation({ state: t }, s, r)));
  }
  async install(t) {
    t.state.items = G(new Dt()), t.state.endpoints = ht(this.endpoints), t.state.classmap = ht(this.classmap), t.storeItem = (e) => this.storeItem(t, e), t.removeItem = (e) => this.removeItem(t, e), t.clearItems = () => this.clearItems(t), t.getItem = (e, r) => this.getItem(t, e, r), t.fetchItem = (e, r) => this.fetchItem(t, e, r), t.fetchCollection = (e, r) => this.fetchCollection(t, e, r), t.createItem = (e, r) => this.createItem(t, e, r), t.updateItem = (e, r) => this.updateItem(t, e, r), t.upsertItem = (e, r) => this.upsertItem(t, e, r), t.deleteItem = (e, r) => this.deleteItem(t, e, r), t.getRelation = (e, r) => this.getRelation(t, e, r), t.getRelations = (e, r) => this.getRelations(t, e, r), t.endpoint = (e) => t.state.endpoints[e], t.getItemsByType = (e) => t.state.items.filter((r) => e === r["@type"]), t.factory = (e, r) => (r = r ?? e, typeof e == "string" && (r["@type"] = e), this.factory(r));
  }
}
function Rt(n) {
  if (typeof n == "string")
    return n;
  try {
    return U(n);
  } catch {
    return null;
  }
}
function De(n) {
  return n.map((t) => Rt(t));
}
async function Ht(n, t) {
  try {
    return await t.getItem(n);
  } catch {
    return null;
  }
}
async function Me(n, t) {
  return Promise.all(n.map((e) => Ht(e, t)));
}
class hr extends F {
  constructor(e, { store: r, multiple: s = !1 }) {
    super();
    d(this, "items", []);
    d(this, "multiple");
    d(this, "store");
    this.items = Array.isArray(e) ? e : [e], this.store = r, this.multiple = s;
  }
  get item() {
    return this.items[0] ?? null;
  }
  set item(e) {
    this.items = [e], this.multiple = !1;
  }
  normalize() {
    return this.multiple || this.items.length > 1 ? De(this.items) : Rt(this.item);
  }
  async denormalize(e) {
    if (Array.isArray(e)) {
      this.items = await Me(e, this.store);
      return;
    }
    this.items = [await Ht(e, this.store)];
  }
}
const Ie = {
  asc: "desc",
  desc: "asc"
};
class lr extends F {
  constructor(e = {}) {
    super();
    d(this, "order");
    this.order = e;
  }
  revert() {
    const e = {};
    for (const r in this.order) {
      const s = this.order[r];
      e[r] = Ie[s] ?? s;
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
class fr extends F {
  constructor(t, e, r = !0, s = !0) {
    super(), this.left = t, this.right = e, this.includeLeft = r, this.includeRight = s;
  }
  normalize() {
    const t = {};
    return this.left != null && (t[this.includeLeft ? "gte" : "gt"] = `${this.left}`), this.right != null && (t[this.includeRight ? "lte" : "lt"] = `${this.right}`), Object.keys(t).length > 0 ? t : void 0;
  }
  async denormalize(t) {
    t == null || typeof t != "object" || (Object.keys(t).includes("gt") && (this.left = parseFloat(t.gt), this.includeLeft = !1), Object.keys(t).includes("gte") && (this.left = parseFloat(t.gte), this.includeLeft = !0), Object.keys(t).includes("lt") && (this.right = parseFloat(t.lt), this.includeRight = !1), Object.keys(t).includes("lte") && (this.right = parseFloat(t.lte), this.includeRight = !0));
  }
}
class dr extends F {
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
class mr extends F {
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
function yr({ itemsPerPage: n, currentPage: t, totalItems: e }) {
  return e == null ? new Pe({ itemsPerPage: n, currentPage: t }) : new Ee({ itemsPerPage: n, currentPage: t, totalItems: e });
}
function xe(n) {
  return Array.from({ length: n }, (t, e) => e + 1);
}
class vt {
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
    return this._pages === void 0 && (this._pages = xe(this.lastPage)), this._pages;
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
    return new je(this, t, e);
  }
}
class Ee extends vt {
  constructor({ itemsPerPage: t, currentPage: e, totalItems: r }) {
    super({ itemsPerPage: t, currentPage: e }), this.totalItems = parseInt(r), this.lastPage = Math.max(1, Math.ceil(this.totalItems / Math.max(1, this.itemsPerPage))), this.nextPage = Math.min(this.lastPage, this.currentPage + 1);
  }
}
class Pe extends vt {
  constructor({ itemsPerPage: t, currentPage: e, totalItems: r }) {
    super({ itemsPerPage: t, currentPage: e, totalItems: r }), this.nextPage = this.lastPage = this.currentPage + 1;
  }
}
class je extends vt {
  constructor(t, e, r = !1) {
    super(t), Object.assign(this, t);
    const s = [];
    r && s.push(1);
    for (let i = 1; i <= this.lastPage; i++)
      i === this.currentPage && s.push(i), i < this.currentPage && i >= this.currentPage - e && s.push(i), i > this.currentPage && i <= this.currentPage + e && s.push(i);
    r && s.push(this.lastPage), this._pages = [...new Set(s)];
  }
}
class Ce {
  constructor() {
    d(this, "fields");
    d(this, "preload");
  }
  get headers() {
    var e, r;
    const t = {};
    return (((e = this.preload) == null ? void 0 : e.length) ?? 0) !== 0 && (t.preload = [...new Set(this.preload)].map((s) => `"${s}"`).join(", ")), (((r = this.fields) == null ? void 0 : r.length) ?? 0) !== 0 && (t.fields = [.../* @__PURE__ */ new Set([...this.fields, ...this.preload ?? []])].map((s) => `"${s}"`).join(", ")), t;
  }
}
function gr({ fields: n, preload: t } = {}) {
  return Object.assign(new Ce(), { fields: n }, { preload: t }).headers;
}
export {
  Kt as AbortError,
  qe as ApiClient,
  Je as ArrayFilter,
  zt as ConstraintViolationList,
  se as DateRangeFilter,
  ie as DatetimeRangeFilter,
  ge as FakeEventSource,
  Qe as FilterCollection,
  Gt as HttpError,
  le as HydraCollection,
  gt as HydraEndpoint,
  ae as HydraEndpoints,
  Yt as HydraError,
  cr as HydraPlugin,
  hr as ItemFilter,
  we as Mercure,
  lr as OrderFilter,
  fr as RangeFilter,
  dr as TextFilter,
  mr as TruthyFilter,
  he as Violation,
  rt as areSameIris,
  pt as checkValidItem,
  K as clone,
  ce as containsIri,
  ar as createMercure,
  yr as createPager,
  Be as createStore,
  ue as getId,
  Xe as getIds,
  U as getIri,
  Ke as getIris,
  ct as getItemByIri,
  er as getItemIndexByIri,
  rr as getItemsByType,
  ot as hasIri,
  Se as mercureSync,
  nr as normalizeIris,
  de as normalizeItemRelations,
  ze as on,
  sr as partialItem,
  Ge as useEndpoint,
  We as useFilters,
  or as useFormValidation,
  ir as useItemForm,
  be as useMercure,
  ur as useMercureSync,
  At as useStore,
  gr as vulcain,
  Ze as withoutDuplicates,
  tr as withoutIri
};
