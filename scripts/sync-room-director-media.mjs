import { readFile, writeFile, mkdir, copyFile, stat, readdir } from 'node:fs/promises';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const web = resolve(root, '../Meewav-Web/public');
const source = join(root, 'app/src/main/rooms-source');
const output = join(root, 'app/src/main/assets/rooms');
const paths = new Set();
async function scan(folder) {
  for (const item of await readdir(folder, { withFileTypes: true })) {
    const file = join(folder, item.name);
    if (item.isDirectory()) await scan(file);
    else if (/\.(tsx?|css)$/.test(item.name)) {
      const text = await readFile(file, 'utf8');
      for (const m of text.matchAll(/["'`(](\/(?:images|media|badges|audio)\/[^"'`)\r\n$]+)/g)) paths.add(m[1].slice(1));
    }
  }
}
await scan(join(source, 'director-web'));
const records = [];
for (const name of paths) {
  const from = resolve(web, name);
  if (relative(web, from).startsWith('..') || !(await stat(from).catch(() => null))?.isFile()) continue;
  const dest = join(output, name);
  await mkdir(dirname(dest), { recursive: true }); await copyFile(from, dest);
  records.push({ path: name, sha256: createHash('sha256').update(await readFile(from)).digest('hex') });
}
// Explicit source used by the per-participant Short selector; no transcoding.
for (const name of ['media/shorts-demo/portrait-vocal-session.mp4', 'media/shorts-demo/landscape-guitar.mp4']) {
  const from = join(web, name), dest = join(output, name);
  await mkdir(dirname(dest), { recursive: true }); await copyFile(from, dest);
}
await writeFile(join(source, 'director-media-provenance.json'), JSON.stringify({ source: 'Meewav-Web/public', files: records }, null, 2) + '\n');
console.log(`Director media: ${records.length} original files copied.`);
