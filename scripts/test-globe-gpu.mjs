import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const toolchain = resolve(root, '../Meewav-Web/vendor/globe-vinyle');
const require = createRequire(resolve(toolchain, 'package.json'));
const output = resolve(root, 'app/build/tests');
await mkdir(output, { recursive: true });
await require('esbuild').build({ entryPoints: ['globe-gpu.test.mjs','globe-gpu-deep.test.mjs'].map(name=>resolve(root,'scripts/tests',name)),
  outdir: output, outExtension: { '.js': '.mjs' }, bundle: true, platform: 'node', format: 'esm', nodePaths: [resolve(toolchain, 'node_modules')] });
execFileSync(process.execPath, ['--test', resolve(output,'globe-gpu.test.mjs'),resolve(output,'globe-gpu-deep.test.mjs')], { stdio: 'inherit' });
