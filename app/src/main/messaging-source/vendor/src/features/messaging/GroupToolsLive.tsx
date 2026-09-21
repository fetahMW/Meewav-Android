import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { CalendarClock, Check, CheckCircle2, Clock3, Plus, Vote } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import './group-tools-live.css';

type Tool = {
  id: string; kind: 'session' | 'decision'; title: string; startsAt: string | null; place: string | null;
  options: string[] | null; status: 'open' | 'closed' | 'cancelled'; canManage: boolean;
  memberCount: number; responseCount: number; confirmedCount: number;
  myChoice: number | null; myAttendance: boolean | null; counts: Record<string, number>;
};
const dateLabel = (value: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

/** Real coordination panel. The existing investor fixtures keep their own view. */
export default function GroupToolsLive({ groupId, kind, revision, readOnly = false }: {
  groupId: string; kind: Tool['kind']; revision?: unknown; readOnly?: boolean;
}) {
  const [items, setItems] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pages, setPages] = useState(1);
  const [more, setMore] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Tool | null>(null);
  const [title, setTitle] = useState('');
  const [starts, setStarts] = useState('');
  const [place, setPlace] = useState('');
  const [options, setOptions] = useState('');
  const [choices, setChoices] = useState<Record<string, number>>({});
  const sequence = useRef(0), mounted = useRef(true), mutation = useRef(false);
  const drafts = useRef(new Map<string, string>());
  const refresh = useCallback(async () => {
    const current = ++sequence.current;
    const collected: Tool[] = [];
    let cursor: string | null = null, hasMore = false;
    try {
      for (let page = 0; page < pages; page++) {
        const { data, error: loadError } = await supabase.rpc('list_artist_group_tools_v1', {
          p_group_id: groupId, p_kind: kind, p_before: cursor,
        });
        if (loadError || !Array.isArray(data)) throw Error('load');
        hasMore = data.length > 50;
        collected.push(...data.slice(0, 50));
        if (!hasMore) break;
        cursor = collected.at(-1)!.id;
      }
      if (mounted.current && sequence.current === current) { setItems(collected); setMore(hasMore); setError(null); }
    } catch {
      if (mounted.current && sequence.current === current) {
        setError('Impossible de charger les informations du groupe. Réessaie.');
        // Never leave another member's former projection visible after access loss.
        setItems([]);
      }
    } finally { if (mounted.current && sequence.current === current) setLoading(false); }
  }, [groupId, kind, pages]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; ++sequence.current; };
  }, []);
  // Parent refreshes group detail on its existing private Realtime subscription.
  useEffect(() => { void refresh(); }, [refresh, revision]);
  useEffect(() => {
    const refreshVisible = () => { if (!document.hidden) void refresh(); };
    const timer = window.setInterval(refreshVisible, 20000);
    window.addEventListener('focus', refreshVisible);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refreshVisible); };
  }, [refresh]);

  const mutate = async (id: string, action: string, payload: Record<string, unknown> = {}) => {
    if (mutation.current || readOnly) return false;
    mutation.current = true; setBusy(true); setError(null);
    try {
      const { error: actionError } = await supabase.rpc('mutate_artist_group_tool_v1', {
        p_group_id: groupId, p_item_id: id, p_action: action, p_payload: payload,
      });
      if (actionError) throw actionError;
      await refresh();
      return true;
    } catch (failure) {
      if (mounted.current) {
        const code = (failure as { code?: string }).code;
        setError(code === '42501' ? 'Ton accès ne permet plus cette action.'
          : code === '55000' ? 'Cette session ou décision est déjà terminée.'
          : 'La modification n’a pas été confirmée. Tu peux réessayer.');
      }
      return false;
    } finally { mutation.current = false; if (mounted.current) setBusy(false); }
  };
  const create = async (event: FormEvent) => {
    event.preventDefault();
    const list = options.split(',').map(v => v.trim()).filter(Boolean);
    const time = new Date(starts);
    if (title.trim().length < 2 || (kind === 'session' && (!Number.isFinite(time.getTime()) || time.getTime() <= Date.now()))
      || (kind === 'decision' && (list.length < 2 || list.length > 8 || new Set(list.map(v => v.toLowerCase())).size !== list.length))) {
      setError(kind === 'session' ? 'Indique un titre et une date future.' : 'Indique un titre et 2 à 8 options distinctes.'); return;
    }
    const payload = kind === 'session' ? { kind, title: title.trim(), startsAt: time.toISOString(), place: place.trim() }
      : { kind, title: title.trim(), options: list };
    if (editing) {
      if (mutation.current || readOnly) return;
      mutation.current = true; setBusy(true); setError(null);
      try {
        const { error: failure } = await supabase.rpc('edit_artist_group_session_v1', {
          p_group_id: groupId, p_item_id: editing.id,
          p_expected: { title: editing.title, startsAt: editing.startsAt, place: editing.place },
          p_title: title.trim(), p_starts_at: time.toISOString(), p_place: place.trim(),
        });
        if (failure) throw failure;
        setEditing(null); setFormOpen(false); setTitle(''); setStarts(''); setPlace('');
        await refresh();
      } catch (failure) {
        setError((failure as { code?: string }).code === '40001'
          ? 'La session a changé. Actualise avant de la modifier.' : 'Modification non confirmée. Tu peux réessayer.');
      } finally { mutation.current = false; if (mounted.current) setBusy(false); }
      return;
    }
    const fingerprint = JSON.stringify(payload);
    let id = drafts.current.get(fingerprint);
    if (!id) { id = crypto.randomUUID(); drafts.current.set(fingerprint, id); }
    if (await mutate(id, 'create', payload)) {
      drafts.current.delete(fingerprint);
      if (mounted.current) { setFormOpen(false); setTitle(''); setStarts(''); setPlace(''); setOptions(''); }
    }
  };
  const open = items.filter(item => item.status === 'open' && (kind === 'decision' || Date.parse(item.startsAt!) > Date.now()));
  const finished = items.filter(item => !open.includes(item));
  const renderItem = (item: Tool, active: boolean) => <article className={kind === 'session' ? 'agw-next-session' : 'agw-decision-card'} key={item.id}>
    <div className='agw-next-session__primary'>
      <h3>{item.title}</h3>
      {kind === 'session' ? <>
        <p className='agw-next-session__time'><Clock3 size={18} />{dateLabel(item.startsAt!)}</p>
        {item.place && <p>{item.place}</p>}
        <p>{item.confirmedCount} confirmé{item.confirmedCount > 1 ? 's' : ''} · {Math.max(0, item.memberCount - item.responseCount)} en attente</p>
        {active && !readOnly && <div className='agw-next-session__actions'>
          <button className={item.myAttendance === true ? 'agw-primary-button is-small' : 'agw-secondary-button is-small'} disabled={busy} onClick={() => void mutate(item.id, 'respond', { attending: true })}><Check size={16} />{item.myAttendance === true ? 'Présence confirmée' : 'Confirmer'}</button>
          <button className='agw-secondary-button is-small' disabled={busy} onClick={() => void mutate(item.id, 'respond', { attending: false })}>{item.myAttendance === false ? 'Absence enregistrée' : 'Indisponible'}</button>
        </div>}
      </> : <>
        <p>{item.responseCount} vote{item.responseCount > 1 ? 's' : ''}</p>
        <div className='agw-vote-options'>{item.options?.map((option, index) => <button type='button' key={index}
          disabled={!active || busy || readOnly} className={(choices[item.id] ?? item.myChoice) === index ? 'is-selected' : ''}
          onClick={() => setChoices(current => ({ ...current, [item.id]: index }))}>
          {option} · {item.counts[String(index)] ?? 0}{item.myChoice === index && <Check size={15} />}
        </button>)}</div>
        {active && !readOnly && <button className='agw-primary-button' disabled={busy || (choices[item.id] ?? item.myChoice) === null}
          onClick={() => void mutate(item.id, 'respond', { choice: choices[item.id] ?? item.myChoice })}>
          {item.myChoice === null ? 'Valider mon vote' : 'Modifier mon vote'}
        </button>}
      </>}
      {active && !readOnly && item.canManage && kind === 'session' && <button className='agw-secondary-button is-small' disabled={busy} onClick={() => {
        const date = new Date(item.startsAt!);
        setEditing(item); setTitle(item.title); setPlace(item.place ?? '');
        setStarts(new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0,16)); setFormOpen(true);
      }}>Modifier</button>}
      {active && !readOnly && item.canManage && <button className='agw-secondary-button is-small' disabled={busy}
        onClick={() => void mutate(item.id, kind === 'session' ? 'cancel' : 'close')}>
        {kind === 'session' ? 'Annuler la session' : 'Clôturer le vote'}
      </button>}
      {!active && <small>{item.status === 'cancelled' ? 'Annulée' : 'Terminée'}</small>}
    </div>
  </article>;
  return <div className='agw-subview agw-planning-subview agw-tools-live'>
    <div className='agw-subview__heading'><div><small>{kind === 'session' ? 'COORDINATION' : 'VOTE DU GROUPE'}</small>
      <h2>{kind === 'session' ? 'Sessions du groupe' : 'Décider ensemble'}</h2></div>
      {!readOnly && <button className='agw-primary-button is-small' disabled={busy} aria-expanded={formOpen} onClick={() => {setEditing(null);setTitle('');setStarts('');setPlace('');setFormOpen(!formOpen);}}><Plus size={18} />{kind === 'session' ? 'Ajouter' : 'Nouveau'}</button>}
    </div>
    {error && <div role='alert' className='agw-empty-inline'><span>{error}</span><button className='agw-secondary-button' onClick={() => void refresh()}>Actualiser</button></div>}
    {readOnly && <p>Groupe archivé · consultation uniquement</p>}
    {formOpen && !readOnly && <form className='agw-inline-form' onSubmit={create}>
      <h3>{editing ? 'Modifier la session' : kind === 'session' ? 'Nouvelle session' : 'Nouvelle décision'}</h3>
      {editing && <p>Changer la date ou le lieu demandera aux membres de confirmer à nouveau leur présence.</p>}
      <label><span>Titre</span><input required minLength={2} maxLength={160} value={title} disabled={busy} onChange={e => setTitle(e.target.value)} /></label>
      {kind === 'session' ? <>
        <label><span>Date et heure</span><input type='datetime-local' required value={starts} disabled={busy} onChange={e => setStarts(e.target.value)} /></label>
        <label><span>Lieu</span><input maxLength={240} value={place} disabled={busy} onChange={e => setPlace(e.target.value)} /></label>
      </> : <label><span>Options, séparées par des virgules</span><input required maxLength={960} value={options} disabled={busy} onChange={e => setOptions(e.target.value)} /></label>}
      <div><button type='button' className='agw-secondary-button' disabled={busy} onClick={() => setFormOpen(false)}>Annuler</button>
        <button type='submit' className='agw-primary-button' disabled={busy}>{busy ? 'Enregistrement…' : editing ? 'Enregistrer' : kind === 'session' ? 'Créer' : 'Publier'}</button></div>
    </form>}
    {loading ? <p role='status'>Chargement…</p> : <>
      {!error && open.length === 0 && <div className='agw-empty-inline'>{kind === 'session' ? <CalendarClock /> : <Vote />}<strong>{kind === 'session' ? 'Aucune session à venir' : 'Aucune décision en attente'}</strong></div>}
      {open.map(item => renderItem(item, true))}
      {finished.length > 0 && <div className='agw-section-title'><CheckCircle2 size={16} /><span>HISTORIQUE</span></div>}
      {finished.map(item => renderItem(item, false))}
      {more && <button className='agw-secondary-button' onClick={() => setPages(value => value + 1)}>Afficher la suite</button>}
    </>}
  </div>;
}
