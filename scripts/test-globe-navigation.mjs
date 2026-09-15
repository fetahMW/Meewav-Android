import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const toolchain=resolve(root,'../Meewav-Web/vendor/globe-vinyle');
const require=createRequire(resolve(toolchain,'package.json'));
const output=resolve(root,'app/build/tests/touch-navigation.test.mjs');
await mkdir(dirname(output),{recursive:true});
await require('esbuild').build({entryPoints:[resolve(root,'scripts/tests/touch-navigation.test.mjs')],
  outfile:output,bundle:true,platform:'node',format:'esm',nodePaths:[resolve(toolchain,'node_modules')]});
execFileSync(process.execPath,['--test',output],{stdio:'inherit'});
