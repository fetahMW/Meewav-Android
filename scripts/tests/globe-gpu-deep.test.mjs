import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { indexTriangleAttributes } from '../../app/src/main/globe-source/vendor/globe-vinyle/shared/src/indexed-territory-attributes.mjs';
import { prepareTerritories } from '../../app/src/main/globe-source/vendor/globe-vinyle/shared/src/territory-geometry.mjs';
import { createTerritoryPlates } from '../../app/src/main/globe-source/vendor/globe-vinyle/shared/src/territory-plates.mjs';
import { vinylRecordLayout, createVinylRecordGeometry } from '../../app/src/main/globe-source/vendor/globe-vinyle/shared/src/vinyl-record-geometry.mjs';
import { createVinylRecordMaterial } from '../../app/src/main/globe-source/vendor/globe-vinyle/shared/src/vinyl-record-material.mjs';
import { createPortraitTextureArray } from '../../app/src/main/globe-source/vendor/globe-vinyle/shared/src/portrait-texture-array.mjs';
import { createGroundAvatarSprites } from '../../app/src/main/globe-source/vendor/globe-vinyle/shared/src/ground-avatar-sprites.mjs';
import { createRenderAudit, bufferTransferBytes } from '../../app/src/main/globe-source/vendor/globe-vinyle/shared/src/render-audit.mjs';

test('territory indexing preserves all Float32 bits and never joins territory, colour or lift seams', () => {
  const positions = [0,0,0, 1,0,0, 1,1,0, 0,0,0, 1,1,0, 0,1,0];
  const attributes = { position: new Float32Array([...positions, ...positions]),
    surfaceNormal: new Float32Array(36).fill(.25), lift: new Float32Array([...Array(6).fill(0), ...Array(6).fill(1)]),
    territoryId: new Float32Array([...Array(6).fill(0), ...Array(6).fill(1)]),
    color: new Float32Array([...Array(18).fill(.5), ...Array(18).fill(.75)]), nearColor: new Float32Array(36).fill(.9) };
  const indexed = indexTriangleAttributes(attributes);
  assert.equal(indexed.index.length, 12);
  assert.equal(indexed.position.length / 3, 8);
  for (const [name, original] of Object.entries(attributes)) {
    const size = original.length / 12, before = new Uint32Array(original.buffer), after = new Uint32Array(indexed[name].buffer);
    for (let vertex = 0; vertex < 12; vertex++) for (let component = 0; component < size; component++) {
      assert.equal(after[indexed.index[vertex] * size + component], before[vertex * size + component]);
    }
  }
  const signed = { position: new Float32Array([...positions, ...positions.map(value => value === 0 ? -0 : value)]) };
  const result = indexTriangleAttributes(signed);
  assert.notEqual(result.index[0], result.index[6]);
  assert.equal(indexTriangleAttributes({ position: new Float32Array([0,0,0, 1,0,0, 0,1,0]) }).index, undefined);
});

test('indexed real territory packets retain triangle count, feature IDs, selection and per-feature focus updates', () => {
  const ring = [[2.3,48.8],[2.3001,48.8],[2.3001,48.8001],[2.3,48.8001],[2.3,48.8]];
  const features = [0, 1].map(id => ({ type:'Feature', id:`fr-commune-${id}`, properties:{ kind:'commune', center:[2.3,48.8], code:String(id) },
    geometry:{ type:'Polygon', coordinates:[ring] } }));
  const packets = prepareTerritories(features, 'commune', { outlines:false });
  assert.ok(packets[0].top.index);
  assert.equal(packets[0].top.index.length, 12);
  assert.equal(packets[0].top.position.length / 3, 8);
  const scene = new T.Scene(), focus = { revision:0, previousProgress:1, progress:1, brightness:feature => feature.id.endsWith('0') ? 1 : .2 };
  const plates = createTerritoryPlates(scene, packets, features, undefined, focus);
  plates.setSelected('fr-commune-1'); plates.update({ height:.1 });
  const mesh = plates.objects()[0], geometry = mesh.geometry;
  assert.equal(geometry.index.count, 12);
  assert.equal(geometry.attributes.focusTo.count, 8);
  for (let i = 0; i < 8; i++) assert.ok(Math.abs(geometry.attributes.focusTo.getX(i) - (geometry.attributes.territoryId.getX(i) === 0 ? 1 : .2)) < 1e-7);
  focus.revision++; focus.brightness = () => .8; plates.update({ height:.1 });
  for (let i = 0; i < 8; i++) assert.ok(Math.abs(geometry.attributes.focusTo.getX(i) - .8) < 1e-7);
  assert.equal(geometry.attributes.index, undefined);
  plates.dispose();
});

test('mobile geometry retains exactly the high-quality optical engraving and tooling profiles', () => {
  const high = createVinylRecordMaterial(vinylRecordLayout('high'));
  const mobile = createVinylRecordMaterial(vinylRecordLayout('mobile'));
  for (const name of ['uEngraving','uBody','uSpecular','uTooling','uSurface']) {
    const a = high.uniforms[name].value.image, b = mobile.uniforms[name].value.image;
    assert.equal(b.width, a.width); assert.equal(b.height, a.height); assert.deepEqual(b.data, a.data);
  }
  assert.equal(mobile.uniforms.uEngraving.value.image.width, 8192);
  assert.ok(mobile.fragmentShader.includes('if (uExplorationVisibility > 0.0)'));
  const geometry = createVinylRecordGeometry(vinylRecordLayout('mobile'));
  const bytes = Object.values(geometry.attributes).reduce((sum, attr) => sum + attr.array.byteLength, geometry.index.array.byteLength);
  assert.equal(bytes, 828576); assert.equal(geometry.index.count / 3, 36864);
  high.dispose(); mobile.dispose(); geometry.dispose();
});

test('portrait array retains full crop pixels, orientation data, every identity and failure background without empty cells', () => {
  let creations = 0, source;
  const canvas = { width:0, height:0, getContext:()=>({ fillRect(){}, drawImage(image,...crop){ source=image; assert.deepEqual(crop,[1,0,2,2,0,0,2,2]); },
    getImageData:()=>({ data:source.pixels }) }) };
  const page = { createElement(){ creations++; return canvas; } };
  const atlas = createPortraitTextureArray(3,2,page);
  assert.equal(creations,0); assert.equal(atlas.texture.image.data.byteLength,12);
  const pixels = new Uint8ClampedArray([255,0,0,255, 0,255,0,255, 0,0,255,255, 255,255,0,255]);
  atlas.setPortrait(0,{naturalWidth:4,naturalHeight:2,pixels});
  atlas.setFallback(1); atlas.setPortrait(2,{naturalWidth:4,naturalHeight:2,pixels});
  const placeholder = atlas.texture;
  let freed = false; placeholder.addEventListener('dispose',()=>{freed=true;});
  const texture = atlas.commit(); assert.equal(freed,true);
  assert.equal(texture.isDataArrayTexture,true); assert.equal(texture.image.depth,3);
  assert.equal(texture.image.width,2); assert.equal(texture.image.height,2); assert.equal(texture.image.data.byteLength,48);
  assert.deepEqual(texture.image.data.slice(0,16),new Uint8Array(pixels));
  assert.deepEqual(texture.image.data.slice(32),new Uint8Array(pixels));
  for (let offset=16;offset<32;offset+=4) assert.deepEqual([...texture.image.data.slice(offset,offset+4)],[117,107,157,255]);
  assert.equal(texture.colorSpace,T.SRGBColorSpace); assert.equal(texture.generateMipmaps,true);
  assert.equal(canvas.width,1); atlas.dispose(); assert.equal(texture.image.data,null);
});

test('shared avatar batch keeps clip-space depth and final transparent order without a second render invocation', () => {
  const scene = new T.Scene(), batch = createGroundAvatarSprites(scene);
  assert.equal(scene.children.length,1);
  const mesh = scene.children[0]; assert.equal(mesh.renderOrder,101);
  assert.equal(mesh.material.depthTest,true); assert.equal(mesh.material.depthWrite,false);
  assert.ok(mesh.material.vertexShader.includes('avatarDepth, 1.0'));
  mesh.visible=true;
  batch.render({ render(){assert.fail('shared batch must use the main invocation');} });
  batch.dispose(); assert.equal(scene.children.length,0);
});

test('fully transparent avatar quads are omitted while selected ground pins and all visible portraits remain', () => {
  const previous=globalThis.document;
  globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({clearRect(){},drawImage(){},getImageData:()=>({data:new Uint8ClampedArray(256*256*4)})})})};
  const scene=new T.Scene(), batch=createGroundAvatarSprites(scene);
  try {
    batch.setImages(new Map([['one',{}]]));batch.begin(800,600,3);
    const item={x:100,y:100,size:50,depth:.1,avatar:{icon:'one',pinColor:'#aa66dd'}};
    batch.add(item,50,0,1,0);batch.add(item,50,0,1,5);batch.add(item,50,1,1,0);batch.finish();
    const geometry=scene.children[0].geometry;
    assert.equal(geometry.instanceCount,2);
    assert.equal(geometry.attributes.avatarRect.getW(0),0);
    assert.equal(geometry.attributes.avatarPin.getW(0),5);
    assert.equal(geometry.attributes.avatarRect.getW(1),1);
    assert.equal(geometry.attributes.iconLayer.getX(0),geometry.attributes.iconLayer.getX(1));
  } finally {batch.dispose();globalThis.document=previous;}
});

test('render diagnostics are inert by default, include autospin/ring, count upload slices exactly and restore GL methods', () => {
  let time=100; const calls=[];
  const gl = { drawingBufferWidth:100,drawingBufferHeight:200,getExtension:()=>null,
    bufferData(...args){calls.push(args);}, bufferSubData(){},texImage2D(){},generateMipmap(){} };
  const original = gl.bufferData, renderer={ getPixelRatio:()=>2,info:{render:{calls:4,triangles:200},memory:{textures:3,geometries:4}} };
  const audit=createRenderAudit(gl,renderer,()=>time);
  assert.equal(gl.bufferData,original); assert.equal(audit.begin('ring',time),null);
  assert.equal(bufferTransferBytes(new Float32Array(8),2,3),12);
  audit.start(); gl.bufferData(1,new Float32Array(8),1,2,3); gl.bufferSubData(1,0,new Uint16Array(4),1,2);
  for (const activity of ['overview-spin','ring','camera']) { const token=audit.begin(activity,time); time+=10; audit.end(token); }
  const report=audit.stop(); assert.equal(report.submissions,3); assert.equal(report.uploads.bufferBytes,16);
  assert.equal(report.states['overview-spin'].submissions,1); assert.equal(report.states.ring.submissions,1);
  assert.equal(report.gpuTimerAvailable,false); assert.equal(report.states.ring.gpuMs.p95,null);
  assert.equal(gl.bufferData,original); assert.equal(audit.enabled,false); assert.equal(calls.length,1);
});

test('GPU diagnostic queries report actual nanoseconds, discard disjoint results and free outstanding queries', () => {
  let time=0, disjoint=false, serial=0;
  const deleted=[], timer={TIME_ELAPSED_EXT:1,GPU_DISJOINT_EXT:2};
  const gl={drawingBufferWidth:1,drawingBufferHeight:1,QUERY_RESULT_AVAILABLE:3,QUERY_RESULT:4,
    getExtension:()=>timer,getParameter:()=>disjoint,createQuery:()=>({id:++serial,ready:false}),
    beginQuery(_target,query){query.ready=true;},endQuery(){},
    getQueryParameter(query,parameter){return parameter===3 ? query.ready : 2500000;},deleteQuery(query){deleted.push(query.id);} };
  const renderer={getPixelRatio:()=>1,info:{render:{calls:1,triangles:2},memory:{textures:1,geometries:1}}};
  const audit=createRenderAudit(gl,renderer,()=>time);
  audit.start(); let token=audit.begin('overview-spin',time);time+=3;audit.end(token);
  assert.equal(audit.report().states['overview-spin'].gpuMs.p95,2.5);
  token=audit.begin('ring',time);time+=3;audit.end(token);disjoint=true;
  assert.equal(audit.report().states.ring.gpuMs.samples,0);
  disjoint=false;token=audit.begin('camera',time);time+=3;token.query.ready=false;audit.end(token);
  const result=audit.stop();assert.equal(result.pendingGpuSamples,1);
  assert.deepEqual(deleted,[1,2,3]);assert.equal(audit.enabled,false);
  assert.equal(audit.begin('ring',time),null);
});
