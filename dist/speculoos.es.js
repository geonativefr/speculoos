var qt = Object.defineProperty;
var Zt = (r, t, e) => t in r ? qt(r, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : r[t] = e;
var m = (r, t, e) => (Zt(r, typeof t != "symbol" ? t + "" : t, e), e);
import { whenever as Jt, asyncComputed as Qt, until as Tt } from "@vueuse/core";
import { unref as v, isRef as ut, ref as W, reactive as tt, readonly as ht, inject as Et, computed as dt, onUnmounted as Wt, toRaw as mt, effectScope as Bt } from "vue";
import Dt from "clone-deep";
import Gt from "md5";
import Z from "is-empty";
import { useRoute as Kt, useRouter as Xt, onBeforeRouteUpdate as te } from "vue-router";
import { URI as st, QueryString as ct } from "psr7-js";
import { v4 as ee } from "uuid";
import re from "mitt";
import ne from "uri-templates";
class se extends Error {
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
class ie extends Error {
  constructor(t) {
    super(), this.name = "AbortError", this.reason = t;
  }
}
const bt = (r) => {
  if (!(r instanceof Headers))
    return r;
  const t = {};
  for (let e of r.keys())
    t[e] = r.get(e);
  return t;
}, jt = (...r) => {
  const t = {};
  for (const e of r) {
    const n = bt(e) ?? {};
    for (const s of Object.keys(n)) {
      for (const i of Object.keys(t))
        i.toLowerCase() === s.toLowerCase() && delete t[i];
      t[s] = n[s];
    }
  }
  return t;
}, ae = {
  Accept: "application/ld+json, application/json"
}, oe = async (r) => {
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
}, ft = /* @__PURE__ */ new WeakMap(), yt = (r) => (ft.has(r) || ft.set(r, oe(r)), ft.get(r));
class rr {
  constructor({ baseUri: t = "", options: e = {}, fetcher: n } = {}) {
    m(this, "baseUri");
    m(this, "options");
    m(this, "fetch");
    var s;
    this.baseUri = t, this.options = e, n = n ?? ((s = window.fetch) == null ? void 0 : s.bind(window)), this.fetch = async (i, a) => n(i, a).then(yt);
  }
  resolve(t) {
    return new URL(t, this.baseUri).toString();
  }
  mergeOptions(t) {
    let e = { ...this.options };
    Object.keys(e).includes("headers") && (e.headers = bt(e.headers));
    for (let n of arguments) {
      let s = { ...n };
      Object.keys(s).includes("headers") && (s.headers = jt(e.headers, s.headers)), e = { ...Dt(e), ...Dt(s) };
    }
    return e;
  }
  async request(t, e, n) {
    e = `${v(e)}`, n = this.mergeOptions({ method: t }, n), Object.keys(n).includes("headers") && (n.headers = new Headers(jt(ae, n.headers)));
    let s = () => {
    };
    try {
      if (ut(n == null ? void 0 : n.isLoading) && (n.isLoading.value = !0), ut(n == null ? void 0 : n.aborted)) {
        const i = new AbortController(), { signal: a } = i;
        n.signal = a, s = Jt(n.aborted, () => i.abort(), { immediate: !0 });
      }
      try {
        const i = await this.fetch(e, n);
        return se.guard(i);
      } catch (i) {
        throw i.name === "AbortError" ? new ie(i.reason) : i;
      }
    } finally {
      s(), ut(n == null ? void 0 : n.isLoading) && (n.isLoading.value = !1);
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
const ue = (r) => (r == null ? void 0 : r.signal) == null && ((r == null ? void 0 : r.body) == null || typeof r.body == "string"), ce = (r, t) => {
  const e = bt(t == null ? void 0 : t.headers) ?? {}, n = Object.keys(e).map((s) => [s.toLowerCase(), `${e[s]}`]).sort(([s], [i]) => s < i ? -1 : s > i ? 1 : 0);
  return Gt(JSON.stringify({ method: t == null ? void 0 : t.method, url: `${r}`, body: t == null ? void 0 : t.body, headers: n }));
};
class fe {
  constructor(t = ((e) => (e = window.fetch) == null ? void 0 : e.bind(window))()) {
    m(this, "fetch");
    m(this, "pendingRequests", []);
    return this.fetch = t, (n, s) => {
      if (!ue(s))
        return this.fetch(n, s).then(yt);
      const i = ce(n, s), a = this.pendingRequests.findIndex((d) => i === d.hash);
      if (a >= 0)
        return this.pendingRequests[a].promise;
      const c = this.fetch(n, s).then(yt);
      return this.pendingRequests.push({ hash: i, promise: c }), c.then(
        (d) => (this.removePendingRequest(i), d),
        (d) => {
          throw this.removePendingRequest(i), d;
        }
      );
    };
  }
  removePendingRequest(t) {
    const e = this.pendingRequests.findIndex((n) => t === n.hash);
    e >= 0 && this.pendingRequests.splice(e, 1);
  }
}
function nr(r = void 0) {
  return new fe(r);
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
class sr extends J {
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
var $t = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function wt(r) {
  return r && r.__esModule && Object.prototype.hasOwnProperty.call(r, "default") ? r.default : r;
}
var At = { exports: {} };
(function(r, t) {
  (function(e, n) {
    r.exports = n();
  })($t, function() {
    var e = 1e3, n = 6e4, s = 36e5, i = "millisecond", a = "second", c = "minute", d = "hour", w = "day", M = "week", Y = "month", z = "quarter", T = "year", $ = "date", l = "Invalid Date", S = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/, A = /\[([^\]]+)]|YYYY|YY|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g, I = { name: "en", weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"), months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"), ordinal: function(y) {
      var f = ["th", "st", "nd", "rd"], o = y % 100;
      return "[" + y + (f[(o - 20) % 10] || f[o] || f[0]) + "]";
    } }, D = function(y, f, o) {
      var h = String(y);
      return !h || h.length >= f ? y : "" + Array(f + 1 - h.length).join(o) + y;
    }, L = { s: D, z: function(y) {
      var f = -y.utcOffset(), o = Math.abs(f), h = Math.floor(o / 60), u = o % 60;
      return (f <= 0 ? "+" : "-") + D(h, 2, "0") + ":" + D(u, 2, "0");
    }, m: function y(f, o) {
      if (f.date() < o.date())
        return -y(o, f);
      var h = 12 * (o.year() - f.year()) + (o.month() - f.month()), u = f.clone().add(h, Y), g = o - u < 0, p = f.clone().add(h + (g ? -1 : 1), Y);
      return +(-(h + (o - u) / (g ? u - p : p - u)) || 0);
    }, a: function(y) {
      return y < 0 ? Math.ceil(y) || 0 : Math.floor(y);
    }, p: function(y) {
      return { M: Y, y: T, w: M, d: w, D: $, h: d, m: c, s: a, ms: i, Q: z }[y] || String(y || "").toLowerCase().replace(/s$/, "");
    }, u: function(y) {
      return y === void 0;
    } }, P = "en", R = {};
    R[P] = I;
    var V = "$isDayjsObject", F = function(y) {
      return y instanceof q || !(!y || !y[V]);
    }, H = function y(f, o, h) {
      var u;
      if (!f)
        return P;
      if (typeof f == "string") {
        var g = f.toLowerCase();
        R[g] && (u = g), o && (R[g] = o, u = g);
        var p = f.split("-");
        if (!u && p.length > 1)
          return y(p[0]);
      } else {
        var O = f.name;
        R[O] = f, u = O;
      }
      return !h && u && (P = u), u || !h && P;
    }, j = function(y, f) {
      if (F(y))
        return y.clone();
      var o = typeof f == "object" ? f : {};
      return o.date = y, o.args = arguments, new q(o);
    }, b = L;
    b.l = H, b.i = F, b.w = function(y, f) {
      return j(y, { locale: f.$L, utc: f.$u, x: f.$x, $offset: f.$offset });
    };
    var q = function() {
      function y(o) {
        this.$L = H(o.locale, null, !0), this.parse(o), this.$x = this.$x || o.x || {}, this[V] = !0;
      }
      var f = y.prototype;
      return f.parse = function(o) {
        this.$d = function(h) {
          var u = h.date, g = h.utc;
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
      }, f.init = function() {
        var o = this.$d;
        this.$y = o.getFullYear(), this.$M = o.getMonth(), this.$D = o.getDate(), this.$W = o.getDay(), this.$H = o.getHours(), this.$m = o.getMinutes(), this.$s = o.getSeconds(), this.$ms = o.getMilliseconds();
      }, f.$utils = function() {
        return b;
      }, f.isValid = function() {
        return this.$d.toString() !== l;
      }, f.isSame = function(o, h) {
        var u = j(o);
        return this.startOf(h) <= u && u <= this.endOf(h);
      }, f.isAfter = function(o, h) {
        return j(o) < this.startOf(h);
      }, f.isBefore = function(o, h) {
        return this.endOf(h) < j(o);
      }, f.$g = function(o, h, u) {
        return b.u(o) ? this[h] : this.set(u, o);
      }, f.unix = function() {
        return Math.floor(this.valueOf() / 1e3);
      }, f.valueOf = function() {
        return this.$d.getTime();
      }, f.startOf = function(o, h) {
        var u = this, g = !!b.u(h) || h, p = b.p(o), O = function(G, k) {
          var Q = b.w(u.$u ? Date.UTC(u.$y, k, G) : new Date(u.$y, k, G), u);
          return g ? Q : Q.endOf(w);
        }, x = function(G, k) {
          return b.w(u.toDate()[G].apply(u.toDate("s"), (g ? [0, 0, 0, 0] : [23, 59, 59, 999]).slice(k)), u);
        }, E = this.$W, _ = this.$M, N = this.$D, X = "set" + (this.$u ? "UTC" : "");
        switch (p) {
          case T:
            return g ? O(1, 0) : O(31, 11);
          case Y:
            return g ? O(1, _) : O(0, _ + 1);
          case M:
            var B = this.$locale().weekStart || 0, rt = (E < B ? E + 7 : E) - B;
            return O(g ? N - rt : N + (6 - rt), _);
          case w:
          case $:
            return x(X + "Hours", 0);
          case d:
            return x(X + "Minutes", 1);
          case c:
            return x(X + "Seconds", 2);
          case a:
            return x(X + "Milliseconds", 3);
          default:
            return this.clone();
        }
      }, f.endOf = function(o) {
        return this.startOf(o, !1);
      }, f.$set = function(o, h) {
        var u, g = b.p(o), p = "set" + (this.$u ? "UTC" : ""), O = (u = {}, u[w] = p + "Date", u[$] = p + "Date", u[Y] = p + "Month", u[T] = p + "FullYear", u[d] = p + "Hours", u[c] = p + "Minutes", u[a] = p + "Seconds", u[i] = p + "Milliseconds", u)[g], x = g === w ? this.$D + (h - this.$W) : h;
        if (g === Y || g === T) {
          var E = this.clone().set($, 1);
          E.$d[O](x), E.init(), this.$d = E.set($, Math.min(this.$D, E.daysInMonth())).$d;
        } else
          O && this.$d[O](x);
        return this.init(), this;
      }, f.set = function(o, h) {
        return this.clone().$set(o, h);
      }, f.get = function(o) {
        return this[b.p(o)]();
      }, f.add = function(o, h) {
        var u, g = this;
        o = Number(o);
        var p = b.p(h), O = function(_) {
          var N = j(g);
          return b.w(N.date(N.date() + Math.round(_ * o)), g);
        };
        if (p === Y)
          return this.set(Y, this.$M + o);
        if (p === T)
          return this.set(T, this.$y + o);
        if (p === w)
          return O(1);
        if (p === M)
          return O(7);
        var x = (u = {}, u[c] = n, u[d] = s, u[a] = e, u)[p] || 1, E = this.$d.getTime() + o * x;
        return b.w(E, this);
      }, f.subtract = function(o, h) {
        return this.add(-1 * o, h);
      }, f.format = function(o) {
        var h = this, u = this.$locale();
        if (!this.isValid())
          return u.invalidDate || l;
        var g = o || "YYYY-MM-DDTHH:mm:ssZ", p = b.z(this), O = this.$H, x = this.$m, E = this.$M, _ = u.weekdays, N = u.months, X = u.meridiem, B = function(k, Q, nt, ot) {
          return k && (k[Q] || k(h, g)) || nt[Q].slice(0, ot);
        }, rt = function(k) {
          return b.s(O % 12 || 12, k, "0");
        }, G = X || function(k, Q, nt) {
          var ot = k < 12 ? "AM" : "PM";
          return nt ? ot.toLowerCase() : ot;
        };
        return g.replace(A, function(k, Q) {
          return Q || function(nt) {
            switch (nt) {
              case "YY":
                return String(h.$y).slice(-2);
              case "YYYY":
                return b.s(h.$y, 4, "0");
              case "M":
                return E + 1;
              case "MM":
                return b.s(E + 1, 2, "0");
              case "MMM":
                return B(u.monthsShort, E, N, 3);
              case "MMMM":
                return B(N, E);
              case "D":
                return h.$D;
              case "DD":
                return b.s(h.$D, 2, "0");
              case "d":
                return String(h.$W);
              case "dd":
                return B(u.weekdaysMin, h.$W, _, 2);
              case "ddd":
                return B(u.weekdaysShort, h.$W, _, 3);
              case "dddd":
                return _[h.$W];
              case "H":
                return String(O);
              case "HH":
                return b.s(O, 2, "0");
              case "h":
                return rt(1);
              case "hh":
                return rt(2);
              case "a":
                return G(O, x, !0);
              case "A":
                return G(O, x, !1);
              case "m":
                return String(x);
              case "mm":
                return b.s(x, 2, "0");
              case "s":
                return String(h.$s);
              case "ss":
                return b.s(h.$s, 2, "0");
              case "SSS":
                return b.s(h.$ms, 3, "0");
              case "Z":
                return p;
            }
            return null;
          }(k) || p.replace(":", "");
        });
      }, f.utcOffset = function() {
        return 15 * -Math.round(this.$d.getTimezoneOffset() / 15);
      }, f.diff = function(o, h, u) {
        var g, p = this, O = b.p(h), x = j(o), E = (x.utcOffset() - this.utcOffset()) * n, _ = this - x, N = function() {
          return b.m(p, x);
        };
        switch (O) {
          case T:
            g = N() / 12;
            break;
          case Y:
            g = N();
            break;
          case z:
            g = N() / 3;
            break;
          case M:
            g = (_ - E) / 6048e5;
            break;
          case w:
            g = (_ - E) / 864e5;
            break;
          case d:
            g = _ / s;
            break;
          case c:
            g = _ / n;
            break;
          case a:
            g = _ / e;
            break;
          default:
            g = _;
        }
        return u ? g : b.a(g);
      }, f.daysInMonth = function() {
        return this.endOf(Y).$D;
      }, f.$locale = function() {
        return R[this.$L];
      }, f.locale = function(o, h) {
        if (!o)
          return this.$L;
        var u = this.clone(), g = H(o, h, !0);
        return g && (u.$L = g), u;
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
    }(), K = q.prototype;
    return j.prototype = K, [["$ms", i], ["$s", a], ["$m", c], ["$H", d], ["$W", w], ["$M", Y], ["$y", T], ["$D", $]].forEach(function(y) {
      K[y[1]] = function(f) {
        return this.$g(f, y[0], y[1]);
      };
    }), j.extend = function(y, f) {
      return y.$i || (y(f, q, j), y.$i = !0), j;
    }, j.locale = H, j.isDayjs = F, j.unix = function(y) {
      return j(1e3 * y);
    }, j.en = R[P], j.Ls = R, j.p = {}, j;
  });
})(At);
var le = At.exports;
const U = /* @__PURE__ */ wt(le);
var Ct = { exports: {} };
(function(r, t) {
  (function(e, n) {
    r.exports = n();
  })($t, function() {
    var e = "minute", n = /[+-]\d\d(?::?\d\d)?/g, s = /([+-]|\d\d)/g;
    return function(i, a, c) {
      var d = a.prototype;
      c.utc = function(l) {
        var S = { date: l, utc: !0, args: arguments };
        return new a(S);
      }, d.utc = function(l) {
        var S = c(this.toDate(), { locale: this.$L, utc: !0 });
        return l ? S.add(this.utcOffset(), e) : S;
      }, d.local = function() {
        return c(this.toDate(), { locale: this.$L, utc: !1 });
      };
      var w = d.parse;
      d.parse = function(l) {
        l.utc && (this.$u = !0), this.$utils().u(l.$offset) || (this.$offset = l.$offset), w.call(this, l);
      };
      var M = d.init;
      d.init = function() {
        if (this.$u) {
          var l = this.$d;
          this.$y = l.getUTCFullYear(), this.$M = l.getUTCMonth(), this.$D = l.getUTCDate(), this.$W = l.getUTCDay(), this.$H = l.getUTCHours(), this.$m = l.getUTCMinutes(), this.$s = l.getUTCSeconds(), this.$ms = l.getUTCMilliseconds();
        } else
          M.call(this);
      };
      var Y = d.utcOffset;
      d.utcOffset = function(l, S) {
        var A = this.$utils().u;
        if (A(l))
          return this.$u ? 0 : A(this.$offset) ? Y.call(this) : this.$offset;
        if (typeof l == "string" && (l = function(P) {
          P === void 0 && (P = "");
          var R = P.match(n);
          if (!R)
            return null;
          var V = ("" + R[0]).match(s) || ["-", 0, 0], F = V[0], H = 60 * +V[1] + +V[2];
          return H === 0 ? 0 : F === "+" ? H : -H;
        }(l), l === null))
          return this;
        var I = Math.abs(l) <= 16 ? 60 * l : l;
        if (I === 0)
          return this.utc(S);
        var D = this.clone();
        if (S)
          return D.$offset = I, D.$u = !1, D;
        var L = this.$u ? this.toDate().getTimezoneOffset() : -1 * this.utcOffset();
        return (D = this.local().add(I + L, e)).$offset = I, D.$x.$localOffset = L, D;
      };
      var z = d.format;
      d.format = function(l) {
        var S = l || (this.$u ? "YYYY-MM-DDTHH:mm:ss[Z]" : "");
        return z.call(this, S);
      }, d.valueOf = function() {
        var l = this.$utils().u(this.$offset) ? 0 : this.$offset + (this.$x.$localOffset || this.$d.getTimezoneOffset());
        return this.$d.valueOf() - 6e4 * l;
      }, d.isUTC = function() {
        return !!this.$u;
      }, d.toISOString = function() {
        return this.toDate().toISOString();
      }, d.toString = function() {
        return this.toDate().toUTCString();
      };
      var T = d.toDate;
      d.toDate = function(l) {
        return l === "s" && this.$offset ? c(this.format("YYYY-MM-DD HH:mm:ss:SSS")).toDate() : T.call(this);
      };
      var $ = d.diff;
      d.diff = function(l, S, A) {
        if (l && this.$u === l.$u)
          return $.call(this, l, S, A);
        var I = this.local(), D = c(l).local();
        return $.call(I, D, S, A);
      };
    };
  });
})(Ct);
var he = Ct.exports;
const Yt = /* @__PURE__ */ wt(he);
var _t = { exports: {} };
(function(r, t) {
  (function(e, n) {
    r.exports = n();
  })($t, function() {
    var e = { year: 0, month: 1, day: 2, hour: 3, minute: 4, second: 5 }, n = {};
    return function(s, i, a) {
      var c, d = function(z, T, $) {
        $ === void 0 && ($ = {});
        var l = new Date(z), S = function(A, I) {
          I === void 0 && (I = {});
          var D = I.timeZoneName || "short", L = A + "|" + D, P = n[L];
          return P || (P = new Intl.DateTimeFormat("en-US", { hour12: !1, timeZone: A, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: D }), n[L] = P), P;
        }(T, $);
        return S.formatToParts(l);
      }, w = function(z, T) {
        for (var $ = d(z, T), l = [], S = 0; S < $.length; S += 1) {
          var A = $[S], I = A.type, D = A.value, L = e[I];
          L >= 0 && (l[L] = parseInt(D, 10));
        }
        var P = l[3], R = P === 24 ? 0 : P, V = l[0] + "-" + l[1] + "-" + l[2] + " " + R + ":" + l[4] + ":" + l[5] + ":000", F = +z;
        return (a.utc(V).valueOf() - (F -= F % 1e3)) / 6e4;
      }, M = i.prototype;
      M.tz = function(z, T) {
        if (z === void 0 && (z = c), !this.isValid())
          return this;
        var $, l = this.utcOffset(), S = this.toDate(), A = S.toLocaleString("en-US", { timeZone: z }), I = w(+S, z);
        if (!Number(I))
          $ = this.utcOffset(0, T);
        else if ($ = a(A, { locale: this.$L }).$set("millisecond", this.$ms).utcOffset(I, !0), T) {
          var D = $.utcOffset();
          $ = $.add(l - D, "minute");
        }
        return $.$x.$timezone = z, $;
      }, M.offsetName = function(z) {
        var T = this.$x.$timezone || a.tz.guess(), $ = d(this.valueOf(), T, { timeZoneName: z }).find(function(l) {
          return l.type.toLowerCase() === "timezonename";
        });
        return $ && $.value;
      };
      var Y = M.startOf;
      M.startOf = function(z, T) {
        if (!this.$x || !this.$x.$timezone)
          return Y.call(this, z, T);
        var $ = a(this.format("YYYY-MM-DD HH:mm:ss:SSS"), { locale: this.$L });
        return Y.call($, z, T).tz(this.$x.$timezone, !0);
      }, a.tz = function(z, T, $) {
        var l = $ && T, S = $ || T || c, A = w(+a(), S);
        if (typeof z != "string")
          return a(z).tz(S);
        var I = a.utc(z, l).valueOf();
        if (Number.isNaN(I)) {
          var D = a(NaN);
          return D.$x.$timezone = S, D;
        }
        var L = function(F, H, j) {
          var b = F - 60 * H * 1e3, q = w(b, j);
          if (H === q)
            return [b, H];
          var K = w(b -= 60 * (q - H) * 1e3, j);
          return q === K ? [b, q] : [F - 60 * Math.min(q, K) * 1e3, Math.max(q, K)];
        }(I, A, S), P = L[0], R = L[1], V = a(P).utcOffset(R);
        return V.$x.$timezone = S, V;
      }, a.tz.guess = function() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      }, a.tz.setDefault = function(z) {
        c = z;
      };
    };
  });
})(_t);
var de = _t.exports;
const Ut = /* @__PURE__ */ wt(de);
U.extend(Yt);
U.extend(Ut);
class me extends J {
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
    return Z(this.after) || (n = U.tz(this.after, e).hour(0).minute(0).second(0).tz("UTC").format(this.normalizedFormat)), Z(this.before) || (s = U.tz(this.before, e).hour(0).minute(0).second(0).add(1, "day").subtract(1, "second").tz("UTC").format(this.normalizedFormat)), { after: n, before: s };
  }
  async denormalize(e) {
    this.constructor.ensureTimezoneIsSet(), this.after = null, this.before = null, Z(e.after) || (this.after = this.useUserTimezone ? U.tz(e.after, "UTC").tz(this.constructor.userTimezone) : U.tz(e.after, "UTC"), this.after = this.after.hour(0).minute(0).second(0).format("YYYY-MM-DD")), Z(e.before) || (this.before = this.useUserTimezone ? U.tz(e.before, "UTC").tz(this.constructor.userTimezone) : U.tz(e.before, "UTC"), this.before = this.before.hour(0).minute(0).second(0).add(1, "day").subtract(1, "second").format("YYYY-MM-DD"));
  }
  static ensureTimezoneIsSet() {
    this.constructor.userTimezone = this.constructor.userTimezone ?? (U.tz.guess() || "UTC");
  }
}
m(me, "userTimezone");
U.extend(Yt);
U.extend(Ut);
class ye extends J {
  constructor({ after: e = null, before: n = null } = {}) {
    super();
    m(this, "after");
    m(this, "before");
    this.after = e, this.before = n;
  }
  normalize() {
    this.constructor.ensureTimezoneIsSet();
    let e = null, n = null;
    return Z(this.after) || (e = U.tz(this.after, this.constructor.userTimezone).tz("UTC").format("YYYY-MM-DD[T]HH:mm:ss[Z]")), Z(this.before) || (n = U.tz(this.before, this.constructor.userTimezone).tz("UTC").format("YYYY-MM-DD[T]HH:mm:ss[Z]")), { after: e, before: n };
  }
  async denormalize(e) {
    this.constructor.ensureTimezoneIsSet(), this.after = null, this.before = null, Z(e.after) || (this.after = U.tz(e.after, "UTC").tz(this.constructor.userTimezone).format("YYYY-MM-DD[T]HH:mm:ss[Z]")), Z(e.before) || (this.before = U.tz(e.before, "UTC").tz(this.constructor.userTimezone).format("YYYY-MM-DD[T]HH:mm:ss[Z]"));
  }
  static ensureTimezoneIsSet() {
    this.constructor.userTimezone = this.constructor.userTimezone ?? (U.tz.guess() || "UTC");
  }
}
m(ye, "userTimezone");
function ge(r) {
  return r == null ? !0 : typeof r == "string" ? r.trim().length === 0 : typeof r == "function" || Array.isArray(r) ? r.length === 0 : r instanceof Object ? Object.keys(r).length === 0 : !1;
}
function gt(r) {
  if (!(r instanceof Object))
    return r;
  if (Array.isArray(r))
    return r.map(gt);
  const t = { ...r };
  return Object.keys(t).forEach((e) => {
    t[e] instanceof Object && (t[e] = gt(t[e])), ge(t[e]) && delete t[e];
  }), t;
}
class ir {
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
    }), gt(t);
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
async function ar(r = {}, t = {
  preserveQuery: !1,
  targetRoute: void 0
}) {
  if (typeof r != "function")
    throw Error("initialState should be provided as a function.");
  const e = Kt(), n = Xt(), s = W(r());
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
  async function d(w = {}) {
    const M = v(t.targetRoute) ?? e;
    await n.push(Object.assign({ ...M }, { query: c(w) }));
  }
  return te((w) => i(w)), await i(e), {
    filters: s,
    buildQueryParams: c,
    submit: d,
    clear: a
  };
}
const or = async ({ state: r = {}, methods: t = {}, name: e = "store" } = {}) => {
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
}, Rt = (r = "store") => Et(r);
class pe {
  constructor(t) {
    Object.keys(t).forEach((e) => {
      this[e] = new St(t[e]);
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
class St {
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
    const e = new st(this.endpoint), n = new ct(e).withParams(t);
    return new St(e.withQuery(n.toString()).toString());
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
    return this.withQuery(new ct(new st(t)).getParams());
  }
}
const ur = (r, t) => Rt(t).state.endpoints[r];
function it(r) {
  return r = v(r), r == null ? !1 : Object.keys(r).includes("@id") && r["@id"] != null;
}
function C(r) {
  return r = v(r), r === null ? null : typeof r == "string" ? r : (zt(r), r["@id"]);
}
function ve(r) {
  const t = C(r);
  return t.substring(t.lastIndexOf("/") + 1);
}
function cr(r) {
  return r.map(C);
}
function fr(r) {
  return r.map(ve);
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
function at(r, t) {
  return C(r) === C(t);
}
function be(r, t) {
  if (r = v(r), r = Array.from(r).map(v), t = v(t), Array.isArray(t)) {
    const e = t;
    for (const n of e)
      if (be(r, n))
        return !0;
    return !1;
  }
  for (const e of r)
    if (at(e, t))
      return !0;
  return !1;
}
function lr(r, t) {
  const e = r.findIndex((n) => at(n, t));
  return e >= 0 && r.splice(e, 1), r;
}
function hr(r, t) {
  const e = r.find((n) => at(n, t));
  return typeof e > "u" ? null : e;
}
function dr(r, t) {
  return r.findIndex((e) => at(e, t));
}
function mr(r, t) {
  return r.filter((e) => e["@type"] === t);
}
function yr(r) {
  Object.assign(r, r.map((t) => C(t)));
}
function gr(r, t) {
  return r = v(r), zt(r), Object.assign({ "@id": r["@id"], "@type": r["@type"] }, t);
}
class kt extends Error {
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
class $e {
  constructor() {
    m(this, "id");
    m(this, "propertyPath");
    m(this, "message");
    m(this, "code");
    this.id = ee();
  }
}
class we extends kt {
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
    this._violations = e.map((n) => Object.assign(new $e(), n));
  }
  getPropertyPaths() {
    return [...new Set(this.violations.map(({ propertyPath: e }) => e))];
  }
  getViolations(e) {
    const n = Array.from(arguments);
    return n.length === 0 ? this.violations : Z(n[0]) ? this.violations.filter((s) => Z(s.propertyPath)) : this.violations.filter((s) => e === s.propertyPath);
  }
}
class Se {
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
function ze(r) {
  if (typeof r != "object" || r == null)
    throw Error("Invalid object.");
  return Object.keys(r).forEach((t) => delete r[t]), r;
}
function xt(r) {
  return it(r) ? C(r) : r;
}
function Oe(r) {
  const t = et(r), e = Object.keys(t);
  for (const n of e) {
    const s = t[n];
    Array.isArray(s) ? t[n] = s.map((i) => xt(i)) : typeof s == "object" && s != null && (t[n] = xt(s));
  }
  return t;
}
function Mt(r, t) {
  return r = ze(r), Object.assign(r, t);
}
function pr(r) {
  const t = Rt(), e = W(v(r)), n = tt(et(v(r))), s = dt(() => !it(v(n))), i = W(!1), a = dt(() => JSON.stringify(v(n)) !== JSON.stringify(v(e)));
  return { item: n, isUnsavedDraft: a, isCreationMode: s, isSubmitting: i, reset: (w) => Mt(n, et(v(w ?? r))), submit: async (w) => {
    ut(w) && (w = v(w));
    try {
      i.value = !0;
      const M = await t.upsertItem(Oe(w ?? n));
      return e.value = M, Mt(n, et(M)), M;
    } finally {
      i.value = !1;
    }
  } };
}
function vr() {
  const r = W([]), t = (i) => {
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
    const d = i.querySelector(`[name='${a}']`);
    d == null || d.setCustomValidity(c), d || r.value.push({ propertyPath: a, message: c });
  };
  return { resetValidity: t, bindViolations: n, unmappedViolations: r, validate: e };
}
let pt;
const Te = 1, De = 2;
class je {
  constructor(t, e) {
    m(this, "readyState", Te);
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
    this.readyState = De;
  }
  triggerEvent(t) {
    this.onmessage(t);
  }
  triggerError(t) {
    this.onerror(t);
  }
}
const xe = () => {
  var r, t, e;
  return typeof process < "u" && ((r = process == null ? void 0 : process.env) == null ? void 0 : r.NODE_ENV) === "test" || ((e = (t = import.meta) == null ? void 0 : t.env) == null ? void 0 : e.NODE_ENV) === "test";
};
xe() ? pt = je : pt = window.EventSource;
const Me = pt, br = (r, t) => {
  const e = new Ee(r, t);
  return Object.assign(e, {
    install(n) {
      n.provide("mercure", e);
    }
  });
}, Ie = () => Et("mercure");
function Pe(r, t) {
  return r.length === t.length && r.every((e) => t.includes(e));
}
class Ee {
  constructor(t, e = {}) {
    m(this, "hub");
    m(this, "options");
    m(this, "connection");
    m(this, "subscribedTopics");
    m(this, "endpoint");
    m(this, "emitter");
    m(this, "lastEventId");
    Object.assign(this, { hub: t, options: tt(e) }), this.lastEventId = W(), this.subscribedTopics = W([]), this.endpoint = dt(() => {
      const n = new URL(this.hub), s = v(this.subscribedTopics);
      return s.includes("*") ? n.searchParams.append("topic", "*") : s.forEach((i) => n.searchParams.append("topic", i)), v(this.lastEventId) && n.searchParams.append("Last-Event-ID", v(this.lastEventId)), n.toString();
    }), this.emitter = re();
  }
  subscribe(t = ["*"], e = !0) {
    Array.isArray(t) || (t = [t]);
    const n = Array.from(v(this.subscribedTopics)), s = [.../* @__PURE__ */ new Set([...v(this.subscribedTopics), ...t])];
    this.subscribedTopics.value = s, e && !Pe(n, s) && this.listen();
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
    this.stop(), this.connection = new Me(v(this.endpoint), this.options), this.connection.onopen = () => this.emitter.emit("open", { endpoint: v(this.endpoint) }), this.connection.onmessage = (t) => (this.lastEventId.value = t.lastEventId, this.emitter.emit("message", t)), this.connection.onerror = (t) => {
      this.emitter.emit("error", t), typeof this.options.reconnectInterval == "number" && (this.stop(), setTimeout(() => this.connect(), this.options.reconnectInterval));
    };
  }
  stop() {
    var t;
    (t = this.connection) == null || t.close(), this.connection = void 0;
  }
}
const Lt = (r, t) => Object.assign(t, r), Ht = () => {
};
function Ae(r, t, e = ["*"], n = Lt, s = Ht) {
  Array.isArray(t) || (t = [t]), Array.isArray(e) || (e = [e]);
  const i = (a) => {
    try {
      const c = JSON.parse(a.data);
      if (!it(c))
        return;
      if (Object.keys(c).length === 1) {
        s(C(c));
        return;
      }
      for (const d of t)
        at(C(c), d) && n(c, v(d));
    } catch (c) {
      console.debug(c);
    }
  };
  return r.addListener(i), r.subscribe(e), i;
}
const Ce = (r, t, e) => {
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
        if (typeof ne(a).fromUri(C(i)) < "u") {
          e(i);
          break;
        }
    } catch (a) {
      console.error(a);
    }
  };
  return r.addListener(n), r.subscribe(t), n;
}, $r = (r, t = { removeListenersOnUnmount: !0 }) => {
  r = r ?? Ie();
  const e = [];
  return t.removeListenersOnUnmount && Wt(() => {
    for (const s of e)
      r.removeListener(s);
  }), {
    synchronize: (s, i = ["*"], a = Lt, c = Ht) => {
      const d = Ae(r, s, i, a, c);
      return e.push(d), d;
    },
    on(s, i) {
      const a = Ce(r, s, i);
      return e.push(a), a;
    }
  };
}, Ye = {
  "hydra:Collection": Se,
  "hydra:Error": kt,
  ConstraintViolationList: we
};
function vt(r, t, e = /* @__PURE__ */ new WeakMap()) {
  var i;
  if (r = mt(r), t = mt(t), Object.is(r, t))
    return !0;
  if (typeof r != "object" || typeof t != "object" || r === null || t === null)
    return !1;
  if ((i = e.get(r)) != null && i.has(t))
    return !0;
  if (e.has(r) || e.set(r, /* @__PURE__ */ new Set()), e.get(r).add(t), Array.isArray(r) || Array.isArray(t))
    return Array.isArray(r) && Array.isArray(t) && r.length === t.length && r.every((a, c) => vt(a, t[c], e));
  const n = Object.prototype.toString.call(r);
  if (n !== Object.prototype.toString.call(t) || Object.getPrototypeOf(r) !== Object.getPrototypeOf(t))
    return !1;
  if (n === "[object Date]")
    return r.getTime() === t.getTime();
  if (n !== "[object Object]")
    return !1;
  const s = Object.keys(r);
  return s.length === Object.keys(t).length && s.every((a) => Object.prototype.hasOwnProperty.call(t, a) && vt(r[a], t[a], e));
}
class It {
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
const Nt = (r, t) => t in r && Object.prototype.hasOwnProperty.call(r, t), lt = (r, t) => Nt(r, t) ? r[t] : null, Pt = async (r) => {
  const t = Bt(), e = W(!1);
  let n = !1, s;
  const i = t.run(() => Qt(
    async () => (n = !1, r()),
    void 0,
    {
      evaluating: e,
      onError: (a) => {
        n = !0, s = a;
      }
    }
  ));
  if (await Tt(e).toBe(!0), await Tt(e).toBe(!1), n)
    throw t.stop(), s;
  return i;
}, _e = function(r) {
  throw r;
};
class wr {
  constructor(t, e = {}) {
    m(this, "api");
    m(this, "endpoints");
    m(this, "classmap");
    this.api = t;
    const { endpoints: n, classmap: s } = e;
    this.endpoints = new pe(n ?? {}), this.classmap = { ...Ye, ...s }, this.errorHandler = e.errorHandler ?? _e;
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
    const n = C(e);
    if (!Nt(t.items, n))
      t.items[n] = W(e);
    else {
      const s = t.items[n], i = mt(s);
      for (const a of Object.keys(e))
        (!(a in i) || !vt(i[a], e[a])) && (s[a] = e[a]);
    }
    return t.items[n];
  }
  removeItem({ state: t }, e) {
    const n = C(e);
    delete t.items[n];
  }
  async clearItems({ state: t }) {
    t.items = tt(new It());
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
    let s = new st(C(e));
    n != null && n.groups && (s = s.withQuery(`${new ct(s.getQuery()).withParam("groups", n.groups)}`));
    let i = await this.handle(() => this.api.get(`${s}`, n), n);
    return i === void 0 ? void 0 : (i = this.factory(i), (n == null ? void 0 : n.store) ?? !0 ? this.storeItem({ state: t }, i) : i);
  }
  async getItem({ state: t }, e, n) {
    if (e === null)
      return null;
    const s = C(e), i = lt(t.items, s);
    return i ?? await this.fetchItem({ state: t }, s, n);
  }
  async fetchCollection({ state: t }, e, n) {
    let s = new st(`${e}`);
    n != null && n.groups && (s = s.withQuery(`${new ct(s.getQuery()).withParam("groups", n.groups)}`));
    const i = await this.handle(() => this.api.get(`${s}`, n), n);
    if (i === void 0)
      return;
    i["hydra:member"] = i["hydra:member"].map((d) => this.factory(d));
    const a = this.factory(i);
    if ((n == null ? void 0 : n.store) ?? !1)
      for (const d of a["hydra:member"])
        this.storeItem({ state: t }, d);
    return a;
  }
  async createItem({ state: t }, e, n) {
    const s = this.endpoints.for(e);
    return e = await this.handle(() => this.api.post(s, e, n), n), e === void 0 ? void 0 : (n == null ? void 0 : n.store) ?? !0 ? this.storeItem({ state: t }, e) : e;
  }
  async updateItem({ state: t }, e, n) {
    return zt(e), e = await this.handle(() => this.api.put(C(e), e, n), n), e === void 0 ? void 0 : (n == null ? void 0 : n.store) ?? !0 ? this.storeItem({ state: t }, e) : e;
  }
  async upsertItem({ state: t }, e, n) {
    return it(e) ? this.updateItem({ state: t }, e, n) : this.createItem({ state: t }, e, n);
  }
  async deleteItem({ state: t }, e, n) {
    const s = C(e);
    await this.handle(() => this.api.delete(s, n), n), e = lt(t.items, s), e !== null && this.removeItem({ state: t }, e);
  }
  async getRelation({ state: t }, e, n = {}) {
    if (e === null)
      return null;
    if (typeof e == "function")
      return Pt(() => this.getRelation({ state: t }, e(), n));
    const s = (n.useExisting ?? !0) !== !1;
    if (s && (typeof v(e) == "string" || it(e))) {
      const i = lt(t.items, C(e));
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
    return typeof e == "function" ? Pt(() => this.getRelations({ state: t }, e(), n)) : Promise.all(e.map((s) => this.getRelation({ state: t }, s, n)));
  }
  async install(t) {
    t.state.items = tt(new It()), t.state.endpoints = ht(this.endpoints), t.state.classmap = ht(this.classmap), t.storeItem = (e) => this.storeItem(t, e), t.removeItem = (e) => this.removeItem(t, e), t.clearItems = () => this.clearItems(t), t.getItem = (e, n) => this.getItem(t, e, n), t.fetchItem = (e, n) => this.fetchItem(t, e, n), t.fetchCollection = (e, n) => this.fetchCollection(t, e, n), t.createItem = (e, n) => this.createItem(t, e, n), t.updateItem = (e, n) => this.updateItem(t, e, n), t.upsertItem = (e, n) => this.upsertItem(t, e, n), t.deleteItem = (e, n) => this.deleteItem(t, e, n), t.getRelation = (e, n) => this.getRelation(t, e, n), t.getRelations = (e, n) => this.getRelations(t, e, n), t.endpoint = (e) => t.state.endpoints[e], t.getItemsByType = (e) => t.state.items.filter((n) => e === n["@type"]), t.factory = (e, n) => (n = n ?? e, typeof e == "string" && (n["@type"] = e), this.factory(n));
  }
}
function Vt(r) {
  if (typeof r == "string")
    return r;
  try {
    return C(r);
  } catch {
    return null;
  }
}
function Ue(r) {
  return r.map((t) => Vt(t));
}
async function Ft(r, t) {
  try {
    return await t.getItem(r);
  } catch {
    return null;
  }
}
async function Re(r, t) {
  return Promise.all(r.map((e) => Ft(e, t)));
}
class Sr extends J {
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
    return this.multiple || this.items.length > 1 ? Ue(this.items) : Vt(this.item);
  }
  async denormalize(e) {
    if (Array.isArray(e)) {
      this.items = await Re(e, this.store);
      return;
    }
    this.items = [await Ft(e, this.store)];
  }
}
const ke = {
  asc: "desc",
  desc: "asc"
};
class zr extends J {
  constructor(e = {}) {
    super();
    m(this, "order");
    this.order = e;
  }
  revert() {
    const e = {};
    for (const n in this.order) {
      const s = this.order[n];
      e[n] = ke[s] ?? s;
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
class Or extends J {
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
class Tr extends J {
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
class Dr extends J {
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
function jr({ itemsPerPage: r, currentPage: t, totalItems: e }) {
  return e == null ? new Ne({ itemsPerPage: r, currentPage: t }) : new He({ itemsPerPage: r, currentPage: t, totalItems: e });
}
function Le(r) {
  return Array.from({ length: r }, (t, e) => e + 1);
}
class Ot {
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
    return this._pages === void 0 && (this._pages = Le(this.lastPage)), this._pages;
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
    return new Ve(this, t, e);
  }
}
class He extends Ot {
  constructor({ itemsPerPage: t, currentPage: e, totalItems: n }) {
    super({ itemsPerPage: t, currentPage: e }), this.totalItems = parseInt(n), this.lastPage = Math.max(1, Math.ceil(this.totalItems / Math.max(1, this.itemsPerPage))), this.nextPage = Math.min(this.lastPage, this.currentPage + 1);
  }
}
class Ne extends Ot {
  constructor({ itemsPerPage: t, currentPage: e, totalItems: n }) {
    super({ itemsPerPage: t, currentPage: e, totalItems: n }), this.nextPage = this.lastPage = this.currentPage + 1;
  }
}
class Ve extends Ot {
  constructor(t, e, n = !1) {
    super(t), Object.assign(this, t);
    const s = [];
    n && s.push(1);
    for (let i = 1; i <= this.lastPage; i++)
      i === this.currentPage && s.push(i), i < this.currentPage && i >= this.currentPage - e && s.push(i), i > this.currentPage && i <= this.currentPage + e && s.push(i);
    n && s.push(this.lastPage), this._pages = [...new Set(s)];
  }
}
class Fe {
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
function xr({ fields: r, preload: t } = {}) {
  return Object.assign(new Fe(), { fields: r }, { preload: t }).headers;
}
export {
  ie as AbortError,
  rr as ApiClient,
  sr as ArrayFilter,
  we as ConstraintViolationList,
  me as DateRangeFilter,
  ye as DatetimeRangeFilter,
  je as FakeEventSource,
  ir as FilterCollection,
  se as HttpError,
  Se as HydraCollection,
  St as HydraEndpoint,
  pe as HydraEndpoints,
  kt as HydraError,
  wr as HydraPlugin,
  Sr as ItemFilter,
  Ee as Mercure,
  zr as OrderFilter,
  Or as RangeFilter,
  Tr as TextFilter,
  Dr as TruthyFilter,
  $e as Violation,
  at as areSameIris,
  zt as checkValidItem,
  et as clone,
  be as containsIri,
  br as createMercure,
  jr as createPager,
  or as createStore,
  ve as getId,
  fr as getIds,
  C as getIri,
  cr as getIris,
  hr as getItemByIri,
  dr as getItemIndexByIri,
  mr as getItemsByType,
  it as hasIri,
  Ae as mercureSync,
  yr as normalizeIris,
  Oe as normalizeItemRelations,
  Ce as on,
  gr as partialItem,
  ur as useEndpoint,
  ar as useFilters,
  vr as useFormValidation,
  pr as useItemForm,
  Ie as useMercure,
  $r as useMercureSync,
  Rt as useStore,
  xr as vulcain,
  nr as withoutDuplicates,
  lr as withoutIri
};
