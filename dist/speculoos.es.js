var Ht = Object.defineProperty;
var Lt = (n, t, e) => t in n ? Ht(n, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : n[t] = e;
var m = (n, t, e) => (Lt(n, typeof t != "symbol" ? t + "" : t, e), e);
import { whenever as Nt, asyncComputed as wt, until as St } from "@vueuse/core";
import { unref as v, isRef as ot, ref as G, reactive as tt, readonly as ft, inject as xt, computed as dt, onUnmounted as Vt } from "vue";
import zt from "clone-deep";
import Ft from "md5";
import Z from "is-empty";
import { useRoute as qt, useRouter as Zt, onBeforeRouteUpdate as Jt } from "vue-router";
import { URI as st, QueryString as ut } from "psr7-js";
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
const lt = (n) => {
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
class Ze {
  constructor({ baseUri: t = "", options: e = {}, fetcher: r } = {}) {
    m(this, "baseUri");
    m(this, "options");
    m(this, "fetch");
    var s;
    this.baseUri = t, this.options = e, r = r ?? ((s = window.fetch) == null ? void 0 : s.bind(window)), this.fetch = async (i, o) => r(i, o).then(It);
  }
  resolve(t) {
    return new URL(t, this.baseUri).toString();
  }
  mergeOptions(t) {
    let e = { ...this.options };
    Object.keys(e).includes("headers") && (e.headers = lt(e.headers));
    for (let r of arguments) {
      let s = { ...r };
      Object.keys(s).includes("headers") && (s.headers = { ...lt(s.headers) }), e = { ...zt(e), ...zt(s) };
    }
    return e;
  }
  async request(t, e, r) {
    e = `${v(e)}`, r = this.mergeOptions({ method: t }, r), Object.keys(r).includes("headers") && (r.headers = new Headers({ ...Xt, ...lt(r.headers) }));
    try {
      if (ot(r == null ? void 0 : r.isLoading) && (r.isLoading.value = !0), ot(r == null ? void 0 : r.aborted)) {
        const s = new AbortController(), { signal: i } = s;
        r.signal = i, Nt(r.aborted, () => s.abort(), { immediate: !0 });
      }
      try {
        const s = await this.fetch(e, r);
        return Gt.guard(s);
      } catch (s) {
        throw s.name === "AbortError" ? new Kt(s.reason) : s;
      }
    } finally {
      ot(r == null ? void 0 : r.isLoading) && (r.isLoading.value = !1);
    }
  }
  async get(t, e = {}) {
    return await this.request("GET", this.resolve(t), this.mergeOptions(e));
  }
  async post(t, e, r = {}) {
    return await this.request("POST", this.resolve(t), this.mergeOptions(
      {
        body: JSON.stringify(v(e)),
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
        body: JSON.stringify(v(e)),
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
    m(this, "fetch");
    m(this, "pendingRequests", []);
    return this.fetch = t, (r, s) => {
      try {
        const i = Ft(JSON.stringify({ url: r, ...s })), o = this.pendingRequests.findIndex((f) => i === f.hash);
        if (o >= 0)
          return this.pendingRequests[o].promise;
        const l = this.fetch(r, s).then(It);
        return this.pendingRequests.push({ hash: i, promise: l }), l.then(
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
function Je(n = void 0) {
  return new te(n);
}
const et = (n, t = !0, e = []) => {
  if (typeof n != "object" || n == null)
    return n;
  const r = e.find((i) => i.orig === n);
  if (r != null)
    return r.cloned;
  let s = Object.assign(Object.create(Object.getPrototypeOf(n)), n);
  if (Array.isArray(n) && (s = Object.values(s)), e.push({ orig: n, cloned: s }), t)
    for (const i in s)
      typeof s[i] == "object" && s[i] != null && (s[i] = et(s[i], t, e));
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
class Qe extends J {
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
var gt = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function pt(n) {
  return n && n.__esModule && Object.prototype.hasOwnProperty.call(n, "default") ? n.default : n;
}
var Mt = { exports: {} };
(function(n, t) {
  (function(e, r) {
    n.exports = r();
  })(gt, function() {
    var e = 1e3, r = 6e4, s = 36e5, i = "millisecond", o = "second", l = "minute", f = "hour", w = "day", M = "week", Y = "month", z = "quarter", O = "year", $ = "date", h = "Invalid Date", S = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/, C = /\[([^\]]+)]|YYYY|YY|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g, j = { name: "en", weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"), months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"), ordinal: function(y) {
      var c = ["th", "st", "nd", "rd"], a = y % 100;
      return "[" + y + (c[(a - 20) % 10] || c[a] || c[0]) + "]";
    } }, D = function(y, c, a) {
      var d = String(y);
      return !d || d.length >= c ? y : "" + Array(c + 1 - d.length).join(a) + y;
    }, H = { s: D, z: function(y) {
      var c = -y.utcOffset(), a = Math.abs(c), d = Math.floor(a / 60), u = a % 60;
      return (c <= 0 ? "+" : "-") + D(d, 2, "0") + ":" + D(u, 2, "0");
    }, m: function y(c, a) {
      if (c.date() < a.date())
        return -y(a, c);
      var d = 12 * (a.year() - c.year()) + (a.month() - c.month()), u = c.clone().add(d, Y), g = a - u < 0, p = c.clone().add(d + (g ? -1 : 1), Y);
      return +(-(d + (a - u) / (g ? u - p : p - u)) || 0);
    }, a: function(y) {
      return y < 0 ? Math.ceil(y) || 0 : Math.floor(y);
    }, p: function(y) {
      return { M: Y, y: O, w: M, d: w, D: $, h: f, m: l, s: o, ms: i, Q: z }[y] || String(y || "").toLowerCase().replace(/s$/, "");
    }, u: function(y) {
      return y === void 0;
    } }, E = "en", R = {};
    R[E] = j;
    var V = "$isDayjsObject", F = function(y) {
      return y instanceof q || !(!y || !y[V]);
    }, L = function y(c, a, d) {
      var u;
      if (!c)
        return E;
      if (typeof c == "string") {
        var g = c.toLowerCase();
        R[g] && (u = g), a && (R[g] = a, u = g);
        var p = c.split("-");
        if (!u && p.length > 1)
          return y(p[0]);
      } else {
        var T = c.name;
        R[T] = c, u = T;
      }
      return !d && u && (E = u), u || !d && E;
    }, x = function(y, c) {
      if (F(y))
        return y.clone();
      var a = typeof c == "object" ? c : {};
      return a.date = y, a.args = arguments, new q(a);
    }, b = H;
    b.l = L, b.i = F, b.w = function(y, c) {
      return x(y, { locale: c.$L, utc: c.$u, x: c.$x, $offset: c.$offset });
    };
    var q = function() {
      function y(a) {
        this.$L = L(a.locale, null, !0), this.parse(a), this.$x = this.$x || a.x || {}, this[V] = !0;
      }
      var c = y.prototype;
      return c.parse = function(a) {
        this.$d = function(d) {
          var u = d.date, g = d.utc;
          if (u === null)
            return /* @__PURE__ */ new Date(NaN);
          if (b.u(u))
            return /* @__PURE__ */ new Date();
          if (u instanceof Date)
            return new Date(u);
          if (typeof u == "string" && !/Z$/i.test(u)) {
            var p = u.match(S);
            if (p) {
              var T = p[2] - 1 || 0, I = (p[7] || "0").substring(0, 3);
              return g ? new Date(Date.UTC(p[1], T, p[3] || 1, p[4] || 0, p[5] || 0, p[6] || 0, I)) : new Date(p[1], T, p[3] || 1, p[4] || 0, p[5] || 0, p[6] || 0, I);
            }
          }
          return new Date(u);
        }(a), this.init();
      }, c.init = function() {
        var a = this.$d;
        this.$y = a.getFullYear(), this.$M = a.getMonth(), this.$D = a.getDate(), this.$W = a.getDay(), this.$H = a.getHours(), this.$m = a.getMinutes(), this.$s = a.getSeconds(), this.$ms = a.getMilliseconds();
      }, c.$utils = function() {
        return b;
      }, c.isValid = function() {
        return this.$d.toString() !== h;
      }, c.isSame = function(a, d) {
        var u = x(a);
        return this.startOf(d) <= u && u <= this.endOf(d);
      }, c.isAfter = function(a, d) {
        return x(a) < this.startOf(d);
      }, c.isBefore = function(a, d) {
        return this.endOf(d) < x(a);
      }, c.$g = function(a, d, u) {
        return b.u(a) ? this[d] : this.set(u, a);
      }, c.unix = function() {
        return Math.floor(this.valueOf() / 1e3);
      }, c.valueOf = function() {
        return this.$d.getTime();
      }, c.startOf = function(a, d) {
        var u = this, g = !!b.u(d) || d, p = b.p(a), T = function(B, k) {
          var Q = b.w(u.$u ? Date.UTC(u.$y, k, B) : new Date(u.$y, k, B), u);
          return g ? Q : Q.endOf(w);
        }, I = function(B, k) {
          return b.w(u.toDate()[B].apply(u.toDate("s"), (g ? [0, 0, 0, 0] : [23, 59, 59, 999]).slice(k)), u);
        }, P = this.$W, A = this.$M, N = this.$D, X = "set" + (this.$u ? "UTC" : "");
        switch (p) {
          case O:
            return g ? T(1, 0) : T(31, 11);
          case Y:
            return g ? T(1, A) : T(0, A + 1);
          case M:
            var W = this.$locale().weekStart || 0, rt = (P < W ? P + 7 : P) - W;
            return T(g ? N - rt : N + (6 - rt), A);
          case w:
          case $:
            return I(X + "Hours", 0);
          case f:
            return I(X + "Minutes", 1);
          case l:
            return I(X + "Seconds", 2);
          case o:
            return I(X + "Milliseconds", 3);
          default:
            return this.clone();
        }
      }, c.endOf = function(a) {
        return this.startOf(a, !1);
      }, c.$set = function(a, d) {
        var u, g = b.p(a), p = "set" + (this.$u ? "UTC" : ""), T = (u = {}, u[w] = p + "Date", u[$] = p + "Date", u[Y] = p + "Month", u[O] = p + "FullYear", u[f] = p + "Hours", u[l] = p + "Minutes", u[o] = p + "Seconds", u[i] = p + "Milliseconds", u)[g], I = g === w ? this.$D + (d - this.$W) : d;
        if (g === Y || g === O) {
          var P = this.clone().set($, 1);
          P.$d[T](I), P.init(), this.$d = P.set($, Math.min(this.$D, P.daysInMonth())).$d;
        } else
          T && this.$d[T](I);
        return this.init(), this;
      }, c.set = function(a, d) {
        return this.clone().$set(a, d);
      }, c.get = function(a) {
        return this[b.p(a)]();
      }, c.add = function(a, d) {
        var u, g = this;
        a = Number(a);
        var p = b.p(d), T = function(A) {
          var N = x(g);
          return b.w(N.date(N.date() + Math.round(A * a)), g);
        };
        if (p === Y)
          return this.set(Y, this.$M + a);
        if (p === O)
          return this.set(O, this.$y + a);
        if (p === w)
          return T(1);
        if (p === M)
          return T(7);
        var I = (u = {}, u[l] = r, u[f] = s, u[o] = e, u)[p] || 1, P = this.$d.getTime() + a * I;
        return b.w(P, this);
      }, c.subtract = function(a, d) {
        return this.add(-1 * a, d);
      }, c.format = function(a) {
        var d = this, u = this.$locale();
        if (!this.isValid())
          return u.invalidDate || h;
        var g = a || "YYYY-MM-DDTHH:mm:ssZ", p = b.z(this), T = this.$H, I = this.$m, P = this.$M, A = u.weekdays, N = u.months, X = u.meridiem, W = function(k, Q, nt, at) {
          return k && (k[Q] || k(d, g)) || nt[Q].slice(0, at);
        }, rt = function(k) {
          return b.s(T % 12 || 12, k, "0");
        }, B = X || function(k, Q, nt) {
          var at = k < 12 ? "AM" : "PM";
          return nt ? at.toLowerCase() : at;
        };
        return g.replace(C, function(k, Q) {
          return Q || function(nt) {
            switch (nt) {
              case "YY":
                return String(d.$y).slice(-2);
              case "YYYY":
                return b.s(d.$y, 4, "0");
              case "M":
                return P + 1;
              case "MM":
                return b.s(P + 1, 2, "0");
              case "MMM":
                return W(u.monthsShort, P, N, 3);
              case "MMMM":
                return W(N, P);
              case "D":
                return d.$D;
              case "DD":
                return b.s(d.$D, 2, "0");
              case "d":
                return String(d.$W);
              case "dd":
                return W(u.weekdaysMin, d.$W, A, 2);
              case "ddd":
                return W(u.weekdaysShort, d.$W, A, 3);
              case "dddd":
                return A[d.$W];
              case "H":
                return String(T);
              case "HH":
                return b.s(T, 2, "0");
              case "h":
                return rt(1);
              case "hh":
                return rt(2);
              case "a":
                return B(T, I, !0);
              case "A":
                return B(T, I, !1);
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
      }, c.utcOffset = function() {
        return 15 * -Math.round(this.$d.getTimezoneOffset() / 15);
      }, c.diff = function(a, d, u) {
        var g, p = this, T = b.p(d), I = x(a), P = (I.utcOffset() - this.utcOffset()) * r, A = this - I, N = function() {
          return b.m(p, I);
        };
        switch (T) {
          case O:
            g = N() / 12;
            break;
          case Y:
            g = N();
            break;
          case z:
            g = N() / 3;
            break;
          case M:
            g = (A - P) / 6048e5;
            break;
          case w:
            g = (A - P) / 864e5;
            break;
          case f:
            g = A / s;
            break;
          case l:
            g = A / r;
            break;
          case o:
            g = A / e;
            break;
          default:
            g = A;
        }
        return u ? g : b.a(g);
      }, c.daysInMonth = function() {
        return this.endOf(Y).$D;
      }, c.$locale = function() {
        return R[this.$L];
      }, c.locale = function(a, d) {
        if (!a)
          return this.$L;
        var u = this.clone(), g = L(a, d, !0);
        return g && (u.$L = g), u;
      }, c.clone = function() {
        return b.w(this.$d, this);
      }, c.toDate = function() {
        return new Date(this.valueOf());
      }, c.toJSON = function() {
        return this.isValid() ? this.toISOString() : null;
      }, c.toISOString = function() {
        return this.$d.toISOString();
      }, c.toString = function() {
        return this.$d.toUTCString();
      }, y;
    }(), K = q.prototype;
    return x.prototype = K, [["$ms", i], ["$s", o], ["$m", l], ["$H", f], ["$W", w], ["$M", Y], ["$y", O], ["$D", $]].forEach(function(y) {
      K[y[1]] = function(c) {
        return this.$g(c, y[0], y[1]);
      };
    }), x.extend = function(y, c) {
      return y.$i || (y(c, q, x), y.$i = !0), x;
    }, x.locale = L, x.isDayjs = F, x.unix = function(y) {
      return x(1e3 * y);
    }, x.en = R[E], x.Ls = R, x.p = {}, x;
  });
})(Mt);
var ee = Mt.exports;
const _ = /* @__PURE__ */ pt(ee);
var jt = { exports: {} };
(function(n, t) {
  (function(e, r) {
    n.exports = r();
  })(gt, function() {
    var e = "minute", r = /[+-]\d\d(?::?\d\d)?/g, s = /([+-]|\d\d)/g;
    return function(i, o, l) {
      var f = o.prototype;
      l.utc = function(h) {
        var S = { date: h, utc: !0, args: arguments };
        return new o(S);
      }, f.utc = function(h) {
        var S = l(this.toDate(), { locale: this.$L, utc: !0 });
        return h ? S.add(this.utcOffset(), e) : S;
      }, f.local = function() {
        return l(this.toDate(), { locale: this.$L, utc: !1 });
      };
      var w = f.parse;
      f.parse = function(h) {
        h.utc && (this.$u = !0), this.$utils().u(h.$offset) || (this.$offset = h.$offset), w.call(this, h);
      };
      var M = f.init;
      f.init = function() {
        if (this.$u) {
          var h = this.$d;
          this.$y = h.getUTCFullYear(), this.$M = h.getUTCMonth(), this.$D = h.getUTCDate(), this.$W = h.getUTCDay(), this.$H = h.getUTCHours(), this.$m = h.getUTCMinutes(), this.$s = h.getUTCSeconds(), this.$ms = h.getUTCMilliseconds();
        } else
          M.call(this);
      };
      var Y = f.utcOffset;
      f.utcOffset = function(h, S) {
        var C = this.$utils().u;
        if (C(h))
          return this.$u ? 0 : C(this.$offset) ? Y.call(this) : this.$offset;
        if (typeof h == "string" && (h = function(E) {
          E === void 0 && (E = "");
          var R = E.match(r);
          if (!R)
            return null;
          var V = ("" + R[0]).match(s) || ["-", 0, 0], F = V[0], L = 60 * +V[1] + +V[2];
          return L === 0 ? 0 : F === "+" ? L : -L;
        }(h), h === null))
          return this;
        var j = Math.abs(h) <= 16 ? 60 * h : h;
        if (j === 0)
          return this.utc(S);
        var D = this.clone();
        if (S)
          return D.$offset = j, D.$u = !1, D;
        var H = this.$u ? this.toDate().getTimezoneOffset() : -1 * this.utcOffset();
        return (D = this.local().add(j + H, e)).$offset = j, D.$x.$localOffset = H, D;
      };
      var z = f.format;
      f.format = function(h) {
        var S = h || (this.$u ? "YYYY-MM-DDTHH:mm:ss[Z]" : "");
        return z.call(this, S);
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
      var O = f.toDate;
      f.toDate = function(h) {
        return h === "s" && this.$offset ? l(this.format("YYYY-MM-DD HH:mm:ss:SSS")).toDate() : O.call(this);
      };
      var $ = f.diff;
      f.diff = function(h, S, C) {
        if (h && this.$u === h.$u)
          return $.call(this, h, S, C);
        var j = this.local(), D = l(h).local();
        return $.call(j, D, S, C);
      };
    };
  });
})(jt);
var re = jt.exports;
const Et = /* @__PURE__ */ pt(re);
var Pt = { exports: {} };
(function(n, t) {
  (function(e, r) {
    n.exports = r();
  })(gt, function() {
    var e = { year: 0, month: 1, day: 2, hour: 3, minute: 4, second: 5 }, r = {};
    return function(s, i, o) {
      var l, f = function(z, O, $) {
        $ === void 0 && ($ = {});
        var h = new Date(z), S = function(C, j) {
          j === void 0 && (j = {});
          var D = j.timeZoneName || "short", H = C + "|" + D, E = r[H];
          return E || (E = new Intl.DateTimeFormat("en-US", { hour12: !1, timeZone: C, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: D }), r[H] = E), E;
        }(O, $);
        return S.formatToParts(h);
      }, w = function(z, O) {
        for (var $ = f(z, O), h = [], S = 0; S < $.length; S += 1) {
          var C = $[S], j = C.type, D = C.value, H = e[j];
          H >= 0 && (h[H] = parseInt(D, 10));
        }
        var E = h[3], R = E === 24 ? 0 : E, V = h[0] + "-" + h[1] + "-" + h[2] + " " + R + ":" + h[4] + ":" + h[5] + ":000", F = +z;
        return (o.utc(V).valueOf() - (F -= F % 1e3)) / 6e4;
      }, M = i.prototype;
      M.tz = function(z, O) {
        if (z === void 0 && (z = l), !this.isValid())
          return this;
        var $, h = this.utcOffset(), S = this.toDate(), C = S.toLocaleString("en-US", { timeZone: z }), j = w(+S, z);
        if (!Number(j))
          $ = this.utcOffset(0, O);
        else if ($ = o(C, { locale: this.$L }).$set("millisecond", this.$ms).utcOffset(j, !0), O) {
          var D = $.utcOffset();
          $ = $.add(h - D, "minute");
        }
        return $.$x.$timezone = z, $;
      }, M.offsetName = function(z) {
        var O = this.$x.$timezone || o.tz.guess(), $ = f(this.valueOf(), O, { timeZoneName: z }).find(function(h) {
          return h.type.toLowerCase() === "timezonename";
        });
        return $ && $.value;
      };
      var Y = M.startOf;
      M.startOf = function(z, O) {
        if (!this.$x || !this.$x.$timezone)
          return Y.call(this, z, O);
        var $ = o(this.format("YYYY-MM-DD HH:mm:ss:SSS"), { locale: this.$L });
        return Y.call($, z, O).tz(this.$x.$timezone, !0);
      }, o.tz = function(z, O, $) {
        var h = $ && O, S = $ || O || l, C = w(+o(), S);
        if (typeof z != "string")
          return o(z).tz(S);
        var j = o.utc(z, h).valueOf();
        if (Number.isNaN(j)) {
          var D = o(NaN);
          return D.$x.$timezone = S, D;
        }
        var H = function(F, L, x) {
          var b = F - 60 * L * 1e3, q = w(b, x);
          if (L === q)
            return [b, L];
          var K = w(b -= 60 * (q - L) * 1e3, x);
          return q === K ? [b, q] : [F - 60 * Math.min(q, K) * 1e3, Math.max(q, K)];
        }(j, C, S), E = H[0], R = H[1], V = o(E).utcOffset(R);
        return V.$x.$timezone = S, V;
      }, o.tz.guess = function() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      }, o.tz.setDefault = function(z) {
        l = z;
      };
    };
  });
})(Pt);
var ne = Pt.exports;
const Ct = /* @__PURE__ */ pt(ne);
_.extend(Et);
_.extend(Ct);
class se extends J {
  constructor({ after: e = null, before: r = null } = {}, { withTime: s = !0, useUserTimezone: i = !0 } = {}) {
    super();
    m(this, "after");
    m(this, "before");
    m(this, "normalizedFormat");
    m(this, "useUserTimezone");
    this.after = e, this.before = r, this.normalizedFormat = s ? "YYYY-MM-DD[T]HH:mm:ss[Z]" : "YYYY-MM-DD", this.useUserTimezone = i;
  }
  normalize() {
    this.constructor.ensureTimezoneIsSet();
    const e = this.useUserTimezone ? this.constructor.userTimezone : "UTC";
    let r = null, s = null;
    return Z(this.after) || (r = _.tz(this.after, e).hour(0).minute(0).second(0).tz("UTC").format(this.normalizedFormat)), Z(this.before) || (s = _.tz(this.before, e).hour(0).minute(0).second(0).add(1, "day").subtract(1, "second").tz("UTC").format(this.normalizedFormat)), { after: r, before: s };
  }
  async denormalize(e) {
    this.constructor.ensureTimezoneIsSet(), this.after = null, this.before = null, Z(e.after) || (this.after = this.useUserTimezone ? _.tz(e.after, "UTC").tz(this.constructor.userTimezone) : _.tz(e.after, "UTC"), this.after = this.after.hour(0).minute(0).second(0).format("YYYY-MM-DD")), Z(e.before) || (this.before = this.useUserTimezone ? _.tz(e.before, "UTC").tz(this.constructor.userTimezone) : _.tz(e.before, "UTC"), this.before = this.before.hour(0).minute(0).second(0).add(1, "day").subtract(1, "second").format("YYYY-MM-DD"));
  }
  static ensureTimezoneIsSet() {
    this.constructor.userTimezone = this.constructor.userTimezone ?? (_.tz.guess() || "UTC");
  }
}
m(se, "userTimezone");
_.extend(Et);
_.extend(Ct);
class ie extends J {
  constructor({ after: e = null, before: r = null } = {}) {
    super();
    m(this, "after");
    m(this, "before");
    this.after = e, this.before = r;
  }
  normalize() {
    this.constructor.ensureTimezoneIsSet();
    let e = null, r = null;
    return Z(this.after) || (e = _.tz(this.after, this.constructor.userTimezone).tz("UTC").format("YYYY-MM-DD[T]HH:mm:ss[Z]")), Z(this.before) || (r = _.tz(this.before, this.constructor.userTimezone).tz("UTC").format("YYYY-MM-DD[T]HH:mm:ss[Z]")), { after: e, before: r };
  }
  async denormalize(e) {
    this.constructor.ensureTimezoneIsSet(), this.after = null, this.before = null, Z(e.after) || (this.after = _.tz(e.after, "UTC").tz(this.constructor.userTimezone).format("YYYY-MM-DD[T]HH:mm:ss[Z]")), Z(e.before) || (this.before = _.tz(e.before, "UTC").tz(this.constructor.userTimezone).format("YYYY-MM-DD[T]HH:mm:ss[Z]"));
  }
  static ensureTimezoneIsSet() {
    this.constructor.userTimezone = this.constructor.userTimezone ?? (_.tz.guess() || "UTC");
  }
}
m(ie, "userTimezone");
function ae(n) {
  return n == null ? !0 : typeof n == "string" ? n.trim().length === 0 : typeof n == "function" || Array.isArray(n) ? n.length === 0 : n instanceof Object ? Object.keys(n).length === 0 : !1;
}
function mt(n) {
  if (!(n instanceof Object))
    return n;
  if (Array.isArray(n))
    return n.map(mt);
  const t = { ...n };
  return Object.keys(t).forEach((e) => {
    t[e] instanceof Object && (t[e] = mt(t[e])), ae(t[e]) && delete t[e];
  }), t;
}
class We {
  constructor(t = {}) {
    m(this, "_filters", []);
    if (!(t instanceof Object))
      throw Error("A FilterCollection expects an object.");
    Object.keys(t).forEach((e) => {
      if (!(t[e] instanceof J))
        throw Error(`Filter ${e} doesn't extend the Filter class.`);
      this[e] = t[e], this._filters.push(e);
    });
  }
  normalize() {
    const t = {};
    return this._filters.forEach((e) => {
      const r = this[e];
      t[e] = r.normalize();
    }), mt(t);
  }
  async denormalize(t) {
    const e = [];
    for (const r of this._filters) {
      const s = this[r];
      s instanceof J && typeof t[r] < "u" && e.push(s.denormalize(t[r]));
    }
    return e.length > 0 && await Promise.all(e), this;
  }
}
async function Be(n = {}, t = {
  preserveQuery: !1,
  targetRoute: void 0
}) {
  if (typeof n != "function")
    throw Error("initialState should be provided as a function.");
  const e = qt(), r = Zt(), s = G(n());
  async function i(w) {
    Object.assign(v(s), await v(s).denormalize(w.query));
  }
  function o() {
    s.value = et(n());
  }
  function l(w = {}) {
    const M = {};
    return t.preserveQuery === !0 && Object.assign(M, e.query), Object.assign(M, v(s).normalize(), w);
  }
  async function f(w = {}) {
    const M = v(t.targetRoute) ?? e;
    await r.push(Object.assign({ ...M }, { query: l(w) }));
  }
  return Jt((w) => i(w)), await i(e), {
    filters: s,
    buildQueryParams: l,
    submit: f,
    clear: o
  };
}
const Ge = async ({ state: n = {}, methods: t = {}, name: e = "store" } = {}) => {
  n = tt(n);
  const r = [], s = {
    name: e,
    state: n,
    ...Object.keys(t).reduce(function(i, o) {
      const l = t[o];
      return i[o] = function() {
        return l(n, ...arguments);
      }, i;
    }, {}),
    async use(i) {
      return r.push(i), await i.install(this), this;
    },
    async reconciliate(i = !1) {
      const o = r.filter(({ reconciliate: l }) => typeof l == "function");
      if (i === !1)
        return Promise.all(o.map((l) => l.reconciliate(this)));
      for (const l of o)
        await l.reconciliate(this);
    }
  };
  return s.install = (i) => i.provide(e, { ...s, state: ft(n) }), s;
}, Yt = (n = "store") => xt(n);
class oe {
  constructor(t) {
    Object.keys(t).forEach((e) => {
      this[e] = new vt(t[e]);
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
class vt {
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
    let e = new st(this.endpoint);
    return e = e.withPath(`${e.getPath()}/${t}`), e.toString();
  }
  withQuery(t) {
    const e = new st(this.endpoint), r = new ut(e).withParams(t);
    return new vt(e.withQuery(r.toString()).toString());
  }
  paginated(t, e = !1) {
    t = v(t), e = v(e);
    const r = {
      pagination: t === !1 ? 0 : 1,
      partial: e === !1 ? void 0 : 1,
      itemsPerPage: void 0
    };
    return t !== !1 && (r.itemsPerPage = t), this.withQuery(r);
  }
  synchronize(t = window.location.href) {
    return this.withQuery(new ut(new st(t)).getParams());
  }
}
const Ke = (n, t) => Yt(t).state.endpoints[n];
function ct(n) {
  return n = v(n), n == null ? !1 : Object.keys(n).includes("@id") && n["@id"] != null;
}
function U(n) {
  return n = v(n), n === null ? null : typeof n == "string" ? n : (bt(n), n["@id"]);
}
function ue(n) {
  const t = U(n);
  return t.substring(t.lastIndexOf("/") + 1);
}
function Xe(n) {
  return n.map(U);
}
function tr(n) {
  return n.map(ue);
}
function bt(n, t = null) {
  if (typeof n != "object" || !("@id" in n))
    throw Error("Invalid item.");
  if (t !== null) {
    if (typeof t == "string" && t !== n["@type"])
      throw Error(`Expected item of type "${t}", got "${n["@type"]}".`);
    if (Array.isArray(t) && t.includes(n["@type"]) === !1)
      throw Error(`Expected item of any "${t.join("|")}", got "${n["@type"]}".`);
  }
}
function it(n, t) {
  return U(n) === U(t);
}
function ce(n, t) {
  if (n = v(n), n = Array.from(n).map(v), t = v(t), Array.isArray(t)) {
    const e = t;
    for (const r of e)
      if (ce(n, r))
        return !0;
    return !1;
  }
  for (const e of n)
    if (it(e, t))
      return !0;
  return !1;
}
function er(n, t) {
  const e = n.findIndex((r) => it(r, t));
  return e >= 0 && n.splice(e, 1), n;
}
function ht(n, t) {
  const e = n.find((r) => it(r, t));
  return typeof e > "u" ? null : e;
}
function rr(n, t) {
  return n.findIndex((e) => it(e, t));
}
function nr(n, t) {
  return n.filter((e) => e["@type"] === t);
}
function sr(n) {
  Object.assign(n, n.map((t) => U(t)));
}
function ir(n, t) {
  return n = v(n), bt(n), Object.assign({ "@id": n["@id"], "@type": n["@type"] }, t);
}
class At extends Error {
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
class le {
  constructor() {
    m(this, "id");
    m(this, "propertyPath");
    m(this, "message");
    m(this, "code");
    this.id = Qt();
  }
}
class he extends At {
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
    this._violations = e.map((r) => Object.assign(new le(), r));
  }
  getPropertyPaths() {
    return [...new Set(this.violations.map(({ propertyPath: e }) => e))];
  }
  getViolations(e) {
    const r = Array.from(arguments);
    return r.length === 0 ? this.violations : Z(r[0]) ? this.violations.filter((s) => Z(s.propertyPath)) : this.violations.filter((s) => e === s.propertyPath);
  }
}
class fe {
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
function de(n) {
  if (typeof n != "object" || n == null)
    throw Error("Invalid object.");
  return Object.keys(n).forEach((t) => delete n[t]), n;
}
function Tt(n) {
  return ct(n) ? U(n) : n;
}
function me(n) {
  const t = et(n), e = Object.keys(t);
  for (const r of e) {
    const s = t[r];
    Array.isArray(s) ? t[r] = s.map((i) => Tt(i)) : typeof s == "object" && s != null && (t[r] = Tt(s));
  }
  return t;
}
function Ot(n, t) {
  return n = de(n), Object.assign(n, t);
}
function ar(n) {
  const t = Yt(), e = G(v(n)), r = tt(et(v(n))), s = dt(() => !ct(v(r))), i = G(!1), o = dt(() => JSON.stringify(v(r)) !== JSON.stringify(v(e)));
  return { item: r, isUnsavedDraft: o, isCreationMode: s, isSubmitting: i, reset: (w) => Ot(r, et(v(w ?? n))), submit: async (w) => {
    ot(w) && (w = v(w));
    try {
      i.value = !0;
      const M = await t.upsertItem(me(w ?? r));
      return e.value = M, Ot(r, et(M)), M;
    } finally {
      i.value = !1;
    }
  } };
}
function or() {
  const n = G([]), t = (i) => {
    i = v(i), i.querySelectorAll("[name]").forEach(function(o) {
      o.setCustomValidity("");
    }), n.value = [];
  }, e = (i, o = !0) => {
    i = v(i);
    const l = i.checkValidity();
    return !l && o && i.reportValidity(), l;
  }, r = (i, o) => {
    t(i), Array.from(o).forEach((l) => s(i, l)), e(i);
  }, s = (i, { propertyPath: o, message: l }) => {
    i = v(i);
    const f = i.querySelector(`[name='${o}']`);
    f == null || f.setCustomValidity(l), f || n.value.push({ propertyPath: o, message: l });
  };
  return { resetValidity: t, bindViolations: r, unmappedViolations: n, validate: e };
}
let yt;
const ye = 1, ge = 2;
class pe {
  constructor(t, e) {
    m(this, "readyState", ye);
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
    this.readyState = ge;
  }
  triggerEvent(t) {
    this.onmessage(t);
  }
  triggerError(t) {
    this.onerror(t);
  }
}
const ve = () => {
  var n, t, e;
  return typeof process < "u" && ((n = process == null ? void 0 : process.env) == null ? void 0 : n.NODE_ENV) === "test" || ((e = (t = import.meta) == null ? void 0 : t.env) == null ? void 0 : e.NODE_ENV) === "test";
};
ve() ? yt = pe : yt = window.EventSource;
const be = yt, ur = (n, t) => {
  const e = new Se(n, t);
  return Object.assign(e, {
    install(r) {
      r.provide("mercure", e);
    }
  });
}, $e = () => xt("mercure");
function we(n, t) {
  return n.length === t.length && n.every((e) => t.includes(e));
}
class Se {
  constructor(t, e = {}) {
    m(this, "hub");
    m(this, "options");
    m(this, "connection");
    m(this, "subscribedTopics");
    m(this, "endpoint");
    m(this, "emitter");
    m(this, "lastEventId");
    Object.assign(this, { hub: t, options: tt(e) }), this.lastEventId = G(), this.subscribedTopics = G([]), this.endpoint = dt(() => {
      const r = new URL(this.hub), s = v(this.subscribedTopics);
      return s.includes("*") ? r.searchParams.append("topic", "*") : s.forEach((i) => r.searchParams.append("topic", i)), v(this.lastEventId) && r.searchParams.append("Last-Event-ID", v(this.lastEventId)), r.toString();
    }), this.emitter = Wt();
  }
  subscribe(t = ["*"], e = !0) {
    Array.isArray(t) || (t = [t]);
    const r = Array.from(v(this.subscribedTopics)), s = [.../* @__PURE__ */ new Set([...v(this.subscribedTopics), ...t])];
    this.subscribedTopics.value = s, e && !we(r, s) && this.listen();
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
    this.stop(), this.connection = new be(v(this.endpoint), this.options), this.connection.onopen = () => this.emitter.emit("open", { endpoint: v(this.endpoint) }), this.connection.onmessage = (t) => (this.lastEventId.value = t.lastEventId, this.emitter.emit("message", t)), this.connection.onerror = (t) => {
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
function ze(n, t, e = ["*"], r = _t, s = Ut) {
  Array.isArray(t) || (t = [t]), Array.isArray(e) || (e = [e]);
  const i = (o) => {
    try {
      const l = JSON.parse(o.data);
      if (!ct(l))
        return;
      if (Object.keys(l).length === 1) {
        s(U(l));
        return;
      }
      for (const f of t)
        it(U(l), f) && r(l, v(f));
    } catch (l) {
      console.debug(l);
    }
  };
  return n.addListener(i), n.subscribe(e), i;
}
const Te = (n, t, e) => {
  Array.isArray(t) || (t = [t]);
  const r = (s) => {
    let i;
    try {
      i = JSON.parse(s.data);
    } catch (o) {
      console.debug(o);
      return;
    }
    if (typeof i != "object") {
      console.debug("Received an event which is not an object.");
      return;
    }
    try {
      for (const o of t)
        if (typeof Bt(o).fromUri(U(i)) < "u") {
          e(i);
          break;
        }
    } catch (o) {
      console.error(o);
    }
  };
  return n.addListener(r), n.subscribe(t), r;
}, cr = (n, t = { removeListenersOnUnmount: !0 }) => {
  n = n ?? $e();
  const e = [];
  return t.removeListenersOnUnmount && Vt(() => {
    for (const s of e)
      n.removeListener(s);
  }), {
    synchronize: (s, i = ["*"], o = _t, l = Ut) => {
      const f = ze(n, s, i, o, l);
      return e.push(f), f;
    },
    on(s, i) {
      const o = Te(n, s, i);
      return e.push(o), o;
    }
  };
}, Oe = {
  "hydra:Collection": fe,
  "hydra:Error": At,
  ConstraintViolationList: he
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
const De = function(n) {
  throw n;
};
class lr {
  constructor(t, e = {}) {
    m(this, "api");
    m(this, "endpoints");
    m(this, "classmap");
    this.api = t;
    const { endpoints: r, classmap: s } = e;
    this.endpoints = new oe(r ?? {}), this.classmap = { ...Oe, ...s }, this.errorHandler = e.errorHandler ?? De;
  }
  factory(t, e) {
    for (const r in this.classmap)
      if (r === (t["@type"] ?? t)) {
        const s = this.classmap[r];
        return t instanceof s ? t : (t = Object.assign(new s(), t), e && Object.assign(t, { statusCode: e }), tt(t));
      }
    return t;
  }
  storeItem({ state: t }, e) {
    const r = U(e);
    return Object.keys(t.items).includes(r) ? Object.assign(t.items[r], e) : t.items[r] = G(e), t.items[r];
  }
  removeItem({ state: t }, e) {
    const r = U(e);
    delete t.items[r];
  }
  async clearItems({ state: t }) {
    t.items = tt(new Dt());
  }
  async handle(t, { errorHandler: e = this.errorHandler } = {}) {
    var r, s, i, o;
    try {
      const { data: l } = await t();
      return this.factory(l);
    } catch (l) {
      typeof ((r = l.response) == null ? void 0 : r.data) == "object" && ((s = l.response) == null ? void 0 : s.data) != null && (l = this.factory(l.response.data, (i = l.response) == null ? void 0 : i.status)), l.statusCode = l.statusCode ?? ((o = l.response) == null ? void 0 : o.status), e(l);
    }
  }
  async fetchItem({ state: t }, e, r) {
    let s = new st(U(e));
    r != null && r.groups && (s = s.withQuery(`${new ut(s.getQuery()).withParam("groups", r.groups)}`));
    let i = await this.handle(() => this.api.get(`${s}`, r), r);
    return i = this.factory(i), (r == null ? void 0 : r.store) ?? !0 ? this.storeItem({ state: t }, i) : i;
  }
  async getItem({ state: t }, e, r) {
    if (e === null)
      return null;
    const s = U(e), i = ht(t.items, s);
    return i ?? await this.fetchItem({ state: t }, s, r);
  }
  async fetchCollection({ state: t }, e, r) {
    let s = new st(`${e}`);
    r != null && r.groups && (s = s.withQuery(`${new ut(s.getQuery()).withParam("groups", r.groups)}`));
    const i = await this.handle(() => this.api.get(`${s}`, r), r);
    i["hydra:member"] = i["hydra:member"].map((f) => this.factory(f));
    const o = this.factory(i);
    if (o["hydra:member"] = o["hydra:member"].map((f) => this.factory(f)), (r == null ? void 0 : r.store) ?? !1)
      for (const f of o["hydra:member"])
        this.storeItem({ state: t }, f);
    return o;
  }
  async createItem({ state: t }, e, r) {
    const s = this.endpoints.for(e);
    return e = await this.handle(() => this.api.post(s, e, r), r), (r == null ? void 0 : r.store) ?? !0 ? this.storeItem({ state: t }, e) : e;
  }
  async updateItem({ state: t }, e, r) {
    return bt(e), e = await this.handle(() => this.api.put(U(e), e, r), r), (r == null ? void 0 : r.store) ?? !0 ? this.storeItem({ state: t }, e) : e;
  }
  async upsertItem({ state: t }, e, r) {
    return ct(e) ? this.updateItem({ state: t }, e, r) : this.createItem({ state: t }, e, r);
  }
  async deleteItem({ state: t }, e, r) {
    const s = U(e);
    await this.handle(() => this.api.delete(s, r), r), e = ht(t.items, s), e !== null && this.removeItem({ state: t }, e);
  }
  async getRelation({ state: t }, e, r = {}) {
    if (e === null)
      return null;
    if (typeof e == "function") {
      const i = wt(() => this.getRelation({ state: t }, e(), r));
      return await St(i).not.toBe(void 0), i;
    }
    const s = (r.useExisting ?? !0) !== !1;
    if (s) {
      const i = ht(t.items, e);
      if (i != null)
        return i;
    }
    if (typeof e == "object" && (r.force ?? !1) === !1 && s) {
      const i = this.factory(e);
      return (r == null ? void 0 : r.store) ?? !1 ? this.storeItem({ state: t }, i) : i;
    }
    return await this.getItem({ state: t }, e, r);
  }
  async getRelations({ state: t }, e, r) {
    if (typeof e == "function") {
      const s = wt(() => this.getRelations({ state: t }, e(), r));
      return await St(s).not.toBe(void 0), s;
    }
    return Promise.all(e.map((s) => this.getRelation({ state: t }, s, r)));
  }
  async install(t) {
    t.state.items = tt(new Dt()), t.state.endpoints = ft(this.endpoints), t.state.classmap = ft(this.classmap), t.storeItem = (e) => this.storeItem(t, e), t.removeItem = (e) => this.removeItem(t, e), t.clearItems = () => this.clearItems(t), t.getItem = (e, r) => this.getItem(t, e, r), t.fetchItem = (e, r) => this.fetchItem(t, e, r), t.fetchCollection = (e, r) => this.fetchCollection(t, e, r), t.createItem = (e, r) => this.createItem(t, e, r), t.updateItem = (e, r) => this.updateItem(t, e, r), t.upsertItem = (e, r) => this.upsertItem(t, e, r), t.deleteItem = (e, r) => this.deleteItem(t, e, r), t.getRelation = (e, r) => this.getRelation(t, e, r), t.getRelations = (e, r) => this.getRelations(t, e, r), t.endpoint = (e) => t.state.endpoints[e], t.getItemsByType = (e) => t.state.items.filter((r) => e === r["@type"]), t.factory = (e, r) => (r = r ?? e, typeof e == "string" && (r["@type"] = e), this.factory(r));
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
function xe(n) {
  return n.map((t) => Rt(t));
}
async function kt(n, t) {
  try {
    return await t.getItem(n);
  } catch {
    return null;
  }
}
async function Ie(n, t) {
  return Promise.all(n.map((e) => kt(e, t)));
}
class hr extends J {
  constructor(e, { store: r, multiple: s = !1 }) {
    super();
    m(this, "items", []);
    m(this, "multiple");
    m(this, "store");
    this.items = Array.isArray(e) ? e : [e], this.store = r, this.multiple = s;
  }
  get item() {
    return this.items[0] ?? null;
  }
  set item(e) {
    this.items = [e], this.multiple = !1;
  }
  normalize() {
    return this.multiple || this.items.length > 1 ? xe(this.items) : Rt(this.item);
  }
  async denormalize(e) {
    if (Array.isArray(e)) {
      this.items = await Ie(e, this.store);
      return;
    }
    this.items = [await kt(e, this.store)];
  }
}
const Me = {
  asc: "desc",
  desc: "asc"
};
class fr extends J {
  constructor(e = {}) {
    super();
    m(this, "order");
    this.order = e;
  }
  revert() {
    const e = {};
    for (const r in this.order) {
      const s = this.order[r];
      e[r] = Me[s] ?? s;
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
class dr extends J {
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
class mr extends J {
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
class yr extends J {
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
function gr({ itemsPerPage: n, currentPage: t, totalItems: e }) {
  return e == null ? new Pe({ itemsPerPage: n, currentPage: t }) : new Ee({ itemsPerPage: n, currentPage: t, totalItems: e });
}
function je(n) {
  return Array.from({ length: n }, (t, e) => e + 1);
}
class $t {
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
    return this._pages === void 0 && (this._pages = je(this.lastPage)), this._pages;
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
    return new Ce(this, t, e);
  }
}
class Ee extends $t {
  constructor({ itemsPerPage: t, currentPage: e, totalItems: r }) {
    super({ itemsPerPage: t, currentPage: e }), this.totalItems = parseInt(r), this.lastPage = Math.max(1, Math.ceil(this.totalItems / Math.max(1, this.itemsPerPage))), this.nextPage = Math.min(this.lastPage, this.currentPage + 1);
  }
}
class Pe extends $t {
  constructor({ itemsPerPage: t, currentPage: e, totalItems: r }) {
    super({ itemsPerPage: t, currentPage: e, totalItems: r }), this.nextPage = this.lastPage = this.currentPage + 1;
  }
}
class Ce extends $t {
  constructor(t, e, r = !1) {
    super(t), Object.assign(this, t);
    const s = [];
    r && s.push(1);
    for (let i = 1; i <= this.lastPage; i++)
      i === this.currentPage && s.push(i), i < this.currentPage && i >= this.currentPage - e && s.push(i), i > this.currentPage && i <= this.currentPage + e && s.push(i);
    r && s.push(this.lastPage), this._pages = [...new Set(s)];
  }
}
class Ye {
  constructor() {
    m(this, "fields");
    m(this, "preload");
  }
  get headers() {
    var e, r;
    const t = {};
    return (((e = this.preload) == null ? void 0 : e.length) ?? 0) !== 0 && (t.preload = [...new Set(this.preload)].map((s) => `"${s}"`).join(", ")), (((r = this.fields) == null ? void 0 : r.length) ?? 0) !== 0 && (t.fields = [.../* @__PURE__ */ new Set([...this.fields, ...this.preload ?? []])].map((s) => `"${s}"`).join(", ")), t;
  }
}
function pr({ fields: n, preload: t } = {}) {
  return Object.assign(new Ye(), { fields: n }, { preload: t }).headers;
}
export {
  Kt as AbortError,
  Ze as ApiClient,
  Qe as ArrayFilter,
  he as ConstraintViolationList,
  se as DateRangeFilter,
  ie as DatetimeRangeFilter,
  pe as FakeEventSource,
  We as FilterCollection,
  Gt as HttpError,
  fe as HydraCollection,
  vt as HydraEndpoint,
  oe as HydraEndpoints,
  At as HydraError,
  lr as HydraPlugin,
  hr as ItemFilter,
  Se as Mercure,
  fr as OrderFilter,
  dr as RangeFilter,
  mr as TextFilter,
  yr as TruthyFilter,
  le as Violation,
  it as areSameIris,
  bt as checkValidItem,
  et as clone,
  ce as containsIri,
  ur as createMercure,
  gr as createPager,
  Ge as createStore,
  ue as getId,
  tr as getIds,
  U as getIri,
  Xe as getIris,
  ht as getItemByIri,
  rr as getItemIndexByIri,
  nr as getItemsByType,
  ct as hasIri,
  ze as mercureSync,
  sr as normalizeIris,
  me as normalizeItemRelations,
  Te as on,
  ir as partialItem,
  Ke as useEndpoint,
  Be as useFilters,
  or as useFormValidation,
  ar as useItemForm,
  $e as useMercure,
  cr as useMercureSync,
  Yt as useStore,
  pr as vulcain,
  Je as withoutDuplicates,
  er as withoutIri
};
