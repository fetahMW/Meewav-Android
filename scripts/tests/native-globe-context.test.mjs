import test from 'node:test';
import assert from 'node:assert/strict';
import { createNativeGlobeContext } from '../../app/src/main/globe-source/native-gles-context.mjs';

function harness() {
  const batches = [], queries = [];
  const bridge = {
    reset() {}, query(kind, id, parameter, name) {
      queries.push({ kind, id, parameter, name });
      if (kind === 11) return '["GL_EXT_color_buffer_float","GL_OES_texture_float_linear"]';
      if (kind === 8) return name === 'missing' ? '-1' : '0';
      if (kind === 10) return '{"rangeMin":127,"rangeMax":127,"precision":23}';
      return '8';
    }, send(encoded, frame) { batches.push({ bytes: Buffer.from(encoded, 'base64'), frame }); return ''; },
    status: () => '{"submitted":1,"presented":1}', layout() {},
  };
  const canvas = { width: 300, height: 150 };
  const gl = createNativeGlobeContext(canvas, bridge);
  const packets = () => batches.flatMap(({ bytes }) => {
    const result = [];
    for (let offset = 0; offset < bytes.length;) {
      const op = bytes.readUInt32LE(offset), size = bytes.readUInt32LE(offset + 4);
      assert.equal(size % 4, 0); assert.ok(offset + 8 + size <= bytes.length);
      result.push({ op, data: bytes.subarray(offset + 8, offset + 8 + size) }); offset += size + 8;
    }
    return result;
  });
  return { gl, canvas, bridge, batches, queries, packets };
}

test('GPU transfer snapshots typed-array slices and preserves binary floats and indices', () => {
  const h = harness(), gl = h.gl;
  const vertices = new Float32Array([99, 0.125, -2.75, 8.5, 99]);
  const selected = vertices.subarray(1, 4), buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, selected, gl.STATIC_DRAW);
  selected.fill(0); gl.flush();
  const upload = h.packets().find(packet => packet.op === 11);
  assert.equal(upload.data.readUInt32LE(8), 12);
  assert.deepEqual([0,1,2].map(i => upload.data.readFloatLE(16 + i * 4)), [0.125,-2.75,8.5]);
});

test('uniform location zero works and absent uniforms never emit commands', () => {
  const h = harness(), gl = h.gl, program = gl.createProgram();
  const location = gl.getUniformLocation(program, 'visible'); assert.equal(location, 0);
  gl.uniform4f(location, 1.1, 2.2, 3.3, 4.4);
  gl.uniform1i(gl.getUniformLocation(program, 'missing'), 5); gl.flush();
  const uniform = h.packets().filter(packet => packet.op === 19);
  assert.equal(uniform.length, 1); assert.equal(uniform[0].data.readInt32LE(0), 0);
  assert.equal(uniform[0].data.readInt32LE(4), 4);
  assert.ok(Math.abs(uniform[0].data.readFloatLE(12) - 1.1) < 1e-6);
});

test('instancing and texture arrays retain counts, offsets, half-float bits and layers', () => {
  const h = harness(), gl = h.gl;
  gl.drawElementsInstanced(gl.TRIANGLES, 12, gl.UNSIGNED_INT, 128, 60);
  const half = new Uint16Array([0x3c00,0x3800,0x4000,0x7bff]);
  gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, gl.RGBA16F, 1, 1, 1, 0, gl.RGBA, gl.HALF_FLOAT, half);
  gl.flush(); const packets = h.packets();
  const draw = packets.find(packet => packet.op === 68);
  assert.equal(draw.data.readInt32LE(12), 128); assert.equal(draw.data.readInt32LE(16), 60);
  const upload = packets.find(packet => packet.op === 27);
  assert.deepEqual(upload.data.subarray(40,48), Buffer.from(half.buffer));
});

test('native capability queries do not create any Chromium WebGL context', () => {
  const h = harness(), gl = h.gl;
  assert.equal(gl.getExtension('EXT_color_buffer_float') !== null, true);
  assert.equal(gl.getExtension('KHR_parallel_shader_compile'), null);
  assert.equal(gl.getExtension('WEBGL_multisampled_render_to_texture'), null);
  assert.equal(gl.getParameter(gl.MAX_TEXTURE_SIZE), 8); assert.equal(gl.getParameter(gl.MAX_TEXTURE_SIZE), 8);
  assert.equal(h.queries.filter(query => query.kind === 1).length, 1);
  h.canvas.width = 801; assert.equal(gl.drawingBufferWidth, 801);
});

test('binary packet boundaries preserve UTF-8 shader text and following commands', () => {
  const h = harness(), gl = h.gl;
  const source = '#version 300 es\n// étoile\nvoid main(){}';
  const shader = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(shader, source); gl.compileShader(shader); gl.flush();
  const packets = h.packets(), text = packets.find(packet => packet.op === 3);
  assert.equal(text.data.subarray(8, 8 + text.data.readUInt32LE(4)).toString('utf8'), source);
  assert.ok(packets.some(packet => packet.op === 4));
});

test('large portrait arrays cross the bridge in bounded batches without losing a pixel or layer', () => {
  const h=harness(),gl=h.gl,width=256,height=256,depth=48;
  const source=new Uint8Array(width*height*depth*4);
  for(let i=0;i<source.length;i++)source[i]=(i*17+(i>>>18))&255;
  gl.texSubImage3D(gl.TEXTURE_2D_ARRAY,0,0,0,0,width,height,depth,gl.RGBA,gl.UNSIGNED_BYTE,source);gl.flush();
  const restored=new Uint8Array(source.length),layerBytes=width*height*4;
  for(const packet of h.packets().filter(packet=>packet.op===28)) {
    const layer=packet.data.readUInt32LE(16),count=packet.data.readUInt32LE(28),bytes=packet.data.readUInt32LE(40);
    assert.equal(bytes,layerBytes*count);restored.set(packet.data.subarray(44,44+bytes),layer*layerBytes);
  }
  assert.deepEqual(restored,source);
  assert.ok(h.batches.every(batch=>batch.bytes.length<=4*1024*1024+64));
});
