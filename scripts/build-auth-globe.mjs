import { createRequire } from 'node:module';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Uses the already-installed Web toolchain read-only; no package install,
// server, Gradle plugin or download is needed to run the Android application.
const androidRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const webRoot = resolve(process.argv[2] || join(androidRoot, '..', 'Meewav-Web'));
const webRequire = createRequire(join(webRoot, 'package.json'));
const assetsRoot = join(androidRoot, 'app/src/main/assets/auth-globe');
const earthMask = `data:image/jpeg;base64,${(await readFile(join(assetsRoot, 'earth_specular.jpg'))).toString('base64')}`;
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
      if (id === '\0meewav:earth-mask') return `export default ${JSON.stringify(earthMask)};`;
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

// A single APK document: no fictitious-host navigation, stylesheet request or
// texture fetch is needed before WebGL can paint. CSP permits only these hashes.
const script = (await readFile(join(assetsRoot, 'globe.js'), 'utf8')).replace(/<\/script/gi, '<\\/script');
const style = await readFile(join(assetsRoot, 'globe.css'), 'utf8');
const hash = (value) => createHash('sha256').update(value).digest('base64');
await writeFile(join(assetsRoot, 'index.html'), `<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'sha256-${hash(script)}'; style-src 'sha256-${hash(style)}'; img-src data:; connect-src 'none'; font-src 'none'; media-src 'none'; frame-src 'none'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
<title>Globe Meewav</title><style>${style}</style>
</head><body><canvas aria-hidden="true"></canvas><script>${script}</script></body></html>
`, 'utf8');
