import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let checked = 0, imports = 0;
for (const feature of ['messaging', 'profile', 'scene', 'market', 'rooms', 'tremplin']) {
  const directory = resolve(repository, 'app/src/main/assets', feature);
  const manifest = JSON.parse(await readFile(resolve(directory, 'asset-manifest.json'), 'utf8'));
  for (const [name, metadata] of Object.entries(manifest)) {
    const path = resolve(directory, name), local = relative(directory, path);
    if (local.startsWith('..') || isAbsolute(local)) throw new Error(`Asset outside ${feature}: ${name}`);
    const info = await stat(path);
    if (!info.isFile() || info.size !== metadata.bytes) throw new Error(`Asset size mismatch: ${feature}/${name}`);
    checked++;
  }
  // Follow the actual entry graph; older packaged, unreferenced chunks are not
  // loaded by the app and can refer to older chunk names.
  const reachable = new Set(), pending = ['assets/main.js'];
  while (pending.length) {
    const name = pending.pop();
    if (reachable.has(name)) continue;
    if (!manifest[name]) throw new Error(`Missing entry: ${feature}/${name}`);
    reachable.add(name);
    const path = resolve(directory, name);
    const code = await readFile(path, 'utf8');
    for (const match of code.matchAll(/\b(?:from\s*|import\s*\()\s*["']([^"']+)["']/g)) {
      const target = match[1];
      let destination;
      if (target.startsWith('./') || target.startsWith('../')) destination = resolve(dirname(path), target);
      else if (target.startsWith(`/${feature}/assets/`)) destination = resolve(directory, target.slice(feature.length + 2));
      else continue;
      const imported = relative(directory, destination).replaceAll('\\', '/');
      if (!manifest[imported]) throw new Error(`Missing bundled import: ${feature}/${name} -> ${target}`);
      pending.push(imported);
      imports++;
    }
  }
  console.log(`${feature}: ${Object.keys(manifest).length} packaged assets, ${reachable.size} reachable JS modules checked`);
}
console.log(JSON.stringify({ assets: checked, bundledImports: imports, missing: 0, sizeMismatches: 0 }));
