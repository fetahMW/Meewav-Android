export function openArtistMessaging(artist: { id: string; name: string; role: string; portraitUrl: string; gradeLevel?: number | null }) {
  // These portraits belong to the globe's existing demo. Never reinterpret a
  // fixture identifier as the identity of a real Supabase recipient.
  const avatar = new URL(artist.portraitUrl, document.baseURI);
  const params = new URLSearchParams({ space: 'messages', intent: 'message', source: 'globe', mode: 'demo',
    mockArtistId: artist.id, mockArtistName: artist.name, mockArtistRole: artist.role,
    mockArtistAvatar: avatar.origin === location.origin ? avatar.pathname : '/avatars/utilisateur.png' });
  if (artist.gradeLevel != null) params.set('mockArtistGradeLevel', String(artist.gradeLevel));
  window.dispatchEvent(new CustomEvent('meewav:navigate', { detail: { path: `/messages?${params}` }, cancelable: true }));
}
