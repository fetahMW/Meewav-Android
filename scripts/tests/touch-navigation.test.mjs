import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createTouchNavigation, pairTransform } from '../../app/src/main/globe-source/touch-navigation.mjs';
import { createTouchCamera } from '../../app/src/main/globe-source/touch-camera.mjs';
import { elasticDelta } from '../../app/src/main/globe-source/touch-elastic.mjs';
import { createCamera } from '../../app/src/main/globe-source/vendor/globe-vinyle/shared/src/camera.mjs';
import { createOrbitCameraUpdater } from '../../app/src/main/globe-source/vendor/globe-vinyle/shared/src/orbit-camera.mjs';
import { solveScreenAnchor } from '../../app/src/main/globe-source/vendor/globe-vinyle/shared/src/screen-anchor.mjs';
import { RADIUS, xyz, lonlat } from '../../app/src/main/globe-source/vendor/globe-vinyle/shared/src/geo.mjs';
import { createRingNavigation } from '../../app/src/main/globe-source/vendor/globe-vinyle/shared/src/ring-navigation.mjs';

const near = (a,b,e=1e-8) => assert.ok(Math.abs(a-b)<e, `${a} != ${b} (tolerance ${e})`);
const event = (id,x,y,t) => ({ pointerType:'touch', pointerId:id,clientX:x,clientY:y,timeStamp:t });
function harness(reducedMotion=false) {
  const calls=[], pans=[], taps=[];
  const nav=createTouchNavigation({ interrupt(){},release(){},pickPoint(x,y){return [x,y];},
    pan(from,to){pans.push({from:{...from},to:{...to}});},
    transform(c){calls.push({...c,from:{...c.from},to:{...c.to}});},tap(t){taps.push(t);},settle(){return false;}
  },{reducedMotion});
  return {nav,calls,pans,taps};
}
test('asymmetric similarity maps both old fingers to both new fingers',()=>{
  const p=[{x:50,y:80},{x:160,y:80}],q=[{x:50,y:80},{x:230,y:120}];
  const c=pairTransform(p,q);
  for(let i=0;i<2;i++){
    const x=p[i].x-c.fromX,y=p[i].y-c.fromY;
    near(c.x+c.scale*(x*Math.cos(c.angle)-y*Math.sin(c.angle)),q[i].x);
    near(c.y+c.scale*(x*Math.sin(c.angle)+y*Math.cos(c.angle)),q[i].y);
  }
});
test('coalesces events; 1→2→1 and third finger rebase without a transform',()=>{
  const {nav,calls,pans}=harness(); nav.down(event(1,100,100,10));
  for(let i=1;i<=5;i++) nav.move(event(1,100+i,100,10+i));
  assert.equal(pans.length,0);nav.tick(20);assert.equal(pans.length,1);
  nav.down(event(2,200,100,21));nav.tick(22);assert.equal(calls.length,0);
  nav.move(event(2,220,105,30));nav.tick(32);assert.equal(calls.length,1);
  near(calls[0].from.x,152.5);near(calls[0].to.x,162.5);
  nav.down(event(3,350,110,33));nav.up(event(3,350,110,34));nav.tick(35);assert.equal(calls.length,1);
  nav.up(event(1,105,100,36));nav.tick(37);assert.equal(pans.length,1);
  nav.move(event(2,224,107,40));nav.tick(45);
  assert.deepEqual(pans[1],{from:{x:220,y:105},to:{x:224,y:107}});
});
test('rotation threshold, parallel tilt, crossing fingers and cancel remain finite',()=>{
  const {nav,calls}=harness();nav.down(event(1,100,100,1));nav.down(event(2,200,100,2));
  nav.move(event(1,100,96,10));nav.move(event(2,200,96,10));nav.tick(12);near(calls.at(-1).pitch,0);
  nav.move(event(1,100,90,20));nav.move(event(2,200,90,20));nav.tick(22);assert.ok(calls.at(-1).pitch>0);
  nav.move(event(2,210,120,30));nav.tick(32);assert.ok(calls.at(-1).rotation>0);near(calls.at(-1).pitch,0);
  nav.move(event(1,240,120,40));nav.move(event(2,90,100,40));nav.tick(42);
  assert.ok(calls.every(c=>[c.factor,c.rotation,c.pitch].every(Number.isFinite)));
  const count=calls.length;nav.up(event(1,240,120,43),true);nav.move(event(2,50,50,44));nav.tick(50);
  assert.equal(calls.length,count);assert.equal(nav.pointers.size,0);
});
test('recent velocity produces decaying inertia; a stationary release does not',()=>{
  for(const pause of [0,140]){
    const {nav,pans}=harness();nav.down(event(1,100,100,10));
    for(let i=1;i<=5;i++){nav.move(event(1,100+i*10,100,10+i*16));nav.tick(10+i*16);}
    nav.up(event(1,150,100,90+pause));const count=pans.length;
    nav.tick(106+pause);nav.tick(122+pause);
    if(pause) assert.equal(pans.length,count);
    else {assert.ok(pans.length>count);const dx=pans.at(-1).to.x-pans.at(-1).from.x;
      assert.ok(dx>0 && dx<pans.at(-2).to.x-pans.at(-2).from.x);
      nav.down(event(2,200,200,124));const stopped=pans.length;nav.tick(140);assert.equal(pans.length,stopped);}
  }
});
test('double tap zoom is anchored; quick zoom excludes selection and cancelled gestures',()=>{
  const {nav,calls,taps}=harness();nav.down(event(1,80,90,10));nav.up(event(1,80,90,30));
  nav.down(event(2,82,92,100));nav.up(event(2,82,92,120));nav.tick(130);nav.tick(146);nav.tick(200);nav.tick(300);nav.tick(410);
  near(calls.reduce((n,c)=>n*c.factor,1),.5);assert.equal(taps.length,0);
  assert.ok(calls.every(c=>c.to.x===82&&c.to.y===92));
  nav.down(event(3,80,90,500));nav.up(event(3,80,90,510));nav.down(event(4,80,90,600));
  nav.move(event(4,80,120,620));nav.tick(625);nav.up(event(4,80,120,630));nav.tick(1000);
  assert.ok(calls.at(-1).factor<1);assert.equal(taps.length,0);
});
test('reduced motion skips inertia and double-tap animation',()=>{
  const {nav,calls}=harness(true);nav.zoomAt(.5,90,60);assert.equal(calls.length,1);near(calls[0].factor,.5);
  nav.down(event(1,100,100,10));nav.move(event(1,150,100,30));nav.up(event(1,150,100,40));nav.tick(56);
  assert.equal(nav.isMoving(),false);
});

function geometry(initial={}) {
  const motion=createCamera({lon:2.35,lat:48.86,height:2,pitch:30,bearing:0,...initial},false),view=motion.view;
  const camera=new T.PerspectiveCamera(38,800/400,.001,1000);
  const updateCamera=createOrbitCameraUpdater(camera,view);updateCamera();
  const ray=new T.Raycaster(),sphere=new T.Sphere(new T.Vector3(),RADIUS);
  function pickPoint(x,y){ray.setFromCamera(new T.Vector2(x/400-1,1-y/200),camera);
    const hit=ray.ray.intersectSphere(sphere,new T.Vector3());return hit?lonlat(hit.x,hit.y,hit.z):null;}
  function project(point){const p=new T.Vector3(...xyz(point[0],point[1],RADIUS)).project(camera);return {x:(p.x+1)*400,y:(1-p.y)*200};}
  const keepPoint=(a,latitudeLimit)=>solveScreenAnchor({view,camera,point:a.point,x:a.x,y:a.y,width:800,height:400,updateCamera,latitudeLimit});
  const api=createTouchCamera({view,motion,pickPoint,keepPoint,updateCamera,ring:{active:false,releaseTouch(){}},width:()=>800,height:()=>400});
  return {api,view,motion,camera,pickPoint,project,updateCamera};
}
test('real Three camera retains moving off-centre world anchor across zoom, bearing, pitch',()=>{
  for(const initial of [{},{height:.01,pitch:60},{height:220,pitch:0},{lon:179.9,height:1}]){
    const g=geometry(initial);let from={x:430,y:230};const anchor=g.pickPoint(from.x,from.y);assert.ok(anchor);
    for(let i=0;i<16;i++){
      const to={x:from.x+1,y:from.y-.7};g.api.transform({factor:.98,rotation:.8,pitch:.15,from,to,anchor});
      const screen=g.project(anchor);near(screen.x,to.x,.8);near(screen.y,to.y,.8);from=to;
    }
  }
});
test('clockwise two-finger rotation moves the world clockwise',()=>{
  const g=geometry({pitch:0});const from={x:400,y:200};const anchor=g.pickPoint(400,200),right=g.pickPoint(450,200);
  g.api.transform({factor:1,rotation:10,pitch:0,from,to:from,anchor});
  assert.ok(g.project(right).y>200,'the right-hand world point should move down');
});
test('elastic limits resist then settle, preserving displayed pose when interrupted',()=>{
  let v=75;for(let i=0;i<100;i++) v=elasticDelta(v,2,0,75,3);
  assert.ok(v>75&&v<=78);near(elasticDelta(v,-1,0,75,3),v-1);
  const g=geometry({height:400,pitch:75});const p={x:400,y:200};
  g.api.transform({factor:2,rotation:0,pitch:20,from:p,to:p,anchor:null});
  assert.ok(g.view.height>400&&g.view.height<480);assert.ok(g.view.pitch>75&&g.view.pitch<78);
  const pose={...g.view};g.motion.tick(.016);assert.deepEqual(g.view,pose);g.api.interrupt();assert.deepEqual(g.view,pose);
  g.api.release();g.api.settle(.1);assert.ok(g.view.height<pose.height&&g.view.height>400);
  g.api.settle(.5);near(g.view.height,400,1e-8);near(g.view.pitch,75);
});
test('one-finger drag anchor survives a moving viewport point',()=>{
  const g=geometry({height:.3});const from={x:470,y:235},to={x:510,y:260};const anchor=g.pickPoint(from.x,from.y);
  g.api.pan(from,to,{anchor});const screen=g.project(anchor);near(screen.x,to.x,.8);near(screen.y,to.y,.8);
});

function ringFixture(){
  const camera=new T.PerspectiveCamera(38,2,.03,900);camera.position.set(0,20,250);camera.lookAt(0,0,0);camera.updateMatrixWorld();
  const ring={state:()=>({normal:[0,1,0],innerRadius:110,outerRadius:170}),
    surfaceAt(a,u){const r=110+60*u;return {position:new T.Vector3(Math.cos(a)*r,0,Math.sin(a)*r),forward:new T.Vector3(-Math.sin(a),0,Math.cos(a))};}};
  return {camera,nav:createRingNavigation(camera,ring,false)};
}
test('ring pinch preserves the projected ground point and interrupted flight pose',()=>{
  const {camera,nav}=ringFixture();nav.enter();nav.tick(.03);
  const position=camera.position.clone(),rotation=camera.quaternion.clone();nav.interruptTouch();nav.tick(0,true);
  near(camera.position.distanceTo(position),0,1e-6);near(camera.quaternion.angleTo(rotation),0,1e-6);
  nav.restore({angle:Math.PI/2,across:.5,heading:0,elevation:4,pitch:.7});nav.tick(0,true);
  const anchor=nav.pickTouchPoint(430,240,800,400);assert.ok(anchor);
  nav.transformTouch({factor:.9,rotation:4,pitch:1,from:{x:430,y:240},to:{x:435,y:242},anchor},800,400);
  const screen=anchor.clone().project(camera);near((screen.x+1)*400,435,.5);near((1-screen.y)*200,242,.5);
});
test('ring rotation follows clockwise fingers; a touch cancels a return flight in place',()=>{
  const {camera,nav}=ringFixture();nav.enter();nav.restore({angle:Math.PI/2,across:.5,heading:0,elevation:4,pitch:0});nav.tick(0,true);
  const center={x:400,y:200},anchor=nav.pickTouchPoint(400,200,800,400),right=nav.pickTouchPoint(440,200,800,400);
  nav.transformTouch({factor:1,rotation:10,pitch:0,from:center,to:center,anchor},800,400);
  assert.ok(right.clone().project(camera).y<0,'screen right must rotate down');
  const destination=camera.clone();destination.position.set(0,30,260);destination.lookAt(0,0,0);
  nav.returnTo(destination,()=>assert.fail('interrupted return must not complete'));nav.tick(.03);
  const p=camera.position.clone(),q=camera.quaternion.clone();nav.interruptTouch();nav.tick(0,true);
  near(camera.position.distanceTo(p),0,1e-6);near(camera.quaternion.angleTo(q),0,1e-6);
});
