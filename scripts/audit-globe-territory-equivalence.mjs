import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = resolve(root, 'app/src/main/globe-source/vendor/globe-vinyle/shared/src');
const toolchain = resolve(root, '../Meewav-Web/vendor/globe-vinyle');
const require = createRequire(resolve(toolchain, 'package.json'));
const baseline = execFileSync('git', ['show', 'bc3ad3c:app/src/main/globe-source/vendor/globe-vinyle/shared/src/territory-geometry.mjs'], { cwd: root, encoding: 'utf8' });
const output = resolve(root, 'app/build/tests/territory-equivalence.mjs');
await mkdir(dirname(output), { recursive: true });
const program = `
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { prepareTerritories as before } from 'baseline:territory';
import { prepareTerritories as after } from './territory-geometry.mjs';
const root = ${JSON.stringify(root)};
const cases = [['regions.geojson','region'],['communes.geojson','commune'],['sectors.geojson','quartier'],
 ['quarters/18033.geojson','quartier'],['quarters/01202.geojson','quartier'],['quarters/17385.geojson','quartier']];
const results = [];
for (const [file, kind] of cases) {
 const source = readFileSync(root+'/app/src/main/assets/globe-vinyle/data/'+file);
 const features = JSON.parse(source).features;
 const start = performance.now(), old = before(features,kind), middle=performance.now(), next=after(features,kind), end=performance.now();
 let oldBytes=0,newBytes=0, triangles=0,vertices=0,unique=0;
 const hash = createHash('sha256');
 assert.equal(next.length,old.length);
 for (let i=0;i<old.length;i++) {
  assert.deepEqual(next[i].features,old[i].features); assert.deepEqual(next[i].origin,old[i].origin);
  const a=old[i].top, b=next[i].top, count=a.position.length/3;
  assert.equal(b.index?.length || b.position.length/3,count); triangles+=count/3;vertices+=count;unique+=b.position.length/3;
  for (const [name,array] of Object.entries(a)) {
   const size=array.length/count, words=new Uint32Array(array.buffer), current=new Uint32Array(b[name].buffer);
   for(let v=0;v<count;v++) for(let c=0;c<size;c++) assert.equal(current[(b.index?.[v]??v)*size+c],words[v*size+c],file+' '+i+' '+name);
   hash.update(new Uint8Array(array.buffer)); oldBytes+=array.byteLength;
  }
  for(const array of Object.values(b)) newBytes+=array.byteLength;
  assert.deepEqual(next[i].edge,old[i].edge);
 }
 results.push({file,kind,features:features.length,sourceSha256:createHash('sha256').update(source).digest('hex'),expandedAttributesSha256:hash.digest('hex'),triangles,oldVertices:vertices,indexedVertices:unique,oldAttributeBytes:oldBytes,indexedAttributeAndIndexBytes:newBytes,savedBytes:oldBytes-newBytes,preparationMs:{baseline:+(middle-start).toFixed(2),indexed:+(end-middle).toFixed(2)},allAttributeBitsAndEdgesIdentical:true});
}
const report={baselineCommit:'bc3ad3c554a2c55937ec2f4d5bc12691747e68a3',method:'Every top attribute Float32 bit re-expanded in original triangle order; exact edges, origins and feature metadata. Includes holes and multipart features. Times are one Node/PC run, not mobile benchmark.',results};
writeFileSync(root+'/.local/globe-gpu-audit-20261001/territory-equivalence.json',JSON.stringify(report,null,2)+'\\n');
process.stdout.write(JSON.stringify(report,null,2)+'\\n');
`;
await mkdir(resolve(root,'.local/globe-gpu-audit-20261001'),{recursive:true});
await require('esbuild').build({ stdin: { contents: program, resolveDir: sourceDir, sourcefile:'equivalence.mjs' }, outfile: output,
 bundle:true,platform:'node',format:'esm',nodePaths:[resolve(toolchain,'node_modules')],plugins:[{name:'baseline',setup(build){
 build.onResolve({filter:/^baseline:/},()=>({path:'territory',namespace:'baseline'}));
 build.onLoad({filter:/.*/,namespace:'baseline'},()=>({contents:baseline,resolveDir:sourceDir,loader:'js'}));
 }}] });
execFileSync(process.execPath,[output],{stdio:'inherit'});
