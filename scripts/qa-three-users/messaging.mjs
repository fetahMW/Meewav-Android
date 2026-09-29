import { api } from './core.mjs';

const contactEntry = page => page.getByRole('button', { name: /^(Nouvelle conversation|Trouver un ami)$/ }).first();
const backToContacts = page => page.getByRole('button', { name: /Retour aux conversations/i })
  .or(page.getByRole('button', { name: 'Revenir aux contacts', exact: true })).first();

export async function messaging(target) {
  await target.navigate('/messages');
  await target.page.locator('.mw-emoticon-composer, .mw-conversation-row').or(contactEntry(target.page)).first().waitFor({ state: 'visible', timeout: 30000 });
}

async function contactPicker(target) {
  const page = target.page;
  const close = page.locator('[role="dialog"] button[aria-label="Fermer"]');
  if (await close.isVisible().catch(() => false)) await close.click();
  // Starting through the picker exercises contact search and server conversation creation.
  const create = contactEntry(page);
  if (!await create.isVisible().catch(() => false)) {
    const back = backToContacts(page);
    if (await back.isVisible().catch(() => false)) await back.click();
    const filters = page.getByRole('button', { name: 'Filtres de la liste', exact: true });
    if (!await create.isVisible().catch(() => false) && await filters.isVisible().catch(() => false)) await filters.click();
  }
  await create.click();
  return page.getByRole('dialog');
}

// Verify the identity actually used by an already authenticated Android WebView.
// Only observe the ordinary contact-search request; never change the app session.
export async function verifyMessagingIdentity(target, config) {
  await messaging(target);
  const dialog = await contactPicker(target);
  const request = target.page.waitForRequest(request => {
    const url = new URL(request.url());
    return url.origin === config.supabaseUrl && url.pathname === '/rest/v1/rpc/search_messageable_profiles_v1'
      && request.method() === 'POST';
  }, { timeout: 20000 }).catch(() => null);
  await dialog.getByRole('textbox', { name: 'Rechercher un ami sur Meewav' }).fill(target.account.alias);
  const actual = await request;
  if (!actual) throw new Error('Requête de recherche authentifiée non observée ; identité de la session mobile non confirmée.');
  const authorization = (await actual.allHeaders()).authorization;
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw new Error('La recherche mobile ne porte pas de session authentifiée.');
  const user = await api(config, '/auth/v1/user', token, undefined, 'GET');
  if (user.id !== target.account.id || user.user_metadata?.qa_test_account !== true) {
    throw new Error('Le téléphone est connecté à un autre profil ; aucun message de test envoyé.');
  }
  // Memory only; used for server assertions under this same actual session.
  target.token = token;
  await dialog.getByRole('button', { name: 'Fermer', exact: true }).click();
}

export async function openConversation(target, peer) {
  const page = target.page;
  const dialog = await contactPicker(target);
  await dialog.getByRole('textbox', { name: 'Rechercher un ami sur Meewav' }).fill(peer.account.alias);
  const choice = dialog.locator('.mw-contact-picker button').filter({ hasText: new RegExp(`@${peer.account.alias}\\s*·`) }).first();
  await choice.click();
  await dialog.getByRole('button', { name: 'Ouvrir la discussion', exact: true }).click();
  await dialog.waitFor({ state: 'hidden', timeout: 30000 });
  await page.locator('.mw-emoticon-composer[aria-label="Écrire un message"]').waitFor({ state: 'visible', timeout: 30000 });
  await page.locator('.mw-chat-header__identity-text').filter({ hasText: peer.account.alias }).waitFor({ state: 'visible' });
}

export async function receiveConversation(target, peer) {
  const composer = target.page.locator('.mw-emoticon-composer[aria-label="Écrire un message"]');
  const identity = target.page.locator('.mw-chat-header__identity-text').filter({ hasText: peer.account.alias });
  // A phone can already display this conversation, with its list hidden by the
  // responsive layout. In that case there is no list-row click to perform.
  if (await composer.isVisible().catch(() => false) && await identity.isVisible().catch(() => false)) return;
  const row = target.page.locator('.mw-conversation-row').filter({ hasText: peer.account.alias }).first();
  if (!await row.isVisible().catch(() => false)) {
    const back = backToContacts(target.page);
    if (await back.isVisible().catch(() => false)) await back.click();
  }
  await row.waitFor({ state: 'visible', timeout: 45000 });
  await row.click();
  await composer.waitFor({ state: 'visible' });
  await identity.waitFor({ state: 'visible' });
}

export async function send(target, marker) {
  await target.page.locator('.mw-emoticon-composer[aria-label="Écrire un message"]').fill(marker);
  await sendCurrentDraft(target);
}

export async function sendCurrentDraft(target) {
  const button = target.page.locator('button[aria-label="Envoyer"]');
  if (target.platform !== 'android') { await button.click(); return; }
  await target.page.locator('button.mw-composer-send.is-ready').waitFor({ state: 'visible' });
  if (!await button.isVisible() || !await button.isEnabled()) throw new Error('Bouton Envoyer mobile indisponible.');
  // Attached Android WebViews did not reliably receive coordinate-based input
  // around keyboard resizing. Activate the real rendered control via its DOM
  // click event; keep the product handler, auth and RPC path fully exercised.
  // This validates the messaging flow, not native hit-testing or touch ergonomics.
  await button.dispatchEvent('click');
}

export async function received(target, marker) {
  await target.page.locator('.mw-chat-timeline [data-message-id]').filter({ hasText: marker }).waitFor({ state: 'visible', timeout: 45000 });
}
