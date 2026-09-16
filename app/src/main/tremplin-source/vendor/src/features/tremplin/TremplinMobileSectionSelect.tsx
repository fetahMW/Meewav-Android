// Android-only navigation adapter; all section content and callbacks stay Web-owned.
import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
export default function TremplinMobileSectionSelect<T extends string>({ value, options, onChange, label = 'Contenu de Mes artistes' }: {
  value: T; options: readonly (readonly [T, string])[]; onChange: (value: T) => void; label?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const listId = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => { if (e.target instanceof Node && !root.current?.contains(e.target)) setOpen(false); };
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  return <div className="mobile-tremplin-section" ref={root}>
    <button ref={trigger} type="button" aria-expanded={open} aria-controls={listId} aria-label={`${label} : ${options.find(([id]) => id === value)?.[1] ?? 'Aperçu'}`} onClick={() => setOpen(!open)}>
      <span>{options.find(([id]) => id === value)?.[1] ?? 'Aperçu'}</span><ChevronDown size={18} style={{ transform: open ? 'rotate(180deg)' : undefined }} />
    </button>
    {open && <div id={listId} role="navigation" aria-label={label}>{options.map(([id, label]) => <button key={id} type="button" aria-current={value === id ? 'page' : undefined}
      onClick={() => { onChange(id); setOpen(false); trigger.current?.focus({ preventScroll: true }); }}>{label}</button>)}</div>}
  </div>;
}
