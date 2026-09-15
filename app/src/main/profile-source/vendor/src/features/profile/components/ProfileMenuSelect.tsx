import { Check, ChevronDown, type LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Option<T extends string> = { value: T; label: string; detail?: string; icon?: LucideIcon; count?: string | number };

/** One compact destination/filter control; the menu is outside scrolling and blur containers. */
export default function ProfileMenuSelect<T extends string>({ label, value, options, onChange, variant = "navigation" }: {
  label: string; value: T; options: Option<T>[]; onChange: (value: T) => void; variant?: "navigation" | "filter";
}) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);
  const selected = options.find(option => option.value === value) ?? options[0];
  const Icon = selected.icon;
  const close = () => { setPosition(null); trigger.current?.focus({ preventScroll: true }); };
  useEffect(() => {
    if (!position) return;
    menu.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus({ preventScroll: true });
    const resize = () => setPosition(null);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [position]);
  useEffect(() => setPosition(null), [value]);

  return <div className={`profile-menu-select is-${variant}`}>
    <button ref={trigger} type="button" className="profile-menu-select__trigger" aria-label={`${label} : ${selected.label}`} aria-haspopup="menu" aria-expanded={Boolean(position)} aria-controls={position ? id : undefined} onClick={() => {
      if (position) { close(); return; }
      const rect = trigger.current!.getBoundingClientRect();
      const width = variant === "navigation" ? window.innerWidth - 24 : Math.min(288, window.innerWidth - 24);
      const top = rect.bottom + 6;
      setPosition({ top, left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)), width, maxHeight: Math.max(120, window.innerHeight - top - 94) });
    }}>
      {Icon && <Icon size={18} />}<strong>{selected.label}</strong>
      {selected.count !== undefined && <small>{selected.count}</small>}<ChevronDown size={16} />
    </button>
    {position && createPortal(<div className="profile-menu-layer">
      <div className="profile-menu-scrim" onPointerDown={close} aria-hidden="true" />
      <div ref={menu} id={id} className="profile-menu-options" role="menu" aria-label={label} style={position} onKeyDown={event => {
        if (event.key === "Escape" || event.key === "Tab") { if (event.key === "Escape") event.preventDefault(); close(); return; }
        const buttons = [...menu.current!.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')];
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const next = event.key === "ArrowDown" ? (index + 1) % buttons.length : event.key === "ArrowUp" ? (index - 1 + buttons.length) % buttons.length : event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : null;
        if (next !== null) { event.preventDefault(); buttons[next]?.focus(); }
      }}>
        {options.map(option => { const OptionIcon = option.icon; return <button key={option.value} type="button" role="menuitemradio" aria-checked={option.value === value} onClick={() => { close(); onChange(option.value); }}>
          {OptionIcon && <OptionIcon size={20} />}<span><strong>{option.label}</strong>{option.detail && <small>{option.detail}</small>}</span>
          {option.count !== undefined && <em>{option.count}</em>}{option.value === value && <Check size={17} />}
        </button>; })}
      </div>
    </div>, document.body)}
  </div>;
}
