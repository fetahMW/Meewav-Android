import { createRequire } from 'node:module';
import { dirname, join, resolve, relative, extname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, writeFile, mkdir, readdir, copyFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { featureLoadingHtml } from './feature-loading.mjs';


const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const web = resolve(root, '../Meewav-Web');
const source = join(root, 'app/src/main/profile-source');
const vendor = join(source, 'vendor');
const output = join(root, 'app/src/main/assets/profile');
const importing = process.argv.includes('--import-web');
const syncMediaOnly = process.argv.includes('--sync-media') && !importing && !process.argv.includes('--sync-assets');
const syncAssets = importing || process.argv.includes('--sync-assets') || syncMediaOnly;
const require = createRequire(join(web, 'vendor/globe-vinyle/package.json'));
const { build } = require('esbuild');
const within = (base, path) => { const rel = relative(base, path); return !rel.startsWith('..') && !isAbsolute(rel); };
await mkdir(output, { recursive: true });

const result = await build({
  absWorkingDir: root, entryPoints: [join(source, 'main.tsx')],
  outdir: join(output, 'assets'), publicPath: '/profile/assets', entryNames: 'main', chunkNames: '[name]-[hash]',
  nodePaths: [join(web, 'node_modules'), join(web, 'vendor/globe-vinyle/node_modules')], bundle: true, splitting: true, format: 'esm',
  target: ['chrome110'], jsx: 'automatic', minify: true, metafile: true, legalComments: 'linked',
  define: { 'import.meta.env': JSON.stringify({ DEV: false, BASE_URL: '/', VITE_MESSAGING_DEMO_FALLBACK: false }), 'process.env.NODE_ENV': '"production"' },
  loader: { '.png': 'file', '.svg': 'file', '.jpg': 'file', '.webp': 'file', '.mp3': 'file', '.wav': 'file' },
  plugins: [{ name: 'native-profile-adapters', setup(context) {
    context.onResolve({ filter: /(?:AuthContext|supabaseClient|MeewavPrimaryNav)$/ }, () => ({ path: join(source, 'runtime.ts') }));
    context.onResolve({ filter: /(?:^|\/)auth$/ }, () => ({ path: join(source, 'runtime.ts') }));
    context.onResolve({ filter: /localAuthPreview$/ }, () => ({ path: join(source, 'localPreview.ts') }));
    context.onResolve({ filter: /\/lib\/sessionIdentity$/ }, () => ({ path: join(source, 'runtime.ts') }));
    context.onResolve({ filter: /^\// }, args => ({ path: args.path, external: true }));
    if (importing) context.onResolve({ filter: /^\.\/vendor\/src\// }, args => ({ path: join(web, args.path.slice('./vendor/'.length) + '.tsx') }));
  } }],
});

// Keep the copied Web source intact; Android layout and CTA overrides load last.



// Explicit one-time import freezes only the profile dependency graph. Future
// builds read these copied sources, so Web changes cannot silently replace it.
if (importing) {
  const files = [];
  for (const input of Object.keys(result.metafile.inputs)) {
    const path = resolve(root, input);
    if (!within(join(web, 'src'), path)) continue;
    const target = join(vendor, relative(web, path));
    await mkdir(dirname(target), { recursive: true }); await copyFile(path, target);
    files.push({ path: relative(web, path).replaceAll('\\', '/'), sha256: createHash('sha256').update(await readFile(path)).digest('hex') });
  }
  await writeFile(join(source, 'web-provenance.json'), JSON.stringify({
    source: 'Meewav-Web', commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: web, encoding: 'utf8' }).trim(), files,
  }, null, 2) + '\n');
}

const types = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.gif':'image/gif', '.mp3':'audio/mpeg', '.wav':'audio/wav', '.m4a':'audio/mp4', '.mp4':'video/mp4', '.woff2':'font/woff2', '.ttf':'font/ttf', '.txt':'text/plain' };
const assets = {};
const copyAsset = async (path, name) => {
  const target = join(output, name); await mkdir(dirname(target), { recursive: true }); await copyFile(path, target);
};
if (syncAssets) {
  const publicAssets = new Set(syncMediaOnly ? [] : ['images/profile', 'assets/orbit/founder-puff.png', 'badges', 'ui/images', 'images/preprofile/portraits', 'avatars', 'badges', 'images/grades', 'audio/rooms/wave-test-pack/House_124BPM_A_minor/Loops_8bars',
    // Collab showcase paths are assembled dynamically in profileDemoData.ts.
    'audio/rooms/wave-test-pack/Drill_142BPM_F_minor/Loops_8bars/Drill_FullMix_A_142BPM_8bars.wav',
    'audio/rooms/wave-test-pack/Afro_100BPM_A_minor/Loops_8bars/Afro_FullMix_A_100BPM_8bars.wav',
    'audio/rooms/wave-test-pack/Zouk_92BPM_G_minor/Loops_8bars/Zouk_FullMix_A_92BPM_8bars.wav',
    'audio/rooms/wave-test-pack/Trap_150BPM_C_minor/Loops_8bars/Trap_FullMix_A_150BPM_8bars.wav',
    'meewav-emojis/webp/256', ...[2,3,4,5,6].map(version => `meewav-emojis/v${version}/webp/256`)]);
  // Literal public paths, including emoticon manifest entries and their trees.
  for (const entry of Object.keys(result.metafile.inputs)) {
    const path = resolve(root, entry);
    if ((!within(join(web, 'src'), path) && !within(vendor, path)) || !/\.(tsx?|css|json|jsx?)$/.test(path)) continue;
    const text = await readFile(path, 'utf8');
    for (const match of text.matchAll(/["'`(](\/(?:images|avatars|assets|emoticons|audio|media|fonts)\/[^"'`)\r\n$]+)/g)) {
      if (!syncMediaOnly || match[1].startsWith('/media/')) publicAssets.add(match[1].slice(1));
    }
  }
  async function copyTree(path, name) {
    const info = await stat(path).catch(() => null); if (!info) return;
    if (info.isDirectory()) {
      for (const entry of await readdir(path)) await copyTree(join(path, entry), `${name}/${entry}`);
    } else await copyAsset(path, name);
  }
  for (const name of publicAssets) if (within(join(web, 'public'), resolve(web, 'public', name))) await copyTree(join(web, 'public', name), name);
  if (!syncMediaOnly) await copyAsset(join(root, 'app/src/main/res/font/inter_variable.ttf'), 'fonts/inter.ttf');
  // Keep a byte-level record of the copied public media, without declaring new
  // rights or rewriting any source credits or legal notices.
  const publicFiles = [];
  async function record(folder) {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const path = join(folder, entry.name), name = relative(output, path).replaceAll('\\','/');
      if (entry.isDirectory()) { if (name !== 'assets') await record(path); }
      else if (name.includes('/')) publicFiles.push({ path: name, sha256: createHash('sha256').update(await readFile(path)).digest('hex') });
    }
  }
  await record(output);
  await writeFile(join(source, 'media-provenance.json'), JSON.stringify({ source: 'Meewav-Web/public (Inter: existing Android asset)', files: publicFiles }, null, 2) + '\n');
}

const packages = new Map();
for (const input of Object.keys(result.metafile.inputs)) {
  const path = resolve(root, input).replaceAll('\\', '/'), marker = path.lastIndexOf('/node_modules/');
  if (marker < 0) continue;
  const parts = path.slice(marker + 14).split('/');
  const name = parts[0].startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
  packages.set(name, path.slice(0, marker + 14) + name);
}
let notices = 'Bibliothèques du profil Android, reprises de la chaîne Web.\n';
for (const [name, folder] of [...packages].sort()) {
  const pkg = JSON.parse(await readFile(join(folder, 'package.json'), 'utf8'));
  notices += `\n========== ${name} ${pkg.version} ==========\n`;
  const licenses = (await readdir(folder)).filter(file => /^(LICENSE|LICENCE|COPYING|NOTICE)(\.|$)/i.test(file));
  if (!licenses.length) throw Error(`Missing license: ${name}`);
  for (const file of licenses) if ((await stat(join(folder, file))).isFile()) notices += await readFile(join(folder, file), 'utf8') + '\n';
}
await writeFile(join(output, 'THIRD_PARTY_NOTICES.txt'), notices);
await copyFile(join(source, 'mobile.css'), join(output, 'mobile.css'));
await copyAsset(join(root, 'app/src/main/assets/globe-vinyle/ui/images/earth_specular.jpg'), 'ui/images/earth_specular.jpg');
// CSP is completed by the native interceptor with the configured Supabase
// origin. No service URL, key or session is written into the shipped document.
await writeFile(join(output, 'index.html'), `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="color-scheme" content="dark"><title>Meewav — Profil</title><link rel="icon" href="data:,"><link rel="stylesheet" href="/profile/assets/main.css"><link rel="stylesheet" href="/profile/mobile.css"></head><body><div id="root">${featureLoadingHtml('Ouverture du profil…')}</div><script type="module" src="/profile/assets/main.js"></script></body></html>`);
async function list(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) await list(path);
    else if (entry.name !== 'asset-manifest.json') assets[relative(output, path).replaceAll('\\', '/')] = { mime: types[extname(path)] || 'application/octet-stream', bytes: (await stat(path)).size };
  }
}
await list(output);
await writeFile(join(output, 'asset-manifest.json'), JSON.stringify(assets) + '\n');
await mkdir(join(root, 'app/build/reports/profile'), { recursive: true });
await writeFile(join(root, 'app/build/reports/profile/bundle.json'), JSON.stringify(result.metafile, null, 2));
console.log(`Profile bundle: ${Object.keys(assets).length} local assets, ${packages.size} dependency licenses.`);
