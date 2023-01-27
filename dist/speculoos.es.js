var Ut = Object.defineProperty;
var Rt = (n, t, e) => t in n ? Ut(n, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : n[t] = e;
var l = (n, t, e) => (Rt(n, typeof t != "symbol" ? t + "" : t, e), e);
import { whenever as Ht, asyncComputed as St, until as zt } from "@vueuse/core";
import { unref as b, isRef as st, ref as K, reactive as B, readonly as ft, inject as xt, computed as lt, watch as Lt, onUnmounted as Nt } from "vue";
import Tt from "clone-deep";
import kt from "md5";
import F from "is-empty";
import { useRoute as Ft, useRouter as Vt, onBeforeRouteUpdate as qt } from "vue-router";
import { URI as et, QueryString as it } from "psr7-js";
import { v4 as Zt } from "uuid";
import Jt from "mitt";
import Qt from "uri-templates";
class Wt extends Error {
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
class Bt extends Error {
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
}, Gt = {
  Accept: "application/ld+json, application/json"
}, Mt = async (n) => {
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
class Ve {
  constructor({ baseUri: t = "", options: e = {}, fetcher: r } = {}) {
    l(this, "baseUri");
    l(this, "options");
    l(this, "fetch");
    var s;
    this.baseUri = t, this.options = e, r = r ?? ((s = window.fetch) == null ? void 0 : s.bind(window)), this.fetch = async (i, f) => r(i, f).then(Mt);
  }
  resolve(t) {
    return new URL(t, this.baseUri).toString();
  }
  mergeOptions(t) {
    let e = { ...this.options };
    Object.keys(e).includes("headers") && (e.headers = ut(e.headers));
    for (let r of arguments) {
      let s = { ...r };
      Object.keys(s).includes("headers") && (s.headers = { ...ut(s.headers) }), e = { ...Tt(e), ...Tt(s) };
    }
    return e;
  }
  async request(t, e, r) {
    e = `${b(e)}`, r = this.mergeOptions({ method: t }, r), Object.keys(r).includes("headers") && (r.headers = new Headers({ ...Gt, ...ut(r.headers) }));
    try {
      if (st(r == null ? void 0 : r.isLoading) && (r.isLoading.value = !0), st(r == null ? void 0 : r.aborted)) {
        const s = new AbortController(), { signal: i } = s;
        r.signal = i, Ht(r.aborted, () => s.abort(), { immediate: !0 });
      }
      try {
        const s = await this.fetch(e, r);
        return Wt.guard(s);
      } catch (s) {
        throw s.name === "AbortError" ? new Bt(s.reason) : s;
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
class Kt {
  constructor(t = ((e) => (e = window.fetch) == null ? void 0 : e.bind(window))()) {
    l(this, "fetch");
    l(this, "pendingRequests", []);
    return this.fetch = t, (r, s) => {
      try {
        const i = kt(JSON.stringify({ url: r, ...s })), f = this.pendingRequests.findIndex((g) => i === g.hash);
        if (f >= 0)
          return this.pendingRequests[f].promise;
        const h = this.fetch(r, s).then(Mt);
        return this.pendingRequests.push({ hash: i, promise: h }), h.then(
          (g) => (this.removePendingRequest(i), g),
          (g) => {
            throw this.removePendingRequest(i), g;
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
function qe(n = void 0) {
  return new Kt(n);
}
const G = (n, t = !0, e = []) => {
  if (typeof n != "object" || n == null)
    return n;
  const r = e.find((i) => i.orig === n);
  if (r != null)
    return r.cloned;
  let s = Object.assign(Object.create(Object.getPrototypeOf(n)), n);
  if (Array.isArray(n) && (s = Object.values(s)), e.push({ orig: n, cloned: s }), t)
    for (const i in s)
      typeof s[i] == "object" && s[i] != null && (s[i] = G(s[i], t, e));
  return "__clone" in s && typeof s.__clone == "function" && s.__clone(), s;
};
class V {
  normalize() {
    throw Error("This method is meant to be overriden.");
  }
  async denormalize(t) {
    throw Error("This method is meant to be overriden.");
  }
}
class Ze extends V {
  constructor(e = []) {
    super();
    l(this, "values");
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
var pt = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {}, j = {}, Xt = {
  get exports() {
    return j;
  },
  set exports(n) {
    j = n;
  }
};
(function(n, t) {
  (function(e, r) {
    n.exports = r();
  })(pt, function() {
    var e = 1e3, r = 6e4, s = 36e5, i = "millisecond", f = "second", h = "minute", g = "hour", $ = "day", P = "week", Y = "month", D = "quarter", O = "year", T = "date", u = "Invalid Date", S = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/, A = /\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g, x = { name: "en", weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"), months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_") }, M = function(p, c, a) {
      var d = String(p);
      return !d || d.length >= c ? p : "" + Array(c + 1 - d.length).join(a) + p;
    }, N = { s: M, z: function(p) {
      var c = -p.utcOffset(), a = Math.abs(c), d = Math.floor(a / 60), o = a % 60;
      return (c <= 0 ? "+" : "-") + M(d, 2, "0") + ":" + M(o, 2, "0");
    }, m: function p(c, a) {
      if (c.date() < a.date())
        return -p(a, c);
      var d = 12 * (a.year() - c.year()) + (a.month() - c.month()), o = c.clone().add(d, Y), y = a - o < 0, m = c.clone().add(d + (y ? -1 : 1), Y);
      return +(-(d + (a - o) / (y ? o - m : m - o)) || 0);
    }, a: function(p) {
      return p < 0 ? Math.ceil(p) || 0 : Math.floor(p);
    }, p: function(p) {
      return { M: Y, y: O, w: P, d: $, D: T, h: g, m: h, s: f, ms: i, Q: D }[p] || String(p || "").toLowerCase().replace(/s$/, "");
    }, u: function(p) {
      return p === void 0;
    } }, E = "en", R = {};
    R[E] = x;
    var H = function(p) {
      return p instanceof Z;
    }, k = function p(c, a, d) {
      var o;
      if (!c)
        return E;
      if (typeof c == "string") {
        var y = c.toLowerCase();
        R[y] && (o = y), a && (R[y] = a, o = y);
        var m = c.split("-");
        if (!o && m.length > 1)
          return p(m[0]);
      } else {
        var w = c.name;
        R[w] = c, o = w;
      }
      return !d && o && (E = o), o || !d && E;
    }, z = function(p, c) {
      if (H(p))
        return p.clone();
      var a = typeof c == "object" ? c : {};
      return a.date = p, a.args = arguments, new Z(a);
    }, v = N;
    v.l = k, v.i = H, v.w = function(p, c) {
      return z(p, { locale: c.$L, utc: c.$u, x: c.$x, $offset: c.$offset });
    };
    var Z = function() {
      function p(a) {
        this.$L = k(a.locale, null, !0), this.parse(a);
      }
      var c = p.prototype;
      return c.parse = function(a) {
        this.$d = function(d) {
          var o = d.date, y = d.utc;
          if (o === null)
            return new Date(NaN);
          if (v.u(o))
            return new Date();
          if (o instanceof Date)
            return new Date(o);
          if (typeof o == "string" && !/Z$/i.test(o)) {
            var m = o.match(S);
            if (m) {
              var w = m[2] - 1 || 0, C = (m[7] || "0").substring(0, 3);
              return y ? new Date(Date.UTC(m[1], w, m[3] || 1, m[4] || 0, m[5] || 0, m[6] || 0, C)) : new Date(m[1], w, m[3] || 1, m[4] || 0, m[5] || 0, m[6] || 0, C);
            }
          }
          return new Date(o);
        }(a), this.$x = a.x || {}, this.init();
      }, c.init = function() {
        var a = this.$d;
        this.$y = a.getFullYear(), this.$M = a.getMonth(), this.$D = a.getDate(), this.$W = a.getDay(), this.$H = a.getHours(), this.$m = a.getMinutes(), this.$s = a.getSeconds(), this.$ms = a.getMilliseconds();
      }, c.$utils = function() {
        return v;
      }, c.isValid = function() {
        return this.$d.toString() !== u;
      }, c.isSame = function(a, d) {
        var o = z(a);
        return this.startOf(d) <= o && o <= this.endOf(d);
      }, c.isAfter = function(a, d) {
        return z(a) < this.startOf(d);
      }, c.isBefore = function(a, d) {
        return this.endOf(d) < z(a);
      }, c.$g = function(a, d, o) {
        return v.u(a) ? this[d] : this.set(o, a);
      }, c.unix = function() {
        return Math.floor(this.valueOf() / 1e3);
      }, c.valueOf = function() {
        return this.$d.getTime();
      }, c.startOf = function(a, d) {
        var o = this, y = !!v.u(d) || d, m = v.p(a), w = function(W, L) {
          var Q = v.w(o.$u ? Date.UTC(o.$y, L, W) : new Date(o.$y, L, W), o);
          return y ? Q : Q.endOf($);
        }, C = function(W, L) {
          return v.w(o.toDate()[W].apply(o.toDate("s"), (y ? [0, 0, 0, 0] : [23, 59, 59, 999]).slice(L)), o);
        }, I = this.$W, _ = this.$M, J = this.$D, q = "set" + (this.$u ? "UTC" : "");
        switch (m) {
          case O:
            return y ? w(1, 0) : w(31, 11);
          case Y:
            return y ? w(1, _) : w(0, _ + 1);
          case P:
            var X = this.$locale().weekStart || 0, tt = (I < X ? I + 7 : I) - X;
            return w(y ? J - tt : J + (6 - tt), _);
          case $:
          case T:
            return C(q + "Hours", 0);
          case g:
            return C(q + "Minutes", 1);
          case h:
            return C(q + "Seconds", 2);
          case f:
            return C(q + "Milliseconds", 3);
          default:
            return this.clone();
        }
      }, c.endOf = function(a) {
        return this.startOf(a, !1);
      }, c.$set = function(a, d) {
        var o, y = v.p(a), m = "set" + (this.$u ? "UTC" : ""), w = (o = {}, o[$] = m + "Date", o[T] = m + "Date", o[Y] = m + "Month", o[O] = m + "FullYear", o[g] = m + "Hours", o[h] = m + "Minutes", o[f] = m + "Seconds", o[i] = m + "Milliseconds", o)[y], C = y === $ ? this.$D + (d - this.$W) : d;
        if (y === Y || y === O) {
          var I = this.clone().set(T, 1);
          I.$d[w](C), I.init(), this.$d = I.set(T, Math.min(this.$D, I.daysInMonth())).$d;
        } else
          w && this.$d[w](C);
        return this.init(), this;
      }, c.set = function(a, d) {
        return this.clone().$set(a, d);
      }, c.get = function(a) {
        return this[v.p(a)]();
      }, c.add = function(a, d) {
        var o, y = this;
        a = Number(a);
        var m = v.p(d), w = function(_) {
          var J = z(y);
          return v.w(J.date(J.date() + Math.round(_ * a)), y);
        };
        if (m === Y)
          return this.set(Y, this.$M + a);
        if (m === O)
          return this.set(O, this.$y + a);
        if (m === $)
          return w(1);
        if (m === P)
          return w(7);
        var C = (o = {}, o[h] = r, o[g] = s, o[f] = e, o)[m] || 1, I = this.$d.getTime() + a * C;
        return v.w(I, this);
      }, c.subtract = function(a, d) {
        return this.add(-1 * a, d);
      }, c.format = function(a) {
        var d = this, o = this.$locale();
        if (!this.isValid())
          return o.invalidDate || u;
        var y = a || "YYYY-MM-DDTHH:mm:ssZ", m = v.z(this), w = this.$H, C = this.$m, I = this.$M, _ = o.weekdays, J = o.months, q = function(L, Q, ot, nt) {
          return L && (L[Q] || L(d, y)) || ot[Q].slice(0, nt);
        }, X = function(L) {
          return v.s(w % 12 || 12, L, "0");
        }, tt = o.meridiem || function(L, Q, ot) {
          var nt = L < 12 ? "AM" : "PM";
          return ot ? nt.toLowerCase() : nt;
        }, W = { YY: String(this.$y).slice(-2), YYYY: this.$y, M: I + 1, MM: v.s(I + 1, 2, "0"), MMM: q(o.monthsShort, I, J, 3), MMMM: q(J, I), D: this.$D, DD: v.s(this.$D, 2, "0"), d: String(this.$W), dd: q(o.weekdaysMin, this.$W, _, 2), ddd: q(o.weekdaysShort, this.$W, _, 3), dddd: _[this.$W], H: String(w), HH: v.s(w, 2, "0"), h: X(1), hh: X(2), a: tt(w, C, !0), A: tt(w, C, !1), m: String(C), mm: v.s(C, 2, "0"), s: String(this.$s), ss: v.s(this.$s, 2, "0"), SSS: v.s(this.$ms, 3, "0"), Z: m };
        return y.replace(A, function(L, Q) {
          return Q || W[L] || m.replace(":", "");
        });
      }, c.utcOffset = function() {
        return 15 * -Math.round(this.$d.getTimezoneOffset() / 15);
      }, c.diff = function(a, d, o) {
        var y, m = v.p(d), w = z(a), C = (w.utcOffset() - this.utcOffset()) * r, I = this - w, _ = v.m(this, w);
        return _ = (y = {}, y[O] = _ / 12, y[Y] = _, y[D] = _ / 3, y[P] = (I - C) / 6048e5, y[$] = (I - C) / 864e5, y[g] = I / s, y[h] = I / r, y[f] = I / e, y)[m] || I, o ? _ : v.a(_);
      }, c.daysInMonth = function() {
        return this.endOf(Y).$D;
      }, c.$locale = function() {
        return R[this.$L];
      }, c.locale = function(a, d) {
        if (!a)
          return this.$L;
        var o = this.clone(), y = k(a, d, !0);
        return y && (o.$L = y), o;
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
      }, p;
    }(), wt = Z.prototype;
    return z.prototype = wt, [["$ms", i], ["$s", f], ["$m", h], ["$H", g], ["$W", $], ["$M", Y], ["$y", O], ["$D", T]].forEach(function(p) {
      wt[p[1]] = function(c) {
        return this.$g(c, p[0], p[1]);
      };
    }), z.extend = function(p, c) {
      return p.$i || (p(c, Z, z), p.$i = !0), z;
    }, z.locale = k, z.isDayjs = H, z.unix = function(p) {
      return z(1e3 * p);
    }, z.en = R[E], z.Ls = R, z.p = {}, z;
  });
})(Xt);
var dt = {}, te = {
  get exports() {
    return dt;
  },
  set exports(n) {
    dt = n;
  }
};
(function(n, t) {
  (function(e, r) {
    n.exports = r();
  })(pt, function() {
    var e = "minute", r = /[+-]\d\d(?::?\d\d)?/g, s = /([+-]|\d\d)/g;
    return function(i, f, h) {
      var g = f.prototype;
      h.utc = function(u) {
        var S = { date: u, utc: !0, args: arguments };
        return new f(S);
      }, g.utc = function(u) {
        var S = h(this.toDate(), { locale: this.$L, utc: !0 });
        return u ? S.add(this.utcOffset(), e) : S;
      }, g.local = function() {
        return h(this.toDate(), { locale: this.$L, utc: !1 });
      };
      var $ = g.parse;
      g.parse = function(u) {
        u.utc && (this.$u = !0), this.$utils().u(u.$offset) || (this.$offset = u.$offset), $.call(this, u);
      };
      var P = g.init;
      g.init = function() {
        if (this.$u) {
          var u = this.$d;
          this.$y = u.getUTCFullYear(), this.$M = u.getUTCMonth(), this.$D = u.getUTCDate(), this.$W = u.getUTCDay(), this.$H = u.getUTCHours(), this.$m = u.getUTCMinutes(), this.$s = u.getUTCSeconds(), this.$ms = u.getUTCMilliseconds();
        } else
          P.call(this);
      };
      var Y = g.utcOffset;
      g.utcOffset = function(u, S) {
        var A = this.$utils().u;
        if (A(u))
          return this.$u ? 0 : A(this.$offset) ? Y.call(this) : this.$offset;
        if (typeof u == "string" && (u = function(E) {
          E === void 0 && (E = "");
          var R = E.match(r);
          if (!R)
            return null;
          var H = ("" + R[0]).match(s) || ["-", 0, 0], k = H[0], z = 60 * +H[1] + +H[2];
          return z === 0 ? 0 : k === "+" ? z : -z;
        }(u), u === null))
          return this;
        var x = Math.abs(u) <= 16 ? 60 * u : u, M = this;
        if (S)
          return M.$offset = x, M.$u = u === 0, M;
        if (u !== 0) {
          var N = this.$u ? this.toDate().getTimezoneOffset() : -1 * this.utcOffset();
          (M = this.local().add(x + N, e)).$offset = x, M.$x.$localOffset = N;
        } else
          M = this.utc();
        return M;
      };
      var D = g.format;
      g.format = function(u) {
        var S = u || (this.$u ? "YYYY-MM-DDTHH:mm:ss[Z]" : "");
        return D.call(this, S);
      }, g.valueOf = function() {
        var u = this.$utils().u(this.$offset) ? 0 : this.$offset + (this.$x.$localOffset || this.$d.getTimezoneOffset());
        return this.$d.valueOf() - 6e4 * u;
      }, g.isUTC = function() {
        return !!this.$u;
      }, g.toISOString = function() {
        return this.toDate().toISOString();
      }, g.toString = function() {
        return this.toDate().toUTCString();
      };
      var O = g.toDate;
      g.toDate = function(u) {
        return u === "s" && this.$offset ? h(this.format("YYYY-MM-DD HH:mm:ss:SSS")).toDate() : O.call(this);
      };
      var T = g.diff;
      g.diff = function(u, S, A) {
        if (u && this.$u === u.$u)
          return T.call(this, u, S, A);
        var x = this.local(), M = h(u).local();
        return T.call(x, M, S, A);
      };
    };
  });
})(te);
const It = dt;
var mt = {}, ee = {
  get exports() {
    return mt;
  },
  set exports(n) {
    mt = n;
  }
};
(function(n, t) {
  (function(e, r) {
    n.exports = r();
  })(pt, function() {
    var e = { year: 0, month: 1, day: 2, hour: 3, minute: 4, second: 5 }, r = {};
    return function(s, i, f) {
      var h, g = function(D, O, T) {
        T === void 0 && (T = {});
        var u = new Date(D), S = function(A, x) {
          x === void 0 && (x = {});
          var M = x.timeZoneName || "short", N = A + "|" + M, E = r[N];
          return E || (E = new Intl.DateTimeFormat("en-US", { hour12: !1, timeZone: A, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: M }), r[N] = E), E;
        }(O, T);
        return S.formatToParts(u);
      }, $ = function(D, O) {
        for (var T = g(D, O), u = [], S = 0; S < T.length; S += 1) {
          var A = T[S], x = A.type, M = A.value, N = e[x];
          N >= 0 && (u[N] = parseInt(M, 10));
        }
        var E = u[3], R = E === 24 ? 0 : E, H = u[0] + "-" + u[1] + "-" + u[2] + " " + R + ":" + u[4] + ":" + u[5] + ":000", k = +D;
        return (f.utc(H).valueOf() - (k -= k % 1e3)) / 6e4;
      }, P = i.prototype;
      P.tz = function(D, O) {
        D === void 0 && (D = h);
        var T = this.utcOffset(), u = this.toDate(), S = u.toLocaleString("en-US", { timeZone: D }), A = Math.round((u - new Date(S)) / 1e3 / 60), x = f(S).$set("millisecond", this.$ms).utcOffset(15 * -Math.round(u.getTimezoneOffset() / 15) - A, !0);
        if (O) {
          var M = x.utcOffset();
          x = x.add(T - M, "minute");
        }
        return x.$x.$timezone = D, x;
      }, P.offsetName = function(D) {
        var O = this.$x.$timezone || f.tz.guess(), T = g(this.valueOf(), O, { timeZoneName: D }).find(function(u) {
          return u.type.toLowerCase() === "timezonename";
        });
        return T && T.value;
      };
      var Y = P.startOf;
      P.startOf = function(D, O) {
        if (!this.$x || !this.$x.$timezone)
          return Y.call(this, D, O);
        var T = f(this.format("YYYY-MM-DD HH:mm:ss:SSS"));
        return Y.call(T, D, O).tz(this.$x.$timezone, !0);
      }, f.tz = function(D, O, T) {
        var u = T && O, S = T || O || h, A = $(+f(), S);
        if (typeof D != "string")
          return f(D).tz(S);
        var x = function(R, H, k) {
          var z = R - 60 * H * 1e3, v = $(z, k);
          if (H === v)
            return [z, H];
          var Z = $(z -= 60 * (v - H) * 1e3, k);
          return v === Z ? [z, v] : [R - 60 * Math.min(v, Z) * 1e3, Math.max(v, Z)];
        }(f.utc(D, u).valueOf(), A, S), M = x[0], N = x[1], E = f(M).utcOffset(N);
        return E.$x.$timezone = S, E;
      }, f.tz.guess = function() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      }, f.tz.setDefault = function(D) {
        h = D;
      };
    };
  });
})(ee);
const Pt = mt;
j.extend(It);
j.extend(Pt);
class re extends V {
  constructor({ after: e = null, before: r = null } = {}, { withTime: s = !0, useUserTimezone: i = !0 } = {}) {
    super();
    l(this, "after");
    l(this, "before");
    l(this, "normalizedFormat");
    l(this, "useUserTimezone");
    this.after = e, this.before = r, this.normalizedFormat = s ? "YYYY-MM-DD[T]HH:mm:ss[Z]" : "YYYY-MM-DD", this.useUserTimezone = i;
  }
  normalize() {
    this.constructor.ensureTimezoneIsSet();
    const e = this.useUserTimezone ? this.constructor.userTimezone : "UTC";
    let r = null, s = null;
    return F(this.after) || (r = j.tz(this.after, e).hour(0).minute(0).second(0).tz("UTC").format(this.normalizedFormat)), F(this.before) || (s = j.tz(this.before, e).hour(0).minute(0).second(0).add(1, "day").subtract(1, "second").tz("UTC").format(this.normalizedFormat)), { after: r, before: s };
  }
  async denormalize(e) {
    this.constructor.ensureTimezoneIsSet(), this.after = null, this.before = null, F(e.after) || (this.after = this.useUserTimezone ? j.tz(e.after, "UTC").tz(this.constructor.userTimezone) : j.tz(e.after, "UTC"), this.after = this.after.hour(0).minute(0).second(0).format("YYYY-MM-DD")), F(e.before) || (this.before = this.useUserTimezone ? j.tz(e.before, "UTC").tz(this.constructor.userTimezone) : j.tz(e.before, "UTC"), this.before = this.before.hour(0).minute(0).second(0).add(1, "day").subtract(1, "second").format("YYYY-MM-DD"));
  }
  static ensureTimezoneIsSet() {
    this.constructor.userTimezone = this.constructor.userTimezone ?? (j.tz.guess() || "UTC");
  }
}
l(re, "userTimezone");
j.extend(It);
j.extend(Pt);
class ne extends V {
  constructor({ after: e = null, before: r = null } = {}) {
    super();
    l(this, "after");
    l(this, "before");
    this.after = e, this.before = r;
  }
  normalize() {
    this.constructor.ensureTimezoneIsSet();
    let e = null, r = null;
    return F(this.after) || (e = j.tz(this.after, this.constructor.userTimezone).tz("UTC").format("YYYY-MM-DD[T]HH:mm:ss[Z]")), F(this.before) || (r = j.tz(this.before, this.constructor.userTimezone).tz("UTC").format("YYYY-MM-DD[T]HH:mm:ss[Z]")), { after: e, before: r };
  }
  async denormalize(e) {
    this.constructor.ensureTimezoneIsSet(), this.after = null, this.before = null, F(e.after) || (this.after = j.tz(e.after, "UTC").tz(this.constructor.userTimezone).format("YYYY-MM-DD[T]HH:mm:ss[Z]")), F(e.before) || (this.before = j.tz(e.before, "UTC").tz(this.constructor.userTimezone).format("YYYY-MM-DD[T]HH:mm:ss[Z]"));
  }
  static ensureTimezoneIsSet() {
    this.constructor.userTimezone = this.constructor.userTimezone ?? (j.tz.guess() || "UTC");
  }
}
l(ne, "userTimezone");
function se(n) {
  return n == null ? !0 : typeof n == "string" ? n.trim().length === 0 : typeof n == "function" || Array.isArray(n) ? n.length === 0 : n instanceof Object ? Object.keys(n).length === 0 : !1;
}
function gt(n) {
  if (!(n instanceof Object))
    return n;
  if (Array.isArray(n))
    return n.map(gt);
  const t = { ...n };
  return Object.keys(t).forEach((e) => {
    t[e] instanceof Object && (t[e] = gt(t[e])), se(t[e]) && delete t[e];
  }), t;
}
class Je {
  constructor(t = {}) {
    l(this, "_filters", []);
    if (!(t instanceof Object))
      throw Error("A FilterCollection expects an object.");
    Object.keys(t).forEach((e) => {
      if (!(t[e] instanceof V))
        throw Error(`Filter ${e} doesn't extend the Filter class.`);
      this[e] = t[e], this._filters.push(e);
    });
  }
  normalize() {
    const t = {};
    return this._filters.forEach((e) => {
      const r = this[e];
      t[e] = r.normalize();
    }), gt(t);
  }
  async denormalize(t) {
    const e = [];
    for (const r of this._filters) {
      const s = this[r];
      s instanceof V && typeof t[r] < "u" && e.push(s.denormalize(t[r]));
    }
    return e.length > 0 && await Promise.all(e), this;
  }
}
async function Qe(n = {}, t = {
  preserveQuery: !1,
  targetRoute: void 0
}) {
  if (typeof n != "function")
    throw Error("initialState should be provided as a function.");
  const e = Ft(), r = Vt(), s = K(n());
  async function i($) {
    Object.assign(b(s), await b(s).denormalize($.query));
  }
  function f() {
    s.value = G(n());
  }
  function h($ = {}) {
    const P = {};
    return t.preserveQuery === !0 && Object.assign(P, e.query), Object.assign(P, b(s).normalize(), $);
  }
  async function g($ = {}) {
    const P = b(t.targetRoute) ?? e;
    await r.push(Object.assign({ ...P }, { query: h($) }));
  }
  return qt(($) => i($)), await i(e), {
    filters: s,
    buildQueryParams: h,
    submit: g,
    clear: f
  };
}
const We = async ({ state: n = {}, methods: t = {}, name: e = "store" } = {}) => {
  n = B(n);
  const r = [], s = {
    name: e,
    state: n,
    ...Object.keys(t).reduce(function(i, f) {
      const h = t[f];
      return i[f] = function() {
        return h(n, ...arguments);
      }, i;
    }, {}),
    async use(i) {
      return r.push(i), await i.install(this), this;
    },
    async reconciliate(i = !1) {
      const f = r.filter(({ reconciliate: h }) => typeof h == "function");
      if (i === !1)
        return Promise.all(f.map((h) => h.reconciliate(this)));
      for (const h of f)
        await h.reconciliate(this);
    }
  };
  return s.install = (i) => i.provide(e, { ...s, state: ft(n) }), s;
}, Et = (n = "store") => xt(n);
class ie {
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
    l(this, "endpoint");
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
    return new vt(e.withQuery(r.toString()).toString());
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
const Be = (n, t) => Et(t).state.endpoints[n];
function at(n) {
  return n = b(n), n == null ? !1 : Object.keys(n).includes("@id") && n["@id"] != null;
}
function U(n) {
  return n = b(n), n === null ? null : typeof n == "string" ? n : (bt(n), n["@id"]);
}
function ae(n) {
  const t = U(n);
  return t.substring(t.lastIndexOf("/") + 1);
}
function Ge(n) {
  return n.map(U);
}
function Ke(n) {
  return n.map(ae);
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
function rt(n, t) {
  return U(n) === U(t);
}
function oe(n, t) {
  if (n = b(n), n = Array.from(n).map(b), t = b(t), Array.isArray(t)) {
    const e = t;
    for (const r of e)
      if (oe(n, r))
        return !0;
    return !1;
  }
  for (const e of n)
    if (rt(e, t))
      return !0;
  return !1;
}
function Xe(n, t) {
  const e = n.findIndex((r) => rt(r, t));
  return e >= 0 && n.splice(e, 1), n;
}
function ct(n, t) {
  const e = n.find((r) => rt(r, t));
  return typeof e > "u" ? null : e;
}
function tr(n, t) {
  return n.findIndex((e) => rt(e, t));
}
function er(n, t) {
  return n.filter((e) => e["@type"] === t);
}
function rr(n) {
  Object.assign(n, n.map((t) => U(t)));
}
function nr(n, t) {
  return n = b(n), bt(n), Object.assign({ "@id": n["@id"], "@type": n["@type"] }, t);
}
class Ct extends Error {
  constructor() {
    super(...arguments);
    l(this, "statusCode");
  }
  get title() {
    return this["hydra:title"];
  }
  get description() {
    return this["hydra:description"];
  }
}
class ue {
  constructor() {
    l(this, "id");
    l(this, "propertyPath");
    l(this, "message");
    l(this, "code");
    this.id = Zt();
  }
}
class ce extends Ct {
  constructor(e) {
    super();
    l(this, "_violations", []);
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
    this._violations = e.map((r) => Object.assign(new ue(), r));
  }
  getPropertyPaths() {
    return [...new Set(this.violations.map(({ propertyPath: e }) => e))];
  }
  getViolations(e) {
    const r = Array.from(arguments);
    return r.length === 0 ? this.violations : F(r[0]) ? this.violations.filter((s) => F(s.propertyPath)) : this.violations.filter((s) => e === s.propertyPath);
  }
}
class he {
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
function Dt(n) {
  return at(n) ? U(n) : n;
}
function le(n) {
  const t = G(n), e = Object.keys(t);
  for (const r of e) {
    const s = t[r];
    Array.isArray(s) ? t[r] = s.map((i) => Dt(i)) : typeof s == "object" && s != null && (t[r] = Dt(s));
  }
  return t;
}
function ht(n, t) {
  return n = fe(n), Object.assign(n, t);
}
function sr(n) {
  const t = Et(), e = K(b(n)), r = B(G(b(n))), s = lt(() => !at(b(r))), i = K(!1);
  Lt(e, ($) => ht(r, $));
  const f = lt(() => JSON.stringify(b(r)) !== JSON.stringify(b(e)));
  return { item: r, isUnsavedDraft: f, isCreationMode: s, isSubmitting: i, reset: ($) => ht(r, G(b($ ?? n))), submit: async ($) => {
    st($) && ($ = b($));
    try {
      i.value = !0;
      const P = await t.upsertItem(le($ ?? r));
      return e.value = P, ht(r, G(P)), P;
    } finally {
      i.value = !1;
    }
  } };
}
function ir() {
  const n = (s) => {
    s = b(s), s.querySelectorAll("[name]").forEach(function(i) {
      i.setCustomValidity("");
    });
  }, t = (s, i = !0) => {
    s = b(s);
    const f = s.checkValidity();
    return !f && i && s.reportValidity(), f;
  }, e = (s, i) => {
    n(s), Array.from(i).forEach((f) => r(s, f)), t(s);
  }, r = (s, { propertyPath: i, message: f }) => {
    var h;
    s = b(s), (h = s.querySelector(`[name='${i}']`)) == null || h.setCustomValidity(f);
  };
  return { resetValidity: n, bindViolations: e, validate: t };
}
let yt;
const de = 1, me = 2;
class ge {
  constructor(t, e) {
    l(this, "readyState", de);
    l(this, "url");
    l(this, "withCredentials");
    this.url = t, this.withCredentials = (e == null ? void 0 : e.withCredentials) ?? !1, setTimeout(() => this.onopen(), 10);
  }
  onerror() {
  }
  onmessage() {
  }
  onopen() {
  }
  close() {
    this.readyState = me;
  }
  triggerEvent(t) {
    this.onmessage(t);
  }
  triggerError(t) {
    this.onerror(t);
  }
}
const ye = () => {
  var n, t, e;
  return typeof process < "u" && ((n = process == null ? void 0 : process.env) == null ? void 0 : n.NODE_ENV) === "test" || ((e = (t = import.meta) == null ? void 0 : t.env) == null ? void 0 : e.NODE_ENV) === "test";
};
ye() ? yt = ge : yt = window.EventSource;
const pe = yt, ar = (n, t) => {
  const e = new $e(n, t);
  return Object.assign(e, {
    install(r) {
      r.provide("mercure", e);
    }
  });
}, ve = () => xt("mercure");
function be(n, t) {
  return n.length === t.length && n.every((e) => t.includes(e));
}
class $e {
  constructor(t, e = {}) {
    l(this, "hub");
    l(this, "options");
    l(this, "connection");
    l(this, "subscribedTopics");
    l(this, "endpoint");
    l(this, "emitter");
    l(this, "lastEventId");
    Object.assign(this, { hub: t, options: B(e) }), this.lastEventId = K(), this.subscribedTopics = K([]), this.endpoint = lt(() => {
      const r = new URL(this.hub), s = b(this.subscribedTopics);
      return s.includes("*") ? r.searchParams.append("topic", "*") : s.forEach((i) => r.searchParams.append("topic", i)), b(this.lastEventId) && r.searchParams.append("Last-Event-ID", b(this.lastEventId)), r.toString();
    }), this.emitter = Jt();
  }
  subscribe(t = ["*"], e = !0) {
    Array.isArray(t) || (t = [t]);
    const r = Array.from(b(this.subscribedTopics)), s = [.../* @__PURE__ */ new Set([...b(this.subscribedTopics), ...t])];
    this.subscribedTopics.value = s, e && !be(r, s) && this.listen();
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
    this.stop(), this.connection = new pe(b(this.endpoint), this.options), this.connection.onopen = () => this.emitter.emit("open", { endpoint: b(this.endpoint) }), this.connection.onmessage = (t) => (this.lastEventId.value = t.lastEventId, this.emitter.emit("message", t)), this.connection.onerror = (t) => {
      this.emitter.emit("error", t), typeof this.options.reconnectInterval == "number" && (this.stop(), setTimeout(() => this.connect(), this.options.reconnectInterval));
    };
  }
  stop() {
    var t;
    (t = this.connection) == null || t.close(), this.connection = void 0;
  }
}
const jt = (n, t) => Object.assign(t, n), At = () => {
};
function we(n, t, e = ["*"], r = jt, s = At) {
  Array.isArray(t) || (t = [t]), Array.isArray(e) || (e = [e]);
  const i = (f) => {
    try {
      const h = JSON.parse(f.data);
      if (!at(h))
        return;
      if (Object.keys(h).length === 1) {
        s(U(h));
        return;
      }
      for (const g of t)
        rt(U(h), g) && r(h, b(g));
    } catch (h) {
      console.debug(h);
    }
  };
  return n.addListener(i), n.subscribe(e), i;
}
const Se = (n, t, e) => {
  Array.isArray(t) || (t = [t]);
  const r = (s) => {
    try {
      const i = JSON.parse(s.data);
      for (const f of t)
        if (typeof Qt(f).fromUri(U(i)) < "u") {
          e(i);
          break;
        }
    } catch {
    }
  };
  return n.addListener(r), n.subscribe(t), r;
}, or = (n) => {
  n = n ?? ve();
  const t = [];
  return Nt(() => {
    for (const r of t)
      n.removeListener(r);
  }), {
    synchronize: (r, s = ["*"], i = jt, f = At) => {
      t.push(we(n, r, s, i, f));
    },
    on(r, s) {
      const i = Se(n, r, s);
      return t.push(i), i;
    }
  };
}, ze = {
  "hydra:Collection": he,
  "hydra:Error": Ct,
  ConstraintViolationList: ce
};
class Ot {
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
const Te = function(n) {
  throw n;
};
class ur {
  constructor(t, e = {}) {
    l(this, "api");
    l(this, "endpoints");
    l(this, "classmap");
    this.api = t;
    const { endpoints: r, classmap: s } = e;
    this.endpoints = new ie(r ?? {}), this.classmap = { ...ze, ...s }, this.errorHandler = e.errorHandler ?? Te;
  }
  factory(t, e) {
    for (const r in this.classmap)
      if (r === (t["@type"] ?? t)) {
        const s = this.classmap[r];
        return t instanceof s ? t : (t = Object.assign(new s(), t), e && Object.assign(t, { statusCode: e }), B(t));
      }
    return t;
  }
  storeItem({ state: t }, e) {
    const r = U(e);
    return Object.keys(t.items).includes(r) ? Object.assign(t.items[r], e) : t.items[r] = K(e), t.items[r];
  }
  removeItem({ state: t }, e) {
    const r = U(e);
    delete t.items[r];
  }
  async clearItems({ state: t }) {
    t.items = B(new Ot());
  }
  async handle(t, { errorHandler: e = this.errorHandler } = {}) {
    var r, s, i, f;
    try {
      const { data: h } = await t();
      return this.factory(h);
    } catch (h) {
      typeof ((r = h.response) == null ? void 0 : r.data) == "object" && ((s = h.response) == null ? void 0 : s.data) != null && (h = this.factory(h.response.data, (i = h.response) == null ? void 0 : i.status)), h.statusCode = h.statusCode ?? ((f = h.response) == null ? void 0 : f.status), e(h);
    }
  }
  async fetchItem({ state: t }, e, r) {
    let s = new et(U(e));
    r != null && r.groups && (s = s.withQuery(`${new it(s.getQuery()).withParam("groups", r.groups)}`));
    const i = await this.handle(() => this.api.get(`${s}`, r), r);
    return this.storeItem({ state: t }, this.factory(i));
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
    i["hydra:member"] = i["hydra:member"].map((h) => this.factory(h));
    const f = this.factory(i);
    return f["hydra:member"] = f["hydra:member"].map((h) => this.factory(h)), f;
  }
  async createItem({ state: t }, e, r) {
    const s = this.endpoints.for(e);
    return e = await this.handle(() => this.api.post(s, e, r), r), this.storeItem({ state: t }, e);
  }
  async updateItem({ state: t }, e, r) {
    return bt(e), e = await this.handle(() => this.api.put(U(e), e, r), r), this.storeItem({ state: t }, e);
  }
  async upsertItem({ state: t }, e, r) {
    return at(e) ? this.updateItem({ state: t }, e, r) : this.createItem({ state: t }, e, r);
  }
  async deleteItem({ state: t }, e, r) {
    const s = U(e);
    await this.handle(() => this.api.delete(s, r), r), e = ct(t.items, s), e !== null && this.removeItem({ state: t }, e);
  }
  async getRelation({ state: t }, e, r = {}) {
    if (e === null)
      return null;
    if (typeof e == "function") {
      const s = St(() => this.getRelation({ state: t }, e(), r));
      return await zt(s).not.toBe(void 0), s;
    }
    if ((r.useExisting ?? !0) === !0) {
      const s = ct(t.items, e);
      if (s != null)
        return s;
    }
    return typeof e == "object" && (r.force ?? !1) === !1 ? this.factory(e) : await this.getItem({ state: t }, e, r);
  }
  async getRelations({ state: t }, e, r) {
    if (typeof e == "function") {
      const s = St(() => this.getRelations({ state: t }, e(), r));
      return await zt(s).not.toBe(void 0), s;
    }
    return Promise.all(e.map((s) => this.getRelation({ state: t }, s, r)));
  }
  async install(t) {
    t.state.items = B(new Ot()), t.state.endpoints = ft(this.endpoints), t.state.classmap = ft(this.classmap), t.storeItem = (e) => this.storeItem(t, e), t.removeItem = (e) => this.removeItem(t, e), t.clearItems = () => this.clearItems(t), t.getItem = (e, r) => this.getItem(t, e, r), t.fetchItem = (e, r) => this.fetchItem(t, e, r), t.fetchCollection = (e, r) => this.fetchCollection(t, e, r), t.createItem = (e, r) => this.createItem(t, e, r), t.updateItem = (e, r) => this.updateItem(t, e, r), t.upsertItem = (e, r) => this.upsertItem(t, e, r), t.deleteItem = (e, r) => this.deleteItem(t, e, r), t.getRelation = (e, r) => this.getRelation(t, e, r), t.getRelations = (e, r) => this.getRelations(t, e, r), t.endpoint = (e) => t.state.endpoints[e], t.getItemsByType = (e) => t.state.items.filter((r) => e === r["@type"]), t.factory = (e, r) => (r = r ?? e, typeof e == "string" && (r["@type"] = e), this.factory(r));
  }
}
function Yt(n) {
  if (typeof n == "string")
    return n;
  try {
    return U(n);
  } catch {
    return null;
  }
}
function De(n) {
  return n.map((t) => Yt(t));
}
async function _t(n, t) {
  try {
    return await t.getItem(n);
  } catch {
    return null;
  }
}
async function Oe(n, t) {
  return Promise.all(n.map((e) => _t(e, t)));
}
class cr extends V {
  constructor(e, { store: r, multiple: s = !1 }) {
    super();
    l(this, "items", []);
    l(this, "multiple");
    l(this, "store");
    this.items = Array.isArray(e) ? e : [e], this.store = r, this.multiple = s;
  }
  get item() {
    return this.items[0] ?? null;
  }
  set item(e) {
    this.items = [e], this.multiple = !1;
  }
  normalize() {
    return this.multiple || this.items.length > 1 ? De(this.items) : Yt(this.item);
  }
  async denormalize(e) {
    if (Array.isArray(e)) {
      this.items = await Oe(e, this.store);
      return;
    }
    this.items = [await _t(e, this.store)];
  }
}
const xe = {
  asc: "desc",
  desc: "asc"
};
class hr extends V {
  constructor(e = {}) {
    super();
    l(this, "order");
    this.order = e;
  }
  revert() {
    const e = {};
    for (const r in this.order) {
      const s = this.order[r];
      e[r] = xe[s] ?? s;
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
class fr extends V {
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
class lr extends V {
  constructor(e = null) {
    super();
    l(this, "_value");
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
class dr extends V {
  constructor(e = null) {
    super();
    l(this, "value");
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
function mr({ itemsPerPage: n, currentPage: t, totalItems: e }) {
  return e == null ? new Pe({ itemsPerPage: n, currentPage: t }) : new Ie({ itemsPerPage: n, currentPage: t, totalItems: e });
}
function Me(n) {
  return Array.from({ length: n }, (t, e) => e + 1);
}
class $t {
  constructor({ itemsPerPage: t, currentPage: e }) {
    l(this, "itemsPerPage");
    l(this, "totalItems");
    l(this, "currentPage");
    l(this, "previousPage");
    l(this, "nextPage");
    l(this, "lastPage");
    l(this, "offset");
    l(this, "_pages");
    this.itemsPerPage = parseInt(t), this.currentPage = parseInt(e), this.offset = Math.max(0, e * t - t), this.previousPage = Math.max(1, this.currentPage - 1);
  }
  get pages() {
    return this._pages === void 0 && (this._pages = Me(this.lastPage)), this._pages;
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
    return new Ee(this, t, e);
  }
}
class Ie extends $t {
  constructor({ itemsPerPage: t, currentPage: e, totalItems: r }) {
    super({ itemsPerPage: t, currentPage: e }), this.totalItems = parseInt(r), this.lastPage = Math.max(1, Math.ceil(this.totalItems / Math.max(1, this.itemsPerPage))), this.nextPage = Math.min(this.lastPage, this.currentPage + 1);
  }
}
class Pe extends $t {
  constructor({ itemsPerPage: t, currentPage: e, totalItems: r }) {
    super({ itemsPerPage: t, currentPage: e, totalItems: r }), this.nextPage = this.lastPage = this.currentPage + 1;
  }
}
class Ee extends $t {
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
    l(this, "fields");
    l(this, "preload");
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
  Bt as AbortError,
  Ve as ApiClient,
  Ze as ArrayFilter,
  ce as ConstraintViolationList,
  re as DateRangeFilter,
  ne as DatetimeRangeFilter,
  ge as FakeEventSource,
  Je as FilterCollection,
  Wt as HttpError,
  he as HydraCollection,
  vt as HydraEndpoint,
  ie as HydraEndpoints,
  Ct as HydraError,
  ur as HydraPlugin,
  cr as ItemFilter,
  $e as Mercure,
  hr as OrderFilter,
  fr as RangeFilter,
  lr as TextFilter,
  dr as TruthyFilter,
  ue as Violation,
  rt as areSameIris,
  bt as checkValidItem,
  G as clone,
  oe as containsIri,
  ar as createMercure,
  mr as createPager,
  We as createStore,
  ae as getId,
  Ke as getIds,
  U as getIri,
  Ge as getIris,
  ct as getItemByIri,
  tr as getItemIndexByIri,
  er as getItemsByType,
  at as hasIri,
  we as mercureSync,
  rr as normalizeIris,
  le as normalizeItemRelations,
  Se as on,
  nr as partialItem,
  Be as useEndpoint,
  Qe as useFilters,
  ir as useFormValidation,
  sr as useItemForm,
  ve as useMercure,
  or as useMercureSync,
  Et as useStore,
  gr as vulcain,
  qe as withoutDuplicates,
  Xe as withoutIri
};
