import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root } from './core.mjs';

const [samsung, redmi, pc = 'electron'] = process.argv.slice(2);
if (!samsung || !redmi || samsung === redmi || !['web', 'electron'].includes(pc)) throw new Error('Usage : node configure-physical.mjs "<serial Samsung>" "<serial Redmi>" [electron|web]');
const directory = resolve(root, '.local/qa-three-users');
await mkdir(directory, { recursive: true });
const config = {
  windowsRepo: '../Meewav-Windows', webRepo: '../Meewav-Web-viewer-parity', webPort: 5281, electronPort: 5282,
  androidDriver: 'adb',
  targets: [
    { platform: 'android', account: 'testeur1', serial: samsung, model: 'SM-S908B' },
    { platform: 'android', account: 'testeur2', serial: redmi, model: '23090RA98G' },
    { platform: pc, account: 'testeur3' },
  ],
};
const file = resolve(directory, `physical-${pc}.json`);
await writeFile(file, JSON.stringify(config, null, 2));
console.log(`Configuration sans identifiants secrets : ${file}`);
