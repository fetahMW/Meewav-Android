// Keep real test identities outside Gradle's disposable build output.
import { copyFile, mkdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
export const testAccountsDirectory = resolve(root, '.local/test-accounts');
await mkdir(testAccountsDirectory, { recursive: true });
for (const file of ['provision-state.json', 'testeur1.json', 'testeur2.json', 'testeur3.json', 'Redmi-connexion-privee.txt']) {
  try {
    await copyFile(resolve(root, 'app/build/test-accounts', file), resolve(testAccountsDirectory, file), constants.COPYFILE_EXCL);
  } catch (error) {
    if (!['ENOENT', 'EEXIST'].includes(error.code)) throw error;
  }
}
