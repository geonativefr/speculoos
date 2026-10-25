var Ft = Object.defineProperty;
var qt = (r, t, e) => t in r ? Ft(r, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : r[t] = e;
var m = (r, t, e) => (qt(r, typeof t != "symbol" ? t + "" : t, e), e);
import { whenever as Zt } from "@vueuse/core";
import { unref as v, isRef as ut, ref as W, reactive as tt, readonly as ht, inject as Pt, computed as dt, onUnmounted as Jt, toRaw as mt, effectScope as Qt, watchEffect as Wt } from "vue";
import Tt from "clone-deep";
import Bt from "md5";
import Z from "is-empty";
import { useRoute as Gt, useRouter as Kt, onBeforeRouteUpdate as Xt } from "vue-router";
import { URI as st, QueryString as ct } from "psr7-js";
import { v4 as te } from "uuid";
import ee from "mitt";
import re from "uri-templates";
class ne extends Error {
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
class se extends Error {
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
}, Dt = (...r) => {
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
}, ie = {
  Accept: "application/ld+json, application/json"
}, ae = async (r) => {
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
}, lt = /* @__PURE__ */ new WeakMap(), yt = (r) => (lt.has(r) || lt.set(r, ae(r)), lt.get(r));
class er {
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
      Object.keys(s).includes("headers") && (s.headers = Dt(e.headers, s.headers)), e = { ...Tt(e), ...Tt(s) };
    }
    return e;
  }
  async request(t, e, n) {
    e = `${v(e)}`, n = this.mergeOptions({ method: t }, n), Object.keys(n).includes("headers") && (n.headers = new Headers(Dt(ie, n.headers)));
    let s = () => {
    };
    try {
      if (ut(n == null ? void 0 : n.isLoading) && (n.isLoading.value = !0), ut(n == null ? void 0 : n.aborted)) {
        const i = new AbortController(), { signal: a } = i;
        n.signal = a, s = Zt(n.aborted, () => i.abort(), { immediate: !0 });
      }
      try {
        const i = await this.fetch(e, n);
        return ne.guard(i);
      } catch (i) {
        throw i.name === "AbortError" ? new se(i.reason) : i;
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
const oe = (r) => (r == null ? void 0 : r.signal) == null && ((r == null ? void 0 : r.body) == null || typeof r.body == "string"), ue = (r, t) => {
  const e = bt(t == null ? void 0 : t.headers) ?? {}, n = Object.keys(e).map((s) => [s.toLowerCase(), `${e[s]}`]).sort(([s], [i]) => s < i ? -1 : s > i ? 1 : 0);
  return Bt(JSON.stringify({
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
class ce {
  constructor(t = ((e) => (e = window.fetch) == null ? void 0 : e.bind(window))()) {
    m(this, "fetch");
    m(this, "pendingRequests", []);
    return this.fetch = t, (n, s) => {
      if (!oe(s))
        return this.fetch(n, s).then(yt);
      const i = ue(n, s), a = this.pendingRequests.findIndex((f) => i === f.hash);
      if (a >= 0)
        return this.pendingRequests[a].promise;
      const u = this.fetch(n, s).then(yt);
      return this.pendingRequests.push({ hash: i, promise: u }), u.then(
        (f) => (this.removePendingRequest(i), f),
        (f) => {
          throw this.removePendingRequest(i), f;
        }
      );
    };
  }
  removePendingRequest(t) {
    const e = this.pendingRequests.findIndex((n) => t === n.hash);
    e >= 0 && this.pendingRequests.splice(e, 1);
  }
}
function rr(r = void 0) {
  return new ce(r);
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
class nr extends J {
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
var Et = { exports: {} };
(function(r, t) {
  (function(e, n) {
    r.exports = n();
  })($t, function() {
    var e = 1e3, n = 6e4, s = 36e5, i = "millisecond", a = "second", u = "minute", f = "hour", b = "day", D = "week", I = "month", z = "quarter", T = "year", w = "date", h = "Invalid Date", S = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/, C = /\[([^\]]+)]|YYYY|YY|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g, P = { name: "en", weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"), months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"), ordinal: function(y) {
      var l = ["th", "st", "nd", "rd"], o = y % 100;
      return "[" + y + (l[(o - 20) % 10] || l[o] || l[0]) + "]";
    } }, j = function(y, l, o) {
      var d = String(y);
      return !d || d.length >= l ? y : "" + Array(l + 1 - d.length).join(o) + y;
    }, L = { s: j, z: function(y) {
      var l = -y.utcOffset(), o = Math.abs(l), d = Math.floor(o / 60), c = o % 60;
      return (l <= 0 ? "+" : "-") + j(d, 2, "0") + ":" + j(c, 2, "0");
    }, m: function y(l, o) {
      if (l.date() < o.date())
        return -y(o, l);
      var d = 12 * (o.year() - l.year()) + (o.month() - l.month()), c = l.clone().add(d, I), g = o - c < 0, p = l.clone().add(d + (g ? -1 : 1), I);
      return +(-(d + (o - c) / (g ? c - p : p - c)) || 0);
    }, a: function(y) {
      return y < 0 ? Math.ceil(y) || 0 : Math.floor(y);
    }, p: function(y) {
      return { M: I, y: T, w: D, d: b, D: w, h: f, m: u, s: a, ms: i, Q: z }[y] || String(y || "").toLowerCase().replace(/s$/, "");
    }, u: function(y) {
      return y === void 0;
    } }, E = "en", R = {};
    R[E] = P;
    var V = "$isDayjsObject", F = function(y) {
      return y instanceof q || !(!y || !y[V]);
    }, H = function y(l, o, d) {
      var c;
      if (!l)
        return E;
      if (typeof l == "string") {
        var g = l.toLowerCase();
        R[g] && (c = g), o && (R[g] = o, c = g);
        var p = l.split("-");
        if (!c && p.length > 1)
          return y(p[0]);
      } else {
        var O = l.name;
        R[O] = l, c = O;
      }
      return !d && c && (E = c), c || !d && E;
    }, x = function(y, l) {
      if (F(y))
        return y.clone();
      var o = typeof l == "object" ? l : {};
      return o.date = y, o.args = arguments, new q(o);
    }, $ = L;
    $.l = H, $.i = F, $.w = function(y, l) {
      return x(y, { locale: l.$L, utc: l.$u, x: l.$x, $offset: l.$offset });
    };
    var q = function() {
      function y(o) {
        this.$L = H(o.locale, null, !0), this.parse(o), this.$x = this.$x || o.x || {}, this[V] = !0;
      }
      var l = y.prototype;
      return l.parse = function(o) {
        this.$d = function(d) {
          var c = d.date, g = d.utc;
          if (c === null)
            return /* @__PURE__ */ new Date(NaN);
          if ($.u(c))
            return /* @__PURE__ */ new Date();
          if (c instanceof Date)
            return new Date(c);
          if (typeof c == "string" && !/Z$/i.test(c)) {
            var p = c.match(S);
            if (p) {
              var O = p[2] - 1 || 0, M = (p[7] || "0").substring(0, 3);
              return g ? new Date(Date.UTC(p[1], O, p[3] || 1, p[4] || 0, p[5] || 0, p[6] || 0, M)) : new Date(p[1], O, p[3] || 1, p[4] || 0, p[5] || 0, p[6] || 0, M);
            }
          }
          return new Date(c);
        }(o), this.init();
      }, l.init = function() {
        var o = this.$d;
        this.$y = o.getFullYear(), this.$M = o.getMonth(), this.$D = o.getDate(), this.$W = o.getDay(), this.$H = o.getHours(), this.$m = o.getMinutes(), this.$s = o.getSeconds(), this.$ms = o.getMilliseconds();
      }, l.$utils = function() {
        return $;
      }, l.isValid = function() {
        return this.$d.toString() !== h;
      }, l.isSame = function(o, d) {
        var c = x(o);
        return this.startOf(d) <= c && c <= this.endOf(d);
      }, l.isAfter = function(o, d) {
        return x(o) < this.startOf(d);
      }, l.isBefore = function(o, d) {
        return this.endOf(d) < x(o);
      }, l.$g = function(o, d, c) {
        return $.u(o) ? this[d] : this.set(c, o);
      }, l.unix = function() {
        return Math.floor(this.valueOf() / 1e3);
      }, l.valueOf = function() {
        return this.$d.getTime();
      }, l.startOf = function(o, d) {
        var c = this, g = !!$.u(d) || d, p = $.p(o), O = function(G, k) {
          var Q = $.w(c.$u ? Date.UTC(c.$y, k, G) : new Date(c.$y, k, G), c);
          return g ? Q : Q.endOf(b);
        }, M = function(G, k) {
          return $.w(c.toDate()[G].apply(c.toDate("s"), (g ? [0, 0, 0, 0] : [23, 59, 59, 999]).slice(k)), c);
        }, A = this.$W, _ = this.$M, N = this.$D, X = "set" + (this.$u ? "UTC" : "");
        switch (p) {
          case T:
            return g ? O(1, 0) : O(31, 11);
          case I:
            return g ? O(1, _) : O(0, _ + 1);
          case D:
            var B = this.$locale().weekStart || 0, rt = (A < B ? A + 7 : A) - B;
            return O(g ? N - rt : N + (6 - rt), _);
          case b:
          case w:
            return M(X + "Hours", 0);
          case f:
            return M(X + "Minutes", 1);
          case u:
            return M(X + "Seconds", 2);
          case a:
            return M(X + "Milliseconds", 3);
          default:
            return this.clone();
        }
      }, l.endOf = function(o) {
        return this.startOf(o, !1);
      }, l.$set = function(o, d) {
        var c, g = $.p(o), p = "set" + (this.$u ? "UTC" : ""), O = (c = {}, c[b] = p + "Date", c[w] = p + "Date", c[I] = p + "Month", c[T] = p + "FullYear", c[f] = p + "Hours", c[u] = p + "Minutes", c[a] = p + "Seconds", c[i] = p + "Milliseconds", c)[g], M = g === b ? this.$D + (d - this.$W) : d;
        if (g === I || g === T) {
          var A = this.clone().set(w, 1);
          A.$d[O](M), A.init(), this.$d = A.set(w, Math.min(this.$D, A.daysInMonth())).$d;
        } else
          O && this.$d[O](M);
        return this.init(), this;
      }, l.set = function(o, d) {
        return this.clone().$set(o, d);
      }, l.get = function(o) {
        return this[$.p(o)]();
      }, l.add = function(o, d) {
        var c, g = this;
        o = Number(o);
        var p = $.p(d), O = function(_) {
          var N = x(g);
          return $.w(N.date(N.date() + Math.round(_ * o)), g);
        };
        if (p === I)
          return this.set(I, this.$M + o);
        if (p === T)
          return this.set(T, this.$y + o);
        if (p === b)
          return O(1);
        if (p === D)
          return O(7);
        var M = (c = {}, c[u] = n, c[f] = s, c[a] = e, c)[p] || 1, A = this.$d.getTime() + o * M;
        return $.w(A, this);
      }, l.subtract = function(o, d) {
        return this.add(-1 * o, d);
      }, l.format = function(o) {
        var d = this, c = this.$locale();
        if (!this.isValid())
          return c.invalidDate || h;
        var g = o || "YYYY-MM-DDTHH:mm:ssZ", p = $.z(this), O = this.$H, M = this.$m, A = this.$M, _ = c.weekdays, N = c.months, X = c.meridiem, B = function(k, Q, nt, ot) {
          return k && (k[Q] || k(d, g)) || nt[Q].slice(0, ot);
        }, rt = function(k) {
          return $.s(O % 12 || 12, k, "0");
        }, G = X || function(k, Q, nt) {
          var ot = k < 12 ? "AM" : "PM";
          return nt ? ot.toLowerCase() : ot;
        };
        return g.replace(C, function(k, Q) {
          return Q || function(nt) {
            switch (nt) {
              case "YY":
                return String(d.$y).slice(-2);
              case "YYYY":
                return $.s(d.$y, 4, "0");
              case "M":
                return A + 1;
              case "MM":
                return $.s(A + 1, 2, "0");
              case "MMM":
                return B(c.monthsShort, A, N, 3);
              case "MMMM":
                return B(N, A);
              case "D":
                return d.$D;
              case "DD":
                return $.s(d.$D, 2, "0");
              case "d":
                return String(d.$W);
              case "dd":
                return B(c.weekdaysMin, d.$W, _, 2);
              case "ddd":
                return B(c.weekdaysShort, d.$W, _, 3);
              case "dddd":
                return _[d.$W];
              case "H":
                return String(O);
              case "HH":
                return $.s(O, 2, "0");
              case "h":
                return rt(1);
              case "hh":
                return rt(2);
              case "a":
                return G(O, M, !0);
              case "A":
                return G(O, M, !1);
              case "m":
                return String(M);
              case "mm":
                return $.s(M, 2, "0");
              case "s":
                return String(d.$s);
              case "ss":
                return $.s(d.$s, 2, "0");
              case "SSS":
                return $.s(d.$ms, 3, "0");
              case "Z":
                return p;
            }
            return null;
          }(k) || p.replace(":", "");
        });
      }, l.utcOffset = function() {
        return 15 * -Math.round(this.$d.getTimezoneOffset() / 15);
      }, l.diff = function(o, d, c) {
        var g, p = this, O = $.p(d), M = x(o), A = (M.utcOffset() - this.utcOffset()) * n, _ = this - M, N = function() {
          return $.m(p, M);
        };
        switch (O) {
          case T:
            g = N() / 12;
            break;
          case I:
            g = N();
            break;
          case z:
            g = N() / 3;
            break;
          case D:
            g = (_ - A) / 6048e5;
            break;
          case b:
            g = (_ - A) / 864e5;
            break;
          case f:
            g = _ / s;
            break;
          case u:
            g = _ / n;
            break;
          case a:
            g = _ / e;
            break;
          default:
            g = _;
        }
        return c ? g : $.a(g);
      }, l.daysInMonth = function() {
        return this.endOf(I).$D;
      }, l.$locale = function() {
        return R[this.$L];
      }, l.locale = function(o, d) {
        if (!o)
          return this.$L;
        var c = this.clone(), g = H(o, d, !0);
        return g && (c.$L = g), c;
      }, l.clone = function() {
        return $.w(this.$d, this);
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
    return x.prototype = K, [["$ms", i], ["$s", a], ["$m", u], ["$H", f], ["$W", b], ["$M", I], ["$y", T], ["$D", w]].forEach(function(y) {
      K[y[1]] = function(l) {
        return this.$g(l, y[0], y[1]);
      };
    }), x.extend = function(y, l) {
      return y.$i || (y(l, q, x), y.$i = !0), x;
    }, x.locale = H, x.isDayjs = F, x.unix = function(y) {
      return x(1e3 * y);
    }, x.en = R[E], x.Ls = R, x.p = {}, x;
  });
})(Et);
var le = Et.exports;
const U = /* @__PURE__ */ wt(le);
var At = { exports: {} };
(function(r, t) {
  (function(e, n) {
    r.exports = n();
  })($t, function() {
    var e = "minute", n = /[+-]\d\d(?::?\d\d)?/g, s = /([+-]|\d\d)/g;
    return function(i, a, u) {
      var f = a.prototype;
      u.utc = function(h) {
        var S = { date: h, utc: !0, args: arguments };
        return new a(S);
      }, f.utc = function(h) {
        var S = u(this.toDate(), { locale: this.$L, utc: !0 });
        return h ? S.add(this.utcOffset(), e) : S;
      }, f.local = function() {
        return u(this.toDate(), { locale: this.$L, utc: !1 });
      };
      var b = f.parse;
      f.parse = function(h) {
        h.utc && (this.$u = !0), this.$utils().u(h.$offset) || (this.$offset = h.$offset), b.call(this, h);
      };
      var D = f.init;
      f.init = function() {
        if (this.$u) {
          var h = this.$d;
          this.$y = h.getUTCFullYear(), this.$M = h.getUTCMonth(), this.$D = h.getUTCDate(), this.$W = h.getUTCDay(), this.$H = h.getUTCHours(), this.$m = h.getUTCMinutes(), this.$s = h.getUTCSeconds(), this.$ms = h.getUTCMilliseconds();
        } else
          D.call(this);
      };
      var I = f.utcOffset;
      f.utcOffset = function(h, S) {
        var C = this.$utils().u;
        if (C(h))
          return this.$u ? 0 : C(this.$offset) ? I.call(this) : this.$offset;
        if (typeof h == "string" && (h = function(E) {
          E === void 0 && (E = "");
          var R = E.match(n);
          if (!R)
            return null;
          var V = ("" + R[0]).match(s) || ["-", 0, 0], F = V[0], H = 60 * +V[1] + +V[2];
          return H === 0 ? 0 : F === "+" ? H : -H;
        }(h), h === null))
          return this;
        var P = Math.abs(h) <= 16 ? 60 * h : h;
        if (P === 0)
          return this.utc(S);
        var j = this.clone();
        if (S)
          return j.$offset = P, j.$u = !1, j;
        var L = this.$u ? this.toDate().getTimezoneOffset() : -1 * this.utcOffset();
        return (j = this.local().add(P + L, e)).$offset = P, j.$x.$localOffset = L, j;
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
      var T = f.toDate;
      f.toDate = function(h) {
        return h === "s" && this.$offset ? u(this.format("YYYY-MM-DD HH:mm:ss:SSS")).toDate() : T.call(this);
      };
      var w = f.diff;
      f.diff = function(h, S, C) {
        if (h && this.$u === h.$u)
          return w.call(this, h, S, C);
        var P = this.local(), j = u(h).local();
        return w.call(P, j, S, C);
      };
    };
  });
})(At);
var fe = At.exports;
const Ct = /* @__PURE__ */ wt(fe);
var Yt = { exports: {} };
(function(r, t) {
  (function(e, n) {
    r.exports = n();
  })($t, function() {
    var e = { year: 0, month: 1, day: 2, hour: 3, minute: 4, second: 5 }, n = {};
    return function(s, i, a) {
      var u, f = function(z, T, w) {
        w === void 0 && (w = {});
        var h = new Date(z), S = function(C, P) {
          P === void 0 && (P = {});
          var j = P.timeZoneName || "short", L = C + "|" + j, E = n[L];
          return E || (E = new Intl.DateTimeFormat("en-US", { hour12: !1, timeZone: C, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: j }), n[L] = E), E;
        }(T, w);
        return S.formatToParts(h);
      }, b = function(z, T) {
        for (var w = f(z, T), h = [], S = 0; S < w.length; S += 1) {
          var C = w[S], P = C.type, j = C.value, L = e[P];
          L >= 0 && (h[L] = parseInt(j, 10));
        }
        var E = h[3], R = E === 24 ? 0 : E, V = h[0] + "-" + h[1] + "-" + h[2] + " " + R + ":" + h[4] + ":" + h[5] + ":000", F = +z;
        return (a.utc(V).valueOf() - (F -= F % 1e3)) / 6e4;
      }, D = i.prototype;
      D.tz = function(z, T) {
        if (z === void 0 && (z = u), !this.isValid())
          return this;
        var w, h = this.utcOffset(), S = this.toDate(), C = S.toLocaleString("en-US", { timeZone: z }), P = b(+S, z);
        if (!Number(P))
          w = this.utcOffset(0, T);
        else if (w = a(C, { locale: this.$L }).$set("millisecond", this.$ms).utcOffset(P, !0), T) {
          var j = w.utcOffset();
          w = w.add(h - j, "minute");
        }
        return w.$x.$timezone = z, w;
      }, D.offsetName = function(z) {
        var T = this.$x.$timezone || a.tz.guess(), w = f(this.valueOf(), T, { timeZoneName: z }).find(function(h) {
          return h.type.toLowerCase() === "timezonename";
        });
        return w && w.value;
      };
      var I = D.startOf;
      D.startOf = function(z, T) {
        if (!this.$x || !this.$x.$timezone)
          return I.call(this, z, T);
        var w = a(this.format("YYYY-MM-DD HH:mm:ss:SSS"), { locale: this.$L });
        return I.call(w, z, T).tz(this.$x.$timezone, !0);
      }, a.tz = function(z, T, w) {
        var h = w && T, S = w || T || u, C = b(+a(), S);
        if (typeof z != "string")
          return a(z).tz(S);
        var P = a.utc(z, h).valueOf();
        if (Number.isNaN(P)) {
          var j = a(NaN);
          return j.$x.$timezone = S, j;
        }
        var L = function(F, H, x) {
          var $ = F - 60 * H * 1e3, q = b($, x);
          if (H === q)
            return [$, H];
          var K = b($ -= 60 * (q - H) * 1e3, x);
          return q === K ? [$, q] : [F - 60 * Math.min(q, K) * 1e3, Math.max(q, K)];
        }(P, C, S), E = L[0], R = L[1], V = a(E).utcOffset(R);
        return V.$x.$timezone = S, V;
      }, a.tz.guess = function() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      }, a.tz.setDefault = function(z) {
        u = z;
      };
    };
  });
})(Yt);
var he = Yt.exports;
const _t = /* @__PURE__ */ wt(he);
U.extend(Ct);
U.extend(_t);
class de extends J {
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
m(de, "userTimezone");
U.extend(Ct);
U.extend(_t);
class me extends J {
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
m(me, "userTimezone");
function ye(r) {
  return r == null ? !0 : typeof r == "string" ? r.trim().length === 0 : typeof r == "function" || Array.isArray(r) ? r.length === 0 : r instanceof Object ? Object.keys(r).length === 0 : !1;
}
function gt(r) {
  if (!(r instanceof Object))
    return r;
  if (Array.isArray(r))
    return r.map(gt);
  const t = { ...r };
  return Object.keys(t).forEach((e) => {
    t[e] instanceof Object && (t[e] = gt(t[e])), ye(t[e]) && delete t[e];
  }), t;
}
class sr {
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
async function ir(r = {}, t = {
  preserveQuery: !1,
  targetRoute: void 0
}) {
  if (typeof r != "function")
    throw Error("initialState should be provided as a function.");
  const e = Gt(), n = Kt(), s = W(r());
  async function i(b) {
    Object.assign(v(s), await v(s).denormalize(b.query));
  }
  function a() {
    s.value = et(r());
  }
  function u(b = {}) {
    const D = {};
    return t.preserveQuery === !0 && Object.assign(D, e.query), Object.assign(D, v(s).normalize(), b);
  }
  async function f(b = {}) {
    const D = v(t.targetRoute) ?? e;
    await n.push(Object.assign({ ...D }, { query: u(b) }));
  }
  return Xt((b) => i(b)), await i(e), {
    filters: s,
    buildQueryParams: u,
    submit: f,
    clear: a
  };
}
const ar = async ({ state: r = {}, methods: t = {}, name: e = "store" } = {}) => {
  r = tt(r);
  const n = [], s = {
    name: e,
    state: r,
    ...Object.keys(t).reduce(function(i, a) {
      const u = t[a];
      return i[a] = function() {
        return u(r, ...arguments);
      }, i;
    }, {}),
    async use(i) {
      return n.push(i), await i.install(this), this;
    },
    async reconciliate(i = !1) {
      const a = n.filter(({ reconciliate: u }) => typeof u == "function");
      if (i === !1)
        return Promise.all(a.map((u) => u.reconciliate(this)));
      for (const u of a)
        await u.reconciliate(this);
    }
  };
  return s.install = (i) => i.provide(e, { ...s, state: ht(r) }), s;
}, Ut = (r = "store") => Pt(r);
class ge {
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
const or = (r, t) => Ut(t).state.endpoints[r];
function it(r) {
  return r = v(r), r == null ? !1 : Object.keys(r).includes("@id") && r["@id"] != null;
}
function Y(r) {
  return r = v(r), r === null ? null : typeof r == "string" ? r : (zt(r), r["@id"]);
}
function pe(r) {
  const t = Y(r);
  return t.substring(t.lastIndexOf("/") + 1);
}
function ur(r) {
  return r.map(Y);
}
function cr(r) {
  return r.map(pe);
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
  return Y(r) === Y(t);
}
function ve(r, t) {
  if (r = v(r), r = Array.from(r).map(v), t = v(t), Array.isArray(t)) {
    const e = t;
    for (const n of e)
      if (ve(r, n))
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
function fr(r, t) {
  const e = r.find((n) => at(n, t));
  return typeof e > "u" ? null : e;
}
function hr(r, t) {
  return r.findIndex((e) => at(e, t));
}
function dr(r, t) {
  return r.filter((e) => e["@type"] === t);
}
function mr(r) {
  Object.assign(r, r.map((t) => Y(t)));
}
function yr(r, t) {
  return r = v(r), zt(r), Object.assign({ "@id": r["@id"], "@type": r["@type"] }, t);
}
class Rt extends Error {
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
class be {
  constructor() {
    m(this, "id");
    m(this, "propertyPath");
    m(this, "message");
    m(this, "code");
    this.id = te();
  }
}
class $e extends Rt {
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
    this._violations = e.map((n) => Object.assign(new be(), n));
  }
  getPropertyPaths() {
    return [...new Set(this.violations.map(({ propertyPath: e }) => e))];
  }
  getViolations(e) {
    const n = Array.from(arguments);
    return n.length === 0 ? this.violations : Z(n[0]) ? this.violations.filter((s) => Z(s.propertyPath)) : this.violations.filter((s) => e === s.propertyPath);
  }
}
class we {
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
function Se(r) {
  if (typeof r != "object" || r == null)
    throw Error("Invalid object.");
  return Object.keys(r).forEach((t) => delete r[t]), r;
}
function jt(r) {
  return it(r) ? Y(r) : r;
}
function ze(r) {
  const t = et(r), e = Object.keys(t);
  for (const n of e) {
    const s = t[n];
    Array.isArray(s) ? t[n] = s.map((i) => jt(i)) : typeof s == "object" && s != null && (t[n] = jt(s));
  }
  return t;
}
function xt(r, t) {
  return r = Se(r), Object.assign(r, t);
}
function gr(r) {
  const t = Ut(), e = W(v(r)), n = tt(et(v(r))), s = dt(() => !it(v(n))), i = W(!1), a = dt(() => JSON.stringify(v(n)) !== JSON.stringify(v(e)));
  return { item: n, isUnsavedDraft: a, isCreationMode: s, isSubmitting: i, reset: (b) => xt(n, et(v(b ?? r))), submit: async (b) => {
    ut(b) && (b = v(b));
    try {
      i.value = !0;
      const D = await t.upsertItem(ze(b ?? n));
      return e.value = D, xt(n, et(D)), D;
    } finally {
      i.value = !1;
    }
  } };
}
function pr() {
  const r = W([]), t = (i) => {
    i = v(i), i.querySelectorAll("[name]").forEach(function(a) {
      a.setCustomValidity("");
    }), r.value = [];
  }, e = (i, a = !0) => {
    i = v(i);
    const u = i.checkValidity();
    return !u && a && i.reportValidity(), u;
  }, n = (i, a) => {
    t(i), Array.from(a).forEach((u) => s(i, u)), e(i);
  }, s = (i, { propertyPath: a, message: u }) => {
    i = v(i);
    const f = i.querySelector(`[name='${a}']`);
    f == null || f.setCustomValidity(u), f || r.value.push({ propertyPath: a, message: u });
  };
  return { resetValidity: t, bindViolations: n, unmappedViolations: r, validate: e };
}
let pt;
const Oe = 1, Te = 2;
class De {
  constructor(t, e) {
    m(this, "readyState", Oe);
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
    this.readyState = Te;
  }
  triggerEvent(t) {
    this.onmessage(t);
  }
  triggerError(t) {
    this.onerror(t);
  }
}
const je = () => {
  var r, t, e;
  return typeof process < "u" && ((r = process == null ? void 0 : process.env) == null ? void 0 : r.NODE_ENV) === "test" || ((e = (t = import.meta) == null ? void 0 : t.env) == null ? void 0 : e.NODE_ENV) === "test";
};
je() ? pt = De : pt = window.EventSource;
const xe = pt, vr = (r, t) => {
  const e = new Pe(r, t);
  return Object.assign(e, {
    install(n) {
      n.provide("mercure", e);
    }
  });
}, Me = () => Pt("mercure");
function Ie(r, t) {
  return r.length === t.length && r.every((e) => t.includes(e));
}
class Pe {
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
    }), this.emitter = ee();
  }
  subscribe(t = ["*"], e = !0) {
    Array.isArray(t) || (t = [t]);
    const n = Array.from(v(this.subscribedTopics)), s = [.../* @__PURE__ */ new Set([...v(this.subscribedTopics), ...t])];
    this.subscribedTopics.value = s, e && !Ie(n, s) && this.listen();
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
    this.stop(), this.connection = new xe(v(this.endpoint), this.options), this.connection.onopen = () => this.emitter.emit("open", { endpoint: v(this.endpoint) }), this.connection.onmessage = (t) => (this.lastEventId.value = t.lastEventId, this.emitter.emit("message", t)), this.connection.onerror = (t) => {
      this.emitter.emit("error", t), typeof this.options.reconnectInterval == "number" && (this.stop(), setTimeout(() => this.connect(), this.options.reconnectInterval));
    };
  }
  stop() {
    var t;
    (t = this.connection) == null || t.close(), this.connection = void 0;
  }
}
const kt = (r, t) => Object.assign(t, r), Lt = () => {
};
function Ee(r, t, e = ["*"], n = kt, s = Lt) {
  Array.isArray(t) || (t = [t]), Array.isArray(e) || (e = [e]);
  const i = (a) => {
    try {
      const u = JSON.parse(a.data);
      if (!it(u))
        return;
      if (Object.keys(u).length === 1) {
        s(Y(u));
        return;
      }
      for (const f of t)
        at(Y(u), f) && n(u, v(f));
    } catch (u) {
      console.debug(u);
    }
  };
  return r.addListener(i), r.subscribe(e), i;
}
const Ae = (r, t, e) => {
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
        if (typeof re(a).fromUri(Y(i)) < "u") {
          e(i);
          break;
        }
    } catch (a) {
      console.error(a);
    }
  };
  return r.addListener(n), r.subscribe(t), n;
}, br = (r, t = { removeListenersOnUnmount: !0 }) => {
  r = r ?? Me();
  const e = [];
  return t.removeListenersOnUnmount && Jt(() => {
    for (const s of e)
      r.removeListener(s);
  }), {
    synchronize: (s, i = ["*"], a = kt, u = Lt) => {
      const f = Ee(r, s, i, a, u);
      return e.push(f), f;
    },
    on(s, i) {
      const a = Ae(r, s, i);
      return e.push(a), a;
    }
  };
}, Ce = {
  "hydra:Collection": we,
  "hydra:Error": Rt,
  ConstraintViolationList: $e
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
    return Array.isArray(r) && Array.isArray(t) && r.length === t.length && r.every((a, u) => vt(a, t[u], e));
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
class Mt {
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
const Ht = (r, t) => t in r && Object.prototype.hasOwnProperty.call(r, t), ft = (r, t) => Ht(r, t) ? r[t] : null, It = (r, t, e) => new Promise((n, s) => {
  const i = Qt(), a = W();
  let u = 0, f = !1;
  i.run(() => Wt(async () => {
    const b = ++u, D = r();
    if (!t(D))
      try {
        const I = await e(D);
        if (b !== u)
          return;
        a.value = I, f || (f = !0, n(a));
      } catch (I) {
        b === u && !f && (f = !0, i.stop(), s(I));
      }
  }));
}), Ye = function(r) {
  throw r;
};
class $r {
  constructor(t, e = {}) {
    m(this, "api");
    m(this, "endpoints");
    m(this, "classmap");
    this.api = t;
    const { endpoints: n, classmap: s } = e;
    this.endpoints = new ge(n ?? {}), this.classmap = { ...Ce, ...s }, this.errorHandler = e.errorHandler ?? Ye;
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
    const n = Y(e);
    if (!Ht(t.items, n))
      t.items[n] = W(e);
    else {
      const s = t.items[n], i = mt(s);
      for (const a of Object.keys(e))
        (!(a in i) || !vt(i[a], e[a])) && (s[a] = e[a]);
    }
    return t.items[n];
  }
  removeItem({ state: t }, e) {
    const n = Y(e);
    delete t.items[n];
  }
  async clearItems({ state: t }) {
    t.items = tt(new Mt());
  }
  async handle(t, { errorHandler: e = this.errorHandler } = {}) {
    var n, s, i, a;
    try {
      const { data: u } = await t();
      return this.factory(u);
    } catch (u) {
      typeof ((n = u.response) == null ? void 0 : n.data) == "object" && ((s = u.response) == null ? void 0 : s.data) != null && (u = this.factory(u.response.data, (i = u.response) == null ? void 0 : i.status)), u.statusCode = u.statusCode ?? ((a = u.response) == null ? void 0 : a.status), e(u);
    }
  }
  async fetchItem({ state: t }, e, n) {
    let s = new st(Y(e));
    n != null && n.groups && (s = s.withQuery(`${new ct(s.getQuery()).withParam("groups", n.groups)}`));
    let i = await this.handle(() => this.api.get(`${s}`, n), n);
    return i === void 0 ? void 0 : (i = this.factory(i), (n == null ? void 0 : n.store) ?? !0 ? this.storeItem({ state: t }, i) : i);
  }
  async getItem({ state: t }, e, n) {
    if (e === null)
      return null;
    const s = Y(e), i = ft(t.items, s);
    return i ?? await this.fetchItem({ state: t }, s, n);
  }
  async fetchCollection({ state: t }, e, n) {
    let s = new st(`${e}`);
    n != null && n.groups && (s = s.withQuery(`${new ct(s.getQuery()).withParam("groups", n.groups)}`));
    const i = await this.handle(() => this.api.get(`${s}`, n), n);
    if (i === void 0)
      return;
    i["hydra:member"] = i["hydra:member"].map((f) => this.factory(f));
    const a = this.factory(i);
    if ((n == null ? void 0 : n.store) ?? !1)
      for (const f of a["hydra:member"])
        this.storeItem({ state: t }, f);
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
    return it(e) ? this.updateItem({ state: t }, e, n) : this.createItem({ state: t }, e, n);
  }
  async deleteItem({ state: t }, e, n) {
    const s = Y(e);
    await this.handle(() => this.api.delete(s, n), n), e = ft(t.items, s), e !== null && this.removeItem({ state: t }, e);
  }
  async getRelation({ state: t }, e, n = {}) {
    if (e === null)
      return null;
    if (typeof e == "function")
      return It(e, (i) => i === void 0, (i) => this.getRelation({ state: t }, i, n));
    const s = (n.useExisting ?? !0) !== !1;
    if (s && (typeof v(e) == "string" || it(e))) {
      const i = ft(t.items, Y(e));
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
    return typeof e == "function" ? It(e, (s) => s == null, (s) => this.getRelations({ state: t }, s, n)) : Promise.all(e.map((s) => this.getRelation({ state: t }, s, n)));
  }
  async install(t) {
    t.state.items = tt(new Mt()), t.state.endpoints = ht(this.endpoints), t.state.classmap = ht(this.classmap), t.storeItem = (e) => this.storeItem(t, e), t.removeItem = (e) => this.removeItem(t, e), t.clearItems = () => this.clearItems(t), t.getItem = (e, n) => this.getItem(t, e, n), t.fetchItem = (e, n) => this.fetchItem(t, e, n), t.fetchCollection = (e, n) => this.fetchCollection(t, e, n), t.createItem = (e, n) => this.createItem(t, e, n), t.updateItem = (e, n) => this.updateItem(t, e, n), t.upsertItem = (e, n) => this.upsertItem(t, e, n), t.deleteItem = (e, n) => this.deleteItem(t, e, n), t.getRelation = (e, n) => this.getRelation(t, e, n), t.getRelations = (e, n) => this.getRelations(t, e, n), t.endpoint = (e) => t.state.endpoints[e], t.getItemsByType = (e) => t.state.items.filter((n) => e === n["@type"]), t.factory = (e, n) => (n = n ?? e, typeof e == "string" && (n["@type"] = e), this.factory(n));
  }
}
function Nt(r) {
  if (typeof r == "string")
    return r;
  try {
    return Y(r);
  } catch {
    return null;
  }
}
function _e(r) {
  return r.map((t) => Nt(t));
}
async function Vt(r, t) {
  try {
    return await t.getItem(r);
  } catch {
    return null;
  }
}
async function Ue(r, t) {
  return Promise.all(r.map((e) => Vt(e, t)));
}
class wr extends J {
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
    return this.multiple || this.items.length > 1 ? _e(this.items) : Nt(this.item);
  }
  async denormalize(e) {
    if (Array.isArray(e)) {
      this.items = await Ue(e, this.store);
      return;
    }
    this.items = [await Vt(e, this.store)];
  }
}
const Re = {
  asc: "desc",
  desc: "asc"
};
class Sr extends J {
  constructor(e = {}) {
    super();
    m(this, "order");
    this.order = e;
  }
  revert() {
    const e = {};
    for (const n in this.order) {
      const s = this.order[n];
      e[n] = Re[s] ?? s;
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
class zr extends J {
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
class Or extends J {
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
class Tr extends J {
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
function Dr({ itemsPerPage: r, currentPage: t, totalItems: e }) {
  return e == null ? new He({ itemsPerPage: r, currentPage: t }) : new Le({ itemsPerPage: r, currentPage: t, totalItems: e });
}
function ke(r) {
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
    return this._pages === void 0 && (this._pages = ke(this.lastPage)), this._pages;
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
    return new Ne(this, t, e);
  }
}
class Le extends Ot {
  constructor({ itemsPerPage: t, currentPage: e, totalItems: n }) {
    super({ itemsPerPage: t, currentPage: e }), this.totalItems = parseInt(n), this.lastPage = Math.max(1, Math.ceil(this.totalItems / Math.max(1, this.itemsPerPage))), this.nextPage = Math.min(this.lastPage, this.currentPage + 1);
  }
}
class He extends Ot {
  constructor({ itemsPerPage: t, currentPage: e, totalItems: n }) {
    super({ itemsPerPage: t, currentPage: e, totalItems: n }), this.nextPage = this.lastPage = this.currentPage + 1;
  }
}
class Ne extends Ot {
  constructor(t, e, n = !1) {
    super(t), Object.assign(this, t);
    const s = [];
    n && s.push(1);
    for (let i = 1; i <= this.lastPage; i++)
      i === this.currentPage && s.push(i), i < this.currentPage && i >= this.currentPage - e && s.push(i), i > this.currentPage && i <= this.currentPage + e && s.push(i);
    n && s.push(this.lastPage), this._pages = [...new Set(s)];
  }
}
class Ve {
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
function jr({ fields: r, preload: t } = {}) {
  return Object.assign(new Ve(), { fields: r }, { preload: t }).headers;
}
export {
  se as AbortError,
  er as ApiClient,
  nr as ArrayFilter,
  $e as ConstraintViolationList,
  de as DateRangeFilter,
  me as DatetimeRangeFilter,
  De as FakeEventSource,
  sr as FilterCollection,
  ne as HttpError,
  we as HydraCollection,
  St as HydraEndpoint,
  ge as HydraEndpoints,
  Rt as HydraError,
  $r as HydraPlugin,
  wr as ItemFilter,
  Pe as Mercure,
  Sr as OrderFilter,
  zr as RangeFilter,
  Or as TextFilter,
  Tr as TruthyFilter,
  be as Violation,
  at as areSameIris,
  zt as checkValidItem,
  et as clone,
  ve as containsIri,
  vr as createMercure,
  Dr as createPager,
  ar as createStore,
  pe as getId,
  cr as getIds,
  Y as getIri,
  ur as getIris,
  fr as getItemByIri,
  hr as getItemIndexByIri,
  dr as getItemsByType,
  it as hasIri,
  Ee as mercureSync,
  mr as normalizeIris,
  ze as normalizeItemRelations,
  Ae as on,
  yr as partialItem,
  or as useEndpoint,
  ir as useFilters,
  pr as useFormValidation,
  gr as useItemForm,
  Me as useMercure,
  br as useMercureSync,
  Ut as useStore,
  jr as vulcain,
  rr as withoutDuplicates,
  lr as withoutIri
};
