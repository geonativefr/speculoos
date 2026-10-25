var Nt = Object.defineProperty;
var Vt = (r, t, e) => t in r ? Nt(r, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : r[t] = e;
var m = (r, t, e) => (Vt(r, typeof t != "symbol" ? t + "" : t, e), e);
import { whenever as Ft, asyncComputed as zt, until as Ot } from "@vueuse/core";
import { unref as v, isRef as ot, ref as G, reactive as tt, readonly as ht, inject as Mt, computed as dt, onUnmounted as qt, toRaw as mt } from "vue";
import Tt from "clone-deep";
import Zt from "md5";
import Z from "is-empty";
import { useRoute as Jt, useRouter as Qt, onBeforeRouteUpdate as Wt } from "vue-router";
import { URI as st, QueryString as ut } from "psr7-js";
import { v4 as Bt } from "uuid";
import Gt from "mitt";
import Kt from "uri-templates";
class Xt extends Error {
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
    return this.statusCode > 500;
  }
  static guard(t) {
    if (t.status >= 400)
      throw new this(t);
    return t;
  }
}
class te extends Error {
  constructor(t) {
    super(), this.name = "AbortError", this.reason = t;
  }
}
const lt = (r) => {
  if (!(r instanceof Headers))
    return r;
  const t = {};
  for (let e of r.keys())
    t[e] = r.get(e);
  return t;
}, ee = {
  Accept: "application/ld+json, application/json"
}, It = async (r) => {
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
};
class Qe {
  constructor({ baseUri: t = "", options: e = {}, fetcher: n } = {}) {
    m(this, "baseUri");
    m(this, "options");
    m(this, "fetch");
    var s;
    this.baseUri = t, this.options = e, n = n ?? ((s = window.fetch) == null ? void 0 : s.bind(window)), this.fetch = async (i, a) => n(i, a).then(It);
  }
  resolve(t) {
    return new URL(t, this.baseUri).toString();
  }
  mergeOptions(t) {
    let e = { ...this.options };
    Object.keys(e).includes("headers") && (e.headers = lt(e.headers));
    for (let n of arguments) {
      let s = { ...n };
      Object.keys(s).includes("headers") && (s.headers = { ...lt(s.headers) }), e = { ...Tt(e), ...Tt(s) };
    }
    return e;
  }
  async request(t, e, n) {
    e = `${v(e)}`, n = this.mergeOptions({ method: t }, n), Object.keys(n).includes("headers") && (n.headers = new Headers({ ...ee, ...lt(n.headers) }));
    try {
      if (ot(n == null ? void 0 : n.isLoading) && (n.isLoading.value = !0), ot(n == null ? void 0 : n.aborted)) {
        const s = new AbortController(), { signal: i } = s;
        n.signal = i, Ft(n.aborted, () => s.abort(), { immediate: !0 });
      }
      try {
        const s = await this.fetch(e, n);
        return Xt.guard(s);
      } catch (s) {
        throw s.name === "AbortError" ? new te(s.reason) : s;
      }
    } finally {
      ot(n == null ? void 0 : n.isLoading) && (n.isLoading.value = !1);
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
class re {
  constructor(t = ((e) => (e = window.fetch) == null ? void 0 : e.bind(window))()) {
    m(this, "fetch");
    m(this, "pendingRequests", []);
    return this.fetch = t, (n, s) => {
      try {
        const i = Zt(JSON.stringify({ url: n, ...s })), a = this.pendingRequests.findIndex((h) => i === h.hash);
        if (a >= 0)
          return this.pendingRequests[a].promise;
        const c = this.fetch(n, s).then(It);
        return this.pendingRequests.push({ hash: i, promise: c }), c.then(
          (h) => (this.removePendingRequest(i), h),
          (h) => {
            throw this.removePendingRequest(i), h;
          }
        );
      } catch {
        return this.fetch(n, s);
      }
    };
  }
  removePendingRequest(t) {
    const e = this.pendingRequests.findIndex((n) => t === n.hash);
    e >= 0 && this.pendingRequests.splice(e, 1);
  }
}
function We(r = void 0) {
  return new re(r);
}
const et = (r, t = !0, e = []) => {
  if (typeof r != "object" || r == null)
    return r;
  const n = e.find((i) => i.orig === r);
  if (n != null)
    return n.cloned;
  let s = Object.assign(Object.create(Object.getPrototypeOf(r)), r);
  if (Array.isArray(r) && (s = Object.values(s)), e.push({ orig: r, cloned: s }), t)
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
class Be extends J {
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
var vt = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function bt(r) {
  return r && r.__esModule && Object.prototype.hasOwnProperty.call(r, "default") ? r.default : r;
}
var Pt = { exports: {} };
(function(r, t) {
  (function(e, n) {
    r.exports = n();
  })(vt, function() {
    var e = 1e3, n = 6e4, s = 36e5, i = "millisecond", a = "second", c = "minute", h = "hour", w = "day", M = "week", C = "month", z = "quarter", T = "year", $ = "date", f = "Invalid Date", S = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/, A = /\[([^\]]+)]|YYYY|YY|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g, I = { name: "en", weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"), months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"), ordinal: function(y) {
      var l = ["th", "st", "nd", "rd"], o = y % 100;
      return "[" + y + (l[(o - 20) % 10] || l[o] || l[0]) + "]";
    } }, D = function(y, l, o) {
      var d = String(y);
      return !d || d.length >= l ? y : "" + Array(l + 1 - d.length).join(o) + y;
    }, H = { s: D, z: function(y) {
      var l = -y.utcOffset(), o = Math.abs(l), d = Math.floor(o / 60), u = o % 60;
      return (l <= 0 ? "+" : "-") + D(d, 2, "0") + ":" + D(u, 2, "0");
    }, m: function y(l, o) {
      if (l.date() < o.date())
        return -y(o, l);
      var d = 12 * (o.year() - l.year()) + (o.month() - l.month()), u = l.clone().add(d, C), g = o - u < 0, p = l.clone().add(d + (g ? -1 : 1), C);
      return +(-(d + (o - u) / (g ? u - p : p - u)) || 0);
    }, a: function(y) {
      return y < 0 ? Math.ceil(y) || 0 : Math.floor(y);
    }, p: function(y) {
      return { M: C, y: T, w: M, d: w, D: $, h, m: c, s: a, ms: i, Q: z }[y] || String(y || "").toLowerCase().replace(/s$/, "");
    }, u: function(y) {
      return y === void 0;
    } }, P = "en", R = {};
    R[P] = I;
    var V = "$isDayjsObject", F = function(y) {
      return y instanceof q || !(!y || !y[V]);
    }, L = function y(l, o, d) {
      var u;
      if (!l)
        return P;
      if (typeof l == "string") {
        var g = l.toLowerCase();
        R[g] && (u = g), o && (R[g] = o, u = g);
        var p = l.split("-");
        if (!u && p.length > 1)
          return y(p[0]);
      } else {
        var O = l.name;
        R[O] = l, u = O;
      }
      return !d && u && (P = u), u || !d && P;
    }, j = function(y, l) {
      if (F(y))
        return y.clone();
      var o = typeof l == "object" ? l : {};
      return o.date = y, o.args = arguments, new q(o);
    }, b = H;
    b.l = L, b.i = F, b.w = function(y, l) {
      return j(y, { locale: l.$L, utc: l.$u, x: l.$x, $offset: l.$offset });
    };
    var q = function() {
      function y(o) {
        this.$L = L(o.locale, null, !0), this.parse(o), this.$x = this.$x || o.x || {}, this[V] = !0;
      }
      var l = y.prototype;
      return l.parse = function(o) {
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
              var O = p[2] - 1 || 0, x = (p[7] || "0").substring(0, 3);
              return g ? new Date(Date.UTC(p[1], O, p[3] || 1, p[4] || 0, p[5] || 0, p[6] || 0, x)) : new Date(p[1], O, p[3] || 1, p[4] || 0, p[5] || 0, p[6] || 0, x);
            }
          }
          return new Date(u);
        }(o), this.init();
      }, l.init = function() {
        var o = this.$d;
        this.$y = o.getFullYear(), this.$M = o.getMonth(), this.$D = o.getDate(), this.$W = o.getDay(), this.$H = o.getHours(), this.$m = o.getMinutes(), this.$s = o.getSeconds(), this.$ms = o.getMilliseconds();
      }, l.$utils = function() {
        return b;
      }, l.isValid = function() {
        return this.$d.toString() !== f;
      }, l.isSame = function(o, d) {
        var u = j(o);
        return this.startOf(d) <= u && u <= this.endOf(d);
      }, l.isAfter = function(o, d) {
        return j(o) < this.startOf(d);
      }, l.isBefore = function(o, d) {
        return this.endOf(d) < j(o);
      }, l.$g = function(o, d, u) {
        return b.u(o) ? this[d] : this.set(u, o);
      }, l.unix = function() {
        return Math.floor(this.valueOf() / 1e3);
      }, l.valueOf = function() {
        return this.$d.getTime();
      }, l.startOf = function(o, d) {
        var u = this, g = !!b.u(d) || d, p = b.p(o), O = function(B, k) {
          var Q = b.w(u.$u ? Date.UTC(u.$y, k, B) : new Date(u.$y, k, B), u);
          return g ? Q : Q.endOf(w);
        }, x = function(B, k) {
          return b.w(u.toDate()[B].apply(u.toDate("s"), (g ? [0, 0, 0, 0] : [23, 59, 59, 999]).slice(k)), u);
        }, E = this.$W, Y = this.$M, N = this.$D, X = "set" + (this.$u ? "UTC" : "");
        switch (p) {
          case T:
            return g ? O(1, 0) : O(31, 11);
          case C:
            return g ? O(1, Y) : O(0, Y + 1);
          case M:
            var W = this.$locale().weekStart || 0, rt = (E < W ? E + 7 : E) - W;
            return O(g ? N - rt : N + (6 - rt), Y);
          case w:
          case $:
            return x(X + "Hours", 0);
          case h:
            return x(X + "Minutes", 1);
          case c:
            return x(X + "Seconds", 2);
          case a:
            return x(X + "Milliseconds", 3);
          default:
            return this.clone();
        }
      }, l.endOf = function(o) {
        return this.startOf(o, !1);
      }, l.$set = function(o, d) {
        var u, g = b.p(o), p = "set" + (this.$u ? "UTC" : ""), O = (u = {}, u[w] = p + "Date", u[$] = p + "Date", u[C] = p + "Month", u[T] = p + "FullYear", u[h] = p + "Hours", u[c] = p + "Minutes", u[a] = p + "Seconds", u[i] = p + "Milliseconds", u)[g], x = g === w ? this.$D + (d - this.$W) : d;
        if (g === C || g === T) {
          var E = this.clone().set($, 1);
          E.$d[O](x), E.init(), this.$d = E.set($, Math.min(this.$D, E.daysInMonth())).$d;
        } else
          O && this.$d[O](x);
        return this.init(), this;
      }, l.set = function(o, d) {
        return this.clone().$set(o, d);
      }, l.get = function(o) {
        return this[b.p(o)]();
      }, l.add = function(o, d) {
        var u, g = this;
        o = Number(o);
        var p = b.p(d), O = function(Y) {
          var N = j(g);
          return b.w(N.date(N.date() + Math.round(Y * o)), g);
        };
        if (p === C)
          return this.set(C, this.$M + o);
        if (p === T)
          return this.set(T, this.$y + o);
        if (p === w)
          return O(1);
        if (p === M)
          return O(7);
        var x = (u = {}, u[c] = n, u[h] = s, u[a] = e, u)[p] || 1, E = this.$d.getTime() + o * x;
        return b.w(E, this);
      }, l.subtract = function(o, d) {
        return this.add(-1 * o, d);
      }, l.format = function(o) {
        var d = this, u = this.$locale();
        if (!this.isValid())
          return u.invalidDate || f;
        var g = o || "YYYY-MM-DDTHH:mm:ssZ", p = b.z(this), O = this.$H, x = this.$m, E = this.$M, Y = u.weekdays, N = u.months, X = u.meridiem, W = function(k, Q, nt, at) {
          return k && (k[Q] || k(d, g)) || nt[Q].slice(0, at);
        }, rt = function(k) {
          return b.s(O % 12 || 12, k, "0");
        }, B = X || function(k, Q, nt) {
          var at = k < 12 ? "AM" : "PM";
          return nt ? at.toLowerCase() : at;
        };
        return g.replace(A, function(k, Q) {
          return Q || function(nt) {
            switch (nt) {
              case "YY":
                return String(d.$y).slice(-2);
              case "YYYY":
                return b.s(d.$y, 4, "0");
              case "M":
                return E + 1;
              case "MM":
                return b.s(E + 1, 2, "0");
              case "MMM":
                return W(u.monthsShort, E, N, 3);
              case "MMMM":
                return W(N, E);
              case "D":
                return d.$D;
              case "DD":
                return b.s(d.$D, 2, "0");
              case "d":
                return String(d.$W);
              case "dd":
                return W(u.weekdaysMin, d.$W, Y, 2);
              case "ddd":
                return W(u.weekdaysShort, d.$W, Y, 3);
              case "dddd":
                return Y[d.$W];
              case "H":
                return String(O);
              case "HH":
                return b.s(O, 2, "0");
              case "h":
                return rt(1);
              case "hh":
                return rt(2);
              case "a":
                return B(O, x, !0);
              case "A":
                return B(O, x, !1);
              case "m":
                return String(x);
              case "mm":
                return b.s(x, 2, "0");
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
      }, l.utcOffset = function() {
        return 15 * -Math.round(this.$d.getTimezoneOffset() / 15);
      }, l.diff = function(o, d, u) {
        var g, p = this, O = b.p(d), x = j(o), E = (x.utcOffset() - this.utcOffset()) * n, Y = this - x, N = function() {
          return b.m(p, x);
        };
        switch (O) {
          case T:
            g = N() / 12;
            break;
          case C:
            g = N();
            break;
          case z:
            g = N() / 3;
            break;
          case M:
            g = (Y - E) / 6048e5;
            break;
          case w:
            g = (Y - E) / 864e5;
            break;
          case h:
            g = Y / s;
            break;
          case c:
            g = Y / n;
            break;
          case a:
            g = Y / e;
            break;
          default:
            g = Y;
        }
        return u ? g : b.a(g);
      }, l.daysInMonth = function() {
        return this.endOf(C).$D;
      }, l.$locale = function() {
        return R[this.$L];
      }, l.locale = function(o, d) {
        if (!o)
          return this.$L;
        var u = this.clone(), g = L(o, d, !0);
        return g && (u.$L = g), u;
      }, l.clone = function() {
        return b.w(this.$d, this);
      }, l.toDate = function() {
        return new Date(this.valueOf());
      }, l.toJSON = function() {
        return this.isValid() ? this.toISOString() : null;
      }, l.toISOString = function() {
        return this.$d.toISOString();
      }, l.toString = function() {
        return this.$d.toUTCString();
      }, y;
    }(), K = q.prototype;
    return j.prototype = K, [["$ms", i], ["$s", a], ["$m", c], ["$H", h], ["$W", w], ["$M", C], ["$y", T], ["$D", $]].forEach(function(y) {
      K[y[1]] = function(l) {
        return this.$g(l, y[0], y[1]);
      };
    }), j.extend = function(y, l) {
      return y.$i || (y(l, q, j), y.$i = !0), j;
    }, j.locale = L, j.isDayjs = F, j.unix = function(y) {
      return j(1e3 * y);
    }, j.en = R[P], j.Ls = R, j.p = {}, j;
  });
})(Pt);
var ne = Pt.exports;
const _ = /* @__PURE__ */ bt(ne);
var Et = { exports: {} };
(function(r, t) {
  (function(e, n) {
    r.exports = n();
  })(vt, function() {
    var e = "minute", n = /[+-]\d\d(?::?\d\d)?/g, s = /([+-]|\d\d)/g;
    return function(i, a, c) {
      var h = a.prototype;
      c.utc = function(f) {
        var S = { date: f, utc: !0, args: arguments };
        return new a(S);
      }, h.utc = function(f) {
        var S = c(this.toDate(), { locale: this.$L, utc: !0 });
        return f ? S.add(this.utcOffset(), e) : S;
      }, h.local = function() {
        return c(this.toDate(), { locale: this.$L, utc: !1 });
      };
      var w = h.parse;
      h.parse = function(f) {
        f.utc && (this.$u = !0), this.$utils().u(f.$offset) || (this.$offset = f.$offset), w.call(this, f);
      };
      var M = h.init;
      h.init = function() {
        if (this.$u) {
          var f = this.$d;
          this.$y = f.getUTCFullYear(), this.$M = f.getUTCMonth(), this.$D = f.getUTCDate(), this.$W = f.getUTCDay(), this.$H = f.getUTCHours(), this.$m = f.getUTCMinutes(), this.$s = f.getUTCSeconds(), this.$ms = f.getUTCMilliseconds();
        } else
          M.call(this);
      };
      var C = h.utcOffset;
      h.utcOffset = function(f, S) {
        var A = this.$utils().u;
        if (A(f))
          return this.$u ? 0 : A(this.$offset) ? C.call(this) : this.$offset;
        if (typeof f == "string" && (f = function(P) {
          P === void 0 && (P = "");
          var R = P.match(n);
          if (!R)
            return null;
          var V = ("" + R[0]).match(s) || ["-", 0, 0], F = V[0], L = 60 * +V[1] + +V[2];
          return L === 0 ? 0 : F === "+" ? L : -L;
        }(f), f === null))
          return this;
        var I = Math.abs(f) <= 16 ? 60 * f : f;
        if (I === 0)
          return this.utc(S);
        var D = this.clone();
        if (S)
          return D.$offset = I, D.$u = !1, D;
        var H = this.$u ? this.toDate().getTimezoneOffset() : -1 * this.utcOffset();
        return (D = this.local().add(I + H, e)).$offset = I, D.$x.$localOffset = H, D;
      };
      var z = h.format;
      h.format = function(f) {
        var S = f || (this.$u ? "YYYY-MM-DDTHH:mm:ss[Z]" : "");
        return z.call(this, S);
      }, h.valueOf = function() {
        var f = this.$utils().u(this.$offset) ? 0 : this.$offset + (this.$x.$localOffset || this.$d.getTimezoneOffset());
        return this.$d.valueOf() - 6e4 * f;
      }, h.isUTC = function() {
        return !!this.$u;
      }, h.toISOString = function() {
        return this.toDate().toISOString();
      }, h.toString = function() {
        return this.toDate().toUTCString();
      };
      var T = h.toDate;
      h.toDate = function(f) {
        return f === "s" && this.$offset ? c(this.format("YYYY-MM-DD HH:mm:ss:SSS")).toDate() : T.call(this);
      };
      var $ = h.diff;
      h.diff = function(f, S, A) {
        if (f && this.$u === f.$u)
          return $.call(this, f, S, A);
        var I = this.local(), D = c(f).local();
        return $.call(I, D, S, A);
      };
    };
  });
})(Et);
var se = Et.exports;
const At = /* @__PURE__ */ bt(se);
var Ct = { exports: {} };
(function(r, t) {
  (function(e, n) {
    r.exports = n();
  })(vt, function() {
    var e = { year: 0, month: 1, day: 2, hour: 3, minute: 4, second: 5 }, n = {};
    return function(s, i, a) {
      var c, h = function(z, T, $) {
        $ === void 0 && ($ = {});
        var f = new Date(z), S = function(A, I) {
          I === void 0 && (I = {});
          var D = I.timeZoneName || "short", H = A + "|" + D, P = n[H];
          return P || (P = new Intl.DateTimeFormat("en-US", { hour12: !1, timeZone: A, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: D }), n[H] = P), P;
        }(T, $);
        return S.formatToParts(f);
      }, w = function(z, T) {
        for (var $ = h(z, T), f = [], S = 0; S < $.length; S += 1) {
          var A = $[S], I = A.type, D = A.value, H = e[I];
          H >= 0 && (f[H] = parseInt(D, 10));
        }
        var P = f[3], R = P === 24 ? 0 : P, V = f[0] + "-" + f[1] + "-" + f[2] + " " + R + ":" + f[4] + ":" + f[5] + ":000", F = +z;
        return (a.utc(V).valueOf() - (F -= F % 1e3)) / 6e4;
      }, M = i.prototype;
      M.tz = function(z, T) {
        if (z === void 0 && (z = c), !this.isValid())
          return this;
        var $, f = this.utcOffset(), S = this.toDate(), A = S.toLocaleString("en-US", { timeZone: z }), I = w(+S, z);
        if (!Number(I))
          $ = this.utcOffset(0, T);
        else if ($ = a(A, { locale: this.$L }).$set("millisecond", this.$ms).utcOffset(I, !0), T) {
          var D = $.utcOffset();
          $ = $.add(f - D, "minute");
        }
        return $.$x.$timezone = z, $;
      }, M.offsetName = function(z) {
        var T = this.$x.$timezone || a.tz.guess(), $ = h(this.valueOf(), T, { timeZoneName: z }).find(function(f) {
          return f.type.toLowerCase() === "timezonename";
        });
        return $ && $.value;
      };
      var C = M.startOf;
      M.startOf = function(z, T) {
        if (!this.$x || !this.$x.$timezone)
          return C.call(this, z, T);
        var $ = a(this.format("YYYY-MM-DD HH:mm:ss:SSS"), { locale: this.$L });
        return C.call($, z, T).tz(this.$x.$timezone, !0);
      }, a.tz = function(z, T, $) {
        var f = $ && T, S = $ || T || c, A = w(+a(), S);
        if (typeof z != "string")
          return a(z).tz(S);
        var I = a.utc(z, f).valueOf();
        if (Number.isNaN(I)) {
          var D = a(NaN);
          return D.$x.$timezone = S, D;
        }
        var H = function(F, L, j) {
          var b = F - 60 * L * 1e3, q = w(b, j);
          if (L === q)
            return [b, L];
          var K = w(b -= 60 * (q - L) * 1e3, j);
          return q === K ? [b, q] : [F - 60 * Math.min(q, K) * 1e3, Math.max(q, K)];
        }(I, A, S), P = H[0], R = H[1], V = a(P).utcOffset(R);
        return V.$x.$timezone = S, V;
      }, a.tz.guess = function() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      }, a.tz.setDefault = function(z) {
        c = z;
      };
    };
  });
})(Ct);
var ie = Ct.exports;
const Yt = /* @__PURE__ */ bt(ie);
_.extend(At);
_.extend(Yt);
class ae extends J {
  constructor({ after: e = null, before: n = null } = {}, { withTime: s = !0, useUserTimezone: i = !0 } = {}) {
    super();
    m(this, "after");
    m(this, "before");
    m(this, "normalizedFormat");
    m(this, "useUserTimezone");
    this.after = e, this.before = n, this.normalizedFormat = s ? "YYYY-MM-DD[T]HH:mm:ss[Z]" : "YYYY-MM-DD", this.useUserTimezone = i;
  }
  normalize() {
    this.constructor.ensureTimezoneIsSet();
    const e = this.useUserTimezone ? this.constructor.userTimezone : "UTC";
    let n = null, s = null;
    return Z(this.after) || (n = _.tz(this.after, e).hour(0).minute(0).second(0).tz("UTC").format(this.normalizedFormat)), Z(this.before) || (s = _.tz(this.before, e).hour(0).minute(0).second(0).add(1, "day").subtract(1, "second").tz("UTC").format(this.normalizedFormat)), { after: n, before: s };
  }
  async denormalize(e) {
    this.constructor.ensureTimezoneIsSet(), this.after = null, this.before = null, Z(e.after) || (this.after = this.useUserTimezone ? _.tz(e.after, "UTC").tz(this.constructor.userTimezone) : _.tz(e.after, "UTC"), this.after = this.after.hour(0).minute(0).second(0).format("YYYY-MM-DD")), Z(e.before) || (this.before = this.useUserTimezone ? _.tz(e.before, "UTC").tz(this.constructor.userTimezone) : _.tz(e.before, "UTC"), this.before = this.before.hour(0).minute(0).second(0).add(1, "day").subtract(1, "second").format("YYYY-MM-DD"));
  }
  static ensureTimezoneIsSet() {
    this.constructor.userTimezone = this.constructor.userTimezone ?? (_.tz.guess() || "UTC");
  }
}
m(ae, "userTimezone");
_.extend(At);
_.extend(Yt);
class oe extends J {
  constructor({ after: e = null, before: n = null } = {}) {
    super();
    m(this, "after");
    m(this, "before");
    this.after = e, this.before = n;
  }
  normalize() {
    this.constructor.ensureTimezoneIsSet();
    let e = null, n = null;
    return Z(this.after) || (e = _.tz(this.after, this.constructor.userTimezone).tz("UTC").format("YYYY-MM-DD[T]HH:mm:ss[Z]")), Z(this.before) || (n = _.tz(this.before, this.constructor.userTimezone).tz("UTC").format("YYYY-MM-DD[T]HH:mm:ss[Z]")), { after: e, before: n };
  }
  async denormalize(e) {
    this.constructor.ensureTimezoneIsSet(), this.after = null, this.before = null, Z(e.after) || (this.after = _.tz(e.after, "UTC").tz(this.constructor.userTimezone).format("YYYY-MM-DD[T]HH:mm:ss[Z]")), Z(e.before) || (this.before = _.tz(e.before, "UTC").tz(this.constructor.userTimezone).format("YYYY-MM-DD[T]HH:mm:ss[Z]"));
  }
  static ensureTimezoneIsSet() {
    this.constructor.userTimezone = this.constructor.userTimezone ?? (_.tz.guess() || "UTC");
  }
}
m(oe, "userTimezone");
function ue(r) {
  return r == null ? !0 : typeof r == "string" ? r.trim().length === 0 : typeof r == "function" || Array.isArray(r) ? r.length === 0 : r instanceof Object ? Object.keys(r).length === 0 : !1;
}
function yt(r) {
  if (!(r instanceof Object))
    return r;
  if (Array.isArray(r))
    return r.map(yt);
  const t = { ...r };
  return Object.keys(t).forEach((e) => {
    t[e] instanceof Object && (t[e] = yt(t[e])), ue(t[e]) && delete t[e];
  }), t;
}
class Ge {
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
      const n = this[e];
      t[e] = n.normalize();
    }), yt(t);
  }
  async denormalize(t) {
    const e = [];
    for (const n of this._filters) {
      const s = this[n];
      s instanceof J && typeof t[n] < "u" && e.push(s.denormalize(t[n]));
    }
    return e.length > 0 && await Promise.all(e), this;
  }
}
async function Ke(r = {}, t = {
  preserveQuery: !1,
  targetRoute: void 0
}) {
  if (typeof r != "function")
    throw Error("initialState should be provided as a function.");
  const e = Jt(), n = Qt(), s = G(r());
  async function i(w) {
    Object.assign(v(s), await v(s).denormalize(w.query));
  }
  function a() {
    s.value = et(r());
  }
  function c(w = {}) {
    const M = {};
    return t.preserveQuery === !0 && Object.assign(M, e.query), Object.assign(M, v(s).normalize(), w);
  }
  async function h(w = {}) {
    const M = v(t.targetRoute) ?? e;
    await n.push(Object.assign({ ...M }, { query: c(w) }));
  }
  return Wt((w) => i(w)), await i(e), {
    filters: s,
    buildQueryParams: c,
    submit: h,
    clear: a
  };
}
const Xe = async ({ state: r = {}, methods: t = {}, name: e = "store" } = {}) => {
  r = tt(r);
  const n = [], s = {
    name: e,
    state: r,
    ...Object.keys(t).reduce(function(i, a) {
      const c = t[a];
      return i[a] = function() {
        return c(r, ...arguments);
      }, i;
    }, {}),
    async use(i) {
      return n.push(i), await i.install(this), this;
    },
    async reconciliate(i = !1) {
      const a = n.filter(({ reconciliate: c }) => typeof c == "function");
      if (i === !1)
        return Promise.all(a.map((c) => c.reconciliate(this)));
      for (const c of a)
        await c.reconciliate(this);
    }
  };
  return s.install = (i) => i.provide(e, { ...s, state: ht(r) }), s;
}, _t = (r = "store") => Mt(r);
class ce {
  constructor(t) {
    Object.keys(t).forEach((e) => {
      this[e] = new $t(t[e]);
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
class $t {
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
    const e = new st(this.endpoint), n = new ut(e).withParams(t);
    return new $t(e.withQuery(n.toString()).toString());
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
    return this.withQuery(new ut(new st(t)).getParams());
  }
}
const tr = (r, t) => _t(t).state.endpoints[r];
function ct(r) {
  return r = v(r), r == null ? !1 : Object.keys(r).includes("@id") && r["@id"] != null;
}
function U(r) {
  return r = v(r), r === null ? null : typeof r == "string" ? r : (wt(r), r["@id"]);
}
function le(r) {
  const t = U(r);
  return t.substring(t.lastIndexOf("/") + 1);
}
function er(r) {
  return r.map(U);
}
function rr(r) {
  return r.map(le);
}
function wt(r, t = null) {
  if (typeof r != "object" || !("@id" in r))
    throw Error("Invalid item.");
  if (t !== null) {
    if (typeof t == "string" && t !== r["@type"])
      throw Error(`Expected item of type "${t}", got "${r["@type"]}".`);
    if (Array.isArray(t) && t.includes(r["@type"]) === !1)
      throw Error(`Expected item of any "${t.join("|")}", got "${r["@type"]}".`);
  }
}
function it(r, t) {
  return U(r) === U(t);
}
function fe(r, t) {
  if (r = v(r), r = Array.from(r).map(v), t = v(t), Array.isArray(t)) {
    const e = t;
    for (const n of e)
      if (fe(r, n))
        return !0;
    return !1;
  }
  for (const e of r)
    if (it(e, t))
      return !0;
  return !1;
}
function nr(r, t) {
  const e = r.findIndex((n) => it(n, t));
  return e >= 0 && r.splice(e, 1), r;
}
function ft(r, t) {
  const e = r.find((n) => it(n, t));
  return typeof e > "u" ? null : e;
}
function sr(r, t) {
  return r.findIndex((e) => it(e, t));
}
function ir(r, t) {
  return r.filter((e) => e["@type"] === t);
}
function ar(r) {
  Object.assign(r, r.map((t) => U(t)));
}
function or(r, t) {
  return r = v(r), wt(r), Object.assign({ "@id": r["@id"], "@type": r["@type"] }, t);
}
class Ut extends Error {
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
class he {
  constructor() {
    m(this, "id");
    m(this, "propertyPath");
    m(this, "message");
    m(this, "code");
    this.id = Bt();
  }
}
class de extends Ut {
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
    this._violations = e.map((n) => Object.assign(new he(), n));
  }
  getPropertyPaths() {
    return [...new Set(this.violations.map(({ propertyPath: e }) => e))];
  }
  getViolations(e) {
    const n = Array.from(arguments);
    return n.length === 0 ? this.violations : Z(n[0]) ? this.violations.filter((s) => Z(s.propertyPath)) : this.violations.filter((s) => e === s.propertyPath);
  }
}
class me {
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
function ye(r) {
  if (typeof r != "object" || r == null)
    throw Error("Invalid object.");
  return Object.keys(r).forEach((t) => delete r[t]), r;
}
function Dt(r) {
  return ct(r) ? U(r) : r;
}
function ge(r) {
  const t = et(r), e = Object.keys(t);
  for (const n of e) {
    const s = t[n];
    Array.isArray(s) ? t[n] = s.map((i) => Dt(i)) : typeof s == "object" && s != null && (t[n] = Dt(s));
  }
  return t;
}
function jt(r, t) {
  return r = ye(r), Object.assign(r, t);
}
function ur(r) {
  const t = _t(), e = G(v(r)), n = tt(et(v(r))), s = dt(() => !ct(v(n))), i = G(!1), a = dt(() => JSON.stringify(v(n)) !== JSON.stringify(v(e)));
  return { item: n, isUnsavedDraft: a, isCreationMode: s, isSubmitting: i, reset: (w) => jt(n, et(v(w ?? r))), submit: async (w) => {
    ot(w) && (w = v(w));
    try {
      i.value = !0;
      const M = await t.upsertItem(ge(w ?? n));
      return e.value = M, jt(n, et(M)), M;
    } finally {
      i.value = !1;
    }
  } };
}
function cr() {
  const r = G([]), t = (i) => {
    i = v(i), i.querySelectorAll("[name]").forEach(function(a) {
      a.setCustomValidity("");
    }), r.value = [];
  }, e = (i, a = !0) => {
    i = v(i);
    const c = i.checkValidity();
    return !c && a && i.reportValidity(), c;
  }, n = (i, a) => {
    t(i), Array.from(a).forEach((c) => s(i, c)), e(i);
  }, s = (i, { propertyPath: a, message: c }) => {
    i = v(i);
    const h = i.querySelector(`[name='${a}']`);
    h == null || h.setCustomValidity(c), h || r.value.push({ propertyPath: a, message: c });
  };
  return { resetValidity: t, bindViolations: n, unmappedViolations: r, validate: e };
}
let gt;
const pe = 1, ve = 2;
class be {
  constructor(t, e) {
    m(this, "readyState", pe);
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
    this.readyState = ve;
  }
  triggerEvent(t) {
    this.onmessage(t);
  }
  triggerError(t) {
    this.onerror(t);
  }
}
const $e = () => {
  var r, t, e;
  return typeof process < "u" && ((r = process == null ? void 0 : process.env) == null ? void 0 : r.NODE_ENV) === "test" || ((e = (t = import.meta) == null ? void 0 : t.env) == null ? void 0 : e.NODE_ENV) === "test";
};
$e() ? gt = be : gt = window.EventSource;
const we = gt, lr = (r, t) => {
  const e = new Oe(r, t);
  return Object.assign(e, {
    install(n) {
      n.provide("mercure", e);
    }
  });
}, Se = () => Mt("mercure");
function ze(r, t) {
  return r.length === t.length && r.every((e) => t.includes(e));
}
class Oe {
  constructor(t, e = {}) {
    m(this, "hub");
    m(this, "options");
    m(this, "connection");
    m(this, "subscribedTopics");
    m(this, "endpoint");
    m(this, "emitter");
    m(this, "lastEventId");
    Object.assign(this, { hub: t, options: tt(e) }), this.lastEventId = G(), this.subscribedTopics = G([]), this.endpoint = dt(() => {
      const n = new URL(this.hub), s = v(this.subscribedTopics);
      return s.includes("*") ? n.searchParams.append("topic", "*") : s.forEach((i) => n.searchParams.append("topic", i)), v(this.lastEventId) && n.searchParams.append("Last-Event-ID", v(this.lastEventId)), n.toString();
    }), this.emitter = Gt();
  }
  subscribe(t = ["*"], e = !0) {
    Array.isArray(t) || (t = [t]);
    const n = Array.from(v(this.subscribedTopics)), s = [.../* @__PURE__ */ new Set([...v(this.subscribedTopics), ...t])];
    this.subscribedTopics.value = s, e && !ze(n, s) && this.listen();
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
    this.stop(), this.connection = new we(v(this.endpoint), this.options), this.connection.onopen = () => this.emitter.emit("open", { endpoint: v(this.endpoint) }), this.connection.onmessage = (t) => (this.lastEventId.value = t.lastEventId, this.emitter.emit("message", t)), this.connection.onerror = (t) => {
      this.emitter.emit("error", t), typeof this.options.reconnectInterval == "number" && (this.stop(), setTimeout(() => this.connect(), this.options.reconnectInterval));
    };
  }
  stop() {
    var t;
    (t = this.connection) == null || t.close(), this.connection = void 0;
  }
}
const Rt = (r, t) => Object.assign(t, r), kt = () => {
};
function Te(r, t, e = ["*"], n = Rt, s = kt) {
  Array.isArray(t) || (t = [t]), Array.isArray(e) || (e = [e]);
  const i = (a) => {
    try {
      const c = JSON.parse(a.data);
      if (!ct(c))
        return;
      if (Object.keys(c).length === 1) {
        s(U(c));
        return;
      }
      for (const h of t)
        it(U(c), h) && n(c, v(h));
    } catch (c) {
      console.debug(c);
    }
  };
  return r.addListener(i), r.subscribe(e), i;
}
const De = (r, t, e) => {
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
        if (typeof Kt(a).fromUri(U(i)) < "u") {
          e(i);
          break;
        }
    } catch (a) {
      console.error(a);
    }
  };
  return r.addListener(n), r.subscribe(t), n;
}, fr = (r, t = { removeListenersOnUnmount: !0 }) => {
  r = r ?? Se();
  const e = [];
  return t.removeListenersOnUnmount && qt(() => {
    for (const s of e)
      r.removeListener(s);
  }), {
    synchronize: (s, i = ["*"], a = Rt, c = kt) => {
      const h = Te(r, s, i, a, c);
      return e.push(h), h;
    },
    on(s, i) {
      const a = De(r, s, i);
      return e.push(a), a;
    }
  };
}, je = {
  "hydra:Collection": me,
  "hydra:Error": Ut,
  ConstraintViolationList: de
};
function pt(r, t, e = /* @__PURE__ */ new WeakMap()) {
  var i;
  if (r = mt(r), t = mt(t), Object.is(r, t))
    return !0;
  if (typeof r != "object" || typeof t != "object" || r === null || t === null)
    return !1;
  if ((i = e.get(r)) != null && i.has(t))
    return !0;
  if (e.has(r) || e.set(r, /* @__PURE__ */ new Set()), e.get(r).add(t), Array.isArray(r) || Array.isArray(t))
    return Array.isArray(r) && Array.isArray(t) && r.length === t.length && r.every((a, c) => pt(a, t[c], e));
  const n = Object.prototype.toString.call(r);
  if (n !== Object.prototype.toString.call(t) || Object.getPrototypeOf(r) !== Object.getPrototypeOf(t))
    return !1;
  if (n === "[object Date]")
    return r.getTime() === t.getTime();
  if (n !== "[object Object]")
    return !1;
  const s = Object.keys(r);
  return s.length === Object.keys(t).length && s.every((a) => Object.prototype.hasOwnProperty.call(t, a) && pt(r[a], t[a], e));
}
class xt {
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
const xe = function(r) {
  throw r;
};
class hr {
  constructor(t, e = {}) {
    m(this, "api");
    m(this, "endpoints");
    m(this, "classmap");
    this.api = t;
    const { endpoints: n, classmap: s } = e;
    this.endpoints = new ce(n ?? {}), this.classmap = { ...je, ...s }, this.errorHandler = e.errorHandler ?? xe;
  }
  factory(t, e) {
    for (const n in this.classmap)
      if (n === (t["@type"] ?? t)) {
        const s = this.classmap[n];
        return t instanceof s ? t : (t = Object.assign(new s(), t), e && Object.assign(t, { statusCode: e }), tt(t));
      }
    return t;
  }
  storeItem({ state: t }, e) {
    const n = U(e);
    if (!Object.keys(t.items).includes(n))
      t.items[n] = G(e);
    else {
      const s = t.items[n], i = mt(s);
      for (const a of Object.keys(e))
        (!(a in i) || !pt(i[a], e[a])) && (s[a] = e[a]);
    }
    return t.items[n];
  }
  removeItem({ state: t }, e) {
    const n = U(e);
    delete t.items[n];
  }
  async clearItems({ state: t }) {
    t.items = tt(new xt());
  }
  async handle(t, { errorHandler: e = this.errorHandler } = {}) {
    var n, s, i, a;
    try {
      const { data: c } = await t();
      return this.factory(c);
    } catch (c) {
      typeof ((n = c.response) == null ? void 0 : n.data) == "object" && ((s = c.response) == null ? void 0 : s.data) != null && (c = this.factory(c.response.data, (i = c.response) == null ? void 0 : i.status)), c.statusCode = c.statusCode ?? ((a = c.response) == null ? void 0 : a.status), e(c);
    }
  }
  async fetchItem({ state: t }, e, n) {
    let s = new st(U(e));
    n != null && n.groups && (s = s.withQuery(`${new ut(s.getQuery()).withParam("groups", n.groups)}`));
    let i = await this.handle(() => this.api.get(`${s}`, n), n);
    return i = this.factory(i), (n == null ? void 0 : n.store) ?? !0 ? this.storeItem({ state: t }, i) : i;
  }
  async getItem({ state: t }, e, n) {
    if (e === null)
      return null;
    const s = U(e), i = ft(t.items, s);
    return i ?? await this.fetchItem({ state: t }, s, n);
  }
  async fetchCollection({ state: t }, e, n) {
    let s = new st(`${e}`);
    n != null && n.groups && (s = s.withQuery(`${new ut(s.getQuery()).withParam("groups", n.groups)}`));
    const i = await this.handle(() => this.api.get(`${s}`, n), n);
    i["hydra:member"] = i["hydra:member"].map((h) => this.factory(h));
    const a = this.factory(i);
    if (a["hydra:member"] = a["hydra:member"].map((h) => this.factory(h)), (n == null ? void 0 : n.store) ?? !1)
      for (const h of a["hydra:member"])
        this.storeItem({ state: t }, h);
    return a;
  }
  async createItem({ state: t }, e, n) {
    const s = this.endpoints.for(e);
    return e = await this.handle(() => this.api.post(s, e, n), n), (n == null ? void 0 : n.store) ?? !0 ? this.storeItem({ state: t }, e) : e;
  }
  async updateItem({ state: t }, e, n) {
    return wt(e), e = await this.handle(() => this.api.put(U(e), e, n), n), (n == null ? void 0 : n.store) ?? !0 ? this.storeItem({ state: t }, e) : e;
  }
  async upsertItem({ state: t }, e, n) {
    return ct(e) ? this.updateItem({ state: t }, e, n) : this.createItem({ state: t }, e, n);
  }
  async deleteItem({ state: t }, e, n) {
    const s = U(e);
    await this.handle(() => this.api.delete(s, n), n), e = ft(t.items, s), e !== null && this.removeItem({ state: t }, e);
  }
  async getRelation({ state: t }, e, n = {}) {
    if (e === null)
      return null;
    if (typeof e == "function") {
      const i = zt(() => this.getRelation({ state: t }, e(), n));
      return await Ot(i).not.toBe(void 0), i;
    }
    const s = (n.useExisting ?? !0) !== !1;
    if (s) {
      const i = ft(t.items, e);
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
    if (typeof e == "function") {
      const s = zt(() => this.getRelations({ state: t }, e(), n));
      return await Ot(s).not.toBe(void 0), s;
    }
    return Promise.all(e.map((s) => this.getRelation({ state: t }, s, n)));
  }
  async install(t) {
    t.state.items = tt(new xt()), t.state.endpoints = ht(this.endpoints), t.state.classmap = ht(this.classmap), t.storeItem = (e) => this.storeItem(t, e), t.removeItem = (e) => this.removeItem(t, e), t.clearItems = () => this.clearItems(t), t.getItem = (e, n) => this.getItem(t, e, n), t.fetchItem = (e, n) => this.fetchItem(t, e, n), t.fetchCollection = (e, n) => this.fetchCollection(t, e, n), t.createItem = (e, n) => this.createItem(t, e, n), t.updateItem = (e, n) => this.updateItem(t, e, n), t.upsertItem = (e, n) => this.upsertItem(t, e, n), t.deleteItem = (e, n) => this.deleteItem(t, e, n), t.getRelation = (e, n) => this.getRelation(t, e, n), t.getRelations = (e, n) => this.getRelations(t, e, n), t.endpoint = (e) => t.state.endpoints[e], t.getItemsByType = (e) => t.state.items.filter((n) => e === n["@type"]), t.factory = (e, n) => (n = n ?? e, typeof e == "string" && (n["@type"] = e), this.factory(n));
  }
}
function Ht(r) {
  if (typeof r == "string")
    return r;
  try {
    return U(r);
  } catch {
    return null;
  }
}
function Me(r) {
  return r.map((t) => Ht(t));
}
async function Lt(r, t) {
  try {
    return await t.getItem(r);
  } catch {
    return null;
  }
}
async function Ie(r, t) {
  return Promise.all(r.map((e) => Lt(e, t)));
}
class dr extends J {
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
    return this.multiple || this.items.length > 1 ? Me(this.items) : Ht(this.item);
  }
  async denormalize(e) {
    if (Array.isArray(e)) {
      this.items = await Ie(e, this.store);
      return;
    }
    this.items = [await Lt(e, this.store)];
  }
}
const Pe = {
  asc: "desc",
  desc: "asc"
};
class mr extends J {
  constructor(e = {}) {
    super();
    m(this, "order");
    this.order = e;
  }
  revert() {
    const e = {};
    for (const n in this.order) {
      const s = this.order[n];
      e[n] = Pe[s] ?? s;
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
class yr extends J {
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
class gr extends J {
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
class pr extends J {
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
function vr({ itemsPerPage: r, currentPage: t, totalItems: e }) {
  return e == null ? new Ce({ itemsPerPage: r, currentPage: t }) : new Ae({ itemsPerPage: r, currentPage: t, totalItems: e });
}
function Ee(r) {
  return Array.from({ length: r }, (t, e) => e + 1);
}
class St {
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
    return this._pages === void 0 && (this._pages = Ee(this.lastPage)), this._pages;
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
    return new Ye(this, t, e);
  }
}
class Ae extends St {
  constructor({ itemsPerPage: t, currentPage: e, totalItems: n }) {
    super({ itemsPerPage: t, currentPage: e }), this.totalItems = parseInt(n), this.lastPage = Math.max(1, Math.ceil(this.totalItems / Math.max(1, this.itemsPerPage))), this.nextPage = Math.min(this.lastPage, this.currentPage + 1);
  }
}
class Ce extends St {
  constructor({ itemsPerPage: t, currentPage: e, totalItems: n }) {
    super({ itemsPerPage: t, currentPage: e, totalItems: n }), this.nextPage = this.lastPage = this.currentPage + 1;
  }
}
class Ye extends St {
  constructor(t, e, n = !1) {
    super(t), Object.assign(this, t);
    const s = [];
    n && s.push(1);
    for (let i = 1; i <= this.lastPage; i++)
      i === this.currentPage && s.push(i), i < this.currentPage && i >= this.currentPage - e && s.push(i), i > this.currentPage && i <= this.currentPage + e && s.push(i);
    n && s.push(this.lastPage), this._pages = [...new Set(s)];
  }
}
class _e {
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
function br({ fields: r, preload: t } = {}) {
  return Object.assign(new _e(), { fields: r }, { preload: t }).headers;
}
export {
  te as AbortError,
  Qe as ApiClient,
  Be as ArrayFilter,
  de as ConstraintViolationList,
  ae as DateRangeFilter,
  oe as DatetimeRangeFilter,
  be as FakeEventSource,
  Ge as FilterCollection,
  Xt as HttpError,
  me as HydraCollection,
  $t as HydraEndpoint,
  ce as HydraEndpoints,
  Ut as HydraError,
  hr as HydraPlugin,
  dr as ItemFilter,
  Oe as Mercure,
  mr as OrderFilter,
  yr as RangeFilter,
  gr as TextFilter,
  pr as TruthyFilter,
  he as Violation,
  it as areSameIris,
  wt as checkValidItem,
  et as clone,
  fe as containsIri,
  lr as createMercure,
  vr as createPager,
  Xe as createStore,
  le as getId,
  rr as getIds,
  U as getIri,
  er as getIris,
  ft as getItemByIri,
  sr as getItemIndexByIri,
  ir as getItemsByType,
  ct as hasIri,
  Te as mercureSync,
  ar as normalizeIris,
  ge as normalizeItemRelations,
  De as on,
  or as partialItem,
  tr as useEndpoint,
  Ke as useFilters,
  cr as useFormValidation,
  ur as useItemForm,
  Se as useMercure,
  fr as useMercureSync,
  _t as useStore,
  br as vulcain,
  We as withoutDuplicates,
  nr as withoutIri
};
