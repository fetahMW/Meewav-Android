import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root, sleep } from './core.mjs';
import { nativeFlow } from './native.mjs';

const exec = promisify(execFile);
const pkg = 'com.meewav.android.debug';
const adb = resolve(process.env.LOCALAPPDATA, 'Android/Sdk/platform-tools/adb.exe');

async function scrub(directory, report) {
  // Maestro may resolve inputText in its diagnostics. Keep all artifacts ignored,
  // and redact textual artifacts before anyone reads or shares them.
  for (const entry of await readdir(directory, { withFileTypes: true }).catch(() => [])) {
    const file = resolve(directory, entry.name);
    if (entry.isDirectory()) await scrub(file, report);
    else if (/\.(json|log|txt|yaml|yml|xml|html)$/i.test(entry.name)) {
      const content = await readFile(file, 'utf8');
      await writeFile(file, report.clean(content));
    }
  }
}

export async function maestro(target, report, flow) {
  const output = resolve(report.directory, `maestro-${target.account.alias}-${flow}`);
  await mkdir(output, { recursive: true });
  const result = await new Promise((resolveResult, reject) => {
    const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File',
      resolve(root, 'scripts/qa-three-users/maestro.ps1'), '-Serial', target.serial,
      '-Flow', resolve(root, `.maestro/qa-three-users/${flow}.yaml`), '-OutputDirectory', output],
    { windowsHide: true, env: { ...process.env, MAESTRO_QA_EMAIL: target.account.email, MAESTRO_QA_PASSWORD: target.account.password },
      stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { stdout = (stdout + data).slice(-16000); });
    child.on('error', reject);
    child.on('exit', code => resolveResult({ code, stdout }));
  });
  await scrub(output, report);
  await writeFile(resolve(output, 'console-redacted.txt'), report.clean(result.stdout));
  if (result.code !== 0) throw new Error(`Maestro ${flow} a échoué (code ${result.code}). Voir diagnostic privé expurgé.`);
}

async function attachPage(target, prefix) {
  const prefixes = Array.isArray(prefix) ? prefix : [prefix];
  for (let attempt = 0; attempt < 60; attempt++) {
    for (const view of target.device.webViews().filter(w => w.pkg() === pkg)) {
      try {
        const entry = await view.page();
        const candidates = entry.context().pages().filter(page => prefixes.some(p => page.url().startsWith(`https://appassets.androidplatform.net/${p}`)));
        let page;
        for (const candidate of candidates) {
          if (await candidate.evaluate(() => document.visibilityState === 'visible').catch(() => false)) { page = candidate; break; }
        }
        if (!page) continue;
        target.page = page;
        target.page.setDefaultTimeout(20000);
        return prefixes.find(p => page.url().startsWith(`https://appassets.androidplatform.net/${p}`));
      } catch { /* an old WebView may be detaching during native navigation */ }
    }
    await sleep(500);
  }
  throw new Error(`WebView réelle ${prefix} introuvable après navigation native.`);
}

export async function androidTarget(target, config, pw, report) {
  if (!config.androidDevices) {
    // Use the existing SDK directly; the caller need not have adb on PATH.
    // start-server is idempotent and does not log out or restart an application.
    await exec(adb, ['start-server'], { timeout: 15000, windowsHide: true }).catch(() => {
      throw new Error('Serveur ADB indisponible. Vérifier le SDK Android et les connexions des téléphones.');
    });
  }
  const devices = config.androidDevices ??= await pw._android.devices();
  target.device = devices.find(d => d.serial() === target.serial);
  if (!target.device) throw new Error('Téléphone ADB absent. Actualiser le serial dans la configuration locale.');
  if (target.model && target.device.model() !== target.model) throw new Error('Le modèle ADB ne correspond pas au téléphone prévu.');
  target.close = () => Promise.race([target.device.close(), sleep(5000)]); // Disconnect debugging, leave application data intact.
  target.nativeScreenshot = async file => {
    const { stdout } = await exec(adb, ['-s', target.serial, 'exec-out', 'screencap', '-p'], { encoding: 'buffer', maxBuffer: 16000000, timeout: 5000, windowsHide: true });
    await writeFile(file, stdout);
  };
  target.runNative = flow => config.androidDriver === 'adb' ? nativeFlow(target, flow) : maestro(target, report, flow);
  if (config.reuseAndroidSessions) {
    const prefix = await attachPage(target, ['messaging', 'globe']);
    target.surface = prefix === 'messaging' ? '/messages' : '/globe';
  } else {
    await target.runNative('login');
    await attachPage(target, 'globe');
    target.surface = '/globe';
  }
  target.navigate = async route => {
    if (target.surface === route) return;
    if (config.reuseAndroidSessions) {
      if (target.surface !== '/globe' || !['/messages', '/rooms/home'].includes(route)) {
        throw new Error('Session mobile préservée : navigation de retour native non disponible dans ce parcours.');
      }
      const prefix = route === '/messages' ? 'messaging' : 'rooms';
      // Android intercepts the navigation and opens another WebView. Waiting for
      // this document's browser navigation would time out after a successful tap.
      await target.page.getByRole('button', { name: route === '/messages' ? 'Messagerie' : 'Rooms', exact: true }).click({ noWaitAfter: true });
      await attachPage(target, prefix);
      target.surface = route;
      return;
    }
    if (target.surface !== '/globe') {
      await target.runNative('globe');
      await attachPage(target, 'globe');
      target.surface = '/globe';
    }
    if (route === '/globe') return;
    const flow = route === '/messages' ? 'messaging' : route === '/rooms/home' ? 'rooms' : null;
    if (!flow) throw new Error(`Route mobile QA non prévue : ${route}`);
    await target.runNative(flow);
    await attachPage(target, flow === 'messaging' ? 'messaging' : 'rooms');
    target.surface = route;
  };
}
