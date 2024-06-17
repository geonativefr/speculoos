var _t = Object.defineProperty;
var Rt = (n, t, e) => t in n ? _t(n, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : n[t] = e;
var f = (n, t, e) => (Rt(n, typeof t != "symbol" ? t + "" : t, e), e);
import { whenever as Ht, asyncComputed as wt, until as St } from "@vueuse/core";
import { unref as b, isRef as st, ref as K, reactive as B, readonly as ht, inject as xt, computed as lt, onUnmounted as Lt } from "vue";
import zt from "clone-deep";
import Nt from "md5";
import F from "is-empty";
import { useRoute as kt, useRouter as Ft, onBeforeRouteUpdate as Vt } from "vue-router";
import { URI as et, QueryString as it } from "psr7-js";
import { v4 as qt } from "uuid";
import Zt from "mitt";
import Jt from "uri-templates";
class Qt extends Error {
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
class Wt extends Error {
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
}, Bt = {
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
class Fe {
  constructor({ baseUri: t = "", options: e = {}, fetcher: r } = {}) {
    f(this, "baseUri");
    f(this, "options");
    f(this, "fetch");
    var s;
    this.baseUri = t, this.options = e, r = r ?? ((s = window.fetch) == null ? void 0 : s.bind(window)), this.fetch = async (i, u) => r(i, u).then(Mt);
  }
  resolve(t) {
    return new URL(t, this.baseUri).toString();
  }
  mergeOptions(t) {
    let e = { ...this.options };
    Object.keys(e).includes("headers") && (e.headers = ut(e.headers));
    for (let r of arguments) {
      let s = { ...r };
      Object.keys(s).includes("headers") && (s.headers = { ...ut(s.headers) }), e = { ...zt(e), ...zt(s) };
    }
    return e;
  }
  async request(t, e, r) {
    e = `${b(e)}`, r = this.mergeOptions({ method: t }, r), Object.keys(r).includes("headers") && (r.headers = new Headers({ ...Bt, ...ut(r.headers) }));
    try {
      if (st(r == null ? void 0 : r.isLoading) && (r.isLoading.value = !0), st(r == null ? void 0 : r.aborted)) {
        const s = new AbortController(), { signal: i } = s;
        r.signal = i, Ht(r.aborted, () => s.abort(), { immediate: !0 });
      }
      try {
        const s = await this.fetch(e, r);
        return Qt.guard(s);
      } catch (s) {
        throw s.name === "AbortError" ? new Wt(s.reason) : s;
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
class Gt {
  constructor(t = ((e) => (e = window.fetch) == null ? void 0 : e.bind(window))()) {
    f(this, "fetch");
    f(this, "pendingRequests", []);
    return this.fetch = t, (r, s) => {
      try {
        const i = Nt(JSON.stringify({ url: r, ...s })), u = this.pendingRequests.findIndex((d) => i === d.hash);
        if (u >= 0)
          return this.pendingRequests[u].promise;
        const l = this.fetch(r, s).then(Mt);
        return this.pendingRequests.push({ hash: i, promise: l }), l.then(
          (d) => (this.removePendingRequest(i), d),
          (d) => {
            throw this.removePendingRequest(i), d;
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
function Ve(n = void 0) {
  return new Gt(n);
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
class qe extends V {
  constructor(e = []) {
    super();
    f(this, "values");
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
var yt = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {}, C = {}, Kt = {
  get exports() {
    return C;
  },
  set exports(n) {
    C = n;
  }
};
(function(n, t) {
  (function(e, r) {
    n.exports = r();
  })(yt, function() {
    var e = 1e3, r = 6e4, s = 36e5, i = "millisecond", u = "second", l = "minute", d = "hour", $ = "day", P = "week", Y = "month", O = "quarter", D = "year", T = "date", c = "Invalid Date", S = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/, A = /\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g, x = { name: "en", weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"), months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_") }, M = function(p, h, a) {
      var m = String(p);
      return !m || m.length >= h ? p : "" + Array(h + 1 - m.length).join(a) + p;
    }, N = { s: M, z: function(p) {
      var h = -p.utcOffset(), a = Math.abs(h), m = Math.floor(a / 60), o = a % 60;
      return (h <= 0 ? "+" : "-") + M(m, 2, "0") + ":" + M(o, 2, "0");
    }, m: function p(h, a) {
      if (h.date() < a.date())
        return -p(a, h);
      var m = 12 * (a.year() - h.year()) + (a.month() - h.month()), o = h.clone().add(m, Y), y = a - o < 0, g = h.clone().add(m + (y ? -1 : 1), Y);
      return +(-(m + (a - o) / (y ? o - g : g - o)) || 0);
    }, a: function(p) {
      return p < 0 ? Math.ceil(p) || 0 : Math.floor(p);
    }, p: function(p) {
      return { M: Y, y: D, w: P, d: $, D: T, h: d, m: l, s: u, ms: i, Q: O }[p] || String(p || "").toLowerCase().replace(/s$/, "");
    }, u: function(p) {
      return p === void 0;
    } }, E = "en", R = {};
    R[E] = x;
    var H = function(p) {
      return p instanceof Z;
    }, k = function p(h, a, m) {
      var o;
      if (!h)
        return E;
      if (typeof h == "string") {
        var y = h.toLowerCase();
        R[y] && (o = y), a && (R[y] = a, o = y);
        var g = h.split("-");
        if (!o && g.length > 1)
          return p(g[0]);
      } else {
        var w = h.name;
        R[w] = h, o = w;
      }
      return !m && o && (E = o), o || !m && E;
    }, z = function(p, h) {
      if (H(p))
        return p.clone();
      var a = typeof h == "object" ? h : {};
      return a.date = p, a.args = arguments, new Z(a);
    }, v = N;
    v.l = k, v.i = H, v.w = function(p, h) {
      return z(p, { locale: h.$L, utc: h.$u, x: h.$x, $offset: h.$offset });
    };
    var Z = function() {
      function p(a) {
        this.$L = k(a.locale, null, !0), this.parse(a);
      }
      var h = p.prototype;
      return h.parse = function(a) {
        this.$d = function(m) {
          var o = m.date, y = m.utc;
          if (o === null)
            return new Date(NaN);
          if (v.u(o))
            return new Date();
          if (o instanceof Date)
            return new Date(o);
          if (typeof o == "string" && !/Z$/i.test(o)) {
            var g = o.match(S);
            if (g) {
              var w = g[2] - 1 || 0, j = (g[7] || "0").substring(0, 3);
              return y ? new Date(Date.UTC(g[1], w, g[3] || 1, g[4] || 0, g[5] || 0, g[6] || 0, j)) : new Date(g[1], w, g[3] || 1, g[4] || 0, g[5] || 0, g[6] || 0, j);
            }
          }
          return new Date(o);
        }(a), this.$x = a.x || {}, this.init();
      }, h.init = function() {
        var a = this.$d;
        this.$y = a.getFullYear(), this.$M = a.getMonth(), this.$D = a.getDate(), this.$W = a.getDay(), this.$H = a.getHours(), this.$m = a.getMinutes(), this.$s = a.getSeconds(), this.$ms = a.getMilliseconds();
      }, h.$utils = function() {
        return v;
      }, h.isValid = function() {
        return this.$d.toString() !== c;
      }, h.isSame = function(a, m) {
        var o = z(a);
        return this.startOf(m) <= o && o <= this.endOf(m);
      }, h.isAfter = function(a, m) {
        return z(a) < this.startOf(m);
      }, h.isBefore = function(a, m) {
        return this.endOf(m) < z(a);
      }, h.$g = function(a, m, o) {
        return v.u(a) ? this[m] : this.set(o, a);
      }, h.unix = function() {
        return Math.floor(this.valueOf() / 1e3);
      }, h.valueOf = function() {
        return this.$d.getTime();
      }, h.startOf = function(a, m) {
        var o = this, y = !!v.u(m) || m, g = v.p(a), w = function(W, L) {
          var Q = v.w(o.$u ? Date.UTC(o.$y, L, W) : new Date(o.$y, L, W), o);
          return y ? Q : Q.endOf($);
        }, j = function(W, L) {
          return v.w(o.toDate()[W].apply(o.toDate("s"), (y ? [0, 0, 0, 0] : [23, 59, 59, 999]).slice(L)), o);
        }, I = this.$W, U = this.$M, J = this.$D, q = "set" + (this.$u ? "UTC" : "");
        switch (g) {
          case D:
            return y ? w(1, 0) : w(31, 11);
          case Y:
            return y ? w(1, U) : w(0, U + 1);
          case P:
            var X = this.$locale().weekStart || 0, tt = (I < X ? I + 7 : I) - X;
            return w(y ? J - tt : J + (6 - tt), U);
          case $:
          case T:
            return j(q + "Hours", 0);
          case d:
            return j(q + "Minutes", 1);
          case l:
            return j(q + "Seconds", 2);
          case u:
            return j(q + "Milliseconds", 3);
          default:
            return this.clone();
        }
      }, h.endOf = function(a) {
        return this.startOf(a, !1);
      }, h.$set = function(a, m) {
        var o, y = v.p(a), g = "set" + (this.$u ? "UTC" : ""), w = (o = {}, o[$] = g + "Date", o[T] = g + "Date", o[Y] = g + "Month", o[D] = g + "FullYear", o[d] = g + "Hours", o[l] = g + "Minutes", o[u] = g + "Seconds", o[i] = g + "Milliseconds", o)[y], j = y === $ ? this.$D + (m - this.$W) : m;
        if (y === Y || y === D) {
          var I = this.clone().set(T, 1);
          I.$d[w](j), I.init(), this.$d = I.set(T, Math.min(this.$D, I.daysInMonth())).$d;
        } else
          w && this.$d[w](j);
        return this.init(), this;
      }, h.set = function(a, m) {
        return this.clone().$set(a, m);
      }, h.get = function(a) {
        return this[v.p(a)]();
      }, h.add = function(a, m) {
        var o, y = this;
        a = Number(a);
        var g = v.p(m), w = function(U) {
          var J = z(y);
          return v.w(J.date(J.date() + Math.round(U * a)), y);
        };
        if (g === Y)
          return this.set(Y, this.$M + a);
        if (g === D)
          return this.set(D, this.$y + a);
        if (g === $)
          return w(1);
        if (g === P)
          return w(7);
        var j = (o = {}, o[l] = r, o[d] = s, o[u] = e, o)[g] || 1, I = this.$d.getTime() + a * j;
        return v.w(I, this);
      }, h.subtract = function(a, m) {
        return this.add(-1 * a, m);
      }, h.format = function(a) {
        var m = this, o = this.$locale();
        if (!this.isValid())
          return o.invalidDate || c;
        var y = a || "YYYY-MM-DDTHH:mm:ssZ", g = v.z(this), w = this.$H, j = this.$m, I = this.$M, U = o.weekdays, J = o.months, q = function(L, Q, ot, nt) {
          return L && (L[Q] || L(m, y)) || ot[Q].slice(0, nt);
        }, X = function(L) {
          return v.s(w % 12 || 12, L, "0");
        }, tt = o.meridiem || function(L, Q, ot) {
          var nt = L < 12 ? "AM" : "PM";
          return ot ? nt.toLowerCase() : nt;
        }, W = { YY: String(this.$y).slice(-2), YYYY: this.$y, M: I + 1, MM: v.s(I + 1, 2, "0"), MMM: q(o.monthsShort, I, J, 3), MMMM: q(J, I), D: this.$D, DD: v.s(this.$D, 2, "0"), d: String(this.$W), dd: q(o.weekdaysMin, this.$W, U, 2), ddd: q(o.weekdaysShort, this.$W, U, 3), dddd: U[this.$W], H: String(w), HH: v.s(w, 2, "0"), h: X(1), hh: X(2), a: tt(w, j, !0), A: tt(w, j, !1), m: String(j), mm: v.s(j, 2, "0"), s: String(this.$s), ss: v.s(this.$s, 2, "0"), SSS: v.s(this.$ms, 3, "0"), Z: g };
        return y.replace(A, function(L, Q) {
          return Q || W[L] || g.replace(":", "");
        });
      }, h.utcOffset = function() {
        return 15 * -Math.round(this.$d.getTimezoneOffset() / 15);
      }, h.diff = function(a, m, o) {
        var y, g = v.p(m), w = z(a), j = (w.utcOffset() - this.utcOffset()) * r, I = this - w, U = v.m(this, w);
        return U = (y = {}, y[D] = U / 12, y[Y] = U, y[O] = U / 3, y[P] = (I - j) / 6048e5, y[$] = (I - j) / 864e5, y[d] = I / s, y[l] = I / r, y[u] = I / e, y)[g] || I, o ? U : v.a(U);
      }, h.daysInMonth = function() {
        return this.endOf(Y).$D;
      }, h.$locale = function() {
        return R[this.$L];
      }, h.locale = function(a, m) {
        if (!a)
          return this.$L;
        var o = this.clone(), y = k(a, m, !0);
        return y && (o.$L = y), o;
      }, h.clone = function() {
        return v.w(this.$d, this);
      }, h.toDate = function() {
        return new Date(this.valueOf());
      }, h.toJSON = function() {
        return this.isValid() ? this.toISOString() : null;
      }, h.toISOString = function() {
        return this.$d.toISOString();
      }, h.toString = function() {
        return this.$d.toUTCString();
      }, p;
    }(), $t = Z.prototype;
    return z.prototype = $t, [["$ms", i], ["$s", u], ["$m", l], ["$H", d], ["$W", $], ["$M", Y], ["$y", D], ["$D", T]].forEach(function(p) {
      $t[p[1]] = function(h) {
        return this.$g(h, p[0], p[1]);
      };
    }), z.extend = function(p, h) {
      return p.$i || (p(h, Z, z), p.$i = !0), z;
    }, z.locale = k, z.isDayjs = H, z.unix = function(p) {
      return z(1e3 * p);
    }, z.en = R[E], z.Ls = R, z.p = {}, z;
  });
})(Kt);
var ft = {}, Xt = {
  get exports() {
    return ft;
  },
  set exports(n) {
    ft = n;
  }
};
(function(n, t) {
  (function(e, r) {
    n.exports = r();
  })(yt, function() {
    var e = "minute", r = /[+-]\d\d(?::?\d\d)?/g, s = /([+-]|\d\d)/g;
    return function(i, u, l) {
      var d = u.prototype;
      l.utc = function(c) {
        var S = { date: c, utc: !0, args: arguments };
        return new u(S);
      }, d.utc = function(c) {
        var S = l(this.toDate(), { locale: this.$L, utc: !0 });
        return c ? S.add(this.utcOffset(), e) : S;
      }, d.local = function() {
        return l(this.toDate(), { locale: this.$L, utc: !1 });
      };
      var $ = d.parse;
      d.parse = function(c) {
        c.utc && (this.$u = !0), this.$utils().u(c.$offset) || (this.$offset = c.$offset), $.call(this, c);
      };
      var P = d.init;
      d.init = function() {
        if (this.$u) {
          var c = this.$d;
          this.$y = c.getUTCFullYear(), this.$M = c.getUTCMonth(), this.$D = c.getUTCDate(), this.$W = c.getUTCDay(), this.$H = c.getUTCHours(), this.$m = c.getUTCMinutes(), this.$s = c.getUTCSeconds(), this.$ms = c.getUTCMilliseconds();
        } else
          P.call(this);
      };
      var Y = d.utcOffset;
      d.utcOffset = function(c, S) {
        var A = this.$utils().u;
        if (A(c))
          return this.$u ? 0 : A(this.$offset) ? Y.call(this) : this.$offset;
        if (typeof c == "string" && (c = function(E) {
          E === void 0 && (E = "");
          var R = E.match(r);
          if (!R)
            return null;
          var H = ("" + R[0]).match(s) || ["-", 0, 0], k = H[0], z = 60 * +H[1] + +H[2];
          return z === 0 ? 0 : k === "+" ? z : -z;
        }(c), c === null))
          return this;
        var x = Math.abs(c) <= 16 ? 60 * c : c, M = this;
        if (S)
          return M.$offset = x, M.$u = c === 0, M;
        if (c !== 0) {
          var N = this.$u ? this.toDate().getTimezoneOffset() : -1 * this.utcOffset();
          (M = this.local().add(x + N, e)).$offset = x, M.$x.$localOffset = N;
        } else
          M = this.utc();
        return M;
      };
      var O = d.format;
      d.format = function(c) {
        var S = c || (this.$u ? "YYYY-MM-DDTHH:mm:ss[Z]" : "");
        return O.call(this, S);
      }, d.valueOf = function() {
        var c = this.$utils().u(this.$offset) ? 0 : this.$offset + (this.$x.$localOffset || this.$d.getTimezoneOffset());
        return this.$d.valueOf() - 6e4 * c;
      }, d.isUTC = function() {
        return !!this.$u;
      }, d.toISOString = function() {
        return this.toDate().toISOString();
      }, d.toString = function() {
        return this.toDate().toUTCString();
      };
      var D = d.toDate;
      d.toDate = function(c) {
        return c === "s" && this.$offset ? l(this.format("YYYY-MM-DD HH:mm:ss:SSS")).toDate() : D.call(this);
      };
      var T = d.diff;
      d.diff = function(c, S, A) {
        if (c && this.$u === c.$u)
          return T.call(this, c, S, A);
        var x = this.local(), M = l(c).local();
        return T.call(x, M, S, A);
      };
    };
  });
})(Xt);
const It = ft;
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
  })(yt, function() {
    var e = { year: 0, month: 1, day: 2, hour: 3, minute: 4, second: 5 }, r = {};
    return function(s, i, u) {
      var l, d = function(O, D, T) {
        T === void 0 && (T = {});
        var c = new Date(O), S = function(A, x) {
          x === void 0 && (x = {});
          var M = x.timeZoneName || "short", N = A + "|" + M, E = r[N];
          return E || (E = new Intl.DateTimeFormat("en-US", { hour12: !1, timeZone: A, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: M }), r[N] = E), E;
        }(D, T);
        return S.formatToParts(c);
      }, $ = function(O, D) {
        for (var T = d(O, D), c = [], S = 0; S < T.length; S += 1) {
          var A = T[S], x = A.type, M = A.value, N = e[x];
          N >= 0 && (c[N] = parseInt(M, 10));
        }
        var E = c[3], R = E === 24 ? 0 : E, H = c[0] + "-" + c[1] + "-" + c[2] + " " + R + ":" + c[4] + ":" + c[5] + ":000", k = +O;
        return (u.utc(H).valueOf() - (k -= k % 1e3)) / 6e4;
      }, P = i.prototype;
      P.tz = function(O, D) {
        O === void 0 && (O = l);
        var T = this.utcOffset(), c = this.toDate(), S = c.toLocaleString("en-US", { timeZone: O }), A = Math.round((c - new Date(S)) / 1e3 / 60), x = u(S).$set("millisecond", this.$ms).utcOffset(15 * -Math.round(c.getTimezoneOffset() / 15) - A, !0);
        if (D) {
          var M = x.utcOffset();
          x = x.add(T - M, "minute");
        }
        return x.$x.$timezone = O, x;
      }, P.offsetName = function(O) {
        var D = this.$x.$timezone || u.tz.guess(), T = d(this.valueOf(), D, { timeZoneName: O }).find(function(c) {
          return c.type.toLowerCase() === "timezonename";
        });
        return T && T.value;
      };
      var Y = P.startOf;
      P.startOf = function(O, D) {
        if (!this.$x || !this.$x.$timezone)
          return Y.call(this, O, D);
        var T = u(this.format("YYYY-MM-DD HH:mm:ss:SSS"));
        return Y.call(T, O, D).tz(this.$x.$timezone, !0);
      }, u.tz = function(O, D, T) {
        var c = T && D, S = T || D || l, A = $(+u(), S);
        if (typeof O != "string")
          return u(O).tz(S);
        var x = function(R, H, k) {
          var z = R - 60 * H * 1e3, v = $(z, k);
          if (H === v)
            return [z, H];
          var Z = $(z -= 60 * (v - H) * 1e3, k);
          return v === Z ? [z, v] : [R - 60 * Math.min(v, Z) * 1e3, Math.max(v, Z)];
        }(u.utc(O, c).valueOf(), A, S), M = x[0], N = x[1], E = u(M).utcOffset(N);
        return E.$x.$timezone = S, E;
      }, u.tz.guess = function() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      }, u.tz.setDefault = function(O) {
        l = O;
      };
    };
  });
})(te);
const Pt = dt;
C.extend(It);
C.extend(Pt);
class ee extends V {
  constructor({ after: e = null, before: r = null } = {}, { withTime: s = !0, useUserTimezone: i = !0 } = {}) {
    super();
    f(this, "after");
    f(this, "before");
    f(this, "normalizedFormat");
    f(this, "useUserTimezone");
    this.after = e, this.before = r, this.normalizedFormat = s ? "YYYY-MM-DD[T]HH:mm:ss[Z]" : "YYYY-MM-DD", this.useUserTimezone = i;
  }
  normalize() {
    this.constructor.ensureTimezoneIsSet();
    const e = this.useUserTimezone ? this.constructor.userTimezone : "UTC";
    let r = null, s = null;
    return F(this.after) || (r = C.tz(this.after, e).hour(0).minute(0).second(0).tz("UTC").format(this.normalizedFormat)), F(this.before) || (s = C.tz(this.before, e).hour(0).minute(0).second(0).add(1, "day").subtract(1, "second").tz("UTC").format(this.normalizedFormat)), { after: r, before: s };
  }
  async denormalize(e) {
    this.constructor.ensureTimezoneIsSet(), this.after = null, this.before = null, F(e.after) || (this.after = this.useUserTimezone ? C.tz(e.after, "UTC").tz(this.constructor.userTimezone) : C.tz(e.after, "UTC"), this.after = this.after.hour(0).minute(0).second(0).format("YYYY-MM-DD")), F(e.before) || (this.before = this.useUserTimezone ? C.tz(e.before, "UTC").tz(this.constructor.userTimezone) : C.tz(e.before, "UTC"), this.before = this.before.hour(0).minute(0).second(0).add(1, "day").subtract(1, "second").format("YYYY-MM-DD"));
  }
  static ensureTimezoneIsSet() {
    this.constructor.userTimezone = this.constructor.userTimezone ?? (C.tz.guess() || "UTC");
  }
}
f(ee, "userTimezone");
C.extend(It);
C.extend(Pt);
class re extends V {
  constructor({ after: e = null, before: r = null } = {}) {
    super();
    f(this, "after");
    f(this, "before");
    this.after = e, this.before = r;
  }
  normalize() {
    this.constructor.ensureTimezoneIsSet();
    let e = null, r = null;
    return F(this.after) || (e = C.tz(this.after, this.constructor.userTimezone).tz("UTC").format("YYYY-MM-DD[T]HH:mm:ss[Z]")), F(this.before) || (r = C.tz(this.before, this.constructor.userTimezone).tz("UTC").format("YYYY-MM-DD[T]HH:mm:ss[Z]")), { after: e, before: r };
  }
  async denormalize(e) {
    this.constructor.ensureTimezoneIsSet(), this.after = null, this.before = null, F(e.after) || (this.after = C.tz(e.after, "UTC").tz(this.constructor.userTimezone).format("YYYY-MM-DD[T]HH:mm:ss[Z]")), F(e.before) || (this.before = C.tz(e.before, "UTC").tz(this.constructor.userTimezone).format("YYYY-MM-DD[T]HH:mm:ss[Z]"));
  }
  static ensureTimezoneIsSet() {
    this.constructor.userTimezone = this.constructor.userTimezone ?? (C.tz.guess() || "UTC");
  }
}
f(re, "userTimezone");
function ne(n) {
  return n == null ? !0 : typeof n == "string" ? n.trim().length === 0 : typeof n == "function" || Array.isArray(n) ? n.length === 0 : n instanceof Object ? Object.keys(n).length === 0 : !1;
}
function mt(n) {
  if (!(n instanceof Object))
    return n;
  if (Array.isArray(n))
    return n.map(mt);
  const t = { ...n };
  return Object.keys(t).forEach((e) => {
    t[e] instanceof Object && (t[e] = mt(t[e])), ne(t[e]) && delete t[e];
  }), t;
}
class Ze {
  constructor(t = {}) {
    f(this, "_filters", []);
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
    }), mt(t);
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
async function Je(n = {}, t = {
  preserveQuery: !1,
  targetRoute: void 0
}) {
  if (typeof n != "function")
    throw Error("initialState should be provided as a function.");
  const e = kt(), r = Ft(), s = K(n());
  async function i($) {
    Object.assign(b(s), await b(s).denormalize($.query));
  }
  function u() {
    s.value = G(n());
  }
  function l($ = {}) {
    const P = {};
    return t.preserveQuery === !0 && Object.assign(P, e.query), Object.assign(P, b(s).normalize(), $);
  }
  async function d($ = {}) {
    const P = b(t.targetRoute) ?? e;
    await r.push(Object.assign({ ...P }, { query: l($) }));
  }
  return Vt(($) => i($)), await i(e), {
    filters: s,
    buildQueryParams: l,
    submit: d,
    clear: u
  };
}
const Qe = async ({ state: n = {}, methods: t = {}, name: e = "store" } = {}) => {
  n = B(n);
  const r = [], s = {
    name: e,
    state: n,
    ...Object.keys(t).reduce(function(i, u) {
      const l = t[u];
      return i[u] = function() {
        return l(n, ...arguments);
      }, i;
    }, {}),
    async use(i) {
      return r.push(i), await i.install(this), this;
    },
    async reconciliate(i = !1) {
      const u = r.filter(({ reconciliate: l }) => typeof l == "function");
      if (i === !1)
        return Promise.all(u.map((l) => l.reconciliate(this)));
      for (const l of u)
        await l.reconciliate(this);
    }
  };
  return s.install = (i) => i.provide(e, { ...s, state: ht(n) }), s;
}, Et = (n = "store") => xt(n);
class se {
  constructor(t) {
    Object.keys(t).forEach((e) => {
      this[e] = new pt(t[e]);
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
class pt {
  constructor(t) {
    f(this, "endpoint");
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
    return new pt(e.withQuery(r.toString()).toString());
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
const We = (n, t) => Et(t).state.endpoints[n];
function at(n) {
  return n = b(n), n == null ? !1 : Object.keys(n).includes("@id") && n["@id"] != null;
}
function _(n) {
  return n = b(n), n === null ? null : typeof n == "string" ? n : (vt(n), n["@id"]);
}
function ie(n) {
  const t = _(n);
  return t.substring(t.lastIndexOf("/") + 1);
}
function Be(n) {
  return n.map(_);
}
function Ge(n) {
  return n.map(ie);
}
function vt(n, t = null) {
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
  return _(n) === _(t);
}
function ae(n, t) {
  if (n = b(n), n = Array.from(n).map(b), t = b(t), Array.isArray(t)) {
    const e = t;
    for (const r of e)
      if (ae(n, r))
        return !0;
    return !1;
  }
  for (const e of n)
    if (rt(e, t))
      return !0;
  return !1;
}
function Ke(n, t) {
  const e = n.findIndex((r) => rt(r, t));
  return e >= 0 && n.splice(e, 1), n;
}
function ct(n, t) {
  const e = n.find((r) => rt(r, t));
  return typeof e > "u" ? null : e;
}
function Xe(n, t) {
  return n.findIndex((e) => rt(e, t));
}
function tr(n, t) {
  return n.filter((e) => e["@type"] === t);
}
function er(n) {
  Object.assign(n, n.map((t) => _(t)));
}
function rr(n, t) {
  return n = b(n), vt(n), Object.assign({ "@id": n["@id"], "@type": n["@type"] }, t);
}
class jt extends Error {
  constructor() {
    super(...arguments);
    f(this, "statusCode");
  }
  get title() {
    return this["hydra:title"];
  }
  get description() {
    return this["hydra:description"];
  }
}
class oe {
  constructor() {
    f(this, "id");
    f(this, "propertyPath");
    f(this, "message");
    f(this, "code");
    this.id = qt();
  }
}
class ue extends jt {
  constructor(e) {
    super();
    f(this, "_violations", []);
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
    this._violations = e.map((r) => Object.assign(new oe(), r));
  }
  getPropertyPaths() {
    return [...new Set(this.violations.map(({ propertyPath: e }) => e))];
  }
  getViolations(e) {
    const r = Array.from(arguments);
    return r.length === 0 ? this.violations : F(r[0]) ? this.violations.filter((s) => F(s.propertyPath)) : this.violations.filter((s) => e === s.propertyPath);
  }
}
class ce {
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
function he(n) {
  if (typeof n != "object" || n == null)
    throw Error("Invalid object.");
  return Object.keys(n).forEach((t) => delete n[t]), n;
}
function Tt(n) {
  return at(n) ? _(n) : n;
}
function le(n) {
  const t = G(n), e = Object.keys(t);
  for (const r of e) {
    const s = t[r];
    Array.isArray(s) ? t[r] = s.map((i) => Tt(i)) : typeof s == "object" && s != null && (t[r] = Tt(s));
  }
  return t;
}
function Ot(n, t) {
  return n = he(n), Object.assign(n, t);
}
function nr(n) {
  const t = Et(), e = K(b(n)), r = B(G(b(n))), s = lt(() => !at(b(r))), i = K(!1), u = lt(() => JSON.stringify(b(r)) !== JSON.stringify(b(e)));
  return { item: r, isUnsavedDraft: u, isCreationMode: s, isSubmitting: i, reset: ($) => Ot(r, G(b($ ?? n))), submit: async ($) => {
    st($) && ($ = b($));
    try {
      i.value = !0;
      const P = await t.upsertItem(le($ ?? r));
      return e.value = P, Ot(r, G(P)), P;
    } finally {
      i.value = !1;
    }
  } };
}
function sr() {
  const n = (s) => {
    s = b(s), s.querySelectorAll("[name]").forEach(function(i) {
      i.setCustomValidity("");
    });
  }, t = (s, i = !0) => {
    s = b(s);
    const u = s.checkValidity();
    return !u && i && s.reportValidity(), u;
  }, e = (s, i) => {
    n(s), Array.from(i).forEach((u) => r(s, u)), t(s);
  }, r = (s, { propertyPath: i, message: u }) => {
    var l;
    s = b(s), (l = s.querySelector(`[name='${i}']`)) == null || l.setCustomValidity(u);
  };
  return { resetValidity: n, bindViolations: e, validate: t };
}
let gt;
const fe = 1, de = 2;
class me {
  constructor(t, e) {
    f(this, "readyState", fe);
    f(this, "url");
    f(this, "withCredentials");
    this.url = t, this.withCredentials = (e == null ? void 0 : e.withCredentials) ?? !1, setTimeout(() => this.onopen(), 10);
  }
  onerror() {
  }
  onmessage() {
  }
  onopen() {
  }
  close() {
    this.readyState = de;
  }
  triggerEvent(t) {
    this.onmessage(t);
  }
  triggerError(t) {
    this.onerror(t);
  }
}
const ge = () => {
  var n, t, e;
  return typeof process < "u" && ((n = process == null ? void 0 : process.env) == null ? void 0 : n.NODE_ENV) === "test" || ((e = (t = import.meta) == null ? void 0 : t.env) == null ? void 0 : e.NODE_ENV) === "test";
};
ge() ? gt = me : gt = window.EventSource;
const ye = gt, ir = (n, t) => {
  const e = new be(n, t);
  return Object.assign(e, {
    install(r) {
      r.provide("mercure", e);
    }
  });
}, pe = () => xt("mercure");
function ve(n, t) {
  return n.length === t.length && n.every((e) => t.includes(e));
}
class be {
  constructor(t, e = {}) {
    f(this, "hub");
    f(this, "options");
    f(this, "connection");
    f(this, "subscribedTopics");
    f(this, "endpoint");
    f(this, "emitter");
    f(this, "lastEventId");
    Object.assign(this, { hub: t, options: B(e) }), this.lastEventId = K(), this.subscribedTopics = K([]), this.endpoint = lt(() => {
      const r = new URL(this.hub), s = b(this.subscribedTopics);
      return s.includes("*") ? r.searchParams.append("topic", "*") : s.forEach((i) => r.searchParams.append("topic", i)), b(this.lastEventId) && r.searchParams.append("Last-Event-ID", b(this.lastEventId)), r.toString();
    }), this.emitter = Zt();
  }
  subscribe(t = ["*"], e = !0) {
    Array.isArray(t) || (t = [t]);
    const r = Array.from(b(this.subscribedTopics)), s = [.../* @__PURE__ */ new Set([...b(this.subscribedTopics), ...t])];
    this.subscribedTopics.value = s, e && !ve(r, s) && this.listen();
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
    this.stop(), this.connection = new ye(b(this.endpoint), this.options), this.connection.onopen = () => this.emitter.emit("open", { endpoint: b(this.endpoint) }), this.connection.onmessage = (t) => (this.lastEventId.value = t.lastEventId, this.emitter.emit("message", t)), this.connection.onerror = (t) => {
      this.emitter.emit("error", t), typeof this.options.reconnectInterval == "number" && (this.stop(), setTimeout(() => this.connect(), this.options.reconnectInterval));
    };
  }
  stop() {
    var t;
    (t = this.connection) == null || t.close(), this.connection = void 0;
  }
}
const Ct = (n, t) => Object.assign(t, n), At = () => {
};
function $e(n, t, e = ["*"], r = Ct, s = At) {
  Array.isArray(t) || (t = [t]), Array.isArray(e) || (e = [e]);
  const i = (u) => {
    try {
      const l = JSON.parse(u.data);
      if (!at(l))
        return;
      if (Object.keys(l).length === 1) {
        s(_(l));
        return;
      }
      for (const d of t)
        rt(_(l), d) && r(l, b(d));
    } catch (l) {
      console.debug(l);
    }
  };
  return n.addListener(i), n.subscribe(e), i;
}
const we = (n, t, e) => {
  Array.isArray(t) || (t = [t]);
  const r = (s) => {
    let i;
    try {
      i = JSON.parse(s.data);
    } catch (u) {
      console.debug(u);
      return;
    }
    if (typeof i != "object") {
      console.debug("Received an event which is not an object.");
      return;
    }
    try {
      for (const u of t)
        if (typeof Jt(u).fromUri(_(i)) < "u") {
          e(i);
          break;
        }
    } catch (u) {
      console.error(u);
    }
  };
  return n.addListener(r), n.subscribe(t), r;
}, ar = (n, t = { removeListenersOnUnmount: !0 }) => {
  n = n ?? pe();
  const e = [];
  return t.removeListenersOnUnmount && Lt(() => {
    for (const s of e)
      n.removeListener(s);
  }), {
    synchronize: (s, i = ["*"], u = Ct, l = At) => {
      e.push($e(n, s, i, u, l));
    },
    on(s, i) {
      const u = we(n, s, i);
      return e.push(u), u;
    }
  };
}, Se = {
  "hydra:Collection": ce,
  "hydra:Error": jt,
  ConstraintViolationList: ue
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
const ze = function(n) {
  throw n;
};
class or {
  constructor(t, e = {}) {
    f(this, "api");
    f(this, "endpoints");
    f(this, "classmap");
    this.api = t;
    const { endpoints: r, classmap: s } = e;
    this.endpoints = new se(r ?? {}), this.classmap = { ...Se, ...s }, this.errorHandler = e.errorHandler ?? ze;
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
    const r = _(e);
    return Object.keys(t.items).includes(r) ? Object.assign(t.items[r], e) : t.items[r] = K(e), t.items[r];
  }
  removeItem({ state: t }, e) {
    const r = _(e);
    delete t.items[r];
  }
  async clearItems({ state: t }) {
    t.items = B(new Dt());
  }
  async handle(t, { errorHandler: e = this.errorHandler } = {}) {
    var r, s, i, u;
    try {
      const { data: l } = await t();
      return this.factory(l);
    } catch (l) {
      typeof ((r = l.response) == null ? void 0 : r.data) == "object" && ((s = l.response) == null ? void 0 : s.data) != null && (l = this.factory(l.response.data, (i = l.response) == null ? void 0 : i.status)), l.statusCode = l.statusCode ?? ((u = l.response) == null ? void 0 : u.status), e(l);
    }
  }
  async fetchItem({ state: t }, e, r) {
    let s = new et(_(e));
    r != null && r.groups && (s = s.withQuery(`${new it(s.getQuery()).withParam("groups", r.groups)}`));
    let i = await this.handle(() => this.api.get(`${s}`, r), r);
    return i = this.factory(i), (r == null ? void 0 : r.store) ?? !0 ? this.storeItem({ state: t }, i) : i;
  }
  async getItem({ state: t }, e, r) {
    if (e === null)
      return null;
    const s = _(e), i = ct(t.items, s);
    return i ?? await this.fetchItem({ state: t }, s, r);
  }
  async fetchCollection({ state: t }, e, r) {
    let s = new et(`${e}`);
    r != null && r.groups && (s = s.withQuery(`${new it(s.getQuery()).withParam("groups", r.groups)}`));
    const i = await this.handle(() => this.api.get(`${s}`, r), r);
    i["hydra:member"] = i["hydra:member"].map((d) => this.factory(d));
    const u = this.factory(i);
    if (u["hydra:member"] = u["hydra:member"].map((d) => this.factory(d)), (r == null ? void 0 : r.store) ?? !1)
      for (const d of u["hydra:member"])
        this.storeItem({ state: t }, d);
    return u;
  }
  async createItem({ state: t }, e, r) {
    const s = this.endpoints.for(e);
    return e = await this.handle(() => this.api.post(s, e, r), r), (r == null ? void 0 : r.store) ?? !0 ? this.storeItem({ state: t }, e) : e;
  }
  async updateItem({ state: t }, e, r) {
    return vt(e), e = await this.handle(() => this.api.put(_(e), e, r), r), (r == null ? void 0 : r.store) ?? !0 ? this.storeItem({ state: t }, e) : e;
  }
  async upsertItem({ state: t }, e, r) {
    return at(e) ? this.updateItem({ state: t }, e, r) : this.createItem({ state: t }, e, r);
  }
  async deleteItem({ state: t }, e, r) {
    const s = _(e);
    await this.handle(() => this.api.delete(s, r), r), e = ct(t.items, s), e !== null && this.removeItem({ state: t }, e);
  }
  async getRelation({ state: t }, e, r = {}) {
    if (e === null)
      return null;
    if (typeof e == "function") {
      const s = wt(() => this.getRelation({ state: t }, e(), r));
      return await St(s).not.toBe(void 0), s;
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
      const s = wt(() => this.getRelations({ state: t }, e(), r));
      return await St(s).not.toBe(void 0), s;
    }
    return Promise.all(e.map((s) => this.getRelation({ state: t }, s, r)));
  }
  async install(t) {
    t.state.items = B(new Dt()), t.state.endpoints = ht(this.endpoints), t.state.classmap = ht(this.classmap), t.storeItem = (e) => this.storeItem(t, e), t.removeItem = (e) => this.removeItem(t, e), t.clearItems = () => this.clearItems(t), t.getItem = (e, r) => this.getItem(t, e, r), t.fetchItem = (e, r) => this.fetchItem(t, e, r), t.fetchCollection = (e, r) => this.fetchCollection(t, e, r), t.createItem = (e, r) => this.createItem(t, e, r), t.updateItem = (e, r) => this.updateItem(t, e, r), t.upsertItem = (e, r) => this.upsertItem(t, e, r), t.deleteItem = (e, r) => this.deleteItem(t, e, r), t.getRelation = (e, r) => this.getRelation(t, e, r), t.getRelations = (e, r) => this.getRelations(t, e, r), t.endpoint = (e) => t.state.endpoints[e], t.getItemsByType = (e) => t.state.items.filter((r) => e === r["@type"]), t.factory = (e, r) => (r = r ?? e, typeof e == "string" && (r["@type"] = e), this.factory(r));
  }
}
function Yt(n) {
  if (typeof n == "string")
    return n;
  try {
    return _(n);
  } catch {
    return null;
  }
}
function Te(n) {
  return n.map((t) => Yt(t));
}
async function Ut(n, t) {
  try {
    return await t.getItem(n);
  } catch {
    return null;
  }
}
async function Oe(n, t) {
  return Promise.all(n.map((e) => Ut(e, t)));
}
class ur extends V {
  constructor(e, { store: r, multiple: s = !1 }) {
    super();
    f(this, "items", []);
    f(this, "multiple");
    f(this, "store");
    this.items = Array.isArray(e) ? e : [e], this.store = r, this.multiple = s;
  }
  get item() {
    return this.items[0] ?? null;
  }
  set item(e) {
    this.items = [e], this.multiple = !1;
  }
  normalize() {
    return this.multiple || this.items.length > 1 ? Te(this.items) : Yt(this.item);
  }
  async denormalize(e) {
    if (Array.isArray(e)) {
      this.items = await Oe(e, this.store);
      return;
    }
    this.items = [await Ut(e, this.store)];
  }
}
const De = {
  asc: "desc",
  desc: "asc"
};
class cr extends V {
  constructor(e = {}) {
    super();
    f(this, "order");
    this.order = e;
  }
  revert() {
    const e = {};
    for (const r in this.order) {
      const s = this.order[r];
      e[r] = De[s] ?? s;
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
class hr extends V {
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
    f(this, "_value");
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
class fr extends V {
  constructor(e = null) {
    super();
    f(this, "value");
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
function dr({ itemsPerPage: n, currentPage: t, totalItems: e }) {
  return e == null ? new Ie({ itemsPerPage: n, currentPage: t }) : new Me({ itemsPerPage: n, currentPage: t, totalItems: e });
}
function xe(n) {
  return Array.from({ length: n }, (t, e) => e + 1);
}
class bt {
  constructor({ itemsPerPage: t, currentPage: e }) {
    f(this, "itemsPerPage");
    f(this, "totalItems");
    f(this, "currentPage");
    f(this, "previousPage");
    f(this, "nextPage");
    f(this, "lastPage");
    f(this, "offset");
    f(this, "_pages");
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
    return new Pe(this, t, e);
  }
}
class Me extends bt {
  constructor({ itemsPerPage: t, currentPage: e, totalItems: r }) {
    super({ itemsPerPage: t, currentPage: e }), this.totalItems = parseInt(r), this.lastPage = Math.max(1, Math.ceil(this.totalItems / Math.max(1, this.itemsPerPage))), this.nextPage = Math.min(this.lastPage, this.currentPage + 1);
  }
}
class Ie extends bt {
  constructor({ itemsPerPage: t, currentPage: e, totalItems: r }) {
    super({ itemsPerPage: t, currentPage: e, totalItems: r }), this.nextPage = this.lastPage = this.currentPage + 1;
  }
}
class Pe extends bt {
  constructor(t, e, r = !1) {
    super(t), Object.assign(this, t);
    const s = [];
    r && s.push(1);
    for (let i = 1; i <= this.lastPage; i++)
      i === this.currentPage && s.push(i), i < this.currentPage && i >= this.currentPage - e && s.push(i), i > this.currentPage && i <= this.currentPage + e && s.push(i);
    r && s.push(this.lastPage), this._pages = [...new Set(s)];
  }
}
class Ee {
  constructor() {
    f(this, "fields");
    f(this, "preload");
  }
  get headers() {
    var e, r;
    const t = {};
    return (((e = this.preload) == null ? void 0 : e.length) ?? 0) !== 0 && (t.preload = [...new Set(this.preload)].map((s) => `"${s}"`).join(", ")), (((r = this.fields) == null ? void 0 : r.length) ?? 0) !== 0 && (t.fields = [.../* @__PURE__ */ new Set([...this.fields, ...this.preload ?? []])].map((s) => `"${s}"`).join(", ")), t;
  }
}
function mr({ fields: n, preload: t } = {}) {
  return Object.assign(new Ee(), { fields: n }, { preload: t }).headers;
}
export {
  Wt as AbortError,
  Fe as ApiClient,
  qe as ArrayFilter,
  ue as ConstraintViolationList,
  ee as DateRangeFilter,
  re as DatetimeRangeFilter,
  me as FakeEventSource,
  Ze as FilterCollection,
  Qt as HttpError,
  ce as HydraCollection,
  pt as HydraEndpoint,
  se as HydraEndpoints,
  jt as HydraError,
  or as HydraPlugin,
  ur as ItemFilter,
  be as Mercure,
  cr as OrderFilter,
  hr as RangeFilter,
  lr as TextFilter,
  fr as TruthyFilter,
  oe as Violation,
  rt as areSameIris,
  vt as checkValidItem,
  G as clone,
  ae as containsIri,
  ir as createMercure,
  dr as createPager,
  Qe as createStore,
  ie as getId,
  Ge as getIds,
  _ as getIri,
  Be as getIris,
  ct as getItemByIri,
  Xe as getItemIndexByIri,
  tr as getItemsByType,
  at as hasIri,
  $e as mercureSync,
  er as normalizeIris,
  le as normalizeItemRelations,
  we as on,
  rr as partialItem,
  We as useEndpoint,
  Je as useFilters,
  sr as useFormValidation,
  nr as useItemForm,
  pe as useMercure,
  ar as useMercureSync,
  Et as useStore,
  mr as vulcain,
  Ve as withoutDuplicates,
  Ke as withoutIri
};
