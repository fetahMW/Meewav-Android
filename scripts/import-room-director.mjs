// Explicit, scoped import. Never overwrites the Android Rooms/Wave workspace.
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { resolve, dirname, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const web = resolve(root, '../Meewav-Web');
const dest = join(root, 'app/src/main/rooms-source/director-web');
const require = createRequire(join(web, 'vendor/globe-vinyle/package.json'));
const { build } = require('esbuild');
const entries = ['src/features/rooms/place/PlaceStage.tsx', 'src/features/rooms/place/place.fixtures.ts',
  'src/features/rooms/place/RoomSupportPanel.tsx', 'src/features/rooms/place/useRoomSupportThrows.ts',
  'src/features/rooms/place/place-room.css', 'src/features/rooms/place/place-room-premium.css',
  'src/features/rooms/place/place-room-shell.css'];
const result = await build({ absWorkingDir: web, entryPoints: entries, outdir: join(root, 'app/build/room-import'),
  bundle: true, write: false, metafile: true, packages: 'external', jsx: 'automatic', format: 'esm',
  loader: { '.png': 'file', '.webp': 'file', '.svg': 'file', '.jpg': 'file' },
  plugins: [{ name: 'native-boundaries', setup(b) {
    b.onResolve({ filter: /(?:AuthContext|supabaseClient|localAuthPreview)$/ }, a => ({ path: a.path, external: true }));
    b.onResolve({ filter: /^\// }, a => ({ path: a.path, external: true }));
  } }],
});
const paths = new Set(Object.keys(result.metafile.inputs));
// Type contracts also retained for editor/typechecker consumers.
['src/features/rooms/place/place.types.ts', 'src/features/rooms/place/placeLiveKit.service.ts'].forEach(p => paths.add(p));
const files = [];
for (const name of paths) {
  const from = resolve(web, name), rel = relative(web, from);
  if (rel.startsWith('..') || rel.includes('node_modules')) continue;
  const to = join(dest, rel); await mkdir(dirname(to), { recursive: true }); await copyFile(from, to);
  files.push({ path: rel.replaceAll('\\', '/'), sha256: createHash('sha256').update(await readFile(from)).digest('hex') });
}
await writeFile(join(dest, 'provenance.json'), JSON.stringify({ source: 'Meewav-Web',
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: web, encoding: 'utf8' }).trim(), files }, null, 2) + '\n');
console.log(`Room director: ${files.length} source files imported.`);

