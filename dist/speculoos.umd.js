var Le=Object.defineProperty,ke=Object.defineProperties;var Fe=Object.getOwnPropertyDescriptors;var Jt=Object.getOwnPropertySymbols;var xe=Object.prototype.hasOwnProperty,Ze=Object.prototype.propertyIsEnumerable;var wt=(a,s,R)=>s in a?Le(a,s,{enumerable:!0,configurable:!0,writable:!0,value:R}):a[s]=R,H=(a,s)=>{for(var R in s||(s={}))xe.call(s,R)&&wt(a,R,s[R]);if(Jt)for(var R of Jt(s))Ze.call(s,R)&&wt(a,R,s[R]);return a},ct=(a,s)=>ke(a,Fe(s));var p=(a,s,R)=>(wt(a,typeof s!="symbol"?s+"":s,R),R);(function(a,s){typeof exports=="object"&&typeof module!="undefined"?s(exports,require("vue"),require("clone-deep"),require("md5"),require("is-empty"),require("vue-router"),require("psr7-js"),require("uuid"),require("mitt"),require("uri-templates"),require("@vueuse/core")):typeof define=="function"&&define.amd?define(["exports","vue","clone-deep","md5","is-empty","vue-router","psr7-js","uuid","mitt","uri-templates","@vueuse/core"],s):(a=typeof globalThis!="undefined"?globalThis:a||self,s(a.Speculoos={},a.Vue,a.clone$1,a.md5,a.empty,a.vueRouter,a.psr7Js,a.uuid,a.mitt,a.uriTemplate,a.core))})(this,function(a,s,R,Wt,Gt,ft,et,Kt,Xt,te,ee){"use strict";function nt(n){return n&&typeof n=="object"&&"default"in n?n:{default:n}}var vt=nt(R),ne=nt(Wt),Z=nt(Gt),re=nt(Xt),ie=nt(te);class St extends Error{constructor(t){super(t.statusText);this.response=t,this.statusCode=parseInt(this.response.status)}isStatusCode(t){const e=r=>parseInt(r)===this.statusCode;for(let r of arguments)if(e(r))return!0;return!1}isClientError(){return this.statusCode>=400&&this.statusCode<500}isServerError(){return this.statusCode>500}static guard(t){if(t.status>=400)throw new this(t);return t}}const ht=n=>{if(!(n instanceof Headers))return n;const t={};for(let e of n.keys())t[e]=n.get(e);return t},se={Accept:"application/ld+json, application/json"},Tt=async n=>{try{const t=await n.text();try{n.data=JSON.parse(t),n.json=()=>new Promise(e=>e(n.data))}catch{n.data=t,n.json=()=>new Promise(r=>r(n.data))}}catch{}return n};class ae{constructor({baseUri:t="",options:e={},fetcher:r=window.fetch.bind(window)}={}){p(this,"baseUri");p(this,"options");p(this,"fetch");this.baseUri=t,this.options=e,this.fetch=async(i,o)=>r(i,o).then(Tt)}resolve(t){return new URL(t,this.baseUri).toString()}mergeOptions(t){let e=H({},this.options);Object.keys(e).includes("headers")&&(e.headers=ht(e.headers));for(let r of arguments){let i=H({},r);Object.keys(i).includes("headers")&&(i.headers=H({},ht(i.headers))),e=H(H({},vt.default(e)),vt.default(i))}return e}async request(t,e,r){e=`${s.unref(e)}`,r=this.mergeOptions({method:t},r),Object.keys(r).includes("headers")&&(r.headers=new Headers(H(H({},se),ht(r.headers))));try{s.isRef(r==null?void 0:r.isLoading)&&(r.isLoading.value=!0);const i=await this.fetch(e,r);return St.guard(i)}finally{s.isRef(r==null?void 0:r.isLoading)&&(r.isLoading.value=!1)}}async get(t,e={}){return await this.request("GET",this.resolve(t),this.mergeOptions(e))}async post(t,e,r={}){return await this.request("POST",this.resolve(t),this.mergeOptions({body:JSON.stringify(s.unref(e)),headers:{"Content-Type":"application/json"}},r))}async put(t,e,r={}){return await this.request("PUT",this.resolve(t),this.mergeOptions({body:JSON.stringify(s.unref(e)),headers:{"Content-Type":"application/json"}},r))}async delete(t,e={}){return await this.request("DELETE",this.resolve(t),this.mergeOptions(e))}}class oe{constructor(t=window.fetch.bind(window)){p(this,"fetch");p(this,"pendingRequests",[]);return this.fetch=t,(e,r)=>{try{const i=ne.default(JSON.stringify(H({url:e},r))),o=this.pendingRequests.findIndex(g=>i===g.hash);if(o>=0)return this.pendingRequests[o].promise;const l=this.fetch(e,r).then(Tt);return this.pendingRequests.push({hash:i,promise:l}),l.then(g=>(this.removePendingRequest(i),g),g=>{throw this.removePendingRequest(i),g})}catch{return this.fetch(e,r)}}}removePendingRequest(t){const e=this.pendingRequests.findIndex(r=>t===r.hash);e>=0&&this.pendingRequests.splice(e,1)}}function ue(n=void 0){return new oe(n)}const K=(n,t=!0,e=[])=>{if(typeof n!="object"||n==null)return n;const r=e.find(o=>o.orig===n);if(r!=null)return r.cloned;let i=Object.assign(Object.create(Object.getPrototypeOf(n)),n);if(Array.isArray(n)&&(i=Object.values(i)),e.push({orig:n,cloned:i}),t)for(const o in i)typeof i[o]=="object"&&i[o]!=null&&(i[o]=K(i[o],t,e));return"__clone"in i&&typeof i.__clone=="function"&&i.__clone(),i};class G{normalize(){throw Error("This method is meant to be overriden.")}static denormalize(t){throw Error("This method is meant to be overriden.")}}var lt=typeof globalThis!="undefined"?globalThis:typeof window!="undefined"?window:typeof global!="undefined"?global:typeof self!="undefined"?self:{},Dt={exports:{}};(function(n,t){(function(e,r){n.exports=r()})(lt,function(){var e=1e3,r=6e4,i=36e5,o="millisecond",l="second",g="minute",d="hour",v="day",V="week",_="month",I="quarter",O="year",D="date",f="Invalid Date",S=/^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/,Y=/\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,j={name:"en",weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_")},M=function(m,h,u){var y=String(m);return!y||y.length>=h?m:""+Array(h+1-y.length).join(u)+m},L={s:M,z:function(m){var h=-m.utcOffset(),u=Math.abs(h),y=Math.floor(u/60),c=u%60;return(h<=0?"+":"-")+M(y,2,"0")+":"+M(c,2,"0")},m:function m(h,u){if(h.date()<u.date())return-m(u,h);var y=12*(u.year()-h.year())+(u.month()-h.month()),c=h.clone().add(y,_),b=u-c<0,$=h.clone().add(y+(b?-1:1),_);return+(-(y+(u-c)/(b?c-$:$-c))||0)},a:function(m){return m<0?Math.ceil(m)||0:Math.floor(m)},p:function(m){return{M:_,y:O,w:V,d:v,D,h:d,m:g,s:l,ms:o,Q:I}[m]||String(m||"").toLowerCase().replace(/s$/,"")},u:function(m){return m===void 0}},q="en",P={};P[q]=j;var k=function(m){return m instanceof B},x=function(m,h,u){var y;if(!m)return q;if(typeof m=="string")P[m]&&(y=m),h&&(P[m]=h,y=m);else{var c=m.name;P[c]=m,y=c}return!u&&y&&(q=y),y||!u&&q},T=function(m,h){if(k(m))return m.clone();var u=typeof h=="object"?h:{};return u.date=m,u.args=arguments,new B(u)},w=L;w.l=x,w.i=k,w.w=function(m,h){return T(m,{locale:h.$L,utc:h.$u,x:h.$x,$offset:h.$offset})};var B=function(){function m(u){this.$L=x(u.locale,null,!0),this.parse(u)}var h=m.prototype;return h.parse=function(u){this.$d=function(y){var c=y.date,b=y.utc;if(c===null)return new Date(NaN);if(w.u(c))return new Date;if(c instanceof Date)return new Date(c);if(typeof c=="string"&&!/Z$/i.test(c)){var $=c.match(S);if($){var z=$[2]-1||0,C=($[7]||"0").substring(0,3);return b?new Date(Date.UTC($[1],z,$[3]||1,$[4]||0,$[5]||0,$[6]||0,C)):new Date($[1],z,$[3]||1,$[4]||0,$[5]||0,$[6]||0,C)}}return new Date(c)}(u),this.$x=u.x||{},this.init()},h.init=function(){var u=this.$d;this.$y=u.getFullYear(),this.$M=u.getMonth(),this.$D=u.getDate(),this.$W=u.getDay(),this.$H=u.getHours(),this.$m=u.getMinutes(),this.$s=u.getSeconds(),this.$ms=u.getMilliseconds()},h.$utils=function(){return w},h.isValid=function(){return this.$d.toString()!==f},h.isSame=function(u,y){var c=T(u);return this.startOf(y)<=c&&c<=this.endOf(y)},h.isAfter=function(u,y){return T(u)<this.startOf(y)},h.isBefore=function(u,y){return this.endOf(y)<T(u)},h.$g=function(u,y,c){return w.u(u)?this[y]:this.set(c,u)},h.unix=function(){return Math.floor(this.valueOf()/1e3)},h.valueOf=function(){return this.$d.getTime()},h.startOf=function(u,y){var c=this,b=!!w.u(y)||y,$=w.p(u),z=function(tt,F){var W=w.w(c.$u?Date.UTC(c.$y,F,tt):new Date(c.$y,F,tt),c);return b?W:W.endOf(v)},C=function(tt,F){return w.w(c.toDate()[tt].apply(c.toDate("s"),(b?[0,0,0,0]:[23,59,59,999]).slice(F)),c)},E=this.$W,U=this.$M,J=this.$D,Q="set"+(this.$u?"UTC":"");switch($){case O:return b?z(1,0):z(31,11);case _:return b?z(1,U):z(0,U+1);case V:var rt=this.$locale().weekStart||0,it=(E<rt?E+7:E)-rt;return z(b?J-it:J+(6-it),U);case v:case D:return C(Q+"Hours",0);case d:return C(Q+"Minutes",1);case g:return C(Q+"Seconds",2);case l:return C(Q+"Milliseconds",3);default:return this.clone()}},h.endOf=function(u){return this.startOf(u,!1)},h.$set=function(u,y){var c,b=w.p(u),$="set"+(this.$u?"UTC":""),z=(c={},c[v]=$+"Date",c[D]=$+"Date",c[_]=$+"Month",c[O]=$+"FullYear",c[d]=$+"Hours",c[g]=$+"Minutes",c[l]=$+"Seconds",c[o]=$+"Milliseconds",c)[b],C=b===v?this.$D+(y-this.$W):y;if(b===_||b===O){var E=this.clone().set(D,1);E.$d[z](C),E.init(),this.$d=E.set(D,Math.min(this.$D,E.daysInMonth())).$d}else z&&this.$d[z](C);return this.init(),this},h.set=function(u,y){return this.clone().$set(u,y)},h.get=function(u){return this[w.p(u)]()},h.add=function(u,y){var c,b=this;u=Number(u);var $=w.p(y),z=function(U){var J=T(b);return w.w(J.date(J.date()+Math.round(U*u)),b)};if($===_)return this.set(_,this.$M+u);if($===O)return this.set(O,this.$y+u);if($===v)return z(1);if($===V)return z(7);var C=(c={},c[g]=r,c[d]=i,c[l]=e,c)[$]||1,E=this.$d.getTime()+u*C;return w.w(E,this)},h.subtract=function(u,y){return this.add(-1*u,y)},h.format=function(u){var y=this,c=this.$locale();if(!this.isValid())return c.invalidDate||f;var b=u||"YYYY-MM-DDTHH:mm:ssZ",$=w.z(this),z=this.$H,C=this.$m,E=this.$M,U=c.weekdays,J=c.months,Q=function(F,W,bt,ut){return F&&(F[W]||F(y,b))||bt[W].substr(0,ut)},rt=function(F){return w.s(z%12||12,F,"0")},it=c.meridiem||function(F,W,bt){var ut=F<12?"AM":"PM";return bt?ut.toLowerCase():ut},tt={YY:String(this.$y).slice(-2),YYYY:this.$y,M:E+1,MM:w.s(E+1,2,"0"),MMM:Q(c.monthsShort,E,J,3),MMMM:Q(J,E),D:this.$D,DD:w.s(this.$D,2,"0"),d:String(this.$W),dd:Q(c.weekdaysMin,this.$W,U,2),ddd:Q(c.weekdaysShort,this.$W,U,3),dddd:U[this.$W],H:String(z),HH:w.s(z,2,"0"),h:rt(1),hh:rt(2),a:it(z,C,!0),A:it(z,C,!1),m:String(C),mm:w.s(C,2,"0"),s:String(this.$s),ss:w.s(this.$s,2,"0"),SSS:w.s(this.$ms,3,"0"),Z:$};return b.replace(Y,function(F,W){return W||tt[F]||$.replace(":","")})},h.utcOffset=function(){return 15*-Math.round(this.$d.getTimezoneOffset()/15)},h.diff=function(u,y,c){var b,$=w.p(y),z=T(u),C=(z.utcOffset()-this.utcOffset())*r,E=this-z,U=w.m(this,z);return U=(b={},b[O]=U/12,b[_]=U,b[I]=U/3,b[V]=(E-C)/6048e5,b[v]=(E-C)/864e5,b[d]=E/i,b[g]=E/r,b[l]=E/e,b)[$]||E,c?U:w.a(U)},h.daysInMonth=function(){return this.endOf(_).$D},h.$locale=function(){return P[this.$L]},h.locale=function(u,y){if(!u)return this.$L;var c=this.clone(),b=x(u,y,!0);return b&&(c.$L=b),c},h.clone=function(){return w.w(this.$d,this)},h.toDate=function(){return new Date(this.valueOf())},h.toJSON=function(){return this.isValid()?this.toISOString():null},h.toISOString=function(){return this.$d.toISOString()},h.toString=function(){return this.$d.toUTCString()},m}(),Bt=B.prototype;return T.prototype=Bt,[["$ms",o],["$s",l],["$m",g],["$H",d],["$W",v],["$M",_],["$y",O],["$D",D]].forEach(function(m){Bt[m[1]]=function(h){return this.$g(h,m[0],m[1])}}),T.extend=function(m,h){return m.$i||(m(h,B,T),m.$i=!0),T},T.locale=x,T.isDayjs=k,T.unix=function(m){return T(1e3*m)},T.en=P[q],T.Ls=P,T.p={},T})})(Dt);var N=Dt.exports,It={exports:{}};(function(n,t){(function(e,r){n.exports=r()})(lt,function(){var e="minute",r=/[+-]\d\d(?::?\d\d)?/g,i=/([+-]|\d\d)/g;return function(o,l,g){var d=l.prototype;g.utc=function(f){var S={date:f,utc:!0,args:arguments};return new l(S)},d.utc=function(f){var S=g(this.toDate(),{locale:this.$L,utc:!0});return f?S.add(this.utcOffset(),e):S},d.local=function(){return g(this.toDate(),{locale:this.$L,utc:!1})};var v=d.parse;d.parse=function(f){f.utc&&(this.$u=!0),this.$utils().u(f.$offset)||(this.$offset=f.$offset),v.call(this,f)};var V=d.init;d.init=function(){if(this.$u){var f=this.$d;this.$y=f.getUTCFullYear(),this.$M=f.getUTCMonth(),this.$D=f.getUTCDate(),this.$W=f.getUTCDay(),this.$H=f.getUTCHours(),this.$m=f.getUTCMinutes(),this.$s=f.getUTCSeconds(),this.$ms=f.getUTCMilliseconds()}else V.call(this)};var _=d.utcOffset;d.utcOffset=function(f,S){var Y=this.$utils().u;if(Y(f))return this.$u?0:Y(this.$offset)?_.call(this):this.$offset;if(typeof f=="string"&&(f=function(q){q===void 0&&(q="");var P=q.match(r);if(!P)return null;var k=(""+P[0]).match(i)||["-",0,0],x=k[0],T=60*+k[1]+ +k[2];return T===0?0:x==="+"?T:-T}(f))===null)return this;var j=Math.abs(f)<=16?60*f:f,M=this;if(S)return M.$offset=j,M.$u=f===0,M;if(f!==0){var L=this.$u?this.toDate().getTimezoneOffset():-1*this.utcOffset();(M=this.local().add(j+L,e)).$offset=j,M.$x.$localOffset=L}else M=this.utc();return M};var I=d.format;d.format=function(f){var S=f||(this.$u?"YYYY-MM-DDTHH:mm:ss[Z]":"");return I.call(this,S)},d.valueOf=function(){var f=this.$utils().u(this.$offset)?0:this.$offset+(this.$x.$localOffset||new Date().getTimezoneOffset());return this.$d.valueOf()-6e4*f},d.isUTC=function(){return!!this.$u},d.toISOString=function(){return this.toDate().toISOString()},d.toString=function(){return this.toDate().toUTCString()};var O=d.toDate;d.toDate=function(f){return f==="s"&&this.$offset?g(this.format("YYYY-MM-DD HH:mm:ss:SSS")).toDate():O.call(this)};var D=d.diff;d.diff=function(f,S,Y){if(f&&this.$u===f.$u)return D.call(this,f,S,Y);var j=this.local(),M=g(f).local();return D.call(j,M,S,Y)}}})})(It);var zt=It.exports,Ot={exports:{}};(function(n,t){(function(e,r){n.exports=r()})(lt,function(){var e={year:0,month:1,day:2,hour:3,minute:4,second:5},r={};return function(i,o,l){var g,d=function(I,O,D){D===void 0&&(D={});var f=new Date(I);return function(S,Y){Y===void 0&&(Y={});var j=Y.timeZoneName||"short",M=S+"|"+j,L=r[M];return L||(L=new Intl.DateTimeFormat("en-US",{hour12:!1,timeZone:S,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",timeZoneName:j}),r[M]=L),L}(O,D).formatToParts(f)},v=function(I,O){for(var D=d(I,O),f=[],S=0;S<D.length;S+=1){var Y=D[S],j=Y.type,M=Y.value,L=e[j];L>=0&&(f[L]=parseInt(M,10))}var q=f[3],P=q===24?0:q,k=f[0]+"-"+f[1]+"-"+f[2]+" "+P+":"+f[4]+":"+f[5]+":000",x=+I;return(l.utc(k).valueOf()-(x-=x%1e3))/6e4},V=o.prototype;V.tz=function(I,O){I===void 0&&(I=g);var D=this.utcOffset(),f=this.toDate(),S=f.toLocaleString("en-US",{timeZone:I}),Y=Math.round((f-new Date(S))/1e3/60),j=l(S).$set("millisecond",this.$ms).utcOffset(15*-Math.round(f.getTimezoneOffset()/15)-Y,!0);if(O){var M=j.utcOffset();j=j.add(D-M,"minute")}return j.$x.$timezone=I,j},V.offsetName=function(I){var O=this.$x.$timezone||l.tz.guess(),D=d(this.valueOf(),O,{timeZoneName:I}).find(function(f){return f.type.toLowerCase()==="timezonename"});return D&&D.value};var _=V.startOf;V.startOf=function(I,O){if(!this.$x||!this.$x.$timezone)return _.call(this,I,O);var D=l(this.format("YYYY-MM-DD HH:mm:ss:SSS"));return _.call(D,I,O).tz(this.$x.$timezone,!0)},l.tz=function(I,O,D){var f=D&&O,S=D||O||g,Y=v(+l(),S);if(typeof I!="string")return l(I).tz(S);var j=function(P,k,x){var T=P-60*k*1e3,w=v(T,x);if(k===w)return[T,k];var B=v(T-=60*(w-k)*1e3,x);return w===B?[T,w]:[P-60*Math.min(w,B)*1e3,Math.max(w,B)]}(l.utc(I,f).valueOf(),Y,S),M=j[0],L=j[1],q=l(M).utcOffset(L);return q.$x.$timezone=S,q},l.tz.guess=function(){return Intl.DateTimeFormat().resolvedOptions().timeZone},l.tz.setDefault=function(I){g=I}}})})(Ot);var Mt=Ot.exports;N.extend(zt),N.extend(Mt);class Et extends G{constructor({after:t=null,before:e=null}={}){super();p(this,"after");p(this,"before");this.after=t,this.before=e}normalize(){this.constructor.ensureTimezoneIsSet();let t=null,e=null;return Z.default(this.after)||(t=N.tz(this.after,this.constructor.userTimezone).hour(0).minute(0).second(0).tz("UTC").format("YYYY-MM-DD[T]HH:mm:ss[Z]")),Z.default(this.before)||(e=N.tz(this.before,this.constructor.userTimezone).hour(0).minute(0).second(0).add(1,"day").subtract(1,"second").tz("UTC").format("YYYY-MM-DD[T]HH:mm:ss[Z]")),{after:t,before:e}}static denormalize(t){this.ensureTimezoneIsSet();let e=null,r=null;return Z.default(t.after)||(e=N.tz(t.after,"UTC").tz(this.userTimezone).hour(0).minute(0).second(0).format("YYYY-MM-DD")),Z.default(t.before)||(r=N.tz(t.before,"UTC").tz(this.userTimezone).hour(0).minute(0).second(0).add(1,"day").subtract(1,"second").format("YYYY-MM-DD")),new this({after:e,before:r})}static ensureTimezoneIsSet(){var t;this.userTimezone=(t=this.userTimezone)!=null?t:N.tz.guess()||"UTC"}}p(Et,"userTimezone"),N.extend(zt),N.extend(Mt);class jt extends G{constructor({after:t=null,before:e=null}={}){super();p(this,"after");p(this,"before");this.after=t,this.before=e}normalize(){this.constructor.ensureTimezoneIsSet();let t=null,e=null;return Z.default(this.after)||(t=N.tz(this.after,this.constructor.userTimezone).tz("UTC").format("YYYY-MM-DD[T]HH:mm:ss[Z]")),Z.default(this.before)||(e=N.tz(this.before,this.constructor.userTimezone).tz("UTC").format("YYYY-MM-DD[T]HH:mm:ss[Z]")),{after:t,before:e}}static denormalize(t){this.ensureTimezoneIsSet();let e=null,r=null;return Z.default(t.after)||(e=N.tz(t.after,"UTC").tz(this.userTimezone).format("YYYY-MM-DD[T]HH:mm:ss[Z]")),Z.default(t.before)||(r=N.tz(t.before,"UTC").tz(this.userTimezone).format("YYYY-MM-DD[T]HH:mm:ss[Z]")),new this({after:e,before:r})}static ensureTimezoneIsSet(){var t;this.userTimezone=(t=this.userTimezone)!=null?t:N.tz.guess()||"UTC"}}p(jt,"userTimezone");function ce(n){return n==null?!0:typeof n=="string"?n.trim().length===0:typeof n=="function"||Array.isArray(n)?n.length===0:n instanceof Object?Object.keys(n).length===0:!1}function dt(n){if(!(n instanceof Object))return n;if(Array.isArray(n))return n.filter(dt);const t=H({},n);return Object.keys(t).forEach(e=>{t[e]instanceof Object&&(t[e]=dt(t[e])),ce(t[e])&&delete t[e]}),t}class fe{constructor(t={}){p(this,"_filters",[]);if(!(t instanceof Object))throw Error("A FilterCollection expects an object.");Object.keys(t).forEach(e=>{if(!(t[e]instanceof G))throw Error(`Filter ${e} doesn't extend the Filter class.`);this[e]=t[e],this._filters.push(e)})}normalize(){const t={};return this._filters.forEach(e=>{const r=this[e];t[e]=r.normalize()}),dt(t)}async denormalize(t,e){for(const r of this._filters)typeof t[r]!="undefined"&&(this[r]=await Object.getPrototypeOf(this[r]).constructor.denormalize(t[r],e));return this}}async function he(n={},t={preserveQuery:!1}){if(typeof n!="function")throw Error("initialState should be provided as a function.");const e=ft.useRoute(),r=ft.useRouter(),i=s.ref(n());async function o(v){Object.assign(s.unref(i),await s.unref(i).denormalize(v.query,t))}function l(){i.value=K(n())}function g(v={}){const V={};return t.preserveQuery===!0&&Object.assign(V,e.query),Object.assign(V,s.unref(i).normalize(),v)}async function d(v={}){await r.push(Object.assign(H({},e),{query:g(v)}))}return ft.onBeforeRouteUpdate(v=>o(v)),await o(e),{filters:i,buildQueryParams:g,submit:d,clear:l}}const le=async({state:n={},methods:t={},name:e="store"}={})=>{n=s.reactive(n);const r=ct(H({name:e,state:n},Object.keys(t).reduce(function(i,o){const l=t[o];return i[o]=function(){return l(n,...arguments)},i},{})),{async use(i){return await i.install(this),this}});return r.install=i=>i.provide(e,ct(H({},r),{state:s.readonly(n)})),r},mt=(n="store")=>s.inject(n);class Ct{constructor(t){Object.keys(t).forEach(e=>{this[e]=new st(t[e])})}for(t){if(typeof t=="string"&&Object.keys(this).includes(t))return this[t];if(!Object.keys(this).includes(t["@type"]))throw Error(`Endpoint not found for item ${t["@type"]}.`);return this[t["@type"]]}}class st{constructor(t){p(this,"endpoint");this.endpoint=t}toString(){return this.endpoint}toJSON(){return this.endpoint}buildIri(t){let e=new et.URI(this.endpoint);return e=e.withPath(`${e.getPath()}/${t}`),e.toString()}withQuery(t){const e=new et.URI(this.endpoint),r=new et.QueryString(e).withParams(t);return new st(e.withQuery(r.toString()).toString())}paginated(t){if(t=s.unref(t),t===!1)return this.withQuery({pagination:0});const e={pagination:1};return t&&(e.itemsPerPage=t),this.withQuery(e)}synchronize(t=window.location.href){return this.withQuery(new et.QueryString(new et.URI(t)).getParams())}}const de=(n,t)=>mt(t).state.endpoints[n];function at(n){return n=s.unref(n),n==null?!1:Object.keys(n).includes("@id")&&n["@id"]!=null}function A(n){return n=s.unref(n),n===null?null:typeof n=="string"?n:(ot(n),n["@id"])}function Yt(n){const t=A(n);return t.substring(t.lastIndexOf("/")+1)}function me(n){return n.map(A)}function ye(n){return n.map(Yt)}function ot(n,t=null){if(typeof n!="object"||!("@id"in n))throw Error("Invalid item.");if(t!==null){if(typeof t=="string"&&t!==n["@type"])throw Error(`Expected item of type "${t}", got "${n["@type"]}".`);if(Array.isArray(t)&&t.includes(n["@type"])===!1)throw Error(`Expected item of any "${t.join("|")}", got "${n["@type"]}".`)}}function X(n,t){return A(n)===A(t)}function At(n,t){if(n=s.unref(n),n=Array.from(n).map(s.unref),t=s.unref(t),Array.isArray(t)){const e=t;for(const r of e)if(At(n,r))return!0;return!1}for(const e of n)if(X(e,t))return!0;return!1}function ge(n,t){const e=n.findIndex(r=>X(r,t));return e>=0&&n.splice(e,1),n}function yt(n,t){const e=n.find(r=>X(r,t));return typeof e=="undefined"?null:e}function pe(n,t){return n.findIndex(e=>X(e,t))}function $e(n,t){return n.filter(e=>e["@type"]===t)}function be(n){Object.assign(n,n.map(t=>A(t)))}function we(n,t){return n=s.unref(n),ot(n),Object.assign({"@id":n["@id"],"@type":n["@type"]},t)}class gt extends Error{constructor(){super(...arguments);p(this,"statusCode")}get title(){return this["hydra:title"]}get description(){return this["hydra:description"]}}class _t{constructor(){p(this,"id");p(this,"propertyPath");p(this,"message");p(this,"code");this.id=Kt.v4()}}class Ut extends gt{constructor(t){super();p(this,"_violations",[]);Object.assign(this,{*[Symbol.iterator](){yield*this.violations}}),Object.assign(this,t)}get violations(){return this._violations}set violations(t){this._violations=t.map(e=>Object.assign(new _t,e))}getPropertyPaths(){return[...new Set(this.violations.map(({propertyPath:t})=>t))]}getViolations(t){const e=Array.from(arguments);return e.length===0?this.violations:Z.default(e[0])?this.violations.filter(r=>Z.default(r.propertyPath)):this.violations.filter(r=>t===r.propertyPath)}}class Ht{constructor(t={}){Object.assign(this,ct(H({},t),{*[Symbol.iterator](){yield*this["hydra:member"]||[]}}))}get length(){return this.items.length}get totalItems(){return this["hydra:totalItems"]||0}get items(){return this["hydra:member"]||[]}forEach(t){return(this["hydra:member"]||[]).forEach(t)}map(t){return(this["hydra:member"]||[]).map(t)}filter(t){return(this["hydra:member"]||[]).filter(t)}find(t){return(this["hydra:member"]||[]).find(t)}findIndex(t){return(this["hydra:member"]||[]).findIndex(t)}}function ve(n){if(typeof n!="object"||n==null)throw Error("Invalid object.");return Object.keys(n).forEach(t=>delete n[t]),n}function pt(n,t){return n=ve(n),Object.assign(n,t)}function Se(n){const t=mt(),e=s.ref(s.unref(n)),r=s.reactive(K(s.unref(n))),i=s.computed(()=>!at(s.unref(r))),o=s.ref(!1);s.watch(e,v=>pt(r,v));const l=s.computed(()=>JSON.stringify(s.unref(r))!==JSON.stringify(s.unref(e)));return{item:r,isUnsavedDraft:l,isCreationMode:i,isSubmitting:o,reset:()=>pt(r,K(s.unref(n))),submit:async()=>{try{o.value=!0;const v=await t.upsertItem(r);return e.value=v,pt(r,K(v)),v}finally{o.value=!1}}}}function Te(){const n=i=>{i=s.unref(i),i.querySelectorAll("[name]").forEach(function(o){o.setCustomValidity("")})},t=(i,o=!0)=>{i=s.unref(i);const l=i.checkValidity();return!l&&o&&i.reportValidity(),l},e=(i,o)=>{n(i),Array.from(o).forEach(l=>r(i,l)),t(i)},r=(i,{propertyPath:o,message:l})=>{var g;i=s.unref(i),(g=i.querySelector(`[name='${o}']`))==null||g.setCustomValidity(l)};return{resetValidity:n,bindViolations:e,validate:t}}let $t;const De=1,Ie=2;class Rt{constructor(t,e){p(this,"readyState",De);p(this,"url");p(this,"withCredentials");var r;this.url=t,this.withCredentials=(r=e==null?void 0:e.withCredentials)!=null?r:!1,setTimeout(()=>this.onopen(),10)}onerror(){}onmessage(){}onopen(){}close(){this.readyState=Ie}triggerEvent(t){this.onmessage(t)}triggerError(t){this.onerror(t)}}(()=>{var n;return typeof process!="undefined"&&((n=process==null?void 0:process.env)==null?void 0:n.NODE_ENV)==="test"||"test"===void 0})()?$t=Rt:$t=window.EventSource;var ze=$t;const Oe=(n,t)=>{const e=new Pt(n,t);return Object.assign(e,{install(r){r.provide("mercure",e)}})},qt=()=>s.inject("mercure");function Me(n,t){return n.length===t.length&&n.every(e=>t.includes(e))}class Pt{constructor(t,e={}){p(this,"hub");p(this,"options");p(this,"connection");p(this,"subscribedTopics");p(this,"endpoint");p(this,"emitter");p(this,"lastEventId");Object.assign(this,{hub:t,options:s.reactive(e)}),this.lastEventId=s.ref(),this.subscribedTopics=s.ref([]),this.endpoint=s.computed(()=>{const r=new URL(this.hub),i=s.unref(this.subscribedTopics);return i.includes("*")?r.searchParams.append("topic","*"):i.forEach(o=>r.searchParams.append("topic",o)),s.unref(this.lastEventId)&&r.searchParams.append("Last-Event-ID",s.unref(this.lastEventId)),r.toString()}),this.emitter=re.default()}subscribe(t=["*"],e=!0){Array.isArray(t)||(t=[t]);const r=Array.from(s.unref(this.subscribedTopics)),i=[...new Set([...s.unref(this.subscribedTopics),...t])];this.subscribedTopics.value=i,e&&!Me(r,i)&&this.listen()}unsubscribe(t){Array.isArray(t)||(t=[t]),this.subscribedTopics.value=this.subscribedTopics.value.filter(e=>!t.includes(e)),this.connection&&this.listen()}addListener(t){return this.emitter.on("message",t)}removeListener(t){return this.emitter.off("message",t)}listen(){if(s.unref(this.subscribedTopics).length===0){this.stop();return}this.connection||this.connect()}connect(){this.stop(),this.connection=new ze(s.unref(this.endpoint),this.options),this.connection.onopen=()=>this.emitter.emit("open",{endpoint:s.unref(this.endpoint)}),this.connection.onmessage=t=>(this.lastEventId.value=t.lastEventId,this.emitter.emit("message",t)),this.connection.onerror=t=>{this.emitter.emit("error",t),typeof this.options.reconnectInterval=="number"&&(this.stop(),setTimeout(()=>this.connect(),this.options.reconnectInterval))}}stop(){var t;(t=this.connection)==null||t.close(),this.connection=void 0}}const Nt=(n,t)=>Object.assign(t,n),Vt=()=>{};function Lt(n,t,e=["*"],r=Nt,i=Vt){Array.isArray(t)||(t=[t]),Array.isArray(e)||(e=[e]);const o=l=>{try{const g=JSON.parse(l.data);if(!at(g))return;if(Object.keys(g).length===1){i(A(g));return}for(const d of t)X(A(g),d)&&r(g,s.unref(d))}catch(g){console.debug(g)}};return n.addListener(o),n.subscribe(e),o}const kt=(n,t,e)=>{Array.isArray(t)||(t=[t]);const r=i=>{try{const o=JSON.parse(i.data);for(const l of t)if(typeof ie.default(l).fromUri(A(o))!="undefined"){e(o);break}}catch{}};return n.addListener(r),n.subscribe(t),r},Ee=n=>{n=n!=null?n:qt();const t=[];return s.onUnmounted(()=>{for(const r of t)n.removeListener(r)}),{synchronize:(r,i=["*"],o=Nt,l=Vt)=>{t.push(Lt(n,r,i,o,l))},on(r,i){const o=kt(n,r,i);return t.push(o),o}}},je={"hydra:Collection":Ht,"hydra:Error":gt,ConstraintViolationList:Ut},Ft=async(n,t)=>{const e=s.ref(!1),r=ee.asyncComputed(n,t,{evaluating:e});return new Promise(i=>{s.watch(e,o=>{o===!1&&i(r)})})};class xt{constructor(){Object.assign(this,{*[Symbol.iterator](){yield*Object.values(this)}})}get length(){return Array.from(this).length}forEach(t){return Array.from(this).forEach(t)}map(t){return Array.from(this).map(t)}filter(t){return Array.from(this).filter(t)}find(t){return Array.from(this).find(t)}findIndex(t){return Array.from(this).findIndex(t)}}const Ce=function(n){throw n};class Ye{constructor(t,e={}){p(this,"api");p(this,"endpoints");p(this,"classmap");var o;this.api=t;const{endpoints:r,classmap:i}=e;this.endpoints=new Ct(r!=null?r:{}),this.classmap=H(H({},je),i),this.errorHandler=(o=e.errorHandler)!=null?o:Ce}factory(t,e){var r;for(const i in this.classmap)if(i===((r=t["@type"])!=null?r:t)){const o=this.classmap[i];return t instanceof o?t:(t=Object.assign(new o,t),e&&Object.assign(t,{statusCode:e}),s.reactive(t))}return t}storeItem({state:t},e){const r=A(e);return Object.keys(t.items).includes(r)?Object.assign(t.items[r],e):t.items[r]=s.ref(e),t.items[r]}removeItem({state:t},e){const r=A(e);delete t.items[r]}async clearItems({state:t}){t.items=s.reactive(new xt)}async handle(t,{errorHandler:e=this.errorHandler}={}){var r,i,o,l,g;try{const{data:d}=await t();return this.factory(d)}catch(d){typeof((r=d.response)==null?void 0:r.data)=="object"&&((i=d.response)==null?void 0:i.data)!=null&&(d=this.factory(d.response.data,(o=d.response)==null?void 0:o.status)),d.statusCode=(g=d.statusCode)!=null?g:(l=d.response)==null?void 0:l.status,e(d)}}async fetchItem({state:t},e,r){const i=A(e),o=await this.handle(()=>this.api.get(i,r),r);return this.storeItem({state:t},this.factory(o))}async getItem({state:t},e,r){if(e===null)return null;const i=A(e),o=yt(t.items,i);if(o!=null)return o;if(typeof e=="object"){const l=this.factory(e);return this.storeItem({state:t},l)}return await this.fetchItem({state:t},i,r)}async fetchCollection({state:t},e,r){const i=await this.handle(()=>this.api.get(e,r),r);i["hydra:member"]=i["hydra:member"].map(l=>this.factory(l));const o=this.factory(i);return o["hydra:member"]=o["hydra:member"].map(l=>this.factory(l)),o}async createItem({state:t},e,r){const i=this.endpoints.for(e);return e=await this.handle(()=>this.api.post(i,e,r),r),this.storeItem({state:t},e)}async updateItem({state:t},e,r){return ot(e),e=await this.handle(()=>this.api.put(A(e),e,r),r),this.storeItem({state:t},e)}async upsertItem({state:t},e,r){return at(e)?this.updateItem({state:t},e,r):this.createItem({state:t},e,r)}async deleteItem({state:t},e,r){const i=A(e);await this.handle(()=>this.api.delete(i,r),r),e=yt(t.items,i),e!==null&&this.removeItem({state:t},e)}async getRelation({state:t},e,r){return e===null?null:typeof e=="object"?e:typeof e=="function"?Ft(()=>this.getRelation({state:t},e(),r)):await this.getItem({state:t},e,r)}async getRelations({state:t},e,r){return typeof e=="function"?Ft(()=>this.getRelations({state:t},e(),r),[]):Promise.all(e.map(i=>this.getRelation({state:t},i,r)))}async install(t){t.state.items=s.reactive(new xt),t.state.endpoints=s.readonly(this.endpoints),t.state.classmap=s.readonly(this.classmap),t.storeItem=e=>this.storeItem(t,e),t.removeItem=e=>this.removeItem(t,e),t.clearItems=()=>this.clearItems(t),t.getItem=(e,r)=>this.getItem(t,e,r),t.fetchItem=(e,r)=>this.fetchItem(t,e,r),t.fetchCollection=(e,r)=>this.fetchCollection(t,e,r),t.createItem=(e,r)=>this.createItem(t,e,r),t.updateItem=(e,r)=>this.updateItem(t,e,r),t.upsertItem=(e,r)=>this.upsertItem(t,e,r),t.deleteItem=(e,r)=>this.deleteItem(t,e,r),t.getRelation=(e,r)=>this.getRelation(t,e,r),t.getRelations=(e,r)=>this.getRelations(t,e,r),t.endpoint=e=>t.state.endpoints[e],t.getItemsByType=e=>t.state.items.filter(r=>e===r["@type"])}}function Zt(n){if(typeof n=="string")return n;try{return A(n)}catch{return null}}function Ae(n){return n.map(t=>Zt(t))}async function Qt(n,t){try{return await t.getItem(n)}catch{return null}}async function _e(n,t){return Promise.all(n.map(e=>Qt(e,t)))}class Ue extends G{constructor(t,e=!1){super();p(this,"items",[]);p(this,"multiple");this.items=Array.isArray(t)?t:[t],this.multiple=e}get item(){var t;return(t=this.items[0])!=null?t:null}set item(t){this.items=[t],this.multiple=!1}normalize(){return this.multiple||this.items.length>1?Ae(this.items):Zt(this.item)}static async denormalize(t,{store:e,multiple:r}){return Array.isArray(t)?new this(await _e(t,e),r!=null?r:!0):new this([await Qt(t,e)],r!=null?r:!1)}}const He={asc:"desc",desc:"asc"};class Re extends G{constructor(t={}){super();p(this,"order");this.order=t}revert(){var e;const t={};for(const r in this.order){const i=this.order[r];t[r]=(e=He[i])!=null?e:i}return this.order=t,this}normalize(){return this.order}static denormalize(t){return typeof t=="object"&&t!=null?new this(t):new this}}class qe extends G{constructor(t=null){super();p(this,"value");this.value=t}normalize(){var t;return[void 0,null,""].includes((t=this.value)==null?void 0:t.trim())?null:this.value.trim()}static denormalize(t){return typeof t=="string"&&(t=t.trim()),[void 0,null,""].includes(t)?new this(null):new this(t)}}class Pe extends G{constructor(t=!1){super();p(this,"value");this.value=t}normalize(){return this.value?"true":"false"}static denormalize(t){return t==null?new this(!1):(t=`${t}`.trim(),new this(["true","on","yes","1"].includes(t.toLowerCase())))}}class Ne{constructor(){p(this,"fields");p(this,"preload")}get headers(){var e,r,i,o,l;const t={};return((r=(e=this.preload)==null?void 0:e.length)!=null?r:0)!==0&&(t.preload=[...new Set(this.preload)].map(g=>`"${g}"`).join(", ")),((o=(i=this.fields)==null?void 0:i.length)!=null?o:0)!==0&&(t.fields=[...new Set([...this.fields,...(l=this.preload)!=null?l:[]])].map(g=>`"${g}"`).join(", ")),t}}function Ve({fields:n,preload:t}={}){return Object.assign(new Ne,{fields:n},{preload:t}).headers}a.ApiClient=ae,a.ConstraintViolationList=Ut,a.DateRangeFilter=Et,a.DatetimeRangeFilter=jt,a.FakeEventSource=Rt,a.FilterCollection=fe,a.HttpError=St,a.HydraCollection=Ht,a.HydraEndpoint=st,a.HydraEndpoints=Ct,a.HydraError=gt,a.HydraPlugin=Ye,a.ItemFilter=Ue,a.Mercure=Pt,a.OrderFilter=Re,a.TextFilter=qe,a.TruthyFilter=Pe,a.Violation=_t,a.areSameIris=X,a.checkValidItem=ot,a.clone=K,a.containsIri=At,a.createMercure=Oe,a.createStore=le,a.getId=Yt,a.getIds=ye,a.getIri=A,a.getIris=me,a.getItemByIri=yt,a.getItemIndexByIri=pe,a.getItemsByType=$e,a.hasIri=at,a.mercureSync=Lt,a.normalizeIris=be,a.on=kt,a.partialItem=we,a.useEndpoint=de,a.useFilters=he,a.useFormValidation=Te,a.useItemForm=Se,a.useMercure=qt,a.useMercureSync=Ee,a.useStore=mt,a.vulcain=Ve,a.withoutDuplicates=ue,a.withoutIri=ge,Object.defineProperty(a,"__esModule",{value:!0}),a[Symbol.toStringTag]="Module"});
