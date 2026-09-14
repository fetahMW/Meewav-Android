import { createRequire } from 'node:module';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';

// Uses the already-installed Web toolchain read-only; no package install,
// server, Gradle plugin or download is needed to run the Android application.
const androidRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const webRoot = resolve(process.argv[2] || join(androidRoot, '..', 'Meewav-Web'));
const webRequire = createRequire(join(webRoot, 'package.json'));
const assetsRoot = join(androidRoot, 'app/src/main/assets/auth-globe');
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
    resolveId(id) {
      if (id === 'three') return threeModule;
      if (id === 'meewav:earth-mask') return '\0meewav:earth-mask';
    },
    load(id) {
      if (id === '\0meewav:earth-mask') return 'export default "./earth_specular.jpg";';
    },
  }],
  output: {
    file: join(androidRoot, 'app/src/main/assets/auth-globe/globe.js'),
    format: 'iife',
    minify: true,
    sourcemap: false,
    banner: '/*! Three.js 0.184.0 — MIT; see THREE-LICENSE.txt. Meewav local auth globe. */',
  },
});

// All four resources are served directly from the APK by the Android client.
// No data: document or image can be rejected by its strict resource allowlist.
await writeFile(join(assetsRoot, 'index.html'), `<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'none'; font-src 'none'; media-src 'none'; frame-src 'none'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
<title>Globe Meewav</title><link rel="stylesheet" href="./globe.css">
</head><body><canvas aria-hidden="true"></canvas><script src="./globe.js" defer></script></body></html>
`, 'utf8');
