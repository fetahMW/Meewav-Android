/*! Three.js 0.184.0 — MIT; see THREE-LICENSE.txt. Meewav local auth globe. */
(function(){
/**
* @license
* Copyright 2010-2026 Three.js Authors
* SPDX-License-Identifier: MIT
*/
let e={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},t={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},n=1e3,r=1001,i=1002,a=1003,o=1006,s=1008,c=1009,l=1012,u=1014,d=1015,f=1016,p=1017,m=1018,h=1020,g=1023,_=1026,v=1027,y=1029,b=1030,x=1031,S=1033,C=2300,w=2301,T=2302,E=2303,D=2400,O=2401,ee=2402,k=`srgb`,A=`srgb-linear`,j=`linear`,M=`srgb`,te=7680,ne=2e3;function N(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function re(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function P(e){return document.createElementNS(`http://www.w3.org/1999/xhtml`,e)}function ie(){let e=P(`canvas`);return e.style.display=`block`,e}let ae={};function oe(...e){let t=`THREE.`+e.shift();console.log(t,...e)}function se(e){let t=e[0];if(typeof t==`string`&&t.startsWith(`TSL:`)){let t=e[1];t&&t.isStackTrace?e[0]+=` `+t.getLocation():e[1]=`Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.`}return e}function F(...e){e=se(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.warn(n.getError(t)):console.warn(t,...e)}}function I(...e){e=se(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.error(n.getError(t)):console.error(t,...e)}}function ce(...e){let t=e.join(` `);t in ae||(ae[t]=!0,F(...e))}function le(e,t,n){return new Promise(function(r,i){function a(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:i();break;case e.TIMEOUT_EXPIRED:setTimeout(a,n);break;default:r()}}setTimeout(a,n)})}let ue={0:1,2:6,4:7,3:5,1:0,6:2,7:4,5:3};var L=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let r=n[e];if(r!==void 0){let e=r.indexOf(t);e!==-1&&r.splice(e,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let t=n.slice(0);for(let n=0,r=t.length;n<r;n++)t[n].call(this,e);e.target=null}}};let R=`00.01.02.03.04.05.06.07.08.09.0a.0b.0c.0d.0e.0f.10.11.12.13.14.15.16.17.18.19.1a.1b.1c.1d.1e.1f.20.21.22.23.24.25.26.27.28.29.2a.2b.2c.2d.2e.2f.30.31.32.33.34.35.36.37.38.39.3a.3b.3c.3d.3e.3f.40.41.42.43.44.45.46.47.48.49.4a.4b.4c.4d.4e.4f.50.51.52.53.54.55.56.57.58.59.5a.5b.5c.5d.5e.5f.60.61.62.63.64.65.66.67.68.69.6a.6b.6c.6d.6e.6f.70.71.72.73.74.75.76.77.78.79.7a.7b.7c.7d.7e.7f.80.81.82.83.84.85.86.87.88.89.8a.8b.8c.8d.8e.8f.90.91.92.93.94.95.96.97.98.99.9a.9b.9c.9d.9e.9f.a0.a1.a2.a3.a4.a5.a6.a7.a8.a9.aa.ab.ac.ad.ae.af.b0.b1.b2.b3.b4.b5.b6.b7.b8.b9.ba.bb.bc.bd.be.bf.c0.c1.c2.c3.c4.c5.c6.c7.c8.c9.ca.cb.cc.cd.ce.cf.d0.d1.d2.d3.d4.d5.d6.d7.d8.d9.da.db.dc.dd.de.df.e0.e1.e2.e3.e4.e5.e6.e7.e8.e9.ea.eb.ec.ed.ee.ef.f0.f1.f2.f3.f4.f5.f6.f7.f8.f9.fa.fb.fc.fd.fe.ff`.split(`.`),de=1234567,fe=Math.PI/180,pe=180/Math.PI;function me(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,r=Math.random()*4294967295|0;return(R[e&255]+R[e>>8&255]+R[e>>16&255]+R[e>>24&255]+`-`+R[t&255]+R[t>>8&255]+`-`+R[t>>16&15|64]+R[t>>24&255]+`-`+R[n&63|128]+R[n>>8&255]+`-`+R[n>>16&255]+R[n>>24&255]+R[r&255]+R[r>>8&255]+R[r>>16&255]+R[r>>24&255]).toLowerCase()}function z(e,t,n){return Math.max(t,Math.min(n,e))}function he(e,t){return(e%t+t)%t}function ge(e,t,n,r,i){return r+(e-t)*(i-r)/(n-t)}function _e(e,t,n){return e===t?0:(n-e)/(t-e)}function B(e,t,n){return(1-n)*e+n*t}function ve(e,t,n,r){return B(e,t,1-Math.exp(-n*r))}function ye(e,t=1){return t-Math.abs(he(e,t*2)-t)}function be(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*(3-2*e))}function xe(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*e*(e*(e*6-15)+10))}function Se(e,t){return e+Math.floor(Math.random()*(t-e+1))}function Ce(e,t){return e+Math.random()*(t-e)}function we(e){return e*(.5-Math.random())}function Te(e){e!==void 0&&(de=e);let t=de+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function Ee(e){return e*fe}function De(e){return e*pe}function Oe(e){return(e&e-1)==0&&e!==0}function ke(e){return 2**Math.ceil(Math.log(e)/Math.LN2)}function Ae(e){return 2**Math.floor(Math.log(e)/Math.LN2)}function je(e,t,n,r,i){let a=Math.cos,o=Math.sin,s=a(n/2),c=o(n/2),l=a((t+r)/2),u=o((t+r)/2),d=a((t-r)/2),f=o((t-r)/2),p=a((r-t)/2),m=o((r-t)/2);switch(i){case`XYX`:e.set(s*u,c*d,c*f,s*l);break;case`YZY`:e.set(c*f,s*u,c*d,s*l);break;case`ZXZ`:e.set(c*d,c*f,s*u,s*l);break;case`XZX`:e.set(s*u,c*m,c*p,s*l);break;case`YXY`:e.set(c*p,s*u,c*m,s*l);break;case`ZYZ`:e.set(c*m,c*p,s*u,s*l);break;default:F(`MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: `+i)}}function V(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return e/4294967295;case Uint16Array:return e/65535;case Uint8Array:return e/255;case Int32Array:return Math.max(e/2147483647,-1);case Int16Array:return Math.max(e/32767,-1);case Int8Array:return Math.max(e/127,-1);default:throw Error(`Invalid component type.`)}}function Me(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return Math.round(e*4294967295);case Uint16Array:return Math.round(e*65535);case Uint8Array:return Math.round(e*255);case Int32Array:return Math.round(e*2147483647);case Int16Array:return Math.round(e*32767);case Int8Array:return Math.round(e*127);default:throw Error(`Invalid component type.`)}}let Ne={DEG2RAD:fe,RAD2DEG:pe,generateUUID:me,clamp:z,euclideanModulo:he,mapLinear:ge,inverseLerp:_e,lerp:B,damp:ve,pingpong:ye,smoothstep:be,smootherstep:xe,randInt:Se,randFloat:Ce,randFloatSpread:we,seededRandom:Te,degToRad:Ee,radToDeg:De,isPowerOfTwo:Oe,ceilPowerOfTwo:ke,floorPowerOfTwo:Ae,setQuaternionFromProperEuler:je,normalize:Me,denormalize:V};var H=class e{static{e.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw Error(`index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw Error(`index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=z(this.x,e.x,t.x),this.y=z(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=z(this.x,e,t),this.y=z(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(z(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(z(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),r=Math.sin(t),i=this.x-e.x,a=this.y-e.y;return this.x=i*n-a*r+e.x,this.y=i*r+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},U=class{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,i,a,o){let s=n[r+0],c=n[r+1],l=n[r+2],u=n[r+3],d=i[a+0],f=i[a+1],p=i[a+2],m=i[a+3];if(u!==m||s!==d||c!==f||l!==p){let e=s*d+c*f+l*p+u*m;e<0&&(d=-d,f=-f,p=-p,m=-m,e=-e);let t=1-o;if(e<.9995){let n=Math.acos(e),r=Math.sin(n);t=Math.sin(t*n)/r,o=Math.sin(o*n)/r,s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o}else{s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o;let e=1/Math.sqrt(s*s+c*c+l*l+u*u);s*=e,c*=e,l*=e,u*=e}}e[t]=s,e[t+1]=c,e[t+2]=l,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,r,i,a){let o=n[r],s=n[r+1],c=n[r+2],l=n[r+3],u=i[a],d=i[a+1],f=i[a+2],p=i[a+3];return e[t]=o*p+l*u+s*f-c*d,e[t+1]=s*p+l*d+c*u-o*f,e[t+2]=c*p+l*f+o*d-s*u,e[t+3]=l*p-o*u-s*d-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,r=e._y,i=e._z,a=e._order,o=Math.cos,s=Math.sin,c=o(n/2),l=o(r/2),u=o(i/2),d=s(n/2),f=s(r/2),p=s(i/2);switch(a){case`XYZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`YXZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`ZXY`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`ZYX`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`YZX`:this._x=d*l*u+c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u-d*f*p;break;case`XZY`:this._x=d*l*u-c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u+d*f*p;break;default:F(`Quaternion: .setFromEuler() encountered an unknown order: `+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],r=t[4],i=t[8],a=t[1],o=t[5],s=t[9],c=t[2],l=t[6],u=t[10],d=n+o+u;if(d>0){let e=.5/Math.sqrt(d+1);this._w=.25/e,this._x=(l-s)*e,this._y=(i-c)*e,this._z=(a-r)*e}else if(n>o&&n>u){let e=2*Math.sqrt(1+n-o-u);this._w=(l-s)/e,this._x=.25*e,this._y=(r+a)/e,this._z=(i+c)/e}else if(o>u){let e=2*Math.sqrt(1+o-n-u);this._w=(i-c)/e,this._x=(r+a)/e,this._y=.25*e,this._z=(s+l)/e}else{let e=2*Math.sqrt(1+u-n-o);this._w=(a-r)/e,this._x=(i+c)/e,this._y=(s+l)/e,this._z=.25*e}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(z(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x*=e,this._y*=e,this._z*=e,this._w*=e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=t._x,s=t._y,c=t._z,l=t._w;return this._x=n*l+a*o+r*c-i*s,this._y=r*l+a*s+i*o-n*c,this._z=i*l+a*c+n*s-r*o,this._w=a*l-n*o-r*s-i*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,r=-r,i=-i,a=-a,o=-o);let s=1-t;if(o<.9995){let e=Math.acos(o),c=Math.sin(e);s=Math.sin(s*e)/c,t=Math.sin(t*e)/c,this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this._onChangeCallback()}else this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),i=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),i*Math.sin(t),i*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},W=class e{static{e.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw Error(`index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw Error(`index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(G.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(G.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6]*r,this.y=i[1]*t+i[4]*n+i[7]*r,this.z=i[2]*t+i[5]*n+i[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=e.elements,a=1/(i[3]*t+i[7]*n+i[11]*r+i[15]);return this.x=(i[0]*t+i[4]*n+i[8]*r+i[12])*a,this.y=(i[1]*t+i[5]*n+i[9]*r+i[13])*a,this.z=(i[2]*t+i[6]*n+i[10]*r+i[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,r=this.z,i=e.x,a=e.y,o=e.z,s=e.w,c=2*(a*r-o*n),l=2*(o*t-i*r),u=2*(i*n-a*t);return this.x=t+s*c+a*u-o*l,this.y=n+s*l+o*c-i*u,this.z=r+s*u+i*l-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[4]*n+i[8]*r,this.y=i[1]*t+i[5]*n+i[9]*r,this.z=i[2]*t+i[6]*n+i[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=z(this.x,e.x,t.x),this.y=z(this.y,e.y,t.y),this.z=z(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=z(this.x,e,t),this.y=z(this.y,e,t),this.z=z(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(z(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,r=e.y,i=e.z,a=t.x,o=t.y,s=t.z;return this.x=r*s-i*o,this.y=i*a-n*s,this.z=n*o-r*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Pe.copy(this).projectOnVector(e),this.sub(Pe)}reflect(e){return this.sub(Pe.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(z(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};let Pe=new W,G=new U;var K=class e{static{e.prototype.isMatrix3=!0}constructor(e,t,n,r,i,a,o,s,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c)}set(e,t,n,r,i,a,o,s,c){let l=this.elements;return l[0]=e,l[1]=r,l[2]=o,l[3]=t,l[4]=i,l[5]=s,l[6]=n,l[7]=a,l[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[3],s=n[6],c=n[1],l=n[4],u=n[7],d=n[2],f=n[5],p=n[8],m=r[0],h=r[3],g=r[6],_=r[1],v=r[4],y=r[7],b=r[2],x=r[5],S=r[8];return i[0]=a*m+o*_+s*b,i[3]=a*h+o*v+s*x,i[6]=a*g+o*y+s*S,i[1]=c*m+l*_+u*b,i[4]=c*h+l*v+u*x,i[7]=c*g+l*y+u*S,i[2]=d*m+f*_+p*b,i[5]=d*h+f*v+p*x,i[8]=d*g+f*y+p*S,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8];return t*a*l-t*o*c-n*i*l+n*o*s+r*i*c-r*a*s}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=l*a-o*c,d=o*s-l*i,f=c*i-a*s,p=t*u+n*d+r*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let m=1/p;return e[0]=u*m,e[1]=(r*c-l*n)*m,e[2]=(o*n-r*a)*m,e[3]=d*m,e[4]=(l*t-r*s)*m,e[5]=(r*i-o*t)*m,e[6]=f*m,e[7]=(n*s-c*t)*m,e[8]=(a*t-n*i)*m,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,i,a,o){let s=Math.cos(i),c=Math.sin(i);return this.set(n*s,n*c,-n*(s*a+c*o)+a+e,-r*c,r*s,-r*(-c*a+s*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(Fe.makeScale(e,t)),this}rotate(e){return this.premultiply(Fe.makeRotation(-e)),this}translate(e,t){return this.premultiply(Fe.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<9;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}};let Fe=new K,Ie=new K().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Le=new K().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Re(){let e={enabled:!0,workingColorSpace:A,spaces:{},convert:function(e,t,n){return this.enabled===!1||t===n||!t||!n?e:(this.spaces[t].transfer===`srgb`&&(e.r=ze(e.r),e.g=ze(e.g),e.b=ze(e.b)),this.spaces[t].primaries!==this.spaces[n].primaries&&(e.applyMatrix3(this.spaces[t].toXYZ),e.applyMatrix3(this.spaces[n].fromXYZ)),this.spaces[n].transfer===`srgb`&&(e.r=Be(e.r),e.g=Be(e.g),e.b=Be(e.b)),e)},workingToColorSpace:function(e,t){return this.convert(e,this.workingColorSpace,t)},colorSpaceToWorking:function(e,t){return this.convert(e,t,this.workingColorSpace)},getPrimaries:function(e){return this.spaces[e].primaries},getTransfer:function(e){return e===``?j:this.spaces[e].transfer},getToneMappingMode:function(e){return this.spaces[e].outputColorSpaceConfig.toneMappingMode||`standard`},getLuminanceCoefficients:function(e,t=this.workingColorSpace){return e.fromArray(this.spaces[t].luminanceCoefficients)},define:function(e){Object.assign(this.spaces,e)},_getMatrix:function(e,t,n){return e.copy(this.spaces[t].toXYZ).multiply(this.spaces[n].fromXYZ)},_getDrawingBufferColorSpace:function(e){return this.spaces[e].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(e=this.workingColorSpace){return this.spaces[e].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(t,n){return ce(`ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace().`),e.workingToColorSpace(t,n)},toWorkingColorSpace:function(t,n){return ce(`ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking().`),e.colorSpaceToWorking(t,n)}},t=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],r=[.3127,.329];return e.define({[A]:{primaries:t,whitePoint:r,transfer:j,toXYZ:Ie,fromXYZ:Le,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:k},outputColorSpaceConfig:{drawingBufferColorSpace:k}},[k]:{primaries:t,whitePoint:r,transfer:M,toXYZ:Ie,fromXYZ:Le,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:k}}}),e}let q=Re();function ze(e){return e<.04045?e*.0773993808:(e*.9478672986+.0521327014)**2.4}function Be(e){return e<.0031308?e*12.92:1.055*e**.41666-.055}let Ve;var He=class{static getDataURL(e,t=`image/png`){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>`u`)return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{Ve===void 0&&(Ve=P(`canvas`)),Ve.width=e.width,Ve.height=e.height;let t=Ve.getContext(`2d`);e instanceof ImageData?t.putImageData(e,0,0):t.drawImage(e,0,0,e.width,e.height),n=Ve}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap){let t=P(`canvas`);t.width=e.width,t.height=e.height;let n=t.getContext(`2d`);n.drawImage(e,0,0,e.width,e.height);let r=n.getImageData(0,0,e.width,e.height),i=r.data;for(let e=0;e<i.length;e++)i[e]=ze(i[e]/255)*255;return n.putImageData(r,0,0),t}else if(e.data){let t=e.data.slice(0);for(let e=0;e<t.length;e++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[e]=Math.floor(ze(t[e]/255)*255):t[e]=ze(t[e]);return{data:t,width:e.width,height:e.height}}else return F(`ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.`),e}};let Ue=0;var We=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Ue++}),this.uuid=me(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<`u`&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<`u`&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t===null?e.set(0,0,0):e.set(t.width,t.height,t.depth||0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:``},r=this.data;if(r!==null){let e;if(Array.isArray(r)){e=[];for(let t=0,n=r.length;t<n;t++)r[t].isDataTexture?e.push(Ge(r[t].image)):e.push(Ge(r[t]))}else e=Ge(r);n.url=e}return t||(e.images[this.uuid]=n),n}};function Ge(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap?He.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(F(`Texture: Unable to serialize Texture.`),{})}let Ke=0,qe=new W;var Je=class e extends L{constructor(t=e.DEFAULT_IMAGE,n=e.DEFAULT_MAPPING,i=r,a=r,l=o,u=s,d=g,f=c,p=e.DEFAULT_ANISOTROPY,m=``){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Ke++}),this.uuid=me(),this.name=``,this.source=new We(t),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=i,this.wrapT=a,this.magFilter=l,this.minFilter=u,this.anisotropy=p,this.format=d,this.internalFormat=null,this.type=f,this.offset=new H(0,0),this.repeat=new H(1,1),this.center=new H(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new K,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=m,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(qe).x}get height(){return this.source.getSize(qe).y}get depth(){return this.source.getSize(qe).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){F(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){F(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:`Texture`,generator:`Texture.toJSON`},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:`dispose`})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case n:e.x-=Math.floor(e.x);break;case r:e.x=e.x<0?0:1;break;case i:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x-=Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case n:e.y-=Math.floor(e.y);break;case r:e.y=e.y<0?0:1;break;case i:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y-=Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Je.DEFAULT_IMAGE=null,Je.DEFAULT_MAPPING=300,Je.DEFAULT_ANISOTROPY=1;var Ye=class e{static{e.prototype.isVector4=!0}constructor(e=0,t=0,n=0,r=1){this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw Error(`index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw Error(`index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w===void 0?1:e.w,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*i,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*i,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*i,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*i,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,i,a=.01,o=.1,s=e.elements,c=s[0],l=s[4],u=s[8],d=s[1],f=s[5],p=s[9],m=s[2],h=s[6],g=s[10];if(Math.abs(l-d)<a&&Math.abs(u-m)<a&&Math.abs(p-h)<a){if(Math.abs(l+d)<o&&Math.abs(u+m)<o&&Math.abs(p+h)<o&&Math.abs(c+f+g-3)<o)return this.set(1,0,0,0),this;t=Math.PI;let e=(c+1)/2,s=(f+1)/2,_=(g+1)/2,v=(l+d)/4,y=(u+m)/4,b=(p+h)/4;return e>s&&e>_?e<a?(n=0,r=.707106781,i=.707106781):(n=Math.sqrt(e),r=v/n,i=y/n):s>_?s<a?(n=.707106781,r=0,i=.707106781):(r=Math.sqrt(s),n=v/r,i=b/r):_<a?(n=.707106781,r=.707106781,i=0):(i=Math.sqrt(_),n=y/i,r=b/i),this.set(n,r,i,t),this}let _=Math.sqrt((h-p)*(h-p)+(u-m)*(u-m)+(d-l)*(d-l));return Math.abs(_)<.001&&(_=1),this.x=(h-p)/_,this.y=(u-m)/_,this.z=(d-l)/_,this.w=Math.acos((c+f+g-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=z(this.x,e.x,t.x),this.y=z(this.y,e.y,t.y),this.z=z(this.z,e.z,t.z),this.w=z(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=z(this.x,e,t),this.y=z(this.y,e,t),this.z=z(this.z,e,t),this.w=z(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(z(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Xe=class extends L{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:o,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new Ye(0,0,e,t),this.scissorTest=!1,this.viewport=new Ye(0,0,e,t),this.textures=[];let r=new Je({width:e,height:t,depth:n.depth}),i=n.count;for(let e=0;e<i;e++)this.textures[e]=r.clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview}_setTextureOptions(e={}){let t={minFilter:o,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let e=0;e<this.textures.length;e++)this.textures[e].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,i=this.textures.length;r<i;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let n=Object.assign({},e.textures[t].image);this.textures[t].source=new We(n)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this.multiview=e.multiview,this}dispose(){this.dispatchEvent({type:`dispose`})}},Ze=class extends Xe{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},Qe=class extends Je{constructor(e=null,t=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=a,this.minFilter=a,this.wrapR=r,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}},$e=class extends Je{constructor(e=null,t=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=a,this.minFilter=a,this.wrapR=r,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},et=class e{static{e.prototype.isMatrix4=!0}constructor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h)}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){let g=this.elements;return g[0]=e,g[4]=t,g[8]=n,g[12]=r,g[1]=i,g[5]=a,g[9]=o,g[13]=s,g[2]=c,g[6]=l,g[10]=u,g[14]=d,g[3]=f,g[7]=p,g[11]=m,g[15]=h,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new e().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinant()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinant()===0)return this.identity();let t=this.elements,n=e.elements,r=1/tt.setFromMatrixColumn(e,0).length(),i=1/tt.setFromMatrixColumn(e,1).length(),a=1/tt.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*i,t[5]=n[5]*i,t[6]=n[6]*i,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,r=e.y,i=e.z,a=Math.cos(n),o=Math.sin(n),s=Math.cos(r),c=Math.sin(r),l=Math.cos(i),u=Math.sin(i);if(e.order===`XYZ`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=-s*u,t[8]=c,t[1]=n+r*c,t[5]=e-i*c,t[9]=-o*s,t[2]=i-e*c,t[6]=r+n*c,t[10]=a*s}else if(e.order===`YXZ`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e+i*o,t[4]=r*o-n,t[8]=a*c,t[1]=a*u,t[5]=a*l,t[9]=-o,t[2]=n*o-r,t[6]=i+e*o,t[10]=a*s}else if(e.order===`ZXY`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e-i*o,t[4]=-a*u,t[8]=r+n*o,t[1]=n+r*o,t[5]=a*l,t[9]=i-e*o,t[2]=-a*c,t[6]=o,t[10]=a*s}else if(e.order===`ZYX`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=r*c-n,t[8]=e*c+i,t[1]=s*u,t[5]=i*c+e,t[9]=n*c-r,t[2]=-c,t[6]=o*s,t[10]=a*s}else if(e.order===`YZX`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=i-e*u,t[8]=r*u+n,t[1]=u,t[5]=a*l,t[9]=-o*l,t[2]=-c*l,t[6]=n*u+r,t[10]=e-i*u}else if(e.order===`XZY`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=-u,t[8]=c*l,t[1]=e*u+i,t[5]=a*l,t[9]=n*u-r,t[2]=r*u-n,t[6]=o*l,t[10]=i*u+e}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(nt,e,rt)}lookAt(e,t,n){let r=this.elements;return ot.subVectors(e,t),ot.lengthSq()===0&&(ot.z=1),ot.normalize(),it.crossVectors(n,ot),it.lengthSq()===0&&(Math.abs(n.z)===1?ot.x+=1e-4:ot.z+=1e-4,ot.normalize(),it.crossVectors(n,ot)),it.normalize(),at.crossVectors(ot,it),r[0]=it.x,r[4]=at.x,r[8]=ot.x,r[1]=it.y,r[5]=at.y,r[9]=ot.y,r[2]=it.z,r[6]=at.z,r[10]=ot.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[4],s=n[8],c=n[12],l=n[1],u=n[5],d=n[9],f=n[13],p=n[2],m=n[6],h=n[10],g=n[14],_=n[3],v=n[7],y=n[11],b=n[15],x=r[0],S=r[4],C=r[8],w=r[12],T=r[1],E=r[5],D=r[9],O=r[13],ee=r[2],k=r[6],A=r[10],j=r[14],M=r[3],te=r[7],ne=r[11],N=r[15];return i[0]=a*x+o*T+s*ee+c*M,i[4]=a*S+o*E+s*k+c*te,i[8]=a*C+o*D+s*A+c*ne,i[12]=a*w+o*O+s*j+c*N,i[1]=l*x+u*T+d*ee+f*M,i[5]=l*S+u*E+d*k+f*te,i[9]=l*C+u*D+d*A+f*ne,i[13]=l*w+u*O+d*j+f*N,i[2]=p*x+m*T+h*ee+g*M,i[6]=p*S+m*E+h*k+g*te,i[10]=p*C+m*D+h*A+g*ne,i[14]=p*w+m*O+h*j+g*N,i[3]=_*x+v*T+y*ee+b*M,i[7]=_*S+v*E+y*k+b*te,i[11]=_*C+v*D+y*A+b*ne,i[15]=_*w+v*O+y*j+b*N,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[12],a=e[1],o=e[5],s=e[9],c=e[13],l=e[2],u=e[6],d=e[10],f=e[14],p=e[3],m=e[7],h=e[11],g=e[15],_=s*f-c*d,v=o*f-c*u,y=o*d-s*u,b=a*f-c*l,x=a*d-s*l,S=a*u-o*l;return t*(m*_-h*v+g*y)-n*(p*_-h*b+g*x)+r*(p*v-m*b+g*S)-i*(p*y-m*x+h*S)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=t*c-i*a,b=n*s-r*o,x=n*c-i*o,S=r*c-i*s,C=l*m-u*p,w=l*h-d*p,T=l*g-f*p,E=u*h-d*m,D=u*g-f*m,O=d*g-f*h,ee=_*O-v*D+y*E+b*T-x*w+S*C;if(ee===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let k=1/ee;return e[0]=(o*O-s*D+c*E)*k,e[1]=(r*D-n*O-i*E)*k,e[2]=(m*S-h*x+g*b)*k,e[3]=(d*x-u*S-f*b)*k,e[4]=(s*T-a*O-c*w)*k,e[5]=(t*O-r*T+i*w)*k,e[6]=(h*y-p*S-g*v)*k,e[7]=(l*S-d*y+f*v)*k,e[8]=(a*D-o*T+c*C)*k,e[9]=(n*T-t*D-i*C)*k,e[10]=(p*x-m*y+g*_)*k,e[11]=(u*y-l*x-f*_)*k,e[12]=(o*w-a*E-s*C)*k,e[13]=(t*E-n*w+r*C)*k,e[14]=(m*v-p*b-h*_)*k,e[15]=(l*b-u*v+d*_)*k,this}scale(e){let t=this.elements,n=e.x,r=e.y,i=e.z;return t[0]*=n,t[4]*=r,t[8]*=i,t[1]*=n,t[5]*=r,t[9]*=i,t[2]*=n,t[6]*=r,t[10]*=i,t[3]*=n,t[7]*=r,t[11]*=i,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),r=Math.sin(t),i=1-n,a=e.x,o=e.y,s=e.z,c=i*a,l=i*o;return this.set(c*a+n,c*o-r*s,c*s+r*o,0,c*o+r*s,l*o+n,l*s-r*a,0,c*s-r*o,l*s+r*a,i*s*s+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,i,a){return this.set(1,n,i,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){let r=this.elements,i=t._x,a=t._y,o=t._z,s=t._w,c=i+i,l=a+a,u=o+o,d=i*c,f=i*l,p=i*u,m=a*l,h=a*u,g=o*u,_=s*c,v=s*l,y=s*u,b=n.x,x=n.y,S=n.z;return r[0]=(1-(m+g))*b,r[1]=(f+y)*b,r[2]=(p-v)*b,r[3]=0,r[4]=(f-y)*x,r[5]=(1-(d+g))*x,r[6]=(h+_)*x,r[7]=0,r[8]=(p+v)*S,r[9]=(h-_)*S,r[10]=(1-(d+m))*S,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let i=this.determinant();if(i===0)return n.set(1,1,1),t.identity(),this;let a=tt.set(r[0],r[1],r[2]).length(),o=tt.set(r[4],r[5],r[6]).length(),s=tt.set(r[8],r[9],r[10]).length();i<0&&(a=-a),J.copy(this);let c=1/a,l=1/o,u=1/s;return J.elements[0]*=c,J.elements[1]*=c,J.elements[2]*=c,J.elements[4]*=l,J.elements[5]*=l,J.elements[6]*=l,J.elements[8]*=u,J.elements[9]*=u,J.elements[10]*=u,t.setFromRotationMatrix(J),n.x=a,n.y=o,n.z=s,this}makePerspective(e,t,n,r,i,a,o=ne,s=!1){let c=this.elements,l=2*i/(t-e),u=2*i/(n-r),d=(t+e)/(t-e),f=(n+r)/(n-r),p,m;if(s)p=i/(a-i),m=a*i/(a-i);else if(o===2e3)p=-(a+i)/(a-i),m=-2*a*i/(a-i);else if(o===2001)p=-a/(a-i),m=-a*i/(a-i);else throw Error(`THREE.Matrix4.makePerspective(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,r,i,a,o=ne,s=!1){let c=this.elements,l=2/(t-e),u=2/(n-r),d=-(t+e)/(t-e),f=-(n+r)/(n-r),p,m;if(s)p=1/(a-i),m=a/(a-i);else if(o===2e3)p=-2/(a-i),m=-(a+i)/(a-i);else if(o===2001)p=-1/(a-i),m=-i/(a-i);else throw Error(`THREE.Matrix4.makeOrthographic(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<16;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}};let tt=new W,J=new et,nt=new W(0,0,0),rt=new W(1,1,1),it=new W,at=new W,ot=new W,st=new et,ct=new U;var lt=class e{constructor(t=0,n=0,r=0,i=e.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=r,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let r=e.elements,i=r[0],a=r[4],o=r[8],s=r[1],c=r[5],l=r[9],u=r[2],d=r[6],f=r[10];switch(t){case`XYZ`:this._y=Math.asin(z(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-l,f),this._z=Math.atan2(-a,i)):(this._x=Math.atan2(d,c),this._z=0);break;case`YXZ`:this._x=Math.asin(-z(l,-1,1)),Math.abs(l)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(s,c)):(this._y=Math.atan2(-u,i),this._z=0);break;case`ZXY`:this._x=Math.asin(z(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(s,i));break;case`ZYX`:this._y=Math.asin(-z(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(s,i)):(this._x=0,this._z=Math.atan2(-a,c));break;case`YZX`:this._z=Math.asin(z(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(-l,c),this._y=Math.atan2(-u,i)):(this._x=0,this._y=Math.atan2(o,f));break;case`XZY`:this._z=Math.asin(-z(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,i)):(this._x=Math.atan2(-l,f),this._y=0);break;default:F(`Euler: .setFromRotationMatrix() encountered an unknown order: `+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return st.makeRotationFromQuaternion(e),this.setFromRotationMatrix(st,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return ct.setFromEuler(this),this.setFromQuaternion(ct,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};lt.DEFAULT_ORDER=`XYZ`;var ut=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!=0}};let dt=0,ft=new W,pt=new U,mt=new et,ht=new W,gt=new W,_t=new W,vt=new U,yt=new W(1,0,0),bt=new W(0,1,0),xt=new W(0,0,1),St={type:`added`},Ct={type:`removed`},wt={type:`childadded`,child:null},Tt={type:`childremoved`,child:null};var Et=class e extends L{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:dt++}),this.uuid=me(),this.name=``,this.type=`Object3D`,this.parent=null,this.children=[],this.up=e.DEFAULT_UP.clone();let t=new W,n=new lt,r=new U,i=new W(1,1,1);function a(){r.setFromEuler(n,!1)}function o(){n.setFromQuaternion(r,void 0,!1)}n._onChange(a),r._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:r},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new et},normalMatrix:{value:new K}}),this.matrix=new et,this.matrixWorld=new et,this.matrixAutoUpdate=e.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new ut,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return pt.setFromAxisAngle(e,t),this.quaternion.multiply(pt),this}rotateOnWorldAxis(e,t){return pt.setFromAxisAngle(e,t),this.quaternion.premultiply(pt),this}rotateX(e){return this.rotateOnAxis(yt,e)}rotateY(e){return this.rotateOnAxis(bt,e)}rotateZ(e){return this.rotateOnAxis(xt,e)}translateOnAxis(e,t){return ft.copy(e).applyQuaternion(this.quaternion),this.position.add(ft.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(yt,e)}translateY(e){return this.translateOnAxis(bt,e)}translateZ(e){return this.translateOnAxis(xt,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(mt.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?ht.copy(e):ht.set(e,t,n);let r=this.parent;this.updateWorldMatrix(!0,!1),gt.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?mt.lookAt(gt,ht,this.up):mt.lookAt(ht,gt,this.up),this.quaternion.setFromRotationMatrix(mt),r&&(mt.extractRotation(r.matrixWorld),pt.setFromRotationMatrix(mt),this.quaternion.premultiply(pt.invert()))}add(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return e===this?(I(`Object3D.add: object can't be added as a child of itself.`,e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(St),wt.child=e,this.dispatchEvent(wt),wt.child=null):I(`Object3D.add: object not an instance of THREE.Object3D.`,e),this)}remove(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.remove(arguments[e]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Ct),Tt.child=e,this.dispatchEvent(Tt),Tt.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),mt.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),mt.multiply(e.parent.matrixWorld)),e.applyMatrix4(mt),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(St),wt.child=e,this.dispatchEvent(wt),wt.child=null,this}getObjectById(e){return this.getObjectByProperty(`id`,e)}getObjectByName(e){return this.getObjectByProperty(`name`,e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){let r=this.children[n].getObjectByProperty(e,t);if(r!==void 0)return r}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let r=this.children;for(let i=0,a=r.length;i<a;i++)r[i].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(gt,e,_t),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(gt,vt,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,r=e.z,i=this.matrix.elements;i[12]+=t-i[0]*t-i[4]*n-i[8]*r,i[13]+=n-i[1]*t-i[5]*n-i[9]*r,i[14]+=r-i[2]*t-i[6]*n-i[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){let n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let e=this.children;for(let t=0,n=e.length;t<n;t++)e[t].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e==`string`,n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:`Object`,generator:`Object3D.toJSON`});let r={};r.uuid=this.uuid,r.type=this.type,this.name!==``&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),this.static!==!1&&(r.static=this.static),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type=`InstancedMesh`,r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type=`BatchedMesh`,r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(e=>({...e,boundingBox:e.boundingBox?e.boundingBox.toJSON():void 0,boundingSphere:e.boundingSphere?e.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(e=>({...e})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function i(t,n){return t[n.uuid]===void 0&&(t[n.uuid]=n.toJSON(e)),n.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=i(e.geometries,this.geometry);let t=this.geometry.parameters;if(t!==void 0&&t.shapes!==void 0){let n=t.shapes;if(Array.isArray(n))for(let t=0,r=n.length;t<r;t++){let r=n[t];i(e.shapes,r)}else i(e.shapes,n)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(i(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let t=[];for(let n=0,r=this.material.length;n<r;n++)t.push(i(e.materials,this.material[n]));r.material=t}else r.material=i(e.materials,this.material);if(this.children.length>0){r.children=[];for(let t=0;t<this.children.length;t++)r.children.push(this.children[t].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let t=0;t<this.animations.length;t++){let n=this.animations[t];r.animations.push(i(e.animations,n))}}if(t){let t=a(e.geometries),r=a(e.materials),i=a(e.textures),o=a(e.images),s=a(e.shapes),c=a(e.skeletons),l=a(e.animations),u=a(e.nodes);t.length>0&&(n.geometries=t),r.length>0&&(n.materials=r),i.length>0&&(n.textures=i),o.length>0&&(n.images=o),s.length>0&&(n.shapes=s),c.length>0&&(n.skeletons=c),l.length>0&&(n.animations=l),u.length>0&&(n.nodes=u)}return n.object=r,n;function a(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot===null?null:e.pivot.clone(),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let t=0;t<e.children.length;t++){let n=e.children[t];this.add(n.clone())}return this}};Et.DEFAULT_UP=new W(0,1,0),Et.DEFAULT_MATRIX_AUTO_UPDATE=!0,Et.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Dt=class extends Et{constructor(){super(),this.isGroup=!0,this.type=`Group`}};let Ot={type:`move`};var kt=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Dt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Dt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new W,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new W),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Dt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new W,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new W,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:`connected`,data:e}),this}disconnect(e){return this.dispatchEvent({type:`disconnected`,data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,i=null,a=null,o=this._targetRay,s=this._grip,c=this._hand;if(e&&t.session.visibilityState!==`visible-blurred`){if(c&&e.hand){a=!0;for(let r of e.hand.values()){let e=t.getJointPose(r,n),i=this._getHandJoint(c,r);e!==null&&(i.matrix.fromArray(e.transform.matrix),i.matrix.decompose(i.position,i.rotation,i.scale),i.matrixWorldNeedsUpdate=!0,i.jointRadius=e.radius),i.visible=e!==null}let r=c.joints[`index-finger-tip`],i=c.joints[`thumb-tip`],o=r.position.distanceTo(i.position);c.inputState.pinching&&o>.025?(c.inputState.pinching=!1,this.dispatchEvent({type:`pinchend`,handedness:e.handedness,target:this})):!c.inputState.pinching&&o<=.015&&(c.inputState.pinching=!0,this.dispatchEvent({type:`pinchstart`,handedness:e.handedness,target:this}))}else s!==null&&e.gripSpace&&(i=t.getPose(e.gripSpace,n),i!==null&&(s.matrix.fromArray(i.transform.matrix),s.matrix.decompose(s.position,s.rotation,s.scale),s.matrixWorldNeedsUpdate=!0,i.linearVelocity?(s.hasLinearVelocity=!0,s.linearVelocity.copy(i.linearVelocity)):s.hasLinearVelocity=!1,i.angularVelocity?(s.hasAngularVelocity=!0,s.angularVelocity.copy(i.angularVelocity)):s.hasAngularVelocity=!1,s.eventsEnabled&&s.dispatchEvent({type:`gripUpdated`,data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&i!==null&&(r=i),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Ot)))}return o!==null&&(o.visible=r!==null),s!==null&&(s.visible=i!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new Dt;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}};let At={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},jt={h:0,s:0,l:0},Mt={h:0,s:0,l:0};function Nt(e,t,n){return n<0&&(n+=1),n>1&&--n,n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}var Y=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let t=e;t&&t.isColor?this.copy(t):typeof t==`number`?this.setHex(t):typeof t==`string`&&this.setStyle(t)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=k){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,q.colorSpaceToWorking(this,t),this}setRGB(e,t,n,r=q.workingColorSpace){return this.r=e,this.g=t,this.b=n,q.colorSpaceToWorking(this,r),this}setHSL(e,t,n,r=q.workingColorSpace){if(e=he(e,1),t=z(t,0,1),n=z(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,i=2*n-r;this.r=Nt(i,r,e+1/3),this.g=Nt(i,r,e),this.b=Nt(i,r,e-1/3)}return q.colorSpaceToWorking(this,r),this}setStyle(e,t=k){function n(t){t!==void 0&&parseFloat(t)<1&&F(`Color: Alpha component of `+e+` will be ignored.`)}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let i,a=r[1],o=r[2];switch(a){case`rgb`:case`rgba`:if(i=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(255,parseInt(i[1],10))/255,Math.min(255,parseInt(i[2],10))/255,Math.min(255,parseInt(i[3],10))/255,t);if(i=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(100,parseInt(i[1],10))/100,Math.min(100,parseInt(i[2],10))/100,Math.min(100,parseInt(i[3],10))/100,t);break;case`hsl`:case`hsla`:if(i=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setHSL(parseFloat(i[1])/360,parseFloat(i[2])/100,parseFloat(i[3])/100,t);break;default:F(`Color: Unknown color model `+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let n=r[1],i=n.length;if(i===3)return this.setRGB(parseInt(n.charAt(0),16)/15,parseInt(n.charAt(1),16)/15,parseInt(n.charAt(2),16)/15,t);if(i===6)return this.setHex(parseInt(n,16),t);F(`Color: Invalid hex color `+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=k){let n=At[e.toLowerCase()];return n===void 0?F(`Color: Unknown color `+e):this.setHex(n,t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=ze(e.r),this.g=ze(e.g),this.b=ze(e.b),this}copyLinearToSRGB(e){return this.r=Be(e.r),this.g=Be(e.g),this.b=Be(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=k){return q.workingToColorSpace(Pt.copy(this),e),Math.round(z(Pt.r*255,0,255))*65536+Math.round(z(Pt.g*255,0,255))*256+Math.round(z(Pt.b*255,0,255))}getHexString(e=k){return(`000000`+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=q.workingColorSpace){q.workingToColorSpace(Pt.copy(this),t);let n=Pt.r,r=Pt.g,i=Pt.b,a=Math.max(n,r,i),o=Math.min(n,r,i),s,c,l=(o+a)/2;if(o===a)s=0,c=0;else{let e=a-o;switch(c=l<=.5?e/(a+o):e/(2-a-o),a){case n:s=(r-i)/e+(r<i?6:0);break;case r:s=(i-n)/e+2;break;case i:s=(n-r)/e+4;break}s/=6}return e.h=s,e.s=c,e.l=l,e}getRGB(e,t=q.workingColorSpace){return q.workingToColorSpace(Pt.copy(this),t),e.r=Pt.r,e.g=Pt.g,e.b=Pt.b,e}getStyle(e=k){q.workingToColorSpace(Pt.copy(this),e);let t=Pt.r,n=Pt.g,r=Pt.b;return e===`srgb`?`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`:`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`}offsetHSL(e,t,n){return this.getHSL(jt),this.setHSL(jt.h+e,jt.s+t,jt.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(jt),e.getHSL(Mt);let n=B(jt.h,Mt.h,t),r=B(jt.s,Mt.s,t),i=B(jt.l,Mt.l,t);return this.setHSL(n,r,i),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,r=this.b,i=e.elements;return this.r=i[0]*t+i[3]*n+i[6]*r,this.g=i[1]*t+i[4]*n+i[7]*r,this.b=i[2]*t+i[5]*n+i[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}};let Pt=new Y;Y.NAMES=At;var Ft=class extends Et{constructor(){super(),this.isScene=!0,this.type=`Scene`,this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new lt,this.environmentIntensity=1,this.environmentRotation=new lt,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}};let It=new W,Lt=new W,Rt=new W,zt=new W,Bt=new W,Vt=new W,Ht=new W,Ut=new W,Wt=new W,Gt=new W,Kt=new Ye,qt=new Ye,Jt=new Ye;var Yt=class e{constructor(e=new W,t=new W,n=new W){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),It.subVectors(e,t),r.cross(It);let i=r.lengthSq();return i>0?r.multiplyScalar(1/Math.sqrt(i)):r.set(0,0,0)}static getBarycoord(e,t,n,r,i){It.subVectors(r,t),Lt.subVectors(n,t),Rt.subVectors(e,t);let a=It.dot(It),o=It.dot(Lt),s=It.dot(Rt),c=Lt.dot(Lt),l=Lt.dot(Rt),u=a*c-o*o;if(u===0)return i.set(0,0,0),null;let d=1/u,f=(c*s-o*l)*d,p=(a*l-o*s)*d;return i.set(1-f-p,p,f)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,zt)===null?!1:zt.x>=0&&zt.y>=0&&zt.x+zt.y<=1}static getInterpolation(e,t,n,r,i,a,o,s){return this.getBarycoord(e,t,n,r,zt)===null?(s.x=0,s.y=0,`z`in s&&(s.z=0),`w`in s&&(s.w=0),null):(s.setScalar(0),s.addScaledVector(i,zt.x),s.addScaledVector(a,zt.y),s.addScaledVector(o,zt.z),s)}static getInterpolatedAttribute(e,t,n,r,i,a){return Kt.setScalar(0),qt.setScalar(0),Jt.setScalar(0),Kt.fromBufferAttribute(e,t),qt.fromBufferAttribute(e,n),Jt.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(Kt,i.x),a.addScaledVector(qt,i.y),a.addScaledVector(Jt,i.z),a}static isFrontFacing(e,t,n,r){return It.subVectors(n,t),Lt.subVectors(e,t),It.cross(Lt).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return It.subVectors(this.c,this.b),Lt.subVectors(this.a,this.b),It.cross(Lt).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return e.getNormal(this.a,this.b,this.c,t)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return e.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,r,i,a){return e.getInterpolation(t,this.a,this.b,this.c,n,r,i,a)}containsPoint(t){return e.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return e.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,r=this.b,i=this.c,a,o;Bt.subVectors(r,n),Vt.subVectors(i,n),Ut.subVectors(e,n);let s=Bt.dot(Ut),c=Vt.dot(Ut);if(s<=0&&c<=0)return t.copy(n);Wt.subVectors(e,r);let l=Bt.dot(Wt),u=Vt.dot(Wt);if(l>=0&&u<=l)return t.copy(r);let d=s*u-l*c;if(d<=0&&s>=0&&l<=0)return a=s/(s-l),t.copy(n).addScaledVector(Bt,a);Gt.subVectors(e,i);let f=Bt.dot(Gt),p=Vt.dot(Gt);if(p>=0&&f<=p)return t.copy(i);let m=f*c-s*p;if(m<=0&&c>=0&&p<=0)return o=c/(c-p),t.copy(n).addScaledVector(Vt,o);let h=l*p-f*u;if(h<=0&&u-l>=0&&f-p>=0)return Ht.subVectors(i,r),o=(u-l)/(u-l+(f-p)),t.copy(r).addScaledVector(Ht,o);let g=1/(h+m+d);return a=m*g,o=d*g,t.copy(n).addScaledVector(Bt,a).addScaledVector(Vt,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Xt=class{constructor(e=new W(1/0,1/0,1/0),t=new W(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Qt.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Qt.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=Qt.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute(`position`);if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let t=0,n=r.count;t<n;t++)e.isMesh===!0?e.getVertexPosition(t,Qt):Qt.fromBufferAttribute(r,t),Qt.applyMatrix4(e.matrixWorld),this.expandByPoint(Qt);else e.boundingBox===void 0?(n.boundingBox===null&&n.computeBoundingBox(),$t.copy(n.boundingBox)):(e.boundingBox===null&&e.computeBoundingBox(),$t.copy(e.boundingBox)),$t.applyMatrix4(e.matrixWorld),this.union($t)}let r=e.children;for(let e=0,n=r.length;e<n;e++)this.expandByObject(r[e],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Qt),Qt.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(sn),cn.subVectors(this.max,sn),en.subVectors(e.a,sn),tn.subVectors(e.b,sn),nn.subVectors(e.c,sn),rn.subVectors(tn,en),an.subVectors(nn,tn),on.subVectors(en,nn);let t=[0,-rn.z,rn.y,0,-an.z,an.y,0,-on.z,on.y,rn.z,0,-rn.x,an.z,0,-an.x,on.z,0,-on.x,-rn.y,rn.x,0,-an.y,an.x,0,-on.y,on.x,0];return!dn(t,en,tn,nn,cn)||(t=[1,0,0,0,1,0,0,0,1],!dn(t,en,tn,nn,cn))?!1:(ln.crossVectors(rn,an),t=[ln.x,ln.y,ln.z],dn(t,en,tn,nn,cn))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Qt).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Qt).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Zt[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Zt[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Zt[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Zt[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Zt[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Zt[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Zt[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Zt[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Zt),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}};let Zt=[new W,new W,new W,new W,new W,new W,new W,new W],Qt=new W,$t=new Xt,en=new W,tn=new W,nn=new W,rn=new W,an=new W,on=new W,sn=new W,cn=new W,ln=new W,un=new W;function dn(e,t,n,r,i){for(let a=0,o=e.length-3;a<=o;a+=3){un.fromArray(e,a);let o=i.x*Math.abs(un.x)+i.y*Math.abs(un.y)+i.z*Math.abs(un.z),s=t.dot(un),c=n.dot(un),l=r.dot(un);if(Math.max(-Math.max(s,c,l),Math.min(s,c,l))>o)return!1}return!0}let fn=new W,pn=new H,mn=0;var hn=class extends L{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw TypeError(`THREE.BufferAttribute: array should be a Typed Array.`);this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:mn++}),this.name=``,this.array=e,this.itemSize=t,this.count=e===void 0?0:e.length/t,this.normalized=n,this.usage=35044,this.updateRanges=[],this.gpuType=d,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,i=this.itemSize;r<i;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)pn.fromBufferAttribute(this,t),pn.applyMatrix3(e),this.setXY(t,pn.x,pn.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)fn.fromBufferAttribute(this,t),fn.applyMatrix3(e),this.setXYZ(t,fn.x,fn.y,fn.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)fn.fromBufferAttribute(this,t),fn.applyMatrix4(e),this.setXYZ(t,fn.x,fn.y,fn.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)fn.fromBufferAttribute(this,t),fn.applyNormalMatrix(e),this.setXYZ(t,fn.x,fn.y,fn.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)fn.fromBufferAttribute(this,t),fn.transformDirection(e),this.setXYZ(t,fn.x,fn.y,fn.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=V(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Me(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=V(t,this.array)),t}setX(e,t){return this.normalized&&(t=Me(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=V(t,this.array)),t}setY(e,t){return this.normalized&&(t=Me(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=V(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Me(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=V(t,this.array)),t}setW(e,t){return this.normalized&&(t=Me(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=Me(t,this.array),n=Me(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=Me(t,this.array),n=Me(n,this.array),r=Me(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e*=this.itemSize,this.normalized&&(t=Me(t,this.array),n=Me(n,this.array),r=Me(r,this.array),i=Me(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=i,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==``&&(e.name=this.name),this.usage!==35044&&(e.usage=this.usage),e}dispose(){this.dispatchEvent({type:`dispose`})}},gn=class extends hn{constructor(e,t,n){super(new Uint16Array(e),t,n)}},_n=class extends hn{constructor(e,t,n){super(new Uint32Array(e),t,n)}},vn=class extends hn{constructor(e,t,n){super(new Float32Array(e),t,n)}};let yn=new Xt,bn=new W,xn=new W;var Sn=class{constructor(e=new W,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t===void 0?yn.setFromPoints(e).getCenter(n):n.copy(t);let r=0;for(let t=0,i=e.length;t<i;t++)r=Math.max(r,n.distanceToSquared(e[t]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius*=e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;bn.subVectors(e,this.center);let t=bn.lengthSq();if(t>this.radius*this.radius){let e=Math.sqrt(t),n=(e-this.radius)*.5;this.center.addScaledVector(bn,n/e),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(xn.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(bn.copy(e.center).add(xn)),this.expandByPoint(bn.copy(e.center).sub(xn))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}};let Cn=0,wn=new et,Tn=new Et,En=new W,Dn=new Xt,On=new Xt,kn=new W;var An=class e extends L{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Cn++}),this.uuid=me(),this.name=``,this.type=`BufferGeometry`,this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(N(e)?_n:gn)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let t=new K().getNormalMatrix(e);n.applyNormalMatrix(t),n.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return wn.makeRotationFromQuaternion(e),this.applyMatrix4(wn),this}rotateX(e){return wn.makeRotationX(e),this.applyMatrix4(wn),this}rotateY(e){return wn.makeRotationY(e),this.applyMatrix4(wn),this}rotateZ(e){return wn.makeRotationZ(e),this.applyMatrix4(wn),this}translate(e,t,n){return wn.makeTranslation(e,t,n),this.applyMatrix4(wn),this}scale(e,t,n){return wn.makeScale(e,t,n),this.applyMatrix4(wn),this}lookAt(e){return Tn.lookAt(e),Tn.updateMatrix(),this.applyMatrix4(Tn.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(En).negate(),this.translate(En.x,En.y,En.z),this}setFromPoints(e){let t=this.getAttribute(`position`);if(t===void 0){let t=[];for(let n=0,r=e.length;n<r;n++){let r=e[n];t.push(r.x,r.y,r.z||0)}this.setAttribute(`position`,new vn(t,3))}else{let n=Math.min(e.length,t.count);for(let r=0;r<n;r++){let n=e[r];t.setXYZ(r,n.x,n.y,n.z||0)}e.length>t.count&&F(`BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.`),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Xt);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){I(`BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.`,this),this.boundingBox.set(new W(-1/0,-1/0,-1/0),new W(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];Dn.setFromBufferAttribute(n),this.morphTargetsRelative?(kn.addVectors(this.boundingBox.min,Dn.min),this.boundingBox.expandByPoint(kn),kn.addVectors(this.boundingBox.max,Dn.max),this.boundingBox.expandByPoint(kn)):(this.boundingBox.expandByPoint(Dn.min),this.boundingBox.expandByPoint(Dn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&I(`BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.`,this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Sn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){I(`BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.`,this),this.boundingSphere.set(new W,1/0);return}if(e){let n=this.boundingSphere.center;if(Dn.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];On.setFromBufferAttribute(n),this.morphTargetsRelative?(kn.addVectors(Dn.min,On.min),Dn.expandByPoint(kn),kn.addVectors(Dn.max,On.max),Dn.expandByPoint(kn)):(Dn.expandByPoint(On.min),Dn.expandByPoint(On.max))}Dn.getCenter(n);let r=0;for(let t=0,i=e.count;t<i;t++)kn.fromBufferAttribute(e,t),r=Math.max(r,n.distanceToSquared(kn));if(t)for(let i=0,a=t.length;i<a;i++){let a=t[i],o=this.morphTargetsRelative;for(let t=0,i=a.count;t<i;t++)kn.fromBufferAttribute(a,t),o&&(En.fromBufferAttribute(e,t),kn.add(En)),r=Math.max(r,n.distanceToSquared(kn))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&I(`BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.`,this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){I(`BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)`);return}let n=t.position,r=t.normal,i=t.uv;this.hasAttribute(`tangent`)===!1&&this.setAttribute(`tangent`,new hn(new Float32Array(4*n.count),4));let a=this.getAttribute(`tangent`),o=[],s=[];for(let e=0;e<n.count;e++)o[e]=new W,s[e]=new W;let c=new W,l=new W,u=new W,d=new H,f=new H,p=new H,m=new W,h=new W;function g(e,t,r){c.fromBufferAttribute(n,e),l.fromBufferAttribute(n,t),u.fromBufferAttribute(n,r),d.fromBufferAttribute(i,e),f.fromBufferAttribute(i,t),p.fromBufferAttribute(i,r),l.sub(c),u.sub(c),f.sub(d),p.sub(d);let a=1/(f.x*p.y-p.x*f.y);isFinite(a)&&(m.copy(l).multiplyScalar(p.y).addScaledVector(u,-f.y).multiplyScalar(a),h.copy(u).multiplyScalar(f.x).addScaledVector(l,-p.x).multiplyScalar(a),o[e].add(m),o[t].add(m),o[r].add(m),s[e].add(h),s[t].add(h),s[r].add(h))}let _=this.groups;_.length===0&&(_=[{start:0,count:e.count}]);for(let t=0,n=_.length;t<n;++t){let n=_[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)g(e.getX(t+0),e.getX(t+1),e.getX(t+2))}let v=new W,y=new W,b=new W,x=new W;function S(e){b.fromBufferAttribute(r,e),x.copy(b);let t=o[e];v.copy(t),v.sub(b.multiplyScalar(b.dot(t))).normalize(),y.crossVectors(x,t);let n=y.dot(s[e])<0?-1:1;a.setXYZW(e,v.x,v.y,v.z,n)}for(let t=0,n=_.length;t<n;++t){let n=_[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)S(e.getX(t+0)),S(e.getX(t+1)),S(e.getX(t+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute(`position`);if(t!==void 0){let n=this.getAttribute(`normal`);if(n===void 0)n=new hn(new Float32Array(t.count*3),3),this.setAttribute(`normal`,n);else for(let e=0,t=n.count;e<t;e++)n.setXYZ(e,0,0,0);let r=new W,i=new W,a=new W,o=new W,s=new W,c=new W,l=new W,u=new W;if(e)for(let d=0,f=e.count;d<f;d+=3){let f=e.getX(d+0),p=e.getX(d+1),m=e.getX(d+2);r.fromBufferAttribute(t,f),i.fromBufferAttribute(t,p),a.fromBufferAttribute(t,m),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),o.fromBufferAttribute(n,f),s.fromBufferAttribute(n,p),c.fromBufferAttribute(n,m),o.add(l),s.add(l),c.add(l),n.setXYZ(f,o.x,o.y,o.z),n.setXYZ(p,s.x,s.y,s.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let e=0,o=t.count;e<o;e+=3)r.fromBufferAttribute(t,e+0),i.fromBufferAttribute(t,e+1),a.fromBufferAttribute(t,e+2),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),n.setXYZ(e+0,l.x,l.y,l.z),n.setXYZ(e+1,l.x,l.y,l.z),n.setXYZ(e+2,l.x,l.y,l.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)kn.fromBufferAttribute(e,t),kn.normalize(),e.setXYZ(t,kn.x,kn.y,kn.z)}toNonIndexed(){function t(e,t){let n=e.array,r=e.itemSize,i=e.normalized,a=new n.constructor(t.length*r),o=0,s=0;for(let i=0,c=t.length;i<c;i++){o=e.isInterleavedBufferAttribute?t[i]*e.data.stride+e.offset:t[i]*r;for(let e=0;e<r;e++)a[s++]=n[o++]}return new hn(a,r,i)}if(this.index===null)return F(`BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.`),this;let n=new e,r=this.index.array,i=this.attributes;for(let e in i){let a=i[e],o=t(a,r);n.setAttribute(e,o)}let a=this.morphAttributes;for(let e in a){let i=[],o=a[e];for(let e=0,n=o.length;e<n;e++){let n=o[e],a=t(n,r);i.push(a)}n.morphAttributes[e]=i}n.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let e=0,t=o.length;e<t;e++){let t=o[e];n.addGroup(t.start,t.count,t.materialIndex)}return n}toJSON(){let e={metadata:{version:4.7,type:`BufferGeometry`,generator:`BufferGeometry.toJSON`}};if(e.uuid=this.uuid,e.type=this.type,this.name!==``&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let t=this.parameters;for(let n in t)t[n]!==void 0&&(e[n]=t[n]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let t in n){let r=n[t];e.data.attributes[t]=r.toJSON(e.data)}let r={},i=!1;for(let t in this.morphAttributes){let n=this.morphAttributes[t],a=[];for(let t=0,r=n.length;t<r;t++){let r=n[t];a.push(r.toJSON(e.data))}a.length>0&&(r[t]=a,i=!0)}i&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let r=e.attributes;for(let e in r){let n=r[e];this.setAttribute(e,n.clone(t))}let i=e.morphAttributes;for(let e in i){let n=[],r=i[e];for(let e=0,i=r.length;e<i;e++)n.push(r[e].clone(t));this.morphAttributes[e]=n}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let e=0,t=a.length;e<t;e++){let t=a[e];this.addGroup(t.start,t.count,t.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let s=e.boundingSphere;return s!==null&&(this.boundingSphere=s.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:`dispose`})}};let jn=0;var Mn=class extends L{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:jn++}),this.uuid=me(),this.name=``,this.type=`Material`,this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Y(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=te,this.stencilZFail=te,this.stencilZPass=te,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){F(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){F(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(n):r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:`Material`,generator:`Material.toJSON`}};n.uuid=this.uuid,n.type=this.type,this.name!==``&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==1&&(n.blending=this.blending),this.side!==0&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==204&&(n.blendSrc=this.blendSrc),this.blendDst!==205&&(n.blendDst=this.blendDst),this.blendEquation!==100&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==3&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==519&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==7680&&(n.stencilFail=this.stencilFail),this.stencilZFail!==7680&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==7680&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.allowOverride===!1&&(n.allowOverride=!1),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==`round`&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==`round`&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}if(t){let t=r(e.textures),i=r(e.images);t.length>0&&(n.textures=t),i.length>0&&(n.images=i)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let e=t.length;n=Array(e);for(let r=0;r!==e;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:`dispose`})}set needsUpdate(e){e===!0&&this.version++}};let Nn=new W,Pn=new W,Fn=new W,In=new W,Ln=new W,Rn=new W,zn=new W;var Bn=class{constructor(e=new W,t=new W(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Nn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Nn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Nn.copy(this.origin).addScaledVector(this.direction,t),Nn.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){Pn.copy(e).add(t).multiplyScalar(.5),Fn.copy(t).sub(e).normalize(),In.copy(this.origin).sub(Pn);let i=e.distanceTo(t)*.5,a=-this.direction.dot(Fn),o=In.dot(this.direction),s=-In.dot(Fn),c=In.lengthSq(),l=Math.abs(1-a*a),u,d,f,p;if(l>0)if(u=a*s-o,d=a*o-s,p=i*l,u>=0)if(d>=-p)if(d<=p){let e=1/l;u*=e,d*=e,f=u*(u+a*d+2*o)+d*(a*u+d+2*s)+c}else d=i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c;else d=-i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c;else d<=-p?(u=Math.max(0,-(-a*i+o)),d=u>0?-i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c):d<=p?(u=0,d=Math.min(Math.max(-i,-s),i),f=d*(d+2*s)+c):(u=Math.max(0,-(a*i+o)),d=u>0?i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c);else d=a>0?-i:i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(Pn).addScaledVector(Fn,d),f}intersectSphere(e,t){Nn.subVectors(e.center,this.origin);let n=Nn.dot(this.direction),r=Nn.dot(Nn)-n*n,i=e.radius*e.radius;if(r>i)return null;let a=Math.sqrt(i-r),o=n-a,s=n+a;return s<0?null:o<0?this.at(s,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,i,a,o,s,c=1/this.direction.x,l=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,r=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,r=(e.min.x-d.x)*c),l>=0?(i=(e.min.y-d.y)*l,a=(e.max.y-d.y)*l):(i=(e.max.y-d.y)*l,a=(e.min.y-d.y)*l),n>a||i>r||((i>n||isNaN(n))&&(n=i),(a<r||isNaN(r))&&(r=a),u>=0?(o=(e.min.z-d.z)*u,s=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,s=(e.min.z-d.z)*u),n>s||o>r)||((o>n||n!==n)&&(n=o),(s<r||r!==r)&&(r=s),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,Nn)!==null}intersectTriangle(e,t,n,r,i){Ln.subVectors(t,e),Rn.subVectors(n,e),zn.crossVectors(Ln,Rn);let a=this.direction.dot(zn),o;if(a>0){if(r)return null;o=1}else if(a<0)o=-1,a=-a;else return null;In.subVectors(this.origin,e);let s=o*this.direction.dot(Rn.crossVectors(In,Rn));if(s<0)return null;let c=o*this.direction.dot(Ln.cross(In));if(c<0||s+c>a)return null;let l=-o*In.dot(zn);return l<0?null:this.at(l/a,i)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Vn=class extends Mn{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type=`MeshBasicMaterial`,this.color=new Y(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new lt,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};let Hn=new et,Un=new Bn,Wn=new Sn,Gn=new W,Kn=new W,qn=new W,Jn=new W,Yn=new W,Xn=new W,Zn=new W,Qn=new W;var $n=class extends Et{constructor(e=new An,t=new Vn){super(),this.isMesh=!0,this.type=`Mesh`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}getVertexPosition(e,t){let n=this.geometry,r=n.attributes.position,i=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(i&&o){Xn.set(0,0,0);for(let n=0,r=i.length;n<r;n++){let r=o[n],s=i[n];r!==0&&(Yn.fromBufferAttribute(s,e),a?Xn.addScaledVector(Yn,r):Xn.addScaledVector(Yn.sub(t),r))}t.add(Xn)}return t}raycast(e,t){let n=this.geometry,r=this.material,i=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Wn.copy(n.boundingSphere),Wn.applyMatrix4(i),Un.copy(e.ray).recast(e.near),!(Wn.containsPoint(Un.origin)===!1&&(Un.intersectSphere(Wn,Gn)===null||Un.origin.distanceToSquared(Gn)>(e.far-e.near)**2))&&(Hn.copy(i).invert(),Un.copy(e.ray).applyMatrix4(Hn),!(n.boundingBox!==null&&Un.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,Un)))}_computeIntersections(e,t,n){let r,i=this.geometry,a=this.material,o=i.index,s=i.attributes.position,c=i.attributes.uv,l=i.attributes.uv1,u=i.attributes.normal,d=i.groups,f=i.drawRange;if(o!==null)if(Array.isArray(a))for(let i=0,s=d.length;i<s;i++){let s=d[i],p=a[s.materialIndex],m=Math.max(s.start,f.start),h=Math.min(o.count,Math.min(s.start+s.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=o.getX(i),d=o.getX(i+1),f=o.getX(i+2);r=tr(this,p,e,n,c,l,u,a,d,f),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=s.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),s=Math.min(o.count,f.start+f.count);for(let d=i,f=s;d<f;d+=3){let i=o.getX(d),s=o.getX(d+1),f=o.getX(d+2);r=tr(this,a,e,n,c,l,u,i,s,f),r&&(r.faceIndex=Math.floor(d/3),t.push(r))}}else if(s!==void 0)if(Array.isArray(a))for(let i=0,o=d.length;i<o;i++){let o=d[i],p=a[o.materialIndex],m=Math.max(o.start,f.start),h=Math.min(s.count,Math.min(o.start+o.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=i,s=i+1,d=i+2;r=tr(this,p,e,n,c,l,u,a,s,d),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=o.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),o=Math.min(s.count,f.start+f.count);for(let s=i,d=o;s<d;s+=3){let i=s,o=s+1,d=s+2;r=tr(this,a,e,n,c,l,u,i,o,d),r&&(r.faceIndex=Math.floor(s/3),t.push(r))}}}};function er(e,t,n,r,i,a,o,s){let c;if(c=t.side===1?r.intersectTriangle(o,a,i,!0,s):r.intersectTriangle(i,a,o,t.side===0,s),c===null)return null;Qn.copy(s),Qn.applyMatrix4(e.matrixWorld);let l=n.ray.origin.distanceTo(Qn);return l<n.near||l>n.far?null:{distance:l,point:Qn.clone(),object:e}}function tr(e,t,n,r,i,a,o,s,c,l){e.getVertexPosition(s,Kn),e.getVertexPosition(c,qn),e.getVertexPosition(l,Jn);let u=er(e,t,n,r,Kn,qn,Jn,Zn);if(u){let e=new W;Yt.getBarycoord(Zn,Kn,qn,Jn,e),i&&(u.uv=Yt.getInterpolatedAttribute(i,s,c,l,e,new H)),a&&(u.uv1=Yt.getInterpolatedAttribute(a,s,c,l,e,new H)),o&&(u.normal=Yt.getInterpolatedAttribute(o,s,c,l,e,new W),u.normal.dot(r.direction)>0&&u.normal.multiplyScalar(-1));let t={a:s,b:c,c:l,normal:new W,materialIndex:0};Yt.getNormal(Kn,qn,Jn,t.normal),u.face=t,u.barycoord=e}return u}var nr=class extends Je{constructor(e=null,t=1,n=1,r,i,o,s,c,l=a,u=a,d,f){super(null,o,s,c,l,u,r,i,d,f),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};let rr=new W,ir=new W,ar=new K;var or=class{constructor(e=new W(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let r=rr.subVectors(n,t).cross(ir.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let r=e.delta(rr),i=this.normal.dot(r);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/i;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||ar.getNormalMatrix(e),r=this.coplanarPoint(rr).applyMatrix4(e),i=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(i),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}};let sr=new Sn,cr=new H(.5,.5),lr=new W;var ur=class{constructor(e=new or,t=new or,n=new or,r=new or,i=new or,a=new or){this.planes=[e,t,n,r,i,a]}set(e,t,n,r,i,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(i),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=ne,n=!1){let r=this.planes,i=e.elements,a=i[0],o=i[1],s=i[2],c=i[3],l=i[4],u=i[5],d=i[6],f=i[7],p=i[8],m=i[9],h=i[10],g=i[11],_=i[12],v=i[13],y=i[14],b=i[15];if(r[0].setComponents(c-a,f-l,g-p,b-_).normalize(),r[1].setComponents(c+a,f+l,g+p,b+_).normalize(),r[2].setComponents(c+o,f+u,g+m,b+v).normalize(),r[3].setComponents(c-o,f-u,g-m,b-v).normalize(),n)r[4].setComponents(s,d,h,y).normalize(),r[5].setComponents(c-s,f-d,g-h,b-y).normalize();else if(r[4].setComponents(c-s,f-d,g-h,b-y).normalize(),t===2e3)r[5].setComponents(c+s,f+d,g+h,b+y).normalize();else if(t===2001)r[5].setComponents(s,d,h,y).normalize();else throw Error(`THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: `+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),sr.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),sr.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(sr)}intersectsSprite(e){return sr.center.set(0,0,0),sr.radius=.7071067811865476+cr.distanceTo(e.center),sr.applyMatrix4(e.matrixWorld),this.intersectsSphere(sr)}intersectsSphere(e){let t=this.planes,n=e.center,r=-e.radius;for(let e=0;e<6;e++)if(t[e].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let r=t[n];if(lr.x=r.normal.x>0?e.max.x:e.min.x,lr.y=r.normal.y>0?e.max.y:e.min.y,lr.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(lr)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},dr=class extends Je{constructor(e=[],t=301,n,r,i,a,o,s,c,l){super(e,t,n,r,i,a,o,s,c,l),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},fr=class extends Je{constructor(e,t,n,r,i,a,o,s,c){super(e,t,n,r,i,a,o,s,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},pr=class extends Je{constructor(e,t,n=u,r,i,o,s=a,c=a,l,d=_,f=1){if(d!==1026&&d!==1027)throw Error(`DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat`);super({width:e,height:t,depth:f},r,i,o,s,c,d,n,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new We(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},mr=class extends pr{constructor(e,t=u,n=301,r,i,o=a,s=a,c,l=_){let d={width:e,height:e,depth:1},f=[d,d,d,d,d,d];super(e,e,t,n,r,i,o,s,c,l),this.image=f,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},hr=class extends Je{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},gr=class e extends An{constructor(e=1,t=1,n=1,r=1,i=1,a=1){super(),this.type=`BoxGeometry`,this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:i,depthSegments:a};let o=this;r=Math.floor(r),i=Math.floor(i),a=Math.floor(a);let s=[],c=[],l=[],u=[],d=0,f=0;p(`z`,`y`,`x`,-1,-1,n,t,e,a,i,0),p(`z`,`y`,`x`,1,-1,n,t,-e,a,i,1),p(`x`,`z`,`y`,1,1,e,n,t,r,a,2),p(`x`,`z`,`y`,1,-1,e,n,-t,r,a,3),p(`x`,`y`,`z`,1,-1,e,t,n,r,i,4),p(`x`,`y`,`z`,-1,-1,e,t,-n,r,i,5),this.setIndex(s),this.setAttribute(`position`,new vn(c,3)),this.setAttribute(`normal`,new vn(l,3)),this.setAttribute(`uv`,new vn(u,2));function p(e,t,n,r,i,a,p,m,h,g,_){let v=a/h,y=p/g,b=a/2,x=p/2,S=m/2,C=h+1,w=g+1,T=0,E=0,D=new W;for(let a=0;a<w;a++){let o=a*y-x;for(let s=0;s<C;s++)D[e]=(s*v-b)*r,D[t]=o*i,D[n]=S,c.push(D.x,D.y,D.z),D[e]=0,D[t]=0,D[n]=m>0?1:-1,l.push(D.x,D.y,D.z),u.push(s/h),u.push(1-a/g),T+=1}for(let e=0;e<g;e++)for(let t=0;t<h;t++){let n=d+t+C*e,r=d+t+C*(e+1),i=d+(t+1)+C*(e+1),a=d+(t+1)+C*e;s.push(n,r,a),s.push(r,i,a),E+=6}o.addGroup(f,E,_),f+=E,d+=T}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}},_r=class e extends An{constructor(e=[new H(0,-.5),new H(.5,0),new H(0,.5)],t=12,n=0,r=Math.PI*2){super(),this.type=`LatheGeometry`,this.parameters={points:e,segments:t,phiStart:n,phiLength:r},t=Math.floor(t),r=z(r,0,Math.PI*2);let i=[],a=[],o=[],s=[],c=[],l=1/t,u=new W,d=new H,f=new W,p=new W,m=new W,h=0,g=0;for(let t=0;t<=e.length-1;t++)switch(t){case 0:h=e[t+1].x-e[t].x,g=e[t+1].y-e[t].y,f.x=g*1,f.y=-h,f.z=g*0,m.copy(f),f.normalize(),s.push(f.x,f.y,f.z);break;case e.length-1:s.push(m.x,m.y,m.z);break;default:h=e[t+1].x-e[t].x,g=e[t+1].y-e[t].y,f.x=g*1,f.y=-h,f.z=g*0,p.copy(f),f.x+=m.x,f.y+=m.y,f.z+=m.z,f.normalize(),s.push(f.x,f.y,f.z),m.copy(p)}for(let i=0;i<=t;i++){let f=n+i*l*r,p=Math.sin(f),m=Math.cos(f);for(let n=0;n<=e.length-1;n++){u.x=e[n].x*p,u.y=e[n].y,u.z=e[n].x*m,a.push(u.x,u.y,u.z),d.x=i/t,d.y=n/(e.length-1),o.push(d.x,d.y);let r=s[3*n+0]*p,l=s[3*n+1],f=s[3*n+0]*m;c.push(r,l,f)}}for(let n=0;n<t;n++)for(let t=0;t<e.length-1;t++){let r=t+n*e.length,a=r,o=r+e.length,s=r+e.length+1,c=r+1;i.push(a,o,c),i.push(s,c,o)}this.setIndex(i),this.setAttribute(`position`,new vn(a,3)),this.setAttribute(`uv`,new vn(o,2)),this.setAttribute(`normal`,new vn(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.points,t.segments,t.phiStart,t.phiLength)}},vr=class e extends An{constructor(e=1,t=1,n=1,r=1){super(),this.type=`PlaneGeometry`,this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};let i=e/2,a=t/2,o=Math.floor(n),s=Math.floor(r),c=o+1,l=s+1,u=e/o,d=t/s,f=[],p=[],m=[],h=[];for(let e=0;e<l;e++){let t=e*d-a;for(let n=0;n<c;n++){let r=n*u-i;p.push(r,-t,0),m.push(0,0,1),h.push(n/o),h.push(1-e/s)}}for(let e=0;e<s;e++)for(let t=0;t<o;t++){let n=t+c*e,r=t+c*(e+1),i=t+1+c*(e+1),a=t+1+c*e;f.push(n,r,a),f.push(r,i,a)}this.setIndex(f),this.setAttribute(`position`,new vn(p,3)),this.setAttribute(`normal`,new vn(m,3)),this.setAttribute(`uv`,new vn(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.widthSegments,t.heightSegments)}},yr=class e extends An{constructor(e=1,t=32,n=16,r=0,i=Math.PI*2,a=0,o=Math.PI){super(),this.type=`SphereGeometry`,this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:r,phiLength:i,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let s=Math.min(a+o,Math.PI),c=0,l=[],u=new W,d=new W,f=[],p=[],m=[],h=[];for(let f=0;f<=n;f++){let g=[],_=f/n,v=0;f===0&&a===0?v=.5/t:f===n&&s===Math.PI&&(v=-.5/t);for(let n=0;n<=t;n++){let s=n/t;u.x=-e*Math.cos(r+s*i)*Math.sin(a+_*o),u.y=e*Math.cos(a+_*o),u.z=e*Math.sin(r+s*i)*Math.sin(a+_*o),p.push(u.x,u.y,u.z),d.copy(u).normalize(),m.push(d.x,d.y,d.z),h.push(s+v,1-_),g.push(c++)}l.push(g)}for(let e=0;e<n;e++)for(let r=0;r<t;r++){let t=l[e][r+1],i=l[e][r],o=l[e+1][r],c=l[e+1][r+1];(e!==0||a>0)&&f.push(t,i,c),(e!==n-1||s<Math.PI)&&f.push(i,o,c)}this.setIndex(f),this.setAttribute(`position`,new vn(p,3)),this.setAttribute(`normal`,new vn(m,3)),this.setAttribute(`uv`,new vn(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}};function br(e){let t={};for(let n in e){t[n]={};for(let r in e[n]){let i=e[n][r];if(Sr(i))i.isRenderTargetTexture?(F(`UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().`),t[n][r]=null):t[n][r]=i.clone();else if(Array.isArray(i))if(Sr(i[0])){let e=[];for(let t=0,n=i.length;t<n;t++)e[t]=i[t].clone();t[n][r]=e}else t[n][r]=i.slice();else t[n][r]=i}}return t}function xr(e){let t={};for(let n=0;n<e.length;n++){let r=br(e[n]);for(let e in r)t[e]=r[e]}return t}function Sr(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function Cr(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function wr(e){let t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:q.workingColorSpace}let Tr={clone:br,merge:xr};var Er=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Dr=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Or=class extends Mn{constructor(e){super(),this.isShaderMaterial=!0,this.type=`ShaderMaterial`,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Er,this.fragmentShader=Dr,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=br(e.uniforms),this.uniformsGroups=Cr(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let n in this.uniforms){let r=this.uniforms[n].value;r&&r.isTexture?t.uniforms[n]={type:`t`,value:r.toJSON(e).uuid}:r&&r.isColor?t.uniforms[n]={type:`c`,value:r.getHex()}:r&&r.isVector2?t.uniforms[n]={type:`v2`,value:r.toArray()}:r&&r.isVector3?t.uniforms[n]={type:`v3`,value:r.toArray()}:r&&r.isVector4?t.uniforms[n]={type:`v4`,value:r.toArray()}:r&&r.isMatrix3?t.uniforms[n]={type:`m3`,value:r.toArray()}:r&&r.isMatrix4?t.uniforms[n]={type:`m4`,value:r.toArray()}:t.uniforms[n]={value:r}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let e in this.extensions)this.extensions[e]===!0&&(n[e]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}},kr=class extends Or{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type=`RawShaderMaterial`}},Ar=class extends Mn{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type=`MeshDepthMaterial`,this.depthPacking=3200,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},jr=class extends Mn{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type=`MeshDistanceMaterial`,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function Mr(e,t){return!e||e.constructor===t?e:typeof t.BYTES_PER_ELEMENT==`number`?new t(e):Array.prototype.slice.call(e)}var Nr=class{constructor(e,t,n,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r===void 0?new t.constructor(n):r,this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,r=t[n],i=t[n-1];validate_interval:{seek:{let a;linear_scan:{forward_scan:if(!(e<r)){for(let a=n+2;;){if(r===void 0){if(e<i)break forward_scan;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(i=r,r=t[++n],e<r)break seek}a=t.length;break linear_scan}if(!(e>=i)){let o=t[1];e<o&&(n=2,i=o);for(let a=n-2;;){if(i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===a)break;if(r=i,i=t[--n-1],e>=i)break seek}a=n,n=0;break linear_scan}break validate_interval}for(;n<a;){let r=n+a>>>1;e<t[r]?a=r:n=r+1}if(r=t[n],i=t[n-1],i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,i,r)}return this.interpolate_(n,i,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,r=this.valueSize,i=e*r;for(let e=0;e!==r;++e)t[e]=n[i+e];return t}interpolate_(){throw Error(`call to abstract method`)}intervalChanged_(){}},Pr=class extends Nr{constructor(e,t,n,r){super(e,t,n,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:D,endingEnd:D}}intervalChanged_(e,t,n){let r=this.parameterPositions,i=e-2,a=e+1,o=r[i],s=r[a];if(o===void 0)switch(this.getSettings_().endingStart){case O:i=e,o=2*t-n;break;case ee:i=r.length-2,o=t+r[i]-r[i+1];break;default:i=e,o=n}if(s===void 0)switch(this.getSettings_().endingEnd){case O:a=e,s=2*n-t;break;case ee:a=1,s=n+r[1]-r[0];break;default:a=e-1,s=t}let c=(n-t)*.5,l=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(s-n),this._offsetPrev=i*l,this._offsetNext=a*l}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(n-t)/(r-t),m=p*p,h=m*p,g=-d*h+2*d*m-d*p,_=(1+d)*h+(-1.5-2*d)*m+(-.5+d)*p+1,v=(-1-f)*h+(1.5+f)*m+.5*p,y=f*h-f*m;for(let e=0;e!==o;++e)i[e]=g*a[l+e]+_*a[c+e]+v*a[s+e]+y*a[u+e];return i}},Fr=class extends Nr{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=(n-t)/(r-t),u=1-l;for(let e=0;e!==o;++e)i[e]=a[c+e]*u+a[s+e]*l;return i}},Ir=class extends Nr{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e){return this.copySampleValue_(e-1)}},Lr=class extends Nr{interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this.settings||this.DefaultSettings_,u=l.inTangents,d=l.outTangents;if(!u||!d){let e=(n-t)/(r-t),l=1-e;for(let t=0;t!==o;++t)i[t]=a[c+t]*l+a[s+t]*e;return i}let f=o*2,p=e-1;for(let l=0;l!==o;++l){let o=a[c+l],m=a[s+l],h=p*f+l*2,g=d[h],_=d[h+1],v=e*f+l*2,y=u[v],b=u[v+1],x=(n-t)/(r-t),S,C,w,T,E;for(let e=0;e<8;e++){S=x*x,C=S*x,w=1-x,T=w*w,E=T*w;let e=E*t+3*T*x*g+3*w*S*y+C*r-n;if(Math.abs(e)<1e-10)break;let i=3*T*(g-t)+6*w*x*(y-g)+3*S*(r-y);if(Math.abs(i)<1e-10)break;x-=e/i,x=Math.max(0,Math.min(1,x))}i[l]=E*o+3*T*x*_+3*w*S*b+C*m}return i}},Rr=class{constructor(e,t,n,r){if(e===void 0)throw Error(`THREE.KeyframeTrack: track name is undefined`);if(t===void 0||t.length===0)throw Error(`THREE.KeyframeTrack: no keyframes in track named `+e);this.name=e,this.times=Mr(t,this.TimeBufferType),this.values=Mr(n,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Mr(e.times,Array),values:Mr(e.values,Array)};let t=e.getInterpolation();t!==e.DefaultInterpolation&&(n.interpolation=t)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new Ir(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Fr(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Pr(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new Lr(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.settings=this.settings),t}setInterpolation(e){let t;switch(e){case C:t=this.InterpolantFactoryMethodDiscrete;break;case w:t=this.InterpolantFactoryMethodLinear;break;case T:t=this.InterpolantFactoryMethodSmooth;break;case E:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let t=`unsupported interpolation for `+this.ValueTypeName+` keyframe track named `+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw Error(t);return F(`KeyframeTrack:`,t),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return C;case this.InterpolantFactoryMethodLinear:return w;case this.InterpolantFactoryMethodSmooth:return T;case this.InterpolantFactoryMethodBezier:return E}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]*=e}return this}trim(e,t){let n=this.times,r=n.length,i=0,a=r-1;for(;i!==r&&n[i]<e;)++i;for(;a!==-1&&n[a]>t;)--a;if(++a,i!==0||a!==r){i>=a&&(a=Math.max(a,1),i=a-1);let e=this.getValueSize();this.times=n.slice(i,a),this.values=this.values.slice(i*e,a*e)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(I(`KeyframeTrack: Invalid value size in track.`,this),e=!1);let n=this.times,r=this.values,i=n.length;i===0&&(I(`KeyframeTrack: Track is empty.`,this),e=!1);let a=null;for(let t=0;t!==i;t++){let r=n[t];if(typeof r==`number`&&isNaN(r)){I(`KeyframeTrack: Time is not a valid number.`,this,t,r),e=!1;break}if(a!==null&&a>r){I(`KeyframeTrack: Out of order keys.`,this,t,r,a),e=!1;break}a=r}if(r!==void 0&&re(r))for(let t=0,n=r.length;t!==n;++t){let n=r[t];if(isNaN(n)){I(`KeyframeTrack: Value is not a valid number.`,this,t,n),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),r=this.getInterpolation()===T,i=e.length-1,a=1;for(let o=1;o<i;++o){let i=!1,s=e[o];if(s!==e[o+1]&&(o!==1||s!==e[0]))if(r)i=!0;else{let e=o*n,r=e-n,a=e+n;for(let o=0;o!==n;++o){let n=t[e+o];if(n!==t[r+o]||n!==t[a+o]){i=!0;break}}}if(i){if(o!==a){e[a]=e[o];let r=o*n,i=a*n;for(let e=0;e!==n;++e)t[i+e]=t[r+e]}++a}}if(i>0){e[a]=e[i];for(let e=i*n,r=a*n,o=0;o!==n;++o)t[r+o]=t[e+o];++a}return a===e.length?(this.times=e,this.values=t):(this.times=e.slice(0,a),this.values=t.slice(0,a*n)),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,r=new n(this.name,e,t);return r.createInterpolant=this.createInterpolant,r}};Rr.prototype.ValueTypeName=``,Rr.prototype.TimeBufferType=Float32Array,Rr.prototype.ValueBufferType=Float32Array,Rr.prototype.DefaultInterpolation=w;var zr=class extends Rr{constructor(e,t,n){super(e,t,n)}};zr.prototype.ValueTypeName=`bool`,zr.prototype.ValueBufferType=Array,zr.prototype.DefaultInterpolation=C,zr.prototype.InterpolantFactoryMethodLinear=void 0,zr.prototype.InterpolantFactoryMethodSmooth=void 0;var Br=class extends Rr{constructor(e,t,n,r){super(e,t,n,r)}};Br.prototype.ValueTypeName=`color`;var Vr=class extends Rr{constructor(e,t,n,r){super(e,t,n,r)}};Vr.prototype.ValueTypeName=`number`;var Hr=class extends Nr{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=(n-t)/(r-t),c=e*o;for(let e=c+o;c!==e;c+=4)U.slerpFlat(i,0,a,c-o,a,c,s);return i}},Ur=class extends Rr{constructor(e,t,n,r){super(e,t,n,r)}InterpolantFactoryMethodLinear(e){return new Hr(this.times,this.values,this.getValueSize(),e)}};Ur.prototype.ValueTypeName=`quaternion`,Ur.prototype.InterpolantFactoryMethodSmooth=void 0;var Wr=class extends Rr{constructor(e,t,n){super(e,t,n)}};Wr.prototype.ValueTypeName=`string`,Wr.prototype.ValueBufferType=Array,Wr.prototype.DefaultInterpolation=C,Wr.prototype.InterpolantFactoryMethodLinear=void 0,Wr.prototype.InterpolantFactoryMethodSmooth=void 0;var Gr=class extends Rr{constructor(e,t,n,r){super(e,t,n,r)}};Gr.prototype.ValueTypeName=`vector`;let Kr={enabled:!1,files:{},add:function(e,t){this.enabled!==!1&&(qr(e)||(this.files[e]=t))},get:function(e){if(this.enabled!==!1&&!qr(e))return this.files[e]},remove:function(e){delete this.files[e]},clear:function(){this.files={}}};function qr(e){try{let t=e.slice(e.indexOf(`:`)+1);return new URL(t).protocol===`blob:`}catch{return!1}}let Jr=new class{constructor(e,t,n){let r=this,i=!1,a=0,o=0,s,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this._abortController=null,this.itemStart=function(e){o++,i===!1&&r.onStart!==void 0&&r.onStart(e,a,o),i=!0},this.itemEnd=function(e){a++,r.onProgress!==void 0&&r.onProgress(e,a,o),a===o&&(i=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(e){r.onError!==void 0&&r.onError(e)},this.resolveURL=function(e){return s?s(e):e},this.setURLModifier=function(e){return s=e,this},this.addHandler=function(e,t){return c.push(e,t),this},this.removeHandler=function(e){let t=c.indexOf(e);return t!==-1&&c.splice(t,2),this},this.getHandler=function(e){for(let t=0,n=c.length;t<n;t+=2){let n=c[t],r=c[t+1];if(n.global&&(n.lastIndex=0),n.test(e))return r}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||=new AbortController,this._abortController}};var Yr=class{constructor(e){this.manager=e===void 0?Jr:e,this.crossOrigin=`anonymous`,this.withCredentials=!1,this.path=``,this.resourcePath=``,this.requestHeader={},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}load(){}loadAsync(e,t){let n=this;return new Promise(function(r,i){n.load(e,r,t,i)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};Yr.DEFAULT_MATERIAL_NAME=`__DEFAULT`;let Xr=new WeakMap;var Zr=class extends Yr{constructor(e){super(e)}load(e,t,n,r){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let i=this,a=Kr.get(`image:${e}`);if(a!==void 0){if(a.complete===!0)i.manager.itemStart(e),setTimeout(function(){t&&t(a),i.manager.itemEnd(e)},0);else{let e=Xr.get(a);e===void 0&&(e=[],Xr.set(a,e)),e.push({onLoad:t,onError:r})}return a}let o=P(`img`);function s(){l(),t&&t(this);let n=Xr.get(this)||[];for(let e=0;e<n.length;e++){let t=n[e];t.onLoad&&t.onLoad(this)}Xr.delete(this),i.manager.itemEnd(e)}function c(t){l(),r&&r(t),Kr.remove(`image:${e}`);let n=Xr.get(this)||[];for(let e=0;e<n.length;e++){let r=n[e];r.onError&&r.onError(t)}Xr.delete(this),i.manager.itemError(e),i.manager.itemEnd(e)}function l(){o.removeEventListener(`load`,s,!1),o.removeEventListener(`error`,c,!1)}return o.addEventListener(`load`,s,!1),o.addEventListener(`error`,c,!1),e.slice(0,5)!==`data:`&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),Kr.add(`image:${e}`,o),i.manager.itemStart(e),o.src=e,o}};let Qr=new W,$r=new U,ei=new W;var ti=class extends Et{constructor(){super(),this.isCamera=!0,this.type=`Camera`,this.matrixWorldInverse=new et,this.projectionMatrix=new et,this.projectionMatrixInverse=new et,this.coordinateSystem=ne,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Qr,$r,ei),ei.x===1&&ei.y===1&&ei.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Qr,$r,ei.set(1,1,1)).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorld.decompose(Qr,$r,ei),ei.x===1&&ei.y===1&&ei.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Qr,$r,ei.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}};let ni=new W,ri=new H,ii=new H;var ai=class extends ti{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type=`PerspectiveCamera`,this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=pe*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(fe*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return pe*2*Math.atan(Math.tan(fe*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){ni.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(ni.x,ni.y).multiplyScalar(-e/ni.z),ni.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(ni.x,ni.y).multiplyScalar(-e/ni.z)}getViewSize(e,t){return this.getViewBounds(e,ri,ii),t.subVectors(ii,ri)}setViewOffset(e,t,n,r,i,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(fe*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,i=-.5*r,a=this.view;if(this.view!==null&&this.view.enabled){let e=a.fullWidth,o=a.fullHeight;i+=a.offsetX*r/e,t-=a.offsetY*n/o,r*=a.width/e,n*=a.height/o}let o=this.filmOffset;o!==0&&(i+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(i,i+r,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},oi=class extends ti{constructor(e=-1,t=1,n=1,r=-1,i=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type=`OrthographicCamera`,this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=i,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,i,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2,i=n-e,a=n+e,o=r+t,s=r-t;if(this.view!==null&&this.view.enabled){let e=(this.right-this.left)/this.view.fullWidth/this.zoom,t=(this.top-this.bottom)/this.view.fullHeight/this.zoom;i+=e*this.view.offsetX,a=i+e*this.view.width,o-=t*this.view.offsetY,s=o-t*this.view.height}this.projectionMatrix.makeOrthographic(i,a,o,s,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},si=class extends Et{constructor(e,t,n){super(),this.type=`CubeCamera`,this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new ai(-90,1,e,t);r.layers=this.layers,this.add(r);let i=new ai(-90,1,e,t);i.layers=this.layers,this.add(i);let a=new ai(-90,1,e,t);a.layers=this.layers,this.add(a);let o=new ai(-90,1,e,t);o.layers=this.layers,this.add(o);let s=new ai(-90,1,e,t);s.layers=this.layers,this.add(s);let c=new ai(-90,1,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,r,i,a,o,s]=t;for(let e of t)this.remove(e);if(e===2e3)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),i.up.set(0,0,-1),i.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),s.up.set(0,1,0),s.lookAt(0,0,-1);else if(e===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),i.up.set(0,0,1),i.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),s.up.set(0,-1,0),s.lookAt(0,0,-1);else throw Error(`THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: `+e);for(let e of t)this.add(e),e.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[i,a,o,s,c,l]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;let m=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let h=!1;h=e.isWebGLRenderer===!0?e.state.buffers.depth.getReversed():e.reversedDepthBuffer,e.setRenderTarget(n,0,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,i),e.setRenderTarget(n,1,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(n,4,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.generateMipmaps=m,e.setRenderTarget(n,5,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(u,d,f),e.xr.enabled=p,n.texture.needsPMREMUpdate=!0}},ci=class extends ai{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};let li=RegExp(`[\\[\\]\\.:\\/]`,`g`),ui=RegExp(`^((?:[^\\[\\]\\.:\\/]+[\\/:])*)([^\\[\\]:\\/]+)?(?:\\.([^\\[\\]\\.:\\/]+)(?:\\[(.+)\\])?)?\\.([^\\[\\]\\.:\\/]+)(?:\\[(.+)\\])?$`),di=[`material`,`materials`,`bones`,`map`];var fi=class{constructor(e,t,n){let r=n||pi.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,r=this._bindings[n];r!==void 0&&r.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let r=this._targetGroup.nCachedObjects_,i=n.length;r!==i;++r)n[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},pi=class e{constructor(t,n,r){this.path=n,this.parsedPath=r||e.parseTrackName(n),this.node=e.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,n,r){return t&&t.isAnimationObjectGroup?new e.Composite(t,n,r):new e(t,n,r)}static sanitizeNodeName(e){return e.replace(/\s/g,`_`).replace(li,``)}static parseTrackName(e){let t=ui.exec(e);if(t===null)throw Error(`PropertyBinding: Cannot parse trackName: `+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=n.nodeName&&n.nodeName.lastIndexOf(`.`);if(r!==void 0&&r!==-1){let e=n.nodeName.substring(r+1);di.indexOf(e)!==-1&&(n.nodeName=n.nodeName.substring(0,r),n.objectName=e)}if(n.propertyName===null||n.propertyName.length===0)throw Error(`PropertyBinding: can not parse propertyName from trackName: `+e);return n}static findNode(e,t){if(t===void 0||t===``||t===`.`||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(e){for(let r=0;r<e.length;r++){let i=e[r];if(i.name===t||i.uuid===t)return i;let a=n(i.children);if(a)return a}return null},r=n(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)e[t++]=n[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let t=this.node,n=this.parsedPath,r=n.objectName,i=n.propertyName,a=n.propertyIndex;if(t||(t=e.findNode(this.rootNode,n.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){F(`PropertyBinding: No target node found for track: `+this.path+`.`);return}if(r){let e=n.objectIndex;switch(r){case`materials`:if(!t.material){I(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.materials){I(`PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.`,this);return}t=t.material.materials;break;case`bones`:if(!t.skeleton){I(`PropertyBinding: Can not bind to bones as node does not have a skeleton.`,this);return}t=t.skeleton.bones;for(let n=0;n<t.length;n++)if(t[n].name===e){e=n;break}break;case`map`:if(`map`in t){t=t.map;break}if(!t.material){I(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.map){I(`PropertyBinding: Can not bind to material.map as node.material does not have a map.`,this);return}t=t.material.map;break;default:if(t[r]===void 0){I(`PropertyBinding: Can not bind to objectName of node undefined.`,this);return}t=t[r]}if(e!==void 0){if(t[e]===void 0){I(`PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.`,this,t);return}t=t[e]}}let o=t[i];if(o===void 0){let e=n.nodeName;I(`PropertyBinding: Trying to update property for track: `+e+`.`+i+` but it wasn't found.`,t);return}let s=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?s=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(s=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(a!==void 0){if(i===`morphTargetInfluences`){if(!t.geometry){I(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.`,this);return}if(!t.geometry.morphAttributes){I(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.`,this);return}t.morphTargetDictionary[a]!==void 0&&(a=t.morphTargetDictionary[a])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=a}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][s]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};pi.Composite=fi,pi.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},pi.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},pi.prototype.GetterByBindingType=[pi.prototype._getValue_direct,pi.prototype._getValue_array,pi.prototype._getValue_arrayElement,pi.prototype._getValue_toArray],pi.prototype.SetterByBindingTypeAndVersioning=[[pi.prototype._setValue_direct,pi.prototype._setValue_direct_setNeedsUpdate,pi.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[pi.prototype._setValue_array,pi.prototype._setValue_array_setNeedsUpdate,pi.prototype._setValue_array_setMatrixWorldNeedsUpdate],[pi.prototype._setValue_arrayElement,pi.prototype._setValue_arrayElement_setNeedsUpdate,pi.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[pi.prototype._setValue_fromArray,pi.prototype._setValue_fromArray_setNeedsUpdate,pi.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var mi=class{constructor(e=1,t=0,n=0){this.radius=e,this.phi=t,this.theta=n}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){let e=1e-6;return this.phi=z(this.phi,e,Math.PI-e),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){return this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,n),this.phi=Math.acos(z(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};(class e{static{e.prototype.isMatrix2=!0}constructor(e,t,n,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,r){let i=this.elements;return i[0]=e,i[2]=t,i[1]=n,i[3]=r,this}});var hi=class extends L{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){if(e===void 0){F(`Controls: connect() now requires an element.`);return}this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}};function gi(e,t,n,r){let i=_i(r);switch(n){case 1021:return e*t;case 1028:return e*t/i.components*i.byteLength;case y:return e*t/i.components*i.byteLength;case b:return e*t*2/i.components*i.byteLength;case x:return e*t*2/i.components*i.byteLength;case 1022:return e*t*3/i.components*i.byteLength;case g:return e*t*4/i.components*i.byteLength;case S:return e*t*4/i.components*i.byteLength;case 33776:case 33777:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case 33778:case 33779:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case 35841:case 35843:return Math.max(e,16)*Math.max(t,8)/4;case 35840:case 35842:return Math.max(e,8)*Math.max(t,8)/2;case 36196:case 37492:case 37488:case 37489:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case 37496:case 37490:case 37491:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case 37808:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case 37809:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case 37810:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case 37811:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case 37812:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case 37813:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case 37814:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case 37815:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case 37816:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case 37817:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case 37818:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case 37819:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case 37820:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case 37821:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case 36492:case 36494:case 36495:return Math.ceil(e/4)*Math.ceil(t/4)*16;case 36283:case 36284:return Math.ceil(e/4)*Math.ceil(t/4)*8;case 36285:case 36286:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw Error(`Unable to determine texture byte length for ${n} format.`)}function _i(e){switch(e){case c:case 1010:return{byteLength:1,components:1};case l:case 1011:case f:return{byteLength:2,components:1};case p:case m:return{byteLength:2,components:4};case u:case 1013:case d:return{byteLength:4,components:1};case 35902:case 35899:return{byteLength:4,components:3}}throw Error(`Unknown texture type ${e}.`)}typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`register`,{detail:{revision:`184`}})),typeof window<`u`&&(window.__THREE__?F(`WARNING: Multiple instances of Three.js being imported.`):window.__THREE__=`184`);
/**
* @license
* Copyright 2010-2026 Three.js Authors
* SPDX-License-Identifier: MIT
*/
function vi(){let e=null,t=!1,n=null,r=null;function i(t,a){n(t,a),r=e.requestAnimationFrame(i)}return{start:function(){t!==!0&&n!==null&&e!==null&&(r=e.requestAnimationFrame(i),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(r),t=!1},setAnimationLoop:function(e){n=e},setContext:function(t){e=t}}}function yi(e){let t=new WeakMap;function n(t,n){let r=t.array,i=t.usage,a=r.byteLength,o=e.createBuffer();e.bindBuffer(n,o),e.bufferData(n,r,i),t.onUploadCallback();let s;if(r instanceof Float32Array)s=e.FLOAT;else if(typeof Float16Array<`u`&&r instanceof Float16Array)s=e.HALF_FLOAT;else if(r instanceof Uint16Array)s=t.isFloat16BufferAttribute?e.HALF_FLOAT:e.UNSIGNED_SHORT;else if(r instanceof Int16Array)s=e.SHORT;else if(r instanceof Uint32Array)s=e.UNSIGNED_INT;else if(r instanceof Int32Array)s=e.INT;else if(r instanceof Int8Array)s=e.BYTE;else if(r instanceof Uint8Array)s=e.UNSIGNED_BYTE;else if(r instanceof Uint8ClampedArray)s=e.UNSIGNED_BYTE;else throw Error(`THREE.WebGLAttributes: Unsupported buffer data format: `+r);return{buffer:o,type:s,bytesPerElement:r.BYTES_PER_ELEMENT,version:t.version,size:a}}function r(t,n,r){let i=n.array,a=n.updateRanges;if(e.bindBuffer(r,t),a.length===0)e.bufferSubData(r,0,i);else{a.sort((e,t)=>e.start-t.start);let t=0;for(let e=1;e<a.length;e++){let n=a[t],r=a[e];r.start<=n.start+n.count+1?n.count=Math.max(n.count,r.start+r.count-n.start):(++t,a[t]=r)}a.length=t+1;for(let t=0,n=a.length;t<n;t++){let n=a[t];e.bufferSubData(r,n.start*i.BYTES_PER_ELEMENT,i,n.start,n.count)}n.clearUpdateRanges()}n.onUploadCallback()}function i(e){return e.isInterleavedBufferAttribute&&(e=e.data),t.get(e)}function a(n){n.isInterleavedBufferAttribute&&(n=n.data);let r=t.get(n);r&&(e.deleteBuffer(r.buffer),t.delete(n))}function o(e,i){if(e.isInterleavedBufferAttribute&&(e=e.data),e.isGLBufferAttribute){let n=t.get(e);(!n||n.version<e.version)&&t.set(e,{buffer:e.buffer,type:e.type,bytesPerElement:e.elementSize,version:e.version});return}let a=t.get(e);if(a===void 0)t.set(e,n(e,i));else if(a.version<e.version){if(a.size!==e.array.byteLength)throw Error(`THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.`);r(a.buffer,e,i),a.version=e.version}}return{get:i,remove:a,update:o}}let X={alphahash_fragment:`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,alphahash_pars_fragment:`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,alphamap_fragment:`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,alphamap_pars_fragment:`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,alphatest_fragment:`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,alphatest_pars_fragment:`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,aomap_fragment:`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,aomap_pars_fragment:`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,batching_pars_vertex:`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,batching_vertex:`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,begin_vertex:`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,beginnormal_vertex:`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,bsdfs:`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,iridescence_fragment:`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,bumpmap_pars_fragment:`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,clipping_planes_fragment:`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,clipping_planes_pars_fragment:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,clipping_planes_pars_vertex:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,clipping_planes_vertex:`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,color_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,color_pars_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,color_pars_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,color_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,common:`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,cube_uv_reflection_fragment:`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,defaultnormal_vertex:`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,displacementmap_pars_vertex:`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,displacementmap_vertex:`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,emissivemap_fragment:`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,emissivemap_pars_fragment:`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,colorspace_fragment:`gl_FragColor = linearToOutputTexel( gl_FragColor );`,colorspace_pars_fragment:`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,envmap_fragment:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,envmap_common_pars_fragment:`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,envmap_pars_fragment:`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,envmap_pars_vertex:`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,envmap_physical_pars_fragment:`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,envmap_vertex:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,fog_vertex:`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,fog_pars_vertex:`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,fog_fragment:`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,fog_pars_fragment:`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,gradientmap_pars_fragment:`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,lightmap_pars_fragment:`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,lights_lambert_fragment:`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,lights_lambert_pars_fragment:`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,lights_pars_begin:`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,lights_toon_fragment:`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,lights_toon_pars_fragment:`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lights_phong_fragment:`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,lights_phong_pars_fragment:`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,lights_physical_fragment:`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,lights_physical_pars_fragment:`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
		vec3 iridescenceFresnelDielectric;
		vec3 iridescenceFresnelMetallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
vec3 BRDF_GGX_Multiscatter( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 singleScatter = BRDF_GGX( lightDir, viewDir, normal, material );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 dfgV = texture2D( dfgLUT, vec2( material.roughness, dotNV ) ).rg;
	vec2 dfgL = texture2D( dfgLUT, vec2( material.roughness, dotNL ) ).rg;
	vec3 FssEss_V = material.specularColorBlended * dfgV.x + material.specularF90 * dfgV.y;
	vec3 FssEss_L = material.specularColorBlended * dfgL.x + material.specularF90 * dfgL.y;
	float Ess_V = dfgV.x + dfgV.y;
	float Ess_L = dfgL.x + dfgL.y;
	float Ems_V = 1.0 - Ess_V;
	float Ems_L = 1.0 - Ess_L;
	vec3 Favg = material.specularColorBlended + ( 1.0 - material.specularColorBlended ) * 0.047619;
	vec3 Fms = FssEss_V * FssEss_L * Favg / ( 1.0 - Ems_V * Ems_L * Favg + EPSILON );
	float compensationFactor = Ems_V * Ems_L;
	vec3 multiScatter = Fms * compensationFactor;
	return singleScatter + multiScatter;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX_Multiscatter( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnelDielectric, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceFresnelMetallic, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,lights_fragment_begin:`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( material.iridescenceFresnelDielectric, material.iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = inverseTransformDirection( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,lights_fragment_maps:`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,lights_fragment_end:`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,lightprobes_pars_fragment:`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,logdepthbuf_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,logdepthbuf_pars_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_pars_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,map_fragment:`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,map_pars_fragment:`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,map_particle_fragment:`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,map_particle_pars_fragment:`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,metalnessmap_fragment:`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,metalnessmap_pars_fragment:`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,morphinstance_vertex:`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,morphcolor_vertex:`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,morphnormal_vertex:`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,morphtarget_pars_vertex:`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,morphtarget_vertex:`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,normal_fragment_begin:`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,normal_fragment_maps:`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,normal_pars_fragment:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_pars_vertex:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_vertex:`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,normalmap_pars_fragment:`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,clearcoat_normal_fragment_begin:`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,clearcoat_normal_fragment_maps:`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,clearcoat_pars_fragment:`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,iridescence_pars_fragment:`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,opaque_fragment:`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,packing:`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,premultiplied_alpha_fragment:`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,project_vertex:`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,dithering_fragment:`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,dithering_pars_fragment:`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,roughnessmap_fragment:`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,roughnessmap_pars_fragment:`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,shadowmap_pars_fragment:`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,shadowmap_pars_vertex:`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,shadowmap_vertex:`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,shadowmask_pars_fragment:`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,skinbase_vertex:`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,skinning_pars_vertex:`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,skinning_vertex:`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,skinnormal_vertex:`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,specularmap_fragment:`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,specularmap_pars_fragment:`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tonemapping_fragment:`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,tonemapping_pars_fragment:`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,transmission_fragment:`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,transmission_pars_fragment:`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,uv_pars_fragment:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_pars_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,worldpos_vertex:`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,background_vert:`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,background_frag:`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,backgroundCube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,backgroundCube_frag:`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cube_frag:`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,depth_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,depth_frag:`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,distance_vert:`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,distance_frag:`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,equirect_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,equirect_frag:`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,linedashed_vert:`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,linedashed_frag:`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,meshbasic_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,meshbasic_frag:`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshlambert_vert:`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshlambert_frag:`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshmatcap_vert:`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,meshmatcap_frag:`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshnormal_vert:`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,meshnormal_frag:`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,meshphong_vert:`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshphong_frag:`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshphysical_vert:`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,meshphysical_frag:`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshtoon_vert:`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshtoon_frag:`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,points_vert:`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,points_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,shadow_vert:`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,shadow_frag:`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,sprite_vert:`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sprite_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`},Z={common:{diffuse:{value:new Y(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new K},alphaMap:{value:null},alphaMapTransform:{value:new K},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new K}},envmap:{envMap:{value:null},envMapRotation:{value:new K},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new K}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new K}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new K},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new K},normalScale:{value:new H(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new K},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new K}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new K}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new K}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Y(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new W},probesMax:{value:new W},probesResolution:{value:new W}},points:{diffuse:{value:new Y(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new K},alphaTest:{value:0},uvTransform:{value:new K}},sprite:{diffuse:{value:new Y(16777215)},opacity:{value:1},center:{value:new H(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new K},alphaMap:{value:null},alphaMapTransform:{value:new K},alphaTest:{value:0}}},bi={basic:{uniforms:xr([Z.common,Z.specularmap,Z.envmap,Z.aomap,Z.lightmap,Z.fog]),vertexShader:X.meshbasic_vert,fragmentShader:X.meshbasic_frag},lambert:{uniforms:xr([Z.common,Z.specularmap,Z.envmap,Z.aomap,Z.lightmap,Z.emissivemap,Z.bumpmap,Z.normalmap,Z.displacementmap,Z.fog,Z.lights,{emissive:{value:new Y(0)},envMapIntensity:{value:1}}]),vertexShader:X.meshlambert_vert,fragmentShader:X.meshlambert_frag},phong:{uniforms:xr([Z.common,Z.specularmap,Z.envmap,Z.aomap,Z.lightmap,Z.emissivemap,Z.bumpmap,Z.normalmap,Z.displacementmap,Z.fog,Z.lights,{emissive:{value:new Y(0)},specular:{value:new Y(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:X.meshphong_vert,fragmentShader:X.meshphong_frag},standard:{uniforms:xr([Z.common,Z.envmap,Z.aomap,Z.lightmap,Z.emissivemap,Z.bumpmap,Z.normalmap,Z.displacementmap,Z.roughnessmap,Z.metalnessmap,Z.fog,Z.lights,{emissive:{value:new Y(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:X.meshphysical_vert,fragmentShader:X.meshphysical_frag},toon:{uniforms:xr([Z.common,Z.aomap,Z.lightmap,Z.emissivemap,Z.bumpmap,Z.normalmap,Z.displacementmap,Z.gradientmap,Z.fog,Z.lights,{emissive:{value:new Y(0)}}]),vertexShader:X.meshtoon_vert,fragmentShader:X.meshtoon_frag},matcap:{uniforms:xr([Z.common,Z.bumpmap,Z.normalmap,Z.displacementmap,Z.fog,{matcap:{value:null}}]),vertexShader:X.meshmatcap_vert,fragmentShader:X.meshmatcap_frag},points:{uniforms:xr([Z.points,Z.fog]),vertexShader:X.points_vert,fragmentShader:X.points_frag},dashed:{uniforms:xr([Z.common,Z.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:X.linedashed_vert,fragmentShader:X.linedashed_frag},depth:{uniforms:xr([Z.common,Z.displacementmap]),vertexShader:X.depth_vert,fragmentShader:X.depth_frag},normal:{uniforms:xr([Z.common,Z.bumpmap,Z.normalmap,Z.displacementmap,{opacity:{value:1}}]),vertexShader:X.meshnormal_vert,fragmentShader:X.meshnormal_frag},sprite:{uniforms:xr([Z.sprite,Z.fog]),vertexShader:X.sprite_vert,fragmentShader:X.sprite_frag},background:{uniforms:{uvTransform:{value:new K},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:X.background_vert,fragmentShader:X.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new K}},vertexShader:X.backgroundCube_vert,fragmentShader:X.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:X.cube_vert,fragmentShader:X.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:X.equirect_vert,fragmentShader:X.equirect_frag},distance:{uniforms:xr([Z.common,Z.displacementmap,{referencePosition:{value:new W},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:X.distance_vert,fragmentShader:X.distance_frag},shadow:{uniforms:xr([Z.lights,Z.fog,{color:{value:new Y(0)},opacity:{value:1}}]),vertexShader:X.shadow_vert,fragmentShader:X.shadow_frag}};bi.physical={uniforms:xr([bi.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new K},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new K},clearcoatNormalScale:{value:new H(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new K},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new K},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new K},sheen:{value:0},sheenColor:{value:new Y(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new K},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new K},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new K},transmissionSamplerSize:{value:new H},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new K},attenuationDistance:{value:0},attenuationColor:{value:new Y(0)},specularColor:{value:new Y(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new K},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new K},anisotropyVector:{value:new H},anisotropyMap:{value:null},anisotropyMapTransform:{value:new K}}]),vertexShader:X.meshphysical_vert,fragmentShader:X.meshphysical_frag};let xi={r:0,b:0,g:0},Si=new et,Ci=new K;Ci.set(-1,0,0,0,1,0,0,0,1);function wi(e,t,n,r,i,a){let o=new Y(0),s=i===!0?0:1,c,l,u=null,d=0,f=null;function p(e){let n=e.isScene===!0?e.background:null;if(n&&n.isTexture){let r=e.backgroundBlurriness>0;n=t.get(n,r)}return n}function m(t){let r=!1,i=p(t);i===null?g(o,s):i&&i.isColor&&(g(i,1),r=!0);let c=e.xr.getEnvironmentBlendMode();c===`additive`?n.buffers.color.setClear(0,0,0,1,a):c===`alpha-blend`&&n.buffers.color.setClear(0,0,0,0,a),(e.autoClear||r)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function h(t,n){let i=p(n);i&&(i.isCubeTexture||i.mapping===306)?(l===void 0&&(l=new $n(new gr(1,1,1),new Or({name:`BackgroundCubeMaterial`,uniforms:br(bi.backgroundCube.uniforms),vertexShader:bi.backgroundCube.vertexShader,fragmentShader:bi.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute(`normal`),l.geometry.deleteAttribute(`uv`),l.onBeforeRender=function(e,t,n){this.matrixWorld.copyPosition(n.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(l)),l.material.uniforms.envMap.value=i,l.material.uniforms.backgroundBlurriness.value=n.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(Si.makeRotationFromEuler(n.backgroundRotation)).transpose(),i.isCubeTexture&&i.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(Ci),l.material.toneMapped=q.getTransfer(i.colorSpace)!==M,(u!==i||d!==i.version||f!==e.toneMapping)&&(l.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),l.layers.enableAll(),t.unshift(l,l.geometry,l.material,0,0,null)):i&&i.isTexture&&(c===void 0&&(c=new $n(new vr(2,2),new Or({name:`BackgroundMaterial`,uniforms:br(bi.background.uniforms),vertexShader:bi.background.vertexShader,fragmentShader:bi.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute(`normal`),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=i,c.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,c.material.toneMapped=q.getTransfer(i.colorSpace)!==M,i.matrixAutoUpdate===!0&&i.updateMatrix(),c.material.uniforms.uvTransform.value.copy(i.matrix),(u!==i||d!==i.version||f!==e.toneMapping)&&(c.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),c.layers.enableAll(),t.unshift(c,c.geometry,c.material,0,0,null))}function g(t,r){t.getRGB(xi,wr(e)),n.buffers.color.setClear(xi.r,xi.g,xi.b,r,a)}function _(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(e,t=1){o.set(e),s=t,g(o,s)},getClearAlpha:function(){return s},setClearAlpha:function(e){s=e,g(o,s)},render:m,addToRenderList:h,dispose:_}}function Ti(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),r={},i=f(null),a=i,o=!1;function s(n,r,i,s,c){let u=!1,f=d(n,s,i,r);a!==f&&(a=f,l(a.object)),u=p(n,s,i,c),u&&m(n,s,i,c),c!==null&&t.update(c,e.ELEMENT_ARRAY_BUFFER),(u||o)&&(o=!1,b(n,r,i,s),c!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(c).buffer))}function c(){return e.createVertexArray()}function l(t){return e.bindVertexArray(t)}function u(t){return e.deleteVertexArray(t)}function d(e,t,n,i){let a=i.wireframe===!0,o=r[t.id];o===void 0&&(o={},r[t.id]=o);let s=e.isInstancedMesh===!0?e.id:0,l=o[s];l===void 0&&(l={},o[s]=l);let u=l[n.id];u===void 0&&(u={},l[n.id]=u);let d=u[a];return d===void 0&&(d=f(c()),u[a]=d),d}function f(e){let t=[],r=[],i=[];for(let e=0;e<n;e++)t[e]=0,r[e]=0,i[e]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:t,enabledAttributes:r,attributeDivisors:i,object:e,attributes:{},index:null}}function p(e,t,n,r){let i=a.attributes,o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=i[t],r=o[t];if(r===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(r=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(r=e.instanceColor)),n===void 0||n.attribute!==r||r&&n.data!==r.data)return!0;s++}return a.attributesNum!==s||a.index!==r}function m(e,t,n,r){let i={},o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=o[t];n===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(n=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(n=e.instanceColor));let r={};r.attribute=n,n&&n.data&&(r.data=n.data),i[t]=r,s++}a.attributes=i,a.attributesNum=s,a.index=r}function h(){let e=a.newAttributes;for(let t=0,n=e.length;t<n;t++)e[t]=0}function g(e){_(e,0)}function _(t,n){let r=a.newAttributes,i=a.enabledAttributes,o=a.attributeDivisors;r[t]=1,i[t]===0&&(e.enableVertexAttribArray(t),i[t]=1),o[t]!==n&&(e.vertexAttribDivisor(t,n),o[t]=n)}function v(){let t=a.newAttributes,n=a.enabledAttributes;for(let r=0,i=n.length;r<i;r++)n[r]!==t[r]&&(e.disableVertexAttribArray(r),n[r]=0)}function y(t,n,r,i,a,o,s){s===!0?e.vertexAttribIPointer(t,n,r,a,o):e.vertexAttribPointer(t,n,r,i,a,o)}function b(n,r,i,a){h();let o=a.attributes,s=i.getAttributes(),c=r.defaultAttributeValues;for(let r in s){let i=s[r];if(i.location>=0){let s=o[r];if(s===void 0&&(r===`instanceMatrix`&&n.instanceMatrix&&(s=n.instanceMatrix),r===`instanceColor`&&n.instanceColor&&(s=n.instanceColor)),s!==void 0){let r=s.normalized,o=s.itemSize,c=t.get(s);if(c===void 0)continue;let l=c.buffer,u=c.type,d=c.bytesPerElement,f=u===e.INT||u===e.UNSIGNED_INT||s.gpuType===1013;if(s.isInterleavedBufferAttribute){let t=s.data,c=t.stride,p=s.offset;if(t.isInstancedInterleavedBuffer){for(let e=0;e<i.locationSize;e++)_(i.location+e,t.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=t.meshPerAttribute*t.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,c*d,(p+o/i.locationSize*e)*d,f)}else{if(s.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,s.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=s.meshPerAttribute*s.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,o*d,o/i.locationSize*e*d,f)}}else if(c!==void 0){let t=c[r];if(t!==void 0)switch(t.length){case 2:e.vertexAttrib2fv(i.location,t);break;case 3:e.vertexAttrib3fv(i.location,t);break;case 4:e.vertexAttrib4fv(i.location,t);break;default:e.vertexAttrib1fv(i.location,t)}}}}v()}function x(){T();for(let e in r){let t=r[e];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e]}}function S(e){if(r[e.id]===void 0)return;let t=r[e.id];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e.id]}function C(e){for(let t in r){let n=r[t];for(let t in n){let r=n[t];if(r[e.id]===void 0)continue;let i=r[e.id];for(let e in i)u(i[e].object),delete i[e];delete r[e.id]}}}function w(e){for(let t in r){let n=r[t],i=e.isInstancedMesh===!0?e.id:0,a=n[i];if(a!==void 0){for(let e in a){let t=a[e];for(let e in t)u(t[e].object),delete t[e];delete a[e]}delete n[i],Object.keys(n).length===0&&delete r[t]}}}function T(){E(),o=!0,a!==i&&(a=i,l(a.object))}function E(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:s,reset:T,resetDefaultState:E,dispose:x,releaseStatesOfGeometry:S,releaseStatesOfObject:w,releaseStatesOfProgram:C,initAttributes:h,enableAttribute:g,disableUnusedAttributes:v}}function Ei(e,t,n){let r;function i(e){r=e}function a(t,i){e.drawArrays(r,t,i),n.update(i,r,1)}function o(t,i,a){a!==0&&(e.drawArraysInstanced(r,t,i,a),n.update(i,r,a))}function s(e,i,a){if(a===0)return;t.get(`WEBGL_multi_draw`).multiDrawArraysWEBGL(r,e,0,i,0,a);let o=0;for(let e=0;e<a;e++)o+=i[e];n.update(o,r,1)}this.setMode=i,this.render=a,this.renderInstances=o,this.renderMultiDraw=s}function Di(e,t,n,r){let i;function a(){if(i!==void 0)return i;if(t.has(`EXT_texture_filter_anisotropic`)===!0){let n=t.get(`EXT_texture_filter_anisotropic`);i=e.getParameter(n.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(t){return!(t!==1023&&r.convert(t)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT))}function s(n){let i=n===1016&&(t.has(`EXT_color_buffer_half_float`)||t.has(`EXT_color_buffer_float`));return!(n!==1009&&r.convert(n)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE)&&n!==1015&&!i)}function c(t){if(t===`highp`){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return`highp`;t=`mediump`}return t===`mediump`&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?`mediump`:`lowp`}let l=n.precision===void 0?`highp`:n.precision,u=c(l);u!==l&&(F(`WebGLRenderer:`,l,`not supported, using`,u,`instead.`),l=u);let d=n.logarithmicDepthBuffer===!0,f=n.reversedDepthBuffer===!0&&t.has(`EXT_clip_control`);n.reversedDepthBuffer===!0&&f===!1&&F(`WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.`);let p=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),m=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),h=e.getParameter(e.MAX_TEXTURE_SIZE),g=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),_=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),y=e.getParameter(e.MAX_VARYING_VECTORS),b=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),x=e.getParameter(e.MAX_SAMPLES),S=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:s,precision:l,logarithmicDepthBuffer:d,reversedDepthBuffer:f,maxTextures:p,maxVertexTextures:m,maxTextureSize:h,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:v,maxVaryings:y,maxFragmentUniforms:b,maxSamples:x,samples:S}}function Oi(e){let t=this,n=null,r=0,i=!1,a=!1,o=new or,s=new K,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(e,t){let n=e.length!==0||t||r!==0||i;return i=t,r=e.length,n},this.beginShadows=function(){a=!0,u(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(e,t){n=u(e,t,0)},this.setState=function(t,o,s){let d=t.clippingPlanes,f=t.clipIntersection,p=t.clipShadows,m=e.get(t);if(!i||d===null||d.length===0||a&&!p)a?u(null):l();else{let e=a?0:r,t=e*4,i=m.clippingState||null;c.value=i,i=u(d,o,t,s);for(let e=0;e!==t;++e)i[e]=n[e];m.clippingState=i,this.numIntersection=f?this.numPlanes:0,this.numPlanes+=e}};function l(){c.value!==n&&(c.value=n,c.needsUpdate=r>0),t.numPlanes=r,t.numIntersection=0}function u(e,n,r,i){let a=e===null?0:e.length,l=null;if(a!==0){if(l=c.value,i!==!0||l===null){let t=r+a*4,i=n.matrixWorldInverse;s.getNormalMatrix(i),(l===null||l.length<t)&&(l=new Float32Array(t));for(let t=0,n=r;t!==a;++t,n+=4)o.copy(e[t]).applyMatrix4(i,s),o.normal.toArray(l,n),l[n+3]=o.constant}c.value=l,c.needsUpdate=!0}return t.numPlanes=a,t.numIntersection=0,l}}let ki=[.125,.215,.35,.446,.526,.582],Ai=new oi,ji=new Y,Mi=null,Ni=0,Pi=0,Fi=!1,Ii=new W;var Li=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=.1,r=100,i={}){let{size:a=256,position:o=Ii}=i;Mi=this._renderer.getRenderTarget(),Ni=this._renderer.getActiveCubeFace(),Pi=this._renderer.getActiveMipmapLevel(),Fi=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(e,n,r,s,o),t>0&&this._blur(s,0,0,t),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Wi(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Ui(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=2**this._lodMax}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Mi,Ni,Pi),this._renderer.xr.enabled=Fi,e.scissorTest=!1,Bi(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===301||e.mapping===302?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Mi=this._renderer.getRenderTarget(),Ni=this._renderer.getActiveCubeFace(),Pi=this._renderer.getActiveMipmapLevel(),Fi=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:o,minFilter:o,generateMipmaps:!1,type:f,format:g,colorSpace:A,depthBuffer:!1},r=zi(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=zi(e,t,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=Ri(r)),this._blurMaterial=Hi(r,e,t),this._ggxMaterial=Vi(r,e,t)}return r}_compileMaterial(e){let t=new $n(new An,e);this._renderer.compile(t,Ai)}_sceneToCubeUV(e,t,n,r,i){let a=new ai(90,1,t,n),o=[1,-1,1,1,1,1],s=[1,1,1,-1,-1,-1],c=this._renderer,l=c.autoClear,u=c.toneMapping;c.getClearColor(ji),c.toneMapping=0,c.autoClear=!1,c.state.buffers.depth.getReversed()&&(c.setRenderTarget(r),c.clearDepth(),c.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new $n(new gr,new Vn({name:`PMREM.Background`,side:1,depthWrite:!1,depthTest:!1})));let d=this._backgroundBox,f=d.material,p=!1,m=e.background;m?m.isColor&&(f.color.copy(m),e.background=null,p=!0):(f.color.copy(ji),p=!0);for(let t=0;t<6;t++){let n=t%3;n===0?(a.up.set(0,o[t],0),a.position.set(i.x,i.y,i.z),a.lookAt(i.x+s[t],i.y,i.z)):n===1?(a.up.set(0,0,o[t]),a.position.set(i.x,i.y,i.z),a.lookAt(i.x,i.y+s[t],i.z)):(a.up.set(0,o[t],0),a.position.set(i.x,i.y,i.z),a.lookAt(i.x,i.y,i.z+s[t]));let l=this._cubeSize;Bi(r,n*l,t>2?l:0,l,l),c.setRenderTarget(r),p&&c.render(d,a),c.render(e,a)}c.toneMapping=u,c.autoClear=l,e.background=m}_textureToCubeUV(e,t){let n=this._renderer,r=e.mapping===301||e.mapping===302;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Wi()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Ui());let i=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=i;let o=i.uniforms;o.envMap.value=e;let s=this._cubeSize;Bi(t,0,0,3*s,2*s),n.setRenderTarget(t),n.render(a,Ai)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let r=this._lodMeshes.length;for(let t=1;t<r;t++)this._applyGGXFilter(e,t-1,t);t.autoClear=n}_applyGGXFilter(e,t,n){let r=this._renderer,i=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;let s=a.uniforms,c=n/(this._lodMeshes.length-1),l=t/(this._lodMeshes.length-1),u=Math.sqrt(c*c-l*l)*(0+c*1.25),{_lodMax:d}=this,f=this._sizeLods[n],p=3*f*(n>d-4?n-d+4:0),m=4*(this._cubeSize-f);s.envMap.value=e.texture,s.roughness.value=u,s.mipInt.value=d-t,Bi(i,p,m,3*f,2*f),r.setRenderTarget(i),r.render(o,Ai),s.envMap.value=i.texture,s.roughness.value=0,s.mipInt.value=d-n,Bi(e,p,m,3*f,2*f),r.setRenderTarget(e),r.render(o,Ai)}_blur(e,t,n,r,i){let a=this._pingPongRenderTarget;this._halfBlur(e,a,t,n,r,`latitudinal`,i),this._halfBlur(a,e,n,n,r,`longitudinal`,i)}_halfBlur(e,t,n,r,i,a,o){let s=this._renderer,c=this._blurMaterial;a!==`latitudinal`&&a!==`longitudinal`&&I(`blur direction must be either latitudinal or longitudinal!`);let l=this._lodMeshes[r];l.material=c;let u=c.uniforms,d=this._sizeLods[n]-1,f=isFinite(i)?Math.PI/(2*d):2*Math.PI/39,p=i/f,m=isFinite(i)?1+Math.floor(3*p):20;m>20&&F(`sigmaRadians, ${i}, is too large and will clip, as it requested ${m} samples when the maximum is set to 20`);let h=[],g=0;for(let e=0;e<20;++e){let t=e/p,n=Math.exp(-t*t/2);h.push(n),e===0?g+=n:e<m&&(g+=2*n)}for(let e=0;e<h.length;e++)h[e]=h[e]/g;u.envMap.value=e.texture,u.samples.value=m,u.weights.value=h,u.latitudinal.value=a===`latitudinal`,o&&(u.poleAxis.value=o);let{_lodMax:_}=this;u.dTheta.value=f,u.mipInt.value=_-n;let v=this._sizeLods[r];Bi(t,3*v*(r>_-4?r-_+4:0),4*(this._cubeSize-v),3*v,2*v),s.setRenderTarget(t),s.render(l,Ai)}};function Ri(e){let t=[],n=[],r=[],i=e,a=e-4+1+ki.length;for(let o=0;o<a;o++){let a=2**i;t.push(a);let s=1/a;o>e-4?s=ki[o-e+4-1]:o===0&&(s=0),n.push(s);let c=1/(a-2),l=-c,u=1+c,d=[l,l,u,l,u,u,l,l,u,u,l,u],f=new Float32Array(108),p=new Float32Array(72),m=new Float32Array(36);for(let e=0;e<6;e++){let t=e%3*2/3-1,n=e>2?0:-1,r=[t,n,0,t+2/3,n,0,t+2/3,n+1,0,t,n,0,t+2/3,n+1,0,t,n+1,0];f.set(r,18*e),p.set(d,12*e);let i=[e,e,e,e,e,e];m.set(i,6*e)}let h=new An;h.setAttribute(`position`,new hn(f,3)),h.setAttribute(`uv`,new hn(p,2)),h.setAttribute(`faceIndex`,new hn(m,1)),r.push(new $n(h,null)),i>4&&i--}return{lodMeshes:r,sizeLods:t,sigmas:n}}function zi(e,t,n){let r=new Ze(e,t,n);return r.texture.mapping=306,r.texture.name=`PMREM.cubeUv`,r.scissorTest=!0,r}function Bi(e,t,n,r,i){e.viewport.set(t,n,r,i),e.scissor.set(t,n,r,i)}function Vi(e,t,n){return new Or({name:`PMREMGGXConvolution`,defines:{GGX_SAMPLES:256,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Gi(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Hi(e,t,n){let r=new Float32Array(20),i=new W(0,1,0);return new Or({name:`SphericalGaussianBlur`,defines:{n:20,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:r},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:i}},vertexShader:Gi(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Ui(){return new Or({name:`EquirectangularToCubeUV`,uniforms:{envMap:{value:null}},vertexShader:Gi(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Wi(){return new Or({name:`CubemapToCubeUV`,uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Gi(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Gi(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}var Ki=class extends Ze{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new dr(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new gr(5,5,5),i=new Or({name:`CubemapFromEquirect`,uniforms:br(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});i.uniforms.tEquirect.value=t;let a=new $n(r,i),s=t.minFilter;return t.minFilter===1008&&(t.minFilter=o),new si(1,10,this).update(e,a),t.minFilter=s,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,r=!0){let i=e.getRenderTarget();for(let i=0;i<6;i++)e.setRenderTarget(this,i),e.clear(t,n,r);e.setRenderTarget(i)}};function qi(e){let t=new WeakMap,n=new WeakMap,r=null;function i(e,t=!1){return e==null?null:t?o(e):a(e)}function a(n){if(n&&n.isTexture){let r=n.mapping;if(r===303||r===304)if(t.has(n)){let e=t.get(n).texture;return s(e,n.mapping)}else{let r=n.image;if(r&&r.height>0){let i=new Ki(r.height);return i.fromEquirectangularTexture(e,n),t.set(n,i),n.addEventListener(`dispose`,l),s(i.texture,n.mapping)}else return null}}return n}function o(t){if(t&&t.isTexture){let i=t.mapping,a=i===303||i===304,o=i===301||i===302;if(a||o){let i=n.get(t),s=i===void 0?0:i.texture.pmremVersion;if(t.isRenderTargetTexture&&t.pmremVersion!==s)return r===null&&(r=new Li(e)),i=a?r.fromEquirectangular(t,i):r.fromCubemap(t,i),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),i.texture;if(i!==void 0)return i.texture;{let s=t.image;return a&&s&&s.height>0||o&&s&&c(s)?(r===null&&(r=new Li(e)),i=a?r.fromEquirectangular(t):r.fromCubemap(t),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),t.addEventListener(`dispose`,u),i.texture):null}}}return t}function s(e,t){return t===303?e.mapping=301:t===304&&(e.mapping=302),e}function c(e){let t=0;for(let n=0;n<6;n++)e[n]!==void 0&&t++;return t===6}function l(e){let n=e.target;n.removeEventListener(`dispose`,l);let r=t.get(n);r!==void 0&&(t.delete(n),r.dispose())}function u(e){let t=e.target;t.removeEventListener(`dispose`,u);let r=n.get(t);r!==void 0&&(n.delete(t),r.dispose())}function d(){t=new WeakMap,n=new WeakMap,r!==null&&(r.dispose(),r=null)}return{get:i,dispose:d}}function Ji(e){let t={};function n(n){if(t[n]!==void 0)return t[n];let r=e.getExtension(n);return t[n]=r,r}return{has:function(e){return n(e)!==null},init:function(){n(`EXT_color_buffer_float`),n(`WEBGL_clip_cull_distance`),n(`OES_texture_float_linear`),n(`EXT_color_buffer_half_float`),n(`WEBGL_multisampled_render_to_texture`),n(`WEBGL_render_shared_exponent`)},get:function(e){let t=n(e);return t===null&&ce(`WebGLRenderer: `+e+` extension not supported.`),t}}}function Yi(e,t,n,r){let i={},a=new WeakMap;function o(e){let s=e.target;s.index!==null&&t.remove(s.index);for(let e in s.attributes)t.remove(s.attributes[e]);s.removeEventListener(`dispose`,o),delete i[s.id];let c=a.get(s);c&&(t.remove(c),a.delete(s)),r.releaseStatesOfGeometry(s),s.isInstancedBufferGeometry===!0&&delete s._maxInstanceCount,n.memory.geometries--}function s(e,t){return i[t.id]===!0?t:(t.addEventListener(`dispose`,o),i[t.id]=!0,n.memory.geometries++,t)}function c(n){let r=n.attributes;for(let n in r)t.update(r[n],e.ARRAY_BUFFER)}function l(e){let n=[],r=e.index,i=e.attributes.position,o=0;if(i===void 0)return;if(r!==null){let e=r.array;o=r.version;for(let t=0,r=e.length;t<r;t+=3){let r=e[t+0],i=e[t+1],a=e[t+2];n.push(r,i,i,a,a,r)}}else{let e=i.array;o=i.version;for(let t=0,r=e.length/3-1;t<r;t+=3){let e=t+0,r=t+1,i=t+2;n.push(e,r,r,i,i,e)}}let s=new(i.count>=65535?_n:gn)(n,1);s.version=o;let c=a.get(e);c&&t.remove(c),a.set(e,s)}function u(e){let t=a.get(e);if(t){let n=e.index;n!==null&&t.version<n.version&&l(e)}else l(e);return a.get(e)}return{get:s,update:c,getWireframeAttribute:u}}function Xi(e,t,n){let r;function i(e){r=e}let a,o;function s(e){a=e.type,o=e.bytesPerElement}function c(t,i){e.drawElements(r,i,a,t*o),n.update(i,r,1)}function l(t,i,s){s!==0&&(e.drawElementsInstanced(r,i,a,t*o,s),n.update(i,r,s))}function u(e,i,o){if(o===0)return;t.get(`WEBGL_multi_draw`).multiDrawElementsWEBGL(r,i,0,a,e,0,o);let s=0;for(let e=0;e<o;e++)s+=i[e];n.update(s,r,1)}this.setMode=i,this.setIndex=s,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function Zi(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function r(t,r,i){switch(n.calls++,r){case e.TRIANGLES:n.triangles+=t/3*i;break;case e.LINES:n.lines+=t/2*i;break;case e.LINE_STRIP:n.lines+=i*(t-1);break;case e.LINE_LOOP:n.lines+=i*t;break;case e.POINTS:n.points+=i*t;break;default:I(`WebGLInfo: Unknown draw mode:`,r);break}}function i(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:i,update:r}}function Qi(e,t,n){let r=new WeakMap,i=new Ye;function a(a,o,s){let c=a.morphTargetInfluences,l=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=l===void 0?0:l.length,f=r.get(o);if(f===void 0||f.count!==u){f!==void 0&&f.texture.dispose();let e=o.morphAttributes.position!==void 0,n=o.morphAttributes.normal!==void 0,a=o.morphAttributes.color!==void 0,s=o.morphAttributes.position||[],c=o.morphAttributes.normal||[],l=o.morphAttributes.color||[],m=0;e===!0&&(m=1),n===!0&&(m=2),a===!0&&(m=3);let h=o.attributes.position.count*m,g=1;h>t.maxTextureSize&&(g=Math.ceil(h/t.maxTextureSize),h=t.maxTextureSize);let _=new Float32Array(h*g*4*u),v=new Qe(_,h,g,u);v.type=d,v.needsUpdate=!0;let y=m*4;for(let t=0;t<u;t++){let r=s[t],o=c[t],u=l[t],d=h*g*4*t;for(let t=0;t<r.count;t++){let s=t*y;e===!0&&(i.fromBufferAttribute(r,t),_[d+s+0]=i.x,_[d+s+1]=i.y,_[d+s+2]=i.z,_[d+s+3]=0),n===!0&&(i.fromBufferAttribute(o,t),_[d+s+4]=i.x,_[d+s+5]=i.y,_[d+s+6]=i.z,_[d+s+7]=0),a===!0&&(i.fromBufferAttribute(u,t),_[d+s+8]=i.x,_[d+s+9]=i.y,_[d+s+10]=i.z,_[d+s+11]=u.itemSize===4?i.w:1)}}f={count:u,texture:v,size:new H(h,g)},r.set(o,f);function p(){v.dispose(),r.delete(o),o.removeEventListener(`dispose`,p)}o.addEventListener(`dispose`,p)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)s.getUniforms().setValue(e,`morphTexture`,a.morphTexture,n);else{let t=0;for(let e=0;e<c.length;e++)t+=c[e];let n=o.morphTargetsRelative?1:1-t;s.getUniforms().setValue(e,`morphTargetBaseInfluence`,n),s.getUniforms().setValue(e,`morphTargetInfluences`,c)}s.getUniforms().setValue(e,`morphTargetsTexture`,f.texture,n),s.getUniforms().setValue(e,`morphTargetsTextureSize`,f.size)}return{update:a}}function $i(e,t,n,r,i){let a=new WeakMap;function o(r){let o=i.render.frame,s=r.geometry,l=t.get(r,s);if(a.get(l)!==o&&(t.update(l),a.set(l,o)),r.isInstancedMesh&&(r.hasEventListener(`dispose`,c)===!1&&r.addEventListener(`dispose`,c),a.get(r)!==o&&(n.update(r.instanceMatrix,e.ARRAY_BUFFER),r.instanceColor!==null&&n.update(r.instanceColor,e.ARRAY_BUFFER),a.set(r,o))),r.isSkinnedMesh){let e=r.skeleton;a.get(e)!==o&&(e.update(),a.set(e,o))}return l}function s(){a=new WeakMap}function c(e){let t=e.target;t.removeEventListener(`dispose`,c),r.releaseStatesOfObject(t),n.remove(t.instanceMatrix),t.instanceColor!==null&&n.remove(t.instanceColor)}return{update:o,dispose:s}}let ea={1:`LINEAR_TONE_MAPPING`,2:`REINHARD_TONE_MAPPING`,3:`CINEON_TONE_MAPPING`,4:`ACES_FILMIC_TONE_MAPPING`,6:`AGX_TONE_MAPPING`,7:`NEUTRAL_TONE_MAPPING`,5:`CUSTOM_TONE_MAPPING`};function ta(e,t,n,r,i){let a=new Ze(t,n,{type:e,depthBuffer:r,stencilBuffer:i,depthTexture:r?new pr(t,n):void 0}),o=new Ze(t,n,{type:f,depthBuffer:!1,stencilBuffer:!1}),s=new An;s.setAttribute(`position`,new vn([-1,3,0,-1,-1,0,3,-1,0],3)),s.setAttribute(`uv`,new vn([0,2,0,0,2,0],2));let c=new kr({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),l=new $n(s,c),u=new oi(-1,1,1,-1,0,1),d=null,p=null,m=!1,h,g=null,_=[],v=!1;this.setSize=function(e,t){a.setSize(e,t),o.setSize(e,t);for(let n=0;n<_.length;n++){let r=_[n];r.setSize&&r.setSize(e,t)}},this.setEffects=function(e){_=e,v=_.length>0&&_[0].isRenderPass===!0;let t=a.width,n=a.height;for(let e=0;e<_.length;e++){let r=_[e];r.setSize&&r.setSize(t,n)}},this.begin=function(e,t){if(m||e.toneMapping===0&&_.length===0)return!1;if(g=t,t!==null){let e=t.width,n=t.height;(a.width!==e||a.height!==n)&&this.setSize(e,n)}return v===!1&&e.setRenderTarget(a),h=e.toneMapping,e.toneMapping=0,!0},this.hasRenderPass=function(){return v},this.end=function(e,t){e.toneMapping=h,m=!0;let n=a,r=o;for(let i=0;i<_.length;i++){let a=_[i];if(a.enabled!==!1&&(a.render(e,r,n,t),a.needsSwap!==!1)){let e=n;n=r,r=e}}if(d!==e.outputColorSpace||p!==e.toneMapping){d=e.outputColorSpace,p=e.toneMapping,c.defines={},q.getTransfer(d)===`srgb`&&(c.defines.SRGB_TRANSFER=``);let t=ea[p];t&&(c.defines[t]=``),c.needsUpdate=!0}c.uniforms.tDiffuse.value=n.texture,e.setRenderTarget(g),e.render(l,u),g=null,m=!1},this.isCompositing=function(){return m},this.dispose=function(){a.depthTexture&&a.depthTexture.dispose(),a.dispose(),o.dispose(),s.dispose(),c.dispose()}}let na=new Je,ra=new pr(1,1),ia=new Qe,aa=new $e,oa=new dr,sa=[],ca=[],la=new Float32Array(16),ua=new Float32Array(9),da=new Float32Array(4);function fa(e,t,n){let r=e[0];if(r<=0||r>0)return e;let i=t*n,a=sa[i];if(a===void 0&&(a=new Float32Array(i),sa[i]=a),t!==0){r.toArray(a,0);for(let r=1,i=0;r!==t;++r)i+=n,e[r].toArray(a,i)}return a}function pa(e,t){if(e.length!==t.length)return!1;for(let n=0,r=e.length;n<r;n++)if(e[n]!==t[n])return!1;return!0}function ma(e,t){for(let n=0,r=t.length;n<r;n++)e[n]=t[n]}function ha(e,t){let n=ca[t];n===void 0&&(n=new Int32Array(t),ca[t]=n);for(let r=0;r!==t;++r)n[r]=e.allocateTextureUnit();return n}function ga(e,t){let n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function _a(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(pa(n,t))return;e.uniform2fv(this.addr,t),ma(n,t)}}function va(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(pa(n,t))return;e.uniform3fv(this.addr,t),ma(n,t)}}function ya(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(pa(n,t))return;e.uniform4fv(this.addr,t),ma(n,t)}}function ba(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(pa(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),ma(n,t)}else{if(pa(n,r))return;da.set(r),e.uniformMatrix2fv(this.addr,!1,da),ma(n,r)}}function xa(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(pa(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),ma(n,t)}else{if(pa(n,r))return;ua.set(r),e.uniformMatrix3fv(this.addr,!1,ua),ma(n,r)}}function Sa(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(pa(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),ma(n,t)}else{if(pa(n,r))return;la.set(r),e.uniformMatrix4fv(this.addr,!1,la),ma(n,r)}}function Ca(e,t){let n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function wa(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(pa(n,t))return;e.uniform2iv(this.addr,t),ma(n,t)}}function Ta(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(pa(n,t))return;e.uniform3iv(this.addr,t),ma(n,t)}}function Ea(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(pa(n,t))return;e.uniform4iv(this.addr,t),ma(n,t)}}function Da(e,t){let n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function Oa(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(pa(n,t))return;e.uniform2uiv(this.addr,t),ma(n,t)}}function ka(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(pa(n,t))return;e.uniform3uiv(this.addr,t),ma(n,t)}}function Aa(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(pa(n,t))return;e.uniform4uiv(this.addr,t),ma(n,t)}}function ja(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;this.type===e.SAMPLER_2D_SHADOW?(ra.compareFunction=n.isReversedDepthBuffer()?518:515,a=ra):a=na,n.setTexture2D(t||a,i)}function Ma(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture3D(t||aa,i)}function Na(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTextureCube(t||oa,i)}function Pa(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture2DArray(t||ia,i)}function Fa(e){switch(e){case 5126:return ga;case 35664:return _a;case 35665:return va;case 35666:return ya;case 35674:return ba;case 35675:return xa;case 35676:return Sa;case 5124:case 35670:return Ca;case 35667:case 35671:return wa;case 35668:case 35672:return Ta;case 35669:case 35673:return Ea;case 5125:return Da;case 36294:return Oa;case 36295:return ka;case 36296:return Aa;case 35678:case 36198:case 36298:case 36306:case 35682:return ja;case 35679:case 36299:case 36307:return Ma;case 35680:case 36300:case 36308:case 36293:return Na;case 36289:case 36303:case 36311:case 36292:return Pa}}function Ia(e,t){e.uniform1fv(this.addr,t)}function La(e,t){let n=fa(t,this.size,2);e.uniform2fv(this.addr,n)}function Ra(e,t){let n=fa(t,this.size,3);e.uniform3fv(this.addr,n)}function za(e,t){let n=fa(t,this.size,4);e.uniform4fv(this.addr,n)}function Ba(e,t){let n=fa(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function Va(e,t){let n=fa(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function Ha(e,t){let n=fa(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function Ua(e,t){e.uniform1iv(this.addr,t)}function Wa(e,t){e.uniform2iv(this.addr,t)}function Ga(e,t){e.uniform3iv(this.addr,t)}function Ka(e,t){e.uniform4iv(this.addr,t)}function qa(e,t){e.uniform1uiv(this.addr,t)}function Ja(e,t){e.uniform2uiv(this.addr,t)}function Ya(e,t){e.uniform3uiv(this.addr,t)}function Xa(e,t){e.uniform4uiv(this.addr,t)}function Za(e,t,n){let r=this.cache,i=t.length,a=ha(n,i);pa(r,a)||(e.uniform1iv(this.addr,a),ma(r,a));let o;o=this.type===e.SAMPLER_2D_SHADOW?ra:na;for(let e=0;e!==i;++e)n.setTexture2D(t[e]||o,a[e])}function Qa(e,t,n){let r=this.cache,i=t.length,a=ha(n,i);pa(r,a)||(e.uniform1iv(this.addr,a),ma(r,a));for(let e=0;e!==i;++e)n.setTexture3D(t[e]||aa,a[e])}function $a(e,t,n){let r=this.cache,i=t.length,a=ha(n,i);pa(r,a)||(e.uniform1iv(this.addr,a),ma(r,a));for(let e=0;e!==i;++e)n.setTextureCube(t[e]||oa,a[e])}function eo(e,t,n){let r=this.cache,i=t.length,a=ha(n,i);pa(r,a)||(e.uniform1iv(this.addr,a),ma(r,a));for(let e=0;e!==i;++e)n.setTexture2DArray(t[e]||ia,a[e])}function to(e){switch(e){case 5126:return Ia;case 35664:return La;case 35665:return Ra;case 35666:return za;case 35674:return Ba;case 35675:return Va;case 35676:return Ha;case 5124:case 35670:return Ua;case 35667:case 35671:return Wa;case 35668:case 35672:return Ga;case 35669:case 35673:return Ka;case 5125:return qa;case 36294:return Ja;case 36295:return Ya;case 36296:return Xa;case 35678:case 36198:case 36298:case 36306:case 35682:return Za;case 35679:case 36299:case 36307:return Qa;case 35680:case 36300:case 36308:case 36293:return $a;case 36289:case 36303:case 36311:case 36292:return eo}}var no=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Fa(t.type)}},ro=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=to(t.type)}},io=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let r=this.seq;for(let i=0,a=r.length;i!==a;++i){let a=r[i];a.setValue(e,t[a.id],n)}}};let ao=/(\w+)(\])?(\[|\.)?/g;function oo(e,t){e.seq.push(t),e.map[t.id]=t}function so(e,t,n){let r=e.name,i=r.length;for(ao.lastIndex=0;;){let a=ao.exec(r),o=ao.lastIndex,s=a[1],c=a[2]===`]`,l=a[3];if(c&&(s|=0),l===void 0||l===`[`&&o+2===i){oo(n,l===void 0?new no(s,e,t):new ro(s,e,t));break}else{let e=n.map[s];e===void 0&&(e=new io(s),oo(n,e)),n=e}}}var co=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){let n=e.getActiveUniform(t,r);so(n,e.getUniformLocation(t,n.name),this)}let r=[],i=[];for(let t of this.seq)t.type===e.SAMPLER_2D_SHADOW||t.type===e.SAMPLER_CUBE_SHADOW||t.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(t):i.push(t);r.length>0&&(this.seq=r.concat(i))}setValue(e,t,n,r){let i=this.map[t];i!==void 0&&i.setValue(e,n,r)}setOptional(e,t,n){let r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let i=0,a=t.length;i!==a;++i){let a=t[i],o=n[a.id];o.needsUpdate!==!1&&a.setValue(e,o.value,r)}}static seqWithValue(e,t){let n=[];for(let r=0,i=e.length;r!==i;++r){let i=e[r];i.id in t&&n.push(i)}return n}};function lo(e,t,n){let r=e.createShader(t);return e.shaderSource(r,n),e.compileShader(r),r}let uo=0;function fo(e,t){let n=e.split(`
`),r=[],i=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let e=i;e<a;e++){let i=e+1;r.push(`${i===t?`>`:` `} ${i}: ${n[e]}`)}return r.join(`
`)}let po=new K;function mo(e){q._getMatrix(po,q.workingColorSpace,e);let t=`mat3( ${po.elements.map(e=>e.toFixed(4))} )`;switch(q.getTransfer(e)){case j:return[t,`LinearTransferOETF`];case M:return[t,`sRGBTransferOETF`];default:return F(`WebGLProgram: Unsupported color space: `,e),[t,`LinearTransferOETF`]}}function ho(e,t,n){let r=e.getShaderParameter(t,e.COMPILE_STATUS),i=(e.getShaderInfoLog(t)||``).trim();if(r&&i===``)return``;let a=/ERROR: 0:(\d+)/.exec(i);if(a){let r=parseInt(a[1]);return n.toUpperCase()+`

`+i+`

`+fo(e.getShaderSource(t),r)}else return i}function go(e,t){let n=mo(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( value.rgb * ${n[0]}, value.a ) );`,`}`].join(`
`)}let _o={1:`Linear`,2:`Reinhard`,3:`Cineon`,4:`ACESFilmic`,6:`AgX`,7:`Neutral`,5:`Custom`};function vo(e,t){let n=_o[t];return n===void 0?(F(`WebGLProgram: Unsupported toneMapping:`,t),`vec3 `+e+`( vec3 color ) { return LinearToneMapping( color ); }`):`vec3 `+e+`( vec3 color ) { return `+n+`ToneMapping( color ); }`}let yo=new W;function bo(){return q.getLuminanceCoefficients(yo),[`float luminance( const in vec3 rgb ) {`,`	const vec3 weights = vec3( ${yo.x.toFixed(4)}, ${yo.y.toFixed(4)}, ${yo.z.toFixed(4)} );`,`	return dot( weights, rgb );`,`}`].join(`
`)}function xo(e){return[e.extensionClipCullDistance?`#extension GL_ANGLE_clip_cull_distance : require`:``,e.extensionMultiDraw?`#extension GL_ANGLE_multi_draw : require`:``].filter(wo).join(`
`)}function So(e){let t=[];for(let n in e){let r=e[n];r!==!1&&t.push(`#define `+n+` `+r)}return t.join(`
`)}function Co(e,t){let n={},r=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let i=0;i<r;i++){let r=e.getActiveAttrib(t,i),a=r.name,o=1;r.type===e.FLOAT_MAT2&&(o=2),r.type===e.FLOAT_MAT3&&(o=3),r.type===e.FLOAT_MAT4&&(o=4),n[a]={type:r.type,location:e.getAttribLocation(t,a),locationSize:o}}return n}function wo(e){return e!==``}function To(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Eo(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}let Do=/^[ \t]*#include +<([\w\d./]+)>/gm;function Oo(e){return e.replace(Do,Ao)}let ko=new Map;function Ao(e,t){let n=X[t];if(n===void 0){let e=ko.get(t);if(e!==void 0)n=X[e],F(`WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.`,t,e);else throw Error(`Can not resolve #include <`+t+`>`)}return Oo(n)}let jo=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Mo(e){return e.replace(jo,No)}function No(e,t,n,r){let i=``;for(let e=parseInt(t);e<parseInt(n);e++)i+=r.replace(/\[\s*i\s*\]/g,`[ `+e+` ]`).replace(/UNROLLED_LOOP_INDEX/g,e);return i}function Po(e){let t=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;return e.precision===`highp`?t+=`
#define HIGH_PRECISION`:e.precision===`mediump`?t+=`
#define MEDIUM_PRECISION`:e.precision===`lowp`&&(t+=`
#define LOW_PRECISION`),t}let Fo={1:`SHADOWMAP_TYPE_PCF`,3:`SHADOWMAP_TYPE_VSM`};function Io(e){return Fo[e.shadowMapType]||`SHADOWMAP_TYPE_BASIC`}let Lo={301:`ENVMAP_TYPE_CUBE`,302:`ENVMAP_TYPE_CUBE`,306:`ENVMAP_TYPE_CUBE_UV`};function Ro(e){return e.envMap===!1?`ENVMAP_TYPE_CUBE`:Lo[e.envMapMode]||`ENVMAP_TYPE_CUBE`}let zo={302:`ENVMAP_MODE_REFRACTION`};function Bo(e){return e.envMap===!1?`ENVMAP_MODE_REFLECTION`:zo[e.envMapMode]||`ENVMAP_MODE_REFLECTION`}let Vo={0:`ENVMAP_BLENDING_MULTIPLY`,1:`ENVMAP_BLENDING_MIX`,2:`ENVMAP_BLENDING_ADD`};function Ho(e){return e.envMap===!1?`ENVMAP_BLENDING_NONE`:Vo[e.combine]||`ENVMAP_BLENDING_NONE`}function Uo(e){let t=e.envMapCubeUVHeight;if(t===null)return null;let n=Math.log2(t)-2,r=1/t;return{texelWidth:1/(3*Math.max(2**n,112)),texelHeight:r,maxMip:n}}function Wo(e,t,n,r){let i=e.getContext(),a=n.defines,o=n.vertexShader,s=n.fragmentShader,c=Io(n),l=Ro(n),u=Bo(n),d=Ho(n),f=Uo(n),p=xo(n),m=So(a),h=i.createProgram(),g,_,v=n.glslVersion?`#version `+n.glslVersion+`
`:``;n.isRawShaderMaterial?(g=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m].filter(wo).join(`
`),g.length>0&&(g+=`
`),_=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m].filter(wo).join(`
`),_.length>0&&(_+=`
`)):(g=[Po(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m,n.extensionClipCullDistance?`#define USE_CLIP_DISTANCE`:``,n.batching?`#define USE_BATCHING`:``,n.batchingColor?`#define USE_BATCHING_COLOR`:``,n.instancing?`#define USE_INSTANCING`:``,n.instancingColor?`#define USE_INSTANCING_COLOR`:``,n.instancingMorph?`#define USE_INSTANCING_MORPH`:``,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.map?`#define USE_MAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+u:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.displacementMap?`#define USE_DISPLACEMENTMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.mapUv?`#define MAP_UV `+n.mapUv:``,n.alphaMapUv?`#define ALPHAMAP_UV `+n.alphaMapUv:``,n.lightMapUv?`#define LIGHTMAP_UV `+n.lightMapUv:``,n.aoMapUv?`#define AOMAP_UV `+n.aoMapUv:``,n.emissiveMapUv?`#define EMISSIVEMAP_UV `+n.emissiveMapUv:``,n.bumpMapUv?`#define BUMPMAP_UV `+n.bumpMapUv:``,n.normalMapUv?`#define NORMALMAP_UV `+n.normalMapUv:``,n.displacementMapUv?`#define DISPLACEMENTMAP_UV `+n.displacementMapUv:``,n.metalnessMapUv?`#define METALNESSMAP_UV `+n.metalnessMapUv:``,n.roughnessMapUv?`#define ROUGHNESSMAP_UV `+n.roughnessMapUv:``,n.anisotropyMapUv?`#define ANISOTROPYMAP_UV `+n.anisotropyMapUv:``,n.clearcoatMapUv?`#define CLEARCOATMAP_UV `+n.clearcoatMapUv:``,n.clearcoatNormalMapUv?`#define CLEARCOAT_NORMALMAP_UV `+n.clearcoatNormalMapUv:``,n.clearcoatRoughnessMapUv?`#define CLEARCOAT_ROUGHNESSMAP_UV `+n.clearcoatRoughnessMapUv:``,n.iridescenceMapUv?`#define IRIDESCENCEMAP_UV `+n.iridescenceMapUv:``,n.iridescenceThicknessMapUv?`#define IRIDESCENCE_THICKNESSMAP_UV `+n.iridescenceThicknessMapUv:``,n.sheenColorMapUv?`#define SHEEN_COLORMAP_UV `+n.sheenColorMapUv:``,n.sheenRoughnessMapUv?`#define SHEEN_ROUGHNESSMAP_UV `+n.sheenRoughnessMapUv:``,n.specularMapUv?`#define SPECULARMAP_UV `+n.specularMapUv:``,n.specularColorMapUv?`#define SPECULAR_COLORMAP_UV `+n.specularColorMapUv:``,n.specularIntensityMapUv?`#define SPECULAR_INTENSITYMAP_UV `+n.specularIntensityMapUv:``,n.transmissionMapUv?`#define TRANSMISSIONMAP_UV `+n.transmissionMapUv:``,n.thicknessMapUv?`#define THICKNESSMAP_UV `+n.thicknessMapUv:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexNormals?`#define HAS_NORMAL`:``,n.vertexColors?`#define USE_COLOR`:``,n.vertexAlphas?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.flatShading?`#define FLAT_SHADED`:``,n.skinning?`#define USE_SKINNING`:``,n.morphTargets?`#define USE_MORPHTARGETS`:``,n.morphNormals&&n.flatShading===!1?`#define USE_MORPHNORMALS`:``,n.morphColors?`#define USE_MORPHCOLORS`:``,n.morphTargetsCount>0?`#define MORPHTARGETS_TEXTURE_STRIDE `+n.morphTextureStride:``,n.morphTargetsCount>0?`#define MORPHTARGETS_COUNT `+n.morphTargetsCount:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.sizeAttenuation?`#define USE_SIZEATTENUATION`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 modelMatrix;`,`uniform mat4 modelViewMatrix;`,`uniform mat4 projectionMatrix;`,`uniform mat4 viewMatrix;`,`uniform mat3 normalMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,`#ifdef USE_INSTANCING`,`	attribute mat4 instanceMatrix;`,`#endif`,`#ifdef USE_INSTANCING_COLOR`,`	attribute vec3 instanceColor;`,`#endif`,`#ifdef USE_INSTANCING_MORPH`,`	uniform sampler2D morphTexture;`,`#endif`,`attribute vec3 position;`,`attribute vec3 normal;`,`attribute vec2 uv;`,`#ifdef USE_UV1`,`	attribute vec2 uv1;`,`#endif`,`#ifdef USE_UV2`,`	attribute vec2 uv2;`,`#endif`,`#ifdef USE_UV3`,`	attribute vec2 uv3;`,`#endif`,`#ifdef USE_TANGENT`,`	attribute vec4 tangent;`,`#endif`,`#if defined( USE_COLOR_ALPHA )`,`	attribute vec4 color;`,`#elif defined( USE_COLOR )`,`	attribute vec3 color;`,`#endif`,`#ifdef USE_SKINNING`,`	attribute vec4 skinIndex;`,`	attribute vec4 skinWeight;`,`#endif`,`
`].filter(wo).join(`
`),_=[Po(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.alphaToCoverage?`#define ALPHA_TO_COVERAGE`:``,n.map?`#define USE_MAP`:``,n.matcap?`#define USE_MATCAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+l:``,n.envMap?`#define `+u:``,n.envMap?`#define `+d:``,f?`#define CUBEUV_TEXEL_WIDTH `+f.texelWidth:``,f?`#define CUBEUV_TEXEL_HEIGHT `+f.texelHeight:``,f?`#define CUBEUV_MAX_MIP `+f.maxMip+`.0`:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.packedNormalMap?`#define USE_PACKED_NORMALMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoat?`#define USE_CLEARCOAT`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.dispersion?`#define USE_DISPERSION`:``,n.iridescence?`#define USE_IRIDESCENCE`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaTest?`#define USE_ALPHATEST`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.sheen?`#define USE_SHEEN`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexColors||n.instancingColor?`#define USE_COLOR`:``,n.vertexAlphas||n.batchingColor?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.gradientMap?`#define USE_GRADIENTMAP`:``,n.flatShading?`#define FLAT_SHADED`:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.premultipliedAlpha?`#define PREMULTIPLIED_ALPHA`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.numLightProbeGrids>0?`#define USE_LIGHT_PROBES_GRID`:``,n.decodeVideoTexture?`#define DECODE_VIDEO_TEXTURE`:``,n.decodeVideoTextureEmissive?`#define DECODE_VIDEO_TEXTURE_EMISSIVE`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 viewMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,n.toneMapping===0?``:`#define TONE_MAPPING`,n.toneMapping===0?``:X.tonemapping_pars_fragment,n.toneMapping===0?``:vo(`toneMapping`,n.toneMapping),n.dithering?`#define DITHERING`:``,n.opaque?`#define OPAQUE`:``,X.colorspace_pars_fragment,go(`linearToOutputTexel`,n.outputColorSpace),bo(),n.useDepthPacking?`#define DEPTH_PACKING `+n.depthPacking:``,`
`].filter(wo).join(`
`)),o=Oo(o),o=To(o,n),o=Eo(o,n),s=Oo(s),s=To(s,n),s=Eo(s,n),o=Mo(o),s=Mo(s),n.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,g=[p,`#define attribute in`,`#define varying out`,`#define texture2D texture`].join(`
`)+`
`+g,_=[`#define varying in`,n.glslVersion===`300 es`?``:`layout(location = 0) out highp vec4 pc_fragColor;`,n.glslVersion===`300 es`?``:`#define gl_FragColor pc_fragColor`,`#define gl_FragDepthEXT gl_FragDepth`,`#define texture2D texture`,`#define textureCube texture`,`#define texture2DProj textureProj`,`#define texture2DLodEXT textureLod`,`#define texture2DProjLodEXT textureProjLod`,`#define textureCubeLodEXT textureLod`,`#define texture2DGradEXT textureGrad`,`#define texture2DProjGradEXT textureProjGrad`,`#define textureCubeGradEXT textureGrad`].join(`
`)+`
`+_);let y=v+g+o,b=v+_+s,x=lo(i,i.VERTEX_SHADER,y),S=lo(i,i.FRAGMENT_SHADER,b);i.attachShader(h,x),i.attachShader(h,S),n.index0AttributeName===void 0?n.morphTargets===!0&&i.bindAttribLocation(h,0,`position`):i.bindAttribLocation(h,0,n.index0AttributeName),i.linkProgram(h);function C(t){if(e.debug.checkShaderErrors){let n=i.getProgramInfoLog(h)||``,r=i.getShaderInfoLog(x)||``,a=i.getShaderInfoLog(S)||``,o=n.trim(),s=r.trim(),c=a.trim(),l=!0,u=!0;if(i.getProgramParameter(h,i.LINK_STATUS)===!1)if(l=!1,typeof e.debug.onShaderError==`function`)e.debug.onShaderError(i,h,x,S);else{let e=ho(i,x,`vertex`),n=ho(i,S,`fragment`);I(`THREE.WebGLProgram: Shader Error `+i.getError()+` - VALIDATE_STATUS `+i.getProgramParameter(h,i.VALIDATE_STATUS)+`

Material Name: `+t.name+`
Material Type: `+t.type+`

Program Info Log: `+o+`
`+e+`
`+n)}else o===``?(s===``||c===``)&&(u=!1):F(`WebGLProgram: Program Info Log:`,o);u&&(t.diagnostics={runnable:l,programLog:o,vertexShader:{log:s,prefix:g},fragmentShader:{log:c,prefix:_}})}i.deleteShader(x),i.deleteShader(S),w=new co(i,h),T=Co(i,h)}let w;this.getUniforms=function(){return w===void 0&&C(this),w};let T;this.getAttributes=function(){return T===void 0&&C(this),T};let E=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return E===!1&&(E=i.getProgramParameter(h,37297)),E},this.destroy=function(){r.releaseStatesOfProgram(this),i.deleteProgram(h),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=uo++,this.cacheKey=t,this.usedTimes=1,this.program=h,this.vertexShader=x,this.fragmentShader=S,this}let Go=0;var Ko=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,n=e.fragmentShader,r=this._getShaderStage(t),i=this._getShaderStage(n),a=this._getShaderCacheForMaterial(e);return a.has(r)===!1&&(a.add(r),r.usedTimes++),a.has(i)===!1&&(a.add(i),i.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let e of t)e.usedTimes--,e.usedTimes===0&&this.shaderCache.delete(e.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new qo(e),t.set(e,n)),n}},qo=class{constructor(e){this.id=Go++,this.code=e,this.usedTimes=0}};function Jo(e){return e===1030||e===37490||e===36285}function Yo(e,t,n,r,i,a){let o=new ut,s=new Ko,c=new Set,l=[],u=new Map,d=r.logarithmicDepthBuffer,f=r.precision,p={MeshDepthMaterial:`depth`,MeshDistanceMaterial:`distance`,MeshNormalMaterial:`normal`,MeshBasicMaterial:`basic`,MeshLambertMaterial:`lambert`,MeshPhongMaterial:`phong`,MeshToonMaterial:`toon`,MeshStandardMaterial:`physical`,MeshPhysicalMaterial:`physical`,MeshMatcapMaterial:`matcap`,LineBasicMaterial:`basic`,LineDashedMaterial:`dashed`,PointsMaterial:`points`,ShadowMaterial:`shadow`,SpriteMaterial:`sprite`};function m(e){return c.add(e),e===0?`uv`:`uv${e}`}function h(i,o,l,u,h,g){let _=u.fog,v=h.geometry,y=i.isMeshStandardMaterial||i.isMeshLambertMaterial||i.isMeshPhongMaterial?u.environment:null,b=i.isMeshStandardMaterial||i.isMeshLambertMaterial&&!i.envMap||i.isMeshPhongMaterial&&!i.envMap,x=t.get(i.envMap||y,b),S=x&&x.mapping===306?x.image.height:null,C=p[i.type];i.precision!==null&&(f=r.getMaxPrecision(i.precision),f!==i.precision&&F(`WebGLProgram.getParameters:`,i.precision,`not supported, using`,f,`instead.`));let w=v.morphAttributes.position||v.morphAttributes.normal||v.morphAttributes.color,T=w===void 0?0:w.length,E=0;v.morphAttributes.position!==void 0&&(E=1),v.morphAttributes.normal!==void 0&&(E=2),v.morphAttributes.color!==void 0&&(E=3);let D,O,ee,k;if(C){let e=bi[C];D=e.vertexShader,O=e.fragmentShader}else D=i.vertexShader,O=i.fragmentShader,s.update(i),ee=s.getVertexShaderID(i),k=s.getFragmentShaderID(i);let A=e.getRenderTarget(),j=e.state.buffers.depth.getReversed(),M=h.isInstancedMesh===!0,te=h.isBatchedMesh===!0,ne=!!i.map,N=!!i.matcap,re=!!x,P=!!i.aoMap,ie=!!i.lightMap,ae=!!i.bumpMap,oe=!!i.normalMap,se=!!i.displacementMap,I=!!i.emissiveMap,ce=!!i.metalnessMap,le=!!i.roughnessMap,ue=i.anisotropy>0,L=i.clearcoat>0,R=i.dispersion>0,de=i.iridescence>0,fe=i.sheen>0,pe=i.transmission>0,me=ue&&!!i.anisotropyMap,z=L&&!!i.clearcoatMap,he=L&&!!i.clearcoatNormalMap,ge=L&&!!i.clearcoatRoughnessMap,_e=de&&!!i.iridescenceMap,B=de&&!!i.iridescenceThicknessMap,ve=fe&&!!i.sheenColorMap,ye=fe&&!!i.sheenRoughnessMap,be=!!i.specularMap,xe=!!i.specularColorMap,Se=!!i.specularIntensityMap,Ce=pe&&!!i.transmissionMap,we=pe&&!!i.thicknessMap,Te=!!i.gradientMap,Ee=!!i.alphaMap,De=i.alphaTest>0,Oe=!!i.alphaHash,ke=!!i.extensions,Ae=0;i.toneMapped&&(A===null||A.isXRRenderTarget===!0)&&(Ae=e.toneMapping);let je={shaderID:C,shaderType:i.type,shaderName:i.name,vertexShader:D,fragmentShader:O,defines:i.defines,customVertexShaderID:ee,customFragmentShaderID:k,isRawShaderMaterial:i.isRawShaderMaterial===!0,glslVersion:i.glslVersion,precision:f,batching:te,batchingColor:te&&h._colorsTexture!==null,instancing:M,instancingColor:M&&h.instanceColor!==null,instancingMorph:M&&h.morphTexture!==null,outputColorSpace:A===null?e.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:q.workingColorSpace,alphaToCoverage:!!i.alphaToCoverage,map:ne,matcap:N,envMap:re,envMapMode:re&&x.mapping,envMapCubeUVHeight:S,aoMap:P,lightMap:ie,bumpMap:ae,normalMap:oe,displacementMap:se,emissiveMap:I,normalMapObjectSpace:oe&&i.normalMapType===1,normalMapTangentSpace:oe&&i.normalMapType===0,packedNormalMap:oe&&i.normalMapType===0&&Jo(i.normalMap.format),metalnessMap:ce,roughnessMap:le,anisotropy:ue,anisotropyMap:me,clearcoat:L,clearcoatMap:z,clearcoatNormalMap:he,clearcoatRoughnessMap:ge,dispersion:R,iridescence:de,iridescenceMap:_e,iridescenceThicknessMap:B,sheen:fe,sheenColorMap:ve,sheenRoughnessMap:ye,specularMap:be,specularColorMap:xe,specularIntensityMap:Se,transmission:pe,transmissionMap:Ce,thicknessMap:we,gradientMap:Te,opaque:i.transparent===!1&&i.blending===1&&i.alphaToCoverage===!1,alphaMap:Ee,alphaTest:De,alphaHash:Oe,combine:i.combine,mapUv:ne&&m(i.map.channel),aoMapUv:P&&m(i.aoMap.channel),lightMapUv:ie&&m(i.lightMap.channel),bumpMapUv:ae&&m(i.bumpMap.channel),normalMapUv:oe&&m(i.normalMap.channel),displacementMapUv:se&&m(i.displacementMap.channel),emissiveMapUv:I&&m(i.emissiveMap.channel),metalnessMapUv:ce&&m(i.metalnessMap.channel),roughnessMapUv:le&&m(i.roughnessMap.channel),anisotropyMapUv:me&&m(i.anisotropyMap.channel),clearcoatMapUv:z&&m(i.clearcoatMap.channel),clearcoatNormalMapUv:he&&m(i.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ge&&m(i.clearcoatRoughnessMap.channel),iridescenceMapUv:_e&&m(i.iridescenceMap.channel),iridescenceThicknessMapUv:B&&m(i.iridescenceThicknessMap.channel),sheenColorMapUv:ve&&m(i.sheenColorMap.channel),sheenRoughnessMapUv:ye&&m(i.sheenRoughnessMap.channel),specularMapUv:be&&m(i.specularMap.channel),specularColorMapUv:xe&&m(i.specularColorMap.channel),specularIntensityMapUv:Se&&m(i.specularIntensityMap.channel),transmissionMapUv:Ce&&m(i.transmissionMap.channel),thicknessMapUv:we&&m(i.thicknessMap.channel),alphaMapUv:Ee&&m(i.alphaMap.channel),vertexTangents:!!v.attributes.tangent&&(oe||ue),vertexNormals:!!v.attributes.normal,vertexColors:i.vertexColors,vertexAlphas:i.vertexColors===!0&&!!v.attributes.color&&v.attributes.color.itemSize===4,pointsUvs:h.isPoints===!0&&!!v.attributes.uv&&(ne||Ee),fog:!!_,useFog:i.fog===!0,fogExp2:!!_&&_.isFogExp2,flatShading:i.wireframe===!1&&(i.flatShading===!0||v.attributes.normal===void 0&&oe===!1&&(i.isMeshLambertMaterial||i.isMeshPhongMaterial||i.isMeshStandardMaterial||i.isMeshPhysicalMaterial)),sizeAttenuation:i.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:j,skinning:h.isSkinnedMesh===!0,morphTargets:v.morphAttributes.position!==void 0,morphNormals:v.morphAttributes.normal!==void 0,morphColors:v.morphAttributes.color!==void 0,morphTargetsCount:T,morphTextureStride:E,numDirLights:o.directional.length,numPointLights:o.point.length,numSpotLights:o.spot.length,numSpotLightMaps:o.spotLightMap.length,numRectAreaLights:o.rectArea.length,numHemiLights:o.hemi.length,numDirLightShadows:o.directionalShadowMap.length,numPointLightShadows:o.pointShadowMap.length,numSpotLightShadows:o.spotShadowMap.length,numSpotLightShadowsWithMaps:o.numSpotLightShadowsWithMaps,numLightProbes:o.numLightProbes,numLightProbeGrids:g.length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:i.dithering,shadowMapEnabled:e.shadowMap.enabled&&l.length>0,shadowMapType:e.shadowMap.type,toneMapping:Ae,decodeVideoTexture:ne&&i.map.isVideoTexture===!0&&q.getTransfer(i.map.colorSpace)===`srgb`,decodeVideoTextureEmissive:I&&i.emissiveMap.isVideoTexture===!0&&q.getTransfer(i.emissiveMap.colorSpace)===`srgb`,premultipliedAlpha:i.premultipliedAlpha,doubleSided:i.side===2,flipSided:i.side===1,useDepthPacking:i.depthPacking>=0,depthPacking:i.depthPacking||0,index0AttributeName:i.index0AttributeName,extensionClipCullDistance:ke&&i.extensions.clipCullDistance===!0&&n.has(`WEBGL_clip_cull_distance`),extensionMultiDraw:(ke&&i.extensions.multiDraw===!0||te)&&n.has(`WEBGL_multi_draw`),rendererExtensionParallelShaderCompile:n.has(`KHR_parallel_shader_compile`),customProgramCacheKey:i.customProgramCacheKey()};return je.vertexUv1s=c.has(1),je.vertexUv2s=c.has(2),je.vertexUv3s=c.has(3),c.clear(),je}function g(t){let n=[];if(t.shaderID?n.push(t.shaderID):(n.push(t.customVertexShaderID),n.push(t.customFragmentShaderID)),t.defines!==void 0)for(let e in t.defines)n.push(e),n.push(t.defines[e]);return t.isRawShaderMaterial===!1&&(_(n,t),v(n,t),n.push(e.outputColorSpace)),n.push(t.customProgramCacheKey),n.join()}function _(e,t){e.push(t.precision),e.push(t.outputColorSpace),e.push(t.envMapMode),e.push(t.envMapCubeUVHeight),e.push(t.mapUv),e.push(t.alphaMapUv),e.push(t.lightMapUv),e.push(t.aoMapUv),e.push(t.bumpMapUv),e.push(t.normalMapUv),e.push(t.displacementMapUv),e.push(t.emissiveMapUv),e.push(t.metalnessMapUv),e.push(t.roughnessMapUv),e.push(t.anisotropyMapUv),e.push(t.clearcoatMapUv),e.push(t.clearcoatNormalMapUv),e.push(t.clearcoatRoughnessMapUv),e.push(t.iridescenceMapUv),e.push(t.iridescenceThicknessMapUv),e.push(t.sheenColorMapUv),e.push(t.sheenRoughnessMapUv),e.push(t.specularMapUv),e.push(t.specularColorMapUv),e.push(t.specularIntensityMapUv),e.push(t.transmissionMapUv),e.push(t.thicknessMapUv),e.push(t.combine),e.push(t.fogExp2),e.push(t.sizeAttenuation),e.push(t.morphTargetsCount),e.push(t.morphAttributeCount),e.push(t.numDirLights),e.push(t.numPointLights),e.push(t.numSpotLights),e.push(t.numSpotLightMaps),e.push(t.numHemiLights),e.push(t.numRectAreaLights),e.push(t.numDirLightShadows),e.push(t.numPointLightShadows),e.push(t.numSpotLightShadows),e.push(t.numSpotLightShadowsWithMaps),e.push(t.numLightProbes),e.push(t.shadowMapType),e.push(t.toneMapping),e.push(t.numClippingPlanes),e.push(t.numClipIntersection),e.push(t.depthPacking)}function v(e,t){o.disableAll(),t.instancing&&o.enable(0),t.instancingColor&&o.enable(1),t.instancingMorph&&o.enable(2),t.matcap&&o.enable(3),t.envMap&&o.enable(4),t.normalMapObjectSpace&&o.enable(5),t.normalMapTangentSpace&&o.enable(6),t.clearcoat&&o.enable(7),t.iridescence&&o.enable(8),t.alphaTest&&o.enable(9),t.vertexColors&&o.enable(10),t.vertexAlphas&&o.enable(11),t.vertexUv1s&&o.enable(12),t.vertexUv2s&&o.enable(13),t.vertexUv3s&&o.enable(14),t.vertexTangents&&o.enable(15),t.anisotropy&&o.enable(16),t.alphaHash&&o.enable(17),t.batching&&o.enable(18),t.dispersion&&o.enable(19),t.batchingColor&&o.enable(20),t.gradientMap&&o.enable(21),t.packedNormalMap&&o.enable(22),t.vertexNormals&&o.enable(23),e.push(o.mask),o.disableAll(),t.fog&&o.enable(0),t.useFog&&o.enable(1),t.flatShading&&o.enable(2),t.logarithmicDepthBuffer&&o.enable(3),t.reversedDepthBuffer&&o.enable(4),t.skinning&&o.enable(5),t.morphTargets&&o.enable(6),t.morphNormals&&o.enable(7),t.morphColors&&o.enable(8),t.premultipliedAlpha&&o.enable(9),t.shadowMapEnabled&&o.enable(10),t.doubleSided&&o.enable(11),t.flipSided&&o.enable(12),t.useDepthPacking&&o.enable(13),t.dithering&&o.enable(14),t.transmission&&o.enable(15),t.sheen&&o.enable(16),t.opaque&&o.enable(17),t.pointsUvs&&o.enable(18),t.decodeVideoTexture&&o.enable(19),t.decodeVideoTextureEmissive&&o.enable(20),t.alphaToCoverage&&o.enable(21),t.numLightProbeGrids>0&&o.enable(22),e.push(o.mask)}function y(e){let t=p[e.type],n;if(t){let e=bi[t];n=Tr.clone(e.uniforms)}else n=e.uniforms;return n}function b(t,n){let r=u.get(n);return r===void 0?(r=new Wo(e,n,t,i),l.push(r),u.set(n,r)):++r.usedTimes,r}function x(e){if(--e.usedTimes===0){let t=l.indexOf(e);l[t]=l[l.length-1],l.pop(),u.delete(e.cacheKey),e.destroy()}}function S(e){s.remove(e)}function C(){s.dispose()}return{getParameters:h,getProgramCacheKey:g,getUniforms:y,acquireProgram:b,releaseProgram:x,releaseShaderCache:S,programs:l,dispose:C}}function Xo(){let e=new WeakMap;function t(t){return e.has(t)}function n(t){let n=e.get(t);return n===void 0&&(n={},e.set(t,n)),n}function r(t){e.delete(t)}function i(t,n,r){e.get(t)[n]=r}function a(){e=new WeakMap}return{has:t,get:n,remove:r,update:i,dispose:a}}function Zo(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.material.id===t.material.id?e.materialVariant===t.materialVariant?e.z===t.z?e.id-t.id:e.z-t.z:e.materialVariant-t.materialVariant:e.material.id-t.material.id:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function Qo(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.z===t.z?e.id-t.id:t.z-e.z:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function $o(){let e=[],t=0,n=[],r=[],i=[];function a(){t=0,n.length=0,r.length=0,i.length=0}function o(e){let t=0;return e.isInstancedMesh&&(t+=2),e.isSkinnedMesh&&(t+=1),t}function s(n,r,i,a,s,c){let l=e[t];return l===void 0?(l={id:n.id,object:n,geometry:r,material:i,materialVariant:o(n),groupOrder:a,renderOrder:n.renderOrder,z:s,group:c},e[t]=l):(l.id=n.id,l.object=n,l.geometry=r,l.material=i,l.materialVariant=o(n),l.groupOrder=a,l.renderOrder=n.renderOrder,l.z=s,l.group=c),t++,l}function c(e,t,a,o,c,l){let u=s(e,t,a,o,c,l);a.transmission>0?r.push(u):a.transparent===!0?i.push(u):n.push(u)}function l(e,t,a,o,c,l){let u=s(e,t,a,o,c,l);a.transmission>0?r.unshift(u):a.transparent===!0?i.unshift(u):n.unshift(u)}function u(e,t){n.length>1&&n.sort(e||Zo),r.length>1&&r.sort(t||Qo),i.length>1&&i.sort(t||Qo)}function d(){for(let n=t,r=e.length;n<r;n++){let t=e[n];if(t.id===null)break;t.id=null,t.object=null,t.geometry=null,t.material=null,t.group=null}}return{opaque:n,transmissive:r,transparent:i,init:a,push:c,unshift:l,finish:d,sort:u}}function es(){let e=new WeakMap;function t(t,n){let r=e.get(t),i;return r===void 0?(i=new $o,e.set(t,[i])):n>=r.length?(i=new $o,r.push(i)):i=r[n],i}function n(){e=new WeakMap}return{get:t,dispose:n}}function ts(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`DirectionalLight`:n={direction:new W,color:new Y};break;case`SpotLight`:n={position:new W,direction:new W,color:new Y,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case`PointLight`:n={position:new W,color:new Y,distance:0,decay:0};break;case`HemisphereLight`:n={direction:new W,skyColor:new Y,groundColor:new Y};break;case`RectAreaLight`:n={color:new Y,position:new W,halfWidth:new W,halfHeight:new W};break}return e[t.id]=n,n}}}function ns(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`DirectionalLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new H};break;case`SpotLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new H};break;case`PointLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new H,shadowCameraNear:1,shadowCameraFar:1e3};break}return e[t.id]=n,n}}}let rs=0;function is(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+ +!!t.map-!!e.map}function as(e){let t=new ts,n=ns(),r={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let e=0;e<9;e++)r.probe.push(new W);let i=new W,a=new et,o=new et;function s(i){let a=0,o=0,s=0;for(let e=0;e<9;e++)r.probe[e].set(0,0,0);let c=0,l=0,u=0,d=0,f=0,p=0,m=0,h=0,g=0,_=0,v=0;i.sort(is);for(let e=0,y=i.length;e<y;e++){let y=i[e],b=y.color,x=y.intensity,S=y.distance,C=null;if(y.shadow&&y.shadow.map&&(C=y.shadow.map.texture.format===1030?y.shadow.map.texture:y.shadow.map.depthTexture||y.shadow.map.texture),y.isAmbientLight)a+=b.r*x,o+=b.g*x,s+=b.b*x;else if(y.isLightProbe){for(let e=0;e<9;e++)r.probe[e].addScaledVector(y.sh.coefficients[e],x);v++}else if(y.isDirectionalLight){let e=t.get(y);if(e.color.copy(y.color).multiplyScalar(y.intensity),y.castShadow){let e=y.shadow,t=n.get(y);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,r.directionalShadow[c]=t,r.directionalShadowMap[c]=C,r.directionalShadowMatrix[c]=y.shadow.matrix,p++}r.directional[c]=e,c++}else if(y.isSpotLight){let e=t.get(y);e.position.setFromMatrixPosition(y.matrixWorld),e.color.copy(b).multiplyScalar(x),e.distance=S,e.coneCos=Math.cos(y.angle),e.penumbraCos=Math.cos(y.angle*(1-y.penumbra)),e.decay=y.decay,r.spot[u]=e;let i=y.shadow;if(y.map&&(r.spotLightMap[g]=y.map,g++,i.updateMatrices(y),y.castShadow&&_++),r.spotLightMatrix[u]=i.matrix,y.castShadow){let e=n.get(y);e.shadowIntensity=i.intensity,e.shadowBias=i.bias,e.shadowNormalBias=i.normalBias,e.shadowRadius=i.radius,e.shadowMapSize=i.mapSize,r.spotShadow[u]=e,r.spotShadowMap[u]=C,h++}u++}else if(y.isRectAreaLight){let e=t.get(y);e.color.copy(b).multiplyScalar(x),e.halfWidth.set(y.width*.5,0,0),e.halfHeight.set(0,y.height*.5,0),r.rectArea[d]=e,d++}else if(y.isPointLight){let e=t.get(y);if(e.color.copy(y.color).multiplyScalar(y.intensity),e.distance=y.distance,e.decay=y.decay,y.castShadow){let e=y.shadow,t=n.get(y);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,t.shadowCameraNear=e.camera.near,t.shadowCameraFar=e.camera.far,r.pointShadow[l]=t,r.pointShadowMap[l]=C,r.pointShadowMatrix[l]=y.shadow.matrix,m++}r.point[l]=e,l++}else if(y.isHemisphereLight){let e=t.get(y);e.skyColor.copy(y.color).multiplyScalar(x),e.groundColor.copy(y.groundColor).multiplyScalar(x),r.hemi[f]=e,f++}}d>0&&(e.has(`OES_texture_float_linear`)===!0?(r.rectAreaLTC1=Z.LTC_FLOAT_1,r.rectAreaLTC2=Z.LTC_FLOAT_2):(r.rectAreaLTC1=Z.LTC_HALF_1,r.rectAreaLTC2=Z.LTC_HALF_2)),r.ambient[0]=a,r.ambient[1]=o,r.ambient[2]=s;let y=r.hash;(y.directionalLength!==c||y.pointLength!==l||y.spotLength!==u||y.rectAreaLength!==d||y.hemiLength!==f||y.numDirectionalShadows!==p||y.numPointShadows!==m||y.numSpotShadows!==h||y.numSpotMaps!==g||y.numLightProbes!==v)&&(r.directional.length=c,r.spot.length=u,r.rectArea.length=d,r.point.length=l,r.hemi.length=f,r.directionalShadow.length=p,r.directionalShadowMap.length=p,r.pointShadow.length=m,r.pointShadowMap.length=m,r.spotShadow.length=h,r.spotShadowMap.length=h,r.directionalShadowMatrix.length=p,r.pointShadowMatrix.length=m,r.spotLightMatrix.length=h+g-_,r.spotLightMap.length=g,r.numSpotLightShadowsWithMaps=_,r.numLightProbes=v,y.directionalLength=c,y.pointLength=l,y.spotLength=u,y.rectAreaLength=d,y.hemiLength=f,y.numDirectionalShadows=p,y.numPointShadows=m,y.numSpotShadows=h,y.numSpotMaps=g,y.numLightProbes=v,r.version=rs++)}function c(e,t){let n=0,s=0,c=0,l=0,u=0,d=t.matrixWorldInverse;for(let t=0,f=e.length;t<f;t++){let f=e[t];if(f.isDirectionalLight){let e=r.directional[n];e.direction.setFromMatrixPosition(f.matrixWorld),i.setFromMatrixPosition(f.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(d),n++}else if(f.isSpotLight){let e=r.spot[c];e.position.setFromMatrixPosition(f.matrixWorld),e.position.applyMatrix4(d),e.direction.setFromMatrixPosition(f.matrixWorld),i.setFromMatrixPosition(f.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(d),c++}else if(f.isRectAreaLight){let e=r.rectArea[l];e.position.setFromMatrixPosition(f.matrixWorld),e.position.applyMatrix4(d),o.identity(),a.copy(f.matrixWorld),a.premultiply(d),o.extractRotation(a),e.halfWidth.set(f.width*.5,0,0),e.halfHeight.set(0,f.height*.5,0),e.halfWidth.applyMatrix4(o),e.halfHeight.applyMatrix4(o),l++}else if(f.isPointLight){let e=r.point[s];e.position.setFromMatrixPosition(f.matrixWorld),e.position.applyMatrix4(d),s++}else if(f.isHemisphereLight){let e=r.hemi[u];e.direction.setFromMatrixPosition(f.matrixWorld),e.direction.transformDirection(d),u++}}}return{setup:s,setupView:c,state:r}}function os(e){let t=new as(e),n=[],r=[],i=[];function a(e){d.camera=e,n.length=0,r.length=0,i.length=0}function o(e){n.push(e)}function s(e){r.push(e)}function c(e){i.push(e)}function l(){t.setup(n)}function u(e){t.setupView(n,e)}let d={lightsArray:n,shadowsArray:r,lightProbeGridArray:i,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:d,setupLights:l,setupLightsView:u,pushLight:o,pushShadow:s,pushLightProbeGrid:c}}function ss(e){let t=new WeakMap;function n(n,r=0){let i=t.get(n),a;return i===void 0?(a=new os(e),t.set(n,[a])):r>=i.length?(a=new os(e),i.push(a)):a=i[r],a}function r(){t=new WeakMap}return{get:n,dispose:r}}let cs=[new W(1,0,0),new W(-1,0,0),new W(0,1,0),new W(0,-1,0),new W(0,0,1),new W(0,0,-1)],ls=[new W(0,-1,0),new W(0,-1,0),new W(0,0,1),new W(0,0,-1),new W(0,-1,0),new W(0,-1,0)],us=new et,ds=new W,fs=new W;function ps(e,t,n){let r=new ur,i=new H,s=new H,c=new Ye,l=new Ar,p=new jr,m={},h=n.maxTextureSize,g={0:1,1:0,2:2},v=new Or({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new H},radius:{value:4}},vertexShader:`void main() {
	gl_Position = vec4( position, 1.0 );
}`,fragmentShader:`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`}),y=v.clone();y.defines.HORIZONTAL_PASS=1;let x=new An;x.setAttribute(`position`,new hn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let S=new $n(x,v),C=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let w=this.type;this.render=function(t,n,l){if(C.enabled===!1||C.autoUpdate===!1&&C.needsUpdate===!1||t.length===0)return;this.type===2&&(F(`WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead.`),this.type=1);let p=e.getRenderTarget(),m=e.getActiveCubeFace(),g=e.getActiveMipmapLevel(),v=e.state;v.setBlending(0),v.buffers.depth.getReversed()===!0?v.buffers.color.setClear(0,0,0,0):v.buffers.color.setClear(1,1,1,1),v.buffers.depth.setTest(!0),v.setScissorTest(!1);let y=w!==this.type;y&&n.traverse(function(e){e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.needsUpdate=!0):e.material.needsUpdate=!0)});for(let p=0,m=t.length;p<m;p++){let m=t[p],g=m.shadow;if(g===void 0){F(`WebGLShadowMap:`,m,`has no shadow.`);continue}if(g.autoUpdate===!1&&g.needsUpdate===!1)continue;i.copy(g.mapSize);let x=g.getFrameExtents();i.multiply(x),s.copy(g.mapSize),(i.x>h||i.y>h)&&(i.x>h&&(s.x=Math.floor(h/x.x),i.x=s.x*x.x,g.mapSize.x=s.x),i.y>h&&(s.y=Math.floor(h/x.y),i.y=s.y*x.y,g.mapSize.y=s.y));let S=e.state.buffers.depth.getReversed();if(g.camera._reversedDepth=S,g.map===null||y===!0){if(g.map!==null&&(g.map.depthTexture!==null&&(g.map.depthTexture.dispose(),g.map.depthTexture=null),g.map.dispose()),this.type===3){if(m.isPointLight){F(`WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.`);continue}g.map=new Ze(i.x,i.y,{format:b,type:f,minFilter:o,magFilter:o,generateMipmaps:!1}),g.map.texture.name=m.name+`.shadowMap`,g.map.depthTexture=new pr(i.x,i.y,d),g.map.depthTexture.name=m.name+`.shadowMapDepth`,g.map.depthTexture.format=_,g.map.depthTexture.compareFunction=null,g.map.depthTexture.minFilter=a,g.map.depthTexture.magFilter=a}else m.isPointLight?(g.map=new Ki(i.x),g.map.depthTexture=new mr(i.x,u)):(g.map=new Ze(i.x,i.y),g.map.depthTexture=new pr(i.x,i.y,u)),g.map.depthTexture.name=m.name+`.shadowMap`,g.map.depthTexture.format=_,this.type===1?(g.map.depthTexture.compareFunction=S?518:515,g.map.depthTexture.minFilter=o,g.map.depthTexture.magFilter=o):(g.map.depthTexture.compareFunction=null,g.map.depthTexture.minFilter=a,g.map.depthTexture.magFilter=a);g.camera.updateProjectionMatrix()}let C=g.map.isWebGLCubeRenderTarget?6:1;for(let t=0;t<C;t++){if(g.map.isWebGLCubeRenderTarget)e.setRenderTarget(g.map,t),e.clear();else{t===0&&(e.setRenderTarget(g.map),e.clear());let n=g.getViewport(t);c.set(s.x*n.x,s.y*n.y,s.x*n.z,s.y*n.w),v.viewport(c)}if(m.isPointLight){let e=g.camera,n=g.matrix,r=m.distance||e.far;r!==e.far&&(e.far=r,e.updateProjectionMatrix()),ds.setFromMatrixPosition(m.matrixWorld),e.position.copy(ds),fs.copy(e.position),fs.add(cs[t]),e.up.copy(ls[t]),e.lookAt(fs),e.updateMatrixWorld(),n.makeTranslation(-ds.x,-ds.y,-ds.z),us.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),g._frustum.setFromProjectionMatrix(us,e.coordinateSystem,e.reversedDepth)}else g.updateMatrices(m);r=g.getFrustum(),D(n,l,g.camera,m,this.type)}g.isPointLightShadow!==!0&&this.type===3&&T(g,l),g.needsUpdate=!1}w=this.type,C.needsUpdate=!1,e.setRenderTarget(p,m,g)};function T(n,r){let a=t.update(S);v.defines.VSM_SAMPLES!==n.blurSamples&&(v.defines.VSM_SAMPLES=n.blurSamples,y.defines.VSM_SAMPLES=n.blurSamples,v.needsUpdate=!0,y.needsUpdate=!0),n.mapPass===null&&(n.mapPass=new Ze(i.x,i.y,{format:b,type:f})),v.uniforms.shadow_pass.value=n.map.depthTexture,v.uniforms.resolution.value=n.mapSize,v.uniforms.radius.value=n.radius,e.setRenderTarget(n.mapPass),e.clear(),e.renderBufferDirect(r,null,a,v,S,null),y.uniforms.shadow_pass.value=n.mapPass.texture,y.uniforms.resolution.value=n.mapSize,y.uniforms.radius.value=n.radius,e.setRenderTarget(n.map),e.clear(),e.renderBufferDirect(r,null,a,y,S,null)}function E(t,n,r,i){let a=null,o=r.isPointLight===!0?t.customDistanceMaterial:t.customDepthMaterial;if(o!==void 0)a=o;else if(a=r.isPointLight===!0?p:l,e.localClippingEnabled&&n.clipShadows===!0&&Array.isArray(n.clippingPlanes)&&n.clippingPlanes.length!==0||n.displacementMap&&n.displacementScale!==0||n.alphaMap&&n.alphaTest>0||n.map&&n.alphaTest>0||n.alphaToCoverage===!0){let e=a.uuid,t=n.uuid,r=m[e];r===void 0&&(r={},m[e]=r);let i=r[t];i===void 0&&(i=a.clone(),r[t]=i,n.addEventListener(`dispose`,O)),a=i}if(a.visible=n.visible,a.wireframe=n.wireframe,i===3?a.side=n.shadowSide===null?n.side:n.shadowSide:a.side=n.shadowSide===null?g[n.side]:n.shadowSide,a.alphaMap=n.alphaMap,a.alphaTest=n.alphaToCoverage===!0?.5:n.alphaTest,a.map=n.map,a.clipShadows=n.clipShadows,a.clippingPlanes=n.clippingPlanes,a.clipIntersection=n.clipIntersection,a.displacementMap=n.displacementMap,a.displacementScale=n.displacementScale,a.displacementBias=n.displacementBias,a.wireframeLinewidth=n.wireframeLinewidth,a.linewidth=n.linewidth,r.isPointLight===!0&&a.isMeshDistanceMaterial===!0){let t=e.properties.get(a);t.light=r}return a}function D(n,i,a,o,s){if(n.visible===!1)return;if(n.layers.test(i.layers)&&(n.isMesh||n.isLine||n.isPoints)&&(n.castShadow||n.receiveShadow&&s===3)&&(!n.frustumCulled||r.intersectsObject(n))){n.modelViewMatrix.multiplyMatrices(a.matrixWorldInverse,n.matrixWorld);let r=t.update(n),c=n.material;if(Array.isArray(c)){let t=r.groups;for(let l=0,u=t.length;l<u;l++){let u=t[l],d=c[u.materialIndex];if(d&&d.visible){let t=E(n,d,o,s);n.onBeforeShadow(e,n,i,a,r,t,u),e.renderBufferDirect(a,null,r,t,n,u),n.onAfterShadow(e,n,i,a,r,t,u)}}}else if(c.visible){let t=E(n,c,o,s);n.onBeforeShadow(e,n,i,a,r,t,null),e.renderBufferDirect(a,null,r,t,n,null),n.onAfterShadow(e,n,i,a,r,t,null)}}let c=n.children;for(let e=0,t=c.length;e<t;e++)D(c[e],i,a,o,s)}function O(e){e.target.removeEventListener(`dispose`,O);for(let t in m){let n=m[t],r=e.target.uuid;r in n&&(n[r].dispose(),delete n[r])}}}function ms(e,t){function n(){let t=!1,n=new Ye,r=null,i=new Ye(0,0,0,0);return{setMask:function(n){r!==n&&!t&&(e.colorMask(n,n,n,n),r=n)},setLocked:function(e){t=e},setClear:function(t,r,a,o,s){s===!0&&(t*=o,r*=o,a*=o),n.set(t,r,a,o),i.equals(n)===!1&&(e.clearColor(t,r,a,o),i.copy(n))},reset:function(){t=!1,r=null,i.set(-1,0,0,0)}}}function r(){let n=!1,r=!1,i=null,a=null,o=null;return{setReversed:function(e){if(r!==e){let n=t.get(`EXT_clip_control`);e?n.clipControlEXT(n.LOWER_LEFT_EXT,n.ZERO_TO_ONE_EXT):n.clipControlEXT(n.LOWER_LEFT_EXT,n.NEGATIVE_ONE_TO_ONE_EXT),r=e;let i=o;o=null,this.setClear(i)}},getReversed:function(){return r},setTest:function(t){t?ce(e.DEPTH_TEST):le(e.DEPTH_TEST)},setMask:function(t){i!==t&&!n&&(e.depthMask(t),i=t)},setFunc:function(t){if(r&&(t=ue[t]),a!==t){switch(t){case 0:e.depthFunc(e.NEVER);break;case 1:e.depthFunc(e.ALWAYS);break;case 2:e.depthFunc(e.LESS);break;case 3:e.depthFunc(e.LEQUAL);break;case 4:e.depthFunc(e.EQUAL);break;case 5:e.depthFunc(e.GEQUAL);break;case 6:e.depthFunc(e.GREATER);break;case 7:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}a=t}},setLocked:function(e){n=e},setClear:function(t){o!==t&&(o=t,r&&(t=1-t),e.clearDepth(t))},reset:function(){n=!1,i=null,a=null,o=null,r=!1}}}function i(){let t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null;return{setTest:function(n){t||(n?ce(e.STENCIL_TEST):le(e.STENCIL_TEST))},setMask:function(r){n!==r&&!t&&(e.stencilMask(r),n=r)},setFunc:function(t,n,o){(r!==t||i!==n||a!==o)&&(e.stencilFunc(t,n,o),r=t,i=n,a=o)},setOp:function(t,n,r){(o!==t||s!==n||c!==r)&&(e.stencilOp(t,n,r),o=t,s=n,c=r)},setLocked:function(e){t=e},setClear:function(t){l!==t&&(e.clearStencil(t),l=t)},reset:function(){t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null}}}let a=new n,o=new r,s=new i,c=new WeakMap,l=new WeakMap,u={},d={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new Y(0,0,0),T=0,E=!1,D=null,O=null,ee=null,k=null,A=null,j=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),M=!1,te=0,ne=e.getParameter(e.VERSION);ne.indexOf(`WebGL`)===-1?ne.indexOf(`OpenGL ES`)!==-1&&(te=parseFloat(/^OpenGL ES (\d)/.exec(ne)[1]),M=te>=2):(te=parseFloat(/^WebGL (\d)/.exec(ne)[1]),M=te>=1);let N=null,re={},P=e.getParameter(e.SCISSOR_BOX),ie=e.getParameter(e.VIEWPORT),ae=new Ye().fromArray(P),oe=new Ye().fromArray(ie);function se(t,n,r,i){let a=new Uint8Array(4),o=e.createTexture();e.bindTexture(t,o),e.texParameteri(t,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(t,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let o=0;o<r;o++)t===e.TEXTURE_3D||t===e.TEXTURE_2D_ARRAY?e.texImage3D(n,0,e.RGBA,1,1,i,0,e.RGBA,e.UNSIGNED_BYTE,a):e.texImage2D(n+o,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,a);return o}let F={};F[e.TEXTURE_2D]=se(e.TEXTURE_2D,e.TEXTURE_2D,1),F[e.TEXTURE_CUBE_MAP]=se(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),F[e.TEXTURE_2D_ARRAY]=se(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),F[e.TEXTURE_3D]=se(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),o.setClear(1),s.setClear(0),ce(e.DEPTH_TEST),o.setFunc(3),he(!1),ge(1),ce(e.CULL_FACE),me(0);function ce(t){u[t]!==!0&&(e.enable(t),u[t]=!0)}function le(t){u[t]!==!1&&(e.disable(t),u[t]=!1)}function L(t,n){return f[t]===n?!1:(e.bindFramebuffer(t,n),f[t]=n,t===e.DRAW_FRAMEBUFFER&&(f[e.FRAMEBUFFER]=n),t===e.FRAMEBUFFER&&(f[e.DRAW_FRAMEBUFFER]=n),!0)}function R(t,n){let r=m,i=!1;if(t){r=p.get(n),r===void 0&&(r=[],p.set(n,r));let a=t.textures;if(r.length!==a.length||r[0]!==e.COLOR_ATTACHMENT0){for(let t=0,n=a.length;t<n;t++)r[t]=e.COLOR_ATTACHMENT0+t;r.length=a.length,i=!0}}else r[0]!==e.BACK&&(r[0]=e.BACK,i=!0);i&&e.drawBuffers(r)}function de(t){return h===t?!1:(e.useProgram(t),h=t,!0)}let fe={100:e.FUNC_ADD,101:e.FUNC_SUBTRACT,102:e.FUNC_REVERSE_SUBTRACT};fe[103]=e.MIN,fe[104]=e.MAX;let pe={200:e.ZERO,201:e.ONE,202:e.SRC_COLOR,204:e.SRC_ALPHA,210:e.SRC_ALPHA_SATURATE,208:e.DST_COLOR,206:e.DST_ALPHA,203:e.ONE_MINUS_SRC_COLOR,205:e.ONE_MINUS_SRC_ALPHA,209:e.ONE_MINUS_DST_COLOR,207:e.ONE_MINUS_DST_ALPHA,211:e.CONSTANT_COLOR,212:e.ONE_MINUS_CONSTANT_COLOR,213:e.CONSTANT_ALPHA,214:e.ONE_MINUS_CONSTANT_ALPHA};function me(t,n,r,i,a,o,s,c,l,u){if(t===0){g===!0&&(le(e.BLEND),g=!1);return}if(g===!1&&(ce(e.BLEND),g=!0),t!==5){if(t!==_||u!==E){if((v!==100||x!==100)&&(e.blendEquation(e.FUNC_ADD),v=100,x=100),u)switch(t){case 1:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFunc(e.ONE,e.ONE);break;case 3:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case 4:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:I(`WebGLState: Invalid blending: `,t);break}else switch(t){case 1:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case 3:I(`WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true`);break;case 4:I(`WebGLState: MultiplyBlending requires material.premultipliedAlpha = true`);break;default:I(`WebGLState: Invalid blending: `,t);break}y=null,b=null,S=null,C=null,w.set(0,0,0),T=0,_=t,E=u}return}a||=n,o||=r,s||=i,(n!==v||a!==x)&&(e.blendEquationSeparate(fe[n],fe[a]),v=n,x=a),(r!==y||i!==b||o!==S||s!==C)&&(e.blendFuncSeparate(pe[r],pe[i],pe[o],pe[s]),y=r,b=i,S=o,C=s),(c.equals(w)===!1||l!==T)&&(e.blendColor(c.r,c.g,c.b,l),w.copy(c),T=l),_=t,E=!1}function z(t,n){t.side===2?le(e.CULL_FACE):ce(e.CULL_FACE);let r=t.side===1;n&&(r=!r),he(r),t.blending===1&&t.transparent===!1?me(0):me(t.blending,t.blendEquation,t.blendSrc,t.blendDst,t.blendEquationAlpha,t.blendSrcAlpha,t.blendDstAlpha,t.blendColor,t.blendAlpha,t.premultipliedAlpha),o.setFunc(t.depthFunc),o.setTest(t.depthTest),o.setMask(t.depthWrite),a.setMask(t.colorWrite);let i=t.stencilWrite;s.setTest(i),i&&(s.setMask(t.stencilWriteMask),s.setFunc(t.stencilFunc,t.stencilRef,t.stencilFuncMask),s.setOp(t.stencilFail,t.stencilZFail,t.stencilZPass)),B(t.polygonOffset,t.polygonOffsetFactor,t.polygonOffsetUnits),t.alphaToCoverage===!0?ce(e.SAMPLE_ALPHA_TO_COVERAGE):le(e.SAMPLE_ALPHA_TO_COVERAGE)}function he(t){D!==t&&(t?e.frontFace(e.CW):e.frontFace(e.CCW),D=t)}function ge(t){t===0?le(e.CULL_FACE):(ce(e.CULL_FACE),t!==O&&(t===1?e.cullFace(e.BACK):t===2?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))),O=t}function _e(t){t!==ee&&(M&&e.lineWidth(t),ee=t)}function B(t,n,r){t?(ce(e.POLYGON_OFFSET_FILL),(k!==n||A!==r)&&(k=n,A=r,o.getReversed()&&(n=-n),e.polygonOffset(n,r))):le(e.POLYGON_OFFSET_FILL)}function ve(t){t?ce(e.SCISSOR_TEST):le(e.SCISSOR_TEST)}function ye(t){t===void 0&&(t=e.TEXTURE0+j-1),N!==t&&(e.activeTexture(t),N=t)}function be(t,n,r){r===void 0&&(r=N===null?e.TEXTURE0+j-1:N);let i=re[r];i===void 0&&(i={type:void 0,texture:void 0},re[r]=i),(i.type!==t||i.texture!==n)&&(N!==r&&(e.activeTexture(r),N=r),e.bindTexture(t,n||F[t]),i.type=t,i.texture=n)}function xe(){let t=re[N];t!==void 0&&t.type!==void 0&&(e.bindTexture(t.type,null),t.type=void 0,t.texture=void 0)}function Se(){try{e.compressedTexImage2D(...arguments)}catch(e){I(`WebGLState:`,e)}}function Ce(){try{e.compressedTexImage3D(...arguments)}catch(e){I(`WebGLState:`,e)}}function we(){try{e.texSubImage2D(...arguments)}catch(e){I(`WebGLState:`,e)}}function Te(){try{e.texSubImage3D(...arguments)}catch(e){I(`WebGLState:`,e)}}function Ee(){try{e.compressedTexSubImage2D(...arguments)}catch(e){I(`WebGLState:`,e)}}function De(){try{e.compressedTexSubImage3D(...arguments)}catch(e){I(`WebGLState:`,e)}}function Oe(){try{e.texStorage2D(...arguments)}catch(e){I(`WebGLState:`,e)}}function ke(){try{e.texStorage3D(...arguments)}catch(e){I(`WebGLState:`,e)}}function Ae(){try{e.texImage2D(...arguments)}catch(e){I(`WebGLState:`,e)}}function je(){try{e.texImage3D(...arguments)}catch(e){I(`WebGLState:`,e)}}function V(t){return d[t]===void 0?e.getParameter(t):d[t]}function Me(t,n){d[t]!==n&&(e.pixelStorei(t,n),d[t]=n)}function Ne(t){ae.equals(t)===!1&&(e.scissor(t.x,t.y,t.z,t.w),ae.copy(t))}function H(t){oe.equals(t)===!1&&(e.viewport(t.x,t.y,t.z,t.w),oe.copy(t))}function U(t,n){let r=l.get(n);r===void 0&&(r=new WeakMap,l.set(n,r));let i=r.get(t);i===void 0&&(i=e.getUniformBlockIndex(n,t.name),r.set(t,i))}function W(t,n){let r=l.get(n).get(t);c.get(n)!==r&&(e.uniformBlockBinding(n,r,t.__bindingPointIndex),c.set(n,r))}function Pe(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),u={},d={},N=null,re={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new Y(0,0,0),T=0,E=!1,D=null,O=null,ee=null,k=null,A=null,ae.set(0,0,e.canvas.width,e.canvas.height),oe.set(0,0,e.canvas.width,e.canvas.height),a.reset(),o.reset(),s.reset()}return{buffers:{color:a,depth:o,stencil:s},enable:ce,disable:le,bindFramebuffer:L,drawBuffers:R,useProgram:de,setBlending:me,setMaterial:z,setFlipSided:he,setCullFace:ge,setLineWidth:_e,setPolygonOffset:B,setScissorTest:ve,activeTexture:ye,bindTexture:be,unbindTexture:xe,compressedTexImage2D:Se,compressedTexImage3D:Ce,texImage2D:Ae,texImage3D:je,pixelStorei:Me,getParameter:V,updateUBOMapping:U,uniformBlockBinding:W,texStorage2D:Oe,texStorage3D:ke,texSubImage2D:we,texSubImage3D:Te,compressedTexSubImage2D:Ee,compressedTexSubImage3D:De,scissor:Ne,viewport:H,reset:Pe}}function hs(e,t,c,l,u,d,f){let p=t.has(`WEBGL_multisampled_render_to_texture`)?t.get(`WEBGL_multisampled_render_to_texture`):null,m=typeof navigator>`u`?!1:/OculusBrowser/g.test(navigator.userAgent),h=new H,g=new WeakMap,_=new Set,y,b=new WeakMap,x=!1;try{x=typeof OffscreenCanvas<`u`&&new OffscreenCanvas(1,1).getContext(`2d`)!==null}catch{}function S(e,t){return x?new OffscreenCanvas(e,t):P(`canvas`)}function C(e,t,n){let r=1,i=je(e);if((i.width>n||i.height>n)&&(r=n/Math.max(i.width,i.height)),r<1)if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof VideoFrame<`u`&&e instanceof VideoFrame){let n=Math.floor(r*i.width),a=Math.floor(r*i.height);y===void 0&&(y=S(n,a));let o=t?S(n,a):y;return o.width=n,o.height=a,o.getContext(`2d`).drawImage(e,0,0,n,a),F(`WebGLRenderer: Texture has been resized from (`+i.width+`x`+i.height+`) to (`+n+`x`+a+`).`),o}else return`data`in e&&F(`WebGLRenderer: Image in DataTexture is too big (`+i.width+`x`+i.height+`).`),e;return e}function w(e){return e.generateMipmaps}function T(t){e.generateMipmap(t)}function E(t){return t.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:t.isWebGL3DRenderTarget?e.TEXTURE_3D:t.isWebGLArrayRenderTarget||t.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function D(n,r,i,a,o,s=!1){if(n!==null){if(e[n]!==void 0)return e[n];F(`WebGLRenderer: Attempt to use non-existing WebGL internal format '`+n+`'`)}let c;a&&(c=t.get(`EXT_texture_norm16`),c||F(`WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension`));let l=r;if(r===e.RED&&(i===e.FLOAT&&(l=e.R32F),i===e.HALF_FLOAT&&(l=e.R16F),i===e.UNSIGNED_BYTE&&(l=e.R8),i===e.UNSIGNED_SHORT&&c&&(l=c.R16_EXT),i===e.SHORT&&c&&(l=c.R16_SNORM_EXT)),r===e.RED_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.R8UI),i===e.UNSIGNED_SHORT&&(l=e.R16UI),i===e.UNSIGNED_INT&&(l=e.R32UI),i===e.BYTE&&(l=e.R8I),i===e.SHORT&&(l=e.R16I),i===e.INT&&(l=e.R32I)),r===e.RG&&(i===e.FLOAT&&(l=e.RG32F),i===e.HALF_FLOAT&&(l=e.RG16F),i===e.UNSIGNED_BYTE&&(l=e.RG8),i===e.UNSIGNED_SHORT&&c&&(l=c.RG16_EXT),i===e.SHORT&&c&&(l=c.RG16_SNORM_EXT)),r===e.RG_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RG8UI),i===e.UNSIGNED_SHORT&&(l=e.RG16UI),i===e.UNSIGNED_INT&&(l=e.RG32UI),i===e.BYTE&&(l=e.RG8I),i===e.SHORT&&(l=e.RG16I),i===e.INT&&(l=e.RG32I)),r===e.RGB_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGB8UI),i===e.UNSIGNED_SHORT&&(l=e.RGB16UI),i===e.UNSIGNED_INT&&(l=e.RGB32UI),i===e.BYTE&&(l=e.RGB8I),i===e.SHORT&&(l=e.RGB16I),i===e.INT&&(l=e.RGB32I)),r===e.RGBA_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGBA8UI),i===e.UNSIGNED_SHORT&&(l=e.RGBA16UI),i===e.UNSIGNED_INT&&(l=e.RGBA32UI),i===e.BYTE&&(l=e.RGBA8I),i===e.SHORT&&(l=e.RGBA16I),i===e.INT&&(l=e.RGBA32I)),r===e.RGB&&(i===e.UNSIGNED_SHORT&&c&&(l=c.RGB16_EXT),i===e.SHORT&&c&&(l=c.RGB16_SNORM_EXT),i===e.UNSIGNED_INT_5_9_9_9_REV&&(l=e.RGB9_E5),i===e.UNSIGNED_INT_10F_11F_11F_REV&&(l=e.R11F_G11F_B10F)),r===e.RGBA){let t=s?j:q.getTransfer(o);i===e.FLOAT&&(l=e.RGBA32F),i===e.HALF_FLOAT&&(l=e.RGBA16F),i===e.UNSIGNED_BYTE&&(l=t===`srgb`?e.SRGB8_ALPHA8:e.RGBA8),i===e.UNSIGNED_SHORT&&c&&(l=c.RGBA16_EXT),i===e.SHORT&&c&&(l=c.RGBA16_SNORM_EXT),i===e.UNSIGNED_SHORT_4_4_4_4&&(l=e.RGBA4),i===e.UNSIGNED_SHORT_5_5_5_1&&(l=e.RGB5_A1)}return(l===e.R16F||l===e.R32F||l===e.RG16F||l===e.RG32F||l===e.RGBA16F||l===e.RGBA32F)&&t.get(`EXT_color_buffer_float`),l}function O(t,n){let r;return t?n===null||n===1014||n===1020?r=e.DEPTH24_STENCIL8:n===1015?r=e.DEPTH32F_STENCIL8:n===1012&&(r=e.DEPTH24_STENCIL8,F(`DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.`)):n===null||n===1014||n===1020?r=e.DEPTH_COMPONENT24:n===1015?r=e.DEPTH_COMPONENT32F:n===1012&&(r=e.DEPTH_COMPONENT16),r}function ee(e,t){return w(e)===!0||e.isFramebufferTexture&&e.minFilter!==1003&&e.minFilter!==1006?Math.log2(Math.max(t.width,t.height))+1:e.mipmaps!==void 0&&e.mipmaps.length>0?e.mipmaps.length:e.isCompressedTexture&&Array.isArray(e.image)?t.mipmaps.length:1}function k(e){let t=e.target;t.removeEventListener(`dispose`,k),M(t),t.isVideoTexture&&g.delete(t),t.isHTMLTexture&&_.delete(t)}function A(e){let t=e.target;t.removeEventListener(`dispose`,A),ne(t)}function M(e){let t=l.get(e);if(t.__webglInit===void 0)return;let n=e.source,r=b.get(n);if(r){let i=r[t.__cacheKey];i.usedTimes--,i.usedTimes===0&&te(e),Object.keys(r).length===0&&b.delete(n)}l.remove(e)}function te(t){let n=l.get(t);e.deleteTexture(n.__webglTexture);let r=t.source,i=b.get(r);delete i[n.__cacheKey],f.memory.textures--}function ne(t){let n=l.get(t);if(t.depthTexture&&(t.depthTexture.dispose(),l.remove(t.depthTexture)),t.isWebGLCubeRenderTarget)for(let t=0;t<6;t++){if(Array.isArray(n.__webglFramebuffer[t]))for(let r=0;r<n.__webglFramebuffer[t].length;r++)e.deleteFramebuffer(n.__webglFramebuffer[t][r]);else e.deleteFramebuffer(n.__webglFramebuffer[t]);n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer[t])}else{if(Array.isArray(n.__webglFramebuffer))for(let t=0;t<n.__webglFramebuffer.length;t++)e.deleteFramebuffer(n.__webglFramebuffer[t]);else e.deleteFramebuffer(n.__webglFramebuffer);if(n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer),n.__webglMultisampledFramebuffer&&e.deleteFramebuffer(n.__webglMultisampledFramebuffer),n.__webglColorRenderbuffer)for(let t=0;t<n.__webglColorRenderbuffer.length;t++)n.__webglColorRenderbuffer[t]&&e.deleteRenderbuffer(n.__webglColorRenderbuffer[t]);n.__webglDepthRenderbuffer&&e.deleteRenderbuffer(n.__webglDepthRenderbuffer)}let r=t.textures;for(let t=0,n=r.length;t<n;t++){let n=l.get(r[t]);n.__webglTexture&&(e.deleteTexture(n.__webglTexture),f.memory.textures--),l.remove(r[t])}l.remove(t)}let N=0;function re(){N=0}function ie(){return N}function ae(e){N=e}function oe(){let e=N;return e>=u.maxTextures&&F(`WebGLTextures: Trying to use `+e+` texture units while this GPU supports only `+u.maxTextures),N+=1,e}function se(e){let t=[];return t.push(e.wrapS),t.push(e.wrapT),t.push(e.wrapR||0),t.push(e.magFilter),t.push(e.minFilter),t.push(e.anisotropy),t.push(e.internalFormat),t.push(e.format),t.push(e.type),t.push(e.generateMipmaps),t.push(e.premultiplyAlpha),t.push(e.flipY),t.push(e.unpackAlignment),t.push(e.colorSpace),t.join()}function ce(t,n){let r=l.get(t);if(t.isVideoTexture&&ke(t),t.isRenderTargetTexture===!1&&t.isExternalTexture!==!0&&t.version>0&&r.__version!==t.version){let e=t.image;if(e===null)F(`WebGLRenderer: Texture marked for update but no image data found.`);else if(e.complete===!1)F(`WebGLRenderer: Texture marked for update but image is incomplete`);else{ge(r,t,n);return}}else t.isExternalTexture&&(r.__webglTexture=t.sourceTexture?t.sourceTexture:null);c.bindTexture(e.TEXTURE_2D,r.__webglTexture,e.TEXTURE0+n)}function le(t,n){let r=l.get(t);if(t.isRenderTargetTexture===!1&&t.version>0&&r.__version!==t.version){ge(r,t,n);return}else t.isExternalTexture&&(r.__webglTexture=t.sourceTexture?t.sourceTexture:null);c.bindTexture(e.TEXTURE_2D_ARRAY,r.__webglTexture,e.TEXTURE0+n)}function ue(t,n){let r=l.get(t);if(t.isRenderTargetTexture===!1&&t.version>0&&r.__version!==t.version){ge(r,t,n);return}c.bindTexture(e.TEXTURE_3D,r.__webglTexture,e.TEXTURE0+n)}function L(t,n){let r=l.get(t);if(t.isCubeDepthTexture!==!0&&t.version>0&&r.__version!==t.version){_e(r,t,n);return}c.bindTexture(e.TEXTURE_CUBE_MAP,r.__webglTexture,e.TEXTURE0+n)}let R={[n]:e.REPEAT,[r]:e.CLAMP_TO_EDGE,[i]:e.MIRRORED_REPEAT},de={[a]:e.NEAREST,1004:e.NEAREST_MIPMAP_NEAREST,1005:e.NEAREST_MIPMAP_LINEAR,[o]:e.LINEAR,1007:e.LINEAR_MIPMAP_NEAREST,[s]:e.LINEAR_MIPMAP_LINEAR},fe={512:e.NEVER,519:e.ALWAYS,513:e.LESS,515:e.LEQUAL,514:e.EQUAL,518:e.GEQUAL,516:e.GREATER,517:e.NOTEQUAL};function pe(n,r){if(r.type===1015&&t.has(`OES_texture_float_linear`)===!1&&(r.magFilter===1006||r.magFilter===1007||r.magFilter===1005||r.magFilter===1008||r.minFilter===1006||r.minFilter===1007||r.minFilter===1005||r.minFilter===1008)&&F(`WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.`),e.texParameteri(n,e.TEXTURE_WRAP_S,R[r.wrapS]),e.texParameteri(n,e.TEXTURE_WRAP_T,R[r.wrapT]),(n===e.TEXTURE_3D||n===e.TEXTURE_2D_ARRAY)&&e.texParameteri(n,e.TEXTURE_WRAP_R,R[r.wrapR]),e.texParameteri(n,e.TEXTURE_MAG_FILTER,de[r.magFilter]),e.texParameteri(n,e.TEXTURE_MIN_FILTER,de[r.minFilter]),r.compareFunction&&(e.texParameteri(n,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(n,e.TEXTURE_COMPARE_FUNC,fe[r.compareFunction])),t.has(`EXT_texture_filter_anisotropic`)===!0){if(r.magFilter===1003||r.minFilter!==1005&&r.minFilter!==1008||r.type===1015&&t.has(`OES_texture_float_linear`)===!1)return;if(r.anisotropy>1||l.get(r).__currentAnisotropy){let i=t.get(`EXT_texture_filter_anisotropic`);e.texParameterf(n,i.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(r.anisotropy,u.getMaxAnisotropy())),l.get(r).__currentAnisotropy=r.anisotropy}}}function me(t,n){let r=!1;t.__webglInit===void 0&&(t.__webglInit=!0,n.addEventListener(`dispose`,k));let i=n.source,a=b.get(i);a===void 0&&(a={},b.set(i,a));let o=se(n);if(o!==t.__cacheKey){a[o]===void 0&&(a[o]={texture:e.createTexture(),usedTimes:0},f.memory.textures++,r=!0),a[o].usedTimes++;let i=a[t.__cacheKey];i!==void 0&&(a[t.__cacheKey].usedTimes--,i.usedTimes===0&&te(n)),t.__cacheKey=o,t.__webglTexture=a[o].texture}return r}function z(e,t,n){return Math.floor(Math.floor(e/n)/t)}function he(t,n,r,i){let a=t.updateRanges;if(a.length===0)c.texSubImage2D(e.TEXTURE_2D,0,0,0,n.width,n.height,r,i,n.data);else{a.sort((e,t)=>e.start-t.start);let o=0;for(let e=1;e<a.length;e++){let t=a[o],r=a[e],i=t.start+t.count,s=z(r.start,n.width,4),c=z(t.start,n.width,4);r.start<=i+1&&s===c&&z(r.start+r.count-1,n.width,4)===s?t.count=Math.max(t.count,r.start+r.count-t.start):(++o,a[o]=r)}a.length=o+1;let s=c.getParameter(e.UNPACK_ROW_LENGTH),l=c.getParameter(e.UNPACK_SKIP_PIXELS),u=c.getParameter(e.UNPACK_SKIP_ROWS);c.pixelStorei(e.UNPACK_ROW_LENGTH,n.width);for(let t=0,o=a.length;t<o;t++){let o=a[t],s=Math.floor(o.start/4),l=Math.ceil(o.count/4),u=s%n.width,d=Math.floor(s/n.width),f=l;c.pixelStorei(e.UNPACK_SKIP_PIXELS,u),c.pixelStorei(e.UNPACK_SKIP_ROWS,d),c.texSubImage2D(e.TEXTURE_2D,0,u,d,f,1,r,i,n.data)}t.clearUpdateRanges(),c.pixelStorei(e.UNPACK_ROW_LENGTH,s),c.pixelStorei(e.UNPACK_SKIP_PIXELS,l),c.pixelStorei(e.UNPACK_SKIP_ROWS,u)}}function ge(t,n,r){let i=e.TEXTURE_2D;(n.isDataArrayTexture||n.isCompressedArrayTexture)&&(i=e.TEXTURE_2D_ARRAY),n.isData3DTexture&&(i=e.TEXTURE_3D);let a=me(t,n),o=n.source;c.bindTexture(i,t.__webglTexture,e.TEXTURE0+r);let s=l.get(o);if(o.version!==s.__version||a===!0){if(c.activeTexture(e.TEXTURE0+r),!(typeof ImageBitmap<`u`&&n.image instanceof ImageBitmap)){let t=q.getPrimaries(q.workingColorSpace),r=n.colorSpace===``?null:q.getPrimaries(n.colorSpace),i=n.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;c.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,n.flipY),c.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,n.premultiplyAlpha),c.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,i)}c.pixelStorei(e.UNPACK_ALIGNMENT,n.unpackAlignment);let t=C(n.image,!1,u.maxTextureSize);t=Ae(n,t);let l=d.convert(n.format,n.colorSpace),f=d.convert(n.type),p=D(n.internalFormat,l,f,n.normalized,n.colorSpace,n.isVideoTexture);pe(i,n);let m,h=n.mipmaps,g=n.isVideoTexture!==!0,y=s.__version===void 0||a===!0,b=o.dataReady,x=ee(n,t);if(n.isDepthTexture)p=O(n.format===v,n.type),y&&(g?c.texStorage2D(e.TEXTURE_2D,1,p,t.width,t.height):c.texImage2D(e.TEXTURE_2D,0,p,t.width,t.height,0,l,f,null));else if(n.isDataTexture)if(h.length>0){g&&y&&c.texStorage2D(e.TEXTURE_2D,x,p,h[0].width,h[0].height);for(let t=0,n=h.length;t<n;t++)m=h[t],g?b&&c.texSubImage2D(e.TEXTURE_2D,t,0,0,m.width,m.height,l,f,m.data):c.texImage2D(e.TEXTURE_2D,t,p,m.width,m.height,0,l,f,m.data);n.generateMipmaps=!1}else g?(y&&c.texStorage2D(e.TEXTURE_2D,x,p,t.width,t.height),b&&he(n,t,l,f)):c.texImage2D(e.TEXTURE_2D,0,p,t.width,t.height,0,l,f,t.data);else if(n.isCompressedTexture)if(n.isCompressedArrayTexture){g&&y&&c.texStorage3D(e.TEXTURE_2D_ARRAY,x,p,h[0].width,h[0].height,t.depth);for(let r=0,i=h.length;r<i;r++)if(m=h[r],n.format!==1023)if(l!==null)if(g){if(b)if(n.layerUpdates.size>0){let t=gi(m.width,m.height,n.format,n.type);for(let i of n.layerUpdates){let n=m.data.subarray(i*t/m.data.BYTES_PER_ELEMENT,(i+1)*t/m.data.BYTES_PER_ELEMENT);c.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,r,0,0,i,m.width,m.height,1,l,n)}n.clearLayerUpdates()}else c.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,r,0,0,0,m.width,m.height,t.depth,l,m.data)}else c.compressedTexImage3D(e.TEXTURE_2D_ARRAY,r,p,m.width,m.height,t.depth,0,m.data,0,0);else F(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`);else g?b&&c.texSubImage3D(e.TEXTURE_2D_ARRAY,r,0,0,0,m.width,m.height,t.depth,l,f,m.data):c.texImage3D(e.TEXTURE_2D_ARRAY,r,p,m.width,m.height,t.depth,0,l,f,m.data)}else{g&&y&&c.texStorage2D(e.TEXTURE_2D,x,p,h[0].width,h[0].height);for(let t=0,r=h.length;t<r;t++)m=h[t],n.format===1023?g?b&&c.texSubImage2D(e.TEXTURE_2D,t,0,0,m.width,m.height,l,f,m.data):c.texImage2D(e.TEXTURE_2D,t,p,m.width,m.height,0,l,f,m.data):l===null?F(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`):g?b&&c.compressedTexSubImage2D(e.TEXTURE_2D,t,0,0,m.width,m.height,l,m.data):c.compressedTexImage2D(e.TEXTURE_2D,t,p,m.width,m.height,0,m.data)}else if(n.isDataArrayTexture)if(g){if(y&&c.texStorage3D(e.TEXTURE_2D_ARRAY,x,p,t.width,t.height,t.depth),b)if(n.layerUpdates.size>0){let r=gi(t.width,t.height,n.format,n.type);for(let i of n.layerUpdates){let n=t.data.subarray(i*r/t.data.BYTES_PER_ELEMENT,(i+1)*r/t.data.BYTES_PER_ELEMENT);c.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,i,t.width,t.height,1,l,f,n)}n.clearLayerUpdates()}else c.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,t.width,t.height,t.depth,l,f,t.data)}else c.texImage3D(e.TEXTURE_2D_ARRAY,0,p,t.width,t.height,t.depth,0,l,f,t.data);else if(n.isData3DTexture)g?(y&&c.texStorage3D(e.TEXTURE_3D,x,p,t.width,t.height,t.depth),b&&c.texSubImage3D(e.TEXTURE_3D,0,0,0,0,t.width,t.height,t.depth,l,f,t.data)):c.texImage3D(e.TEXTURE_3D,0,p,t.width,t.height,t.depth,0,l,f,t.data);else if(n.isFramebufferTexture){if(y)if(g)c.texStorage2D(e.TEXTURE_2D,x,p,t.width,t.height);else{let n=t.width,r=t.height;for(let t=0;t<x;t++)c.texImage2D(e.TEXTURE_2D,t,p,n,r,0,l,f,null),n>>=1,r>>=1}}else if(n.isHTMLTexture){if(`texElementImage2D`in e){let r=e.canvas;if(r.hasAttribute(`layoutsubtree`)||r.setAttribute(`layoutsubtree`,`true`),t.parentNode!==r){r.appendChild(t),_.add(n),r.onpaint=e=>{let t=e.changedElements;for(let e of _)t.includes(e.image)&&(e.needsUpdate=!0)},r.requestPaint();return}let i=e.RGBA,a=e.RGBA,o=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,i,a,o,t),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(h.length>0){if(g&&y){let t=je(h[0]);c.texStorage2D(e.TEXTURE_2D,x,p,t.width,t.height)}for(let t=0,n=h.length;t<n;t++)m=h[t],g?b&&c.texSubImage2D(e.TEXTURE_2D,t,0,0,l,f,m):c.texImage2D(e.TEXTURE_2D,t,p,l,f,m);n.generateMipmaps=!1}else if(g){if(y){let n=je(t);c.texStorage2D(e.TEXTURE_2D,x,p,n.width,n.height)}b&&c.texSubImage2D(e.TEXTURE_2D,0,0,0,l,f,t)}else c.texImage2D(e.TEXTURE_2D,0,p,l,f,t);w(n)&&T(i),s.__version=o.version,n.onUpdate&&n.onUpdate(n)}t.__version=n.version}function _e(t,n,r){if(n.image.length!==6)return;let i=me(t,n),a=n.source;c.bindTexture(e.TEXTURE_CUBE_MAP,t.__webglTexture,e.TEXTURE0+r);let o=l.get(a);if(a.version!==o.__version||i===!0){c.activeTexture(e.TEXTURE0+r);let t=q.getPrimaries(q.workingColorSpace),s=n.colorSpace===``?null:q.getPrimaries(n.colorSpace),l=n.colorSpace===``||t===s?e.NONE:e.BROWSER_DEFAULT_WEBGL;c.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,n.flipY),c.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,n.premultiplyAlpha),c.pixelStorei(e.UNPACK_ALIGNMENT,n.unpackAlignment),c.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,l);let f=n.isCompressedTexture||n.image[0].isCompressedTexture,p=n.image[0]&&n.image[0].isDataTexture,m=[];for(let e=0;e<6;e++)!f&&!p?m[e]=C(n.image[e],!0,u.maxCubemapSize):m[e]=p?n.image[e].image:n.image[e],m[e]=Ae(n,m[e]);let h=m[0],g=d.convert(n.format,n.colorSpace),_=d.convert(n.type),v=D(n.internalFormat,g,_,n.normalized,n.colorSpace),y=n.isVideoTexture!==!0,b=o.__version===void 0||i===!0,x=a.dataReady,S=ee(n,h);pe(e.TEXTURE_CUBE_MAP,n);let E;if(f){y&&b&&c.texStorage2D(e.TEXTURE_CUBE_MAP,S,v,h.width,h.height);for(let t=0;t<6;t++){E=m[t].mipmaps;for(let r=0;r<E.length;r++){let i=E[r];n.format===1023?y?x&&c.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,g,_,i.data):c.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,v,i.width,i.height,0,g,_,i.data):g===null?F(`WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()`):y?x&&c.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,g,i.data):c.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,v,i.width,i.height,0,i.data)}}}else{if(E=n.mipmaps,y&&b){E.length>0&&S++;let t=je(m[0]);c.texStorage2D(e.TEXTURE_CUBE_MAP,S,v,t.width,t.height)}for(let t=0;t<6;t++)if(p){y?x&&c.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,m[t].width,m[t].height,g,_,m[t].data):c.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,v,m[t].width,m[t].height,0,g,_,m[t].data);for(let n=0;n<E.length;n++){let r=E[n].image[t].image;y?x&&c.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,n+1,0,0,r.width,r.height,g,_,r.data):c.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,n+1,v,r.width,r.height,0,g,_,r.data)}}else{y?x&&c.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,g,_,m[t]):c.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,v,g,_,m[t]);for(let n=0;n<E.length;n++){let r=E[n];y?x&&c.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,n+1,0,0,g,_,r.image[t]):c.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,n+1,v,g,_,r.image[t])}}}w(n)&&T(e.TEXTURE_CUBE_MAP),o.__version=a.version,n.onUpdate&&n.onUpdate(n)}t.__version=n.version}function B(t,n,r,i,a,o){let s=d.convert(r.format,r.colorSpace),u=d.convert(r.type),f=D(r.internalFormat,s,u,r.normalized,r.colorSpace),m=l.get(n),h=l.get(r);if(h.__renderTarget=n,!m.__hasExternalTextures){let t=Math.max(1,n.width>>o),r=Math.max(1,n.height>>o);a===e.TEXTURE_3D||a===e.TEXTURE_2D_ARRAY?c.texImage3D(a,o,f,t,r,n.depth,0,s,u,null):c.texImage2D(a,o,f,t,r,0,s,u,null)}c.bindFramebuffer(e.FRAMEBUFFER,t),Oe(n)?p.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,i,a,h.__webglTexture,0,De(n)):(a===e.TEXTURE_2D||a>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&a<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,i,a,h.__webglTexture,o),c.bindFramebuffer(e.FRAMEBUFFER,null)}function ve(t,n,r){if(e.bindRenderbuffer(e.RENDERBUFFER,t),n.depthBuffer){let i=n.depthTexture,a=i&&i.isDepthTexture?i.type:null,o=O(n.stencilBuffer,a),s=n.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;Oe(n)?p.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,De(n),o,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,De(n),o,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,o,n.width,n.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,s,e.RENDERBUFFER,t)}else{let t=n.textures;for(let i=0;i<t.length;i++){let a=t[i],o=d.convert(a.format,a.colorSpace),s=d.convert(a.type),c=D(a.internalFormat,o,s,a.normalized,a.colorSpace);Oe(n)?p.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,De(n),c,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,De(n),c,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,c,n.width,n.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function ye(t,n,r){let i=n.isWebGLCubeRenderTarget===!0;if(c.bindFramebuffer(e.FRAMEBUFFER,t),!(n.depthTexture&&n.depthTexture.isDepthTexture))throw Error(`renderTarget.depthTexture must be an instance of THREE.DepthTexture`);let a=l.get(n.depthTexture);if(a.__renderTarget=n,(!a.__webglTexture||n.depthTexture.image.width!==n.width||n.depthTexture.image.height!==n.height)&&(n.depthTexture.image.width=n.width,n.depthTexture.image.height=n.height,n.depthTexture.needsUpdate=!0),i){if(a.__webglInit===void 0&&(a.__webglInit=!0,n.depthTexture.addEventListener(`dispose`,k)),a.__webglTexture===void 0){a.__webglTexture=e.createTexture(),c.bindTexture(e.TEXTURE_CUBE_MAP,a.__webglTexture),pe(e.TEXTURE_CUBE_MAP,n.depthTexture);let t=d.convert(n.depthTexture.format),r=d.convert(n.depthTexture.type),i;n.depthTexture.format===1026?i=e.DEPTH_COMPONENT24:n.depthTexture.format===1027&&(i=e.DEPTH24_STENCIL8);for(let a=0;a<6;a++)e.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+a,0,i,n.width,n.height,0,t,r,null)}}else ce(n.depthTexture,0);let o=a.__webglTexture,s=De(n),u=i?e.TEXTURE_CUBE_MAP_POSITIVE_X+r:e.TEXTURE_2D,f=n.depthTexture.format===1027?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(n.depthTexture.format===1026)Oe(n)?p.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,f,u,o,0,s):e.framebufferTexture2D(e.FRAMEBUFFER,f,u,o,0);else if(n.depthTexture.format===1027)Oe(n)?p.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,f,u,o,0,s):e.framebufferTexture2D(e.FRAMEBUFFER,f,u,o,0);else throw Error(`Unknown depthTexture format`)}function be(t){let n=l.get(t),r=t.isWebGLCubeRenderTarget===!0;if(n.__boundDepthTexture!==t.depthTexture){let e=t.depthTexture;if(n.__depthDisposeCallback&&n.__depthDisposeCallback(),e){let t=()=>{delete n.__boundDepthTexture,delete n.__depthDisposeCallback,e.removeEventListener(`dispose`,t)};e.addEventListener(`dispose`,t),n.__depthDisposeCallback=t}n.__boundDepthTexture=e}if(t.depthTexture&&!n.__autoAllocateDepthBuffer)if(r)for(let e=0;e<6;e++)ye(n.__webglFramebuffer[e],t,e);else{let e=t.texture.mipmaps;e&&e.length>0?ye(n.__webglFramebuffer[0],t,0):ye(n.__webglFramebuffer,t,0)}else if(r){n.__webglDepthbuffer=[];for(let r=0;r<6;r++)if(c.bindFramebuffer(e.FRAMEBUFFER,n.__webglFramebuffer[r]),n.__webglDepthbuffer[r]===void 0)n.__webglDepthbuffer[r]=e.createRenderbuffer(),ve(n.__webglDepthbuffer[r],t,!1);else{let i=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,a=n.__webglDepthbuffer[r];e.bindRenderbuffer(e.RENDERBUFFER,a),e.framebufferRenderbuffer(e.FRAMEBUFFER,i,e.RENDERBUFFER,a)}}else{let r=t.texture.mipmaps;if(r&&r.length>0?c.bindFramebuffer(e.FRAMEBUFFER,n.__webglFramebuffer[0]):c.bindFramebuffer(e.FRAMEBUFFER,n.__webglFramebuffer),n.__webglDepthbuffer===void 0)n.__webglDepthbuffer=e.createRenderbuffer(),ve(n.__webglDepthbuffer,t,!1);else{let r=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,i=n.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,i),e.framebufferRenderbuffer(e.FRAMEBUFFER,r,e.RENDERBUFFER,i)}}c.bindFramebuffer(e.FRAMEBUFFER,null)}function xe(t,n,r){let i=l.get(t);n!==void 0&&B(i.__webglFramebuffer,t,t.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),r!==void 0&&be(t)}function Se(t){let n=t.texture,r=l.get(t),i=l.get(n);t.addEventListener(`dispose`,A);let a=t.textures,o=t.isWebGLCubeRenderTarget===!0,s=a.length>1;if(s||(i.__webglTexture===void 0&&(i.__webglTexture=e.createTexture()),i.__version=n.version,f.memory.textures++),o){r.__webglFramebuffer=[];for(let t=0;t<6;t++)if(n.mipmaps&&n.mipmaps.length>0){r.__webglFramebuffer[t]=[];for(let i=0;i<n.mipmaps.length;i++)r.__webglFramebuffer[t][i]=e.createFramebuffer()}else r.__webglFramebuffer[t]=e.createFramebuffer()}else{if(n.mipmaps&&n.mipmaps.length>0){r.__webglFramebuffer=[];for(let t=0;t<n.mipmaps.length;t++)r.__webglFramebuffer[t]=e.createFramebuffer()}else r.__webglFramebuffer=e.createFramebuffer();if(s)for(let t=0,n=a.length;t<n;t++){let n=l.get(a[t]);n.__webglTexture===void 0&&(n.__webglTexture=e.createTexture(),f.memory.textures++)}if(t.samples>0&&Oe(t)===!1){r.__webglMultisampledFramebuffer=e.createFramebuffer(),r.__webglColorRenderbuffer=[],c.bindFramebuffer(e.FRAMEBUFFER,r.__webglMultisampledFramebuffer);for(let n=0;n<a.length;n++){let i=a[n];r.__webglColorRenderbuffer[n]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,r.__webglColorRenderbuffer[n]);let o=d.convert(i.format,i.colorSpace),s=d.convert(i.type),c=D(i.internalFormat,o,s,i.normalized,i.colorSpace,t.isXRRenderTarget===!0),l=De(t);e.renderbufferStorageMultisample(e.RENDERBUFFER,l,c,t.width,t.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+n,e.RENDERBUFFER,r.__webglColorRenderbuffer[n])}e.bindRenderbuffer(e.RENDERBUFFER,null),t.depthBuffer&&(r.__webglDepthRenderbuffer=e.createRenderbuffer(),ve(r.__webglDepthRenderbuffer,t,!0)),c.bindFramebuffer(e.FRAMEBUFFER,null)}}if(o){c.bindTexture(e.TEXTURE_CUBE_MAP,i.__webglTexture),pe(e.TEXTURE_CUBE_MAP,n);for(let i=0;i<6;i++)if(n.mipmaps&&n.mipmaps.length>0)for(let a=0;a<n.mipmaps.length;a++)B(r.__webglFramebuffer[i][a],t,n,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+i,a);else B(r.__webglFramebuffer[i],t,n,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+i,0);w(n)&&T(e.TEXTURE_CUBE_MAP),c.unbindTexture()}else if(s){for(let n=0,i=a.length;n<i;n++){let i=a[n],o=l.get(i),s=e.TEXTURE_2D;(t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(s=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),c.bindTexture(s,o.__webglTexture),pe(s,i),B(r.__webglFramebuffer,t,i,e.COLOR_ATTACHMENT0+n,s,0),w(i)&&T(s)}c.unbindTexture()}else{let a=e.TEXTURE_2D;if((t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(a=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),c.bindTexture(a,i.__webglTexture),pe(a,n),n.mipmaps&&n.mipmaps.length>0)for(let i=0;i<n.mipmaps.length;i++)B(r.__webglFramebuffer[i],t,n,e.COLOR_ATTACHMENT0,a,i);else B(r.__webglFramebuffer,t,n,e.COLOR_ATTACHMENT0,a,0);w(n)&&T(a),c.unbindTexture()}t.depthBuffer&&be(t)}function Ce(e){let t=e.textures;for(let n=0,r=t.length;n<r;n++){let r=t[n];if(w(r)){let t=E(e),n=l.get(r).__webglTexture;c.bindTexture(t,n),T(t),c.unbindTexture()}}}let we=[],Te=[];function Ee(t){if(t.samples>0){if(Oe(t)===!1){let n=t.textures,r=t.width,i=t.height,a=e.COLOR_BUFFER_BIT,o=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,s=l.get(t),u=n.length>1;if(u)for(let t=0;t<n.length;t++)c.bindFramebuffer(e.FRAMEBUFFER,s.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,null),c.bindFramebuffer(e.FRAMEBUFFER,s.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,null,0);c.bindFramebuffer(e.READ_FRAMEBUFFER,s.__webglMultisampledFramebuffer);let d=t.texture.mipmaps;d&&d.length>0?c.bindFramebuffer(e.DRAW_FRAMEBUFFER,s.__webglFramebuffer[0]):c.bindFramebuffer(e.DRAW_FRAMEBUFFER,s.__webglFramebuffer);for(let c=0;c<n.length;c++){if(t.resolveDepthBuffer&&(t.depthBuffer&&(a|=e.DEPTH_BUFFER_BIT),t.stencilBuffer&&t.resolveStencilBuffer&&(a|=e.STENCIL_BUFFER_BIT)),u){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,s.__webglColorRenderbuffer[c]);let t=l.get(n[c]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0)}e.blitFramebuffer(0,0,r,i,0,0,r,i,a,e.NEAREST),m===!0&&(we.length=0,Te.length=0,we.push(e.COLOR_ATTACHMENT0+c),t.depthBuffer&&t.resolveDepthBuffer===!1&&(we.push(o),Te.push(o),e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,Te)),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,we))}if(c.bindFramebuffer(e.READ_FRAMEBUFFER,null),c.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),u)for(let t=0;t<n.length;t++){c.bindFramebuffer(e.FRAMEBUFFER,s.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,s.__webglColorRenderbuffer[t]);let r=l.get(n[t]).__webglTexture;c.bindFramebuffer(e.FRAMEBUFFER,s.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,r,0)}c.bindFramebuffer(e.DRAW_FRAMEBUFFER,s.__webglMultisampledFramebuffer)}else if(t.depthBuffer&&t.resolveDepthBuffer===!1&&m){let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[n])}}}function De(e){return Math.min(u.maxSamples,e.samples)}function Oe(e){let n=l.get(e);return e.samples>0&&t.has(`WEBGL_multisampled_render_to_texture`)===!0&&n.__useRenderToTexture!==!1}function ke(e){let t=f.render.frame;g.get(e)!==t&&(g.set(e,t),e.update())}function Ae(e,t){let n=e.colorSpace,r=e.format,i=e.type;return e.isCompressedTexture===!0||e.isVideoTexture===!0||n!==`srgb-linear`&&n!==``&&(q.getTransfer(n)===`srgb`?(r!==1023||i!==1009)&&F(`WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.`):I(`WebGLTextures: Unsupported texture color space:`,n)),t}function je(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement?(h.width=e.naturalWidth||e.width,h.height=e.naturalHeight||e.height):typeof VideoFrame<`u`&&e instanceof VideoFrame?(h.width=e.displayWidth,h.height=e.displayHeight):(h.width=e.width,h.height=e.height),h}this.allocateTextureUnit=oe,this.resetTextureUnits=re,this.getTextureUnits=ie,this.setTextureUnits=ae,this.setTexture2D=ce,this.setTexture2DArray=le,this.setTexture3D=ue,this.setTextureCube=L,this.rebindTextures=xe,this.setupRenderTarget=Se,this.updateRenderTargetMipmap=Ce,this.updateMultisampleRenderTarget=Ee,this.setupDepthRenderbuffer=be,this.setupFrameBufferTexture=B,this.useMultisampledRTT=Oe,this.isReversedDepthBuffer=function(){return c.buffers.depth.getReversed()}}function gs(e,t){function n(n,r=``){let i,a=q.getTransfer(r);if(n===1009)return e.UNSIGNED_BYTE;if(n===1017)return e.UNSIGNED_SHORT_4_4_4_4;if(n===1018)return e.UNSIGNED_SHORT_5_5_5_1;if(n===35902)return e.UNSIGNED_INT_5_9_9_9_REV;if(n===35899)return e.UNSIGNED_INT_10F_11F_11F_REV;if(n===1010)return e.BYTE;if(n===1011)return e.SHORT;if(n===1012)return e.UNSIGNED_SHORT;if(n===1013)return e.INT;if(n===1014)return e.UNSIGNED_INT;if(n===1015)return e.FLOAT;if(n===1016)return e.HALF_FLOAT;if(n===1021)return e.ALPHA;if(n===1022)return e.RGB;if(n===1023)return e.RGBA;if(n===1026)return e.DEPTH_COMPONENT;if(n===1027)return e.DEPTH_STENCIL;if(n===1028)return e.RED;if(n===1029)return e.RED_INTEGER;if(n===1030)return e.RG;if(n===1031)return e.RG_INTEGER;if(n===1033)return e.RGBA_INTEGER;if(n===33776||n===33777||n===33778||n===33779)if(a===`srgb`)if(i=t.get(`WEBGL_compressed_texture_s3tc_srgb`),i!==null){if(n===33776)return i.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(i=t.get(`WEBGL_compressed_texture_s3tc`),i!==null){if(n===33776)return i.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===35840||n===35841||n===35842||n===35843)if(i=t.get(`WEBGL_compressed_texture_pvrtc`),i!==null){if(n===35840)return i.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===35841)return i.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===35842)return i.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===35843)return i.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===36196||n===37492||n===37496||n===37488||n===37489||n===37490||n===37491)if(i=t.get(`WEBGL_compressed_texture_etc`),i!==null){if(n===36196||n===37492)return a===`srgb`?i.COMPRESSED_SRGB8_ETC2:i.COMPRESSED_RGB8_ETC2;if(n===37496)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:i.COMPRESSED_RGBA8_ETC2_EAC;if(n===37488)return i.COMPRESSED_R11_EAC;if(n===37489)return i.COMPRESSED_SIGNED_R11_EAC;if(n===37490)return i.COMPRESSED_RG11_EAC;if(n===37491)return i.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===37808||n===37809||n===37810||n===37811||n===37812||n===37813||n===37814||n===37815||n===37816||n===37817||n===37818||n===37819||n===37820||n===37821)if(i=t.get(`WEBGL_compressed_texture_astc`),i!==null){if(n===37808)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:i.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===37809)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:i.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===37810)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:i.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===37811)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:i.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===37812)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:i.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===37813)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:i.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===37814)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:i.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===37815)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:i.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===37816)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:i.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===37817)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:i.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===37818)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:i.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===37819)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:i.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===37820)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:i.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===37821)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:i.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===36492||n===36494||n===36495)if(i=t.get(`EXT_texture_compression_bptc`),i!==null){if(n===36492)return a===`srgb`?i.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:i.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===36494)return i.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===36495)return i.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===36283||n===36284||n===36285||n===36286)if(i=t.get(`EXT_texture_compression_rgtc`),i!==null){if(n===36283)return i.COMPRESSED_RED_RGTC1_EXT;if(n===36284)return i.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===36285)return i.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===36286)return i.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===1020?e.UNSIGNED_INT_24_8:e[n]===void 0?null:e[n]}return{convert:n}}var _s=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new hr(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new Or({vertexShader:`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,fragmentShader:`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new $n(new vr(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},vs=class extends L{constructor(e,t){super();let n=this,r=null,i=1,a=null,o=`local-floor`,s=1,l=null,d=null,f=null,p=null,m=null,y=null,b=typeof XRWebGLBinding<`u`,x=new _s,S={},C=t.getContextAttributes(),w=null,T=null,E=[],D=[],O=new H,ee=null,k=new ai;k.viewport=new Ye;let A=new ai;A.viewport=new Ye;let j=[k,A],M=new ci,te=null,ne=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(e){let t=E[e];return t===void 0&&(t=new kt,E[e]=t),t.getTargetRaySpace()},this.getControllerGrip=function(e){let t=E[e];return t===void 0&&(t=new kt,E[e]=t),t.getGripSpace()},this.getHand=function(e){let t=E[e];return t===void 0&&(t=new kt,E[e]=t),t.getHandSpace()};function N(e){let t=D.indexOf(e.inputSource);if(t===-1)return;let n=E[t];n!==void 0&&(n.update(e.inputSource,e.frame,l||a),n.dispatchEvent({type:e.type,data:e.inputSource}))}function re(){r.removeEventListener(`select`,N),r.removeEventListener(`selectstart`,N),r.removeEventListener(`selectend`,N),r.removeEventListener(`squeeze`,N),r.removeEventListener(`squeezestart`,N),r.removeEventListener(`squeezeend`,N),r.removeEventListener(`end`,re),r.removeEventListener(`inputsourceschange`,P);for(let e=0;e<E.length;e++){let t=D[e];t!==null&&(D[e]=null,E[e].disconnect(t))}te=null,ne=null,x.reset();for(let e in S)delete S[e];e.setRenderTarget(w),m=null,p=null,f=null,r=null,T=null,ue.stop(),n.isPresenting=!1,e.setPixelRatio(ee),e.setSize(O.width,O.height,!1),n.dispatchEvent({type:`sessionend`})}this.setFramebufferScaleFactor=function(e){i=e,n.isPresenting===!0&&F(`WebXRManager: Cannot change framebuffer scale while presenting.`)},this.setReferenceSpaceType=function(e){o=e,n.isPresenting===!0&&F(`WebXRManager: Cannot change reference space type while presenting.`)},this.getReferenceSpace=function(){return l||a},this.setReferenceSpace=function(e){l=e},this.getBaseLayer=function(){return p===null?m:p},this.getBinding=function(){return f===null&&b&&(f=new XRWebGLBinding(r,t)),f},this.getFrame=function(){return y},this.getSession=function(){return r},this.setSession=async function(d){if(r=d,r!==null){if(w=e.getRenderTarget(),r.addEventListener(`select`,N),r.addEventListener(`selectstart`,N),r.addEventListener(`selectend`,N),r.addEventListener(`squeeze`,N),r.addEventListener(`squeezestart`,N),r.addEventListener(`squeezeend`,N),r.addEventListener(`end`,re),r.addEventListener(`inputsourceschange`,P),C.xrCompatible!==!0&&await t.makeXRCompatible(),ee=e.getPixelRatio(),e.getSize(O),b&&`createProjectionLayer`in XRWebGLBinding.prototype){let n=null,a=null,o=null;C.depth&&(o=C.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,n=C.stencil?v:_,a=C.stencil?h:u);let s={colorFormat:t.RGBA8,depthFormat:o,scaleFactor:i};f=this.getBinding(),p=f.createProjectionLayer(s),r.updateRenderState({layers:[p]}),e.setPixelRatio(1),e.setSize(p.textureWidth,p.textureHeight,!1),T=new Ze(p.textureWidth,p.textureHeight,{format:g,type:c,depthTexture:new pr(p.textureWidth,p.textureHeight,a,void 0,void 0,void 0,void 0,void 0,void 0,n),stencilBuffer:C.stencil,colorSpace:e.outputColorSpace,samples:C.antialias?4:0,resolveDepthBuffer:p.ignoreDepthValues===!1,resolveStencilBuffer:p.ignoreDepthValues===!1})}else{let n={antialias:C.antialias,alpha:!0,depth:C.depth,stencil:C.stencil,framebufferScaleFactor:i};m=new XRWebGLLayer(r,t,n),r.updateRenderState({baseLayer:m}),e.setPixelRatio(1),e.setSize(m.framebufferWidth,m.framebufferHeight,!1),T=new Ze(m.framebufferWidth,m.framebufferHeight,{format:g,type:c,colorSpace:e.outputColorSpace,stencilBuffer:C.stencil,resolveDepthBuffer:m.ignoreDepthValues===!1,resolveStencilBuffer:m.ignoreDepthValues===!1})}T.isXRRenderTarget=!0,this.setFoveation(s),l=null,a=await r.requestReferenceSpace(o),ue.setContext(r),ue.start(),n.isPresenting=!0,n.dispatchEvent({type:`sessionstart`})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return x.getDepthTexture()};function P(e){for(let t=0;t<e.removed.length;t++){let n=e.removed[t],r=D.indexOf(n);r>=0&&(D[r]=null,E[r].disconnect(n))}for(let t=0;t<e.added.length;t++){let n=e.added[t],r=D.indexOf(n);if(r===-1){for(let e=0;e<E.length;e++)if(e>=D.length){D.push(n),r=e;break}else if(D[e]===null){D[e]=n,r=e;break}if(r===-1)break}let i=E[r];i&&i.connect(n)}}let ie=new W,ae=new W;function oe(e,t,n){ie.setFromMatrixPosition(t.matrixWorld),ae.setFromMatrixPosition(n.matrixWorld);let r=ie.distanceTo(ae),i=t.projectionMatrix.elements,a=n.projectionMatrix.elements,o=i[14]/(i[10]-1),s=i[14]/(i[10]+1),c=(i[9]+1)/i[5],l=(i[9]-1)/i[5],u=(i[8]-1)/i[0],d=(a[8]+1)/a[0],f=o*u,p=o*d,m=r/(-u+d),h=m*-u;if(t.matrixWorld.decompose(e.position,e.quaternion,e.scale),e.translateX(h),e.translateZ(m),e.matrixWorld.compose(e.position,e.quaternion,e.scale),e.matrixWorldInverse.copy(e.matrixWorld).invert(),i[10]===-1)e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse);else{let t=o+m,n=s+m,i=f-h,a=p+(r-h),u=c*s/n*t,d=l*s/n*t;e.projectionMatrix.makePerspective(i,a,u,d,t,n),e.projectionMatrixInverse.copy(e.projectionMatrix).invert()}}function se(e,t){t===null?e.matrixWorld.copy(e.matrix):e.matrixWorld.multiplyMatrices(t.matrixWorld,e.matrix),e.matrixWorldInverse.copy(e.matrixWorld).invert()}this.updateCamera=function(e){if(r===null)return;let t=e.near,n=e.far;x.texture!==null&&(x.depthNear>0&&(t=x.depthNear),x.depthFar>0&&(n=x.depthFar)),M.near=A.near=k.near=t,M.far=A.far=k.far=n,(te!==M.near||ne!==M.far)&&(r.updateRenderState({depthNear:M.near,depthFar:M.far}),te=M.near,ne=M.far),M.layers.mask=e.layers.mask|6,k.layers.mask=M.layers.mask&-5,A.layers.mask=M.layers.mask&-3;let i=e.parent,a=M.cameras;se(M,i);for(let e=0;e<a.length;e++)se(a[e],i);a.length===2?oe(M,k,A):M.projectionMatrix.copy(k.projectionMatrix),I(e,M,i)};function I(e,t,n){n===null?e.matrix.copy(t.matrixWorld):(e.matrix.copy(n.matrixWorld),e.matrix.invert(),e.matrix.multiply(t.matrixWorld)),e.matrix.decompose(e.position,e.quaternion,e.scale),e.updateMatrixWorld(!0),e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse),e.isPerspectiveCamera&&(e.fov=pe*2*Math.atan(1/e.projectionMatrix.elements[5]),e.zoom=1)}this.getCamera=function(){return M},this.getFoveation=function(){if(!(p===null&&m===null))return s},this.setFoveation=function(e){s=e,p!==null&&(p.fixedFoveation=e),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=e)},this.hasDepthSensing=function(){return x.texture!==null},this.getDepthSensingMesh=function(){return x.getMesh(M)},this.getCameraTexture=function(e){return S[e]};let ce=null;function le(t,i){if(d=i.getViewerPose(l||a),y=i,d!==null){let t=d.views;m!==null&&(e.setRenderTargetFramebuffer(T,m.framebuffer),e.setRenderTarget(T));let i=!1;t.length!==M.cameras.length&&(M.cameras.length=0,i=!0);for(let n=0;n<t.length;n++){let r=t[n],a=null;if(m!==null)a=m.getViewport(r);else{let t=f.getViewSubImage(p,r);a=t.viewport,n===0&&(e.setRenderTargetTextures(T,t.colorTexture,t.depthStencilTexture),e.setRenderTarget(T))}let o=j[n];o===void 0&&(o=new ai,o.layers.enable(n),o.viewport=new Ye,j[n]=o),o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.projectionMatrix.fromArray(r.projectionMatrix),o.projectionMatrixInverse.copy(o.projectionMatrix).invert(),o.viewport.set(a.x,a.y,a.width,a.height),n===0&&(M.matrix.copy(o.matrix),M.matrix.decompose(M.position,M.quaternion,M.scale)),i===!0&&M.cameras.push(o)}let a=r.enabledFeatures;if(a&&a.includes(`depth-sensing`)&&r.depthUsage==`gpu-optimized`&&b){f=n.getBinding();let e=f.getDepthInformation(t[0]);e&&e.isValid&&e.texture&&x.init(e,r.renderState)}if(a&&a.includes(`camera-access`)&&b){e.state.unbindTexture(),f=n.getBinding();for(let e=0;e<t.length;e++){let n=t[e].camera;if(n){let e=S[n];e||(e=new hr,S[n]=e);let t=f.getCameraImage(n);e.sourceTexture=t}}}}for(let e=0;e<E.length;e++){let t=D[e],n=E[e];t!==null&&n!==void 0&&n.update(t,i,l||a)}ce&&ce(t,i),i.detectedPlanes&&n.dispatchEvent({type:`planesdetected`,data:i}),y=null}let ue=new vi;ue.setAnimationLoop(le),this.setAnimationLoop=function(e){ce=e},this.dispose=function(){}}};let ys=new et,bs=new K;bs.set(-1,0,0,0,1,0,0,0,1);function xs(e,t){function n(e,t){e.matrixAutoUpdate===!0&&e.updateMatrix(),t.value.copy(e.matrix)}function r(t,n){n.color.getRGB(t.fogColor.value,wr(e)),n.isFog?(t.fogNear.value=n.near,t.fogFar.value=n.far):n.isFogExp2&&(t.fogDensity.value=n.density)}function i(e,t,n,r,i){t.isNodeMaterial?t.uniformsNeedUpdate=!1:t.isMeshBasicMaterial?a(e,t):t.isMeshLambertMaterial?(a(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshToonMaterial?(a(e,t),d(e,t)):t.isMeshPhongMaterial?(a(e,t),u(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshStandardMaterial?(a(e,t),f(e,t),t.isMeshPhysicalMaterial&&p(e,t,i)):t.isMeshMatcapMaterial?(a(e,t),m(e,t)):t.isMeshDepthMaterial?a(e,t):t.isMeshDistanceMaterial?(a(e,t),h(e,t)):t.isMeshNormalMaterial?a(e,t):t.isLineBasicMaterial?(o(e,t),t.isLineDashedMaterial&&s(e,t)):t.isPointsMaterial?c(e,t,n,r):t.isSpriteMaterial?l(e,t):t.isShadowMaterial?(e.color.value.copy(t.color),e.opacity.value=t.opacity):t.isShaderMaterial&&(t.uniformsNeedUpdate=!1)}function a(e,r){e.opacity.value=r.opacity,r.color&&e.diffuse.value.copy(r.color),r.emissive&&e.emissive.value.copy(r.emissive).multiplyScalar(r.emissiveIntensity),r.map&&(e.map.value=r.map,n(r.map,e.mapTransform)),r.alphaMap&&(e.alphaMap.value=r.alphaMap,n(r.alphaMap,e.alphaMapTransform)),r.bumpMap&&(e.bumpMap.value=r.bumpMap,n(r.bumpMap,e.bumpMapTransform),e.bumpScale.value=r.bumpScale,r.side===1&&(e.bumpScale.value*=-1)),r.normalMap&&(e.normalMap.value=r.normalMap,n(r.normalMap,e.normalMapTransform),e.normalScale.value.copy(r.normalScale),r.side===1&&e.normalScale.value.negate()),r.displacementMap&&(e.displacementMap.value=r.displacementMap,n(r.displacementMap,e.displacementMapTransform),e.displacementScale.value=r.displacementScale,e.displacementBias.value=r.displacementBias),r.emissiveMap&&(e.emissiveMap.value=r.emissiveMap,n(r.emissiveMap,e.emissiveMapTransform)),r.specularMap&&(e.specularMap.value=r.specularMap,n(r.specularMap,e.specularMapTransform)),r.alphaTest>0&&(e.alphaTest.value=r.alphaTest);let i=t.get(r),a=i.envMap,o=i.envMapRotation;a&&(e.envMap.value=a,e.envMapRotation.value.setFromMatrix4(ys.makeRotationFromEuler(o)).transpose(),a.isCubeTexture&&a.isRenderTargetTexture===!1&&e.envMapRotation.value.premultiply(bs),e.reflectivity.value=r.reflectivity,e.ior.value=r.ior,e.refractionRatio.value=r.refractionRatio),r.lightMap&&(e.lightMap.value=r.lightMap,e.lightMapIntensity.value=r.lightMapIntensity,n(r.lightMap,e.lightMapTransform)),r.aoMap&&(e.aoMap.value=r.aoMap,e.aoMapIntensity.value=r.aoMapIntensity,n(r.aoMap,e.aoMapTransform))}function o(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform))}function s(e,t){e.dashSize.value=t.dashSize,e.totalSize.value=t.dashSize+t.gapSize,e.scale.value=t.scale}function c(e,t,r,i){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.size.value=t.size*r,e.scale.value=i*.5,t.map&&(e.map.value=t.map,n(t.map,e.uvTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function l(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.rotation.value=t.rotation,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function u(e,t){e.specular.value.copy(t.specular),e.shininess.value=Math.max(t.shininess,1e-4)}function d(e,t){t.gradientMap&&(e.gradientMap.value=t.gradientMap)}function f(e,t){e.metalness.value=t.metalness,t.metalnessMap&&(e.metalnessMap.value=t.metalnessMap,n(t.metalnessMap,e.metalnessMapTransform)),e.roughness.value=t.roughness,t.roughnessMap&&(e.roughnessMap.value=t.roughnessMap,n(t.roughnessMap,e.roughnessMapTransform)),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)}function p(e,t,r){e.ior.value=t.ior,t.sheen>0&&(e.sheenColor.value.copy(t.sheenColor).multiplyScalar(t.sheen),e.sheenRoughness.value=t.sheenRoughness,t.sheenColorMap&&(e.sheenColorMap.value=t.sheenColorMap,n(t.sheenColorMap,e.sheenColorMapTransform)),t.sheenRoughnessMap&&(e.sheenRoughnessMap.value=t.sheenRoughnessMap,n(t.sheenRoughnessMap,e.sheenRoughnessMapTransform))),t.clearcoat>0&&(e.clearcoat.value=t.clearcoat,e.clearcoatRoughness.value=t.clearcoatRoughness,t.clearcoatMap&&(e.clearcoatMap.value=t.clearcoatMap,n(t.clearcoatMap,e.clearcoatMapTransform)),t.clearcoatRoughnessMap&&(e.clearcoatRoughnessMap.value=t.clearcoatRoughnessMap,n(t.clearcoatRoughnessMap,e.clearcoatRoughnessMapTransform)),t.clearcoatNormalMap&&(e.clearcoatNormalMap.value=t.clearcoatNormalMap,n(t.clearcoatNormalMap,e.clearcoatNormalMapTransform),e.clearcoatNormalScale.value.copy(t.clearcoatNormalScale),t.side===1&&e.clearcoatNormalScale.value.negate())),t.dispersion>0&&(e.dispersion.value=t.dispersion),t.iridescence>0&&(e.iridescence.value=t.iridescence,e.iridescenceIOR.value=t.iridescenceIOR,e.iridescenceThicknessMinimum.value=t.iridescenceThicknessRange[0],e.iridescenceThicknessMaximum.value=t.iridescenceThicknessRange[1],t.iridescenceMap&&(e.iridescenceMap.value=t.iridescenceMap,n(t.iridescenceMap,e.iridescenceMapTransform)),t.iridescenceThicknessMap&&(e.iridescenceThicknessMap.value=t.iridescenceThicknessMap,n(t.iridescenceThicknessMap,e.iridescenceThicknessMapTransform))),t.transmission>0&&(e.transmission.value=t.transmission,e.transmissionSamplerMap.value=r.texture,e.transmissionSamplerSize.value.set(r.width,r.height),t.transmissionMap&&(e.transmissionMap.value=t.transmissionMap,n(t.transmissionMap,e.transmissionMapTransform)),e.thickness.value=t.thickness,t.thicknessMap&&(e.thicknessMap.value=t.thicknessMap,n(t.thicknessMap,e.thicknessMapTransform)),e.attenuationDistance.value=t.attenuationDistance,e.attenuationColor.value.copy(t.attenuationColor)),t.anisotropy>0&&(e.anisotropyVector.value.set(t.anisotropy*Math.cos(t.anisotropyRotation),t.anisotropy*Math.sin(t.anisotropyRotation)),t.anisotropyMap&&(e.anisotropyMap.value=t.anisotropyMap,n(t.anisotropyMap,e.anisotropyMapTransform))),e.specularIntensity.value=t.specularIntensity,e.specularColor.value.copy(t.specularColor),t.specularColorMap&&(e.specularColorMap.value=t.specularColorMap,n(t.specularColorMap,e.specularColorMapTransform)),t.specularIntensityMap&&(e.specularIntensityMap.value=t.specularIntensityMap,n(t.specularIntensityMap,e.specularIntensityMapTransform))}function m(e,t){t.matcap&&(e.matcap.value=t.matcap)}function h(e,n){let r=t.get(n).light;e.referencePosition.value.setFromMatrixPosition(r.matrixWorld),e.nearDistance.value=r.shadow.camera.near,e.farDistance.value=r.shadow.camera.far}return{refreshFogUniforms:r,refreshMaterialUniforms:i}}function Ss(e,t,n,r){let i={},a={},o=[],s=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function c(e,t){let n=t.program;r.uniformBlockBinding(e,n)}function l(e,n){let o=i[e.id];o===void 0&&(m(e),o=u(e),i[e.id]=o,e.addEventListener(`dispose`,g));let s=n.program;r.updateUBOMapping(e,s);let c=t.render.frame;a[e.id]!==c&&(f(e),a[e.id]=c)}function u(t){let n=d();t.__bindingPointIndex=n;let r=e.createBuffer(),i=t.__size,a=t.usage;return e.bindBuffer(e.UNIFORM_BUFFER,r),e.bufferData(e.UNIFORM_BUFFER,i,a),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,n,r),r}function d(){for(let e=0;e<s;e++)if(o.indexOf(e)===-1)return o.push(e),e;return I(`WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached.`),0}function f(t){let n=i[t.id],r=t.uniforms,a=t.__cache;e.bindBuffer(e.UNIFORM_BUFFER,n);for(let t=0,n=r.length;t<n;t++){let n=Array.isArray(r[t])?r[t]:[r[t]];for(let r=0,i=n.length;r<i;r++){let i=n[r];if(p(i,t,r,a)===!0){let t=i.__offset,n=Array.isArray(i.value)?i.value:[i.value],r=0;for(let a=0;a<n.length;a++){let o=n[a],s=h(o);typeof o==`number`||typeof o==`boolean`?(i.__data[0]=o,e.bufferSubData(e.UNIFORM_BUFFER,t+r,i.__data)):o.isMatrix3?(i.__data[0]=o.elements[0],i.__data[1]=o.elements[1],i.__data[2]=o.elements[2],i.__data[3]=0,i.__data[4]=o.elements[3],i.__data[5]=o.elements[4],i.__data[6]=o.elements[5],i.__data[7]=0,i.__data[8]=o.elements[6],i.__data[9]=o.elements[7],i.__data[10]=o.elements[8],i.__data[11]=0):ArrayBuffer.isView(o)?i.__data.set(new o.constructor(o.buffer,o.byteOffset,i.__data.length)):(o.toArray(i.__data,r),r+=s.storage/Float32Array.BYTES_PER_ELEMENT)}e.bufferSubData(e.UNIFORM_BUFFER,t,i.__data)}}}e.bindBuffer(e.UNIFORM_BUFFER,null)}function p(e,t,n,r){let i=e.value,a=t+`_`+n;if(r[a]===void 0)return typeof i==`number`||typeof i==`boolean`?r[a]=i:ArrayBuffer.isView(i)?r[a]=i.slice():r[a]=i.clone(),!0;{let e=r[a];if(typeof i==`number`||typeof i==`boolean`){if(e!==i)return r[a]=i,!0}else if(ArrayBuffer.isView(i))return!0;else if(e.equals(i)===!1)return e.copy(i),!0}return!1}function m(e){let t=e.uniforms,n=0;for(let e=0,r=t.length;e<r;e++){let r=Array.isArray(t[e])?t[e]:[t[e]];for(let e=0,t=r.length;e<t;e++){let t=r[e],i=Array.isArray(t.value)?t.value:[t.value];for(let e=0,r=i.length;e<r;e++){let r=i[e],a=h(r),o=n%16,s=o%a.boundary,c=o+s;n+=s,c!==0&&16-c<a.storage&&(n+=16-c),t.__data=new Float32Array(a.storage/Float32Array.BYTES_PER_ELEMENT),t.__offset=n,n+=a.storage}}}let r=n%16;return r>0&&(n+=16-r),e.__size=n,e.__cache={},this}function h(e){let t={boundary:0,storage:0};return typeof e==`number`||typeof e==`boolean`?(t.boundary=4,t.storage=4):e.isVector2?(t.boundary=8,t.storage=8):e.isVector3||e.isColor?(t.boundary=16,t.storage=12):e.isVector4?(t.boundary=16,t.storage=16):e.isMatrix3?(t.boundary=48,t.storage=48):e.isMatrix4?(t.boundary=64,t.storage=64):e.isTexture?F(`WebGLRenderer: Texture samplers can not be part of an uniforms group.`):ArrayBuffer.isView(e)?(t.boundary=16,t.storage=e.byteLength):F(`WebGLRenderer: Unsupported uniform value type.`,e),t}function g(t){let n=t.target;n.removeEventListener(`dispose`,g);let r=o.indexOf(n.__bindingPointIndex);o.splice(r,1),e.deleteBuffer(i[n.id]),delete i[n.id],delete a[n.id]}function _(){for(let t in i)e.deleteBuffer(i[t]);o=[],i={},a={}}return{bind:c,update:l,dispose:_}}let Cs=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),ws=null;function Ts(){return ws===null&&(ws=new nr(Cs,16,16,b,f),ws.name=`DFG_LUT`,ws.minFilter=o,ws.magFilter=o,ws.wrapS=r,ws.wrapT=r,ws.generateMipmaps=!1,ws.needsUpdate=!0),ws}var Es=class{constructor(e={}){let{canvas:t=ie(),context:n=null,depth:r=!0,stencil:i=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:d=!0,preserveDrawingBuffer:g=!1,powerPreference:_=`default`,failIfMajorPerformanceCaveat:v=!1,reversedDepthBuffer:b=!1,outputBufferType:C=c}=e;this.isWebGLRenderer=!0;let w;if(n!==null){if(typeof WebGLRenderingContext<`u`&&n instanceof WebGLRenderingContext)throw Error(`THREE.WebGLRenderer: WebGL 1 is not supported since r163.`);w=n.getContextAttributes().alpha}else w=a;let T=C,E=new Set([S,x,y]),D=new Set([c,u,l,h,p,m]),O=new Uint32Array(4),ee=new Int32Array(4),A=new W,j=null,M=null,te=[],N=[],re=null;this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=0,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let P=this,ae=!1,se=null;this._outputColorSpace=k;let ce=0,ue=0,L=null,R=-1,de=null,fe=new Ye,pe=new Ye,me=null,z=new Y(0),he=0,ge=t.width,_e=t.height,B=1,ve=null,ye=null,be=new Ye(0,0,ge,_e),xe=new Ye(0,0,ge,_e),Se=!1,Ce=new ur,we=!1,Te=!1,Ee=new et,De=new W,Oe=new Ye,ke={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Ae=!1;function je(){return L===null?B:1}let V=n;function Me(e,n){return t.getContext(e,n)}try{let e={alpha:!0,depth:r,stencil:i,antialias:o,premultipliedAlpha:d,preserveDrawingBuffer:g,powerPreference:_,failIfMajorPerformanceCaveat:v};if(`setAttribute`in t&&t.setAttribute(`data-engine`,`three.js r184`),t.addEventListener(`webglcontextlost`,nt,!1),t.addEventListener(`webglcontextrestored`,rt,!1),t.addEventListener(`webglcontextcreationerror`,it,!1),V===null){let t=`webgl2`;if(V=Me(t,e),V===null)throw Me(t)?Error(`Error creating WebGL context with your selected attributes.`):Error(`Error creating WebGL context.`)}}catch(e){throw I(`WebGLRenderer: `+e.message),e}let Ne,H,U,Pe,G,K,Fe,Ie,Le,Re,ze,Be,Ve,He,Ue,We,Ge,Ke,qe,Je,Xe,Qe,$e;function tt(){Ne=new Ji(V),Ne.init(),Xe=new gs(V,Ne),H=new Di(V,Ne,e,Xe),U=new ms(V,Ne),H.reversedDepthBuffer&&b&&U.buffers.depth.setReversed(!0),Pe=new Zi(V),G=new Xo,K=new hs(V,Ne,U,G,H,Xe,Pe),Fe=new qi(P),Ie=new yi(V),Qe=new Ti(V,Ie),Le=new Yi(V,Ie,Pe,Qe),Re=new $i(V,Le,Ie,Qe,Pe),Ke=new Qi(V,H,K),Ue=new Oi(G),ze=new Yo(P,Fe,Ne,H,Qe,Ue),Be=new xs(P,G),Ve=new es,He=new ss(Ne),Ge=new wi(P,Fe,U,Re,w,d),We=new ps(P,Re,H),$e=new Ss(V,Pe,H,U),qe=new Ei(V,Ne,Pe),Je=new Xi(V,Ne,Pe),Pe.programs=ze.programs,P.capabilities=H,P.extensions=Ne,P.properties=G,P.renderLists=Ve,P.shadowMap=We,P.state=U,P.info=Pe}tt(),T!==1009&&(re=new ta(T,t.width,t.height,r,i));let J=new vs(P,V);this.xr=J,this.getContext=function(){return V},this.getContextAttributes=function(){return V.getContextAttributes()},this.forceContextLoss=function(){let e=Ne.get(`WEBGL_lose_context`);e&&e.loseContext()},this.forceContextRestore=function(){let e=Ne.get(`WEBGL_lose_context`);e&&e.restoreContext()},this.getPixelRatio=function(){return B},this.setPixelRatio=function(e){e!==void 0&&(B=e,this.setSize(ge,_e,!1))},this.getSize=function(e){return e.set(ge,_e)},this.setSize=function(e,n,r=!0){if(J.isPresenting){F(`WebGLRenderer: Can't change size while VR device is presenting.`);return}ge=e,_e=n,t.width=Math.floor(e*B),t.height=Math.floor(n*B),r===!0&&(t.style.width=e+`px`,t.style.height=n+`px`),re!==null&&re.setSize(t.width,t.height),this.setViewport(0,0,e,n)},this.getDrawingBufferSize=function(e){return e.set(ge*B,_e*B).floor()},this.setDrawingBufferSize=function(e,n,r){ge=e,_e=n,B=r,t.width=Math.floor(e*r),t.height=Math.floor(n*r),this.setViewport(0,0,e,n)},this.setEffects=function(e){if(T===1009){I(`THREE.WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.`);return}if(e){for(let t=0;t<e.length;t++)if(e[t].isOutputPass===!0){F(`THREE.WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.`);break}}re.setEffects(e||[])},this.getCurrentViewport=function(e){return e.copy(fe)},this.getViewport=function(e){return e.copy(be)},this.setViewport=function(e,t,n,r){e.isVector4?be.set(e.x,e.y,e.z,e.w):be.set(e,t,n,r),U.viewport(fe.copy(be).multiplyScalar(B).round())},this.getScissor=function(e){return e.copy(xe)},this.setScissor=function(e,t,n,r){e.isVector4?xe.set(e.x,e.y,e.z,e.w):xe.set(e,t,n,r),U.scissor(pe.copy(xe).multiplyScalar(B).round())},this.getScissorTest=function(){return Se},this.setScissorTest=function(e){U.setScissorTest(Se=e)},this.setOpaqueSort=function(e){ve=e},this.setTransparentSort=function(e){ye=e},this.getClearColor=function(e){return e.copy(Ge.getClearColor())},this.setClearColor=function(){Ge.setClearColor(...arguments)},this.getClearAlpha=function(){return Ge.getClearAlpha()},this.setClearAlpha=function(){Ge.setClearAlpha(...arguments)},this.clear=function(e=!0,t=!0,n=!0){let r=0;if(e){let e=!1;if(L!==null){let t=L.texture.format;e=E.has(t)}if(e){let e=L.texture.type,t=D.has(e),n=Ge.getClearColor(),r=Ge.getClearAlpha(),i=n.r,a=n.g,o=n.b;t?(O[0]=i,O[1]=a,O[2]=o,O[3]=r,V.clearBufferuiv(V.COLOR,0,O)):(ee[0]=i,ee[1]=a,ee[2]=o,ee[3]=r,V.clearBufferiv(V.COLOR,0,ee))}else r|=V.COLOR_BUFFER_BIT}t&&(r|=V.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),n&&(r|=V.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),r!==0&&V.clear(r)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(e){e.setRenderer(this),se=e},this.dispose=function(){t.removeEventListener(`webglcontextlost`,nt,!1),t.removeEventListener(`webglcontextrestored`,rt,!1),t.removeEventListener(`webglcontextcreationerror`,it,!1),Ge.dispose(),Ve.dispose(),He.dispose(),G.dispose(),Fe.dispose(),Re.dispose(),Qe.dispose(),$e.dispose(),ze.dispose(),J.dispose(),J.removeEventListener(`sessionstart`,dt),J.removeEventListener(`sessionend`,ft),pt.stop()};function nt(e){e.preventDefault(),oe(`WebGLRenderer: Context Lost.`),ae=!0}function rt(){oe(`WebGLRenderer: Context Restored.`),ae=!1;let e=Pe.autoReset,t=We.enabled,n=We.autoUpdate,r=We.needsUpdate,i=We.type;tt(),Pe.autoReset=e,We.enabled=t,We.autoUpdate=n,We.needsUpdate=r,We.type=i}function it(e){I(`WebGLRenderer: A WebGL context could not be created. Reason: `,e.statusMessage)}function at(e){let t=e.target;t.removeEventListener(`dispose`,at),ot(t)}function ot(e){st(e),G.remove(e)}function st(e){let t=G.get(e).programs;t!==void 0&&(t.forEach(function(e){ze.releaseProgram(e)}),e.isShaderMaterial&&ze.releaseShaderCache(e))}this.renderBufferDirect=function(e,t,n,r,i,a){t===null&&(t=ke);let o=i.isMesh&&i.matrixWorld.determinant()<0,s=Ct(e,t,n,r,i);U.setMaterial(r,o);let c=n.index,l=1;if(r.wireframe===!0){if(c=Le.getWireframeAttribute(n),c===void 0)return;l=2}let u=n.drawRange,d=n.attributes.position,f=u.start*l,p=(u.start+u.count)*l;a!==null&&(f=Math.max(f,a.start*l),p=Math.min(p,(a.start+a.count)*l)),c===null?d!=null&&(f=Math.max(f,0),p=Math.min(p,d.count)):(f=Math.max(f,0),p=Math.min(p,c.count));let m=p-f;if(m<0||m===1/0)return;Qe.setup(i,r,s,n,c);let h,g=qe;if(c!==null&&(h=Ie.get(c),g=Je,g.setIndex(h)),i.isMesh)r.wireframe===!0?(U.setLineWidth(r.wireframeLinewidth*je()),g.setMode(V.LINES)):g.setMode(V.TRIANGLES);else if(i.isLine){let e=r.linewidth;e===void 0&&(e=1),U.setLineWidth(e*je()),i.isLineSegments?g.setMode(V.LINES):i.isLineLoop?g.setMode(V.LINE_LOOP):g.setMode(V.LINE_STRIP)}else i.isPoints?g.setMode(V.POINTS):i.isSprite&&g.setMode(V.TRIANGLES);if(i.isBatchedMesh)if(Ne.get(`WEBGL_multi_draw`))g.renderMultiDraw(i._multiDrawStarts,i._multiDrawCounts,i._multiDrawCount);else{let e=i._multiDrawStarts,t=i._multiDrawCounts,n=i._multiDrawCount,a=c?Ie.get(c).bytesPerElement:1,o=G.get(r).currentProgram.getUniforms();for(let r=0;r<n;r++)o.setValue(V,`_gl_DrawID`,r),g.render(e[r]/a,t[r])}else if(i.isInstancedMesh)g.renderInstances(f,m,i.count);else if(n.isInstancedBufferGeometry){let e=n._maxInstanceCount===void 0?1/0:n._maxInstanceCount,t=Math.min(n.instanceCount,e);g.renderInstances(f,m,t)}else g.render(f,m)};function ct(e,t,n){e.transparent===!0&&e.side===2&&e.forceSinglePass===!1?(e.side=1,e.needsUpdate=!0,yt(e,t,n),e.side=0,e.needsUpdate=!0,yt(e,t,n),e.side=2):yt(e,t,n)}this.compile=function(e,t,n=null){n===null&&(n=e),M=He.get(n),M.init(t),N.push(M),n.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(M.pushLight(e),e.castShadow&&M.pushShadow(e))}),e!==n&&e.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(M.pushLight(e),e.castShadow&&M.pushShadow(e))}),M.setupLights();let r=new Set;return e.traverse(function(e){if(!(e.isMesh||e.isPoints||e.isLine||e.isSprite))return;let t=e.material;if(t)if(Array.isArray(t))for(let i=0;i<t.length;i++){let a=t[i];ct(a,n,e),r.add(a)}else ct(t,n,e),r.add(t)}),M=N.pop(),r},this.compileAsync=function(e,t,n=null){let r=this.compile(e,t,n);return new Promise(t=>{function n(){if(r.forEach(function(e){G.get(e).currentProgram.isReady()&&r.delete(e)}),r.size===0){t(e);return}setTimeout(n,10)}Ne.get(`KHR_parallel_shader_compile`)===null?setTimeout(n,10):n()})};let lt=null;function ut(e){lt&&lt(e)}function dt(){pt.stop()}function ft(){pt.start()}let pt=new vi;pt.setAnimationLoop(ut),typeof self<`u`&&pt.setContext(self),this.setAnimationLoop=function(e){lt=e,J.setAnimationLoop(e),e===null?pt.stop():pt.start()},J.addEventListener(`sessionstart`,dt),J.addEventListener(`sessionend`,ft),this.render=function(e,t){if(t!==void 0&&t.isCamera!==!0){I(`WebGLRenderer.render: camera is not an instance of THREE.Camera.`);return}if(ae===!0)return;se!==null&&se.renderStart(e,t);let n=J.enabled===!0&&J.isPresenting===!0,r=re!==null&&(L===null||n)&&re.begin(P,L);if(e.matrixWorldAutoUpdate===!0&&e.updateMatrixWorld(),t.parent===null&&t.matrixWorldAutoUpdate===!0&&t.updateMatrixWorld(),J.enabled===!0&&J.isPresenting===!0&&(re===null||re.isCompositing()===!1)&&(J.cameraAutoUpdate===!0&&J.updateCamera(t),t=J.getCamera()),e.isScene===!0&&e.onBeforeRender(P,e,t,L),M=He.get(e,N.length),M.init(t),M.state.textureUnits=K.getTextureUnits(),N.push(M),Ee.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),Ce.setFromProjectionMatrix(Ee,ne,t.reversedDepth),Te=this.localClippingEnabled,we=Ue.init(this.clippingPlanes,Te),j=Ve.get(e,te.length),j.init(),te.push(j),J.enabled===!0&&J.isPresenting===!0){let e=P.xr.getDepthSensingMesh();e!==null&&mt(e,t,-1/0,P.sortObjects)}mt(e,t,0,P.sortObjects),j.finish(),P.sortObjects===!0&&j.sort(ve,ye),Ae=J.enabled===!1||J.isPresenting===!1||J.hasDepthSensing()===!1,Ae&&Ge.addToRenderList(j,e),this.info.render.frame++,we===!0&&Ue.beginShadows();let i=M.state.shadowsArray;if(We.render(i,e,t),we===!0&&Ue.endShadows(),this.info.autoReset===!0&&this.info.reset(),(r&&re.hasRenderPass())===!1){let n=j.opaque,r=j.transmissive;if(M.setupLights(),t.isArrayCamera){let i=t.cameras;if(r.length>0)for(let t=0,a=i.length;t<a;t++){let a=i[t];gt(n,r,e,a)}Ae&&Ge.render(e);for(let t=0,n=i.length;t<n;t++){let n=i[t];ht(j,e,n,n.viewport)}}else r.length>0&&gt(n,r,e,t),Ae&&Ge.render(e),ht(j,e,t)}L!==null&&ue===0&&(K.updateMultisampleRenderTarget(L),K.updateRenderTargetMipmap(L)),r&&re.end(P),e.isScene===!0&&e.onAfterRender(P,e,t),Qe.resetDefaultState(),R=-1,de=null,N.pop(),N.length>0?(M=N[N.length-1],K.setTextureUnits(M.state.textureUnits),we===!0&&Ue.setGlobalState(P.clippingPlanes,M.state.camera)):M=null,te.pop(),j=te.length>0?te[te.length-1]:null,se!==null&&se.renderEnd()};function mt(e,t,n,r){if(e.visible===!1)return;if(e.layers.test(t.layers)){if(e.isGroup)n=e.renderOrder;else if(e.isLOD)e.autoUpdate===!0&&e.update(t);else if(e.isLightProbeGrid)M.pushLightProbeGrid(e);else if(e.isLight)M.pushLight(e),e.castShadow&&M.pushShadow(e);else if(e.isSprite){if(!e.frustumCulled||Ce.intersectsSprite(e)){r&&Oe.setFromMatrixPosition(e.matrixWorld).applyMatrix4(Ee);let t=Re.update(e),i=e.material;i.visible&&j.push(e,t,i,n,Oe.z,null)}}else if((e.isMesh||e.isLine||e.isPoints)&&(!e.frustumCulled||Ce.intersectsObject(e))){let t=Re.update(e),i=e.material;if(r&&(e.boundingSphere===void 0?(t.boundingSphere===null&&t.computeBoundingSphere(),Oe.copy(t.boundingSphere.center)):(e.boundingSphere===null&&e.computeBoundingSphere(),Oe.copy(e.boundingSphere.center)),Oe.applyMatrix4(e.matrixWorld).applyMatrix4(Ee)),Array.isArray(i)){let r=t.groups;for(let a=0,o=r.length;a<o;a++){let o=r[a],s=i[o.materialIndex];s&&s.visible&&j.push(e,t,s,n,Oe.z,o)}}else i.visible&&j.push(e,t,i,n,Oe.z,null)}}let i=e.children;for(let e=0,a=i.length;e<a;e++)mt(i[e],t,n,r)}function ht(e,t,n,r){let{opaque:i,transmissive:a,transparent:o}=e;M.setupLightsView(n),we===!0&&Ue.setGlobalState(P.clippingPlanes,n),r&&U.viewport(fe.copy(r)),i.length>0&&_t(i,t,n),a.length>0&&_t(a,t,n),o.length>0&&_t(o,t,n),U.buffers.depth.setTest(!0),U.buffers.depth.setMask(!0),U.buffers.color.setMask(!0),U.setPolygonOffset(!1)}function gt(e,t,n,r){if((n.isScene===!0?n.overrideMaterial:null)!==null)return;if(M.state.transmissionRenderTarget[r.id]===void 0){let e=Ne.has(`EXT_color_buffer_half_float`)||Ne.has(`EXT_color_buffer_float`);M.state.transmissionRenderTarget[r.id]=new Ze(1,1,{generateMipmaps:!0,type:e?f:c,minFilter:s,samples:Math.max(4,H.samples),stencilBuffer:i,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:q.workingColorSpace})}let a=M.state.transmissionRenderTarget[r.id],o=r.viewport||fe;a.setSize(o.z*P.transmissionResolutionScale,o.w*P.transmissionResolutionScale);let l=P.getRenderTarget(),u=P.getActiveCubeFace(),d=P.getActiveMipmapLevel();P.setRenderTarget(a),P.getClearColor(z),he=P.getClearAlpha(),he<1&&P.setClearColor(16777215,.5),P.clear(),Ae&&Ge.render(n);let p=P.toneMapping;P.toneMapping=0;let m=r.viewport;if(r.viewport!==void 0&&(r.viewport=void 0),M.setupLightsView(r),we===!0&&Ue.setGlobalState(P.clippingPlanes,r),_t(e,n,r),K.updateMultisampleRenderTarget(a),K.updateRenderTargetMipmap(a),Ne.has(`WEBGL_multisampled_render_to_texture`)===!1){let e=!1;for(let i=0,a=t.length;i<a;i++){let{object:a,geometry:o,material:s,group:c}=t[i];if(s.side===2&&a.layers.test(r.layers)){let t=s.side;s.side=1,s.needsUpdate=!0,vt(a,n,r,o,s,c),s.side=t,s.needsUpdate=!0,e=!0}}e===!0&&(K.updateMultisampleRenderTarget(a),K.updateRenderTargetMipmap(a))}P.setRenderTarget(l,u,d),P.setClearColor(z,he),m!==void 0&&(r.viewport=m),P.toneMapping=p}function _t(e,t,n){let r=t.isScene===!0?t.overrideMaterial:null;for(let i=0,a=e.length;i<a;i++){let a=e[i],{object:o,geometry:s,group:c}=a,l=a.material;l.allowOverride===!0&&r!==null&&(l=r),o.layers.test(n.layers)&&vt(o,t,n,s,l,c)}}function vt(e,t,n,r,i,a){e.onBeforeRender(P,t,n,r,i,a),e.modelViewMatrix.multiplyMatrices(n.matrixWorldInverse,e.matrixWorld),e.normalMatrix.getNormalMatrix(e.modelViewMatrix),i.onBeforeRender(P,t,n,r,e,a),i.transparent===!0&&i.side===2&&i.forceSinglePass===!1?(i.side=1,i.needsUpdate=!0,P.renderBufferDirect(n,t,r,i,e,a),i.side=0,i.needsUpdate=!0,P.renderBufferDirect(n,t,r,i,e,a),i.side=2):P.renderBufferDirect(n,t,r,i,e,a),e.onAfterRender(P,t,n,r,i,a)}function yt(e,t,n){t.isScene!==!0&&(t=ke);let r=G.get(e),i=M.state.lights,a=M.state.shadowsArray,o=i.state.version,s=ze.getParameters(e,i.state,a,t,n,M.state.lightProbeGridArray),c=ze.getProgramCacheKey(s),l=r.programs;r.environment=e.isMeshStandardMaterial||e.isMeshLambertMaterial||e.isMeshPhongMaterial?t.environment:null,r.fog=t.fog;let u=e.isMeshStandardMaterial||e.isMeshLambertMaterial&&!e.envMap||e.isMeshPhongMaterial&&!e.envMap;r.envMap=Fe.get(e.envMap||r.environment,u),r.envMapRotation=r.environment!==null&&e.envMap===null?t.environmentRotation:e.envMapRotation,l===void 0&&(e.addEventListener(`dispose`,at),l=new Map,r.programs=l);let d=l.get(c);if(d!==void 0){if(r.currentProgram===d&&r.lightsStateVersion===o)return xt(e,s),d}else s.uniforms=ze.getUniforms(e),se!==null&&e.isNodeMaterial&&se.build(e,n,s),e.onBeforeCompile(s,P),d=ze.acquireProgram(s,c),l.set(c,d),r.uniforms=s.uniforms;let f=r.uniforms;return(!e.isShaderMaterial&&!e.isRawShaderMaterial||e.clipping===!0)&&(f.clippingPlanes=Ue.uniform),xt(e,s),r.needsLights=Tt(e),r.lightsStateVersion=o,r.needsLights&&(f.ambientLightColor.value=i.state.ambient,f.lightProbe.value=i.state.probe,f.directionalLights.value=i.state.directional,f.directionalLightShadows.value=i.state.directionalShadow,f.spotLights.value=i.state.spot,f.spotLightShadows.value=i.state.spotShadow,f.rectAreaLights.value=i.state.rectArea,f.ltc_1.value=i.state.rectAreaLTC1,f.ltc_2.value=i.state.rectAreaLTC2,f.pointLights.value=i.state.point,f.pointLightShadows.value=i.state.pointShadow,f.hemisphereLights.value=i.state.hemi,f.directionalShadowMatrix.value=i.state.directionalShadowMatrix,f.spotLightMatrix.value=i.state.spotLightMatrix,f.spotLightMap.value=i.state.spotLightMap,f.pointShadowMatrix.value=i.state.pointShadowMatrix),r.lightProbeGrid=M.state.lightProbeGridArray.length>0,r.currentProgram=d,r.uniformsList=null,d}function bt(e){if(e.uniformsList===null){let t=e.currentProgram.getUniforms();e.uniformsList=co.seqWithValue(t.seq,e.uniforms)}return e.uniformsList}function xt(e,t){let n=G.get(e);n.outputColorSpace=t.outputColorSpace,n.batching=t.batching,n.batchingColor=t.batchingColor,n.instancing=t.instancing,n.instancingColor=t.instancingColor,n.instancingMorph=t.instancingMorph,n.skinning=t.skinning,n.morphTargets=t.morphTargets,n.morphNormals=t.morphNormals,n.morphColors=t.morphColors,n.morphTargetsCount=t.morphTargetsCount,n.numClippingPlanes=t.numClippingPlanes,n.numIntersection=t.numClipIntersection,n.vertexAlphas=t.vertexAlphas,n.vertexTangents=t.vertexTangents,n.toneMapping=t.toneMapping}function St(e,t){if(e.length===0)return null;if(e.length===1)return e[0].texture===null?null:e[0];A.setFromMatrixPosition(t.matrixWorld);for(let t=0,n=e.length;t<n;t++){let n=e[t];if(n.texture!==null&&n.boundingBox.containsPoint(A))return n}return null}function Ct(e,t,n,r,i){t.isScene!==!0&&(t=ke),K.resetTextureUnits();let a=t.fog,o=r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial?t.environment:null,s=L===null?P.outputColorSpace:L.isXRRenderTarget===!0?L.texture.colorSpace:q.workingColorSpace,c=r.isMeshStandardMaterial||r.isMeshLambertMaterial&&!r.envMap||r.isMeshPhongMaterial&&!r.envMap,l=Fe.get(r.envMap||o,c),u=r.vertexColors===!0&&!!n.attributes.color&&n.attributes.color.itemSize===4,d=!!n.attributes.tangent&&(!!r.normalMap||r.anisotropy>0),f=!!n.morphAttributes.position,p=!!n.morphAttributes.normal,m=!!n.morphAttributes.color,h=0;r.toneMapped&&(L===null||L.isXRRenderTarget===!0)&&(h=P.toneMapping);let g=n.morphAttributes.position||n.morphAttributes.normal||n.morphAttributes.color,_=g===void 0?0:g.length,v=G.get(r),y=M.state.lights;if(we===!0&&(Te===!0||e!==de)){let t=e===de&&r.id===R;Ue.setState(r,e,t)}let b=!1;r.version===v.__version?v.needsLights&&v.lightsStateVersion!==y.state.version?b=!0:v.outputColorSpace===s?i.isBatchedMesh&&v.batching===!1||!i.isBatchedMesh&&v.batching===!0||i.isBatchedMesh&&v.batchingColor===!0&&i.colorTexture===null||i.isBatchedMesh&&v.batchingColor===!1&&i.colorTexture!==null||i.isInstancedMesh&&v.instancing===!1||!i.isInstancedMesh&&v.instancing===!0||i.isSkinnedMesh&&v.skinning===!1||!i.isSkinnedMesh&&v.skinning===!0||i.isInstancedMesh&&v.instancingColor===!0&&i.instanceColor===null||i.isInstancedMesh&&v.instancingColor===!1&&i.instanceColor!==null||i.isInstancedMesh&&v.instancingMorph===!0&&i.morphTexture===null||i.isInstancedMesh&&v.instancingMorph===!1&&i.morphTexture!==null?b=!0:v.envMap===l?r.fog===!0&&v.fog!==a||v.numClippingPlanes!==void 0&&(v.numClippingPlanes!==Ue.numPlanes||v.numIntersection!==Ue.numIntersection)?b=!0:v.vertexAlphas===u&&v.vertexTangents===d&&v.morphTargets===f&&v.morphNormals===p&&v.morphColors===m&&v.toneMapping===h&&v.morphTargetsCount===_?!!v.lightProbeGrid!=M.state.lightProbeGridArray.length>0&&(b=!0):b=!0:b=!0:b=!0:(b=!0,v.__version=r.version);let x=v.currentProgram;b===!0&&(x=yt(r,t,i),se&&r.isNodeMaterial&&se.onUpdateProgram(r,x,v));let S=!1,C=!1,w=!1,T=x.getUniforms(),E=v.uniforms;if(U.useProgram(x.program)&&(S=!0,C=!0,w=!0),r.id!==R&&(R=r.id,C=!0),v.needsLights){let e=St(M.state.lightProbeGridArray,i);v.lightProbeGrid!==e&&(v.lightProbeGrid=e,C=!0)}if(S||de!==e){U.buffers.depth.getReversed()&&e.reversedDepth!==!0&&(e._reversedDepth=!0,e.updateProjectionMatrix()),T.setValue(V,`projectionMatrix`,e.projectionMatrix),T.setValue(V,`viewMatrix`,e.matrixWorldInverse);let t=T.map.cameraPosition;t!==void 0&&t.setValue(V,De.setFromMatrixPosition(e.matrixWorld)),H.logarithmicDepthBuffer&&T.setValue(V,`logDepthBufFC`,2/(Math.log(e.far+1)/Math.LN2)),(r.isMeshPhongMaterial||r.isMeshToonMaterial||r.isMeshLambertMaterial||r.isMeshBasicMaterial||r.isMeshStandardMaterial||r.isShaderMaterial)&&T.setValue(V,`isOrthographic`,e.isOrthographicCamera===!0),de!==e&&(de=e,C=!0,w=!0)}if(v.needsLights&&(y.state.directionalShadowMap.length>0&&T.setValue(V,`directionalShadowMap`,y.state.directionalShadowMap,K),y.state.spotShadowMap.length>0&&T.setValue(V,`spotShadowMap`,y.state.spotShadowMap,K),y.state.pointShadowMap.length>0&&T.setValue(V,`pointShadowMap`,y.state.pointShadowMap,K)),i.isSkinnedMesh){T.setOptional(V,i,`bindMatrix`),T.setOptional(V,i,`bindMatrixInverse`);let e=i.skeleton;e&&(e.boneTexture===null&&e.computeBoneTexture(),T.setValue(V,`boneTexture`,e.boneTexture,K))}i.isBatchedMesh&&(T.setOptional(V,i,`batchingTexture`),T.setValue(V,`batchingTexture`,i._matricesTexture,K),T.setOptional(V,i,`batchingIdTexture`),T.setValue(V,`batchingIdTexture`,i._indirectTexture,K),T.setOptional(V,i,`batchingColorTexture`),i._colorsTexture!==null&&T.setValue(V,`batchingColorTexture`,i._colorsTexture,K));let D=n.morphAttributes;if((D.position!==void 0||D.normal!==void 0||D.color!==void 0)&&Ke.update(i,n,x),(C||v.receiveShadow!==i.receiveShadow)&&(v.receiveShadow=i.receiveShadow,T.setValue(V,`receiveShadow`,i.receiveShadow)),(r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial)&&r.envMap===null&&t.environment!==null&&(E.envMapIntensity.value=t.environmentIntensity),E.dfgLUT!==void 0&&(E.dfgLUT.value=Ts()),C){if(T.setValue(V,`toneMappingExposure`,P.toneMappingExposure),v.needsLights&&wt(E,w),a&&r.fog===!0&&Be.refreshFogUniforms(E,a),Be.refreshMaterialUniforms(E,r,B,_e,M.state.transmissionRenderTarget[e.id]),v.needsLights&&v.lightProbeGrid){let e=v.lightProbeGrid;E.probesSH.value=e.texture,E.probesMin.value.copy(e.boundingBox.min),E.probesMax.value.copy(e.boundingBox.max),E.probesResolution.value.copy(e.resolution)}co.upload(V,bt(v),E,K)}if(r.isShaderMaterial&&r.uniformsNeedUpdate===!0&&(co.upload(V,bt(v),E,K),r.uniformsNeedUpdate=!1),r.isSpriteMaterial&&T.setValue(V,`center`,i.center),T.setValue(V,`modelViewMatrix`,i.modelViewMatrix),T.setValue(V,`normalMatrix`,i.normalMatrix),T.setValue(V,`modelMatrix`,i.matrixWorld),r.uniformsGroups!==void 0){let e=r.uniformsGroups;for(let t=0,n=e.length;t<n;t++){let n=e[t];$e.update(n,x),$e.bind(n,x)}}return x}function wt(e,t){e.ambientLightColor.needsUpdate=t,e.lightProbe.needsUpdate=t,e.directionalLights.needsUpdate=t,e.directionalLightShadows.needsUpdate=t,e.pointLights.needsUpdate=t,e.pointLightShadows.needsUpdate=t,e.spotLights.needsUpdate=t,e.spotLightShadows.needsUpdate=t,e.rectAreaLights.needsUpdate=t,e.hemisphereLights.needsUpdate=t}function Tt(e){return e.isMeshLambertMaterial||e.isMeshToonMaterial||e.isMeshPhongMaterial||e.isMeshStandardMaterial||e.isShadowMaterial||e.isShaderMaterial&&e.lights===!0}this.getActiveCubeFace=function(){return ce},this.getActiveMipmapLevel=function(){return ue},this.getRenderTarget=function(){return L},this.setRenderTargetTextures=function(e,t,n){let r=G.get(e);r.__autoAllocateDepthBuffer=e.resolveDepthBuffer===!1,r.__autoAllocateDepthBuffer===!1&&(r.__useRenderToTexture=!1),G.get(e.texture).__webglTexture=t,G.get(e.depthTexture).__webglTexture=r.__autoAllocateDepthBuffer?void 0:n,r.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(e,t){let n=G.get(e);n.__webglFramebuffer=t,n.__useDefaultFramebuffer=t===void 0};let Et=V.createFramebuffer();this.setRenderTarget=function(e,t=0,n=0){L=e,ce=t,ue=n;let r=null,i=!1,a=!1;if(e){let o=G.get(e);if(o.__useDefaultFramebuffer!==void 0){U.bindFramebuffer(V.FRAMEBUFFER,o.__webglFramebuffer),fe.copy(e.viewport),pe.copy(e.scissor),me=e.scissorTest,U.viewport(fe),U.scissor(pe),U.setScissorTest(me),R=-1;return}else if(o.__webglFramebuffer===void 0)K.setupRenderTarget(e);else if(o.__hasExternalTextures)K.rebindTextures(e,G.get(e.texture).__webglTexture,G.get(e.depthTexture).__webglTexture);else if(e.depthBuffer){let t=e.depthTexture;if(o.__boundDepthTexture!==t){if(t!==null&&G.has(t)&&(e.width!==t.image.width||e.height!==t.image.height))throw Error(`WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.`);K.setupDepthRenderbuffer(e)}}let s=e.texture;(s.isData3DTexture||s.isDataArrayTexture||s.isCompressedArrayTexture)&&(a=!0);let c=G.get(e).__webglFramebuffer;e.isWebGLCubeRenderTarget?(r=Array.isArray(c[t])?c[t][n]:c[t],i=!0):r=e.samples>0&&K.useMultisampledRTT(e)===!1?G.get(e).__webglMultisampledFramebuffer:Array.isArray(c)?c[n]:c,fe.copy(e.viewport),pe.copy(e.scissor),me=e.scissorTest}else fe.copy(be).multiplyScalar(B).floor(),pe.copy(xe).multiplyScalar(B).floor(),me=Se;if(n!==0&&(r=Et),U.bindFramebuffer(V.FRAMEBUFFER,r)&&U.drawBuffers(e,r),U.viewport(fe),U.scissor(pe),U.setScissorTest(me),i){let r=G.get(e.texture);V.framebufferTexture2D(V.FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_CUBE_MAP_POSITIVE_X+t,r.__webglTexture,n)}else if(a){let r=t;for(let t=0;t<e.textures.length;t++){let i=G.get(e.textures[t]);V.framebufferTextureLayer(V.FRAMEBUFFER,V.COLOR_ATTACHMENT0+t,i.__webglTexture,n,r)}}else if(e!==null&&n!==0){let t=G.get(e.texture);V.framebufferTexture2D(V.FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_2D,t.__webglTexture,n)}R=-1},this.readRenderTargetPixels=function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget)){I(`WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);return}let c=G.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o]),c){U.bindFramebuffer(V.FRAMEBUFFER,c);try{let o=e.textures[s],c=o.format,l=o.type;if(e.textures.length>1&&V.readBuffer(V.COLOR_ATTACHMENT0+s),!H.textureFormatReadable(c)){I(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.`);return}if(!H.textureTypeReadable(l)){I(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.`);return}t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i&&V.readPixels(t,n,r,i,Xe.convert(c),Xe.convert(l),a)}finally{let e=L===null?null:G.get(L).__webglFramebuffer;U.bindFramebuffer(V.FRAMEBUFFER,e)}}},this.readRenderTargetPixelsAsync=async function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget))throw Error(`THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);let c=G.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o]),c)if(t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i){U.bindFramebuffer(V.FRAMEBUFFER,c);let o=e.textures[s],l=o.format,u=o.type;if(e.textures.length>1&&V.readBuffer(V.COLOR_ATTACHMENT0+s),!H.textureFormatReadable(l))throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.`);if(!H.textureTypeReadable(u))throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.`);let d=V.createBuffer();V.bindBuffer(V.PIXEL_PACK_BUFFER,d),V.bufferData(V.PIXEL_PACK_BUFFER,a.byteLength,V.STREAM_READ),V.readPixels(t,n,r,i,Xe.convert(l),Xe.convert(u),0);let f=L===null?null:G.get(L).__webglFramebuffer;U.bindFramebuffer(V.FRAMEBUFFER,f);let p=V.fenceSync(V.SYNC_GPU_COMMANDS_COMPLETE,0);return V.flush(),await le(V,p,4),V.bindBuffer(V.PIXEL_PACK_BUFFER,d),V.getBufferSubData(V.PIXEL_PACK_BUFFER,0,a),V.deleteBuffer(d),V.deleteSync(p),a}else throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.`)},this.copyFramebufferToTexture=function(e,t=null,n=0){let r=2**-n,i=Math.floor(e.image.width*r),a=Math.floor(e.image.height*r),o=t===null?0:t.x,s=t===null?0:t.y;K.setTexture2D(e,0),V.copyTexSubImage2D(V.TEXTURE_2D,n,0,0,o,s,i,a),U.unbindTexture()};let Dt=V.createFramebuffer(),Ot=V.createFramebuffer();this.copyTextureToTexture=function(e,t,n=null,r=null,i=0,a=0){let o,s,c,l,u,d,f,p,m,h=e.isCompressedTexture?e.mipmaps[a]:e.image;if(n!==null)o=n.max.x-n.min.x,s=n.max.y-n.min.y,c=n.isBox3?n.max.z-n.min.z:1,l=n.min.x,u=n.min.y,d=n.isBox3?n.min.z:0;else{let t=2**-i;o=Math.floor(h.width*t),s=Math.floor(h.height*t),c=e.isDataArrayTexture?h.depth:e.isData3DTexture?Math.floor(h.depth*t):1,l=0,u=0,d=0}r===null?(f=0,p=0,m=0):(f=r.x,p=r.y,m=r.z);let g=Xe.convert(t.format),_=Xe.convert(t.type),v;t.isData3DTexture?(K.setTexture3D(t,0),v=V.TEXTURE_3D):t.isDataArrayTexture||t.isCompressedArrayTexture?(K.setTexture2DArray(t,0),v=V.TEXTURE_2D_ARRAY):(K.setTexture2D(t,0),v=V.TEXTURE_2D),U.activeTexture(V.TEXTURE0),U.pixelStorei(V.UNPACK_FLIP_Y_WEBGL,t.flipY),U.pixelStorei(V.UNPACK_PREMULTIPLY_ALPHA_WEBGL,t.premultiplyAlpha),U.pixelStorei(V.UNPACK_ALIGNMENT,t.unpackAlignment);let y=U.getParameter(V.UNPACK_ROW_LENGTH),b=U.getParameter(V.UNPACK_IMAGE_HEIGHT),x=U.getParameter(V.UNPACK_SKIP_PIXELS),S=U.getParameter(V.UNPACK_SKIP_ROWS),C=U.getParameter(V.UNPACK_SKIP_IMAGES);U.pixelStorei(V.UNPACK_ROW_LENGTH,h.width),U.pixelStorei(V.UNPACK_IMAGE_HEIGHT,h.height),U.pixelStorei(V.UNPACK_SKIP_PIXELS,l),U.pixelStorei(V.UNPACK_SKIP_ROWS,u),U.pixelStorei(V.UNPACK_SKIP_IMAGES,d);let w=e.isDataArrayTexture||e.isData3DTexture,T=t.isDataArrayTexture||t.isData3DTexture;if(e.isDepthTexture){let n=G.get(e),r=G.get(t),h=G.get(n.__renderTarget),g=G.get(r.__renderTarget);U.bindFramebuffer(V.READ_FRAMEBUFFER,h.__webglFramebuffer),U.bindFramebuffer(V.DRAW_FRAMEBUFFER,g.__webglFramebuffer);for(let n=0;n<c;n++)w&&(V.framebufferTextureLayer(V.READ_FRAMEBUFFER,V.COLOR_ATTACHMENT0,G.get(e).__webglTexture,i,d+n),V.framebufferTextureLayer(V.DRAW_FRAMEBUFFER,V.COLOR_ATTACHMENT0,G.get(t).__webglTexture,a,m+n)),V.blitFramebuffer(l,u,o,s,f,p,o,s,V.DEPTH_BUFFER_BIT,V.NEAREST);U.bindFramebuffer(V.READ_FRAMEBUFFER,null),U.bindFramebuffer(V.DRAW_FRAMEBUFFER,null)}else if(i!==0||e.isRenderTargetTexture||G.has(e)){let n=G.get(e),r=G.get(t);U.bindFramebuffer(V.READ_FRAMEBUFFER,Dt),U.bindFramebuffer(V.DRAW_FRAMEBUFFER,Ot);for(let e=0;e<c;e++)w?V.framebufferTextureLayer(V.READ_FRAMEBUFFER,V.COLOR_ATTACHMENT0,n.__webglTexture,i,d+e):V.framebufferTexture2D(V.READ_FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_2D,n.__webglTexture,i),T?V.framebufferTextureLayer(V.DRAW_FRAMEBUFFER,V.COLOR_ATTACHMENT0,r.__webglTexture,a,m+e):V.framebufferTexture2D(V.DRAW_FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_2D,r.__webglTexture,a),i===0?T?V.copyTexSubImage3D(v,a,f,p,m+e,l,u,o,s):V.copyTexSubImage2D(v,a,f,p,l,u,o,s):V.blitFramebuffer(l,u,o,s,f,p,o,s,V.COLOR_BUFFER_BIT,V.NEAREST);U.bindFramebuffer(V.READ_FRAMEBUFFER,null),U.bindFramebuffer(V.DRAW_FRAMEBUFFER,null)}else T?e.isDataTexture||e.isData3DTexture?V.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h.data):t.isCompressedArrayTexture?V.compressedTexSubImage3D(v,a,f,p,m,o,s,c,g,h.data):V.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h):e.isDataTexture?V.texSubImage2D(V.TEXTURE_2D,a,f,p,o,s,g,_,h.data):e.isCompressedTexture?V.compressedTexSubImage2D(V.TEXTURE_2D,a,f,p,h.width,h.height,g,h.data):V.texSubImage2D(V.TEXTURE_2D,a,f,p,o,s,g,_,h);U.pixelStorei(V.UNPACK_ROW_LENGTH,y),U.pixelStorei(V.UNPACK_IMAGE_HEIGHT,b),U.pixelStorei(V.UNPACK_SKIP_PIXELS,x),U.pixelStorei(V.UNPACK_SKIP_ROWS,S),U.pixelStorei(V.UNPACK_SKIP_IMAGES,C),a===0&&t.generateMipmaps&&V.generateMipmap(v),U.unbindTexture()},this.initRenderTarget=function(e){G.get(e).__webglFramebuffer===void 0&&K.setupRenderTarget(e)},this.initTexture=function(e){e.isCubeTexture?K.setTextureCube(e,0):e.isData3DTexture?K.setTexture3D(e,0):e.isDataArrayTexture||e.isCompressedArrayTexture?K.setTexture2DArray(e,0):K.setTexture2D(e,0),U.unbindTexture()},this.resetState=function(){ce=0,ue=0,L=null,U.reset(),Qe.reset()},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}get coordinateSystem(){return ne}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=q._getDrawingBufferColorSpace(e),t.unpackColorSpace=q._getUnpackColorSpace()}};let Ds={type:`change`},Os={type:`start`},ks={type:`end`},As=new Bn,js=new or,Ms=Math.cos(70*Ne.DEG2RAD),Ns=new W,Ps=2*Math.PI,Q={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Fs=1e-6;var Is=class extends hi{constructor(n,r=null){super(n,r),this.state=Q.NONE,this.target=new W,this.cursor=new W,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:`ArrowLeft`,UP:`ArrowUp`,RIGHT:`ArrowRight`,BOTTOM:`ArrowDown`},this.mouseButtons={LEFT:e.ROTATE,MIDDLE:e.DOLLY,RIGHT:e.PAN},this.touches={ONE:t.ROTATE,TWO:t.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle=`auto`,this._domElementKeyEvents=null,this._lastPosition=new W,this._lastQuaternion=new U,this._lastTargetPosition=new W,this._quat=new U().setFromUnitVectors(n.up,new W(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new mi,this._sphericalDelta=new mi,this._scale=1,this._panOffset=new W,this._rotateStart=new H,this._rotateEnd=new H,this._rotateDelta=new H,this._panStart=new H,this._panEnd=new H,this._panDelta=new H,this._dollyStart=new H,this._dollyEnd=new H,this._dollyDelta=new H,this._dollyDirection=new W,this._mouse=new H,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=Rs.bind(this),this._onPointerDown=Ls.bind(this),this._onPointerUp=zs.bind(this),this._onContextMenu=Ks.bind(this),this._onMouseWheel=Hs.bind(this),this._onKeyDown=Us.bind(this),this._onTouchStart=Ws.bind(this),this._onTouchMove=Gs.bind(this),this._onMouseDown=Bs.bind(this),this._onMouseMove=Vs.bind(this),this._interceptControlDown=qs.bind(this),this._interceptControlUp=Js.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(e){this._cursorStyle=e,e===`grab`?this.domElement.style.cursor=`grab`:this.domElement.style.cursor=`auto`}get cursorStyle(){return this._cursorStyle}connect(e){super.connect(e),this.domElement.addEventListener(`pointerdown`,this._onPointerDown),this.domElement.addEventListener(`pointercancel`,this._onPointerUp),this.domElement.addEventListener(`contextmenu`,this._onContextMenu),this.domElement.addEventListener(`wheel`,this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener(`keydown`,this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction=`none`}disconnect(){this.domElement.removeEventListener(`pointerdown`,this._onPointerDown),this.domElement.ownerDocument.removeEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.removeEventListener(`pointerup`,this._onPointerUp),this.domElement.removeEventListener(`pointercancel`,this._onPointerUp),this.domElement.removeEventListener(`wheel`,this._onMouseWheel),this.domElement.removeEventListener(`contextmenu`,this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener(`keydown`,this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction=``}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener(`keydown`,this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener(`keydown`,this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(Ds),this.update(),this.state=Q.NONE}pan(e,t){this._pan(e,t),this.update()}dollyIn(e){this._dollyIn(e),this.update()}dollyOut(e){this._dollyOut(e),this.update()}rotateLeft(e){this._rotateLeft(e),this.update()}rotateUp(e){this._rotateUp(e),this.update()}update(e=null){let t=this.object.position;Ns.copy(t).sub(this.target),Ns.applyQuaternion(this._quat),this._spherical.setFromVector3(Ns),this.autoRotate&&this.state===Q.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,r=this.maxAzimuthAngle;isFinite(n)&&isFinite(r)&&(n<-Math.PI?n+=Ps:n>Math.PI&&(n-=Ps),r<-Math.PI?r+=Ps:r>Math.PI&&(r-=Ps),n<=r?this._spherical.theta=Math.max(n,Math.min(r,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+r)/2?Math.max(n,this._spherical.theta):Math.min(r,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let i=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let e=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),i=e!=this._spherical.radius}if(Ns.setFromSpherical(this._spherical),Ns.applyQuaternion(this._quatInverse),t.copy(this.target).add(Ns),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let e=null;if(this.object.isPerspectiveCamera){let t=Ns.length();e=this._clampDistance(t*this._scale);let n=t-e;this.object.position.addScaledVector(this._dollyDirection,n),this.object.updateMatrixWorld(),i=!!n}else if(this.object.isOrthographicCamera){let t=new W(this._mouse.x,this._mouse.y,0);t.unproject(this.object);let n=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),i=n!==this.object.zoom;let r=new W(this._mouse.x,this._mouse.y,0);r.unproject(this.object),this.object.position.sub(r).add(t),this.object.updateMatrixWorld(),e=Ns.length()}else console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled.`),this.zoomToCursor=!1;e!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(e).add(this.object.position):(As.origin.copy(this.object.position),As.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(As.direction))<Ms?this.object.lookAt(this.target):(js.setFromNormalAndCoplanarPoint(this.object.up,this.target),As.intersectPlane(js,this.target))))}else if(this.object.isOrthographicCamera){let e=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),e!==this.object.zoom&&(this.object.updateProjectionMatrix(),i=!0)}return this._scale=1,this._performCursorZoom=!1,i||this._lastPosition.distanceToSquared(this.object.position)>Fs||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Fs||this._lastTargetPosition.distanceToSquared(this.target)>Fs?(this.dispatchEvent(Ds),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e===null?Ps/60/60*this.autoRotateSpeed:Ps/60*this.autoRotateSpeed*e}_getZoomScale(e){let t=Math.abs(e*.01);return .95**(this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){Ns.setFromMatrixColumn(t,0),Ns.multiplyScalar(-e),this._panOffset.add(Ns)}_panUp(e,t){this.screenSpacePanning===!0?Ns.setFromMatrixColumn(t,1):(Ns.setFromMatrixColumn(t,0),Ns.crossVectors(this.object.up,Ns)),Ns.multiplyScalar(e),this._panOffset.add(Ns)}_pan(e,t){let n=this.domElement;if(this.object.isPerspectiveCamera){let r=this.object.position;Ns.copy(r).sub(this.target);let i=Ns.length();i*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*i/n.clientHeight,this.object.matrix),this._panUp(2*t*i/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.`),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.`),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.`),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),r=e-n.left,i=t-n.top,a=n.width,o=n.height;this._mouse.x=r/a*2-1,this._mouse.y=-(i/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(Ps*this._rotateDelta.x/t.clientHeight),this._rotateUp(Ps*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(Ps*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-Ps*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(Ps*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-Ps*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),t=!0;break}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._rotateStart.set(n,r)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panStart.set(n,r)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,r=e.pageY-t.y,i=Math.sqrt(n*n+r*r);this._dollyStart.set(0,i)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._rotateEnd.set(n,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(Ps*this._rotateDelta.x/t.clientHeight),this._rotateUp(Ps*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panEnd.set(n,r)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,r=e.pageY-t.y,i=Math.sqrt(n*n+r*r);this._dollyEnd.set(0,i),this._dollyDelta.set(0,(this._dollyEnd.y/this._dollyStart.y)**+this.zoomSpeed),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let a=(e.pageX+t.x)*.5,o=(e.pageY+t.y)*.5;this._updateZoomParameters(a,o)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new H,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,n={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}};function Ls(e){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(e.pointerId),this.domElement.ownerDocument.addEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.addEventListener(`pointerup`,this._onPointerUp)),!this._isTrackingPointer(e)&&(this._addPointer(e),e.pointerType===`touch`?this._onTouchStart(e):this._onMouseDown(e),this._cursorStyle===`grab`&&(this.domElement.style.cursor=`grabbing`)))}function Rs(e){this.enabled!==!1&&(e.pointerType===`touch`?this._onTouchMove(e):this._onMouseMove(e))}function zs(e){switch(this._removePointer(e),this._pointers.length){case 0:this.domElement.releasePointerCapture(e.pointerId),this.domElement.ownerDocument.removeEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.removeEventListener(`pointerup`,this._onPointerUp),this.dispatchEvent(ks),this.state=Q.NONE,this._cursorStyle===`grab`&&(this.domElement.style.cursor=`grab`);break;case 1:let t=this._pointers[0],n=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:n.x,pageY:n.y});break}}function Bs(t){let n;switch(t.button){case 0:n=this.mouseButtons.LEFT;break;case 1:n=this.mouseButtons.MIDDLE;break;case 2:n=this.mouseButtons.RIGHT;break;default:n=-1}switch(n){case e.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(t),this.state=Q.DOLLY;break;case e.ROTATE:if(t.ctrlKey||t.metaKey||t.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(t),this.state=Q.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(t),this.state=Q.ROTATE}break;case e.PAN:if(t.ctrlKey||t.metaKey||t.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(t),this.state=Q.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(t),this.state=Q.PAN}break;default:this.state=Q.NONE}this.state!==Q.NONE&&this.dispatchEvent(Os)}function Vs(e){switch(this.state){case Q.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(e);break;case Q.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(e);break;case Q.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(e);break}}function Hs(e){this.enabled===!1||this.enableZoom===!1||this.state!==Q.NONE||(e.preventDefault(),this.dispatchEvent(Os),this._handleMouseWheel(this._customWheelEvent(e)),this.dispatchEvent(ks))}function Us(e){this.enabled!==!1&&this._handleKeyDown(e)}function Ws(e){switch(this._trackPointer(e),this._pointers.length){case 1:switch(this.touches.ONE){case t.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(e),this.state=Q.TOUCH_ROTATE;break;case t.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(e),this.state=Q.TOUCH_PAN;break;default:this.state=Q.NONE}break;case 2:switch(this.touches.TWO){case t.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(e),this.state=Q.TOUCH_DOLLY_PAN;break;case t.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(e),this.state=Q.TOUCH_DOLLY_ROTATE;break;default:this.state=Q.NONE}break;default:this.state=Q.NONE}this.state!==Q.NONE&&this.dispatchEvent(Os)}function Gs(e){switch(this._trackPointer(e),this.state){case Q.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(e),this.update();break;case Q.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(e),this.update();break;case Q.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(e),this.update();break;case Q.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(e),this.update();break;default:this.state=Q.NONE}}function Ks(e){this.enabled!==!1&&e.preventDefault()}function qs(e){e.key===`Control`&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener(`keyup`,this._interceptControlUp,{passive:!0,capture:!0}))}function Js(e){e.key===`Control`&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener(`keyup`,this._interceptControlUp,{passive:!0,capture:!0}))}let Ys=Object.freeze({ocean:`#246BC4`,land:`#6343B5`}),Xs=Object.freeze({...Ys,ocean:`#707070`}),Zs=Object.freeze({ocean:Xs.ocean,land:`#08090B`});Math.PI/180,Object.freeze([33.333333333333336,45]);let Qs=Object.freeze(Array.from({length:220},(e,t)=>({radius:190+t*1.375,opacity:.035+t*37%17/240,width:t%9==0?.8:.45}))),$s=[238,310,372,431,471],ec=(e,t=0,n=1)=>Math.max(t,Math.min(n,e)),tc=(e,t)=>(e%t+t)%t,nc=(e,t,n)=>e+(t-e)*n,$=(e,t=e,n=e,r=1)=>[e/255,t/255,n/255,r],rc=$(0,0,0,0),ic=[[0,rc],[.45,$(75,75,77,.1)],[.8,$(2,2,3)],[1.25,$(31,31,32,.38)],[1.75,$(9,9,10)],[2.15,$(4,4,5)]],ac=[[0,rc],[1,rc],[1.35,$(0,0,0,.7)],[1.6,rc],[1.9,$(255,255,255,.14)],[2.15,rc]],oc=[[0,$(10,10,11)],[.2,$(9)],[.4,$(17,17,18)],[.62,$(5,5,6)],[.83,$(14,14,15)],[1,$(10,10,11)]],sc=[[0,rc],[18,rc],[26,$(241,241,246,.04)],[39,$(234,234,238,.16)],[47,$(239,239,244,.3)],[57,$(220,220,228,.19)],[75,$(175,175,182,.07)],[92,$(240,240,243,.17)],[99,$(231,231,236,.09)],[112,rc],[182,rc],[202,$(181,181,189,.04)],[221,$(239,239,245,.26)],[228,$(239,239,245,.32)],[238,$(221,221,228,.19)],[251,$(171,171,176,.04)],[262,rc],[286,rc],[302,$(232,232,238,.12)],[312,$(241,241,243,.2)],[324,$(223,223,228,.1)],[343,rc],[360,rc]];function cc(e,t){let n=1;for(;n<e.length-1&&t>e[n][0];)n++;let[r,i]=e[n-1],[a,o]=e[n],s=ec((t-r)/(a-r));return[nc(i[0]*i[3],o[0]*o[3],s),nc(i[1]*i[3],o[1]*o[3],s),nc(i[2]*i[3],o[2]*o[3],s),nc(i[3],o[3],s)]}function lc(e,t,n,r,i){e[0]=e[0]*(1-i)+t*i,e[1]=e[1]*(1-i)+n*i,e[2]=e[2]*(1-i)+r*i,e[3]*=1-i}function uc(e,t=1.75){let n=e/.987*500,r=cc(ic,tc(e*780/2,2.15)),i=[r[0],r[1],r[2],1-r[3]],a=Math.round((n-190)/1.375);for(let e=Math.max(0,a-1);e<=Math.min(Qs.length-1,a+1);e++){let t=Qs[e];Math.abs(n-t.radius)<=t.width/2&&lc(i,1,1,1,t.opacity*.95)}for(let e of $s)Math.abs(n-e)<=t&&lc(i,3/255,3/255,4/255,.8*.95),Math.abs(n-e-2)<=.3&&lc(i,131/255,131/255,131/255,.15*.95);let o=(1-e)*780/2;return o<7&&lc(i,0,0,0,.6),o>=4&&o<5&&lc(i,1,1,1,.06),o<4&&lc(i,0,0,0,.5),o<1&&lc(i,0,0,0,.8),i}function dc(e){let t=cc(ac,tc(e*780/2,2.15)),n=e/.986,r=.3*(ec((n-.37)/.03)*ec((.99-n)/.03));return[1-t[3]*r,t[0]*r,t[1]*r,t[2]*r]}function fc(e,t){let n=new Uint8Array(e*4);for(let r=0;r<e;r++){let i=[0,0,0,0];for(let n=0;n<4;n++){let a=t((r+(n+.5)/4)/e);for(let e=0;e<4;e++)i[e]+=a[e]}for(let e=0;e<4;e++)n[r*4+e]=Math.round(ec(i[e]/4)*255)}return n}function pc(e=8192,{trackHalfWidth:t=1.75}={}){let n=1024;return{radialSize:e,angularSize:n,engraving:fc(e,e=>uc(e,t)),hairlines:fc(e,dc),body:fc(n,e=>cc(oc,tc(e+20/360,1))),specular:fc(n,e=>cc(sc,e*360))}}let mc=Object.freeze({innerRadius:99.92,outerRadius:100*1.85,thickness:100*1.85*.0065,bevel:100*1.85*.0016,artworkInnerRatio:.376});function hc(e=`high`){return{...mc,angularSegments:e===`low`?512:1024,bevelSegments:e===`low`?4:8,bands:[{id:0,inner:mc.innerRadius,outer:mc.outerRadius,height:0,crown:0,thickness:mc.thickness}]}}function gc(e){let{innerRadius:t,outerRadius:n,thickness:r,bevel:i,angularSegments:a,bevelSegments:o}=e,s=[],c=(e,t,n,r)=>{for(let a=0;a<=o;a++){let c=Ne.lerp(n,r,a/o),l=Math.cos(c),u=Math.sin(c);s.push({r:e+i*l,y:t+i*u,nr:l,ny:u})}};c(t+i,-i,Math.PI/2,Math.PI),c(t+i,-r+i,Math.PI,Math.PI*1.5),c(n-i,-r+i,Math.PI*1.5,Math.PI*2),c(n-i,-i,0,Math.PI/2),s.push({...s[0]});let l=new _r(s.map(e=>new H(e.r,e.y)),a),u=l.getAttribute(`normal`);for(let e=0;e<=a;e++){let t=e/a*Math.PI*2;for(let n=0;n<s.length;n++){let r=s[n];u.setXYZ(e*s.length+n,r.nr*Math.sin(t),r.ny,r.nr*Math.cos(t))}}return l.computeBoundingSphere(),l.name=`Continuous circular vinyl with a rounded pressed edge`,l}function _c(e=8192){let t=1831565813,n=()=>(t^=t<<13,t^=t>>>17,t^=t<<5,(t>>>0)/4294967296),r=[],i=0;for(;i<1.01;){let e=(.78+n()*.58)/216;r.push({start:i,end:i+e,depth:.62+n()*.38,polish:.5+n()*.48,skew:.34+n()*.26}),i+=e}let a=new Uint8Array(e*4),o=0;for(let t=0;t<e;t++){let n=0,i=0,s=0;for(let a=0;a<8;a++){let c=(t+(a+.5)/8)/e;for(;r[o].end<c;)o++;let l=r[o],u=(c-l.start)/(l.end-l.start),d=u<l.skew?u/l.skew:(1-u)/(1-l.skew),f=Math.sin(d*Math.PI/2);n+=.2+f**2.7*l.depth*.8,i+=(u<l.skew?1:-1)*Math.cos(d*Math.PI/2)*l.depth,s+=l.polish}a[t*4]=Math.round(n/8*255),a[t*4+1]=Math.round((.5+i/16)*255),a[t*4+2]=Math.round(s/8*255),a[t*4+3]=255}return a}function vc(e,t=0,i=1){let a=pc(e.angularSegments<=512?4096:8192,{trackHalfWidth:1.1}),l=[];function u(e,t,i=!1,a=1,u=g){let d=new nr(e,t,a,u,c);return d.name=`MeeWav signature record — filtered material profile`,d.colorSpace=``,d.magFilter=o,d.minFilter=s,d.generateMipmaps=!0,d.anisotropy=a>1?4:1,d.wrapS=i?n:r,d.wrapT=d.wrapS,d.needsUpdate=!0,l.push(d),d}let d=2048,f=new Uint8Array(d*d*2),p=187,m=()=>(p^=p<<13,p^=p>>>17,p^=p<<5,(p>>>0)/4294967296);for(let e=0;e<f.length;e+=2)f[e]=Math.round((m()+m()+m())*85),f[e+1]=0;let h=Array.from({length:32},()=>({x:m()*d,y:m()*d,spread:40+m()*100}));for(let e=0;e<24e3;e++){let t=m()*d,n=m()*d;if(e%4==0){let e=h[Math.floor(m()*h.length)],r=m()*Math.PI*2,i=Math.sqrt(-2*Math.log(Math.max(m(),1e-6)))*e.spread;t=((e.x+Math.cos(r)*i)%d+d)%d,n=((e.y+Math.sin(r)*i)%d+d)%d}let r=.35+m()**3*.55,i=95+m()*160;for(let e=-2;e<=2;e++)for(let a=-2;a<=2;a++){let o=Math.floor(t)+a,s=Math.floor(n)+e,c=Math.hypot(o+.5-t,s+.5-n)/r,l=i*Math.exp(-c*c*2),u=((s+d)%d*d+(o+d)%d)*2+1;f[u]=Math.max(f[u],Math.round(l))}}let _=new Or({name:`MeeWav signature vinyl — engraved black PVC and studio reflections`,uniforms:{uEngraving:{value:u(a.engraving,a.radialSize)},uBody:{value:u(a.body,a.angularSize,!0)},uSpecular:{value:u(a.specular,a.angularSize,!0)},uSurface:{value:u(f,d,!0,d,b)},uTooling:{value:u(_c(a.radialSize),a.radialSize,!0)},uDimensions:{value:new W(e.innerRadius,e.outerRadius,e.thickness)},uBevel:{value:e.bevel},uArtworkInner:{value:e.artworkInnerRatio},uLightRotation:{value:Ne.degToRad(t)},uReflectionSurfaceRotation:{value:0},uExposure:{value:i},uExplorationVisibility:{value:0}},depthTest:!0,depthWrite:!0,transparent:!1,side:0,toneMapped:!1,vertexShader:`
      varying vec3 vVinylPosition, vVinylNormal, vVinylView;
      void main() {
        vVinylPosition = position;
        vVinylNormal = normal;
        vec3 worldView = cameraPosition - (modelMatrix * vec4(position, 1.0)).xyz;
        vVinylView = vec3(dot(worldView, modelMatrix[0].xyz),
          dot(worldView, modelMatrix[1].xyz), dot(worldView, modelMatrix[2].xyz));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      uniform sampler2D uEngraving, uBody, uSpecular, uSurface, uTooling;
      uniform vec3 uDimensions;
      uniform float uArtworkInner, uLightRotation, uReflectionSurfaceRotation, uExposure, uBevel, uExplorationVisibility;
      varying vec3 vVinylPosition, vVinylNormal, vVinylView;
      const float TAU = 6.283185307179586;

      vec4 angularProfile(sampler2D profile, float phase) {
        // atan wraps at the back of the disc. Preserve the short derivatives
        // there so mip filtering cannot paint a bright seam across the vinyl.
        vec2 footprint = fract(vec2(dFdx(phase), dFdy(phase)) + 0.5) - 0.5;
        return texture2DGradEXT(profile, vec2(fract(phase), 0.5),
          vec2(footprint.x, 0.0), vec2(footprint.y, 0.0));
      }

      vec3 studioLight(vec3 direction) {
        float c = cos(uLightRotation), s = sin(uLightRotation);
        return normalize(vec3(c * direction.x - s * direction.z,
          direction.y, s * direction.x + c * direction.z));
      }

      vec3 radialProfile(sampler2D profile, float radius) {
        // Integrate the full pixel across diagonal grooves, including where
        // neither screen-axis derivative alone catches their fine spacing.
        float footprint = max(fwidth(radius), 0.000001);
        return texture2DGradEXT(profile, vec2(radius, 0.5),
          vec2(footprint, 0.0), vec2(0.0)).rgb;
      }

      float grainVisibility(vec2 uv) {
        vec2 dx = dFdx(uv), dy = dFdy(uv);
        float longest = max(length(dx), length(dy));
        float shortest = abs(dx.x * dy.y - dx.y * dy.x) / max(longest, 0.0000001);
        // Retire a noise scale before individual bilinear texels become a
        // visible grid; the finer, fixed physical scale then takes over.
        return smoothstep(0.35, 1.0, shortest * 2048.0);
      }

      vec3 grooveReflection(vec3 V, vec3 radial, vec3 tangent, vec3 L, float sourcePeak, float spread) {
        // Concentric grooves reflect most strongly when the half vector lies
        // in their radial plane. Two fixed softboxes produce two visible front
        // fans and their quieter counterparts on the far side of the record.
        vec3 halfDirection = V + L;
        vec2 plane = halfDirection.xz;
        float planeLength = length(plane);
        plane /= max(planeLength, 0.0001);
        float alongRadius = dot(plane, radial.xz);
        float deviation = atan(dot(plane, tangent.xz), abs(alongRadius) + 0.0001);
        // Sample the original white fan shapes, rather than a flat white beam.
        // Window each source peak to keep its neighbouring fan out of the lobe.
        vec3 fan = angularProfile(uSpecular, sourcePeak / 360.0 + deviation * spread / TAU).rgb;
        float window = exp(-pow(abs(deviation) / 0.25, 4.0));
        float front = mix(0.62, 1.0, smoothstep(-0.12, 0.12, alongRadius));
        float core = exp(-pow(deviation / 0.066, 2.0));
        float radialSlope = planeLength / max(halfDirection.y, 0.12);
        float radialResponse = 1.48 / (1.0 + pow(radialSlope / 1.12, 2.0));
        return (fan * 2.05 + vec3(core * 0.09)) * window * front
          * mix(1.0, radialResponse, 0.45) * smoothstep(0.02, 0.12, planeLength);
      }

      float filteredCut(float radius, float center, float footprint) {
        // Pixel-integrated coverage keeps the five uncut track separators
        // dark under a reflection without flickering at grazing angles.
        float distanceToCut = abs(radius - center);
        return clamp((1.10 + footprint * 0.5 - distanceToCut) / footprint, 0.0, 1.0)
          - clamp((-1.10 + footprint * 0.5 - distanceToCut) / footprint, 0.0, 1.0);
      }

      float pressedShoulder(float radius, float center, float footprint) {
        return filteredCut(radius, center + 1.50, footprint)
          - filteredCut(radius, center - 1.50, footprint);
      }

      void main() {
        float radius = length(vVinylPosition.xz);
        float across = clamp((radius - uDimensions.x) / (uDimensions.y - uDimensions.x), 0.0, 1.0);
        // Refit the complete engraved area around the globe-sized opening.
        // Only the artwork coordinate changes; the disc remains circular/flat.
        float artwork = mix(uArtworkInner, 1.0, across);
        float angle = atan(vVinylPosition.x, -vVinylPosition.z);
        vec3 radial = vec3(vVinylPosition.x, 0.0, vVinylPosition.z) / radius;
        vec3 tangent = vec3(-radial.z, 0.0, radial.x);
        float viewCos = cos(uReflectionSurfaceRotation);
        float viewSin = sin(uReflectionSurfaceRotation);
        vec3 V = normalize(vec3(
          viewCos * vVinylView.x + viewSin * vVinylView.z,
          vVinylView.y,
          -viewSin * vVinylView.x + viewCos * vVinylView.z
        ));
        vec3 N = normalize(vVinylNormal);
        float face = smoothstep(0.05, 0.85, abs(N.y));

        vec4 engraving = texture2D(uEngraving, vec2(artwork, 0.5));
        // The source's broad ambient fans belong to the studio lighting too.
        // Keep them fixed while local grain and dust rotate with the surface.
        vec3 body = angularProfile(uBody, (angle - uLightRotation) / TAU).rgb;
        vec3 color = engraving.rgb + body * engraving.a;

        // Local contrast, not a brighter grey pigment. Both detail and its
        // local average follow the projected footprint, so unresolved grooves
        // naturally merge instead of sharpening distant aliases.
        vec4 averagedEngraving = texture2D(uEngraving, vec2(artwork, 0.5), 3.0);
        vec3 averageColor = averagedEngraving.rgb + body * averagedEngraving.a;
        vec3 engravingDetail = color - averageColor;
        color = max(averageColor * 0.42 + engravingDetail * 0.40, body * 0.18) + vec3(0.004, 0.0038, 0.0035);
        vec3 tooling = radialProfile(uTooling, across);
        color += max(tooling.r - 0.48, 0.0) * vec3(0.050, 0.048, 0.044);

        vec3 leftLight = studioLight(vec3(-0.75, 0.60, -0.30));
        vec3 rightLight = studioLight(vec3(0.85, 0.60, 0.28));
        float grooveRoughness = 0.92 + tooling.b * 0.15;
        vec3 reflection = grooveReflection(V, radial, tangent, leftLight, 228.0, 2.10 * grooveRoughness) * 1.10
          + grooveReflection(V, radial, tangent, rightLight, 47.0, 3.00 * grooveRoughness) * 1.25;
        vec3 rimSoftbox = studioLight(vec3(-0.854, 0.209, -0.476));
        vec3 rimReflection = grooveReflection(V, radial, tangent, rimSoftbox, 228.0, 2.2);
        reflection += rimReflection * 0.40;
        // A small real clearcoat reflection on the back shoulder breaks up
        // the two broad groove fans without illuminating the black substrate.
        vec3 backSoftbox = studioLight(vec3(-0.7473, 0.165, -0.6437));
        vec3 halfBack = normalize(V + backSoftbox);
        reflection += vec3(pow(max(halfBack.y, 0.0), 420.0) * 0.95);
        // Complement the white studio fans in their unlit sectors. These
        // fixed sources reflect through the same grooves as the white lights;
        // camera movement reveals the colour instead of tinting the black PVC.
        vec3 violetLight = studioLight(vec3(0.15, 0.50, -0.98));
        vec3 blueLight = studioLight(vec3(-0.20, 0.45, 0.98));
        float whiteEnergy = dot(reflection, vec3(0.2126, 0.7152, 0.0722));
        float shadowFill = uExplorationVisibility * (1.0 - smoothstep(0.08, 0.42, whiteEnergy));
        vec3 colouredReflection =
          grooveReflection(V, radial, tangent, violetLight, 228.0, 2.30 * grooveRoughness)
            * vec3(0.46, 0.12, 0.85) * 0.65
          + grooveReflection(V, radial, tangent, blueLight, 47.0, 2.48 * grooveRoughness)
            * vec3(0.08, 0.30, 0.90) * 0.65;
        reflection += colouredReflection * shadowFill;
        vec3 unmaskedReflection = reflection;
        float reflectionMask = smoothstep(0.002, 0.02, across)
          * (1.0 - smoothstep(0.978, 0.998, across));
        float fresnel = 0.94 + 0.12 * pow(1.0 - abs(V.y), 3.0);
        float engravedRadius = artwork / 0.987 * 500.0;
        float footprint = max(fwidth(engravedRadius), 0.06);
        float separators = clamp(filteredCut(engravedRadius, 238.0, footprint)
          + filteredCut(engravedRadius, 310.0, footprint)
          + filteredCut(engravedRadius, 372.0, footprint)
          + filteredCut(engravedRadius, 431.0, footprint)
          + filteredCut(engravedRadius, 471.0, footprint), 0.0, 1.0);
        float shoulders = pressedShoulder(engravedRadius, 238.0, footprint)
          + pressedShoulder(engravedRadius, 310.0, footprint)
          + pressedShoulder(engravedRadius, 372.0, footprint)
          + pressedShoulder(engravedRadius, 431.0, footprint)
          + pressedShoulder(engravedRadius, 471.0, footprint);
        // Fine circular tooling plus restrained PVC grain, fixed to the disc.
        // Attenuate unresolved detail instead of letting it shimmer at distance.
        vec2 grainPosition = mat2(0.789, -0.614, 0.614, 0.789) * vVinylPosition.xz;
        vec3 surfaceNoise = texture2D(uSurface, grainPosition * 0.0032).rgb;
        vec3 fineSurfaceNoise = texture2D(uSurface, grainPosition * 0.07).rgb;
        float coarseVisibility = grainVisibility(grainPosition * 0.0032);
        float micrograin = (surfaceNoise.r - 0.5) * coarseVisibility
          + (fineSurfaceNoise.r - 0.5) * grainVisibility(grainPosition * 0.07);
        color = max(color + vec3(micrograin * 0.015), vec3(0.0025));
        vec2 polarUv = vec2(angle / TAU, across * 1.3);
        vec2 polarDx = dFdx(polarUv), polarDy = dFdy(polarUv);
        polarDx.x = fract(polarDx.x + 0.5) - 0.5;
        polarDy.x = fract(polarDy.x + 0.5) - 0.5;
        vec3 grooveSurface = texture2DGradEXT(uSurface, polarUv, polarDx, polarDy).rgb;
        // This second physical scale resolves only when approaching the floor.
        // Its zero-centred mip average leaves the distant globe finish intact.
        float microCut = radialProfile(uTooling, across * 7.37).r - 0.48;
        float grooveWall = tooling.g * 2.0 - 1.0;
        float polishedWall = mix(0.88, 1.08, smoothstep(-0.3, 0.3, grooveWall * dot(V, radial)));
        float pitchVariation = 0.90 + 0.11 * sin(across * 31.0 + 0.7 * sin(across * 63.0));
        float polish = (1.0 + (tooling.r - 0.48) * 1.85) * polishedWall * pitchVariation
          * (0.88 + tooling.b * 0.17) * (1.0 + microCut * 0.40)
          + micrograin * 0.15 + (grooveSurface.r - 0.5) * 0.35 * grainVisibility(polarUv);
        reflection *= polish * vec3(1.22, 1.19, 1.13);
        reflection *= reflectionMask * fresnel * (1.0 - separators * 0.86);
        // A soft photographic shoulder preserves differences between bright
        // groove crests. Hard clipping would turn them into a solid white bar.
        reflection = max(reflection, 0.0);
        reflection = min(reflection, vec3(0.72)) + vec3(0.28)
          * (vec3(1.0) - exp(-max(reflection - vec3(0.72), 0.0) / 0.28));
        reflection = clamp(reflection + (reflection - vec3(0.70)) * 0.16
          * smoothstep(vec3(0.08), vec3(0.25), reflection), 0.0, 1.0);
        // Same 'screen' blend as .vinyl-specular, preserving the black PVC.
        color = vec3(1.0) - (vec3(1.0) - color) * (vec3(1.0) - reflection);
        color *= 1.0 - max(-shoulders, 0.0) * 0.25;
        color += max(shoulders, 0.0) * (1.0 - separators) * reflection * 0.13;
        // Specks use a separate, coarser footprint than the PVC micrograin so
        // they remain tiny isolated flecks rather than disappearing into grey.
        vec2 dustUv = vVinylPosition.xz * 0.005;
        float dust = texture2D(uSurface, dustUv).g * grainVisibility(dustUv) + fineSurfaceNoise.g * 0.6;
        float microScuffs = grooveSurface.g * grainVisibility(polarUv);
        color += (dust * (vec3(0.42, 0.37, 0.30) + reflection * 0.45)
          + microScuffs * (vec3(0.070, 0.061, 0.045) + reflection * 0.45)) * reflectionMask;
        color *= 1.0 - separators * 0.25;

        // The same two lights catch the real rounded lip. Only its narrow
        // physical width gets a silhouette highlight; the main face stays PVC.
        vec3 halfLeft = normalize(V + leftLight);
        vec3 halfRight = normalize(V + rightLight);
        float edgeLight = pow(max(dot(N, halfLeft), 0.0), 48.0)
          + pow(max(dot(N, halfRight), 0.0), 48.0)
          + 0.55 * pow(max(dot(N, normalize(V + rimSoftbox)), 0.0), 32.0)
          + 0.8 * pow(max(dot(N, halfBack), 0.0), 128.0);
        float edgeFresnel = pow(1.0 - abs(dot(N, V)), 3.0);
        vec3 edge = vec3(0.006, 0.005, 0.0045)
          + vec3(0.85, 0.82, 0.76) * edgeLight + unmaskedReflection * 0.18 + vec3(0.008) * edgeFresnel;
        edge += shadowFill * 0.30 * (
          vec3(0.46, 0.12, 0.85) * pow(max(dot(N, normalize(V + violetLight)), 0.0), 64.0)
          + vec3(0.08, 0.30, 0.90) * pow(max(dot(N, normalize(V + blueLight)), 0.0), 64.0));
        float outerLip = 1.0 - smoothstep(uBevel * 0.5, uBevel * 2.0, uDimensions.y - radius);
        color += outerLip * (vec3(0.014 + 0.055 * edgeFresnel) + unmaskedReflection * vec3(0.65, 0.61, 0.55));
        color = mix(edge, color, face);
        // The rounded pressing crest catches a thin, near-white light. Its
        // coverage follows the projected bevel, never a full bright outline.
        float crestWidth = max(uBevel * 0.50, fwidth(radius) * 0.85);
        float rimCrest = exp(-pow((uDimensions.y - radius - uBevel * 0.72) / crestWidth, 2.0));
        float rimEnergy = dot(unmaskedReflection, vec3(0.2126, 0.7152, 0.0722));
        vec3 crestLight = vec3(0.98, 0.96, 0.91) * clamp(rimEnergy * 2.9, 0.0, 1.0);
        color = max(color, crestLight * 1.8 * rimCrest * smoothstep(0.035, 0.16, rimEnergy));
        float contact = 1.0 - 0.34 * exp(-max(radius - uDimensions.x, 0.0) / (uDimensions.y * 0.007));
        color *= contact;
        if (N.y < -0.5) color *= 0.4;
        gl_FragColor = vec4(clamp(color * uExposure, 0.0, 1.0), 1.0);
      }
    `}),v=()=>{for(let e of l)e.dispose();_.removeEventListener(`dispose`,v)};return _.addEventListener(`dispose`,v),_}var yc=`data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAQACAADASIAAhEBAxEB/8QAHQABAAAHAQEAAAAAAAAAAAAAAAECAwQFBwgGCf/EAFQQAAEDAwMCBQIEBAMGAwQBFQEAAgMEBREGEiEHMQgTIkFRFGEycYGRFSNCoVKx8AkWM2LB0SRy4RdDgpLS8RglU1ZXc5OUJjRjlaKy4jVEVKPU/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAEC/8QAFxEBAQEBAAAAAAAAAAAAAAAAAAERMf/aAAwDAQACEQMRAD8A7LREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBFaXa5220UT6663CkoKVn456mZsUbfzc4gBeQm6v8ATZu402rKO5ta4tc61skrmtIbuOTA14GByg90i1FfPEl0ftVFUzu1T9TPT/io46WVk7ucHDZGtHbkc8jtnIz4WLxp9KnysY6yaxja5wBe6jp8N+5xOTj8gUHS6LmrUfjB0JSXZ9LZaZtxpCzMVbNLNAx5zg5YIXvb2OMjJ9wAQTrW5eMTW8Vyq5KOk0JUUETiYoBHWiaRmMgiRxa3PI4LQe4x7oO30XFtg8cFX9axl90FT/TOOHSUle5rmD52uYd37j/vhNZ+LfUN7u1S6wXms0jb2tAhZBaae4yPOW87pSwNJ5yCCB7HsUHdqL5hag6u63usUckHU+6wyD/ikzVlMZgBgNfDG98BB5zwMkkHIXkNQaj1I6vlux1BRzy1e5j6igbHA52c7gWNax7Rye7QOTjug+th4GSrSoulspofOqLjRwx/45Jmtb+5K+RTNVanZHHGzUd4ayPGxorZAG4btGPVxwAPy4V/Sa6v7IG01xdRXunaNoju1HHVOa3/AAskeDJGP/I9vYfCD6xm82gRiQ3WhDDwHfUMwf7q4iq6WaEzxVMMkQzl7XgtGOTyvjpXTsqal80dJBStcc+VDu2D8txJ/urq3X29W6hnoKC7V1NR1JzUU0c7mwzf+dmdrx7YIKD6zVGutEU79lRrHT0LgSMPucLTkdxy5XN11Vpi0v2XXUdnoHnB21NbHEeRkficO45XyZpbJqC9xsq6SzzywAbBNFSiOLg45cAG5ye5Of2VausGoIYWxV1RSxtjaNsM91ga5o7DDDJkDv7IPrHaNS6cu7HvtN/tVwaxwa80tZHKGk9gdpOCVk2vY4uDXtcWnDgDnC+Pv8Gq43sJnoNxcA0R10UhJzwAGOJV1QXa8WOdsdLHHHU87xLRxTCQexw9h3Y55Ofsg+vSL5P0+qepsL2VFrqr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REQEREBERAREQEREBERAREQEREBERAREQEREBERAREQERYe56mtNur/oKh1a6pxkRwUE85IxnI8thzgYzjtkZQZhFSpJ2VVNHURNlayRoc0SxOjeB92uAcD9iAVVQEVhdL1Z7U1rrndqCha4ZaamoZGCO2fUQqtruNvutG2stdfS11M4kNmppmyMJHBAc0kILpERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERARU6qUwUss4ikmMbC/y4xl78DOGj3J9lp2/9eZbV9JEeknUQ1VXudHTyUdO2Ty253PLWzOc1o93OaG45yg3Mi5stPjH6euuwtmo9Pan0/N5wjlfPTMkZAPd0ga7zBj4axxWx67r70cort/C6nX1qbU8Z273RtPp4dI1pY0jcMgkEEEHG04DZiLCVUmm9XWEUL6ymuFuutMHtbDUlvnwnnLS0h2Dj2+4XkbN0S0FYdSW2+6cprnY57e7LIKG5TMgkGSS18ZcQ5pJ5HvgffIbJXn9b6xsOjrW+uvVbFFgAth81jZJBnGWh7mg/v9hkkA5eG4UE1SaaGuppJx3jbK0uH6ZyvA9UOj2m9cVc91Nde7HfJIBCLhabjJTvIBBaHtGWOHGOW5wT74IDRur/ABXzMu1ygs0trp6ameWCguNoq21czC0neyaGYtGBychvAJaTwVovUniJ6iS1FZTW67vpWSOPky01xuLnQgngDzZjkjt6mlbvuvhX15VVlTR/79CutVQxpkdc7rVTPc/J3ExMaxpwCSMvPI+CVom89GbFpitqKTWPVC22wwzujcKay3CoLACBl4MTA13IwMkH2cgymhfFZ1d07d457vd49R0HPmUVdBGzdnHLZGND2kY45LeTwVvi3eJzonrjTrrVq+21OmZjDt3VFrir4oXuaQ4xHy5A7GMZfEAdw4xnHHWo7Ho6iuXk2bXRu1IMf+IdaZYCecHDCT+ff/svP11NTQOP09xgqm+21j2k/o5o/wA0HX9JoLpr1budTa+nHVy9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25vGZMHByugb/Q/xOx11u2wPFTA+IsnZvieHAgte33YexAwcE4IPK+a3iE0dcOh3WuqpNKXmvtcM9M2utU9FVPjnjglLmOjLw4OADmSN7klobkkkoPpsi4k8MHihms5pND9S6mtr2y13lU99qqrc6ASO7VDpSDsa4k7y7LWnBGGhdtMc17GvY4Oa4ZBByCPlBFERAREQEREBERAWPtMsMlRXMEk0tRDOWTPfTOiHPrY0EgB4a17RuGc45OVqLxd9Yv8A2W6EFLaXsdqS8tkgofWN1K3bh1QW++0kBvsXd8gEHn3wk9frxR66q7TrjUdMyy3DEwM1JLPO+p2w08MMJjBd+FrOCCMMce5JQd3orGx3a0Xu3tuNjudDcqORxDaijnZNG4g4OHNJBIPCu5n+XGZDjY0EvPwAD2QeW6vamqNIdObzfKEQvuUcBit0Up4mqpDshZj+ol7m8e/27rm/XPh66sdTNdWqo1/renuVspImslmZRR0rqbewyPjijZxIA8sbvJy7nJbtC6XuME2rrNRGnnuljbHXU9VK2aijErhE5sgjLZWuABcG+poyC3gr0qD5ceJW23uwa9h0xqO/x6guVno46X66OoDmCAcxQiINHk7ATlhySXF2cOGPJ6IfcdOah0zrL+E1FbSU15ikgjjlMZqZIHxyOia5oLmk5aA4DuTjJBA6I8Uvh16hVnU+76v0paWXy2XmqEvk00n86CR4Adva4jjcCdwJAyM4C3N4SLJPfej9gj1RYKOjm0nfaiG3yR0uz6lsIe3zMkA5E0s2SMZdGcjJcg6EactBwRkdj3CiiICIiAqU8krJYGx075WySFsjg4ARN2uO45OSMgNwMnLh7AkVUQEREBERAREQEREBERAREQEREBERARUjTwmqFV5Y84MMYf77SQcfuAqqAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgAADAGAEREBERAREQW9zio5rbVQ3FsTqKSF7agSkbDGQQ7dnjGM5XxymaGSvY14eGuIDh2d919edfXmyaf0VeLxqTBtFLSSOrGbd3mRkYLAPcuztA9yV8ldUV1FctR3OvtttitlFU1UktPSRu3N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91XGx048xz/5hZG3cfVtzwdoaPZdCIgxmlLFbdMabt+nrPC6G32+nbT07HPLy1jRgZJ5JWTREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERB85/H2aw+IarFS2MRC20opi0YJj2nO7k5O/f7DjHHuef11f/ALRnRbbfrSy66p5IxHdqf6Opiyd3nQ8h/J7FjmtwAAPLyeXLlBARRBGCDn7cqCAiIgIiICIogE9hlBD2RPbsiCrTl53RhrnscMua0Z7DOf0Gf0ypJGGORzDgkHGR2KgCR2JHtwsrZLfXXeripaGz1l2rJGlsMFI1z3uIx3YwFxHIHGPblBigCewJX068G9tqrX4bdIwVb8vlhmqWgEENZLPJIwDA/wALgTnJySuTemnhL6k6kno59RU0em7W4h05q5W/UBu7nZGzdk49pNnP2Az3f050la9C6HtOkrM1worbTiJjnfikcSXPkd/zOeXOOOMuOMBB6BERAREQYjWmnLXq7Sly0zeonS2+407oJ2tdhwB7OafZwOCD8gL5G3+3Ntl+uNsjq4aptFUywCeM+iUMeW7m5wcHGRwvsSvmh4uelt30B1Uu1xFLPLYLzUyV1FWBhLGmRxc+FzuwcxxIGTkt2n3IAaWWb0DYJNV65sWmYnujddbhBR+YG58sSSBpfj4AJP6LFUdLU1tVFSUdPNU1Erg2OKJhe97j2AA5JXW3gV6Oaiotf1Ot9X6crLZTW2nfFb2V9OYpHVLnbHODHDcNjWvHIHLhjsUHbFNBFTU0VNAwMiiYGMaP6WgYA/ZVERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQeM65VtkoOjurajUTqYW3+FTxyickMeXsLGN9OHZc9zWjBByRjnC+TZJPc5X0z8ZGja/WvQ250lslnFVbZG3JsEVOZXVXlteDEAOQSHZBHu0DsSvmWgIiICIiAiIgIiICIiAiIgIiICIiAhREBERAREQFPJG6PZu2+tocMOB4/TsfspEQTNe9rXNa5wa4YcAe4yDz+oH7L6PeC3Xti1B0ns+lYLtJWX600TpbhG8yyGMPqJQ0GR45OAPSDgAgDIC+b6yumL7fNN3eK5WC81tmrMbRU0s74nBpIyCW8lvHI5zj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4c6hmndLVYGQYomOlc08HAds25+XL6pwxxwxMhhjbHGxoaxjRgNA4AA9ggmREQEREBERAREQEREBERAREQW9yfVxUE8lBTxVNW2MmGKWUxte7HALgDj88FYLTOu9J6grX2y3363Ou8LiyptjqmP6unkaPWx8QcSHNIIOMgEHnhelXJfiw6EXr+PQ9Sel0M9PcTO990pqCVtNOXSnDqhkgwRnc7fk4AJdjG9B1oi8V0j1jT6q6ZacvwdWTSVcLKaofPAY3/UsBZLuacdpGPBLcj9jj2qAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiIC1j4lupNf0r6cDU9BZm3Vz6xlJIx0r4xE17H4k3Na7GHNaOcA5xnJAOzlq7xW2Cs1J4fNY22hcTMKNlUGYzkU8rJ3ADuSWxkD74QfL2sqJ6uqlq6qeWoqJ3ukmllcXPe9xJLi48kknJJ91LIIwyPY5xcW5eCMYOTwPnjH7lTU1NPUueIInSbGF7yBw1o7kn2HbkqUtbsaQ8EkkFvOW/wDRBIii3uOCfsFfXhtA251baSjr6CFpxDT1UzZpWHjIe8MYD7nIYPYY90FgiKJJJyST7coIK486FkW2KmaX4GZJDuOcnsOwBGOCD+aoggNILQc+/uF6nprom46/v09istXSQVzaN9TDHVPLRUPZj+U0gHL3ZO0Y5PHHdB5UknuSoLebPCf1tc8NOnKJgO71G5wYGDgdn+45H274PC9fp/wU9Qaoh961Jp22sP8ATC6WokHPORsa3tyMOP6IOXgcHPx9l234Fei9wtklP1V1EySkfUUpbZaQO5dDI31TPGOA4H0DPIJJ7tXp+nvg46d2KeOr1PcLjqmdjf8AgyH6WmLuPVsYd5xjsXkcnIK6RpYIKWmipqaGOCCFgjiijaGtY0DAaAOAAOMBBUREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAXJn+0G6b6m1Bbbdry1SirttjpXRVtEA1roGOcXOqATguHDGlvJGAQMbius1BzWuaWuAc0jBBGQQg+Ncbg17SRkA5U0m1/wDw24DfckZx7dl9S9YdCuk2q62lrLxoq3GWmY6Nv0u6lDmOBBDhEW7sE5BPIPYjnOptd+DjSNV5NboO81Wn6+AZEVY36ynkcDkEh3qaee+XDgenOchwYzO9rY2h7iMds5J4xj/XKrOaYauWG408wkjBidGT5b43t4wcj2xggj+6+hvh98NVp0DWDVGqLg+86sfJ5plppnxU1Od+70AbS8kgZ3DB7bQM5wPXvwps1nKLzpS+wU98kmlmrZLnHj618jwS58kTQG7QDhojPfuEHBIMkMjXtLo3sdlrgcEEHuCvS2vp11BusT5rZoXVFdGx5Y99PaZ5A1w4IJa04P2XbPh58LVk0Xc6bVuo7nW3a4iMOp6GWnbTxU5PP81rXv8AMcOCBu2g+ziAR0uOBgIOK/AZ0v13p3qPcNVak0vW2a3fwqWkjdcaYxSvldLERsY7Dxwx2XYxjj347UREBERAREQEREBERAREQEREBERAUssccsT4pWNkje0tc1wyHA9wR7hTLzfUPXekun1kbedYXqG1UT5REx72PkdI8+zWMBc4+5wDgcnhBxL1r1nqXozq7U3TKxTmDTZghkstPHVkuoXukjqRUMPJa4SNdlh2j1ZaADk9a9GOrejteaYs4pdTWyS/Poad1bQGoAmjndG0vYGuwX4dkZAI4Xzy8QWtoeonWS+ampamokt087YaEzcFlOwBjcNONoOC7HHLjnkkrzc9H9VqaOw6ZrLle6VtXsoJIqAsqJySPUyEOc7JIyG7s/kSUH1B1b1b6f6W1pbtG3m/tjv1xljigooaeWd4dIcRh3ltIaXHAAOD6gcY5XuVxJ4TvDvrG29T6fV2v7fVWZloLaqjglEcprJDvby5rjs2EB2CMnIIx3XbaAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgLQPji6kV2hOlkdrtD4WXDUb5aEvc4b46fyz5zmDOd3qY3d7b88HC38uS/HFpWn6h630lpbTl8oXaxhjlxaKiYx+bBKC5sjXu/lhwMDwW53EOb7AZDjOihYzTs07ZiZ6qpFN5JpXEFjQH5bJ23F20bcE8g8KwuGRM1joXRFjA3a4EH9iThbS8RelbnoO90mmqukpaaFtBSsDqS1S0sE0jGfzXB0rnebIHOaHSscQ7jtjaNYXeurLjXOqa94fUYDXv8prHOx7uwBl3yTkn3KCFpuVfaK1tdbKuWkqmAhk8R2yR5GCWu7tP3GCreeWWeeSeeR8ssji973uLnOcTkkk9yT7qREBTRsfI8MjY57j2DRkqVbx8DNzZb/EhYoZIoXNrqeqpg+Q4MZ8h7wW/wDMSwN/+IoNJNj3g+W7JAyWng/p8rdPgp03ZNR9erSy817aaS3A3Chg3AOqaiEh7WgFpBwA5xGWnDcg8FdrdQOhHR7WF1imvemqKnucznSB9HMaWWfAAdkMID8YackEj5GTnPdN+k3T3p4N+k9MUdDVFmx1Y7MtQ4HuPNeS4A+4BA+3AQe3REQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQYWjo7hQX693evvbp7XURwmmozFhtH5bHea4Ozl2/IOMcbffKy8Esc8Ec8L2vjkaHsc08OBGQQsfqyzs1Dpa7WCWpmpY7lQzUbp4TiSISMLC5p/wAQ3ZH3C+Zct56sdEtdV2maHUl1s9dRTtjFO2UvgnaeY5BE7dG5pBBGQfxY+UH1HXmNJzapZqbUVvv3l1NvjqWzWisjg8smF7cmF/sXRu4Dh3GCecr53az679aNQUMc9drKpgppoXgstkjIAI3HYQ9sWCOQcF3PqPPYDpD/AGdFRc6vRmqqm5TV0/m3GJ8ctRK94f6HBxbu4zkHJHfHPZB1QiIgIiICIiAiIgIiICIiAiIgIis77c6OyWOvvNwk8qjoKaSqqH/4Y42lzj+gBQRuF0t1vmpIa6tp6eWsmENLHJIA+aTvtYO7jgEnHYAk8Aq31Np+w6mtbrVqKz0F2oXu3GnrIGys3AEBwDgcOGTgjkL5teKzqnRdU+q7L3p9tVT2u20jKOhkmOx8ux73um259BLnkD32taTg8DYvRDrd1W6g9YdJ6emrJ32mIxxz0tqoo2+RGxga6oc5+Tj/ABlxIw5wa3LgEFl4yuhOj+l9stupNKXCpgiuNe6ndaqmYSeWNjn7oifWWN2hp3Fxy9vPKwPgm6dah1X1dtmpqQz0Vl09UCpq60cB7wPTTsOCHOfkbhxhhccgloPUHiJ8O9V1b1fQ3uXWc1HBAI6f6SSn3spoBudIYsEZke7bku9vc7Whba6aaJ0/080dRaV01SuhoaVpJfI7dLPIeXSyO43PceTwAOAAGgAB6RERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQCQBkkAfdcv6Y0tqW+eNu+awumhKiGxUzPKpq25Uri3+TH5TJoHOJZl0kYcNvqDXA4GXFdNVnlGEslhE4Pq8raHEgEc4PfHB/9VoRnVe4Gu1jdKmO40tLbaGocxkcMrvKcMhhlY70s4dGQWN52uJznkORPFDrCPWPWjUlXS3N1fZaWt2Uoc1sfLY4437QOXAmIDd3IDSce2pp3eZK5/ABPAz2C9DrsSS6pnrZquS41Vwd9ZK6SNjJmveXEtlYzLRJnBOPnnBJAwFTu88+ZF5JwDs24wMccfljlBSRR9+6NIDgSMj4QQXs+iumrlqvqTabVbNNzajkEhmkoY636MPjYMkun/8AdNHHq79gOSF5Kp8hlRKyklklgzhj5Ygxzh8loLgD9gSuxv8AZyaT1DSVF81lKI2WCvpvo4ttQ0uknjkacmMZIwC7BOPxdiCCA3La+iksvVbTXUasvtVbf4HSNgpbDDM6piph5ToixtS/DiwgtJbtAzu/xZW50RAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQFyp4zOj10veoKPqTbxLc7fQsa26W0VQhkY0cebE92ABgMy3PcZHcldVog+XPRbpDeOpuvX2Rn11DbqeZrKuqngxJAxzXuZlpwNxawnbuBxkjOF9CegOjH6B6V2bTU8cjaikjkbIZCwvOZXv5LCQAS9z9u520vIDiAveBrQ4uDQCe5xyVFAREQEREBERAREQEREBERARSVE0VPBJPPKyKGNpfJI9wa1jQMkkngAD3XJ3iT8U0lmr36c6V1VNV1lFJm43N0IlhYAS0xxg8O5xl/I54zyQHUOqNQWTS9kqL3qG6Ulrt1O3MtRUyBjR8AZ7uPYNGSTwASuKfEv4lD1AsdRovQlPLQ2GscI6u7VjvJdVgEEwsH9Dfw7iTlw4IAzu0HrnWV61de6W/au1JU6kuEsRMkcuWRUvB2sa0DaAMhxaxobnI5ySsr0i0S/qn1btejoa00NtqXyOdNG0Hy4ImvkOATy48gZyRvGeAg8npXTtdqbVtr07aYmyVlyq2UsDZn+W3e4geo+2M8+/wBl9IPDL0Wt/SLSj4qg0ddqSt5r7hCx2C3OWxMLudg/IbjyR2xHQ/hy6S6UtMlDDppl0lkxvrbk7zajIxgtcABGRjuwNK2rRU0FFRQUdMzy4II2xRNyTta0YAyeTwPdBWREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERB4jrX1CtnTXRE+oblHLMN3lxxQmPe5xHfD5I8jsDtOeRgFcRXLWER01qvUNGx7bjWQCiurnw4E4dO7cXb3EBz24zua7lgIaPwrsbqb0y6eaoqrlV6zrqh9TUxNlge+v8AKkoI4Wgu+nxgtZmPzHA7huBdhfPjrfU0c+s7k3T9PXUen5altRHHVSeYXSObs8wuLnOId5bnNDiS3LgAMkIPDzvNwq90VMGSP2tbDCHOzjjAyXH9O3+SoTxSQyuila5krCWvY5pDmOBIIIPvwvQ2+81LWUlDb7m2xyQMLGTQbo3SvJJJkmB3AEnAH4G98AlxOO1Lebzfbma2+3uvvNWGNZ9TWVL55No5DdziTgZPGcd0FraqqGjq/PqKGCuZ5UjPJmLg3LmOaHekg5aSHDnu0LI3U0WotYlunbOyz09fURx01E+q8xsLnbW48xwHBdk8jgHHssIonvkDCD6fdDehOium1gtZNmt1x1NTML6i8Sw75TM78RjLv+G0D0t244HPLnE7WiiiiDhFGyMOO521oGT8lfPjo74ttaaKsLbHqK3M1bSwuH001TVuhqYmYxsMm129o7guBcMkZI2hvbvR3WMvUDprZtYzWeazvucTpPo5Xl5YBI5gIdhuWuDQ4HAyHBB61ERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERBzf43pOpVfp6g0xo/T9xuFnuR23CSiopKou4cNr2xtc5jWny3g45OMZ2kLiLWFJq3TN+p4rtZ6/T9ZbY2QQsliLHRggvALiPUSHk8+xx2X1tXhodH3S86gvkuupLFfdOVjonW+yT0AqI6N0YIEm+TgucCSRs4OMEYO4PlZaqC5Xi4Q2210NVca2clsNNTROlleeSQ1jQSfc8BfRHwedE67pTp+53DUrKN2o7q9rX+S4SfTU7OWxh+O5cSXYODhnfatn6U6a9P8ASlwNx05o6yWytxtFRT0jGyNGCCA7GRkE5x3916xAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQcZ+JTWFzp+rF2klqnT2qzyxFlM6od5YcImb2Br2Y9W4OcGZ/wCH98rnnX+q6+grLtp6zXR9dYZahzJHTRAiWWNxG8O2gkkAOIyQd5yDldYeKvR0Wq9a1NDBUXGW4tsrqxjTSh1HSsjPL3uJHcMcAcO5IGPjkrqxRU8GoaO2xQ1VLQwsZl81IWGJsji4uznDwSXOzn7BxAygwN+tP0FnbV2y4wVlulnEEzoJDxKGNdhwIDsZ3hpIwdhI7rHXOjiit9vqonxudVte7yxVtmkYGvLAHtaAYzwcA8kYOACM+lvlPSHT9UK2LScFwgZGxjoPqoap+0MwRGB5Tt7TkuLRnk5BGF4oOcGFoccE8jPBQQ7HkKrSU9RV1UdNSQS1E8rg1kUbC5zz8ADkpRU1RW1cNFR00tTVVEjYoYYWF75HuOGta0ckkkAAckrq7oL4V9dUmudO6q1K+CyW+31ENZPSTSNkqZnMO7yw2MuZsdgNO5wOHEbfZBkOi3g3dW0VJeeptwqaMv2yfweic0PAyfTLLyBkYyGcjJ9QPbsix2u32Sz0lntNJHSUFHC2CngjHpjY0YAH/c8q8RAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEUscjJGl0b2vAcWktORkHBH5ggj9FMgIiICIiAiIgIiBAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQam8RlHTuslCxjrXaZa+5U0b7vUEse17C8xNGwb3EAyHBIGNzf6yRyh1/6eMobj9PZLu6ptlPLT09ZIyBrGnaxoLntAa5x9QOMnB387jk976ltFFfLPPQV1FDWRuG5kcp2jePwndglvPuAffg9lzX120g6e3Xyvs9LdrHUVs8LJLW5rY4quUEO2sqGvc1gcWtOD5ec9iXBBxv1B0rX6dlopp7LPQ0dVAHwylznMn3Zc1wLhxlpbxk9jyTnHlcYOO/5FbzlsdFqWG32W+W29VF2o5vKnmN+pKSkZI50YlkdLJE9ziWhue5BYTg5wmi+jGntYawu1ntms6Z9lsFrludzudBSvqmsORiBkjvK847QTuDGN9JwCUGtekV+h0t1N07qSpfC2C2XCGplEgfhzGvBc0bQTkjOOO6+s9urKW42+muFDUR1FJVRNmgmjOWyMcAWuB9wQQV8yrbftB6P1BTXfTfTyfVNohppaa4zaikE9NUvJIbJB/JZ5XI4c8F5GAGscCXdoeDzXFl1d0wbFbLNSWB9HO9n8Ogun1LWtGPWxjnukhYSfwOAGeRndlBuxERAREQWF1utHbyIpqiKOokje6COTIEha0nAwCT27AE/ZaStviUtdZd68S6cqrfY7dIxlTea2oZFSjcRwx3Je/G4hjQS7afwjJG7r9Z7VfrXNa71bqW40UwLZIKmISMdxjsffnurK8aR0xeKe3U1zsVBVU9sINFBJCDFBhu0bWfhA2+nGO2R2JQag6W+IK9a+vhobd0pvjaP6tsYr2zl0PkOJxMXGMMBwM7d3ORgkZI30qNLS01KzZTU8UIwAQxgGcdlWQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREFvbaGlttFHRUUQhp4gQxgJOMnJ5PPclXCIgIpWBwc8ufuBdloxjaMDj785P6qZAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQF5vqHo61a009UWu4QwtmdG5tNVmPdJTPPZ7CCDkEAgZxkDOcL0iIOU9WeHyo0rDca62XGO720RNdBT3KlfUQ0W0ta1kbGPMrXHJO6M8YA24Xg7TUydIKCsnsVkuOmJ624U0steKWsMdTTQuneYAyZrvL9bY85eS5pI4a7ee6FgNSaL0tqJrxeLLTVBf+N4zG935uYQT+p4QfPfrhrqDqLeqm4x9RL7UaflqpKtlkujH07IQHcwxOjD2OdjbsJZkB4zk7s+C6aXvWGjNRUeoNL36ms9U1pHmyVsTWPjOHOjkYT6mHDTtIPIBAzgrvzqF4d9J6v1KLxPV1UELhIZqFhLYnvcHYe3aRsc0kEcEHGCDlYO2eHGipbS61agqm6qommSogc2SS31cNRuYWAPjdtfGcHO8Esw3b2wgwXSnxiaTvE38M6g2/8A3ZrWDb9bTudU0crhwfwgvjye3424BJeFv/S2utFapqTS6a1dYbxUiHz3QUVwimlbHkAucxri5oBc0HI4JAXiNDdD+ndBaKeOu0hFUiJ5LKW9RwV/kkb2lrHuaXGM7hjkZEcZwDnOybVY7LaXufa7Rb6BzwGuNNTMjJAwADtA44H7BBUorpbK2d8FFcaOplYMvZDO17mjOOQDxyrxQjYyONscbGsY0ANa0YAA7ABRQEREBERAREQEREBERAREQEREBERAOccd14vWNw6lWlpqtPWCyali3jNIKp1FUNZjktc/dG89+CWdwPbJ9oiDyPTbX1s1vT3COnobharpaqg0tytlwjDJ6aTGRnBLXNI5a5pII/ZeuUA1ocXBoDndzjkqKAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIggCdxG04ABz7H7f6+VFEQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQSyPbHG6R5w1oJJ+AFFpDmhwzgjPIwVFEBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERBAt9QIOD749/sojOOe6KlTFxDyY4msLyYzG/duaedx4GCSTxz855QVUREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEVndmXR8UTbVUUlPIJmGV1TTula6PPqaA17SHEdiSQPcFVo/qg+Jshhe3yz5r2gtO/IxhvPGN2cnjjv7BWREQEREBEWPqbLaqi4NuMlFEK1vapjyyXsBje3BIwAMZ7cIMgilYwMLiC47nbjlxP7Z7DjsFMgIiICIiAiIgIiICIiCBBLgdxAHt8qI4GAiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICoSVUcdUymc2Xc9u7d5Z2AZA5f+HJJADc5Oe2ASPH9TerGgOnMTTqvUVNSVDwCyjjzLUOBIG4Rty7H3OBwUvmtI5KrT9NbLIy82y8RPqJ66WdsVNRxs27XPc5pa7LyG7QdwOOOUHo7vW3SmZLJSW6OSOItLnSPcXSDgu2Mja4k445xzzjA5tbPHqypYX32a129wdI0RW4un3NOQx/mSNbhwBBLdhGR3IOBqbrd4ktD6FtktNaLvHe7/AB1Ef/gaYEZjOHk+aWGMNLSAHc8OyAcLwlx61eIrUVpluGkejklrp6ulElLLUb55tgkaPMYx+wPBErMYZyMu5aPSHRbtA6UmuT7lcLX/ABSske575LhM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MeXjjgBbFn8UGuWXenvNqtGnrbdIqAW81bKeSQmAAYY1j3mOIbmteRG1oLmjIIGFolEG17n4jOtFylikrNbzPdE4OjDaGmYGuGcOAbGBu5PPdYKu6xdWKyrkqpupOrWySO3OEN2miYPyYxwa0fYALwqIMzd9V6ovDHsu+pLzcGPJc9tVXSShxPcnc45JWGREBEWc07o/VupI3Sad0tfLwxmdzqC3yzgY75LGn5H7oMGi37068MmtNRUdNNdtP6otbph/M86lpoWQgk4J82obKeByPLyCf1PRPTzwf6B07XUl0vN1vF4rqaWOeMNm+niY9vPGwB59XOdwPA+6Dl/wm6AbqvrFp+W4i3z2ylm+smgdNHO9/l4LWvgbIJA0u25cWlo/qBGQfo/p/T1g09FPFYLHbLTHUSmadtDSMgErz/W4MA3O+55WQjiii/4cTGcY9LQOFOgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiKWWSOKN0kr2sY0Zc5xwAPuUEyLwGuOtHS7RsDn3zWlqbKMj6aml+pnJBxjy4tzhyMZIA788FcY+JDxPXnqJELDpCKv09p5rsyuMwbVVvwJNhwxg59Ac7Pck8AB37er5ZbJTPqbzd7fbYGN3Plq6lkLWj5JcQAFprWviu6PaeilbRXir1DVxuLfIttK4jPsfMk2sLfu1zvfhfN6R75JHSSPc97jkuccklQYQDz8H/JB1TrjxraxrnyQ6R0zarNTkFomrHOqp+/DhjYxpx7Fr+/daiv8A1+6y3vP1vUK9RZ//AMJ7aP4/+0hnwP7/ACVrJEFzcq+uuVW6ruNbU1lQ/wDFLUSuke78y4kq2REBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQERbc8KdLZbj1OFru2jaDVc1TSSCjpK2vjpo/MaM4/mAh7iAQAOc4PYOIDUa2p0r6C686kWGW+acZapqOGZsUjf4hEZsnBPoDvSQDnDy0ldt09NfZtY0moLt4fo3VlNEaKKqgvdDN9PTAce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ctkLfj+n2/Vbw6SeJpmqZm0eqOnmqLJM4hsdVRUE9fTvOOxEcfmNJIwAGv8AuQg6GRSwyNliZK0ODXtDgHNLTg/IPIP2PKmQEREBERARcs9ePFxZ9Ny3PTmg6GSvv9FVOpZausgzRxlji1+3Dw55BBwcBvY+ocLnrVPim6zX2JsTNRw2iINIc220jIy/ORkuducDz7EfPcZQfSskAZJwAvL6q6iaF0rCybUGrLPb2vlETRJVN3FxOPwjJxwcnGBjnC+VN+1bqrUBJv2pr1dSfetrpZ/YD+tx9gP2WFQfRTWHi96SWXfHaprrqGZr9mKKkMcf3O6Ut479gckfHK0b1M8ZWs71Eyn0RbI9Khj8uqJHx1ksjfja+Pa39j+a5dRB7zUfWPqnqGmlpbtry/TU82PMhZVOijeAMYLWYBH27Z57ry961HqG9xwx3q/XS5MhbtibV1ckwjHw0OJwPyWLRAREQFFoycfYqCmj/EfyP+SCVERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAW+fBVq616M6n/xPUF4slqs8tPJTzS1jGGbc4At2O2l7RuDc8huM5zjjQyIPsrTTQ1NPHUU8sc0MrA+OSNwc17SMggjggj3U6+fvhf1/quwUNrtFt1/bqWw01W2qr7XT6frbhVljpMPY7bTlrWkZOWSDHGMnIPVNv67abuGuYtPU9m1FHROh3vudTaKqGNryXBrdpi3AHaTudtHI7nIAbM/i9p/i38I/idF/Edu76Tz2+djGc7M7sY57K8c0EtJz6Tkc/bH/VaB15oPpzrG9w6xulnukGrpKnyKKIaoFNLVkZa1sWZjsaB6g1jWO5/Cclesj6HaGrae31ddQ3+jr4mtke2LVVxl8txb64w902S323ANJA9uyDaaKwsNoo7JbmUFA6rMDMbRU1ktS4AAAAOlc52MAcZx3PuVfoCIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAhAIIIyD3CIg8bqLpV011DvN40Jp6qkfndN9BGyXn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g6U9NL/cJLheNB6dq6yV7pJah9BGJJXHu57gAXH7nK8hdvDJ0SuMAjdoqOlcPwyU1bPG4cj4fg9vcHucLg/VnXPq3qarfUXHX18ha9paYaGpNJDtP9JZDtBGOOcn7rxlx1DqC5O3XG+XOsJ956t8ntj3J9kH0Lm8JXRV0Tmi0XOIuBAe25S5afkZJGfzBWNp/CF0ZqWF9PUX6ZgJaXR3JjgCO44Yvns+WST8cj3fmcr3OjOsHUnRtijsel9U1Nrt0b3SCGGGLBc45LiS0kn7kngAdgEGyPFf0isXS4wNs+k77HQzvaymvUl4ZNTyPOSYnw+QHNftY4j1gdz6sLntZrV+rNS6vur7pqa91t1q3/8AvKiUu2/Zo7NH2AAWFQEREBERAUzO/wCh/wAlKpmcH9D/AJIJUREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQFkdMWxl61FbrRJX09vbW1McBqajd5cW5wG520E4GfhY5ZLTVwjtd6pq97qthheHMkpZjFJGc/ia4EHI5IwRzjlB9EbB4UOjFDaoae56cmu1W1o82qluFTFvdjnDWSANbnOByR7k916LSXh66O6XvBu1q0VSGq2lrPq55apkYIAIDJXubng8kZ5POOFk+hF5iuvT+1S/wC99NqJ8tJFI15a5tRHmNpLZd8j3l2Tklxzz78LYCCnDBBAMQwxxjAb6GgcDsOFUREBERAREQEREBERAREQEVOpqIKaEzVM8cMY7vkeGtH6lY+PUenpHbWX61vIdsw2rjPq+O/dBlEUkMsUzA+GVkjD2cxwIP7KdAREQEREBERAREQEREBERAWM1XYrbqfTdw09eIXTW+4U7qeoY15YXMcMHBHIKyaIPmn4s+jdF0m1hSQ6fN5qrHXUonZPVw5ZDJuc0xCZoDXEYDsYBAc3Oc5Wk19kq+jpK+jloq6lgqqWZpZLDNGHskae4c08EfYr53+LHpBebH1Ir7lpDptd7dpZ0QLJKWL6iDc0APk/lF/ksJIw1+09zgdgHPqKL2uY8se0tc04IIwQVBAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREER35UFEd1BAREQEREBERAREQEREBERAREQEREBERBf6evN009e6S92SumoLjRyiWnqIXYcxw/zHsQeCCQeCt96c8Y3Vu2xCK4x6fvY3N3SVdEY5MDuAYXsaCfktPP24XOqIOxLT4465gDbr06p5vl9NdHR4/+F0bv81623+NrQb8fxDSWpafg58jyJec8Dl7eMe64ORB9CqPxl9JZ4i+Wi1RSuDsbJaGIk/f0ykY/X2Vb/wCvF6Qf4dRf/kDf/pr53og+iH/14vSD/DqL/wDIG/8A00/+vF6Qf4dRf/kDf/pr53og+g1Z4z+k8EoZFa9W1TS3O+KihAH29UwOf091kdI+LjphqO901op7bq2mqamVsUIfaxMXuOeGsgfI9x+waTzwCvnQpmOcx7XscWuactcDgg/KD7JSzwxU5qJpGwwtbuc+Q7Q0fJz2/Vay1v4gekWkYHOrtaW6unGQKa1v+skLgcFp8vLWHg/jLV8w6y5XGtbtrLhV1LfiWZzx/cq0Qdz37xvaUhz/AALRF6rvj62pips8D/B5nvleJu/je1bLn+EaJslJwMfVVEs+D7/h2fdcnIg6GvvjD6wXGLZRu0/Z3bcb6O3lx9+f5z5Bnke3sPvnxFy8QPWa4S+ZP1Bu7Hbi7FOWQDnvxG0DHwPb2WsEQe3qer/VaondNJ1K1e1zsZEd4nY3tjhrXAD9lT/9rHVP/wC+XrP/APbtT/8ATXjEQez/APax1T/++XrP/wDbtT/9NSy9VOp8sT4peo+sHxvaWua691JDge4I38heORBnK7WGra7/APTdU3yq4x/OuEr+M5xy75WGlkklkMkr3SPd3c45J/VSIgIiICIiAiIgIiICIiAiIgIiICmZjdyccH/JSqLe/wChQQREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREAd0REBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERBl9KXOrtl1Y+mv8AcrG2T0vqqJzw5oPuQ1zSR84Ofsey6T6Y9WrzZ5IaE+JeKeIOfI6O+aeqKqN5IxgzvHmge4G5oyMe+DyqiDvyk8YmgrbSy099ZcLtXQzuiM1loAyCVo48xomlBDSRxkk4I+69toXxMdKdU2+atnvP+7jWP2MjvM0EUkvyWsZK8gD/AJsZzxlfM1EH1401rfR2pYopLBqiz3ISkiNtPWMe5xBI/DnP9J9vZegXxvoq6toZPMoquopn/wCKGQsP7hbQ0F1yv2ibXSx2S0UjrnA4H+IVdfWy55cT/J88RDIdg+nB+M8gPqAi+fVv8Z3VaCVhqbbperjDjva+jlaXA44BbKMEYODj+o5zxjN0njb1n5sbanSGniwu9bmvmbx7f1HtyffKDupFyZF42dMw09NHUaSutXUYxVSwuZFFuyeYw5znEYwfVtP2C9lQ+L3o9Na46qpq7vS1Lotz6R1A5z2Ox+DcPST984/JB0Ci0NZvFt0Wr5ZGVV4udqa1uQ+rtsrg/wCw8oPOfzAWct3iX6H19SKeDXlMx57GeiqYWdwPxPjDR3+UG3UXi6Hqz0urYBNT9RdJuafZ13ga4c45aXAjt7hZ+zak07epDHZ7/ark8Zy2krI5SMd+Gk/I/dB8hq6trqmeR1XW1NQ8nDnSyucTjjnJ+ytVPNxM8dvUVIgnhmlhfvhlfG7GNzHEH+yzVHrPWFExzKPVd9pmuOXCK4SsBP3w5YJEHqYeo3UKHPk681THu77LvOM/s9XkXVzqrHKyRvUrWJc1wcA691Dhx8gvwR9ivFIg2RTdeOsVPO2aPqJfnObnAkqN7e2OWuBB/ZX8XiO62Ryskbr+vLmuDgHQQOHHyCzBH2K1QiDe9n8WnWqh3fVXy3XTOcfVWyFu3t28oM+Pf5P2x6XTPjQ6i2+kEF6stkvUge4mdzHQPLSOG4YdvB98f91zGiDs6g8cjC4iv6bOa3HDobxk5+MGEf5rK2/xv6Ze1/8AENC3eAgjYIKuOXPznIbj+64cRB9ENI+MLpJd3vjvDr1pxzGbt9ZRmaN5zja0wF7s455aB35+fQW7xR9EK2rfTf74Opy12GST2+oYyTvyDs4HH9WO4918z0QfUqj8QPRmqlMcXUG0NcG7syl8Y/dzQM/ZUKnxFdFae4OoZNf250rWB5dHFM+PH2kawsJ+2cr5eIg+of8A9cV0V/8Au/t3/wCKm/8AoJ/9cV0V/wDu/t3/AOKm/wDoL5eIg+qlt649ILh5fkdRdOs8zOPqKxsGMZ7+Ztx298Z/VZH/ANrHSz/75ejP/wBu03/018mkQfTrVXVLw81tx+i1BqPRd1meGgvkijrIznGMyBrmcYHc8Y5wta641X4N6N00dTaNN107mhxjs9qfg8ZG18TWsB4AIDh357lcHog6IvGvfC1UzTOp+i19G/Ia9t2lhLRjAcGNmLQffHIz8rzVxvvhzqs+RoLXFDlm0eReYjg8+r1tdz/bjstOIg2dPL0AOPJoOpzPnfW0Ls/tEFjZI+jpL/LqteMBzs3U1I7Hxn1jP9l4NEHunUnSFxO3UGuo+eM2Olfx/wDlQU9JaOkU8zmya61hSsxkOm0tAR37eitJz+mOF4JEGyBp7o1kZ6mamI9x/uo3/wD6lbXO2dH6ZrhR6w1lXybQWlunoImZz2JdVZ7c8N+OV4BEFSpEAqHimdI6HPoMjQHEfcAkZVNEQEREBERAREQEREBERAREQEREBERAREQEREBERAREQB35RRHdQQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQFFvfnHYqCmZ+L9D/AJIJUREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAHdFEd1BAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQFVpp56adk9NNJBKw5bJG4tc38iOypKLQS4Ad8oJpv+M/Ax6jx8KRTzODpnuHYuJCkQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQRZ+IfmoKZn428Z57KJjkBxsd+yCRFNsf8A4HfsoEEHBBBQQREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQERTbH/4HfsglUW9+2eCo7H/4Hfsohjhy5pAx7goJEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERBFv4hxnnt8qCDuiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgKLfxDjPKgotxuGe2eUH/9k=`;let bc=document.querySelector(`canvas`),xc=window.matchMedia(`(prefers-reduced-motion: reduce)`),Sc=!1,Cc=!1,wc=!1,Tc=0,Ec=performance.now(),Dc=null,Oc=0,kc=9,Ac=new Es({canvas:bc,alpha:!0,antialias:!0,premultipliedAlpha:!1,powerPreference:`high-performance`});Ac.setClearColor(0,0),Ac.setPixelRatio(Math.min(window.devicePixelRatio||1,2));let jc=new Ft,Mc=new ai(38,1,.1,100);Mc.position.set(0,0,9);let Nc=new yr(1.5,96,96),Pc=new Vn({color:Zs.ocean,toneMapped:!1}),Fc=new $n(Nc,Pc);Fc.rotation.set(.35,-Math.PI/2,0),jc.add(Fc);let Ic=hc(`low`),Lc=gc(Ic),Rc=vc(Ic),zc=new $n(Lc,Rc);zc.scale.setScalar(1.5/100);let Bc=new Dt;Bc.rotation.set(.36,0,.28),Bc.add(zc),jc.add(Bc);let Vc=new yr(1.5,64,64),Hc=new Vn({color:`#8B5CF6`,transparent:!0,opacity:.16,side:1,depthWrite:!1}),Uc=new $n(Vc,Hc);Uc.scale.setScalar(1.025),jc.add(Uc);let Wc=new Is(Mc,bc);Wc.enabled=!1,Wc.enablePan=!1,Wc.enableDamping=!1,Wc.minDistance=3.2,Wc.maxDistance=24,Wc.rotateSpeed=.7,Wc.zoomSpeed=.8;function Gc(e){let t=document.createElement(`canvas`);t.width=e.naturalWidth,t.height=e.naturalHeight;let i=t.getContext(`2d`);if(!i)return null;i.drawImage(e,0,0);let a=i.getImageData(0,0,t.width,t.height),o=e=>[1,3,5].map(t=>parseInt(e.slice(t,t+2),16)),s=o(Zs.ocean),c=o(Zs.land);for(let e=0;e<a.data.length;e+=4){let t=a.data[e]>=128?s:c;a.data[e]=t[0],a.data[e+1]=t[1],a.data[e+2]=t[2],a.data[e+3]=255}i.putImageData(a,0,0);let l=new fr(t);return l.colorSpace=k,l.wrapS=n,l.wrapT=r,l}function Kc(){Sc||Ac.getContext().isContextLost()||(Uc.rotation.copy(Fc.rotation),Ac.render(jc,Mc))}function qc(){if(Sc)return;let e=Math.max(1,bc.clientWidth),t=Math.max(1,bc.clientHeight);Ac.setSize(e,t,!1),Mc.aspect=e/t;let n=wc?9/Math.min(1,Mc.aspect):9;Mc.position.multiplyScalar(n/kc),kc=n,Wc.maxDistance=Math.max(24,kc*2.5),Mc.updateProjectionMatrix(),Wc.update(),Kc()}function Jc(e){if(Tc=0,Sc||!Cc||document.hidden||xc.matches)return;let t=Math.min((e-Ec)/1e3,.1);Ec=e,Fc.rotation.y-=t*(Math.PI*2/36),Oc-=t*(Math.PI*2/72),zc.rotation.y=Oc,Rc.uniforms.uReflectionSurfaceRotation.value=Oc,Kc(),Tc=requestAnimationFrame(Jc)}function Yc(){cancelAnimationFrame(Tc),Tc=0,Wc.enabled=Cc&&wc&&!document.hidden,!(Sc||!Cc||document.hidden)&&(Ec=performance.now(),Kc(),xc.matches||(Tc=requestAnimationFrame(Jc)))}function Xc(){Sc||(Sc=!0,cancelAnimationFrame(Tc),$c.disconnect(),document.removeEventListener(`visibilitychange`,Yc),xc.removeEventListener(`change`,Yc),window.removeEventListener(`pagehide`,Xc),bc.removeEventListener(`webglcontextlost`,Zc),bc.removeEventListener(`webglcontextrestored`,Qc),Wc.removeEventListener(`change`,Kc),Wc.dispose(),Dc?.dispose(),Lc.dispose(),Rc.dispose(),Nc.dispose(),Pc.dispose(),Vc.dispose(),Hc.dispose(),Ac.dispose(),Ac.forceContextLoss())}function Zc(e){e.preventDefault(),cancelAnimationFrame(Tc),Tc=0}function Qc(){Yc()}let $c=new ResizeObserver(qc);$c.observe(bc),Wc.addEventListener(`change`,Kc),document.addEventListener(`visibilitychange`,Yc),xc.addEventListener(`change`,Yc),window.addEventListener(`pagehide`,Xc),bc.addEventListener(`webglcontextlost`,Zc),bc.addEventListener(`webglcontextrestored`,Qc),qc(),new Zr().load(yc,e=>{Sc||(Dc=Gc(e),Dc&&(Pc.color.set(16777215),Pc.map=Dc,Pc.needsUpdate=!0,Kc()))}),window.meewavAuthGlobe=Object.freeze({setActive(e){Cc=e===!0,Yc()},setInteractive(e){let t=e===!0;wc!==t&&(wc=t,Mc.position.set(0,0,kc),Wc.target.set(0,0,0),qc(),Yc())},zoomIn(){wc&&(Mc.position.multiplyScalar(Math.max(Wc.minDistance/Mc.position.length(),.8)),Wc.update(),Kc())},zoomOut(){wc&&(Mc.position.multiplyScalar(Math.min(Wc.maxDistance/Mc.position.length(),1.25)),Wc.update(),Kc())},rotateLeft(){wc&&(Mc.position.applyAxisAngle(new W(0,1,0),Math.PI/8),Wc.update(),Kc())},rotateRight(){wc&&(Mc.position.applyAxisAngle(new W(0,1,0),-Math.PI/8),Wc.update(),Kc())},resetView(){Mc.position.set(0,0,kc),Wc.target.set(0,0,0),Wc.update(),Kc()},dispose:Xc})})();