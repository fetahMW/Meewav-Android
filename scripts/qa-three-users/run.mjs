import { configuration, playwright, Report, identity, checkDelivered, sleep } from './core.mjs';
import { startServer, desktopTarget, login } from './desktop.mjs';
import { messaging, openConversation, receiveConversation, send, received, verifyMessagingIdentity } from './messaging.mjs';

const args = process.argv.slice(2);
const option = (name, fallback) => { const at = args.indexOf(name); return at < 0 ? fallback : args[at + 1]; };
if (args.includes('--help')) {
  console.log('node scripts/qa-three-users/run.mjs [--config <json>] [--rotation 0|1|2] [--suite messaging|navigation|all] [--reuse-android-sessions] [--pc-pairs-only]');
  process.exit(0);
}
const rotation = Number(option('--rotation', '0'));
const suite = option('--suite', 'all');
if (![0, 1, 2].includes(rotation) || !['messaging', 'navigation', 'all'].includes(suite)) throw new Error('Options de scénario invalides.');
if (args.includes('--reuse-android-sessions') && suite !== 'messaging') {
  throw new Error('Le mode --reuse-android-sessions prend actuellement en charge --suite messaging.');
}
const config = await configuration(option('--config', undefined), rotation);
config.reuseAndroidSessions = args.includes('--reuse-android-sessions');
const pw = playwright(config);
const report = new Report(config, `three-users-r${rotation}`);
const targets = config.targets;
const pcPairsOnly = args.includes('--pc-pairs-only');
if (pcPairsOnly && targets.filter(t => t.platform === 'android').length !== 2) {
  throw new Error('--pc-pairs-only exige deux téléphones Android et une cible PC.');
}
const servers = new Map();
let browser;

try {
  for (const platform of new Set(targets.filter(t => t.platform !== 'android').map(t => t.platform))) {
    servers.set(platform, await startServer(config, platform, report));
  }
  if (targets.some(t => t.platform === 'web')) browser = await pw.chromium.launch({ headless: true });
  for (const target of targets) {
    if (report.data.results.some(r => r.status === 'FAIL' && r.observed.startsWith('Formulaire normal absent') && r.targets.some(t => t.startsWith(`${target.platform}/`)))) {
      await report.skipped('AUTH-01 Connexion réelle', [target], 'Formulaire normal disponible', 'Même plateforme déjà bloquée avant authentification : timeout non répété.');
      continue;
    }
    const reuse = target.platform === 'android' && config.reuseAndroidSessions;
    target.ready = await report.step(reuse ? 'AUTH-01 Session mobile existante' : 'AUTH-01 Connexion réelle', [target],
      reuse ? 'Identité de la session mobile confirmée par Auth, sans reconnexion' : 'Identité QA authentifiée par le formulaire normal', async () => {
      if (target.platform === 'android') {
        const { androidTarget } = await import('./mobile.mjs');
        await androidTarget(target, config, pw, report);
        if (reuse) await verifyMessagingIdentity(target, config);
      } else {
        await desktopTarget(target, config, pw, servers.get(target.platform), report, browser);
        await login(target);
      }
      target.token ??= await identity(config, target.account);
    });
    if (!target.ready) continue;
    if (target.platform === 'android') {
      target.page.on('response', response => {
        if (response.status() < 400) return;
        const url = new URL(response.url());
        report.event(target, 'http-error', `${response.status()} ${url.origin}${url.pathname}`);
      });
      target.page.on('pageerror', error => report.event(target, 'page-error', error.message));
    }
  }
  const allReady = targets.every(t => t.ready);
  if (suite !== 'navigation') {
    if (!allReady) await report.skipped('MSG-01 Conversations à trois', targets, 'Trois sessions réelles simultanées', 'Une connexion UI a échoué. Aucun message envoyé.');
    else {
      // Each pair exchanges in both directions. Only the three verified QA accounts are recipients.
      let messageFailure = false;
      for (const [index, pair] of [[0, 1], [1, 2], [2, 0]].entries()) {
        const [a, b] = pair.map(i => targets[i]);
        if (pcPairsOnly && a.platform === 'android' && b.platform === 'android') continue;
        if (messageFailure) {
          await report.skipped(`MSG-0${index + 1} Conversation et réponse`, [a, b], 'Échange bidirectionnel confirmé',
            'Échec précédent à diagnostiquer avant de répéter les mêmes contrôles.');
          continue;
        }
        const passed = await report.step(`MSG-0${index + 1} Conversation et réponse`, [a, b], 'Conversation reçue, deux messages visibles et persistés pour les deux comptes', async () => {
          await report.checkpoint('Ouverture des deux messageries');
          await Promise.all([messaging(a), messaging(b)]);
          await report.checkpoint(`Recherche et ouverture du contact depuis ${a.account.alias}`);
          await openConversation(a, b);
          await report.checkpoint(`Ouverture de la conversation reçue par ${b.account.alias}`);
          await receiveConversation(b, a);
          for (const [from, to] of [[a, b], [b, a]]) {
            const marker = `QA ${report.id} ${from.account.alias} vers ${to.account.alias}`;
            await report.checkpoint(`Envoi par ${from.account.alias}`);
            await send(from, marker);
            await report.checkpoint(`Affichage du message sur ${from.account.alias} et ${to.account.alias}`);
            await Promise.all([received(from, marker), received(to, marker)]);
            await report.checkpoint('Confirmation du même message dans Supabase avec les deux sessions');
            await checkDelivered(config, from, to, marker);
          }
        });
        messageFailure = !passed;
      }
    }
  }
  if (suite !== 'messaging') {
    const { navigation } = await import('./navigation.mjs');
    const failedPlatforms = new Set();
    for (const target of targets.filter(t => t.ready)) {
      if (failedPlatforms.has(target.platform)) {
        await report.skipped('NAVIGATION', [target], 'Globe et Rooms accessibles', 'Échec déjà constaté sur cette plateforme ; diagnostic requis avant répétition.');
        continue;
      }
      const before = report.data.results.length;
      await navigation(target, report);
      if (report.data.results.slice(before).some(r => r.status === 'FAIL')) failedPlatforms.add(target.platform);
    }
  }
  // Do not invent a logout control where the product does not expose one.
  for (const target of targets.filter(t => t.ready)) {
    const logout = target.page.getByRole('button', { name: 'Se déconnecter', exact: true });
    if (target.platform !== 'android' && await logout.isVisible().catch(() => false)) {
      await report.step('AUTH-02 Déconnexion UI', [target], 'Retour au formulaire de connexion', async () => {
        await logout.click();
        await target.page.locator('input[autocomplete="username"], input[type="email"]').first().waitFor({ state: 'visible' });
      });
    } else await report.skipped('AUTH-02 Déconnexion UI', [target], 'Retour au formulaire de connexion', 'Aucun contrôle de déconnexion exposé dans la surface actuelle ; contexte QA isolé fermé.');
  }
} catch (error) {
  await report.step('SETUP', targets, 'Environnement de test disponible', () => { throw error; });
} finally {
  for (const target of targets) { try { await target.close?.(); } catch { /* cleanup only owned resources */ } }
  // Includes duplicate wireless transports discovered but not assigned to a test.
  await Promise.allSettled((config.androidDevices ?? []).map(device => Promise.race([device.close(), sleep(3000)])));
  await browser?.close().catch(() => {});
  for (const server of servers.values()) await server.stop();
  report.data.finishedAt = new Date().toISOString();
  await report.save();
  console.log(`Rapport : ${report.directory}`);
  if (report.data.results.some(r => r.status === 'FAIL')) process.exitCode = 1;
  // Some Windows ADB transports keep the experimental Playwright driver alive
  // after its close timeout. The report and owned-process cleanup are complete.
  if (config.androidDevices?.length) process.exit(process.exitCode || 0);
}
