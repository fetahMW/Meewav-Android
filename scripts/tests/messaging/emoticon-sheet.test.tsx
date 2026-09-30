import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MessageWorkspace, { type MessagingWorkspaceLiveController } from '../../../app/src/main/messaging-source/vendor/src/features/messaging/MessageWorkspace';
import { MeeWavEmoticonPicker, MEEWAV_EMOTICONS, meewavEmoticonToken } from '../../../app/src/main/messaging-source/vendor/src/features/emoticons/MeewavEmoticons';
import { demoConversations } from '../../../app/src/main/messaging-source/vendor/src/features/messaging/messagingDemoData';

vi.mock('../../../app/src/main/messaging-source/vendor/src/features/messaging/messagingSounds', () => ({ preloadMessageSounds: vi.fn(), playMessageSound: vi.fn() }));
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} unobserve() {} });
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  HTMLElement.prototype.scrollIntoView = vi.fn();
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); document.body.style.overflow = ''; });

function mountDemo() {
  return render(<MemoryRouter><div id="root"><MessageWorkspace /></div></MemoryRouter>);
}
function openMessage(container: HTMLElement, mine = false) {
  const message = container.querySelector<HTMLElement>(`.mw-message.${mine ? 'is-mine' : 'is-theirs'}`)!;
  expect(message).toBeTruthy();
  fireEvent.click(message);
  return { message, sheet: screen.getByRole('dialog', { name: /Actions du message/ }) };
}
const first = MEEWAV_EMOTICONS[0];
const second = MEEWAV_EMOTICONS[1];

describe('Android message reactions in one sheet', () => {
  it('opens the full music catalogue directly and keeps multiple selections in one panel', () => {
    const { container } = mountDemo();
    const { message, sheet } = openMessage(container);
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(within(sheet).queryByRole('button', { name: 'Ouvrir le mur d’émoticônes' })).not.toBeInTheDocument();
    fireEvent.click(within(sheet).getByRole('button', { name: first.label, exact: true }));
    fireEvent.click(within(sheet).getByRole('button', { name: second.label, exact: true }));
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(within(sheet).getByRole('button', { name: first.label, exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(within(sheet).getByRole('button', { name: second.label, exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(within(message).getByRole('img', { name: first.label })).toHaveAttribute('src', first.assetPath);
    expect(within(message).getByRole('button', { name: `Retirer la réaction ${first.label}` }).querySelector('small')).toBeNull();
    fireEvent.click(within(sheet).getByRole('button', { name: first.label, exact: true }));
    expect(within(sheet).getByRole('button', { name: first.label, exact: true })).toHaveAttribute('aria-pressed', 'false');
    expect(within(sheet).getByRole('button', { name: second.label, exact: true })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(within(sheet).getByRole('button', { name: 'Classiques' }));
    fireEvent.click(within(sheet).getByRole('button', { name: 'Feu incroyable' }));
    expect(within(sheet).getByRole('button', { name: 'Feu incroyable' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });

  it('searches music without stealing input navigation keys, and restores focus on dismissal', () => {
    const { container } = mountDemo();
    const { message, sheet } = openMessage(container);
    const search = within(sheet).getByRole('textbox', { name: 'Rechercher une émoticône' });
    search.focus();
    const home = new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true });
    fireEvent(search, home);
    expect(home.defaultPrevented).toBe(false);
    expect(search).toHaveFocus();
    fireEvent.change(search, { target: { value: first.name } });
    expect(within(sheet).getByRole('button', { name: first.label, exact: true })).toBeInTheDocument();
    fireEvent.change(search, { target: { value: 'introuvable-xyz' } });
    expect(within(sheet).getByText('Aucune émoticône trouvée.')).toBeInTheDocument();
    fireEvent.keyDown(search, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(message).toHaveFocus();
    expect(document.getElementById('root')?.inert).toBe(false);
    expect(document.body.style.overflow).toBe('');
  });

  it('closes from the native Back close-button selector without leaving a hidden second panel', () => {
    const { container } = mountDemo();
    const { message } = openMessage(container);
    const close = document.querySelector<HTMLButtonElement>('[role="dialog"] button[aria-label^="Fermer"]')!;
    expect(close).toBeTruthy();
    fireEvent.click(close);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(message).toHaveFocus();
    openMessage(container);
    fireEvent.pointerDown(document.querySelector('.mw-emoji-sheet-backdrop')!);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps reply and inline delete confirmation functional', () => {
    const { container } = mountDemo();
    const { sheet } = openMessage(container);
    fireEvent.click(within(sheet).getByRole('button', { name: 'Répondre' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(container.querySelector('.mw-composer-reply')).toBeTruthy();
    const { message, sheet: ownSheet } = openMessage(container, true);
    fireEvent.click(within(ownSheet).getByRole('button', { name: 'Supprimer' }));
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(within(ownSheet).queryByRole('textbox')).not.toBeInTheDocument();
    fireEvent.click(within(ownSheet).getByRole('button', { name: 'Annuler' }));
    expect(within(ownSheet).getByRole('textbox')).toBeInTheDocument();
    fireEvent.click(within(ownSheet).getByRole('button', { name: 'Supprimer' }));
    fireEvent.click(within(ownSheet).getByRole('button', { name: 'Supprimer' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(message).toHaveTextContent('Message supprimé');
  });

  it('uses live reaction ownership rather than counts to decide whether to add or remove', () => {
    const setReaction = vi.fn();
    const conversation = demoConversations[0];
    const message = { ...conversation.messages[0], reactions: ['🎧 2', `${meewavEmoticonToken(first.name)} 1`] };
    const controller = {
      conversations: [conversation], selectedConversation: conversation, selectedConversationId: conversation.id,
      messages: [message], inboxStatus: 'ready', messagesStatus: 'ready',
      isReactionActiveByMe: (_id: string, emoji: string) => emoji === meewavEmoticonToken(first.name),
      setReaction, selectConversation: vi.fn(), retryInbox: vi.fn(), retryMessages: vi.fn(), sendText: vi.fn(), retryMessage: vi.fn(),
    } as unknown as MessagingWorkspaceLiveController;
    const { container } = render(<MemoryRouter><div id="root"><MessageWorkspace liveController={controller} /></div></MemoryRouter>);
    const { sheet } = openMessage(container);
    expect(within(sheet).getByRole('button', { name: first.label, exact: true })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(within(sheet).getByRole('button', { name: first.label, exact: true }));
    expect(setReaction).toHaveBeenLastCalledWith(message.id, meewavEmoticonToken(first.name), false);
    fireEvent.click(within(sheet).getByRole('button', { name: 'Classiques' }));
    expect(within(sheet).getByRole('button', { name: 'Casque écoute' })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(within(sheet).getByRole('button', { name: 'Casque écoute' }));
    expect(setReaction).toHaveBeenLastCalledWith(message.id, '🎧', true);
    expect(container.querySelector('.mw-message__reactions small')).toHaveTextContent('2');
  });
});

describe('Android composer emoji sheet', () => {
  it('inserts several music and classic emojis without closing, then restores trigger focus', () => {
    function Composer() {
      const [value, setValue] = useState('');
      return <><output>{value}</output><MeeWavEmoticonPicker onSelect={item => setValue(current => current + meewavEmoticonToken(item.name))} onSelectUnicode={emoji => setValue(current => current + emoji)} /></>;
    }
    render(<Composer />);
    const trigger = screen.getByRole('button', { name: 'Ajouter une émoticône MeeWav' });
    fireEvent.click(trigger);
    const sheet = screen.getByRole('dialog', { name: 'Émoticônes' });
    fireEvent.click(within(sheet).getByRole('button', { name: first.label, exact: true }));
    fireEvent.click(within(sheet).getByRole('button', { name: second.label, exact: true }));
    fireEvent.click(within(sheet).getByRole('button', { name: 'Classiques' }));
    fireEvent.click(within(sheet).getByRole('button', { name: 'Feu incroyable' }));
    expect(screen.getByRole('status')).toHaveTextContent(meewavEmoticonToken(first.name) + meewavEmoticonToken(second.name) + '🔥');
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    fireEvent.click(within(sheet).getByRole('button', { name: 'Fermer les émoticônes' }));
    expect(trigger).toHaveFocus();
  });

  it('traps focus and keeps unsupported classic insertion out of other composers', () => {
    render(<MeeWavEmoticonPicker onSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter une émoticône MeeWav' }));
    const sheet = screen.getByRole('dialog');
    expect(within(sheet).queryByRole('button', { name: 'Classiques' })).not.toBeInTheDocument();
    const close = within(sheet).getByRole('button', { name: 'Fermer les émoticônes' });
    const buttons = within(sheet).getAllByRole('button');
    close.focus();
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(buttons.at(-1)).toHaveFocus();
    fireEvent.keyDown(buttons.at(-1)!, { key: 'Tab' });
    expect(close).toHaveFocus();
  });
});
