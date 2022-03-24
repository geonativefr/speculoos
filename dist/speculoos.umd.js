var Ve=Object.defineProperty,Le=Object.defineProperties;var ke=Object.getOwnPropertyDescriptors;var Zt=Object.getOwnPropertySymbols;var Fe=Object.prototype.hasOwnProperty,xe=Object.prototype.propertyIsEnumerable;var St=(a,s,q)=>s in a?Ve(a,s,{enumerable:!0,configurable:!0,writable:!0,value:q}):a[s]=q,H=(a,s)=>{for(var q in s||(s={}))Fe.call(s,q)&&St(a,q,s[q]);if(Zt)for(var q of Zt(s))xe.call(s,q)&&St(a,q,s[q]);return a},ft=(a,s)=>Le(a,ke(s));var $=(a,s,q)=>(St(a,typeof s!="symbol"?s+"":s,q),q);(function(a,s){typeof exports=="object"&&typeof module!="undefined"?s(exports,require("vue"),require("clone-deep"),require("md5"),require("is-empty"),require("vue-router"),require("psr7-js"),require("uuid"),require("mitt"),require("uri-templates"),require("@vueuse/core")):typeof define=="function"&&define.amd?define(["exports","vue","clone-deep","md5","is-empty","vue-router","psr7-js","uuid","mitt","uri-templates","@vueuse/core"],s):(a=typeof globalThis!="undefined"?globalThis:a||self,s(a.Speculoos={},a.Vue,a.clone,a.md5,a.empty,a.vueRouter,a.psr7Js,a.uuid,a.mitt,a.uriTemplate,a.core))})(this,function(a,s,q,Jt,Qt,ht,it,Bt,Wt,Gt,Kt){"use strict";function et(n){return n&&typeof n=="object"&&"default"in n?n:{default:n}}var W=et(q),Xt=et(Jt),G=et(Qt),te=et(Wt),ee=et(Gt);class It extends Error{constructor(t){super(t.statusText);this.response=t,this.statusCode=parseInt(this.response.status)}isStatusCode(t){const e=r=>parseInt(r)===this.statusCode;for(let r of arguments)if(e(r))return!0;return!1}isClientError(){return this.statusCode>=400&&this.statusCode<500}isServerError(){return this.statusCode>500}static guard(t){if(t.status>=400)throw new this(t);return t}}const lt=n=>{if(!(n instanceof Headers))return n;const t={};for(let e of n.keys())t[e]=n.get(e);return t},ne={Accept:"application/ld+json, application/json"},Ot=async n=>{try{const t=await n.text();try{n.data=JSON.parse(t),n.json=()=>new Promise(e=>e(n.data))}catch{n.data=t,n.json=()=>new Promise(r=>r(n.data))}}catch{}return n};class re{constructor({baseUri:t="",options:e={},fetcher:r=window.fetch.bind(window)}={}){$(this,"baseUri");$(this,"options");$(this,"fetch");this.baseUri=t,this.options=e,this.fetch=async(i,u)=>r(i,u).then(Ot)}resolve(t){return new URL(t,this.baseUri).toString()}mergeOptions(t){let e=H({},this.options);Object.keys(e).includes("headers")&&(e.headers=lt(e.headers));for(let r of arguments){let i=H({},r);Object.keys(i).includes("headers")&&(i.headers=H({},lt(i.headers))),e=H(H({},W.default(e)),W.default(i))}return e}async request(t,e,r){e=`${s.unref(e)}`,r=this.mergeOptions({method:t},r),Object.keys(r).includes("headers")&&(r.headers=new Headers(H(H({},ne),lt(r.headers))));try{s.isRef(r==null?void 0:r.isLoading)&&(r.isLoading.value=!0);const i=await this.fetch(e,r);return It.guard(i)}finally{s.isRef(r==null?void 0:r.isLoading)&&(r.isLoading.value=!1)}}async get(t,e={}){return await this.request("GET",this.resolve(t),this.mergeOptions(e))}async post(t,e,r={}){return await this.request("POST",this.resolve(t),this.mergeOptions({body:JSON.stringify(s.unref(e)),headers:{"Content-Type":"application/json"}},r))}async put(t,e,r={}){return await this.request("PUT",this.resolve(t),this.mergeOptions({body:JSON.stringify(s.unref(e)),headers:{"Content-Type":"application/json"}},r))}async delete(t,e={}){return await this.request("DELETE",this.resolve(t),this.mergeOptions(e))}}class ie{constructor(t=window.fetch.bind(window)){$(this,"fetch");$(this,"pendingRequests",[]);return this.fetch=t,(e,r)=>{try{const i=Xt.default(JSON.stringify(H({url:e},r))),u=this.pendingRequests.findIndex(g=>i===g.hash);if(u>=0)return this.pendingRequests[u].promise;const l=this.fetch(e,r).then(Ot);return this.pendingRequests.push({hash:i,promise:l}),l.then(g=>{const d=this.pendingRequests.findIndex(v=>i===v.hash);return d>=0&&this.pendingRequests.splice(d,1),g})}catch{return this.fetch(e,r)}}}}function se(n=void 0){return new ie(n)}class K{normalize(){throw Error("This method is meant to be overriden.")}static denormalize(t){throw Error("This method is meant to be overriden.")}}var dt=typeof globalThis!="undefined"?globalThis:typeof window!="undefined"?window:typeof global!="undefined"?global:typeof self!="undefined"?self:{},Tt={exports:{}};(function(n,t){(function(e,r){n.exports=r()})(dt,function(){var e=1e3,r=6e4,i=36e5,u="millisecond",l="second",g="minute",d="hour",v="day",P="week",Y="month",T="quarter",M="year",O="date",f="Invalid Date",S=/^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/,A=/\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,j={name:"en",weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_")},E=function(m,h,o){var y=String(m);return!y||y.length>=h?m:""+Array(h+1-y.length).join(o)+m},V={s:E,z:function(m){var h=-m.utcOffset(),o=Math.abs(h),y=Math.floor(o/60),c=o%60;return(h<=0?"+":"-")+E(y,2,"0")+":"+E(c,2,"0")},m:function m(h,o){if(h.date()<o.date())return-m(o,h);var y=12*(o.year()-h.year())+(o.month()-h.month()),c=h.clone().add(y,Y),w=o-c<0,p=h.clone().add(y+(w?-1:1),Y);return+(-(y+(o-c)/(w?c-p:p-c))||0)},a:function(m){return m<0?Math.ceil(m)||0:Math.floor(m)},p:function(m){return{M:Y,y:M,w:P,d:v,D:O,h:d,m:g,s:l,ms:u,Q:T}[m]||String(m||"").toLowerCase().replace(/s$/,"")},u:function(m){return m===void 0}},R="en",N={};N[R]=j;var L=function(m){return m instanceof Z},F=function(m,h,o){var y;if(!m)return R;if(typeof m=="string")N[m]&&(y=m),h&&(N[m]=h,y=m);else{var c=m.name;N[c]=m,y=c}return!o&&y&&(R=y),y||!o&&R},I=function(m,h){if(L(m))return m.clone();var o=typeof h=="object"?h:{};return o.date=m,o.args=arguments,new Z(o)},b=V;b.l=F,b.i=L,b.w=function(m,h){return I(m,{locale:h.$L,utc:h.$u,x:h.$x,$offset:h.$offset})};var Z=function(){function m(o){this.$L=F(o.locale,null,!0),this.parse(o)}var h=m.prototype;return h.parse=function(o){this.$d=function(y){var c=y.date,w=y.utc;if(c===null)return new Date(NaN);if(b.u(c))return new Date;if(c instanceof Date)return new Date(c);if(typeof c=="string"&&!/Z$/i.test(c)){var p=c.match(S);if(p){var D=p[2]-1||0,C=(p[7]||"0").substring(0,3);return w?new Date(Date.UTC(p[1],D,p[3]||1,p[4]||0,p[5]||0,p[6]||0,C)):new Date(p[1],D,p[3]||1,p[4]||0,p[5]||0,p[6]||0,C)}}return new Date(c)}(o),this.$x=o.x||{},this.init()},h.init=function(){var o=this.$d;this.$y=o.getFullYear(),this.$M=o.getMonth(),this.$D=o.getDate(),this.$W=o.getDay(),this.$H=o.getHours(),this.$m=o.getMinutes(),this.$s=o.getSeconds(),this.$ms=o.getMilliseconds()},h.$utils=function(){return b},h.isValid=function(){return this.$d.toString()!==f},h.isSame=function(o,y){var c=I(o);return this.startOf(y)<=c&&c<=this.endOf(y)},h.isAfter=function(o,y){return I(o)<this.startOf(y)},h.isBefore=function(o,y){return this.endOf(y)<I(o)},h.$g=function(o,y,c){return b.u(o)?this[y]:this.set(c,o)},h.unix=function(){return Math.floor(this.valueOf()/1e3)},h.valueOf=function(){return this.$d.getTime()},h.startOf=function(o,y){var c=this,w=!!b.u(y)||y,p=b.p(o),D=function(tt,k){var Q=b.w(c.$u?Date.UTC(c.$y,k,tt):new Date(c.$y,k,tt),c);return w?Q:Q.endOf(v)},C=function(tt,k){return b.w(c.toDate()[tt].apply(c.toDate("s"),(w?[0,0,0,0]:[23,59,59,999]).slice(k)),c)},z=this.$W,U=this.$M,J=this.$D,x="set"+(this.$u?"UTC":"");switch(p){case M:return w?D(1,0):D(31,11);case Y:return w?D(1,U):D(0,U+1);case P:var nt=this.$locale().weekStart||0,rt=(z<nt?z+7:z)-nt;return D(w?J-rt:J+(6-rt),U);case v:case O:return C(x+"Hours",0);case d:return C(x+"Minutes",1);case g:return C(x+"Seconds",2);case l:return C(x+"Milliseconds",3);default:return this.clone()}},h.endOf=function(o){return this.startOf(o,!1)},h.$set=function(o,y){var c,w=b.p(o),p="set"+(this.$u?"UTC":""),D=(c={},c[v]=p+"Date",c[O]=p+"Date",c[Y]=p+"Month",c[M]=p+"FullYear",c[d]=p+"Hours",c[g]=p+"Minutes",c[l]=p+"Seconds",c[u]=p+"Milliseconds",c)[w],C=w===v?this.$D+(y-this.$W):y;if(w===Y||w===M){var z=this.clone().set(O,1);z.$d[D](C),z.init(),this.$d=z.set(O,Math.min(this.$D,z.daysInMonth())).$d}else D&&this.$d[D](C);return this.init(),this},h.set=function(o,y){return this.clone().$set(o,y)},h.get=function(o){return this[b.p(o)]()},h.add=function(o,y){var c,w=this;o=Number(o);var p=b.p(y),D=function(U){var J=I(w);return b.w(J.date(J.date()+Math.round(U*o)),w)};if(p===Y)return this.set(Y,this.$M+o);if(p===M)return this.set(M,this.$y+o);if(p===v)return D(1);if(p===P)return D(7);var C=(c={},c[g]=r,c[d]=i,c[l]=e,c)[p]||1,z=this.$d.getTime()+o*C;return b.w(z,this)},h.subtract=function(o,y){return this.add(-1*o,y)},h.format=function(o){var y=this,c=this.$locale();if(!this.isValid())return c.invalidDate||f;var w=o||"YYYY-MM-DDTHH:mm:ssZ",p=b.z(this),D=this.$H,C=this.$m,z=this.$M,U=c.weekdays,J=c.months,x=function(k,Q,vt,ct){return k&&(k[Q]||k(y,w))||vt[Q].substr(0,ct)},nt=function(k){return b.s(D%12||12,k,"0")},rt=c.meridiem||function(k,Q,vt){var ct=k<12?"AM":"PM";return vt?ct.toLowerCase():ct},tt={YY:String(this.$y).slice(-2),YYYY:this.$y,M:z+1,MM:b.s(z+1,2,"0"),MMM:x(c.monthsShort,z,J,3),MMMM:x(J,z),D:this.$D,DD:b.s(this.$D,2,"0"),d:String(this.$W),dd:x(c.weekdaysMin,this.$W,U,2),ddd:x(c.weekdaysShort,this.$W,U,3),dddd:U[this.$W],H:String(D),HH:b.s(D,2,"0"),h:nt(1),hh:nt(2),a:rt(D,C,!0),A:rt(D,C,!1),m:String(C),mm:b.s(C,2,"0"),s:String(this.$s),ss:b.s(this.$s,2,"0"),SSS:b.s(this.$ms,3,"0"),Z:p};return w.replace(A,function(k,Q){return Q||tt[k]||p.replace(":","")})},h.utcOffset=function(){return 15*-Math.round(this.$d.getTimezoneOffset()/15)},h.diff=function(o,y,c){var w,p=b.p(y),D=I(o),C=(D.utcOffset()-this.utcOffset())*r,z=this-D,U=b.m(this,D);return U=(w={},w[M]=U/12,w[Y]=U,w[T]=U/3,w[P]=(z-C)/6048e5,w[v]=(z-C)/864e5,w[d]=z/i,w[g]=z/r,w[l]=z/e,w)[p]||z,c?U:b.a(U)},h.daysInMonth=function(){return this.endOf(Y).$D},h.$locale=function(){return N[this.$L]},h.locale=function(o,y){if(!o)return this.$L;var c=this.clone(),w=F(o,y,!0);return w&&(c.$L=w),c},h.clone=function(){return b.w(this.$d,this)},h.toDate=function(){return new Date(this.valueOf())},h.toJSON=function(){return this.isValid()?this.toISOString():null},h.toISOString=function(){return this.$d.toISOString()},h.toString=function(){return this.$d.toUTCString()},m}(),xt=Z.prototype;return I.prototype=xt,[["$ms",u],["$s",l],["$m",g],["$H",d],["$W",v],["$M",Y],["$y",M],["$D",O]].forEach(function(m){xt[m[1]]=function(h){return this.$g(h,m[0],m[1])}}),I.extend=function(m,h){return m.$i||(m(h,Z,I),m.$i=!0),I},I.locale=F,I.isDayjs=L,I.unix=function(m){return I(1e3*m)},I.en=N[R],I.Ls=N,I.p={},I})})(Tt);var B=Tt.exports,Dt={exports:{}};(function(n,t){(function(e,r){n.exports=r()})(dt,function(){var e="minute",r=/[+-]\d\d(?::?\d\d)?/g,i=/([+-]|\d\d)/g;return function(u,l,g){var d=l.prototype;g.utc=function(f){var S={date:f,utc:!0,args:arguments};return new l(S)},d.utc=function(f){var S=g(this.toDate(),{locale:this.$L,utc:!0});return f?S.add(this.utcOffset(),e):S},d.local=function(){return g(this.toDate(),{locale:this.$L,utc:!1})};var v=d.parse;d.parse=function(f){f.utc&&(this.$u=!0),this.$utils().u(f.$offset)||(this.$offset=f.$offset),v.call(this,f)};var P=d.init;d.init=function(){if(this.$u){var f=this.$d;this.$y=f.getUTCFullYear(),this.$M=f.getUTCMonth(),this.$D=f.getUTCDate(),this.$W=f.getUTCDay(),this.$H=f.getUTCHours(),this.$m=f.getUTCMinutes(),this.$s=f.getUTCSeconds(),this.$ms=f.getUTCMilliseconds()}else P.call(this)};var Y=d.utcOffset;d.utcOffset=function(f,S){var A=this.$utils().u;if(A(f))return this.$u?0:A(this.$offset)?Y.call(this):this.$offset;if(typeof f=="string"&&(f=function(R){R===void 0&&(R="");var N=R.match(r);if(!N)return null;var L=(""+N[0]).match(i)||["-",0,0],F=L[0],I=60*+L[1]+ +L[2];return I===0?0:F==="+"?I:-I}(f))===null)return this;var j=Math.abs(f)<=16?60*f:f,E=this;if(S)return E.$offset=j,E.$u=f===0,E;if(f!==0){var V=this.$u?this.toDate().getTimezoneOffset():-1*this.utcOffset();(E=this.local().add(j+V,e)).$offset=j,E.$x.$localOffset=V}else E=this.utc();return E};var T=d.format;d.format=function(f){var S=f||(this.$u?"YYYY-MM-DDTHH:mm:ss[Z]":"");return T.call(this,S)},d.valueOf=function(){var f=this.$utils().u(this.$offset)?0:this.$offset+(this.$x.$localOffset||new Date().getTimezoneOffset());return this.$d.valueOf()-6e4*f},d.isUTC=function(){return!!this.$u},d.toISOString=function(){return this.toDate().toISOString()},d.toString=function(){return this.toDate().toUTCString()};var M=d.toDate;d.toDate=function(f){return f==="s"&&this.$offset?g(this.format("YYYY-MM-DD HH:mm:ss:SSS")).toDate():M.call(this)};var O=d.diff;d.diff=function(f,S,A){if(f&&this.$u===f.$u)return O.call(this,f,S,A);var j=this.local(),E=g(f).local();return O.call(j,E,S,A)}}})})(Dt);var ae=Dt.exports,Mt={exports:{}};(function(n,t){(function(e,r){n.exports=r()})(dt,function(){var e={year:0,month:1,day:2,hour:3,minute:4,second:5},r={};return function(i,u,l){var g,d=function(T,M,O){O===void 0&&(O={});var f=new Date(T);return function(S,A){A===void 0&&(A={});var j=A.timeZoneName||"short",E=S+"|"+j,V=r[E];return V||(V=new Intl.DateTimeFormat("en-US",{hour12:!1,timeZone:S,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",timeZoneName:j}),r[E]=V),V}(M,O).formatToParts(f)},v=function(T,M){for(var O=d(T,M),f=[],S=0;S<O.length;S+=1){var A=O[S],j=A.type,E=A.value,V=e[j];V>=0&&(f[V]=parseInt(E,10))}var R=f[3],N=R===24?0:R,L=f[0]+"-"+f[1]+"-"+f[2]+" "+N+":"+f[4]+":"+f[5]+":000",F=+T;return(l.utc(L).valueOf()-(F-=F%1e3))/6e4},P=u.prototype;P.tz=function(T,M){T===void 0&&(T=g);var O=this.utcOffset(),f=this.toDate(),S=f.toLocaleString("en-US",{timeZone:T}),A=Math.round((f-new Date(S))/1e3/60),j=l(S).$set("millisecond",this.$ms).utcOffset(15*-Math.round(f.getTimezoneOffset()/15)-A,!0);if(M){var E=j.utcOffset();j=j.add(O-E,"minute")}return j.$x.$timezone=T,j},P.offsetName=function(T){var M=this.$x.$timezone||l.tz.guess(),O=d(this.valueOf(),M,{timeZoneName:T}).find(function(f){return f.type.toLowerCase()==="timezonename"});return O&&O.value};var Y=P.startOf;P.startOf=function(T,M){if(!this.$x||!this.$x.$timezone)return Y.call(this,T,M);var O=l(this.format("YYYY-MM-DD HH:mm:ss:SSS"));return Y.call(O,T,M).tz(this.$x.$timezone,!0)},l.tz=function(T,M,O){var f=O&&M,S=O||M||g,A=v(+l(),S);if(typeof T!="string")return l(T).tz(S);var j=function(N,L,F){var I=N-60*L*1e3,b=v(I,F);if(L===b)return[I,L];var Z=v(I-=60*(b-L)*1e3,F);return b===Z?[I,b]:[N-60*Math.min(b,Z)*1e3,Math.max(b,Z)]}(l.utc(T,f).valueOf(),A,S),E=j[0],V=j[1],R=l(E).utcOffset(V);return R.$x.$timezone=S,R},l.tz.guess=function(){return Intl.DateTimeFormat().resolvedOptions().timeZone},l.tz.setDefault=function(T){g=T}}})})(Mt);var oe=Mt.exports;B.extend(ae),B.extend(oe);const ut=class extends K{constructor({after:t=null,before:e=null}={}){super();$(this,"after");$(this,"before");this.after=t,this.before=e}normalize(){this.constructor.ensureTimezoneIsSet();let t=null,e=null;return G.default(this.after)||(t=B.tz(this.after,this.constructor.userTimezone).hour(0).minute(0).second(0).tz("UTC").format("YYYY-MM-DD[T]HH:mm:ss[Z]")),G.default(this.before)||(e=B.tz(this.before,this.constructor.userTimezone).hour(0).minute(0).second(0).add(1,"day").subtract(1,"second").tz("UTC").format("YYYY-MM-DD[T]HH:mm:ss[Z]")),{after:t,before:e}}static denormalize(t){this.ensureTimezoneIsSet();let e=null,r=null;return G.default(t.after)||(e=B.tz(t.after,"UTC").tz(ut.userTimezone).hour(0).minute(0).second(0).format("YYYY-MM-DD")),G.default(t.before)||(r=B.tz(t.before,"UTC").tz(ut.userTimezone).hour(0).minute(0).second(0).add(1,"day").subtract(1,"second").format("YYYY-MM-DD")),new this({after:e,before:r})}static ensureTimezoneIsSet(){var t;this.userTimezone=(t=this.userTimezone)!=null?t:B.tz.guess()||"UTC"}};let mt=ut;$(mt,"userTimezone");function ue(n){return n==null?!0:typeof n=="string"?n.trim().length===0:typeof n=="function"||Array.isArray(n)?n.length===0:n instanceof Object?Object.keys(n).length===0:!1}function yt(n){if(!(n instanceof Object))return n;if(Array.isArray(n))return n.filter(yt);const t=H({},n);return Object.keys(t).forEach(e=>{t[e]instanceof Object&&(t[e]=yt(t[e])),ue(t[e])&&delete t[e]}),t}class ce{constructor(t={}){$(this,"_filters",[]);if(!(t instanceof Object))throw Error("A FilterCollection expects an object.");Object.keys(t).forEach(e=>{if(!(t[e]instanceof K))throw Error(`Filter ${e} doesn't extend the Filter class.`);this[e]=t[e],this._filters.push(e)})}normalize(){const t={};return this._filters.forEach(e=>{const r=this[e];t[e]=r.normalize()}),yt(t)}async denormalize(t,e){for(const r of this._filters)typeof t[r]!="undefined"&&(this[r]=await Object.getPrototypeOf(this[r]).constructor.denormalize(t[r],e));return this}}async function fe(n={},t={preserveQuery:!1}){if(typeof n!="function")throw Error("initialState should be provided as a function.");const e=ht.useRoute(),r=ht.useRouter(),i=s.ref(n());async function u(v){Object.assign(s.unref(i),await s.unref(i).denormalize(v.query,t))}function l(){i.value=W.default(n())}function g(v={}){const P={};return t.preserveQuery===!0&&Object.assign(P,e.query),Object.assign(P,s.unref(i).normalize(),v)}async function d(v={}){await r.push(Object.assign(H({},e),{query:g(v)}))}return ht.onBeforeRouteUpdate(v=>u(v)),await u(e),{filters:i,buildQueryParams:g,submit:d,clear:l}}const he=async({state:n={},methods:t={},name:e="store"}={})=>{n=s.reactive(n);const r=ft(H({name:e,state:n},Object.keys(t).reduce(function(i,u){const l=t[u];return i[u]=function(){return l(n,...arguments)},i},{})),{async use(i){return await i.install(this),this}});return r.install=i=>i.provide(e,ft(H({},r),{state:s.readonly(n)})),r},gt=(n="store")=>s.inject(n);class Et{constructor(t){Object.keys(t).forEach(e=>{this[e]=new st(t[e])})}for(t){if(typeof t=="string"&&Object.keys(this).includes(t))return this[t];if(!Object.keys(this).includes(t["@type"]))throw Error(`Endpoint not found for item ${t["@type"]}.`);return this[t["@type"]]}}class st{constructor(t){$(this,"endpoint");this.endpoint=t}toString(){return this.endpoint}toJSON(){return this.endpoint}withQuery(t){const e=new it.URI(this.endpoint),r=new it.QueryString(e).withParams(t);return new st(e.withQuery(r.toString()).toString())}paginated(t){if(t===!1)return this.withQuery({pagination:0});const e={pagination:1};return t&&(e.itemsPerPage=t),this.withQuery(e)}synchronize(t=window.location.href){return this.withQuery(new it.QueryString(new it.URI(t)).getParams())}}const le=(n,t)=>gt(t).state.endpoints[n];function at(n){return n=s.unref(n),n==null?!1:Object.keys(n).includes("@id")&&n["@id"]!=null}function _(n){return n=s.unref(n),n===null?null:typeof n=="string"?n:(ot(n),n["@id"])}function zt(n){const t=_(n);return t.substring(t.lastIndexOf("/")+1)}function de(n){return n.map(_)}function me(n){return n.map(zt)}function ot(n,t=null){if(typeof n!="object"||!("@id"in n))throw Error("Invalid item.");if(t!==null){if(typeof t=="string"&&t!==n["@type"])throw Error(`Expected item of type "${t}", got "${n["@type"]}".`);if(Array.isArray(t)&&t.includes(n["@type"])===!1)throw Error(`Expected item of any "${t.join("|")}", got "${n["@type"]}".`)}}function X(n,t){return _(n)===_(t)}function jt(n,t){if(n=s.unref(n),n=Array.from(n).map(s.unref),t=s.unref(t),Array.isArray(t)){const e=t;for(const r of e)if(jt(n,r))return!0;return!1}for(const e of n)if(X(e,t))return!0;return!1}function ye(n,t){const e=n.findIndex(r=>X(r,t));return e>=0&&n.splice(e,1),n}function pt(n,t){const e=n.find(r=>X(r,t));return typeof e=="undefined"?null:e}function ge(n,t){return n.findIndex(e=>X(e,t))}function pe(n,t){return n.filter(e=>e["@type"]===t)}function $e(n){Object.assign(n,n.map(t=>_(t)))}function we(n,t){return n=s.unref(n),ot(n),Object.assign({"@id":n["@id"],"@type":n["@type"]},t)}class $t extends Error{constructor(){super(...arguments);$(this,"statusCode")}get title(){return this["hydra:title"]}get description(){return this["hydra:description"]}}class Ct{constructor(){$(this,"id");$(this,"propertyPath");$(this,"message");$(this,"code");this.id=Bt.v4()}}class At extends $t{constructor(t){super();$(this,"_violations",[]);Object.assign(this,{*[Symbol.iterator](){yield*this.violations}}),Object.assign(this,t)}get violations(){return this._violations}set violations(t){this._violations=t.map(e=>Object.assign(new Ct,e))}getPropertyPaths(){return[...new Set(this.violations.map(({propertyPath:t})=>t))]}getViolations(t){const e=Array.from(arguments);return e.length===0?this.violations:G.default(e[0])?this.violations.filter(r=>G.default(r.propertyPath)):this.violations.filter(r=>t===r.propertyPath)}}class _t{constructor(t={}){Object.assign(this,ft(H({},t),{*[Symbol.iterator](){yield*this["hydra:member"]||[]}}))}get length(){return this.items.length}get totalItems(){return this["hydra:totalItems"]||0}get items(){return this["hydra:member"]||[]}forEach(t){return(this["hydra:member"]||[]).forEach(t)}map(t){return(this["hydra:member"]||[]).map(t)}filter(t){return(this["hydra:member"]||[]).filter(t)}find(t){return(this["hydra:member"]||[]).find(t)}findIndex(t){return(this["hydra:member"]||[]).findIndex(t)}}function be(n){if(typeof n!="object"||n==null)throw Error("Invalid object.");return Object.keys(n).forEach(t=>delete n[t]),n}function wt(n,t){return n=be(n),Object.assign(n,t)}function ve(n){const t=gt(),e=s.ref(s.unref(n)),r=s.reactive(W.default(s.unref(n))),i=s.computed(()=>!at(s.unref(r))),u=s.ref(!1);s.watch(e,v=>wt(r,v));const l=s.computed(()=>JSON.stringify(s.unref(r))!==JSON.stringify(s.unref(e)));return{item:r,isUnsavedDraft:l,isCreationMode:i,isSubmitting:u,reset:()=>wt(r,W.default(s.unref(n))),submit:async()=>{try{u.value=!0;const v=await t.upsertItem(r);return e.value=v,wt(r,W.default(v)),v}finally{u.value=!1}}}}function Se(){const n=i=>{i=s.unref(i),i.querySelectorAll("[name]").forEach(function(u){u.setCustomValidity("")})},t=(i,u=!0)=>{i=s.unref(i);const l=i.checkValidity();return!l&&u&&i.reportValidity(),l},e=(i,u)=>{n(i),Array.from(u).forEach(l=>r(i,l)),t(i)},r=(i,{propertyPath:u,message:l})=>{var g;i=s.unref(i),(g=i.querySelector(`[name='${u}']`))==null||g.setCustomValidity(l)};return{resetValidity:n,bindViolations:e,validate:t}}let bt;const Ie=1,Oe=2;class Yt{constructor(t,e){$(this,"readyState",Ie);$(this,"url");$(this,"withCredentials");var r;this.url=t,this.withCredentials=(r=e==null?void 0:e.withCredentials)!=null?r:!1,setTimeout(()=>this.onopen(),10)}onerror(){}onmessage(){}onopen(){}close(){this.readyState=Oe}triggerEvent(t){this.onmessage(t)}triggerError(t){this.onerror(t)}}(()=>{var n;return typeof process!="undefined"&&((n=process==null?void 0:process.env)==null?void 0:n.NODE_ENV)==="test"||"test"===void 0})()?bt=Yt:bt=window.EventSource;var Te=bt;const De=(n,t)=>{const e=new Ht(n,t);return Object.assign(e,{install(r){r.provide("mercure",e)}})},Ut=()=>s.inject("mercure");function Me(n,t){return n.length===t.length&&n.every(e=>t.includes(e))}class Ht{constructor(t,e={}){$(this,"hub");$(this,"options");$(this,"connection");$(this,"subscribedTopics");$(this,"endpoint");$(this,"emitter");$(this,"lastEventId");Object.assign(this,{hub:t,options:s.reactive(e)}),this.lastEventId=s.ref(),this.subscribedTopics=s.ref([]),this.endpoint=s.computed(()=>{const r=new URL(this.hub);return s.unref(this.subscribedTopics).forEach(i=>r.searchParams.append("topic",i)),s.unref(this.lastEventId)&&r.searchParams.append("Last-Event-ID",s.unref(this.lastEventId)),r.toString()}),this.emitter=te.default()}subscribe(t=["*"],e=!0){Array.isArray(t)||(t=[t]);const r=Array.from(s.unref(this.subscribedTopics)),i=[...new Set([...s.unref(this.subscribedTopics),...t])];this.subscribedTopics.value=i,e&&!Me(r,i)&&this.listen()}unsubscribe(t){Array.isArray(t)||(t=[t]),this.subscribedTopics.value=this.subscribedTopics.value.filter(e=>!t.includes(e)),this.connection&&this.listen()}addListener(t){return this.emitter.on("message",t)}removeListener(t){return this.emitter.off("message",t)}listen(){if(s.unref(this.subscribedTopics).length===0){this.stop();return}this.connect()}connect(){this.stop(),this.connection=new Te(s.unref(this.endpoint),this.options),this.connection.onopen=()=>this.emitter.emit("open",{endpoint:s.unref(this.endpoint)}),this.connection.onmessage=t=>(this.lastEventId.value=t.lastEventId,this.emitter.emit("message",t)),this.connection.onerror=t=>{this.emitter.emit("error",t),typeof this.options.reconnectInterval=="number"&&setTimeout(()=>this.connect(),this.options.reconnectInterval)}}stop(){var t;(t=this.connection)==null||t.close(),this.connection=void 0}}const qt=(n,t)=>Object.assign(t,n),Rt=()=>{};function Nt(n,t,e=["*"],r=qt,i=Rt){Array.isArray(t)||(t=[t]),Array.isArray(e)||(e=[e]);const u=l=>{try{const g=JSON.parse(l.data);if(!at(g))return;if(Object.keys(g).length===1){i(_(g));return}for(const d of t)X(_(g),d)&&r(g,s.unref(d))}catch(g){console.debug(g)}};return n.addListener(u),n.subscribe(e),u}const Pt=(n,t,e)=>{Array.isArray(t)||(t=[t]);const r=i=>{try{const u=JSON.parse(i.data);for(const l of t)if(typeof ee.default(l).fromUri(_(u))!="undefined"){e(u);break}}catch{}};return n.addListener(r),n.subscribe(t),r},Ee=n=>{n=n!=null?n:Ut();const t=[];return s.onUnmounted(()=>{for(const r of t)n.removeListener(r)}),{synchronize:(r,i=["*"],u=qt,l=Rt)=>{t.push(Nt(n,r,i,u,l))},on(r,i){const u=Pt(n,r,i);return t.push(u),u}}},ze={"hydra:Collection":_t,"hydra:Error":$t,ConstraintViolationList:At},Vt=async(n,t)=>{const e=s.ref(!1),r=Kt.asyncComputed(n,t,{evaluating:e});return new Promise(i=>{s.watch(e,u=>{u===!1&&i(r)})})};class Lt{constructor(){Object.assign(this,{*[Symbol.iterator](){yield*Object.values(this)}})}get length(){return Array.from(this).length}forEach(t){return Array.from(this).forEach(t)}map(t){return Array.from(this).map(t)}filter(t){return Array.from(this).filter(t)}find(t){return Array.from(this).find(t)}findIndex(t){return Array.from(this).findIndex(t)}}const je=function(n){throw n};class Ce{constructor(t,e={}){$(this,"api");$(this,"endpoints");$(this,"classmap");var u;this.api=t;const{endpoints:r,classmap:i}=e;this.endpoints=new Et(r!=null?r:{}),this.classmap=H(H({},ze),i),this.errorHandler=(u=e.errorHandler)!=null?u:je}factory(t,e){var r;for(const i in this.classmap)if(i===((r=t["@type"])!=null?r:t)){const u=this.classmap[i];return t instanceof u?t:(t=Object.assign(new u,t),e&&Object.assign(t,{statusCode:e}),s.reactive(t))}return t}storeItem({state:t},e){const r=_(e);return Object.keys(t.items).includes(r)?Object.assign(t.items[r],e):t.items[r]=s.ref(e),t.items[r]}removeItem({state:t},e){const r=_(e);delete t.items[r]}async clearItems({state:t}){t.items=s.reactive(new Lt)}async handle(t,{errorHandler:e=this.errorHandler}={}){var r,i,u,l,g;try{const{data:d}=await t();return this.factory(d)}catch(d){typeof((r=d.response)==null?void 0:r.data)=="object"&&((i=d.response)==null?void 0:i.data)!=null&&(d=this.factory(d.response.data,(u=d.response)==null?void 0:u.status)),d.statusCode=(g=d.statusCode)!=null?g:(l=d.response)==null?void 0:l.status,e(d)}}async fetchItem({state:t},e,r){const i=_(e),u=await this.handle(()=>this.api.get(i,r),r);return this.storeItem({state:t},this.factory(u))}async getItem({state:t},e,r){if(e===null)return null;const i=_(e),u=pt(t.items,i);if(u!=null)return u;if(typeof e=="object"){const l=this.factory(e);return this.storeItem({state:t},l)}return await this.fetchItem({state:t},i,r)}async fetchCollection({state:t},e,r){const i=await this.handle(()=>this.api.get(e,r),r);i["hydra:member"]=i["hydra:member"].map(l=>this.factory(l));const u=this.factory(i);return u["hydra:member"]=u["hydra:member"].map(l=>this.factory(l)),u}async createItem({state:t},e,r){const i=this.endpoints.for(e);return e=await this.handle(()=>this.api.post(i,e,r),r),this.storeItem({state:t},e)}async updateItem({state:t},e,r){return ot(e),e=await this.handle(()=>this.api.put(_(e),e,r),r),this.storeItem({state:t},e)}async upsertItem({state:t},e,r){return at(e)?this.updateItem({state:t},e,r):this.createItem({state:t},e,r)}async deleteItem({state:t},e,r){const i=_(e);await this.handle(()=>this.api.delete(i,r),r),e=pt(t.items,i),e!==null&&this.removeItem({state:t},e)}async getRelation({state:t},e,r){return e===null?null:typeof e=="object"?e:typeof e=="function"?Vt(()=>this.getRelation({state:t},e(),r)):await this.getItem({state:t},e,r)}async getRelations({state:t},e,r){return typeof e=="function"?Vt(()=>this.getRelations({state:t},e(),r),[]):Promise.all(e.map(i=>this.getRelation({state:t},i,r)))}async install(t){t.state.items=s.reactive(new Lt),t.state.endpoints=s.readonly(this.endpoints),t.state.classmap=s.readonly(this.classmap),t.storeItem=e=>this.storeItem(t,e),t.removeItem=e=>this.removeItem(t,e),t.clearItems=()=>this.clearItems(t),t.getItem=(e,r)=>this.getItem(t,e,r),t.fetchItem=(e,r)=>this.fetchItem(t,e,r),t.fetchCollection=(e,r)=>this.fetchCollection(t,e,r),t.createItem=(e,r)=>this.createItem(t,e,r),t.updateItem=(e,r)=>this.updateItem(t,e,r),t.upsertItem=(e,r)=>this.upsertItem(t,e,r),t.deleteItem=(e,r)=>this.deleteItem(t,e,r),t.getRelation=(e,r)=>this.getRelation(t,e,r),t.getRelations=(e,r)=>this.getRelations(t,e,r),t.endpoint=e=>t.state.endpoints[e],t.getItemsByType=e=>t.state.items.filter(r=>e===r["@type"])}}function kt(n){if(typeof n=="string")return n;try{return _(n)}catch{return null}}function Ae(n){return n.map(t=>kt(t))}async function Ft(n,t){try{return await t.getItem(n)}catch{return null}}async function _e(n,t){return Promise.all(n.map(e=>Ft(e,t)))}class Ye extends K{constructor(t,e=!1){super();$(this,"items",[]);$(this,"multiple");this.items=Array.isArray(t)?t:[t],this.multiple=e}get item(){var t;return(t=this.items[0])!=null?t:null}set item(t){this.items=[t],this.multiple=!1}normalize(){return this.multiple||this.items.length>1?Ae(this.items):kt(this.item)}static async denormalize(t,{store:e,multiple:r}){return Array.isArray(t)?new this(await _e(t),r!=null?r:!0):new this([await Ft(t,e)],r!=null?r:!1)}}const Ue={asc:"desc",desc:"asc"};class He extends K{constructor(t={}){super();$(this,"order");this.order=t}revert(){var e;const t={};for(const r in this.order){const i=this.order[r];t[r]=(e=Ue[i])!=null?e:i}return this.order=t,this}normalize(){return this.order}static denormalize(t){return typeof t=="object"&&t!=null?new this(t):new this}}class qe extends K{constructor(t=null){super();$(this,"value");this.value=t}normalize(){var t;return[void 0,null,""].includes((t=this.value)==null?void 0:t.trim())?null:this.value.trim()}static denormalize(t){return[void 0,null,""].includes(t==null?void 0:t.trim())?new this(null):new this(t.trim())}}class Re extends K{constructor(t=!1){super();$(this,"value");this.value=t}normalize(){return this.value?"true":"false"}static denormalize(t){var e;return[void 0,null,""].includes(t==null?void 0:t.trim())?new this(!1):typeof t=="boolean"?new this(t):new this(["true","on","yes","1"].includes((e=t==null?void 0:t.trim())==null?void 0:e.toLowerCase()))}}class Ne{constructor(){$(this,"fields");$(this,"preload")}get headers(){var e,r,i,u,l;const t={};return((r=(e=this.preload)==null?void 0:e.length)!=null?r:0)!==0&&(t.preload=[...new Set(this.preload)].map(g=>`"${g}"`).join(", ")),((u=(i=this.fields)==null?void 0:i.length)!=null?u:0)!==0&&(t.fields=[...new Set([...this.fields,...(l=this.preload)!=null?l:[]])].map(g=>`"${g}"`).join(", ")),t}}function Pe({fields:n,preload:t}={}){return Object.assign(new Ne,{fields:n},{preload:t}).headers}a.ApiClient=re,a.ConstraintViolationList=At,a.DateRangeFilter=mt,a.FakeEventSource=Yt,a.FilterCollection=ce,a.HttpError=It,a.HydraCollection=_t,a.HydraEndpoint=st,a.HydraEndpoints=Et,a.HydraError=$t,a.HydraPlugin=Ce,a.ItemFilter=Ye,a.Mercure=Ht,a.OrderFilter=He,a.TextFilter=qe,a.TruthyFilter=Re,a.Violation=Ct,a.areSameIris=X,a.checkValidItem=ot,a.containsIri=jt,a.createMercure=De,a.createStore=he,a.getId=zt,a.getIds=me,a.getIri=_,a.getIris=de,a.getItemByIri=pt,a.getItemIndexByIri=ge,a.getItemsByType=pe,a.hasIri=at,a.mercureSync=Nt,a.normalizeIris=$e,a.on=Pt,a.partialItem=we,a.useEndpoint=le,a.useFilters=fe,a.useFormValidation=Se,a.useItemForm=ve,a.useMercure=Ut,a.useMercureSync=Ee,a.useStore=gt,a.vulcain=Pe,a.withoutDuplicates=se,a.withoutIri=ye,Object.defineProperty(a,"__esModule",{value:!0}),a[Symbol.toStringTag]="Module"});
