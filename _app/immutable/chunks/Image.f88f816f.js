import{S as _,i as w,s as b,k as y,l as v,n as f,a0 as g,N as m,b as B,M as h,h as I}from"./index.b2354961.js";function S(a){let e,s;return{c(){e=y("img"),this.h()},l(l){e=v(l,"IMG",{srcset:!0,src:!0,alt:!0,loading:!0,decoding:!0,class:!0}),this.h()},h(){f(e,"srcset",a[3]()),g(e.src,s=a[0])||f(e,"src",s),f(e,"alt",a[1]),f(e,"loading","lazy"),f(e,"decoding","async"),f(e,"class","svelte-1ykl0dj"),m(e,"full-bleed",a[2])},m(l,n){B(l,e,n)},p(l,[n]){n&1&&!g(e.src,s=l[0])&&f(e,"src",s),n&2&&f(e,"alt",l[1]),n&4&&m(e,"full-bleed",l[2])},i:h,o:h,d(l){l&&I(e)}}}function k(a,e,s){let l,{src:n}=e,{alt:u}=e,{fullBleed:d=void 0}=e,{formats:c=["avif","webp","png"]}=e,{widths:r=void 0}=e;function o(){let t="";if(r)for(let i=0;i<r.length;i++)t+=`${l}-${r[i]}.${c[0]} ${r[i]}w`,i<r.length-1&&(t+=", ");else for(let i=0;i<c.length;i++)t+=`${l}.${c[i]}`,i<c.length-1&&(t+=", ");return t}return a.$$set=t=>{"src"in t&&s(0,n=t.src),"alt"in t&&s(1,u=t.alt),"fullBleed"in t&&s(2,d=t.fullBleed),"formats"in t&&s(4,c=t.formats),"widths"in t&&s(5,r=t.widths)},a.$$.update=()=>{a.$$.dirty&1&&(l=n.split(".")[0])},[n,u,d,o,c,r]}class M extends _{constructor(e){super(),w(this,e,k,S,b,{src:0,alt:1,fullBleed:2,formats:4,widths:5})}}export{M as I};
