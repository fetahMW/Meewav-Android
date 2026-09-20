export type CageProgram = {
  version: 1; title: string; format: 'tournament' | 'championship' | 'open-mic' | 'open-mic-battle';
  participantCount: number; rosterMode: string; rosterProfileIds: string[]; templateId?: string;
  rosterMembers?: { id: string; name: string }[];
  rules: { rounds: number; passageDurationSeconds: number; performanceMode: string; votingMode: string;
    votingDurationSeconds: number; openMicFeedback?: string; tieBreak?: string; [key: string]: unknown };
};
export type SavedCageProgram = { id: string; configuration: CageProgram; profile?: Record<string, unknown>; updatedAt?: number };
export async function readCagePrograms(): Promise<SavedCageProgram[]> {
  const response = await fetch('/native/cage-programs', { cache: 'no-store' });
  if (!response.ok) throw new Error('Les programmes ne sont pas accessibles. Réessaie.');
  return response.json();
}
export async function saveCageProgram(entry: Omit<SavedCageProgram, 'id'> & { id?: string }): Promise<SavedCageProgram> {
  const bytes = new TextEncoder().encode(JSON.stringify(entry));
  const encoded = btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''));
  const response = await fetch('/native/cage-programs', { method: 'POST', headers: { 'X-Meewav-Program': encoded } });
  if (!response.ok) throw new Error('Le programme n’a pas été enregistré. Réessaie.');
  return response.json();
}
export async function removeCageProgram(id: string): Promise<void> {
  const response = await fetch('/native/cage-programs?id=' + encodeURIComponent(id), { method: 'DELETE' });
  if (!response.ok) throw new Error('Le programme n’a pas été supprimé.');
}
