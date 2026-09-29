import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { testAccountsDirectory } from '../test-accounts/local-state.mjs';

export const root = resolve(import.meta.dirname, '../..');
export const aliases = ['testeur1', 'testeur2', 'testeur3'];
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function configuration(file = 'scripts/qa-three-users/config.example.json', rotation = 0) {
  const config = JSON.parse(await readFile(resolve(root, file), 'utf8'));
  const state = JSON.parse(await readFile(resolve(testAccountsDirectory, 'provision-state.json'), 'utf8'));
  if (state.accounts?.length !== 3 || new Set(state.accounts.map(a => a.id)).size !== 3
    || aliases.some(alias => !state.accounts.some(a => a.alias === alias && a.id && a.email && a.password))) {
    throw new Error('Trois identités QA réelles distinctes requises. Relancer le provisionneur.');
  }
  const properties = await readFile(resolve(root, 'meewav.local.properties'), 'utf8');
  const value = key => properties.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replaceAll('\\:', ':');
  config.supabaseUrl = value('SUPABASE_URL')?.replace(/\/$/, '');
  config.apiKey = value('SUPABASE_PUBLISHABLE_KEY');
  if (state.supabaseUrl !== config.supabaseUrl || !config.supabaseUrl?.startsWith('https://')) throw new Error('Projet QA incohérent.');
  config.windowsRepo = resolve(root, config.windowsRepo);
  config.webRepo = resolve(root, config.webRepo);
  const targets = config.targets;
  if (targets?.length !== 3 || new Set(targets.map(t => t.account)).size !== 3
    || targets.some(t => !aliases.includes(t.account) || !['web', 'electron', 'android'].includes(t.platform))
    || targets.filter(t => t.platform === 'electron').length > 1
    || targets.some(t => t.platform === 'android' && !t.serial)) throw new Error('Trois cibles distinctes requises, un seul Electron maximum.');
  const phones = targets.filter(t => t.platform === 'android');
  if (new Set(phones.map(t => t.serial)).size !== phones.length) throw new Error('Chaque compte Android doit utiliser un téléphone différent.');
  config.targets = targets.map(t => ({ ...t, account: state.accounts.find(a => a.alias === aliases[(aliases.indexOf(t.account) + rotation) % 3]) }));
  config.accounts = state.accounts;
  return config;
}

export function playwright(config) {
  const require = createRequire(resolve(config.windowsRepo, 'package.json'));
  return require('@playwright/test');
}

export async function api(config, path, token, body, method = 'POST') {
  const response = await fetch(`${config.supabaseUrl}${path}`, {
    method, redirect: 'error', signal: AbortSignal.timeout(20000),
    headers: { apikey: config.apiKey, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }).catch(() => { throw new Error('Réseau Supabase indisponible'); });
  if (!response.ok) throw new Error(`Supabase ${method} ${path.split('?')[0]} : HTTP ${response.status}`);
  return response.json();
}

export async function identity(config, account) {
  const session = await api(config, '/auth/v1/token?grant_type=password', null, { email: account.email, password: account.password });
  if (session.user?.id !== account.id || session.user?.user_metadata?.qa_test_account !== true) throw new Error('Identité QA non vérifiée.');
  return session.access_token;
}

export async function checkDelivered(config, from, to, marker) {
  const rows = [];
  for (const target of [from, to]) {
    const token = target.token ?? await identity(config, target.account);
    target.token = token;
    const conversations = await api(config, '/rest/v1/rpc/list_my_conversations_v2', token,
      { p_cursor: null, p_limit: 100, p_kinds: ['direct'], p_unread_only: false, p_search: null });
    const peer = target === from ? to : from;
    const matches = conversations.filter(c => c.counterpart_profile_id === peer.account.id);
    if (matches.length !== 1) throw new Error(`Conversation absente ou dupliquée pour ${target.account.alias}`);
    const messages = await api(config, '/rest/v1/rpc/get_conversation_messages_v3', token,
      { p_conversation_id: matches[0].conversation_id, p_before_sequence: null, p_limit: 100 });
    rows.push(messages.find(m => m.body === marker && m.sender_profile_id === from.account.id && !m.deleted_at));
  }
  if (!rows[0] || rows[0].id !== rows[1]?.id) throw new Error('Message non confirmé avec la même identité serveur pour les deux comptes.');
}

export class Report {
  constructor(config, label) {
    this.id = `${label}-${new Date().toISOString().replaceAll(/[:.]/g, '-')}`;
    this.directory = resolve(root, '.local/qa-three-users', this.id);
    this.secrets = [config.apiKey, ...config.accounts.flatMap(a => [a.password, a.email])].filter(Boolean);
    this.data = { id: this.id, startedAt: new Date().toISOString(), results: [], events: [], manual: ['qualité audio et vidéo', 'effets vocaux', 'latence', 'synchronisation perçue', 'coupure réseau et reconnexion', 'entrée/sortie en live'] };
  }
  clean(value) {
    let text = String(value);
    for (const secret of this.secrets) text = text.split(secret).join('[masqué]');
    return text.replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[jeton masqué]');
  }
  event(target, kind, value) {
    this.data.events.push({ at: new Date().toISOString(), platform: target.platform, account: target.account.alias, kind, value: this.clean(value) });
  }
  async checkpoint(phase) {
    if (this.data.activeStep) this.data.activeStep.phase = this.clean(phase);
    await this.save();
  }
  async save() {
    await mkdir(this.directory, { recursive: true });
    await writeFile(resolve(this.directory, 'report.json'), JSON.stringify(this.data, null, 2));
    const lines = [`# Test Meewav — ${this.id}`, '',
      ...(this.data.activeStep ? [`En cours : ${this.data.activeStep.scenario} — ${this.data.activeStep.phase}`, ''] : []),
      '| Scénario | Plateforme / compte | Résultat | Attendu | Observé |', '|---|---|---|---|---|',
      ...this.data.results.map(r => `| ${r.scenario} | ${r.targets.join(', ')} | ${r.status} | ${r.expected} | ${r.observed.replaceAll('|', '/').replaceAll('\n', ' ')} |`),
      '', 'Les captures sont dans ce dossier. Les événements JSON sont expurgés des identifiants secrets. Aucun HAR ni état de session exporté.',
      '', 'Audio, vidéo, micro, effets, latence et coupures réseau : validation manuelle requise.'];
    await writeFile(resolve(this.directory, 'report.md'), lines.join('\n'));
  }
  async step(scenario, targets, expected, action) {
    const result = { scenario, targets: targets.map(t => `${t.platform}/${t.account.alias}`), expected, status: 'PASS', observed: 'Conforme', screenshots: [] };
    this.data.activeStep = { scenario, targets: result.targets, startedAt: new Date().toISOString(), phase: 'Démarrage' };
    await this.save();
    try { await action(); }
    catch (error) {
      result.status = 'FAIL'; result.observed = this.clean(error.message);
      this.data.activeStep.observed = result.observed;
      await this.checkpoint('Capture après échec');
      await mkdir(this.directory, { recursive: true });
      for (const target of targets) {
        if ((!target.page && !target.nativeScreenshot) || scenario.startsWith('AUTH')) continue; // Never capture credential entry.
        const file = `${this.data.results.length}-${target.platform}-${target.account.alias}.png`;
        try {
          if (target.nativeScreenshot) await target.nativeScreenshot(resolve(this.directory, file));
          else await target.page.screenshot({ path: resolve(this.directory, file), timeout: 5000 });
          result.screenshots.push(file);
        } catch { /* preserve original error */ }
      }
    }
    delete this.data.activeStep;
    this.data.results.push(result); await this.save();
    console.log(`${result.status} ${scenario} (${result.targets.join(', ')})`);
    return result.status === 'PASS';
  }
  async skipped(scenario, targets, expected, reason) {
    this.data.results.push({ scenario, targets: targets.map(t => `${t.platform}/${t.account.alias}`), expected, status: 'NOT_RUN', observed: reason });
    await this.save();
  }
}
