// Two independent CDP drivers exercise the LIVE Android messaging UI.
// Usage: node scripts/messaging-dual-agent/conversation.mjs --device-a emulator-5554 --device-b emulator-5556
// Native sign-in must already be complete on both devices. Credentials are never used here.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { resolve, dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const outputRoot = join(repo, 'app', 'build', 'messaging-dual-agent');
const accountsPath = join(outputRoot, 'accounts.json');
const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(name);
  return index < 0 ? null : args[index + 1];
};
const serials = [option('--device-a'), option('--device-b')];
if (serials.some((serial) => !/^emulator-\d+$/.test(serial ?? '')) || serials[0] === serials[1]) {
  console.error('Usage: node scripts/messaging-dual-agent/conversation.mjs --device-a emulator-5554 --device-b emulator-5556');
  process.exit(2);
}
const ports = [Number(option('--port-a') ?? 9231), Number(option('--port-b') ?? 9232)];
if (ports.some((port) => !Number.isInteger(port) || port < 1024 || port > 65535) || ports[0] === ports[1]) {
  console.error('Two distinct local ports between 1024 and 65535 are required.');
  process.exit(2);
}

const adb = process.env.LOCALAPPDATA
  ? join(process.env.LOCALAPPDATA, 'Android', 'Sdk', 'platform-tools', 'adb.exe')
  : 'adb';
const pause = (ms) => new Promise((done) => setTimeout(done, ms));
const fail = (code) => Object.assign(new Error(code), { code });
const runAdb = async (serial, ...command) => (await exec(adb, ['-s', serial, ...command], {
  timeout: 10_000,
  maxBuffer: 1024 * 1024,
})).stdout.trim();

class Browser {
  constructor(serial, port) {
    this.serial = serial;
    this.port = port;
    this.forwarded = false;
    this.pending = new Map();
    this.nextId = 0;
    this.networkFailures = [];
  }

  async connect() {
    if ((await runAdb(this.serial, 'get-state')) !== 'device') throw fail('device_unavailable');
    const pid = (await runAdb(this.serial, 'shell', 'pidof', 'com.meewav.android.debug')).split(/\s+/)[0];
    if (!/^\d+$/.test(pid ?? '')) throw fail('app_not_running');
    await runAdb(this.serial, 'forward', '--no-rebind', `tcp:${this.port}`, `localabstract:webview_devtools_remote_${pid}`);
    this.forwarded = true;
    const response = await fetch(`http://127.0.0.1:${this.port}/json/list`, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw fail('cdp_targets_unavailable');
    const targets = await response.json();
    const target = targets.find((item) => item.type === 'page'
      && item.url?.startsWith('https://appassets.androidplatform.net/messaging/index.html')
      && item.webSocketDebuggerUrl);
    if (!target) throw fail('messaging_webview_missing');
    this.socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((done, reject) => {
      const timer = setTimeout(() => reject(fail('cdp_open_timeout')), 8000);
      this.socket.addEventListener('open', () => { clearTimeout(timer); done(); }, { once: true });
      this.socket.addEventListener('error', () => { clearTimeout(timer); reject(fail('cdp_open_failed')); }, { once: true });
    });
    this.socket.addEventListener('message', (event) => {
      let response;
      try { response = JSON.parse(event.data); } catch { return; }
      if (response.method === 'Network.responseReceived' && response.params?.response?.status >= 400) {
        const raw = response.params.response.url ?? '';
        let path = '';
        try { path = new URL(raw).pathname; } catch { /* ignore malformed URL */ }
        this.networkFailures.push({ requestId: response.params.requestId,
          status: response.params.response.status, path });
      }
      const request = this.pending.get(response.id);
      if (!request) return;
      this.pending.delete(response.id);
      clearTimeout(request.timer);
      if (response.error) request.reject(fail('cdp_command_failed'));
      else request.resolve(response.result);
    });
    this.socket.addEventListener('close', () => {
      for (const request of this.pending.values()) {
        clearTimeout(request.timer);
        request.reject(fail('cdp_closed'));
      }
      this.pending.clear();
    });
    await this.call('Page.enable');
    await this.call('Runtime.enable');
    await this.call('Network.enable');
  }

  call(method, params = {}) {
    if (this.socket?.readyState !== WebSocket.OPEN) return Promise.reject(fail('cdp_not_connected'));
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(fail('cdp_command_timeout'));
      }, 15_000);
      this.pending.set(id, { resolve, reject, timer });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(fn, ...values) {
    const expression = `(${fn.toString()})(...${JSON.stringify(values)})`;
    const reply = await this.call('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (reply.exceptionDetails || !reply.result || !Object.hasOwn(reply.result, 'value')) throw fail('dom_evaluation_failed');
    return reply.result.value;
  }

  async screenshot(path) {
    const result = await this.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    if (!result?.data) throw fail('screenshot_failed');
    await writeFile(path, Buffer.from(result.data, 'base64'));
  }

  async close() {
    try { this.socket?.close(); } catch { /* continue cleanup */ }
    if (this.forwarded) {
      await runAdb(this.serial, 'forward', '--remove', `tcp:${this.port}`).catch(() => undefined);
      this.forwarded = false;
    }
  }
}

async function waitFor(browser, condition, values = [], timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await browser.evaluate(condition, ...values)) return;
    await pause(600);
  }
  throw fail('ui_wait_timeout');
}

function liveReady() {
  return window.meewavMessaging?.status === 'ready'
    && !document.querySelector('.mobile-messaging-title small, .mobile-message-error')
    && !!document.querySelector('.mobile-messaging-header');
}

function openContactSearch() {
  const button = document.querySelector('.mobile-messaging-header button[aria-label="Trouver un ami"]')
    || [...document.querySelectorAll('button')].find((item) => item.textContent?.trim() === 'Trouver un ami');
  if (!button) return false;
  button.click();
  return true;
}

function closeStaleDialog() {
  const close = document.querySelector('[role="dialog"] .mw-dialog__header button[aria-label="Fermer"]');
  if (!close) return false;
  close.click();
  return true;
}

function noDialogOpen() {
  return !document.querySelector('[role="dialog"]');
}

function focusSearch() {
  const field = document.querySelector('[role="dialog"] input[aria-label="Rechercher un ami sur Meewav"]');
  if (!field) return false;
  field.focus();
  return true;
}

function peerResultVisible(username) {
  const expected = `@${username}`.toLowerCase();
  return [...document.querySelectorAll('[role="dialog"] .mw-contact-picker button')]
    .some((button) => button.getClientRects().length > 0
      && button.querySelector('small')?.textContent?.toLowerCase().includes(expected));
}

function choosePeer(username) {
  const expected = `@${username}`.toLowerCase();
  const button = [...document.querySelectorAll('[role="dialog"] .mw-contact-picker button')]
    .find((item) => item.getClientRects().length > 0
      && item.querySelector('small')?.textContent?.toLowerCase().includes(expected));
  if (!button) return false;
  button.click();
  return true;
}

function openDiscussion() {
  const button = [...document.querySelectorAll('[role="dialog"] footer button')]
    .find((item) => item.textContent?.includes('Ouvrir la discussion') && !item.disabled);
  if (!button) return false;
  button.click();
  return true;
}

function directConversationRejected() {
  const dialog = document.querySelector('[role="dialog"]');
  return !!dialog && dialog.textContent?.includes('La discussion n’a pas pu être ouverte');
}

function peerRowVisible(name) {
  return [...document.querySelectorAll('.mw-conversation-row')]
    .some((button) => button.getClientRects().length > 0
      && (button.getAttribute('aria-label') ?? '').includes(name));
}

function openPeerRow(name) {
  const button = [...document.querySelectorAll('.mw-conversation-row')]
    .find((item) => item.getClientRects().length > 0
      && (item.getAttribute('aria-label') ?? '').includes(name));
  if (!button) return false;
  button.click();
  return true;
}

function conversationOpen(name) {
  const header = document.querySelector('.mobile-messaging.is-detail .mw-chat-header__identity-text strong');
  return !!header && header.textContent?.includes(name)
    && !!document.querySelector('.mw-emoticon-composer[aria-label="Écrire un message"]');
}

function focusComposer() {
  const editor = document.querySelector('.mw-emoticon-composer[aria-label="Écrire un message"]');
  if (!editor || editor.getAttribute('contenteditable') !== 'true') return false;
  editor.focus();
  return true;
}

function composerContains(text) {
  return document.querySelector('.mw-emoticon-composer[aria-label="Écrire un message"]')?.textContent === text;
}

function sendComposer() {
  const button = document.querySelector('.mw-composer-send[aria-label="Envoyer"]');
  if (!button || !button.classList.contains('is-ready') || button.disabled) return false;
  button.click();
  return true;
}

function messageVisible(text, author) {
  return [...document.querySelectorAll('.mw-chat-timeline [data-message-id]')]
    .some((item) => item.getClientRects().length > 0
      && (item.getAttribute('aria-label') ?? '').startsWith(`Message de ${author}.`)
      && [...item.querySelectorAll('.mw-bubble--text p')].some((p) => p.textContent?.trim() === text));
}

function openAttachmentMenu() {
  const button = document.querySelector('button[aria-label="Ajouter une pièce jointe"]');
  if (!button || button.disabled) return false;
  button.click();
  return true;
}

function selectAudioAttachment() {
  const button = [...document.querySelectorAll('.mw-attachment-menu button')]
    .find((item) => item.textContent?.trim() === 'Audio');
  if (!button) return false;
  button.click();
  return true;
}

function audioQueueReady(name) {
  const queue = document.querySelector('.mw-attachment-queue');
  const send = queue?.querySelector('button.mw-attachment-queue__send');
  return !!queue && queue.textContent?.includes(name) && !!send && !send.disabled;
}

function discardExistingAttachments() {
  const items = [...document.querySelectorAll('.mw-attachment-queue article')];
  for (const item of items) item.querySelector('button[aria-label^="Retirer "]')?.click();
  return true;
}

async function waitForNativePicker(serial) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const state = await runAdb(serial, 'shell', 'dumpsys', 'activity', 'activities');
    if (/topResumedActivity=[\s\S]{0,160}com\.google\.android\.documentsui/.test(state)) return;
    await pause(400);
  }
  throw fail('android_file_picker_missing');
}

async function tapPickerText(serial, label) {
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    await runAdb(serial, 'shell', 'uiautomator', 'dump', '/sdcard/window.xml');
    const xml = await runAdb(serial, 'shell', 'cat', '/sdcard/window.xml');
    const nodes = [...xml.matchAll(/<node\b[^>]*\btext="([^"]*)"[^>]*\bbounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/g)];
    const match = nodes.find((node) => node[1] === label);
    if (match) {
      const x = Math.floor((Number(match[2]) + Number(match[4])) / 2);
      const y = Math.floor((Number(match[3]) + Number(match[5])) / 2);
      await runAdb(serial, 'shell', 'input', 'tap', String(x), String(y));
      return;
    }
    await pause(450);
  }
  throw fail('android_picker_item_missing');
}

function sendAudioQueue() {
  const button = document.querySelector('.mw-attachment-queue button.mw-attachment-queue__send');
  if (!button || button.disabled) return false;
  button.click();
  return true;
}

function audioMessageVisible(name, author) {
  return [...document.querySelectorAll('.mw-chat-timeline [data-message-id]')]
    .some((item) => item.getClientRects().length > 0
      && (item.getAttribute('aria-label') ?? '').startsWith(`Message de ${author}.`)
      && item.querySelector('.mw-bubble--file')?.textContent?.includes(name));
}

async function attachAudio(browser, path, name) {
  await browser.evaluate(discardExistingAttachments);
  await runAdb(browser.serial, 'push', path, `/sdcard/Download/${basename(path)}`);
  if (!await browser.evaluate(openAttachmentMenu)) throw fail('attachment_button_missing');
  if (!await browser.evaluate(selectAudioAttachment)) throw fail('audio_action_missing');
  await waitForNativePicker(browser.serial);
  await runAdb(browser.serial, 'shell', 'input', 'tap', '65', '125');
  await tapPickerText(browser.serial, 'Downloads');
  await tapPickerText(browser.serial, name);
  await waitFor(browser, audioQueueReady, [name], 60_000);
  if (!await browser.evaluate(sendAudioQueue)) throw fail('audio_send_button_unavailable');
  await waitFor(browser, audioMessageVisible, [name, 'vous'], 60_000);
}

async function refreshVisibleSurface(browser) {
  await browser.evaluate(() => { window.dispatchEvent(new Event('focus')); return true; });
}

async function sendMessage(browser, text) {
  if (!await browser.evaluate(focusComposer)) throw fail('composer_missing');
  await browser.call('Input.insertText', { text });
  await waitFor(browser, composerContains, [text], 10_000);
  if (!await browser.evaluate(sendComposer)) throw fail('send_button_unavailable');
  await waitFor(browser, messageVisible, [text, 'vous'], 30_000);
}

let browsers = [];
let report;
let stage = 'setup';
let runDir;
try {
  // Only public account identifiers are selected. Never access email/password fields.
  const parsed = JSON.parse(await readFile(accountsPath, 'utf8'));
  if (!Array.isArray(parsed) || parsed.length !== 2) throw fail('two_accounts_required');
  const accounts = parsed.map(({ id, username, displayName }) => ({ id, username, displayName }));
  if (accounts.some((account) => !/^[0-9a-f-]{36}$/i.test(account.id ?? '')
    || !/^[a-z0-9_]+$/i.test(account.username ?? '')
    || !account.displayName) || accounts[0].id === accounts[1].id) throw fail('account_metadata_invalid');
  const runId = `conversation-${new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')}`;
  runDir = join(outputRoot, runId);
  await mkdir(runDir, { recursive: true });
  report = {
    runId,
    startedAt: new Date().toISOString(),
    devices: serials.map((serial, index) => ({ serial, username: accounts[index].username, profileId: accounts[index].id })),
    results: [],
    screenshots: [],
    untested: ['fichier audio', 'notes vocales', 'autres pièces jointes', 'appels', 'groupes', 'notifications', 'accusés de lecture'],
  };
  browsers = serials.map((serial, index) => new Browser(serial, ports[index]));
  stage = 'connect_a';
  await browsers[0].connect();
  stage = 'connect_b';
  await browsers[1].connect();
  stage = 'verify_live';
  for (const browser of browsers) await waitFor(browser, liveReady, [], 30_000);
  report.results.push({ step: 'both_live_webviews_ready', passed: true, at: new Date().toISOString() });

  stage = 'create_conversation';
  if (await browsers[0].evaluate(closeStaleDialog)) {
    await waitFor(browsers[0], noDialogOpen, [], 10_000);
  }
  if (!await browsers[0].evaluate(openContactSearch)) throw fail('contact_search_missing');
  await waitFor(browsers[0], focusSearch, [], 10_000);
  await browsers[0].call('Input.insertText', { text: accounts[1].username });
  await waitFor(browsers[0], peerResultVisible, [accounts[1].username], 30_000);
  if (!await browsers[0].evaluate(choosePeer, accounts[1].username)) throw fail('peer_result_missing');
  if (!await browsers[0].evaluate(openDiscussion)) throw fail('discussion_button_missing');
  stage = 'wait_for_direct_conversation';
  const openDeadline = Date.now() + 30_000;
  let directOpen = false;
  while (Date.now() < openDeadline) {
    if (await browsers[0].evaluate(conversationOpen, accounts[1].displayName)) { directOpen = true; break; }
    if (await browsers[0].evaluate(directConversationRejected)) throw fail('direct_conversation_rejected');
    await pause(600);
  }
  if (!directOpen) throw fail('direct_conversation_timeout');
  report.results.push({ step: 'a_opened_direct_conversation_with_b', passed: true, at: new Date().toISOString() });
  await browsers[0].screenshot(join(runDir, 'a-conversation.png'));
  report.screenshots.push('a-conversation.png');

  stage = 'open_conversation_b';
  await refreshVisibleSurface(browsers[1]);
  if (!await browsers[1].evaluate(conversationOpen, accounts[0].displayName)) {
    await waitFor(browsers[1], peerRowVisible, [accounts[0].displayName], 45_000);
    if (!await browsers[1].evaluate(openPeerRow, accounts[0].displayName)) throw fail('peer_row_missing');
  }
  await waitFor(browsers[1], conversationOpen, [accounts[0].displayName], 30_000);
  report.results.push({ step: 'b_opened_same_peer_conversation', passed: true, at: new Date().toISOString() });

  const marker = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const aToB = `QA DM ${marker} A vers B`;
  const bToA = `QA DM ${marker} B vers A`;
  stage = 'a_to_b';
  await sendMessage(browsers[0], aToB);
  await refreshVisibleSurface(browsers[1]);
  await waitFor(browsers[1], messageVisible, [aToB, accounts[0].displayName], 45_000);
  report.results.push({ step: 'a_to_b_visual_delivery', passed: true, marker: aToB, at: new Date().toISOString() });
  await browsers[1].screenshot(join(runDir, 'b-received-a.png'));
  report.screenshots.push('b-received-a.png');

  stage = 'b_to_a';
  await sendMessage(browsers[1], bToA);
  await refreshVisibleSurface(browsers[0]);
  await waitFor(browsers[0], messageVisible, [bToA, accounts[1].displayName], 45_000);
  report.results.push({ step: 'b_to_a_visual_delivery', passed: true, marker: bToA, at: new Date().toISOString() });
  await browsers[0].screenshot(join(runDir, 'a-received-b.png'));
  report.screenshots.push('a-received-b.png');
  await browsers[1].screenshot(join(runDir, 'b-sent-reply.png'));
  report.screenshots.push('b-sent-reply.png');

  stage = 'audio_a_to_b';
  const audioName = `qa-audio-${marker}.mp3`;
  const audioPath = join(runDir, audioName);
  await copyFile(join(repo, 'app', 'src', 'main', 'assets', 'messaging', 'audio', 'messaging', 'message-sent-pro.mp3'), audioPath);
  await attachAudio(browsers[0], audioPath, audioName);
  await refreshVisibleSurface(browsers[1]);
  await waitFor(browsers[1], audioMessageVisible, [audioName, accounts[0].displayName], 60_000);
  report.results.push({ step: 'audio_a_to_b_visual_delivery', passed: true, audioName, at: new Date().toISOString() });
  report.untested = report.untested.filter((item) => item !== 'fichier audio');
  await browsers[1].screenshot(join(runDir, 'b-received-audio.png'));
  report.screenshots.push('b-received-audio.png');
  report.status = 'passed';
} catch (error) {
  if (!report) {
    console.error(`Conversation test blocked: ${error.code ?? 'setup_failed'}`);
    process.exitCode = 1;
  } else {
    report.status = 'failed';
    report.failure = { stage, code: error.code ?? 'unexpected_error' };
    report.networkFailures = [];
    for (const [index, browser] of browsers.entries()) {
      for (const failure of browser.networkFailures.slice(-10)) {
        let remoteCode = null;
        let remoteMessage = null;
        try {
          const body = await browser.call('Network.getResponseBody', { requestId: failure.requestId });
          const payload = JSON.parse(body.body);
          remoteCode = payload.code ?? payload.error ?? null;
          remoteMessage = payload.message ?? payload.msg ?? null;
        } catch { /* body unavailable after navigation */ }
        report.networkFailures.push({ device: index ? 'B' : 'A', status: failure.status,
          path: failure.path, code: remoteCode, message: remoteMessage });
      }
    }
    report.blocked = [
      ['a_to_b_visual_delivery', 'DM A vers B'],
      ['b_to_a_visual_delivery', 'DM B vers A'],
      ['audio_a_to_b_visual_delivery', 'fichier audio A vers B'],
    ].filter(([step]) => !report.results.some((item) => item.step === step)).map(([, label]) => label);
    for (const [index, browser] of browsers.entries()) {
      try {
        const file = `${index ? 'b' : 'a'}-failure.png`;
        await browser.screenshot(join(runDir, file));
        report.screenshots.push(file);
      } catch { /* A disconnected WebView cannot provide a screenshot. */ }
    }
    process.exitCode = 1;
  }
} finally {
  if (report) {
    report.finishedAt = new Date().toISOString();
    await writeFile(join(runDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
    console.log(`${report.status}: ${runDir}`);
    if (report.failure) console.error(`${report.failure.stage}: ${report.failure.code}`);
  }
  await Promise.all(browsers.map((browser) => browser.close()));
}
