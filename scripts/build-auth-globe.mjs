import { createRequire } from 'node:module';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';

// Uses the already-installed Web toolchain read-only; no package install,
// server, Gradle plugin or download is needed to run the Android application.
const androidRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const webRoot = resolve(process.argv[2] || join(androidRoot, '..', 'Meewav-Web'));
const webRequire = createRequire(join(webRoot, 'package.json'));
const { build } = await import(pathToFileURL(webRequire.resolve('rolldown')).href);
const threeModule = join(webRoot, 'node_modules/three/build/three.module.js');
const threePackage = JSON.parse(await readFile(join(webRoot, 'node_modules/three/package.json'), 'utf8'));
if (threePackage.version !== '0.184.0') {
  throw new Error('This globe source uses Three 0.184.0. Review the Web source before changing its bundled renderer.');
}
await build({
  input: join(androidRoot, 'app/src/main/globe-source/auth-globe.mjs'),
  plugins: [{
    name: 'local-three',
    resolveId(id) { if (id === 'three') return threeModule; },
  }],
  output: {
    file: join(androidRoot, 'app/src/main/assets/auth-globe/globe.js'),
    format: 'iife',
    minify: true,
    sourcemap: false,
    banner: '/*! Three.js 0.184.0 — MIT; see THREE-LICENSE.txt. Meewav local auth globe. */',
  },
});
