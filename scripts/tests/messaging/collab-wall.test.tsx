import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CollabsWorkspace, { type CollabsWorkspaceLiveController } from '../../../app/src/main/messaging-source/vendor/src/features/messaging/CollabsWorkspace';
import type { DemoCollab } from '../../../app/src/main/messaging-source/vendor/src/features/messaging/messagingDemoData';

afterEach(cleanup);
const request = (id: string, name: string): DemoCollab => Object.assign({
  id, name, userId: `profile-${id}`, role: 'Beatmaker', avatar: '/avatars/utilisateur.png',
  verified: false, message: `Message privé de ${name}`, meta: '2 h', rank: 3,
  status: 'pending' as const, isReceived: true, requestStatus: 'pending' as const, attachments: [],
}, { server: { canAccept: true, canDecline: true, relationshipBlocked: false } });

describe('Android collaboration wall', () => {
  it('keeps processing received requests after accepting or rejecting, without opening chat', async () => {
    const onOpenConversation = vi.fn();
    const accepted = vi.fn();
    const declined = vi.fn();
    function Inbox() {
      const [items, setItems] = useState([request('one', 'Nadir'), request('two', 'Maya')]);
      const liveController: CollabsWorkspaceLiveController = {
        markViewed: vi.fn(), cancelRequest: vi.fn(), isMutating: () => false, status: 'ready',
        acceptRequest: async (id) => { accepted(id); setItems(current => current.map(item => item.id === id ? { ...item, status: 'accepted', requestStatus: 'accepted' } : item)); },
        declineRequest: async (id) => { declined(id); setItems(current => current.filter(item => item.id !== id)); },
      };
      return <CollabsWorkspace collabs={items} liveController={liveController} onOpenConversation={onOpenConversation} />;
    }
    render(<MemoryRouter><Inbox /></MemoryRouter>);
    expect(screen.queryByText('Message privé de Nadir')).not.toBeInTheDocument();
    fireEvent.click(within(screen.getByRole('article', { name: 'Demande de collab de Nadir' })).getByRole('button', { name: 'Accepter' }));
    await waitFor(() => expect(screen.queryByRole('article', { name: 'Demande de collab de Nadir' })).not.toBeInTheDocument());
    expect(accepted).toHaveBeenCalledWith('one');
    expect(screen.getByRole('button', { name: /Reçus1/ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(within(screen.getByRole('article', { name: 'Demande de collab de Maya' })).getByRole('button', { name: 'Refuser' }));
    await waitFor(() => expect(screen.getByText('Aucune demande de collab reçue')).toBeInTheDocument());
    expect(declined).toHaveBeenCalledWith('two');
    expect(onOpenConversation).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Acceptées1/ }));
    expect(screen.getByRole('article', { name: 'Demande de collab de Nadir' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir la conversation avec Nadir' }));
    expect(onOpenConversation).toHaveBeenCalledWith(expect.objectContaining({ id: 'one', status: 'accepted' }));
  });

  it('only opens the contact on an explicit click, and shows the message in the conversation card', () => {
    const collab = request('three', 'Léa');
    const onOpenConversation = vi.fn();
    const markViewed = vi.fn();
    const liveController: CollabsWorkspaceLiveController = { markViewed, acceptRequest: vi.fn(), declineRequest: vi.fn(), cancelRequest: vi.fn(), isMutating: () => false };
    const { rerender } = render(<MemoryRouter><CollabsWorkspace collabs={[collab]} liveController={liveController} onOpenConversation={onOpenConversation} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('article', { name: 'Demande de collab de Léa' }));
    expect(onOpenConversation).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir la conversation avec Léa' }));
    expect(onOpenConversation).toHaveBeenCalledWith(collab);
    expect(markViewed).toHaveBeenCalledWith('three');
    rerender(<MemoryRouter><CollabsWorkspace collabs={[collab]} liveController={liveController} pinnedCollabId="three" /></MemoryRouter>);
    expect(screen.getByText('Message privé de Léa')).toBeInTheDocument();
  });

  it('honours server permissions and disables decisions during mutation', () => {
    const collab = request('four', 'Sam');
    const liveController: CollabsWorkspaceLiveController = { markViewed: vi.fn(), acceptRequest: vi.fn(), declineRequest: vi.fn(), cancelRequest: vi.fn(), isMutating: () => true };
    const { rerender } = render(<MemoryRouter><CollabsWorkspace collabs={[collab]} liveController={liveController} /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Accepter' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Refuser' })).toBeDisabled();
    Object.assign(collab, { server: { canAccept: false, canDecline: false } });
    rerender(<MemoryRouter><CollabsWorkspace collabs={[collab]} liveController={liveController} /></MemoryRouter>);
    expect(screen.queryByRole('button', { name: 'Accepter' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Refuser' })).not.toBeInTheDocument();
  });
});
