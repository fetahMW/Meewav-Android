import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {unlink} from 'node:fs/promises';
const require=createRequire(resolve('../Meewav-Web/vendor/globe-vinyle/package.json'));
const output=join(tmpdir(),`meewav-cage-film-${process.pid}.mjs`);
try {await require('esbuild').build({entryPoints:['scripts/rooms-cage-film-engine-check.ts'],bundle:true,platform:'node',format:'esm',outfile:output});await import(pathToFileURL(output).href);}finally{await unlink(output).catch(()=>{});}
