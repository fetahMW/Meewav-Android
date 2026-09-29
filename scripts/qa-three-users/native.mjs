// Uses the existing ADB UI hierarchy driver pattern. No second mobile framework
// or instrumented application; every credential goes through the normal form.
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { sleep } from './core.mjs';

const pkg = 'com.meewav.android.debug';
const adb = resolve(process.env.LOCALAPPDATA, 'Android/Sdk/platform-tools/adb.exe');
const decode = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&apos;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');

async function input(target, command) {
  const output = (await target.device.shell(command)).toString();
  if (/SecurityException|INJECT_EVENTS|Permission Denial|Permission denied/i.test(output)) {
    throw new Error('Android refuse les actions de test (INJECT_EVENTS). Connexion manuelle requise sur cet appareil.');
  }
}

async function hierarchy(target) {
  await target.device.shell('uiautomator dump /data/local/tmp/meewav-qa-window.xml');
  const xml = (await target.device.shell('cat /data/local/tmp/meewav-qa-window.xml')).toString();
  return [...xml.matchAll(/<node\b([^>]+)>/g)].map(match => {
    const attrs = Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], decode(m[2])]));
    const bounds = attrs.bounds?.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/)?.slice(1).map(Number);
    return { ...attrs, bounds };
  }).filter(node => node.package === pkg && node.bounds);
}

async function find(target, predicate, timeout = 15000) {
  const deadline = Date.now() + timeout;
  do {
    const node = (await hierarchy(target)).find(predicate);
    if (node) return node;
    await sleep(300);
  } while (Date.now() < deadline);
  throw new Error('Contrôle Android attendu absent. Vérifier téléphone déverrouillé et application réelle au premier plan.');
}

async function tapNode(target, node) {
  const [left, top, right, bottom] = node.bounds;
  await input(target, `input tap ${Math.round((left + right) / 2)} ${Math.round((top + bottom) / 2)}`);
}

const exact = text => node => node.text === text || node['content-desc'] === text;
async function tap(target, text) { await tapNode(target, await find(target, exact(text))); }

async function typeSecret(target, text) {
  // Password and e-mail never enter a host command-line argument or diagnostic.
  // This limited QA alphabet also prevents Android `input text` %-substitution.
  if (!/^[A-Za-z0-9_@.!+-]+$/.test(text)) throw new Error('Alphabet des identifiants QA non pris en charge par ADB.');
  await new Promise((resolveResult, reject) => {
    const child = spawn(adb, ['-s', target.serial, 'shell', '-T', 'sh'], { windowsHide: true, stdio: ['pipe', 'ignore', 'ignore'] });
    child.on('error', () => reject(new Error('Saisie ADB indisponible.')));
    child.on('exit', code => code === 0 ? resolveResult() : reject(new Error('Saisie ADB refusée.')));
    child.stdin.on('error', () => reject(new Error('Saisie ADB interrompue.')));
    child.stdin.end(`input text '${text}'\nexit\n`);
  });
}

export async function nativeFlow(target, flow) {
  if (flow === 'login') {
    await target.device.shell(`am force-stop ${pkg}`);
    await target.device.shell(`am start -n ${pkg}/com.meewav.android.app.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER`);
    const entry = await find(target, node => exact('Application réelle')(node) || exact('E-mail ou nom d’utilisateur')(node), 30000);
    if (exact('Application réelle')(entry)) await tapNode(target, entry);
    await tap(target, 'E-mail ou nom d’utilisateur');
    await typeSecret(target, target.account.email);
    await tap(target, 'Mot de passe');
    await typeSecret(target, target.account.password);
    await input(target, 'input keyevent 4'); // Hide the keyboard after the password field.
    await tap(target, 'Se connecter');
    await find(target, exact('Globe Meewav. Glisse pour tourner et pince pour zoomer.'), 60000);
    return;
  }
  if (flow === 'globe') {
    // A first Back may close a chat detail; at most three ordinary Back gestures.
    for (let i = 0; i < 3; i++) {
      await input(target, 'input keyevent 4');
      if ((await hierarchy(target)).some(exact('Globe Meewav. Glisse pour tourner et pince pour zoomer.'))) return;
    }
    throw new Error('Retour au Globe non obtenu après trois gestes Retour.');
  }
  if (flow === 'messaging' || flow === 'rooms') {
    await tap(target, flow === 'messaging' ? 'Messagerie' : 'Rooms');
    return; // WebView load and real session are checked by Playwright.
  }
  if (flow === 'room-wizard') {
    await tap(target, 'Créer une Room');
    await find(target, exact('Ouvrir une Room'));
    await tap(target, 'Retour aux Rooms');
    await find(target, exact('Créer une Room'));
    return;
  }
  throw new Error('Parcours natif QA inconnu.');
}
