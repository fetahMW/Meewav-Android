// Run only after provisioning. No app reset, logout, installation or launch.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, isAbsolute } from 'node:path';
import { spawnSync } from 'node:child_process';
import { testAccountsDirectory } from './local-state.mjs';

const [target, destination] = process.argv.slice(2);
if (!['redmi', 'windows', 's22'].includes(target) || !destination) throw new Error('Usage: node install-local.mjs windows <Electron-userData> | redmi|s22 <ADB-serial>');
const alias = { s22: 'testeur1', redmi: 'testeur2', windows: 'testeur3' }[target];
const file = resolve(testAccountsDirectory, `${alias}.json`);
const content = await readFile(file, 'utf8');
const config = JSON.parse(content);
if (config.enabled !== true || !Array.isArray(config.accounts) || !config.accounts.some(a => a.alias === alias && a.id)
  || config.accounts.some(a => !a.id || !['testeur1', 'testeur2', 'testeur3'].includes(a.alias))) throw new Error('Compte non provisionné.');
if (target === 'windows') {
  if (!isAbsolute(destination)) throw new Error('Le dossier Electron userData doit être absolu.');
  await mkdir(destination, { recursive: true });
  await writeFile(resolve(destination, 'qa-test-accounts.json'), content, { mode: 0o600 });
} else {
  const adb = resolve(process.env.LOCALAPPDATA, 'Android/Sdk/platform-tools/adb.exe');
  const result = spawnSync(adb, ['-s', destination, 'shell', '-T', 'run-as', 'com.meewav.android.debug', 'sh', '-c',
    "'umask 077; mkdir -p files; cat > files/qa-test-accounts.json'"], { input: content, encoding: 'utf8', windowsHide: true });
  if (result.error || result.status !== 0) throw new Error('Écriture privée refusée : vérifie ADB et la version debug installée.');
}
console.log(`Raccourci ${target} installé localement. Il sera lu au prochain lancement de la version compatible.`);
