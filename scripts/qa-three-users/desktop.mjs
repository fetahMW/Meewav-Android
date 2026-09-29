import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { sleep, root } from './core.mjs';

export async function startServer(config, platform, report) {
  const repo = platform === 'electron' ? config.windowsRepo : config.webRepo;
  const port = platform === 'electron' ? config.electronPort : config.webPort;
  const url = `http://127.0.0.1:${port}`;
  // Refuse to reuse an unknown server: it could point at a preview or another checkout.
  const occupied = await fetch(url, { signal: AbortSignal.timeout(1000) }).then(() => true).catch(() => false);
  if (occupied) throw new Error(`Port ${port} occupé. Choisir un autre port QA dans la configuration.`);
  const env = { ...process.env,
    VITE_SUPABASE_URL: config.supabaseUrl, VITE_SUPABASE_PUBLISHABLE_KEY: config.apiKey,
    VITE_SUPABASE_ANON_KEY: config.apiKey,
    VITE_MEEWAV_STUDIO_DESKTOP: 'false', VITE_ROOMS_WORKSPACE_PREVIEW: 'false',
    VITE_ROOMS_HOME_WORKSPACE_PREVIEW: 'false', VITE_CLASSE_WORKSPACE_PREVIEW: 'false',
  };
  const child = spawn(process.execPath, [resolve(repo, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    { cwd: repo, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let launchError;
  child.on('error', error => { launchError = error; });
  // Keep diagnostics in memory; never print an env dump or Vite configuration.
  let diagnostics = '';
  for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { diagnostics = (diagnostics + data).slice(-12000); });
  const stop = async () => { if (child.exitCode === null) child.kill(); };
  for (let i = 0; i < 120; i++) {
    if (launchError || child.exitCode !== null) { await stop(); throw new Error(report.clean(`Démarrage Vite impossible : ${diagnostics}`)); }
    if (await fetch(url, { signal: AbortSignal.timeout(1000) }).then(r => r.ok).catch(() => false)) return { url, stop };
    await sleep(500);
  }
  await stop(); throw new Error('Délai de démarrage Vite dépassé.');
}

export async function desktopTarget(target, config, pw, server, report, browser) {
  if (target.platform === 'web') {
    const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, locale: 'fr-FR' });
    target.page = await context.newPage();
    target.close = () => context.close();
  } else {
    const require = createRequire(resolve(config.windowsRepo, 'apps/meewav-studio/package.json'));
    const userData = resolve(root, '.local/qa-three-users-private', report.id, target.account.alias);
    await mkdir(userData, { recursive: true });
    const application = await pw._electron.launch({ executablePath: require('electron'),
      args: [resolve(config.windowsRepo, 'apps/meewav-studio/main.cjs')], cwd: config.windowsRepo,
      env: { ...process.env, MEEWAV_DESKTOP_DEV_PORT: String(config.electronPort), MEEWAV_TEST_MODE: '0',
        MEEWAV_DESKTOP_QA_USER_DATA: userData }, timeout: 60000 });
    target.close = () => application.close();
    target.page = await application.firstWindow();
  }
  target.baseUrl = server.url;
  target.page.setDefaultTimeout(20000);
  target.page.on('pageerror', error => report.event(target, 'page-error', error.message));
  target.page.on('response', response => {
    if (response.status() < 400) return;
    const url = new URL(response.url());
    report.event(target, 'http-error', `${response.status()} ${url.origin}${url.pathname}`);
  });
  target.navigate = async route => { await target.page.goto(`${server.url}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 }); };
}

export async function login(target) {
  const { page, account } = target;
  await target.navigate('/auth');
  const liveChoice = page.getByRole('button', { name: /Application MeeWav/i });
  if (await liveChoice.isVisible().catch(() => false)) await liveChoice.click();
  const username = page.locator('input[autocomplete="username"], input[type="email"]').first();
  try { await username.waitFor({ state: 'visible', timeout: 30000 }); }
  catch {
    const evidence = await page.evaluate(() => ({ path: location.pathname, title: document.title,
      text: document.body.innerText.slice(0, 1500), inputs: [...document.querySelectorAll('input')].map(i => ({ type: i.type, placeholder: i.placeholder, autocomplete: i.autocomplete })) }));
    throw new Error(`Formulaire normal absent : ${JSON.stringify(evidence)}`);
  }
  await username.fill(account.email);
  await page.locator('input[autocomplete="current-password"]').fill(account.password);
  const response = page.waitForResponse(r => r.url().includes('/auth/v1/token?grant_type=password') && r.request().method() === 'POST', { timeout: 30000 }).catch(error => error);
  await page.getByRole('button', { name: /^Se Connecter$/i }).click();
  const reply = await response;
  if (reply instanceof Error) throw new Error('Aucune réponse Auth reçue après soumission du formulaire.');
  const session = await reply.json();
  if (!reply.ok()) throw new Error(`Connexion UI : HTTP ${reply.status()}, code ${String(session.error_code || session.code || 'auth_failed').replace(/[^a-zA-Z0-9_]/g, '')}`);
  if (session.user?.id !== account.id) throw new Error('Connexion UI : réponse Auth reçue mais identifiant différent du compte QA attendu.');
  await username.waitFor({ state: 'hidden', timeout: 60000 });
}
