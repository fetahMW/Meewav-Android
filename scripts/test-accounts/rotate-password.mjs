// Rotate one dedicated QA account via its ordinary authenticated user endpoint.
import { randomInt } from 'node:crypto';
import { readFile, writeFile, unlink, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { configuration, identity, api, root } from '../qa-three-users/core.mjs';
import { testAccountsDirectory } from './local-state.mjs';

const alias = process.argv[2];
if (!['testeur1', 'testeur2', 'testeur3'].includes(alias)) throw new Error('Un compte QA explicite est requis.');
const config = await configuration();
const account = config.accounts.find(a => a.alias === alias);
const token = await identity(config, account);
const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
let chars;
do { chars = Array.from({ length: 12 }, () => alphabet[randomInt(alphabet.length)]).join(''); }
while (!/[2-9]/.test(chars) || !/^[A-Z]/.test(chars));
chars = chars[0].toLowerCase() + chars.slice(1);
const password = `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8)}!`;
const pending = resolve(testAccountsDirectory, `password-rotation-${alias}-private.json`);
await writeFile(pending, JSON.stringify({ alias, id: account.id, email: account.email, password }, null, 2), { flag: 'wx' });
// If a response is lost, preserve this private candidate for recovery; never retry blind.
const result = await api(config, '/auth/v1/user', token, { password }, 'PUT');
if (result.id !== account.id) throw new Error('Réponse Auth inattendue. Candidat privé conservé pour vérification.');
await identity(config, { ...account, password });
for (const directory of [testAccountsDirectory, resolve(root, 'app/build/test-accounts')]) {
  if (!await access(directory).then(() => true).catch(() => false)) continue;
  for (const file of ['provision-state.json', 'testeur1.json', 'testeur2.json', 'testeur3.json']) {
    const path = resolve(directory, file);
    let state;
    try { state = JSON.parse(await readFile(path, 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    for (const entry of state.accounts ?? []) if (entry.id === account.id) entry.password = password;
    await writeFile(path, JSON.stringify(state, null, 2));
  }
  if (alias === 'testeur2') await writeFile(resolve(directory, 'Redmi-connexion-privee.txt'),
    `Meewav - Redmi (testeur2)\r\n\r\nDans Application réelle :\r\nE-mail : ${account.email}\r\nMot de passe : ${password}\r\n\r\nMot de passe en trois groupes de quatre caractères, séparés par des tirets, puis !\r\nSeul le tout premier caractère est minuscule.\r\nFichier privé : ne pas partager.\r\n`);
}
await unlink(pending);
console.log(`Mot de passe de ${alias} remplacé, connexion réelle vérifiée, fiches privées mises à jour. Aucun secret affiché.`);
