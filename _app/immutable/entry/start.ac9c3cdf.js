import{o as Fe,t as le}from"../chunks/index.b2354961.js";import{w as Ee}from"../chunks/index.1f4e8f4e.js";function at(e,a){return e==="/"||a==="ignore"?e:a==="never"?e.endsWith("/")?e.slice(0,-1):e:a==="always"&&!e.endsWith("/")?e+"/":e}function rt(e){return e.split("%25").map(decodeURI).join("%25")}function ot(e){for(const a in e)e[a]=decodeURIComponent(e[a]);return e}const it=["href","pathname","search","searchParams","toString","toJSON"];function st(e,a){const i=new URL(e);for(const s of it){let u=i[s];Object.defineProperty(i,s,{get(){return a(),u},enumerable:!0,configurable:!0})}return lt(i),i}function lt(e){Object.defineProperty(e,"hash",{get(){throw new Error("Cannot access event.url.hash. Consider using `$page.url.hash` inside a component instead")}})}const ct="/__data.json";function ft(e){return e.replace(/\/$/,"")+ct}var Ye;const M=((Ye=globalThis.__sveltekit_1043djk)==null?void 0:Ye.base)??"";var We;const ut=((We=globalThis.__sveltekit_1043djk)==null?void 0:We.assets)??M,dt="1698154959530",Xe="sveltekit:snapshot",Ze="sveltekit:scroll",V="sveltekit:index",ue={tap:1,hover:2,viewport:3,eager:4,off:-1};function Me(e){let a=e.baseURI;if(!a){const i=e.getElementsByTagName("base");a=i.length?i[0].href:e.URL}return a}function ee(){return{x:pageXOffset,y:pageYOffset}}function z(e,a){return e.getAttribute(`data-sveltekit-${a}`)}const Ge={...ue,"":ue.hover};function Qe(e){let a=e.assignedSlot??e.parentNode;return(a==null?void 0:a.nodeType)===11&&(a=a.host),a}function He(e,a){for(;e&&e!==a;){if(e.nodeName.toUpperCase()==="A"&&e.hasAttribute("href"))return e;e=Qe(e)}}function _e(e,a){let i;try{i=new URL(e instanceof SVGAElement?e.href.baseVal:e.href,document.baseURI)}catch{}const s=e instanceof SVGAElement?e.target.baseVal:e.target,u=!i||!!s||fe(i,a)||(e.getAttribute("rel")||"").split(/\s+/).includes("external")||e.hasAttribute("download");return{url:i,external:u,target:s}}function ce(e){let a=null,i=null,s=null,u=null,d=null,v=null,c=e;for(;c&&c!==document.documentElement;)s===null&&(s=z(c,"preload-code")),u===null&&(u=z(c,"preload-data")),a===null&&(a=z(c,"keepfocus")),i===null&&(i=z(c,"noscroll")),d===null&&(d=z(c,"reload")),v===null&&(v=z(c,"replacestate")),c=Qe(c);return{preload_code:Ge[s??"off"],preload_data:Ge[u??"off"],keep_focus:a==="off"?!1:a===""?!0:null,noscroll:i==="off"?!1:i===""?!0:null,reload:d==="off"?!1:d===""?!0:null,replace_state:v==="off"?!1:v===""?!0:null}}function Be(e){const a=Ee(e);let i=!0;function s(){i=!0,a.update(v=>v)}function u(v){i=!1,a.set(v)}function d(v){let c;return a.subscribe(m=>{(c===void 0||i&&m!==c)&&v(c=m)})}return{notify:s,set:u,subscribe:d}}function pt(){const{set:e,subscribe:a}=Ee(!1);let i;async function s(){clearTimeout(i);const u=await fetch(`${ut}/_app/version.json`,{headers:{pragma:"no-cache","cache-control":"no-cache"}});if(u.ok){const v=(await u.json()).version!==dt;return v&&(e(!0),clearTimeout(i)),v}else throw new Error(`Version check failed: ${u.status}`)}return{subscribe:a,check:s}}function fe(e,a){return e.origin!==location.origin||!e.pathname.startsWith(a)}function et(e){try{return JSON.parse(sessionStorage[e])}catch{}}function Je(e,a){const i=JSON.stringify(a);try{sessionStorage[e]=i}catch{}}function ht(...e){let a=5381;for(const i of e)if(typeof i=="string"){let s=i.length;for(;s;)a=a*33^i.charCodeAt(--s)}else if(ArrayBuffer.isView(i)){const s=new Uint8Array(i.buffer,i.byteOffset,i.byteLength);let u=s.length;for(;u;)a=a*33^s[--u]}else throw new TypeError("value must be a string or TypedArray");return(a>>>0).toString(36)}const de=window.fetch;window.fetch=(e,a)=>((e instanceof Request?e.method:(a==null?void 0:a.method)||"GET")!=="GET"&&ne.delete(Se(e)),de(e,a));const ne=new Map;function gt(e,a){const i=Se(e,a),s=document.querySelector(i);if(s!=null&&s.textContent){const{body:u,...d}=JSON.parse(s.textContent),v=s.getAttribute("data-ttl");return v&&ne.set(i,{body:u,init:d,ttl:1e3*Number(v)}),Promise.resolve(new Response(u,d))}return de(e,a)}function mt(e,a,i){if(ne.size>0){const s=Se(e,i),u=ne.get(s);if(u){if(performance.now()<u.ttl&&["default","force-cache","only-if-cached",void 0].includes(i==null?void 0:i.cache))return new Response(u.body,u.init);ne.delete(s)}}return de(a,i)}function Se(e,a){let s=`script[data-sveltekit-fetched][data-url=${JSON.stringify(e instanceof Request?e.url:e)}]`;if(a!=null&&a.headers||a!=null&&a.body){const u=[];a.headers&&u.push([...new Headers(a.headers)].join(",")),a.body&&(typeof a.body=="string"||ArrayBuffer.isView(a.body))&&u.push(a.body),s+=`[data-hash="${ht(...u)}"]`}return s}const yt=/^(\[)?(\.\.\.)?(\w+)(?:=(\w+))?(\])?$/;function wt(e){const a=[];return{pattern:e==="/"?/^\/$/:new RegExp(`^${bt(e).map(s=>{const u=/^\[\.\.\.(\w+)(?:=(\w+))?\]$/.exec(s);if(u)return a.push({name:u[1],matcher:u[2],optional:!1,rest:!0,chained:!0}),"(?:/(.*))?";const d=/^\[\[(\w+)(?:=(\w+))?\]\]$/.exec(s);if(d)return a.push({name:d[1],matcher:d[2],optional:!0,rest:!1,chained:!0}),"(?:/([^/]+))?";if(!s)return;const v=s.split(/\[(.+?)\](?!\])/);return"/"+v.map((m,y)=>{if(y%2){if(m.startsWith("x+"))return be(String.fromCharCode(parseInt(m.slice(2),16)));if(m.startsWith("u+"))return be(String.fromCharCode(...m.slice(2).split("-").map(I=>parseInt(I,16))));const g=yt.exec(m);if(!g)throw new Error(`Invalid param: ${m}. Params and matcher names can only have underscores and alphanumeric characters.`);const[,$,U,E,O]=g;return a.push({name:E,matcher:O,optional:!!$,rest:!!U,chained:U?y===1&&v[0]==="":!1}),U?"(.*?)":$?"([^/]*)?":"([^/]+?)"}return be(m)}).join("")}).join("")}/?$`),params:a}}function _t(e){return!/^\([^)]+\)$/.test(e)}function bt(e){return e.slice(1).split("/").filter(_t)}function vt(e,a,i){const s={},u=e.slice(1);let d=0;for(let v=0;v<a.length;v+=1){const c=a[v],m=u[v-d];if(c.chained&&c.rest&&d){s[c.name]=u.slice(v-d,v+1).filter(y=>y).join("/"),d=0;continue}if(m===void 0){c.rest&&(s[c.name]="");continue}if(!c.matcher||i[c.matcher](m)){s[c.name]=m;const y=a[v+1],g=u[v+1];y&&!y.rest&&y.optional&&g&&(d=0);continue}if(c.optional&&c.chained){d++;continue}return}if(!d)return s}function be(e){return e.normalize().replace(/[[\]]/g,"\\$&").replace(/%/g,"%25").replace(/\//g,"%2[Ff]").replace(/\?/g,"%3[Ff]").replace(/#/g,"%23").replace(/[.*+?^${}()|\\]/g,"\\$&")}function kt({nodes:e,server_loads:a,dictionary:i,matchers:s}){const u=new Set(a);return Object.entries(i).map(([c,[m,y,g]])=>{const{pattern:$,params:U}=wt(c),E={id:c,exec:O=>{const I=$.exec(O);if(I)return vt(I,U,s)},errors:[1,...g||[]].map(O=>e[O]),layouts:[0,...y||[]].map(v),leaf:d(m)};return E.errors.length=E.layouts.length=Math.max(E.errors.length,E.layouts.length),E});function d(c){const m=c<0;return m&&(c=~c),[m,e[c]]}function v(c){return c===void 0?c:[u.has(c),e[c]]}}let te=class{constructor(a,i){this.status=a,typeof i=="string"?this.body={message:i}:i?this.body=i:this.body={message:`Error: ${a}`}}toString(){return JSON.stringify(this.body)}},Ke=class{constructor(a,i){this.status=a,this.location=i}};function Et(e){e.client}const F={url:Be({}),page:Be({}),navigating:Ee(null),updated:pt()};async function St(e){var a;for(const i in e)if(typeof((a=e[i])==null?void 0:a.then)=="function")return Object.fromEntries(await Promise.all(Object.entries(e).map(async([s,u])=>[s,await u])));return e}Object.getOwnPropertyNames(Object.prototype).sort().join("\0");const Rt=-1,At=-2,Lt=-3,It=-4,Ut=-5,Ot=-6;function Pt(e,a){if(typeof e=="number")return u(e,!0);if(!Array.isArray(e)||e.length===0)throw new Error("Invalid input");const i=e,s=Array(i.length);function u(d,v=!1){if(d===Rt)return;if(d===Lt)return NaN;if(d===It)return 1/0;if(d===Ut)return-1/0;if(d===Ot)return-0;if(v)throw new Error("Invalid input");if(d in s)return s[d];const c=i[d];if(!c||typeof c!="object")s[d]=c;else if(Array.isArray(c))if(typeof c[0]=="string"){const m=c[0],y=a==null?void 0:a[m];if(y)return s[d]=y(u(c[1]));switch(m){case"Date":s[d]=new Date(c[1]);break;case"Set":const g=new Set;s[d]=g;for(let E=1;E<c.length;E+=1)g.add(u(c[E]));break;case"Map":const $=new Map;s[d]=$;for(let E=1;E<c.length;E+=2)$.set(u(c[E]),u(c[E+1]));break;case"RegExp":s[d]=new RegExp(c[1],c[2]);break;case"Object":s[d]=Object(c[1]);break;case"BigInt":s[d]=BigInt(c[1]);break;case"null":const U=Object.create(null);s[d]=U;for(let E=1;E<c.length;E+=2)U[c[E]]=u(c[E+1]);break;default:throw new Error(`Unknown type ${m}`)}}else{const m=new Array(c.length);s[d]=m;for(let y=0;y<c.length;y+=1){const g=c[y];g!==At&&(m[y]=u(g))}}else{const m={};s[d]=m;for(const y in c){const g=c[y];m[y]=u(g)}}return s[d]}return u(0)}function jt(e){return e.filter(a=>a!=null)}const J=et(Ze)??{},Q=et(Xe)??{};function ve(e){J[e]=ee()}function Nt(e,a){var Ce;const i=kt(e),s=e.nodes[0],u=e.nodes[1];s(),u();const d=document.documentElement,v=[],c=[];let m=null;const y={before_navigate:[],after_navigate:[]};let g={branch:[],error:null,url:null},$=!1,U=!1,E=!0,O=!1,I=!1,Y=!1,G=!1,q,N=(Ce=history.state)==null?void 0:Ce[V];N||(N=Date.now(),history.replaceState({...history.state,[V]:N},"",location.href));const pe=J[N];pe&&(history.scrollRestoration="manual",scrollTo(pe.x,pe.y));let H,Re,ae;async function Ae(){ae=ae||Promise.resolve(),await ae,ae=null;const n=new URL(location.href),t=X(n,!0);m=null,await Pe(t,n,[])}function Le(n){c.some(t=>t==null?void 0:t.snapshot)&&(Q[n]=c.map(t=>{var o;return(o=t==null?void 0:t.snapshot)==null?void 0:o.capture()}))}function Ie(n){var t;(t=Q[n])==null||t.forEach((o,r)=>{var f,l;(l=(f=c[r])==null?void 0:f.snapshot)==null||l.restore(o)})}function Ue(){ve(N),Je(Ze,J),Le(N),Je(Xe,Q)}async function he(n,{noScroll:t=!1,replaceState:o=!1,keepFocus:r=!1,state:f={},invalidateAll:l=!1},h,p){return typeof n=="string"&&(n=new URL(n,Me(document))),se({url:n,scroll:t?ee():null,keepfocus:r,redirect_chain:h,details:{state:f,replaceState:o},nav_token:p,accepted:()=>{l&&(G=!0)},blocked:()=>{},type:"goto"})}async function Oe(n){return m={id:n.id,promise:Te(n).then(t=>(t.type==="loaded"&&t.state.error&&(m=null),t))},m.promise}async function re(...n){const o=i.filter(r=>n.some(f=>r.exec(f))).map(r=>Promise.all([...r.layouts,r.leaf].map(f=>f==null?void 0:f[1]())));await Promise.all(o)}async function Pe(n,t,o,r,f,l={},h){var w,_,A;Re=l;let p=n&&await Te(n);if(!p){if(fe(t,M))return await K(t);p=await De(t,{id:null},await Z(new Error(`Not found: ${t.pathname}`),{url:t,params:{},route:{id:null}}),404)}if(t=(n==null?void 0:n.url)||t,Re!==l)return!1;if(p.type==="redirect")if(o.length>10||o.includes(t.pathname))p=await oe({status:500,error:await Z(new Error("Redirect loop"),{url:t,params:{},route:{id:null}}),url:t,route:{id:null}});else return he(new URL(p.location,t).href,{},[...o,t.pathname],l),!1;else((w=p.props.page)==null?void 0:w.status)>=400&&await F.updated.check()&&await K(t);if(v.length=0,G=!1,O=!0,r&&(ve(r),Le(r)),(_=p.props.page)!=null&&_.url&&p.props.page.url.pathname!==t.pathname&&(t.pathname=(A=p.props.page)==null?void 0:A.url.pathname),f&&f.details){const{details:k}=f,L=k.replaceState?0:1;if(k.state[V]=N+=L,history[k.replaceState?"replaceState":"pushState"](k.state,"",t),!k.replaceState){let R=N+1;for(;Q[R]||J[R];)delete Q[R],delete J[R],R+=1}}if(m=null,U?(g=p.state,p.props.page&&(p.props.page.url=t),q.$set(p.props)):je(p),f){const{scroll:k,keepfocus:L}=f,{activeElement:R}=document;if(await le(),E){const P=t.hash&&document.getElementById(decodeURIComponent(t.hash.slice(1)));k?scrollTo(k.x,k.y):P?P.scrollIntoView():scrollTo(0,0)}const b=document.activeElement!==R&&document.activeElement!==document.body;!L&&!b&&await ke()}else await le();E=!0,p.props.page&&(H=p.props.page),h&&h(),O=!1}function je(n){var r;g=n.state;const t=document.querySelector("style[data-sveltekit]");t&&t.remove(),H=n.props.page,q=new e.root({target:a,props:{...n.props,stores:F,components:c},hydrate:!0}),Ie(N);const o={from:null,to:{params:g.params,route:{id:((r=g.route)==null?void 0:r.id)??null},url:new URL(location.href)},willUnload:!1,type:"enter"};y.after_navigate.forEach(f=>f(o)),U=!0}async function W({url:n,params:t,branch:o,status:r,error:f,route:l,form:h}){let p="never";for(const R of o)(R==null?void 0:R.slash)!==void 0&&(p=R.slash);n.pathname=at(n.pathname,p),n.search=n.search;const w={type:"loaded",state:{url:n,params:t,branch:o,error:f,route:l},props:{constructors:jt(o).map(R=>R.node.component)}};h!==void 0&&(w.props.form=h);let _={},A=!H,k=0;for(let R=0;R<Math.max(o.length,g.branch.length);R+=1){const b=o[R],P=g.branch[R];(b==null?void 0:b.data)!==(P==null?void 0:P.data)&&(A=!0),b&&(_={..._,...b.data},A&&(w.props[`data_${k}`]=_),k+=1)}return(!g.url||n.href!==g.url.href||g.error!==f||h!==void 0&&h!==H.form||A)&&(w.props.page={error:f,params:t,route:{id:(l==null?void 0:l.id)??null},status:r,url:new URL(n),form:h??null,data:A?_:H.data}),w}async function ge({loader:n,parent:t,url:o,params:r,route:f,server_data_node:l}){var _,A,k;let h=null;const p={dependencies:new Set,params:new Set,parent:!1,route:!1,url:!1},w=await n();if((_=w.universal)!=null&&_.load){let L=function(...b){for(const P of b){const{href:D}=new URL(P,o);p.dependencies.add(D)}};const R={route:{get id(){return p.route=!0,f.id}},params:new Proxy(r,{get:(b,P)=>(p.params.add(P),b[P])}),data:(l==null?void 0:l.data)??null,url:st(o,()=>{p.url=!0}),async fetch(b,P){let D;b instanceof Request?(D=b.url,P={body:b.method==="GET"||b.method==="HEAD"?void 0:await b.blob(),cache:b.cache,credentials:b.credentials,headers:b.headers,integrity:b.integrity,keepalive:b.keepalive,method:b.method,mode:b.mode,redirect:b.redirect,referrer:b.referrer,referrerPolicy:b.referrerPolicy,signal:b.signal,...P}):D=b;const C=new URL(D,o);return L(C.href),C.origin===o.origin&&(D=C.href.slice(o.origin.length)),U?mt(D,C.href,P):gt(D,P)},setHeaders:()=>{},depends:L,parent(){return p.parent=!0,t()}};h=await w.universal.load.call(null,R)??null,h=h?await St(h):null}return{node:w,loader:n,server:l,universal:(A=w.universal)!=null&&A.load?{type:"data",data:h,uses:p}:null,data:h??(l==null?void 0:l.data)??null,slash:((k=w.universal)==null?void 0:k.trailingSlash)??(l==null?void 0:l.slash)}}function Ne(n,t,o,r,f){if(G)return!0;if(!r)return!1;if(r.parent&&n||r.route&&t||r.url&&o)return!0;for(const l of r.params)if(f[l]!==g.params[l])return!0;for(const l of r.dependencies)if(v.some(h=>h(new URL(l))))return!0;return!1}function me(n,t){return(n==null?void 0:n.type)==="data"?n:(n==null?void 0:n.type)==="skip"?t??null:null}async function Te({id:n,invalidating:t,url:o,params:r,route:f}){if((m==null?void 0:m.id)===n)return m.promise;const{errors:l,layouts:h,leaf:p}=f,w=[...h,p];l.forEach(S=>S==null?void 0:S().catch(()=>{})),w.forEach(S=>S==null?void 0:S[1]().catch(()=>{}));let _=null;const A=g.url?n!==g.url.pathname+g.url.search:!1,k=g.route?f.id!==g.route.id:!1;let L=!1;const R=w.map((S,x)=>{var B;const j=g.branch[x],T=!!(S!=null&&S[0])&&((j==null?void 0:j.loader)!==S[1]||Ne(L,k,A,(B=j.server)==null?void 0:B.uses,r));return T&&(L=!0),T});if(R.some(Boolean)){try{_=await ze(o,R)}catch(S){return oe({status:S instanceof te?S.status:500,error:await Z(S,{url:o,params:r,route:{id:f.id}}),url:o,route:f})}if(_.type==="redirect")return _}const b=_==null?void 0:_.nodes;let P=!1;const D=w.map(async(S,x)=>{var ye;if(!S)return;const j=g.branch[x],T=b==null?void 0:b[x];if((!T||T.type==="skip")&&S[1]===(j==null?void 0:j.loader)&&!Ne(P,k,A,(ye=j.universal)==null?void 0:ye.uses,r))return j;if(P=!0,(T==null?void 0:T.type)==="error")throw T;return ge({loader:S[1],url:o,params:r,route:f,parent:async()=>{var qe;const Ve={};for(let we=0;we<x;we+=1)Object.assign(Ve,(qe=await D[we])==null?void 0:qe.data);return Ve},server_data_node:me(T===void 0&&S[0]?{type:"skip"}:T??null,S[0]?j==null?void 0:j.server:void 0)})});for(const S of D)S.catch(()=>{});const C=[];for(let S=0;S<w.length;S+=1)if(w[S])try{C.push(await D[S])}catch(x){if(x instanceof Ke)return{type:"redirect",location:x.location};let j=500,T;if(b!=null&&b.includes(x))j=x.status??j,T=x.error;else if(x instanceof te)j=x.status,T=x.body;else{if(await F.updated.check())return await K(o);T=await Z(x,{params:r,url:o,route:{id:f.id}})}const B=await $e(S,C,l);return B?await W({url:o,params:r,branch:C.slice(0,B.idx).concat(B.node),status:j,error:T,route:f}):await De(o,{id:f.id},T,j)}else C.push(void 0);return await W({url:o,params:r,branch:C,status:200,error:null,route:f,form:t?void 0:null})}async function $e(n,t,o){for(;n--;)if(o[n]){let r=n;for(;!t[r];)r-=1;try{return{idx:r+1,node:{node:await o[n](),loader:o[n],data:{},server:null,universal:null}}}catch{continue}}}async function oe({status:n,error:t,url:o,route:r}){const f={};let l=null;if(e.server_loads[0]===0)try{const _=await ze(o,[!0]);if(_.type!=="data"||_.nodes[0]&&_.nodes[0].type!=="data")throw 0;l=_.nodes[0]??null}catch{(o.origin!==location.origin||o.pathname!==location.pathname||$)&&await K(o)}const p=await ge({loader:s,url:o,params:f,route:r,parent:()=>Promise.resolve({}),server_data_node:me(l)}),w={node:await u(),loader:u,universal:null,server:null,data:null};return await W({url:o,params:f,branch:[p,w],status:n,error:t,route:null})}function X(n,t){if(fe(n,M))return;const o=ie(n);for(const r of i){const f=r.exec(o);if(f)return{id:n.pathname+n.search,invalidating:t,route:r,params:ot(f),url:n}}}function ie(n){return rt(n.pathname.slice(M.length)||"/")}function xe({url:n,type:t,intent:o,delta:r}){var p,w;let f=!1;const l={from:{params:g.params,route:{id:((p=g.route)==null?void 0:p.id)??null},url:g.url},to:{params:(o==null?void 0:o.params)??null,route:{id:((w=o==null?void 0:o.route)==null?void 0:w.id)??null},url:n},willUnload:!o,type:t};r!==void 0&&(l.delta=r);const h={...l,cancel:()=>{f=!0}};return I||y.before_navigate.forEach(_=>_(h)),f?null:l}async function se({url:n,scroll:t,keepfocus:o,redirect_chain:r,details:f,type:l,delta:h,nav_token:p,accepted:w,blocked:_}){const A=X(n,!1),k=xe({url:n,type:l,delta:h,intent:A});if(!k){_();return}const L=N;w(),I=!0,U&&F.navigating.set(k),await Pe(A,n,r,L,{scroll:t,keepfocus:o,details:f},p,()=>{I=!1,y.after_navigate.forEach(R=>R(k)),F.navigating.set(null)})}async function De(n,t,o,r){return n.origin===location.origin&&n.pathname===location.pathname&&!$?await oe({status:r,error:o,url:n,route:t}):await K(n)}function K(n){return location.href=n.href,new Promise(()=>{})}function nt(){let n;d.addEventListener("mousemove",l=>{const h=l.target;clearTimeout(n),n=setTimeout(()=>{r(h,2)},20)});function t(l){r(l.composedPath()[0],1)}d.addEventListener("mousedown",t),d.addEventListener("touchstart",t,{passive:!0});const o=new IntersectionObserver(l=>{for(const h of l)h.isIntersecting&&(re(ie(new URL(h.target.href))),o.unobserve(h.target))},{threshold:0});function r(l,h){const p=He(l,d);if(!p)return;const{url:w,external:_}=_e(p,M);if(_)return;const A=ce(p);if(!A.reload)if(h<=A.preload_data){const k=X(w,!1);k&&Oe(k)}else h<=A.preload_code&&re(ie(w))}function f(){o.disconnect();for(const l of d.querySelectorAll("a")){const{url:h,external:p}=_e(l,M);if(p)continue;const w=ce(l);w.reload||(w.preload_code===ue.viewport&&o.observe(l),w.preload_code===ue.eager&&re(ie(h)))}}y.after_navigate.push(f),f()}function Z(n,t){return n instanceof te?n.body:e.hooks.handleError({error:n,event:t})??{message:t.route.id!=null?"Internal Error":"Not Found"}}return{after_navigate:n=>{Fe(()=>(y.after_navigate.push(n),()=>{const t=y.after_navigate.indexOf(n);y.after_navigate.splice(t,1)}))},before_navigate:n=>{Fe(()=>(y.before_navigate.push(n),()=>{const t=y.before_navigate.indexOf(n);y.before_navigate.splice(t,1)}))},disable_scroll_handling:()=>{(O||!U)&&(E=!1)},goto:(n,t={})=>he(n,t,[]),invalidate:n=>{if(typeof n=="function")v.push(n);else{const{href:t}=new URL(n,location.href);v.push(o=>o.href===t)}return Ae()},invalidateAll:()=>(G=!0,Ae()),preload_data:async n=>{const t=new URL(n,Me(document)),o=X(t,!1);if(!o)throw new Error(`Attempted to preload a URL that does not belong to this app: ${t}`);await Oe(o)},preload_code:re,apply_action:async n=>{if(n.type==="error"){const t=new URL(location.href),{branch:o,route:r}=g;if(!r)return;const f=await $e(g.branch.length,o,r.errors);if(f){const l=await W({url:t,params:g.params,branch:o.slice(0,f.idx).concat(f.node),status:n.status??500,error:n.error,route:r});g=l.state,q.$set(l.props),le().then(ke)}}else n.type==="redirect"?he(n.location,{invalidateAll:!0},[]):(q.$set({form:null,page:{...H,form:n.data,status:n.status}}),await le(),q.$set({form:n.data}),n.type==="success"&&ke())},_start_router:()=>{var n;history.scrollRestoration="manual",addEventListener("beforeunload",t=>{var r;let o=!1;if(Ue(),!I){const f={from:{params:g.params,route:{id:((r=g.route)==null?void 0:r.id)??null},url:g.url},to:null,willUnload:!0,type:"leave",cancel:()=>o=!0};y.before_navigate.forEach(l=>l(f))}o?(t.preventDefault(),t.returnValue=""):history.scrollRestoration="auto"}),addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&Ue()}),(n=navigator.connection)!=null&&n.saveData||nt(),d.addEventListener("click",t=>{if(t.button||t.which!==1||t.metaKey||t.ctrlKey||t.shiftKey||t.altKey||t.defaultPrevented)return;const o=He(t.composedPath()[0],d);if(!o)return;const{url:r,external:f,target:l}=_e(o,M);if(!r)return;if(l==="_parent"||l==="_top"){if(window.parent!==window)return}else if(l&&l!=="_self")return;const h=ce(o);if(!(o instanceof SVGAElement)&&r.protocol!==location.protocol&&!(r.protocol==="https:"||r.protocol==="http:"))return;if(f||h.reload){xe({url:r,type:"link"})?I=!0:t.preventDefault();return}const[w,_]=r.href.split("#");if(_!==void 0&&w===location.href.split("#")[0]){Y=!0,ve(N),g.url=r,F.page.set({...H,url:r}),F.page.notify();return}se({url:r,scroll:h.noscroll?ee():null,keepfocus:h.keep_focus??!1,redirect_chain:[],details:{state:{},replaceState:h.replace_state??r.href===location.href},accepted:()=>t.preventDefault(),blocked:()=>t.preventDefault(),type:"link"})}),d.addEventListener("submit",t=>{if(t.defaultPrevented)return;const o=HTMLFormElement.prototype.cloneNode.call(t.target),r=t.submitter;if(((r==null?void 0:r.formMethod)||o.method)!=="get")return;const l=new URL((r==null?void 0:r.hasAttribute("formaction"))&&(r==null?void 0:r.formAction)||o.action);if(fe(l,M))return;const h=t.target,{keep_focus:p,noscroll:w,reload:_,replace_state:A}=ce(h);if(_)return;t.preventDefault(),t.stopPropagation();const k=new FormData(h),L=r==null?void 0:r.getAttribute("name");L&&k.append(L,(r==null?void 0:r.getAttribute("value"))??""),l.search=new URLSearchParams(k).toString(),se({url:l,scroll:w?ee():null,keepfocus:p??!1,redirect_chain:[],details:{state:{},replaceState:A??l.href===location.href},nav_token:{},accepted:()=>{},blocked:()=>{},type:"form"})}),addEventListener("popstate",async t=>{var o;if((o=t.state)!=null&&o[V]){if(t.state[V]===N)return;const r=J[t.state[V]];if(g.url.href.split("#")[0]===location.href.split("#")[0]){J[N]=ee(),N=t.state[V],scrollTo(r.x,r.y);return}const f=t.state[V]-N;let l=!1;await se({url:new URL(location.href),scroll:r,keepfocus:!1,redirect_chain:[],details:null,accepted:()=>{N=t.state[V]},blocked:()=>{history.go(-f),l=!0},type:"popstate",delta:f}),l||Ie(N)}}),addEventListener("hashchange",()=>{Y&&(Y=!1,history.replaceState({...history.state,[V]:++N},"",location.href))});for(const t of document.querySelectorAll("link"))t.rel==="icon"&&(t.href=t.href);addEventListener("pageshow",t=>{t.persisted&&F.navigating.set(null)})},_hydrate:async({status:n=200,error:t,node_ids:o,params:r,route:f,data:l,form:h})=>{$=!0;const p=new URL(location.href);({params:r={},route:f={id:null}}=X(p,!1)||{});let w;try{const _=o.map(async(A,k)=>{const L=l[k];return L!=null&&L.uses&&(L.uses=tt(L.uses)),ge({loader:e.nodes[A],url:p,params:r,route:f,parent:async()=>{const R={};for(let b=0;b<k;b+=1)Object.assign(R,(await _[b]).data);return R},server_data_node:me(L)})});w=await W({url:p,params:r,branch:await Promise.all(_),status:n,error:t,form:h,route:i.find(({id:A})=>A===f.id)??null})}catch(_){if(_ instanceof Ke){await K(new URL(_.location,location.href));return}w=await oe({status:_ instanceof te?_.status:500,error:await Z(_,{url:p,params:r,route:f}),url:p,route:f})}je(w)}}}async function ze(e,a){const i=new URL(e);i.pathname=ft(e.pathname),i.searchParams.append("x-sveltekit-invalidated",a.map(u=>u?"1":"").join("_"));const s=await de(i.href);if(!s.ok)throw new te(s.status,await s.json());return new Promise(async u=>{var g;const d=new Map,v=s.body.getReader(),c=new TextDecoder;function m($){return Pt($,{Promise:U=>new Promise((E,O)=>{d.set(U,{fulfil:E,reject:O})})})}let y="";for(;;){const{done:$,value:U}=await v.read();if($&&!y)break;for(y+=!U&&y?`
`:c.decode(U);;){const E=y.indexOf(`
`);if(E===-1)break;const O=JSON.parse(y.slice(0,E));if(y=y.slice(E+1),O.type==="redirect")return u(O);if(O.type==="data")(g=O.nodes)==null||g.forEach(I=>{(I==null?void 0:I.type)==="data"&&(I.uses=tt(I.uses),I.data=m(I.data))}),u(O);else if(O.type==="chunk"){const{id:I,data:Y,error:G}=O,q=d.get(I);d.delete(I),G?q.reject(m(G)):q.fulfil(m(Y))}}}})}function tt(e){return{dependencies:new Set((e==null?void 0:e.dependencies)??[]),params:new Set((e==null?void 0:e.params)??[]),parent:!!(e!=null&&e.parent),route:!!(e!=null&&e.route),url:!!(e!=null&&e.url)}}function ke(){const e=document.querySelector("[autofocus]");if(e)e.focus();else{const a=document.body,i=a.getAttribute("tabindex");return a.tabIndex=-1,a.focus({preventScroll:!0}),i!==null?a.setAttribute("tabindex",i):a.removeAttribute("tabindex"),new Promise(s=>{setTimeout(()=>{var u;s((u=getSelection())==null?void 0:u.removeAllRanges())})})}}async function Ct(e,a,i){const s=Nt(e,a);Et({client:s}),i?await s._hydrate(i):s.goto(location.href,{replaceState:!0}),s._start_router()}export{Ct as start};
