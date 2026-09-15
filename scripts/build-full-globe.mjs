import { createRequire } from 'node:module';
import { dirname, join, resolve, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, writeFile, mkdir, readdir, copyFile, stat } from 'node:fs/promises';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const web = resolve(process.argv[2] || join(root, '..', 'Meewav-Web'));
const toolchain = join(web, 'vendor/globe-vinyle');
const require = createRequire(join(toolchain, 'package.json'));
const source = join(root, 'app/src/main/globe-source');
const output = join(root, 'app/src/main/assets/globe-vinyle');
for (const [name, version] of [['three', '0.185.1'], ['react', '19.2.6'], ['react-dom', '19.2.6'], ['esbuild', '0.25.12']]) {
  const installed = JSON.parse(await readFile(join(toolchain, 'node_modules', name, 'package.json'), 'utf8'));
  if (installed.version !== version) throw Error(`Expected ${name} ${version}, found ${installed.version}`);
}
const { build } = require('esbuild');
await mkdir(join(output, 'assets'), { recursive: true });

// Preserve the Web rendering quality: original pixel ratio, antialiasing,
// geometry, materials and portrait atlases. Touch/camera adaptations are listed
// in Docs/Globe/Navigation-tactile.md; the source provenance stays historical.
const result = await build({
  absWorkingDir: root,
  entryPoints: {
    main: join(source, 'full-globe.tsx'),
    'border-worker': join(source, 'vendor/globe-vinyle/shared/src/border-worker.mjs'),
    'avatar-population-worker': join(source, 'vendor/globe-vinyle/shared/src/avatar-population-worker.mjs'),
  },
  nodePaths: [join(toolchain, 'node_modules')],
  bundle: true, splitting: true, format: 'esm', jsx: 'automatic',
  outdir: join(output, 'assets'), entryNames: '[name]', chunkNames: '[name]-[hash]',
  target: ['chrome110'], minify: true, metafile: true, legalComments: 'linked',
  loader: { '.png': 'file', '.svg': 'file', '.jpg': 'file', '.gif': 'file' },
  external: ['/globe-vinyle/ui/*'],
  plugins: [{ name: 'android-local-host', setup(context) {
    context.onResolve({ filter: /^\.\/host-bridge$/ }, () => ({ path: join(source, 'full-globe-bridge.ts') }));
    context.onResolve({ filter: /^\.\/reference\/features\/globe\/components\/NavGlobeTexture$/ }, () => ({
      path: join(source, 'full-globe-nav-texture.tsx'),
    }));
    context.onResolve({ filter: /^(\.\.\/)+assets\/ui\// }, args => ({
      path: join(output, 'ui', args.path.split('assets/ui/')[1]),
    }));
  } }],
});
await copyFile(join(source, 'vendor/globe-vinyle/shared/src/style.css'), join(output, 'style.css'));
await copyFile(join(source, 'full-globe-mobile.css'), join(output, 'mobile.css'));
await writeFile(join(output, 'index.html'), `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:; media-src 'self' blob:; font-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'">
<meta name="color-scheme" content="dark"><title>Meewav — Globe</title><link rel="icon" href="data:,">
<link rel="stylesheet" href="./style.css"><link rel="stylesheet" href="./assets/main.css"><link rel="stylesheet" href="./mobile.css"></head>
<body><div id="root"></div><script type="module" src="./assets/main.js"></script></body></html>\n`);

// Preserve the complete license text for every third-party package in the bundle.
const packages = new Map();
for (const input of Object.keys(result.metafile.inputs)) {
  const absolute = resolve(root, input);
  const marker = absolute.lastIndexOf(`${process.platform === 'win32' ? '\\' : '/'}node_modules${process.platform === 'win32' ? '\\' : '/'}`);
  if (marker < 0) continue;
  const segments = absolute.slice(marker + 14).split(/[\\/]/);
  const name = segments[0].startsWith('@') ? segments.slice(0, 2).join('/') : segments[0];
  const folder = join(absolute.slice(0, marker), 'node_modules', name);
  packages.set(name, folder);
}
let notices = 'Bibliothèques embarquées dans le globe Android (sources et versions du Web).\n';
for (const [name, folder] of [...packages].sort(([a], [b]) => a.localeCompare(b))) {
  const info = JSON.parse(await readFile(join(folder, 'package.json'), 'utf8'));
  const files = (await readdir(folder)).filter(file => /^(LICENSE|LICENCE|COPYING|NOTICE)(\.|$)/i.test(file));
  if (!files.length) throw Error(`License file missing: ${name}`);
  notices += `\n========== ${name} ${info.version} ==========\n`;
  for (const file of files) if ((await stat(join(folder, file))).isFile()) notices += '\n' + await readFile(join(folder, file), 'utf8') + '\n';
}
await writeFile(join(output, 'THIRD_PARTY_NOTICES.txt'), notices);
const types = { '.html':'text/html', '.css':'text/css', '.js':'application/javascript', '.json':'application/json',
  '.geojson':'application/json', '.svg':'image/svg+xml', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png',
  '.webp':'image/webp', '.gif':'image/gif', '.glb':'model/gltf-binary', '.wasm':'application/wasm', '.mp4':'video/mp4',
  '.mp3':'audio/mpeg', '.txt':'text/plain', '.md':'text/plain' };
const assets = {};
async function list(folder) {
  for (const entry of (await readdir(folder, { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name))) {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) await list(path);
    else if (entry.name !== 'asset-manifest.json') assets[relative(output, path).replaceAll('\\','/')] = {
      mime: types[extname(path)] || 'application/octet-stream', bytes: (await stat(path)).size,
    };
  }
}
await list(output);
await writeFile(join(output, 'asset-manifest.json'), JSON.stringify(assets) + '\n');
await mkdir(join(root, 'app/build/reports/globe-check'), { recursive: true });
await writeFile(join(root, 'app/build/reports/globe-check/full-globe-build.json'), JSON.stringify(result.metafile, null, 2));
console.log(`Full Web globe: ${Object.keys(assets).length} local assets, ${packages.size} dependency licenses.`);
