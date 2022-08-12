(function(o,a){typeof exports=="object"&&typeof module!="undefined"?a(exports,require("vue"),require("clone-deep"),require("md5"),require("is-empty"),require("vue-router"),require("psr7-js"),require("uuid"),require("mitt"),require("uri-templates"),require("@vueuse/core")):typeof define=="function"&&define.amd?define(["exports","vue","clone-deep","md5","is-empty","vue-router","psr7-js","uuid","mitt","uri-templates","@vueuse/core"],a):(o=typeof globalThis!="undefined"?globalThis:o||self,a(o.Speculoos={},o.Vue,o.clone$1,o.md5,o.empty,o.vueRouter,o.psr7Js,o.uuid,o.mitt,o.uriTemplate,o.core))})(this,function(o,a,W,Zt,Qt,ut,tt,Bt,Jt,Wt,Gt){"use strict";var Pe=Object.defineProperty;var Fe=(o,a,W)=>a in o?Pe(o,a,{enumerable:!0,configurable:!0,writable:!0,value:W}):o[a]=W;var y=(o,a,W)=>(Fe(o,typeof a!="symbol"?a+"":a,W),W);function et(r){return r&&typeof r=="object"&&"default"in r?r:{default:r}}var $t=et(W),Kt=et(Zt),k=et(Qt),Xt=et(Jt),te=et(Wt);class vt extends Error{constructor(e){super(e.statusText),this.response=e,this.statusCode=parseInt(this.response.status)}isStatusCode(e){const t=n=>parseInt(n)===this.statusCode;for(let n of arguments)if(t(n))return!0;return!1}isClientError(){return this.statusCode>=400&&this.statusCode<500}isServerError(){return this.statusCode>500}static guard(e){if(e.status>=400)throw new this(e);return e}}const ct=r=>{if(!(r instanceof Headers))return r;const e={};for(let t of r.keys())e[t]=r.get(t);return e},ee={Accept:"application/ld+json, application/json"},bt=async r=>{try{const e=await r.text();try{r.data=JSON.parse(e),r.json=()=>new Promise(t=>t(r.data))}catch{r.data=e,r.json=()=>new Promise(n=>n(r.data))}}catch{}return r};class re{constructor({baseUri:e="",options:t={},fetcher:n=window.fetch.bind(window)}={}){y(this,"baseUri");y(this,"options");y(this,"fetch");this.baseUri=e,this.options=t,this.fetch=async(i,s)=>n(i,s).then(bt)}resolve(e){return new URL(e,this.baseUri).toString()}mergeOptions(e){let t={...this.options};Object.keys(t).includes("headers")&&(t.headers=ct(t.headers));for(let n of arguments){let i={...n};Object.keys(i).includes("headers")&&(i.headers={...ct(i.headers)}),t={...$t.default(t),...$t.default(i)}}return t}async request(e,t,n){t=`${a.unref(t)}`,n=this.mergeOptions({method:e},n),Object.keys(n).includes("headers")&&(n.headers=new Headers({...ee,...ct(n.headers)}));try{a.isRef(n==null?void 0:n.isLoading)&&(n.isLoading.value=!0);const i=await this.fetch(t,n);return vt.guard(i)}finally{a.isRef(n==null?void 0:n.isLoading)&&(n.isLoading.value=!1)}}async get(e,t={}){return await this.request("GET",this.resolve(e),this.mergeOptions(t))}async post(e,t,n={}){return await this.request("POST",this.resolve(e),this.mergeOptions({body:JSON.stringify(a.unref(t)),headers:{"Content-Type":"application/json"}},n))}async put(e,t,n={}){return await this.request("PUT",this.resolve(e),this.mergeOptions({body:JSON.stringify(a.unref(t)),headers:{"Content-Type":"application/json"}},n))}async delete(e,t={}){return await this.request("DELETE",this.resolve(e),this.mergeOptions(t))}}class ne{constructor(e=window.fetch.bind(window)){y(this,"fetch");y(this,"pendingRequests",[]);return this.fetch=e,(t,n)=>{try{const i=Kt.default(JSON.stringify({url:t,...n})),s=this.pendingRequests.findIndex(m=>i===m.hash);if(s>=0)return this.pendingRequests[s].promise;const l=this.fetch(t,n).then(bt);return this.pendingRequests.push({hash:i,promise:l}),l.then(m=>(this.removePendingRequest(i),m),m=>{throw this.removePendingRequest(i),m})}catch{return this.fetch(t,n)}}}removePendingRequest(e){const t=this.pendingRequests.findIndex(n=>e===n.hash);t>=0&&this.pendingRequests.splice(t,1)}}function ie(r=void 0){return new ne(r)}const G=(r,e=!0,t=[])=>{if(typeof r!="object"||r==null)return r;const n=t.find(s=>s.orig===r);if(n!=null)return n.cloned;let i=Object.assign(Object.create(Object.getPrototypeOf(r)),r);if(Array.isArray(r)&&(i=Object.values(i)),t.push({orig:r,cloned:i}),e)for(const s in i)typeof i[s]=="object"&&i[s]!=null&&(i[s]=G(i[s],e,t));return"__clone"in i&&typeof i.__clone=="function"&&i.__clone(),i};class x{normalize(){throw Error("This method is meant to be overriden.")}async denormalize(e){throw Error("This method is meant to be overriden.")}}class se extends x{constructor(t=[]){super();y(this,"values");this.values=t}normalize(){return this.values}async denormalize(t){if(typeof t=="string"&&(t=t.trim()),[void 0,null,""].includes(t)){this.values=[];return}Array.isArray(t)||(t=[t]),this.values=t}}var ft=typeof globalThis!="undefined"?globalThis:typeof window!="undefined"?window:typeof global!="undefined"?global:typeof self!="undefined"?self:{},wt={exports:{}};(function(r,e){(function(t,n){r.exports=n()})(ft,function(){var t=1e3,n=6e4,i=36e5,s="millisecond",l="second",m="minute",d="hour",w="day",R="week",Y="month",I="quarter",M="year",D="date",f="Invalid Date",T=/^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/,_=/\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,O={name:"en",weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_")},E=function(v,h,u){var g=String(v);return!g||g.length>=h?v:""+Array(h+1-g.length).join(u)+v},N={s:E,z:function(v){var h=-v.utcOffset(),u=Math.abs(h),g=Math.floor(u/60),c=u%60;return(h<=0?"+":"-")+E(g,2,"0")+":"+E(c,2,"0")},m:function v(h,u){if(h.date()<u.date())return-v(u,h);var g=12*(u.year()-h.year())+(u.month()-h.month()),c=h.clone().add(g,Y),$=u-c<0,p=h.clone().add(g+($?-1:1),Y);return+(-(g+(u-c)/($?c-p:p-c))||0)},a:function(v){return v<0?Math.ceil(v)||0:Math.floor(v)},p:function(v){return{M:Y,y:M,w:R,d:w,D,h:d,m,s:l,ms:s,Q:I}[v]||String(v||"").toLowerCase().replace(/s$/,"")},u:function(v){return v===void 0}},j="en",P={};P[j]=O;var F=function(v){return v instanceof Q},V=function v(h,u,g){var c;if(!h)return j;if(typeof h=="string"){var $=h.toLowerCase();P[$]&&(c=$),u&&(P[$]=u,c=$);var p=h.split("-");if(!c&&p.length>1)return v(p[0])}else{var S=h.name;P[S]=h,c=S}return!g&&c&&(j=c),c||!g&&j},z=function(v,h){if(F(v))return v.clone();var u=typeof h=="object"?h:{};return u.date=v,u.args=arguments,new Q(u)},b=N;b.l=V,b.i=F,b.w=function(v,h){return z(v,{locale:h.$L,utc:h.$u,x:h.$x,$offset:h.$offset})};var Q=function(){function v(u){this.$L=V(u.locale,null,!0),this.parse(u)}var h=v.prototype;return h.parse=function(u){this.$d=function(g){var c=g.date,$=g.utc;if(c===null)return new Date(NaN);if(b.u(c))return new Date;if(c instanceof Date)return new Date(c);if(typeof c=="string"&&!/Z$/i.test(c)){var p=c.match(T);if(p){var S=p[2]-1||0,A=(p[7]||"0").substring(0,3);return $?new Date(Date.UTC(p[1],S,p[3]||1,p[4]||0,p[5]||0,p[6]||0,A)):new Date(p[1],S,p[3]||1,p[4]||0,p[5]||0,p[6]||0,A)}}return new Date(c)}(u),this.$x=u.x||{},this.init()},h.init=function(){var u=this.$d;this.$y=u.getFullYear(),this.$M=u.getMonth(),this.$D=u.getDate(),this.$W=u.getDay(),this.$H=u.getHours(),this.$m=u.getMinutes(),this.$s=u.getSeconds(),this.$ms=u.getMilliseconds()},h.$utils=function(){return b},h.isValid=function(){return this.$d.toString()!==f},h.isSame=function(u,g){var c=z(u);return this.startOf(g)<=c&&c<=this.endOf(g)},h.isAfter=function(u,g){return z(u)<this.startOf(g)},h.isBefore=function(u,g){return this.endOf(g)<z(u)},h.$g=function(u,g,c){return b.u(u)?this[g]:this.set(c,u)},h.unix=function(){return Math.floor(this.valueOf()/1e3)},h.valueOf=function(){return this.$d.getTime()},h.startOf=function(u,g){var c=this,$=!!b.u(g)||g,p=b.p(u),S=function(X,L){var J=b.w(c.$u?Date.UTC(c.$y,L,X):new Date(c.$y,L,X),c);return $?J:J.endOf(w)},A=function(X,L){return b.w(c.toDate()[X].apply(c.toDate("s"),($?[0,0,0,0]:[23,59,59,999]).slice(L)),c)},C=this.$W,q=this.$M,B=this.$D,Z="set"+(this.$u?"UTC":"");switch(p){case M:return $?S(1,0):S(31,11);case Y:return $?S(1,q):S(0,q+1);case R:var rt=this.$locale().weekStart||0,nt=(C<rt?C+7:C)-rt;return S($?B-nt:B+(6-nt),q);case w:case D:return A(Z+"Hours",0);case d:return A(Z+"Minutes",1);case m:return A(Z+"Seconds",2);case l:return A(Z+"Milliseconds",3);default:return this.clone()}},h.endOf=function(u){return this.startOf(u,!1)},h.$set=function(u,g){var c,$=b.p(u),p="set"+(this.$u?"UTC":""),S=(c={},c[w]=p+"Date",c[D]=p+"Date",c[Y]=p+"Month",c[M]=p+"FullYear",c[d]=p+"Hours",c[m]=p+"Minutes",c[l]=p+"Seconds",c[s]=p+"Milliseconds",c)[$],A=$===w?this.$D+(g-this.$W):g;if($===Y||$===M){var C=this.clone().set(D,1);C.$d[S](A),C.init(),this.$d=C.set(D,Math.min(this.$D,C.daysInMonth())).$d}else S&&this.$d[S](A);return this.init(),this},h.set=function(u,g){return this.clone().$set(u,g)},h.get=function(u){return this[b.p(u)]()},h.add=function(u,g){var c,$=this;u=Number(u);var p=b.p(g),S=function(q){var B=z($);return b.w(B.date(B.date()+Math.round(q*u)),$)};if(p===Y)return this.set(Y,this.$M+u);if(p===M)return this.set(M,this.$y+u);if(p===w)return S(1);if(p===R)return S(7);var A=(c={},c[m]=n,c[d]=i,c[l]=t,c)[p]||1,C=this.$d.getTime()+u*A;return b.w(C,this)},h.subtract=function(u,g){return this.add(-1*u,g)},h.format=function(u){var g=this,c=this.$locale();if(!this.isValid())return c.invalidDate||f;var $=u||"YYYY-MM-DDTHH:mm:ssZ",p=b.z(this),S=this.$H,A=this.$m,C=this.$M,q=c.weekdays,B=c.months,Z=function(L,J,pt,ot){return L&&(L[J]||L(g,$))||pt[J].slice(0,ot)},rt=function(L){return b.s(S%12||12,L,"0")},nt=c.meridiem||function(L,J,pt){var ot=L<12?"AM":"PM";return pt?ot.toLowerCase():ot},X={YY:String(this.$y).slice(-2),YYYY:this.$y,M:C+1,MM:b.s(C+1,2,"0"),MMM:Z(c.monthsShort,C,B,3),MMMM:Z(B,C),D:this.$D,DD:b.s(this.$D,2,"0"),d:String(this.$W),dd:Z(c.weekdaysMin,this.$W,q,2),ddd:Z(c.weekdaysShort,this.$W,q,3),dddd:q[this.$W],H:String(S),HH:b.s(S,2,"0"),h:rt(1),hh:rt(2),a:nt(S,A,!0),A:nt(S,A,!1),m:String(A),mm:b.s(A,2,"0"),s:String(this.$s),ss:b.s(this.$s,2,"0"),SSS:b.s(this.$ms,3,"0"),Z:p};return $.replace(_,function(L,J){return J||X[L]||p.replace(":","")})},h.utcOffset=function(){return 15*-Math.round(this.$d.getTimezoneOffset()/15)},h.diff=function(u,g,c){var $,p=b.p(g),S=z(u),A=(S.utcOffset()-this.utcOffset())*n,C=this-S,q=b.m(this,S);return q=($={},$[M]=q/12,$[Y]=q,$[I]=q/3,$[R]=(C-A)/6048e5,$[w]=(C-A)/864e5,$[d]=C/i,$[m]=C/n,$[l]=C/t,$)[p]||C,c?q:b.a(q)},h.daysInMonth=function(){return this.endOf(Y).$D},h.$locale=function(){return P[this.$L]},h.locale=function(u,g){if(!u)return this.$L;var c=this.clone(),$=V(u,g,!0);return $&&(c.$L=$),c},h.clone=function(){return b.w(this.$d,this)},h.toDate=function(){return new Date(this.valueOf())},h.toJSON=function(){return this.isValid()?this.toISOString():null},h.toISOString=function(){return this.$d.toISOString()},h.toString=function(){return this.$d.toUTCString()},v}(),xt=Q.prototype;return z.prototype=xt,[["$ms",s],["$s",l],["$m",m],["$H",d],["$W",w],["$M",Y],["$y",M],["$D",D]].forEach(function(v){xt[v[1]]=function(h){return this.$g(h,v[0],v[1])}}),z.extend=function(v,h){return v.$i||(v(h,Q,z),v.$i=!0),z},z.locale=V,z.isDayjs=F,z.unix=function(v){return z(1e3*v)},z.en=P[j],z.Ls=P,z.p={},z})})(wt);var U=wt.exports,St={exports:{}};(function(r,e){(function(t,n){r.exports=n()})(ft,function(){var t="minute",n=/[+-]\d\d(?::?\d\d)?/g,i=/([+-]|\d\d)/g;return function(s,l,m){var d=l.prototype;m.utc=function(f){var T={date:f,utc:!0,args:arguments};return new l(T)},d.utc=function(f){var T=m(this.toDate(),{locale:this.$L,utc:!0});return f?T.add(this.utcOffset(),t):T},d.local=function(){return m(this.toDate(),{locale:this.$L,utc:!1})};var w=d.parse;d.parse=function(f){f.utc&&(this.$u=!0),this.$utils().u(f.$offset)||(this.$offset=f.$offset),w.call(this,f)};var R=d.init;d.init=function(){if(this.$u){var f=this.$d;this.$y=f.getUTCFullYear(),this.$M=f.getUTCMonth(),this.$D=f.getUTCDate(),this.$W=f.getUTCDay(),this.$H=f.getUTCHours(),this.$m=f.getUTCMinutes(),this.$s=f.getUTCSeconds(),this.$ms=f.getUTCMilliseconds()}else R.call(this)};var Y=d.utcOffset;d.utcOffset=function(f,T){var _=this.$utils().u;if(_(f))return this.$u?0:_(this.$offset)?Y.call(this):this.$offset;if(typeof f=="string"&&(f=function(j){j===void 0&&(j="");var P=j.match(n);if(!P)return null;var F=(""+P[0]).match(i)||["-",0,0],V=F[0],z=60*+F[1]+ +F[2];return z===0?0:V==="+"?z:-z}(f),f===null))return this;var O=Math.abs(f)<=16?60*f:f,E=this;if(T)return E.$offset=O,E.$u=f===0,E;if(f!==0){var N=this.$u?this.toDate().getTimezoneOffset():-1*this.utcOffset();(E=this.local().add(O+N,t)).$offset=O,E.$x.$localOffset=N}else E=this.utc();return E};var I=d.format;d.format=function(f){var T=f||(this.$u?"YYYY-MM-DDTHH:mm:ss[Z]":"");return I.call(this,T)},d.valueOf=function(){var f=this.$utils().u(this.$offset)?0:this.$offset+(this.$x.$localOffset||this.$d.getTimezoneOffset());return this.$d.valueOf()-6e4*f},d.isUTC=function(){return!!this.$u},d.toISOString=function(){return this.toDate().toISOString()},d.toString=function(){return this.toDate().toUTCString()};var M=d.toDate;d.toDate=function(f){return f==="s"&&this.$offset?m(this.format("YYYY-MM-DD HH:mm:ss:SSS")).toDate():M.call(this)};var D=d.diff;d.diff=function(f,T,_){if(f&&this.$u===f.$u)return D.call(this,f,T,_);var O=this.local(),E=m(f).local();return D.call(O,E,T,_)}}})})(St);var Tt=St.exports,zt={exports:{}};(function(r,e){(function(t,n){r.exports=n()})(ft,function(){var t={year:0,month:1,day:2,hour:3,minute:4,second:5},n={};return function(i,s,l){var m,d=function(I,M,D){D===void 0&&(D={});var f=new Date(I),T=function(_,O){O===void 0&&(O={});var E=O.timeZoneName||"short",N=_+"|"+E,j=n[N];return j||(j=new Intl.DateTimeFormat("en-US",{hour12:!1,timeZone:_,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",timeZoneName:E}),n[N]=j),j}(M,D);return T.formatToParts(f)},w=function(I,M){for(var D=d(I,M),f=[],T=0;T<D.length;T+=1){var _=D[T],O=_.type,E=_.value,N=t[O];N>=0&&(f[N]=parseInt(E,10))}var j=f[3],P=j===24?0:j,F=f[0]+"-"+f[1]+"-"+f[2]+" "+P+":"+f[4]+":"+f[5]+":000",V=+I;return(l.utc(F).valueOf()-(V-=V%1e3))/6e4},R=s.prototype;R.tz=function(I,M){I===void 0&&(I=m);var D=this.utcOffset(),f=this.toDate(),T=f.toLocaleString("en-US",{timeZone:I}),_=Math.round((f-new Date(T))/1e3/60),O=l(T).$set("millisecond",this.$ms).utcOffset(15*-Math.round(f.getTimezoneOffset()/15)-_,!0);if(M){var E=O.utcOffset();O=O.add(D-E,"minute")}return O.$x.$timezone=I,O},R.offsetName=function(I){var M=this.$x.$timezone||l.tz.guess(),D=d(this.valueOf(),M,{timeZoneName:I}).find(function(f){return f.type.toLowerCase()==="timezonename"});return D&&D.value};var Y=R.startOf;R.startOf=function(I,M){if(!this.$x||!this.$x.$timezone)return Y.call(this,I,M);var D=l(this.format("YYYY-MM-DD HH:mm:ss:SSS"));return Y.call(D,I,M).tz(this.$x.$timezone,!0)},l.tz=function(I,M,D){var f=D&&M,T=D||M||m,_=w(+l(),T);if(typeof I!="string")return l(I).tz(T);var O=function(P,F,V){var z=P-60*F*1e3,b=w(z,V);if(F===b)return[z,F];var Q=w(z-=60*(b-F)*1e3,V);return b===Q?[z,b]:[P-60*Math.min(b,Q)*1e3,Math.max(b,Q)]}(l.utc(I,f).valueOf(),_,T),E=O[0],N=O[1],j=l(E).utcOffset(N);return j.$x.$timezone=T,j},l.tz.guess=function(){return Intl.DateTimeFormat().resolvedOptions().timeZone},l.tz.setDefault=function(I){m=I}}})})(zt);var Dt=zt.exports;U.extend(Tt),U.extend(Dt);class It extends x{constructor({after:t=null,before:n=null}={},{withTime:i=!0,useUserTimezone:s=!0}={}){super();y(this,"after");y(this,"before");y(this,"normalizedFormat");y(this,"useUserTimezone");this.after=t,this.before=n,this.normalizedFormat=i?"YYYY-MM-DD[T]HH:mm:ss[Z]":"YYYY-MM-DD",this.useUserTimezone=s}normalize(){this.constructor.ensureTimezoneIsSet();const t=this.useUserTimezone?this.constructor.userTimezone:"UTC";let n=null,i=null;return k.default(this.after)||(n=U.tz(this.after,t).hour(0).minute(0).second(0).tz("UTC").format(this.normalizedFormat)),k.default(this.before)||(i=U.tz(this.before,t).hour(0).minute(0).second(0).add(1,"day").subtract(1,"second").tz("UTC").format(this.normalizedFormat)),{after:n,before:i}}async denormalize(t){this.constructor.ensureTimezoneIsSet(),this.after=null,this.before=null,k.default(t.after)||(this.after=this.useUserTimezone?U.tz(t.after,"UTC").tz(this.constructor.userTimezone):U.tz(t.after,"UTC"),this.after=this.after.hour(0).minute(0).second(0).format("YYYY-MM-DD")),k.default(t.before)||(this.before=this.useUserTimezone?U.tz(t.before,"UTC").tz(this.constructor.userTimezone):U.tz(t.before,"UTC"),this.before=this.before.hour(0).minute(0).second(0).add(1,"day").subtract(1,"second").format("YYYY-MM-DD"))}static ensureTimezoneIsSet(){var t;this.constructor.userTimezone=(t=this.constructor.userTimezone)!=null?t:U.tz.guess()||"UTC"}}y(It,"userTimezone"),U.extend(Tt),U.extend(Dt);class Mt extends x{constructor({after:t=null,before:n=null}={}){super();y(this,"after");y(this,"before");this.after=t,this.before=n}normalize(){this.constructor.ensureTimezoneIsSet();let t=null,n=null;return k.default(this.after)||(t=U.tz(this.after,this.constructor.userTimezone).tz("UTC").format("YYYY-MM-DD[T]HH:mm:ss[Z]")),k.default(this.before)||(n=U.tz(this.before,this.constructor.userTimezone).tz("UTC").format("YYYY-MM-DD[T]HH:mm:ss[Z]")),{after:t,before:n}}async denormalize(t){this.constructor.ensureTimezoneIsSet(),this.after=null,this.before=null,k.default(t.after)||(this.after=U.tz(t.after,"UTC").tz(this.constructor.userTimezone).format("YYYY-MM-DD[T]HH:mm:ss[Z]")),k.default(t.before)||(this.before=U.tz(t.before,"UTC").tz(this.constructor.userTimezone).format("YYYY-MM-DD[T]HH:mm:ss[Z]"))}static ensureTimezoneIsSet(){var t;this.constructor.userTimezone=(t=this.constructor.userTimezone)!=null?t:U.tz.guess()||"UTC"}}y(Mt,"userTimezone");function ae(r){return r==null?!0:typeof r=="string"?r.trim().length===0:typeof r=="function"||Array.isArray(r)?r.length===0:r instanceof Object?Object.keys(r).length===0:!1}function ht(r){if(!(r instanceof Object))return r;if(Array.isArray(r))return r.map(ht);const e={...r};return Object.keys(e).forEach(t=>{e[t]instanceof Object&&(e[t]=ht(e[t])),ae(e[t])&&delete e[t]}),e}class oe{constructor(e={}){y(this,"_filters",[]);if(!(e instanceof Object))throw Error("A FilterCollection expects an object.");Object.keys(e).forEach(t=>{if(!(e[t]instanceof x))throw Error(`Filter ${t} doesn't extend the Filter class.`);this[t]=e[t],this._filters.push(t)})}normalize(){const e={};return this._filters.forEach(t=>{const n=this[t];e[t]=n.normalize()}),ht(e)}async denormalize(e){const t=[];for(const n of this._filters){const i=this[n];i instanceof x&&typeof e[n]!="undefined"&&t.push(i.denormalize(e[n]))}return t.length>0&&await Promise.all(t),this}}async function ue(r={},e={preserveQuery:!1,targetRoute:void 0}){if(typeof r!="function")throw Error("initialState should be provided as a function.");const t=ut.useRoute(),n=ut.useRouter(),i=a.ref(r());async function s(w){Object.assign(a.unref(i),await a.unref(i).denormalize(w.query))}function l(){i.value=G(r())}function m(w={}){const R={};return e.preserveQuery===!0&&Object.assign(R,t.query),Object.assign(R,a.unref(i).normalize(),w)}async function d(w={}){var Y;const R=(Y=a.unref(e.targetRoute))!=null?Y:t;await n.push(Object.assign({...R},{query:m(w)}))}return ut.onBeforeRouteUpdate(w=>s(w)),await s(t),{filters:i,buildQueryParams:m,submit:d,clear:l}}const ce=async({state:r={},methods:e={},name:t="store"}={})=>{r=a.reactive(r);const n={name:t,state:r,...Object.keys(e).reduce(function(i,s){const l=e[s];return i[s]=function(){return l(r,...arguments)},i},{}),async use(i){return await i.install(this),this}};return n.install=i=>i.provide(t,{...n,state:a.readonly(r)}),n},lt=(r="store")=>a.inject(r);class Ot{constructor(e){Object.keys(e).forEach(t=>{this[t]=new it(e[t])})}for(e){if(typeof e=="string"&&Object.keys(this).includes(e))return this[e];if(!Object.keys(this).includes(e["@type"]))throw Error(`Endpoint not found for item ${e["@type"]}.`);return this[e["@type"]]}}class it{constructor(e){y(this,"endpoint");this.endpoint=e}toString(){return this.endpoint}toJSON(){return this.endpoint}buildIri(e){let t=new tt.URI(this.endpoint);return t=t.withPath(`${t.getPath()}/${e}`),t.toString()}withQuery(e){const t=new tt.URI(this.endpoint),n=new tt.QueryString(t).withParams(e);return new it(t.withQuery(n.toString()).toString())}paginated(e){if(e=a.unref(e),e===!1)return this.withQuery({pagination:0});const t={pagination:1};return e&&(t.itemsPerPage=e),this.withQuery(t)}synchronize(e=window.location.href){return this.withQuery(new tt.QueryString(new tt.URI(e)).getParams())}}const fe=(r,e)=>lt(e).state.endpoints[r];function st(r){return r=a.unref(r),r==null?!1:Object.keys(r).includes("@id")&&r["@id"]!=null}function H(r){return r=a.unref(r),r===null?null:typeof r=="string"?r:(at(r),r["@id"])}function Et(r){const e=H(r);return e.substring(e.lastIndexOf("/")+1)}function he(r){return r.map(H)}function le(r){return r.map(Et)}function at(r,e=null){if(typeof r!="object"||!("@id"in r))throw Error("Invalid item.");if(e!==null){if(typeof e=="string"&&e!==r["@type"])throw Error(`Expected item of type "${e}", got "${r["@type"]}".`);if(Array.isArray(e)&&e.includes(r["@type"])===!1)throw Error(`Expected item of any "${e.join("|")}", got "${r["@type"]}".`)}}function K(r,e){return H(r)===H(e)}function Ct(r,e){if(r=a.unref(r),r=Array.from(r).map(a.unref),e=a.unref(e),Array.isArray(e)){const t=e;for(const n of t)if(Ct(r,n))return!0;return!1}for(const t of r)if(K(t,e))return!0;return!1}function de(r,e){const t=r.findIndex(n=>K(n,e));return t>=0&&r.splice(t,1),r}function dt(r,e){const t=r.find(n=>K(n,e));return typeof t=="undefined"?null:t}function me(r,e){return r.findIndex(t=>K(t,e))}function ye(r,e){return r.filter(t=>t["@type"]===e)}function ge(r){Object.assign(r,r.map(e=>H(e)))}function pe(r,e){return r=a.unref(r),at(r),Object.assign({"@id":r["@id"],"@type":r["@type"]},e)}class mt extends Error{constructor(){super(...arguments);y(this,"statusCode")}get title(){return this["hydra:title"]}get description(){return this["hydra:description"]}}class jt{constructor(){y(this,"id");y(this,"propertyPath");y(this,"message");y(this,"code");this.id=Bt.v4()}}class At extends mt{constructor(t){super();y(this,"_violations",[]);Object.assign(this,{*[Symbol.iterator](){yield*this.violations}}),Object.assign(this,t)}get violations(){return this._violations}set violations(t){this._violations=t.map(n=>Object.assign(new jt,n))}getPropertyPaths(){return[...new Set(this.violations.map(({propertyPath:t})=>t))]}getViolations(t){const n=Array.from(arguments);return n.length===0?this.violations:k.default(n[0])?this.violations.filter(i=>k.default(i.propertyPath)):this.violations.filter(i=>t===i.propertyPath)}}class Yt{constructor(e={}){Object.assign(this,{...e,*[Symbol.iterator](){yield*this["hydra:member"]||[]}})}get length(){return this.items.length}get totalItems(){return this["hydra:totalItems"]||0}get items(){return this["hydra:member"]||[]}forEach(e){return(this["hydra:member"]||[]).forEach(e)}map(e){return(this["hydra:member"]||[]).map(e)}filter(e){return(this["hydra:member"]||[]).filter(e)}find(e){return(this["hydra:member"]||[]).find(e)}findIndex(e){return(this["hydra:member"]||[]).findIndex(e)}}function $e(r){if(typeof r!="object"||r==null)throw Error("Invalid object.");return Object.keys(r).forEach(e=>delete r[e]),r}function yt(r,e){return r=$e(r),Object.assign(r,e)}function ve(r){const e=lt(),t=a.ref(a.unref(r)),n=a.reactive(G(a.unref(r))),i=a.computed(()=>!st(a.unref(n))),s=a.ref(!1);a.watch(t,w=>yt(n,w));const l=a.computed(()=>JSON.stringify(a.unref(n))!==JSON.stringify(a.unref(t)));return{item:n,isUnsavedDraft:l,isCreationMode:i,isSubmitting:s,reset:()=>yt(n,G(a.unref(r))),submit:async()=>{try{s.value=!0;const w=await e.upsertItem(n);return t.value=w,yt(n,G(w)),w}finally{s.value=!1}}}}function be(){const r=i=>{i=a.unref(i),i.querySelectorAll("[name]").forEach(function(s){s.setCustomValidity("")})},e=(i,s=!0)=>{i=a.unref(i);const l=i.checkValidity();return!l&&s&&i.reportValidity(),l},t=(i,s)=>{r(i),Array.from(s).forEach(l=>n(i,l)),e(i)},n=(i,{propertyPath:s,message:l})=>{var m;i=a.unref(i),(m=i.querySelector(`[name='${s}']`))==null||m.setCustomValidity(l)};return{resetValidity:r,bindViolations:t,validate:e}}let gt;const we=1,Se=2;class _t{constructor(e,t){y(this,"readyState",we);y(this,"url");y(this,"withCredentials");var n;this.url=e,this.withCredentials=(n=t==null?void 0:t.withCredentials)!=null?n:!1,setTimeout(()=>this.onopen(),10)}onerror(){}onmessage(){}onopen(){}close(){this.readyState=Se}triggerEvent(e){this.onmessage(e)}triggerError(e){this.onerror(e)}}(()=>{var r;return typeof process!="undefined"&&((r=process==null?void 0:process.env)==null?void 0:r.NODE_ENV)==="test"||"test"===void 0})()?gt=_t:gt=window.EventSource;var Te=gt;const ze=(r,e)=>{const t=new Ht(r,e);return Object.assign(t,{install(n){n.provide("mercure",t)}})},Ut=()=>a.inject("mercure");function De(r,e){return r.length===e.length&&r.every(t=>e.includes(t))}class Ht{constructor(e,t={}){y(this,"hub");y(this,"options");y(this,"connection");y(this,"subscribedTopics");y(this,"endpoint");y(this,"emitter");y(this,"lastEventId");Object.assign(this,{hub:e,options:a.reactive(t)}),this.lastEventId=a.ref(),this.subscribedTopics=a.ref([]),this.endpoint=a.computed(()=>{const n=new URL(this.hub),i=a.unref(this.subscribedTopics);return i.includes("*")?n.searchParams.append("topic","*"):i.forEach(s=>n.searchParams.append("topic",s)),a.unref(this.lastEventId)&&n.searchParams.append("Last-Event-ID",a.unref(this.lastEventId)),n.toString()}),this.emitter=Xt.default()}subscribe(e=["*"],t=!0){Array.isArray(e)||(e=[e]);const n=Array.from(a.unref(this.subscribedTopics)),i=[...new Set([...a.unref(this.subscribedTopics),...e])];this.subscribedTopics.value=i,t&&!De(n,i)&&this.listen()}unsubscribe(e){Array.isArray(e)||(e=[e]),this.subscribedTopics.value=this.subscribedTopics.value.filter(t=>!e.includes(t)),this.connection&&this.listen()}addListener(e){return this.emitter.on("message",e)}removeListener(e){return this.emitter.off("message",e)}listen(){if(a.unref(this.subscribedTopics).length===0){this.stop();return}this.connection||this.connect()}connect(){this.stop(),this.connection=new Te(a.unref(this.endpoint),this.options),this.connection.onopen=()=>this.emitter.emit("open",{endpoint:a.unref(this.endpoint)}),this.connection.onmessage=e=>(this.lastEventId.value=e.lastEventId,this.emitter.emit("message",e)),this.connection.onerror=e=>{this.emitter.emit("error",e),typeof this.options.reconnectInterval=="number"&&(this.stop(),setTimeout(()=>this.connect(),this.options.reconnectInterval))}}stop(){var e;(e=this.connection)==null||e.close(),this.connection=void 0}}const Rt=(r,e)=>Object.assign(e,r),qt=()=>{};function Pt(r,e,t=["*"],n=Rt,i=qt){Array.isArray(e)||(e=[e]),Array.isArray(t)||(t=[t]);const s=l=>{try{const m=JSON.parse(l.data);if(!st(m))return;if(Object.keys(m).length===1){i(H(m));return}for(const d of e)K(H(m),d)&&n(m,a.unref(d))}catch(m){console.debug(m)}};return r.addListener(s),r.subscribe(t),s}const Ft=(r,e,t)=>{Array.isArray(e)||(e=[e]);const n=i=>{try{const s=JSON.parse(i.data);for(const l of e)if(typeof te.default(l).fromUri(H(s))!="undefined"){t(s);break}}catch{}};return r.addListener(n),r.subscribe(e),n},Ie=r=>{r=r!=null?r:Ut();const e=[];return a.onUnmounted(()=>{for(const n of e)r.removeListener(n)}),{synchronize:(n,i=["*"],s=Rt,l=qt)=>{e.push(Pt(r,n,i,s,l))},on(n,i){const s=Ft(r,n,i);return e.push(s),s}}},Me={"hydra:Collection":Yt,"hydra:Error":mt,ConstraintViolationList:At},Lt=async(r,e)=>{const t=a.ref(!1),n=Gt.asyncComputed(r,e,{evaluating:t});return new Promise(i=>{a.watch(t,s=>{s===!1&&i(n)})})};class Nt{constructor(){Object.assign(this,{*[Symbol.iterator](){yield*Object.values(this)}})}get length(){return Array.from(this).length}forEach(e){return Array.from(this).forEach(e)}map(e){return Array.from(this).map(e)}filter(e){return Array.from(this).filter(e)}find(e){return Array.from(this).find(e)}findIndex(e){return Array.from(this).findIndex(e)}}const Oe=function(r){throw r};class Ee{constructor(e,t={}){y(this,"api");y(this,"endpoints");y(this,"classmap");var s;this.api=e;const{endpoints:n,classmap:i}=t;this.endpoints=new Ot(n!=null?n:{}),this.classmap={...Me,...i},this.errorHandler=(s=t.errorHandler)!=null?s:Oe}factory(e,t){var n;for(const i in this.classmap)if(i===((n=e["@type"])!=null?n:e)){const s=this.classmap[i];return e instanceof s?e:(e=Object.assign(new s,e),t&&Object.assign(e,{statusCode:t}),a.reactive(e))}return e}storeItem({state:e},t){const n=H(t);return Object.keys(e.items).includes(n)?Object.assign(e.items[n],t):e.items[n]=a.ref(t),e.items[n]}removeItem({state:e},t){const n=H(t);delete e.items[n]}async clearItems({state:e}){e.items=a.reactive(new Nt)}async handle(e,{errorHandler:t=this.errorHandler}={}){var n,i,s,l,m;try{const{data:d}=await e();return this.factory(d)}catch(d){typeof((n=d.response)==null?void 0:n.data)=="object"&&((i=d.response)==null?void 0:i.data)!=null&&(d=this.factory(d.response.data,(s=d.response)==null?void 0:s.status)),d.statusCode=(m=d.statusCode)!=null?m:(l=d.response)==null?void 0:l.status,t(d)}}async fetchItem({state:e},t,n){const i=H(t),s=await this.handle(()=>this.api.get(i,n),n);return this.storeItem({state:e},this.factory(s))}async getItem({state:e},t,n){if(t===null)return null;const i=H(t),s=dt(e.items,i);if(s!=null)return s;if(typeof t=="object"){const l=this.factory(t);return this.storeItem({state:e},l)}return await this.fetchItem({state:e},i,n)}async fetchCollection({state:e},t,n){const i=await this.handle(()=>this.api.get(t,n),n);i["hydra:member"]=i["hydra:member"].map(l=>this.factory(l));const s=this.factory(i);return s["hydra:member"]=s["hydra:member"].map(l=>this.factory(l)),s}async createItem({state:e},t,n){const i=this.endpoints.for(t);return t=await this.handle(()=>this.api.post(i,t,n),n),this.storeItem({state:e},t)}async updateItem({state:e},t,n){return at(t),t=await this.handle(()=>this.api.put(H(t),t,n),n),this.storeItem({state:e},t)}async upsertItem({state:e},t,n){return st(t)?this.updateItem({state:e},t,n):this.createItem({state:e},t,n)}async deleteItem({state:e},t,n){const i=H(t);await this.handle(()=>this.api.delete(i,n),n),t=dt(e.items,i),t!==null&&this.removeItem({state:e},t)}async getRelation({state:e},t,n){return t===null?null:typeof t=="object"?t:typeof t=="function"?Lt(()=>this.getRelation({state:e},t(),n)):await this.getItem({state:e},t,n)}async getRelations({state:e},t,n){return typeof t=="function"?Lt(()=>this.getRelations({state:e},t(),n),[]):Promise.all(t.map(i=>this.getRelation({state:e},i,n)))}async install(e){e.state.items=a.reactive(new Nt),e.state.endpoints=a.readonly(this.endpoints),e.state.classmap=a.readonly(this.classmap),e.storeItem=t=>this.storeItem(e,t),e.removeItem=t=>this.removeItem(e,t),e.clearItems=()=>this.clearItems(e),e.getItem=(t,n)=>this.getItem(e,t,n),e.fetchItem=(t,n)=>this.fetchItem(e,t,n),e.fetchCollection=(t,n)=>this.fetchCollection(e,t,n),e.createItem=(t,n)=>this.createItem(e,t,n),e.updateItem=(t,n)=>this.updateItem(e,t,n),e.upsertItem=(t,n)=>this.upsertItem(e,t,n),e.deleteItem=(t,n)=>this.deleteItem(e,t,n),e.getRelation=(t,n)=>this.getRelation(e,t,n),e.getRelations=(t,n)=>this.getRelations(e,t,n),e.endpoint=t=>e.state.endpoints[t],e.getItemsByType=t=>e.state.items.filter(n=>t===n["@type"]),e.factory=(t,n)=>(n=n!=null?n:t,typeof t=="string"&&(n["@type"]=t),this.factory(n))}}function Vt(r){if(typeof r=="string")return r;try{return H(r)}catch{return null}}function Ce(r){return r.map(e=>Vt(e))}async function kt(r,e){try{return await e.getItem(r)}catch{return null}}async function je(r,e){return Promise.all(r.map(t=>kt(t,e)))}class Ae extends x{constructor(t,{store:n,multiple:i=!1}){super();y(this,"items",[]);y(this,"multiple");y(this,"store");this.items=Array.isArray(t)?t:[t],this.store=n,this.multiple=i}get item(){var t;return(t=this.items[0])!=null?t:null}set item(t){this.items=[t],this.multiple=!1}normalize(){return this.multiple||this.items.length>1?Ce(this.items):Vt(this.item)}async denormalize(t){if(Array.isArray(t)){this.items=await je(t,this.store);return}this.items=[await kt(t,this.store)]}}const Ye={asc:"desc",desc:"asc"};class _e extends x{constructor(t={}){super();y(this,"order");this.order=t}revert(){var n;const t={};for(const i in this.order){const s=this.order[i];t[i]=(n=Ye[s])!=null?n:s}return this.order=t,this}normalize(){return this.order}async denormalize(t){this.order={},typeof t=="object"&&t!=null&&(this.order=t)}}class Ue extends x{constructor(t=null){super();y(this,"value");this.value=t}normalize(){var t;return[void 0,null,""].includes((t=this.value)==null?void 0:t.trim())?null:this.value.trim()}async denormalize(t){if(typeof t=="string"&&(t=t.trim()),[void 0,null,""].includes(t)){this.value=null;return}this.value=t}}class He extends x{constructor(t=null){super();y(this,"value");this.value=t}normalize(){return this.value==null?null:this.value?"true":"false"}async denormalize(t){if(t==null){this.value=null;return}t=`${t}`.trim(),this.value=["true","on","yes","1"].includes(t.toLowerCase())}}class Re{constructor(){y(this,"fields");y(this,"preload")}get headers(){var t,n,i,s,l;const e={};return((n=(t=this.preload)==null?void 0:t.length)!=null?n:0)!==0&&(e.preload=[...new Set(this.preload)].map(m=>`"${m}"`).join(", ")),((s=(i=this.fields)==null?void 0:i.length)!=null?s:0)!==0&&(e.fields=[...new Set([...this.fields,...(l=this.preload)!=null?l:[]])].map(m=>`"${m}"`).join(", ")),e}}function qe({fields:r,preload:e}={}){return Object.assign(new Re,{fields:r},{preload:e}).headers}o.ApiClient=re,o.ArrayFilter=se,o.ConstraintViolationList=At,o.DateRangeFilter=It,o.DatetimeRangeFilter=Mt,o.FakeEventSource=_t,o.FilterCollection=oe,o.HttpError=vt,o.HydraCollection=Yt,o.HydraEndpoint=it,o.HydraEndpoints=Ot,o.HydraError=mt,o.HydraPlugin=Ee,o.ItemFilter=Ae,o.Mercure=Ht,o.OrderFilter=_e,o.TextFilter=Ue,o.TruthyFilter=He,o.Violation=jt,o.areSameIris=K,o.checkValidItem=at,o.clone=G,o.containsIri=Ct,o.createMercure=ze,o.createStore=ce,o.getId=Et,o.getIds=le,o.getIri=H,o.getIris=he,o.getItemByIri=dt,o.getItemIndexByIri=me,o.getItemsByType=ye,o.hasIri=st,o.mercureSync=Pt,o.normalizeIris=ge,o.on=Ft,o.partialItem=pe,o.useEndpoint=fe,o.useFilters=ue,o.useFormValidation=be,o.useItemForm=ve,o.useMercure=Ut,o.useMercureSync=Ie,o.useStore=lt,o.vulcain=qe,o.withoutDuplicates=ie,o.withoutIri=de,Object.defineProperties(o,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}})});
