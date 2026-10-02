import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { dockLayout, nearestAngle, viewportRotation } from '../../app/src/main/globe-source/globe-dock-geometry.mjs';
import { installGlobeDockMotion } from '../../app/src/main/globe-source/globe-dock-motion.ts';
import { createGlobeSceneOrientation } from '../../app/src/main/globe-source/globe-scene-orientation.mjs';
import { createGlobeSurfaceFrame } from '../../app/src/main/globe-source/globe-surface-frame.mjs';
import { installGlobeLayout } from '../../app/src/main/globe-source/globe-layout.ts';

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
const rotate = (x, y, degrees) => {
  const angle = degrees * Math.PI / 180;
  return [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle)];
};

// Convert logical CSS coordinates to the Android device's fixed portrait axes.
function devicePoint(x, y, rotation, width, height) {
  if (rotation === 90) return [height - y, x];
  if (rotation === 180) return [width - x, height - y];
  if (rotation === 270) return [y, width - x];
  return [x, y];
}

test('every dock item and its fold handle remain at the same physical location in all four orientations', () => {
  for (const [deviceWidth, deviceHeight] of [[360,780],[412,915],[384,832]]) {
    for (const rotation of [0,90,180,270]) {
      const width = rotation % 180 ? deviceHeight : deviceWidth;
      const height = rotation % 180 ? deviceWidth : deviceHeight;
      const frame = dockLayout(rotation, width, height);
      assert.equal(frame.width, deviceWidth);
      for (const [localX, localY] of [[-deviceWidth/2+28,30],[-80,30],[0,-8],[80,30],[deviceWidth/2-28,30],[0,-42]]) {
        const [dx, dy] = rotate(localX,localY,frame.rotation);
        const physical = devicePoint(frame.centerX+dx,frame.centerY+dy,rotation,width,height);
        close(physical[0],deviceWidth/2+localX);
        close(physical[1],deviceHeight-52+localY);
        // A manual fold moves toward the physical bottom, never across the map.
        const [foldX,foldY] = rotate(localX,localY+76,frame.rotation);
        const folded = devicePoint(frame.centerX+foldX,frame.centerY+foldY,rotation,width,height);
        close(folded[0],physical[0]); close(folded[1]-physical[1],76);
      }
    }
  }
});

test('reversals and crossing ±180 keep the shortest local movement without a full revolution', () => {
  let angle = 0;
  for (const value of [45,90,135,179,-179,-135,-90,-45,0,45,90]) {
    const next = nearestAngle(value,angle);
    assert.ok(Math.abs(next-angle)<=46);
    angle=next;
  }
  close(nearestAngle(179,181),179);
  close(nearestAngle(-179,-181),-179);
  close(nearestAngle(5,1082),1085);
  close(nearestAngle(-5,-1082),-1085);
});

function environment() {
  const style = () => ({ values: new Map(), writes: 0,
    setProperty(name,value) { this.values.set(name,value); this.writes++; },
    removeProperty(name) { this.values.delete(name); },
    getPropertyValue(name) { return this.values.get(name) ?? ''; } });
  const root = { dataset: {}, style: style(), hasAttribute: () => false };
  const dock = { style: style() };
  const preference = Object.assign(new EventTarget(), { matches: false });
  const orientation = Object.assign(new EventTarget(), { angle: 0 });
  const timers = new Map();
  let clock = 0, nextTimer = 0;
  const sceneCalls = [];
  const win = Object.assign(new EventTarget(), { innerWidth: 360, innerHeight: 780,
    screen: { orientation, width: 360, height: 780 }, matchMedia: () => preference,
    setTimeout(callback, delay) { const id = ++nextTimer; timers.set(id, { callback, at: clock + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    __meewavEngine: { setDeviceOrientation: (...args) => sceneCalls.push(args) } });
  const doc = Object.assign(new EventTarget(), { documentElement: root, hidden: false,
    querySelector: selector => selector === '.globe-device-dock' ? dock : null });
  const oldWindow = globalThis.window, oldDocument = globalThis.document;
  globalThis.window=win; globalThis.document=doc;
  const cleanup = installGlobeDockMotion();
  return { root, dock, win, doc, orientation, preference, sceneCalls, timers,
    advance(milliseconds) {
      const until = clock + milliseconds;
      for (;;) {
        const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
        if (!next || next[1].at > until) break;
        const [id, timer] = next; clock = timer.at; timers.delete(id); timer.callback();
      }
      clock = until;
    },
    dispose() { cleanup(); globalThis.window=oldWindow; globalThis.document=oldDocument; } };
}

test('hand motion never drives icons or the scene while the display orientation stays unchanged', () => {
  const env=environment();
  try {
    env.win.meewavGlobeDock.update(0,0,false);
    const initialWrites=env.root.style.writes, iconWrites=env.dock.style.writes, sceneCalls=env.sceneCalls.length;
    for (const roll of [0,20,45,89,135,179,181,225,270,180,90,0,-45,-90,NaN,null]) {
      env.win.meewavGlobeDock.update(roll,0,true);
      assert.equal(env.dock.style.getPropertyValue('--globe-dock-icon-angle'),'0deg');
      assert.equal(env.root.dataset.globeTurning,undefined);
    }
    assert.equal(env.root.style.writes,initialWrites);
    assert.equal(env.dock.style.writes,iconWrites);
    assert.equal(env.sceneCalls.length,sceneCalls);
  } finally { env.dispose(); }
});

test('confirmed display turns animate canonical icon targets while the chassis stays fixed', () => {
  const env=environment();
  try {
    env.win.meewavGlobeDock.update(0,0,false);
    env.win.innerWidth=780; env.win.innerHeight=360;
    env.win.meewavGlobeDock.update(-62,90,true);
    assert.equal(env.root.dataset.globeDockSide,'right');
    assert.equal(env.root.style.getPropertyValue('--globe-dock-width'),'360px');
    assert.equal(env.root.style.getPropertyValue('--globe-dock-frame-angle'),'-90deg');
    assert.equal(env.dock.style.getPropertyValue('--globe-dock-icon-angle'),'90deg');
    const writes=env.dock.style.writes, calls=env.sceneCalls.length;
    for (const roll of [-62,-95,-120,-75,-30]) env.win.meewavGlobeDock.update(roll,90,true);
    assert.equal(env.dock.style.writes,writes);assert.equal(env.sceneCalls.length,calls);
    env.win.meewavGlobeDock.update(80,270,true);
    assert.equal(env.root.dataset.globeDockSide,'left');
    close(nearestAngle(Number.parseFloat(env.dock.style.getPropertyValue('--globe-dock-icon-angle')),270),270);
    assert.deepEqual(env.sceneCalls.at(-1),[null,270,false]);
  } finally { env.dispose(); }
});

test('native display rotation stays authoritative if the WebView reports angle zero', () => {
  const env=environment();
  try {
    env.win.innerWidth=780; env.win.innerHeight=360;
    env.win.meewavGlobeDock.update(-90,90);
    env.win.dispatchEvent(new Event('resize'));
    env.orientation.dispatchEvent(new Event('change'));
    assert.equal(env.root.dataset.globeDockSide,'right');
    assert.equal(env.root.style.getPropertyValue('--globe-dock-width'),'360px');
    assert.equal(env.root.style.getPropertyValue('--globe-dock-frame-angle'),'-90deg');
    assert.equal(env.dock.style.getPropertyValue('--globe-dock-icon-angle'),'90deg');
  } finally { env.dispose(); }
});

test('flat phones and reduced motion use upright display angles; inactive scenes ignore sensor motion', () => {
  const env=environment();
  try {
    env.orientation.angle=90; env.win.innerWidth=780; env.win.innerHeight=360;
    env.win.meewavGlobeDock.update(null,90);
    assert.equal(env.dock.style.getPropertyValue('--globe-dock-icon-angle'),'90deg');
    env.preference.matches=true; env.preference.dispatchEvent(new Event('change'));
    env.win.meewavGlobeDock.update(-45,90,true);
    assert.equal(env.dock.style.getPropertyValue('--globe-dock-icon-angle'),'90deg');
    env.preference.matches=false; env.doc.hidden=true; env.doc.dispatchEvent(new Event('visibilitychange'));
    env.win.meewavGlobeDock.update(-70,90,true);
    assert.equal(env.dock.style.getPropertyValue('--globe-dock-icon-angle'),'90deg');
    env.doc.hidden=false; env.doc.dispatchEvent(new Event('visibilitychange'));
    env.win.meewavGlobeDock.update(-70,90,true);
    assert.equal(env.dock.style.getPropertyValue('--globe-dock-icon-angle'),'90deg');
  } finally { env.dispose(); }
});

test('cleanup removes native callbacks, layout listeners and all dock geometry', () => {
  const env=environment();
  const win=env.win, root=env.root;
  env.dispose();
  assert.equal(win.meewavGlobeDock,undefined);
  assert.deepEqual(root.dataset,{});
  win.innerWidth=780; win.innerHeight=360; win.dispatchEvent(new Event('resize'));
  assert.equal(root.style.values.size,0);
  assert.equal(env.dock.style.values.size,0);
  assert.equal(env.timers.size,0);
});

test('the scene receives canonical display targets and pauses with the native lifecycle', () => {
  const env=environment();
  try {
    env.win.innerWidth=780; env.win.innerHeight=360;
    env.win.meewavGlobeDock.update(-62,90,true);
    assert.deepEqual(env.sceneCalls.at(-1),[null,90,false]);
    env.preference.matches=true; env.preference.dispatchEvent(new Event('change'));
    assert.deepEqual(env.sceneCalls.at(-1),[null,90,true]);
    env.doc.hidden=true; env.doc.dispatchEvent(new Event('visibilitychange'));
    const count=env.sceneCalls.length;
    env.win.meewavGlobeDock.update(-80,90,true);
    assert.equal(env.sceneCalls.length,count);
    env.preference.matches=false; env.doc.hidden=false; env.doc.dispatchEvent(new Event('visibilitychange'));
    assert.deepEqual(env.sceneCalls.at(-1),[null,90,false]);
  } finally { env.dispose(); }
});

test('resting portrait and landscape ignore sensor wobble and do no repeated scene work', () => {
  const env=environment();
  try {
    for (const rotation of [0,90,270,0]) {
      env.win.innerWidth=rotation%180?780:360; env.win.innerHeight=rotation%180?360:780;
      env.win.meewavGlobeDock.update(-rotation,rotation,false);
      const icon=env.dock.style.getPropertyValue('--globe-dock-icon-angle');
      const writes=env.dock.style.writes, calls=env.sceneCalls.length;
      for (const wobble of [2,-6,8,-9,3]) env.win.meewavGlobeDock.update(-rotation+wobble,rotation,false);
      assert.equal(env.dock.style.getPropertyValue('--globe-dock-icon-angle'),icon);
      assert.equal(env.dock.style.writes,writes);
      assert.equal(env.sceneCalls.length,calls);
      assert.deepEqual(env.sceneCalls.at(-1),[null,rotation,false]);
      env.advance(120);
      assert.equal(env.root.dataset.globeTurning,undefined);
    }
  } finally { env.dispose(); }
});

test('controls hide only during a confirmed turn and wait for its completion before reappearing', () => {
  const env=environment();
  try {
    env.win.meewavGlobeDock.update(0,0,false);
    env.win.meewavGlobeDock.update(-40,0,true);
    assert.equal(env.root.dataset.globeTurning,undefined);
    env.win.meewavGlobeDock.update(-90,90,true);
    assert.equal(env.root.dataset.globeTurning,'true');
    assert.equal(env.timers.size,0);
    env.win.innerWidth=780; env.win.innerHeight=360; env.win.dispatchEvent(new Event('resize'));
    env.advance(300); assert.equal(env.root.dataset.globeTurning,'true');
    env.win.meewavGlobeDock.update(-90,90,false);
    env.advance(119); assert.equal(env.root.dataset.globeTurning,'true');
    env.win.meewavGlobeDock.update(0,0,true);
    env.win.innerWidth=360; env.win.innerHeight=780; env.win.dispatchEvent(new Event('resize'));
    env.advance(300); assert.equal(env.root.dataset.globeTurning,'true');
    env.win.meewavGlobeDock.update(0,0,false);
    env.advance(120); assert.equal(env.root.dataset.globeTurning,undefined);
    // The next turn must wait for native and WebView sizes to agree.
    env.win.meewavGlobeDock.update(-90,90,true);
    env.win.meewavGlobeDock.update(-90,90,false);
    env.advance(500); assert.equal(env.root.dataset.globeTurning,'true');
    env.win.innerWidth=780; env.win.innerHeight=360; env.win.dispatchEvent(new Event('resize'));
    env.advance(120); assert.equal(env.root.dataset.globeTurning,undefined);
  } finally { env.dispose(); }
});

test('reappearing controls wait for the replacement rendered surface', () => {
  const env=environment();
  const canvas={dataset:{globeDisplayRotation:'0'}};
  env.doc.querySelector=selector=>selector==='.globe-stage canvas'?canvas:env.dock;
  try {
    env.win.meewavGlobeDock.update(0,0,false);
    env.win.meewavGlobeDock.update(-90,90,true);
    env.win.innerWidth=780; env.win.innerHeight=360;env.win.dispatchEvent(new Event('resize'));
    env.win.meewavGlobeDock.update(-90,90,false);
    env.advance(120); assert.equal(env.root.dataset.globeTurning,'true');
    canvas.dataset.globeDisplayRotation='90'; env.win.dispatchEvent(new Event('meewav:globe-surface'));
    env.advance(119); assert.equal(env.root.dataset.globeTurning,'true');
    env.advance(1); assert.equal(env.root.dataset.globeTurning,undefined);
    env.win.meewavGlobeDock.update(0,0,true);
    env.win.meewavGlobeDock.update(-90,90,true);
    env.win.meewavGlobeDock.update(-90,90,false);
    assert.equal(env.timers.size,1);
    env.doc.hidden=true; env.doc.dispatchEvent(new Event('visibilitychange'));
    assert.equal(env.timers.size,0);
  } finally { env.dispose(); }
});

test('confirmed browser-first and native-first turns keep the correct quadrant in both directions', () => {
  for (const rotation of [90,270]) for (const nativeFirst of [false,true]) {
    const env=environment();
    try {
      env.win.meewavGlobeDock.update(0,0,false);
      if (nativeFirst) {
        env.win.meewavGlobeDock.update(-rotation,rotation,true);
        assert.equal(env.root.dataset.globeDisplayRotation,'0');
        assert.deepEqual(env.sceneCalls.at(-1),[null,0,false]);
      } else env.orientation.angle=rotation;
      env.win.innerWidth=780; env.win.innerHeight=360; env.win.dispatchEvent(new Event('resize'));
      assert.equal(env.root.dataset.globeDisplayRotation,String(rotation));
      assert.deepEqual(env.sceneCalls.at(-1),[null,rotation,false]);
      env.win.meewavGlobeDock.update(-rotation,rotation,true);
      env.win.meewavGlobeDock.update(-rotation,rotation,false);
      assert.deepEqual(env.sceneCalls.at(-1),[null,rotation,false]);
    } finally { env.dispose(); }
  }
});

test('the portrait keyboard cannot change the fixed navbar edge or camera display rotation', () => {
  const env=environment();
  try {
    env.win.meewavGlobeDock.update(0,0,false);
    const calls=env.sceneCalls.length;
    env.win.innerHeight=250; env.win.dispatchEvent(new Event('resize'));
    assert.equal(env.root.dataset.globeDockSide,'bottom');
    assert.equal(env.root.dataset.globeDisplayRotation,'0');
    assert.equal(env.root.dataset.globeTurning,undefined);
    assert.equal(env.sceneCalls.length,calls);
    assert.equal(viewportRotation(90,undefined,360,360,null,90),0);
  } finally { env.dispose(); }
});

test('overlay layout follows the committed native display even when browser orientation is stale', () => {
  const env=environment();
  env.orientation.type='portrait-primary';
  const disposeLayout=installGlobeLayout();
  try {
    env.win.meewavGlobeDock.update(-62,90,true);
    assert.equal(env.root.dataset.globeOrientation,'portrait');
    env.win.innerWidth=780;env.win.innerHeight=360;env.win.dispatchEvent(new Event('resize'));
    assert.equal(env.root.dataset.globeOrientation,'landscape');
    env.win.meewavGlobeDock.update(-90,90,false);
    env.win.innerWidth=360;env.win.innerHeight=780;env.win.dispatchEvent(new Event('resize'));
    env.win.meewavGlobeDock.update(0,0,false);
    assert.equal(env.root.dataset.globeOrientation,'portrait');
  } finally { disposeLayout(); env.dispose(); }
});

test('the previous complete canvas frame retains pixel size and physical position during display swaps', () => {
  for (const previous of [0,90,180,270]) for (const next of [0,90,180,270]) {
    const oldWidth=previous%180?780:360, oldHeight=previous%180?360:780;
    const width=next%180?780:360, height=next%180?360:780;
    for (const [x,y] of [[80,140],[-50,170],[0,0],[30,-90]]) {
      const expected=devicePoint(oldWidth/2+x,oldHeight/2+y,previous,oldWidth,oldHeight);
      const [dx,dy]=rotate(x,y,previous-next);
      const actual=devicePoint(width/2+dx,height/2+dy,next,width,height);
      close(actual[0],expected[0]); close(actual[1],expected[1]);
    }
  }
  const canvas={style:{width:'',height:'',writes:0,setProperty(name,value){this[name]=value;this.writes++;}},dataset:{}};
  const surface=createGlobeSurfaceFrame(canvas);
  assert.equal(surface.commit(360,780,0),true);
  assert.equal(canvas.style.width,'360px'); assert.equal(canvas.style.height,'780px');
  // Layout can now change; only a completed render calls commit again.
  assert.equal(surface.commit(360,780,0),false); assert.equal(canvas.style.writes,1);
  assert.equal(surface.commit(780,360,90),true);
  assert.equal(canvas.style.width,'780px'); assert.equal(canvas.style.height,'360px');
  assert.equal(canvas.style['--globe-rendered-display-angle'],'90deg');
  assert.equal(canvas.dataset.globeDisplayRotation,'90');
  assert.equal(surface.commit(0,360,90),false); assert.equal(surface.commit(780,360,NaN),false);
  assert.equal(canvas.dataset.globeDisplayRotation,'90');
});

function sceneFixture(duration) {
  let width=360,height=780;
  const fov=T.MathUtils.radToDeg(2*Math.atan(Math.tan(T.MathUtils.degToRad(19))/(width/height)));
  const camera=new T.PerspectiveCamera(fov,width/height,.03,2000);
  camera.position.set(0,0,300);camera.lookAt(0,0,0);camera.updateMatrixWorld();
  const scene=createGlobeSceneOrientation(camera,duration);
  function resize(w,h) {
    width=w;height=h;camera.aspect=w/h;camera.fov=scene.fovForHeight(h);
    camera.updateProjectionMatrix();scene.apply();
  }
  function project(point) {
    const p=point.clone().project(camera);
    return [(p.x+1)*width/2,(1-p.y)*height/2];
  }
  // Gravity/world coordinates remove both Android's discrete screen rotation
  // and the phone's continuous physical roll. A stable scene stays here.
  function gravityPoint(point,roll,rotation) {
    const p=devicePoint(...project(point),rotation,width,height);
    const center=devicePoint(width/2,height/2,rotation,width,height);
    return rotate(p[0]-center[0],p[1]-center[1],roll);
  }
  return {camera,scene,resize,project,gravityPoint};
}

test('globe and distant sky points retain their centre, scale and camera pose through every orientation', () => {
  const g=sceneFixture();g.scene.set(0,0,0,780,true);g.scene.apply();
  const points=[new T.Vector3(0,0,0),new T.Vector3(18,-9,22),new T.Vector3(-28,36,70),new T.Vector3(220,140,-1500)];
  const reference=points.map(p=>g.gravityPoint(p,0,0));
  const position=g.camera.position.clone(),quaternion=g.camera.quaternion.clone(),up=g.camera.up.clone();
  for(const rotation of [0,90,180,270,0]) {
    g.resize(rotation%180?780:360,rotation%180?360:780);
    for(const roll of [-rotation,-rotation+24,-rotation-17]) {
      g.scene.set(roll,rotation,0,rotation%180?360:780,true);g.scene.apply();
      points.forEach((point,i)=>{
        const actual=g.gravityPoint(point,roll,rotation);
        close(actual[0],reference[i][0]);close(actual[1],reference[i][1]);
      });
    }
  }
  assert.deepEqual(g.camera.position,position);
  assert.equal(g.camera.quaternion.equals(quaternion),true);
  assert.deepEqual(g.camera.up,up);
});

test('a display quarter turn compensates immediately without a second 90 degree animation', () => {
  for(const direction of [-1,1]) {
    const g=sceneFixture();g.scene.set(0,0,0,780);g.scene.apply();
    g.scene.set(direction*90,0,10,780);g.scene.tick(42.5);g.scene.apply();
    const point=new T.Vector3(18,-9,22),physicalRoll=direction*45;
    const before=g.gravityPoint(point,physicalRoll,0);
    const rotation=direction<0?90:270;
    g.scene.set(direction*90,rotation,42.5,780);g.resize(780,360);g.scene.apply();
    const after=g.gravityPoint(point,physicalRoll,rotation);
    close(after[0],before[0]);close(after[1],before[1]);
    g.scene.tick(75);g.scene.apply();
    close(g.scene.angle,-direction*90-rotation);
    assert.equal(g.scene.moving,false);
  }
});

test('progressive roll eases in both directions, reverses in place and stops updating when settled', () => {
  const g=sceneFixture();g.scene.set(0,0,0,780);g.scene.apply();
  g.scene.set(-90,0,0,780);g.scene.tick(32.5);close(g.scene.angle,45);
  g.scene.set(45,0,32.5,780);close(g.scene.angle,45);
  g.scene.tick(65);close(g.scene.angle,0);
  g.scene.tick(97.5);close(g.scene.angle,-45);g.scene.apply();
  const version=g.camera.userData.meewavProjectionVersion;
  for(const time of [120,150,200,1000]) {
    assert.equal(g.scene.tick(time),false);assert.equal(g.scene.apply(),false);
  }
  assert.equal(g.camera.userData.meewavProjectionVersion,version);
  assert.equal(g.scene.moving,false);
  const crossing=sceneFixture();crossing.scene.set(-179,0,1000,780,true);crossing.scene.apply();
  crossing.scene.set(179,0,1000,780);crossing.scene.tick(1032.5);close(crossing.scene.angle,180);
  crossing.scene.tick(1065);close(crossing.scene.angle,181);
});

test('reduced motion can snap and return to progressive motion without rewinding', () => {
  const g=sceneFixture();g.scene.set(0,0,0,780);g.scene.apply();
  g.scene.set(-90,0,10,780);g.scene.tick(35);assert.ok(g.scene.moving);
  g.scene.set(-90,0,35,780,true);close(g.scene.angle,90);
  g.scene.set(-90,0,40,780,false);close(g.scene.angle,90);
  g.scene.tick(50);close(g.scene.angle,90);assert.equal(g.scene.moving,false);
  g.scene.set(-60,0,50,780);g.scene.tick(82.5);close(g.scene.angle,75);
});

test('rotated projections keep a circular globe and accurate picking at intermediate angles', () => {
  const g=sceneFixture();g.scene.set(0,0,0,780,true);g.scene.apply();
  const front=new T.Vector3(30,40,Math.sqrt(10000-900-1600));
  for(const [width,height] of [[360,780],[780,360]]) {
    g.resize(width,height);
    for(const angle of [-75,-32,0,45,90,135]) {
      g.scene.set(-angle,0,0,height,true);g.scene.apply();
      const center=g.project(new T.Vector3(0,0,100));
      const east=g.project(new T.Vector3(20,0,100)),north=g.project(new T.Vector3(0,20,100));
      close(Math.hypot(east[0]-center[0],east[1]-center[1]),Math.hypot(north[0]-center[0],north[1]-center[1]));
      const pixel=g.project(front),ray=new T.Raycaster();
      ray.setFromCamera(new T.Vector2(pixel[0]/width*2-1,1-pixel[1]/height*2),g.camera);
      const picked=ray.ray.intersectSphere(new T.Sphere(new T.Vector3(),100),new T.Vector3());
      assert.ok(picked);close(picked.distanceTo(front),0);
    }
  }
});

test('the scene reapplies its roll after a camera flight resets the projection, without accumulating rotation', () => {
  const g=sceneFixture();g.scene.set(-60,0,0,780,true);g.scene.apply();
  const expected=g.camera.projectionMatrix.clone();
  const version=g.camera.userData.meewavProjectionVersion;
  g.camera.updateProjectionMatrix();assert.equal(g.scene.apply(),true);
  assert.equal(g.camera.projectionMatrix.equals(expected),true);
  assert.equal(g.camera.userData.meewavProjectionVersion,version+1);
  assert.equal(g.scene.apply(),false);
  g.camera.near=.1;g.scene.apply();
  const restored=g.camera.projectionMatrix.clone().multiply(g.camera.projectionMatrixInverse);
  const identity=new T.Matrix4();
  restored.elements.forEach((value,i)=>close(value,identity.elements[i]));
});


test('a confirmed quarter turn completes in 260ms and repeat reports cannot restart the scene animation', () => {
  const g=sceneFixture(260);
  g.scene.set(null,0,0,780);g.scene.apply();
  const quaternion=g.camera.quaternion.clone(), position=g.camera.position.clone();
  g.scene.set(null,90,10,780);g.resize(780,360);
  close(g.scene.angle,-90);
  for (const time of [75,140,205,270]) {
    g.scene.tick(time);g.scene.apply();
    close(g.scene.angle,-90+90*(time-10)/260);
    g.scene.set(null,90,time,360);
  }
  assert.equal(g.scene.moving,false);
  const version=g.camera.userData.meewavProjectionVersion;
  for (const time of [300,500,1000]) {
    assert.equal(g.scene.tick(time),false);
    assert.equal(g.scene.apply(),false);
    assert.equal(g.scene.set(null,90,time,360),false);
  }
  assert.equal(g.camera.userData.meewavProjectionVersion,version);
  assert.equal(g.camera.quaternion.equals(quaternion),true);assert.deepEqual(g.camera.position,position);
  g.scene.set(null,0,1000,360);g.resize(360,780);
  g.scene.tick(1130);close(g.scene.angle,45);
  g.scene.tick(1260);close(g.scene.angle,0);assert.equal(g.scene.moving,false);
});
