/* thinking-orbs engine (MIT, Jakub Antalik, github.com/Jakubantalik/thinking-orbs),
   bundled as a plain IIFE so the site stays build-free. Exposes ThinkingOrbsEngine. */
var ThinkingOrbsEngine=(()=>{var V=Object.defineProperty;var Dt=Object.getOwnPropertyDescriptor;var wt=Object.getOwnPropertyNames;var Rt=Object.prototype.hasOwnProperty;var Pt=(n,o)=>{for(var t in o)V(n,t,{get:o[t],enumerable:!0})},vt=(n,o,t,a)=>{if(o&&typeof o=="object"||typeof o=="function")for(let e of wt(o))!Rt.call(n,e)&&e!==t&&V(n,e,{get:()=>o[e],enumerable:!(a=Dt(o,e))||a.enumerable});return n};var zt=n=>vt(V({},"__esModule",{value:!0}),n);var Wt={};Pt(Wt,{MODE_DRAWS:()=>Mt,resolvePreset:()=>xt});function T(n,o,t){return n+(o-n)*t}function $(n){return n-Math.floor(n)}function q(n,o){let t=Math.floor(n),a=Math.floor(o),e=n-t,s=o-a;e=e*e*(3-2*e),s=s*s*(3-2*s);let r=I(t,a),p=I(t+1,a),h=I(t,a+1),g=I(t+1,a+1);return r+(p-r)*e+(h-r)*s+(r-p-h+g)*e*s}function I(n,o){let t=Math.sin(n*12.9898+o*78.233)*43758.5453;return t-Math.floor(t)}function _(n,o){let t=Math.PI*(3-Math.sqrt(5)),a=1-2*(n+.5)/o,e=Math.sqrt(1-a*a),s=n*t;return[e*Math.cos(s),a,e*Math.sin(s)]}function ot(n,o){return Math.atan2(Math.sin(n-o),Math.cos(n-o))}function B(n,o,t,a,e){let s=Math.sin(o),r=Math.cos(o),p=Math.sin(n),h=Math.cos(n);return(g,P,m)=>{let c=g*h+m*p,u=-g*p+m*h,R=P*r-u*s,D=P*s+u*r;return[t+c*e,a-R*e,D]}}function Ot(n,o,t,a=.3){for(let e of o){let s=e.a??1,r=Math.min(1,Math.max(0,e.white)),p=Math.round((t?1-r:r)*255);n.fillStyle=`rgba(${p},${p},${p},${s})`,n.beginPath(),n.arc(e.x,e.y,e.r,0,Math.PI*2),n.fill()}}function St(n,o,t){for(let a of o){let e=a.a??1,s=Math.min(1,Math.max(0,a.white)),r=Math.round((t?1-s:s)*255);n.strokeStyle=`rgba(${r},${r},${r},${e})`,n.lineWidth=a.w,n.beginPath(),n.moveTo(a.x1,a.y1),n.lineTo(a.x2,a.y2),n.stroke()}}function N(n,o,t=.3){let a=[];for(let e of n)(e.a??1)<.02||(e.r=Math.max(t,e.r),a.push(e));return a.sort((e,s)=>e.z-s.z),{dots:a,lines:o.filter(e=>(e.a??1)>=.02)}}function st(n,o,t){o.lines.length&&St(n,o.lines,t),Ot(n,o.dots,t)}function E(n,o){return(n/300)**o}var et=(n,o,t)=>{let a=n/2,e=n/2,s=n/2*.76,r=B(o*.4,.3,a,e,1),p=E(n,t.rsPow??.6),h=[],g=t.ghostN??150;for(let c=0;c<g;c++){let u=_(c,g),[R,D,i]=r(u[0]*s,u[1]*s,u[2]*s),M=(i/s+1)/2;h.push({x:R,y:D,z:i,r:.8*p,white:.78,a:.1+.22*M})}let P=t.strandN??52,m=t.turns??3;for(let c=0;c<3;c++){let u=c/3*2*Math.PI;for(let R=0;R<P;R++){let D=($(R/P+o*.045)*2-1)*.96,i=Math.sqrt(Math.max(0,1-D*D)),M=Math.min(1,(1-Math.abs(D))/.1),x=D*Math.PI*m+u,d=1+.075*Math.sin(D*Math.PI*m*2+u*2+o*.8),l=i*s*d,[w,f,y]=r(Math.cos(x)*l,D*s*d,Math.sin(x)*l),b=(y/s+1)/2;h.push({x:w,y:f,z:y,r:((t.rBase??1.2)+(t.rDepth??1.8)*b)*p,white:.55-.45*b,a:M*(.45+.55*b)})}}return N(h,[],t.rMin)};function Ft(n,o,t,a){let e=2*o*t+a,s=n%e,r=new Array(o).fill(0),p=-1;if(s<2*o*t){let h=Math.floor(s/t),g=(s-h*t)/t,m=1-(1-Math.min(1,g/.7))**3;if(h<o){for(let c=0;c<h;c++)r[c]=1;r[h]=m,p=h}else{let c=2*o-1-h;for(let u=0;u<c;u++)r[u]=1;r[c]=1-m,p=c}}return{amount:r,active:p}}function kt(n,o,t){let[a,e,s]=n,r=!1;for(let p=0;p<o.length;p++){if(t.amount[p]<=0)continue;let h=o[p],g=h.axis===0?a:h.axis===1?e:s;if(g<h.lo||g>=h.hi)continue;p===t.active&&(r=!0);let P=h.ang*t.amount[p],m=Math.cos(P),c=Math.sin(P);if(h.axis===0){let u=e*m-s*c;s=e*c+s*m,e=u}else if(h.axis===1){let u=a*m+s*c;s=-a*c+s*m,a=u}else{let u=a*m-e*c;e=a*c+e*m,a=u}}return[a,e,s,r]}function It(n){let o=[];for(let t=0;t<n;t++){let a=Math.min(2,Math.floor(I(t,2.3)*3)),e=-1+.5*Math.min(3,Math.floor(I(t,5.9)*4)),s=I(t,7.7)<.5?1:-1;o.push({axis:a,lo:e,hi:e+.5,ang:s*Math.PI/2})}return o}var rt=(n,o,t)=>{let e=n/2,s=n/2,r=n/2*.82,p=.4+.06*Math.sin(o*.35),h=B(o*.5,p,e,s,r),g=o*(.5+(1.7-.5)*(t.scanMul??1)),P=E(n,t.rsPow??.6),m=t.dimBase??1,c=[],u=t.latRings??17,R=t.lonDensity??44;for(let D=0;D<=u;D++){let i=-Math.PI/2+D/u*Math.PI,M=Math.cos(i),x=Math.sin(i),d=Math.max(1,Math.round(Math.abs(M)*R));for(let l=0;l<d;l++){let w=l/d*2*Math.PI,[f,y,b]=h(M*Math.cos(w),x,M*Math.sin(w)),v=(b+1)/2,F=ot(w+o*.5,g),O=Math.exp(-(F*F)/.18)*Math.max(0,b);c.push({x:f,y,z:b,r:((t.rBase??.6)+(t.rDepth??1.7)*v+(t.rBoost??1)*O)*P,white:(t.inkFar??.62)-(t.inkSpan??.54)*v,a:m+(1-m)*Math.min(1,O)})}}return N(c,[],t.rMin)},at=(n,o,t)=>{let a=n/2,e=n/2,s=n/2*.82,r=B(o*.55,.35+.1*Math.sin(o*.9),a,e,s),p=E(n,t.rsPow??.6),h=t.moveCount??14,g=It(h),P=Ft(o,h,.42,1.2),m=[],c=t.latRings??15,u=t.lonDensity??40;for(let R=0;R<=c;R++){let D=-Math.PI/2+R/c*Math.PI,i=Math.cos(D),M=Math.sin(D),x=Math.max(1,Math.round(Math.abs(i)*u));for(let d=0;d<x;d++){let l=d/x*2*Math.PI,[w,f,y,b]=kt([i*Math.cos(l),M,i*Math.sin(l)],g,P),[v,F,O]=r(w,f,y),z=(O+1)/2;m.push({x:v,y:F,z:O,r:((t.rBase??.6)+(t.rDepth??1.7)*z+(b?t.rActive??.3:0))*p,white:(t.inkFar??.62)-(t.inkSpan??.54)*z-(b?.14:0)})}}return N(m,[],t.rMin)},ct=(n,o,t)=>{let a=n/2,e=n/2,s=n/2*.874,r=B(o*.18,.38,a,e,1),p=E(n,t.rsPow??.6),h=[],g=t.rings??15,P=t.lonDensity??40;for(let m=0;m<=g;m++){let c=-Math.PI/2+m/g*Math.PI,u=Math.cos(c),R=Math.sin(c),D=.62*Math.sin(o*2.1-m*.52)+.38*Math.sin(o*1.27+m*.83),i=s*(.88+.105*D),M=Math.max(1,Math.round(Math.abs(u)*P));for(let x=0;x<M;x++){let d=x/M*2*Math.PI,[l,w,f]=r(u*Math.cos(d)*i,R*i,u*Math.sin(d)*i),y=(f/s+1)/2,b=Math.max(0,D);h.push({x:l,y:w,z:f,r:((t.rBase??.6)+(t.rDepth??1.7)*y)*(1+.4*b)*p,white:.66-.56*y-.1*b})}}return N(h,[],t.rMin)};function Nt(n){return n*n*(3-2*n)}function it(n){let o=n.length,t=[],a=0;for(let e=0;e<o;e++){let s=n[e],r=n[(e+1)%o],p=Math.hypot(r[0]-s[0],r[1]-s[1]);t.push(p),a+=p}return e=>{let s=e*a,r=0;for(;s>t[r]&&r<o-1;)s-=t[r],r++;let p=n[r],h=n[(r+1)%o],g=t[r]?Math.min(1,s/t[r]):0;return[p[0]+(h[0]-p[0])*g,p[1]+(h[1]-p[1])*g]}}var At=n=>{let o=-Math.PI/2+n*2*Math.PI;return[Math.cos(o)*.24,Math.sin(o)*.24]},Bt=it([[0,-.26],[.24,.16],[-.24,.16]]),Et=it([[0,-.2],[.2,-.2],[.2,.2],[-.2,.2],[-.2,-.2]]),J=[At,Bt,Et];function Ct(n){return Math.max(6,Math.round(34*n))}var Z=1.4,ht=.9,X=Z+ht,pt=(n,o,t)=>{let a=J.length,e=o%(X*a),s=Math.floor(e/X),r=e-s*X,p=r>Z?Nt((r-Z)/ht):0,h=t.spread??1,g=J[s],P=J[(s+1)%a],m=160,c=[];for(let f=0;f<m;f++){let y=f/m,b=g(y),v=P(y);c.push([(b[0]+(v[0]-b[0])*p)*h,(b[1]+(v[1]-b[1])*p)*h])}let u=[],R=0;for(let f=0;f<m;f++){let y=c[f],b=c[(f+1)%m],v=Math.hypot(b[0]-y[0],b[1]-y[1]);u.push(v),R+=v}let D=Ct(t.iconD??1),i=(t.rDot??.021)*1.35*h,M=1+.02*Math.sin(r*3.1),x=[],d=n/2,l=0,w=0;for(let f=0;f<D;f++){let y=f/D*R;for(;w+u[l]<y&&l<m-1;)w+=u[l],l++;let b=c[l],v=c[(l+1)%m],F=u[l]?Math.min(1,(y-w)/u[l]):0,O=(b[0]+(v[0]-b[0])*F)*M,z=(b[1]+(v[1]-b[1])*F)*M;x.push({x:d+O*n,y:d+z*n,z:0,r:Math.max(.35,i*n),white:.1})}return N(x,[],t.rMin)};var ut=(n,o,t)=>{let a=n/2,e=n/2,s=n/2*.82,r=B(o*.12,.3,a,e,1),p=E(n,t.rsPow??.6),h=[],g=t.orbitN??12,P=t.ghostN??40,m=t.particles??3;for(let c=0;c<g;c++){let u=I(c,1.7),R=I(c,5.2),D=I(c,8.9),i=s*(.45+.52*u),M=u*2*Math.PI,x=Math.acos(2*R-1),d=Math.sin(x)*Math.cos(M),l=Math.cos(x),w=Math.sin(x)*Math.sin(M),f=-l,y=d,b=0,v=Math.max(1e-6,Math.sqrt(f*f+y*y));f/=v,y/=v;let F=l*b-w*y,O=w*f-d*b,z=d*y-l*f,C=(.25+.55*D)*(D>.5?1:-1);for(let A=0;A<P;A++){let S=A/P*2*Math.PI,[k,L,K]=r((f*Math.cos(S)+F*Math.sin(S))*i,(y*Math.cos(S)+O*Math.sin(S))*i,(b*Math.cos(S)+z*Math.sin(S))*i),j=(K/i+1)/2;h.push({x:k,y:L,z:K,r:(t.ghostR??.9)*p,white:.72,a:(t.ghostA??.5)*(.4+.6*j)})}for(let A=0;A<m;A++){let S=o*C+A/m*2*Math.PI+R*6,[k,L,K]=r((f*Math.cos(S)+F*Math.sin(S))*i,(y*Math.cos(S)+O*Math.sin(S))*i,(b*Math.cos(S)+z*Math.sin(S))*i),j=(K/i+1)/2;h.push({x:k,y:L,z:K,r:((t.partR??1.2)+(t.partRDepth??1.6)*j)*p,white:.3-.22*j})}}return N(h,[],t.rMin)};var tt=(n,o,t)=>{let a=n/2,e=n/2,s=n/2*.78,r=t.spin??1,p=.3,h=B(o*.1*r,p,a,e,1),g=E(n,t.rsPow??.6),P=[],m=t.ghostN??150;for(let z=0;z<m;z++){let C=_(z,m),[A,S,k]=h(C[0]*s,C[1]*s,C[2]*s),L=(k/s+1)/2;P.push({x:A,y:S,z:k,r:.8*g,white:.78,a:.1+.22*L})}let c=o*.24*r,u=t.faceOn?-p:.55+.3*Math.sin(o*.18)*r,R=Math.cos(c),D=0,i=Math.sin(c),M=-i*Math.sin(u),x=Math.cos(u),d=R*Math.sin(u),l=D*d-i*x,w=i*M-R*d,f=R*x-D*M,y=.23*(t.wobMul??1),b=t.faceOn?s/(1+.85*y):s,v=t.lanes??5,F=t.segs??88,O=Math.max(1,Math.round(v*(t.bandMul??1)));for(let z=0;z<O;z++){let C=(z-(O-1)/2)*.075,A=Math.abs(z-(O-1)/2)/Math.max(1,(O-1)/2);for(let S=0;S<F;S++){let k=S/F*2*Math.PI,L=(.16*Math.sin(k*3-o*1.7+z*.22)+.07*Math.sin(k*5+o*1.1))*(t.wobMul??1),K=t.faceOn?1+L:1,j=t.faceOn?C:C+L,W=R*Math.cos(k)+M*Math.sin(k)+l*j,Y=D*Math.cos(k)+x*Math.sin(k)+w*j,G=i*Math.cos(k)+d*Math.sin(k)+f*j,U=Math.sqrt(W*W+Y*Y+G*G),H=b*K,[yt,gt,nt]=h(W/U*H,Y/U*H,G/U*H),Q=(nt/s+1)/2;P.push({x:yt,y:gt,z:nt,r:((t.rBase??1.1)+(t.rDepth??1.7)*Q)*(1-.25*A)*g,white:.52-.44*Q+.18*A,a:.4+.6*Q})}}return N(P,[],t.rMin)};var mt=(n,o,t)=>{let a=n/2,e=n/2,s=n/2*.8*(t.spread??1),r=B(o*.12,.32,a,e,s),p=E(n,t.rsPow??.6),h=t.nodeN??30,g=t.thr??.72,P=t.nodeR??1.4,m=t.nodeRDepth??1.8,c=[];for(let i=0;i<h;i++){let M=_(i,h),x=M[0]+.3*(q(i*.31+9,o*.24)-.5)*2,d=M[1]+.3*(q(i*.53+27,o*.21)-.5)*2,l=M[2]+.3*(q(i*.77+55,o*.27)-.5)*2,w=Math.sqrt(x*x+d*d+l*l);c.push([x/w,d/w,l/w])}let u=[],R=[];for(let i=0;i<h;i++)for(let M=i+1;M<h;M++){let x=c[i][0]-c[M][0],d=c[i][1]-c[M][1],l=c[i][2]-c[M][2],w=Math.sqrt(x*x+d*d+l*l);if(w>=g)continue;let[f,y,b]=r(c[i][0],c[i][1],c[i][2]),[v,F,O]=r(c[M][0],c[M][1],c[M][2]),z=((b+O)/2+1)/2;u.push({x1:f,y1:y,x2:v,y2:F,white:.42,a:(1-w/g)*(.3+.55*z),w:Math.max(.6,(t.lineW??.8)*p)})}for(let i=0;i<h;i++){let[M,x,d]=r(c[i][0],c[i][1],c[i][2]),l=(d+1)/2,w=1+.25*Math.sin(o*1.4+i*2.7);R.push({x:M,y:x,z:d,r:(P+m*l)*w*p,white:.55-.45*l})}let D=t.signals??5;for(let i=0;i<D;i++){let M=Math.floor(o*.55+i*7.31),x=Math.floor(I(M,i*3.1+1.7)*h),d=Math.floor(I(M,i*5.7+4.2)*h);if(x===d)continue;let l=$(o*.55+i*7.31),w=T(c[x][0],c[d][0],l),f=T(c[x][1],c[d][1],l),y=T(c[x][2],c[d][2],l),b=Math.max(1e-6,Math.sqrt(w*w+f*f+y*y)),[v,F,O]=r(w/b,f/b,y/b),z=(O+1)/2;R.push({x:v,y:F,z:O,r:(P*1.5+m*z)*p,white:.05,a:.5+.5*z})}return N(R,u,t.rMin)};var Lt={orbits:ut,globe:rt,rubik:at,wave:ct,web:mt,braid:et,ribbon:tt,ring:tt,morph:pt},Mt=Object.fromEntries(Object.entries(Lt).map(([n,o])=>[n,(t,a,e,s,r)=>st(t,o(a,e,r),s)]));var jt=[["latRings","lonDensity"],["rings","lonDensity"],["lanes","segs"]],Kt=["orbitN","ghostN","nodeN","strandN","signals"],_t=["iconD"],Tt=["rBase","rDepth","rActive","rDot","ghostR","partR","partRDepth","nodeR","nodeRDepth"];function lt(n,o){let t={...n},a=new Set,e=Math.sqrt(o);for(let[s,r]of jt){let p=t[s],h=t[r];p!=null&&h!=null&&!a.has(s)&&!a.has(r)&&(t[s]=Math.max(2,Math.round(p*e)),t[r]=Math.max(2,Math.round(h*e)),a.add(s),a.add(r))}for(let s of Kt){let r=t[s];r!=null&&r!==0&&!a.has(s)&&(t[s]=Math.max(1,Math.round(r*o)))}for(let s of _t){let r=t[s];r!=null&&(t[s]=Math.max(.02,r*o))}return t}function bt(n,o){let t={...n};for(let a of Tt){let e=t[a];e!=null&&(t[a]=e*o)}return t.rSizeMul=(t.rSizeMul??1)*o,t}var dt={globe:{latRings:17,lonDensity:44,rBase:.6,rDepth:1.7,rBoost:1,inkFar:.62,inkSpan:.54,rsPow:.6,rMin:.3},orbits:{orbitN:12,ghostN:40,ghostR:.9,ghostA:.5,particles:3,partR:1.2,partRDepth:1.6,rsPow:.6,rMin:.3},rubik:{latRings:15,lonDensity:40,moveCount:14,rBase:.6,rDepth:1.7,rActive:.3,inkFar:.62,inkSpan:.54,rsPow:.6,rMin:.3},wave:{rings:15,lonDensity:40,rBase:.6,rDepth:1.7,rsPow:.6,rMin:.3},web:{nodeN:30,thr:.72,signals:5,nodeR:1.4,nodeRDepth:1.8,lineW:.8,rsPow:.6,rMin:.3},braid:{strandN:52,turns:3,ghostN:150,rBase:1.2,rDepth:1.8,rsPow:.6,rMin:.3},ribbon:{lanes:5,segs:88,ghostN:150,rBase:1.1,rDepth:1.7,rsPow:.6,rMin:.3},ring:{lanes:5,segs:88,ghostN:0,faceOn:1,rBase:1.1,rDepth:1.7,rsPow:.6,rMin:.3},morph:{rDot:.021,iconD:1,rMin:.25}};var $t={working:"orbits",searching:"globe",solving:"rubik",listening:"wave",connecting:"web",weaving:"braid",composing:"ribbon",breathing:"ring",shaping:"morph"},qt={orbits:{64:{speed:1.885,count:1,size:1},20:{speed:3.9,count:.238,size:2.4}},globe:{64:{speed:2.015,count:.42,size:1.15,extra:{scanMul:4.08,dimBase:.45}},20:{speed:2.665,count:.105,size:1.75,extra:{scanMul:4.335,dimBase:.45}}},rubik:{64:{speed:1.82,count:.35,size:1.05},20:{speed:1.95,count:.088,size:1.9}},wave:{64:{speed:4.388,count:.341,size:1},20:{speed:3.998,count:.105,size:1.6}},web:{64:{speed:3.315,count:1.35,size:.95},20:{speed:6.63,count:.25,size:1.52}},braid:{64:{speed:1.625,count:.5,size:1},20:{speed:2.75,count:.1125,size:1.36}},ribbon:{64:{speed:2.34,count:.25,size:.85,extra:{spin:0,bandMul:3.9,wobMul:1}},20:{speed:3.12,count:.051,size:1.073,extra:{spin:0,bandMul:4.94,wobMul:1}}},ring:{64:{speed:3.24,count:.25,size:.956,extra:{spin:0,bandMul:3.627,wobMul:.368}},20:{speed:3.78,count:.028,size:1.622,extra:{spin:0,bandMul:3.968,wobMul:.565}}},morph:{64:{speed:2.405,count:.702,size:.395,extra:{spread:1.45}},20:{speed:2.08,count:.53,size:1.011,extra:{spread:1.45}}}},ft=new Map;function xt(n,o){let t=`${n}-${o}`,a=ft.get(t);if(a)return a;let e=$t[n],s=qt[e][o],r={...dt[e]};s.count!==1&&(r=lt(r,s.count)),s.size!==1&&(r=bt(r,s.size)),s.extra&&(r={...r,...s.extra});let p={mode:e,speed:s.speed,opts:r};return ft.set(t,p),p}return zt(Wt);})();

/* ─────────────────────────────  ORB MOUNT  ─────────────────────────────
   Vanilla port of <ThinkingOrb>. Any <canvas data-orb="state"> becomes an orb.
     data-orb-size   20 | 64 (the two tuned presets; defaults to 64)
     data-orb-theme  dark | light (defaults from the band: .paper is light)
   All orbs share one clock and one rAF loop; offscreen orbs skip their frame.
   Changing data-orb at runtime swaps the state. */
(function () {
    "use strict";
    var E = window.ThinkingOrbsEngine;
    if (!E) return;

    var LABELS = {
        working: "Working", searching: "Searching", solving: "Solving",
        listening: "Listening", connecting: "Connecting", weaving: "Weaving",
        composing: "Composing", breathing: "Thinking", shaping: "Shaping"
    };
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var orbs = [];

    function configure(o) {
        var state = o.el.getAttribute("data-orb") || "working";
        var r = E.resolvePreset(state, o.size);
        o.draw = E.MODE_DRAWS[r.mode];
        o.speed = r.speed;
        o.opts = r.opts;
        if (!o.el.hasAttribute("aria-hidden")) {
            o.el.setAttribute("role", "img");
            o.el.setAttribute("aria-label", LABELS[state] || state);
        }
    }

    function paint(o, t) {
        o.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        o.ctx.clearRect(0, 0, o.size, o.size);
        o.draw(o.ctx, o.size, t * o.speed, o.dark, o.opts);
    }

    function mount(el) {
        var size = el.getAttribute("data-orb-size") === "20" ? 20 : 64;
        var theme = el.getAttribute("data-orb-theme") || (el.closest(".paper") ? "light" : "dark");
        el.width = el.height = Math.round(size * dpr);
        el.style.width = el.style.height = size + "px";
        var o = { el: el, ctx: el.getContext("2d"), size: size, dark: theme === "dark", visible: true };
        if (!o.ctx) return;
        configure(o);
        paint(o, reduced ? 0.6 : performance.now() / 1000);
        new MutationObserver(function () {
            configure(o);
            if (reduced) paint(o, 0.6);
        }).observe(el, { attributes: true, attributeFilter: ["data-orb"] });
        orbs.push(o);
    }

    function boot() {
        Array.prototype.forEach.call(document.querySelectorAll("canvas[data-orb]"), mount);
        if (reduced || !orbs.length) return;

        if ("IntersectionObserver" in window) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    for (var i = 0; i < orbs.length; i++) if (orbs[i].el === e.target) orbs[i].visible = e.isIntersecting;
                });
            });
            orbs.forEach(function (o) { io.observe(o.el); });
        }

        (function loop() {
            if (document.visibilityState !== "hidden") {
                var t = performance.now() / 1000;
                for (var i = 0; i < orbs.length; i++) {
                    if (orbs[i].visible && orbs[i].el.isConnected) paint(orbs[i], t);
                }
            }
            requestAnimationFrame(loop);
        })();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
})();
