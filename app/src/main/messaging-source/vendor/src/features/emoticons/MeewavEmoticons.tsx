import { Search, SmilePlus, X } from "lucide-react";
import {
  Fragment,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import manifestJson from "./meewav-emoticons.manifest.json";
import manifestV2Json from "./meewav-emoticons-v2.manifest.json";
import manifestV3Json from "./meewav-emoticons-v3.manifest.json";
import manifestV4Json from "./meewav-emoticons-v4.manifest.json";
import manifestV5Json from "./meewav-emoticons-v5.manifest.json";
import manifestV6Json from "./meewav-emoticons-v6.manifest.json";
import "./meewav-emoticons.css";

type ManifestItem = {
  id: number;
  name: string;
  label: string;
  category: string;
  keywords?: string[];
  tags?: string[];
};

type Manifest = {
  name?: string;
  version?: string;
  count: number;
  items: ManifestItem[];
};

const manifest = manifestJson as Manifest;
const manifestV2 = manifestV2Json as Manifest;
const manifestV3 = manifestV3Json as Manifest;
const manifestV4 = manifestV4Json as Manifest;
const manifestV5 = manifestV5Json as Manifest;
const manifestV6 = manifestV6Json as Manifest;
const TOKEN_PATTERN = /\[\[mw:([a-z0-9-]+)\]\]/giu;
type CatalogItem = ManifestItem & {
  assetName: string;
  assetPath: string;
  pack: "v1" | "v2" | "v3" | "v4" | "v5" | "v6";
};

const catalog: CatalogItem[] = [
  ...manifest.items.map((item) => ({
    ...item,
    assetName: item.name,
    assetPath: `/meewav-emojis/webp/256/${item.name}.webp`,
    pack: "v1" as const,
  })),
  ...manifestV2.items.map((item) => ({
    ...item,
    name: `v2-${item.name}`,
    assetName: item.name,
    assetPath: `/meewav-emojis/v2/webp/256/${item.name}.webp`,
    pack: "v2" as const,
  })),
  ...manifestV3.items.map((item) => ({ ...item, keywords: item.keywords ?? item.tags, name: `v3-${item.name}`, assetName: item.name, assetPath: `/meewav-emojis/v3/webp/256/${item.name}.webp`, pack: "v3" as const })),
  ...manifestV4.items.map((item) => ({ ...item, keywords: item.keywords ?? item.tags, name: `v4-${item.name}`, assetName: item.name, assetPath: `/meewav-emojis/v4/webp/256/${item.name}.webp`, pack: "v4" as const })),
  ...manifestV5.items.map((item) => ({ ...item, keywords: item.keywords ?? item.tags, name: `v5-${item.name}`, assetName: item.name, assetPath: `/meewav-emojis/v5/webp/256/${item.name}.webp`, pack: "v5" as const })),
  ...manifestV6.items.map((item) => ({ ...item, keywords: item.keywords ?? item.tags, name: `v6-${item.name}`, assetName: item.name, assetPath: `/meewav-emojis/v6/webp/256/${item.name}.webp`, pack: "v6" as const })),
];
const itemsByName = new Map(catalog.map((item) => [item.name, item]));

export type MeeWavEmoticon = CatalogItem;
export type MeeWavEmoticonName = MeeWavEmoticon["name"];

export const MEEWAV_EMOTICONS = catalog as readonly MeeWavEmoticon[];

export function meewavEmoticonToken(name: MeeWavEmoticonName) {
  return `[[mw:${name}]]`;
}

export function meewavEmoticonLabel(value: string) {
  const match = /^\[\[mw:([a-z0-9-]+)\]\]$/u.exec(value);
  return match ? itemsByName.get(match[1])?.label ?? "Émoticône MeeWav" : value;
}

export function appendMeeWavEmoticon(
  value: string,
  name: MeeWavEmoticonName,
  maxLength?: number,
) {
  const token = meewavEmoticonToken(name);
  const next = `${value}${value && !/\s$/u.test(value) ? " " : ""}${token}`;
  // An emoticon token is atomic. Returning a sliced token would leak its
  // internal syntax into chat and could never be rendered back as an image.
  return typeof maxLength === "number" && next.length > maxLength ? value : next;
}

export function MeewavEmoticonImage({
  name,
  size = 36,
  className,
  decorative = false,
}: {
  name: MeeWavEmoticonName;
  size?: number;
  className?: string;
  decorative?: boolean;
}) {
  const item = itemsByName.get(name);
  if (!item) return null;
  return (
    <img
      src={item.assetPath}
      alt={decorative ? "" : item.label}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={className}
    />
  );
}

export function MeeWavRichText({
  children,
  emoticonSize = 30,
  className,
}: {
  children: string;
  emoticonSize?: number;
  className?: string;
}) {
  const content = useMemo(() => {
    const nodes: ReactNode[] = [];
    let cursor = 0;
    let match: RegExpExecArray | null;
    TOKEN_PATTERN.lastIndex = 0;
    while ((match = TOKEN_PATTERN.exec(children)) !== null) {
      if (match.index > cursor) nodes.push(children.slice(cursor, match.index));
      const item = itemsByName.get(match[1]);
      if (item) {
        nodes.push(
          <MeewavEmoticonImage
            key={`${match.index}-${item.name}`}
            name={item.name}
            size={emoticonSize}
            className="mw-rich-text__emoticon"
          />,
        );
      } else {
        nodes.push(match[0]);
      }
      cursor = match.index + match[0].length;
    }
    if (cursor < children.length) nodes.push(children.slice(cursor));
    return nodes;
  }, [children, emoticonSize]);

  return <span className={`mw-rich-text${className ? ` ${className}` : ""}`}>{content.map((node, index) => <Fragment key={index}>{node}</Fragment>)}</span>;
}

function composerValue(root: HTMLElement) {
  let value = "";
  const visit = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      value += node.textContent ?? "";
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    const token = node.dataset.mwEmoticonToken;
    if (token) {
      value += token;
      return;
    }
    if (node.tagName === "BR") {
      value += "\n";
      return;
    }
    const block = node !== root && (node.tagName === "DIV" || node.tagName === "P");
    if (block && value && !value.endsWith("\n")) value += "\n";
    node.childNodes.forEach(visit);
  };
  root.childNodes.forEach(visit);
  return value.replace(/\u00a0/gu, " ");
}

function renderComposerValue(root: HTMLElement, value: string) {
  root.replaceChildren();
  let cursor = 0;
  let match: RegExpExecArray | null;
  TOKEN_PATTERN.lastIndex = 0;
  while ((match = TOKEN_PATTERN.exec(value)) !== null) {
    if (match.index > cursor) root.append(document.createTextNode(value.slice(cursor, match.index)));
    const item = itemsByName.get(match[1]);
    if (item) {
      const image = document.createElement("img");
      image.src = item.assetPath;
      image.alt = item.label;
      image.width = 28;
      image.height = 28;
      image.draggable = false;
      image.contentEditable = "false";
      image.dataset.mwEmoticonToken = match[0];
      image.className = "mw-emoticon-composer__image";
      root.append(image);
    } else {
      root.append(document.createTextNode(match[0]));
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < value.length) root.append(document.createTextNode(value.slice(cursor)));
  root.dataset.empty = value ? "false" : "true";
}

export function MeeWavEmoticonComposer({
  value,
  onChange,
  placeholder,
  ariaLabel,
  maxLength,
  disabled = false,
  multiline = false,
  className,
  onKeyDown,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  maxLength?: number;
  disabled?: boolean;
  multiline?: boolean;
  className?: string;
  onKeyDown?: (event: ReactKeyboardEvent<HTMLElement>) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor || composerValue(editor) === value) return;
    const focused = document.activeElement === editor;
    renderComposerValue(editor, value);
    if (focused) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [value]);

  return (
    <div
      ref={editorRef}
      className={`mw-emoticon-composer${multiline ? " is-multiline" : ""}${className ? ` ${className}` : ""}`}
      contentEditable={!disabled}
      suppressContentEditableWarning
      role="textbox"
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      aria-multiline={multiline || undefined}
      tabIndex={disabled ? -1 : 0}
      data-placeholder={placeholder}
      data-empty={value ? "false" : "true"}
      onInput={(event) => {
        const next = composerValue(event.currentTarget);
        if (typeof maxLength === "number" && next.length > maxLength) {
          renderComposerValue(event.currentTarget, value);
          return;
        }
        event.currentTarget.dataset.empty = next ? "false" : "true";
        onChange(next);
      }}
      onPaste={(event) => {
        event.preventDefault();
        const text = event.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, text);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.key !== "Enter" || multiline || event.shiftKey) return;
        event.preventDefault();
        event.currentTarget.closest("form")?.requestSubmit();
      }}
    />
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  all: "Tout",
  reaction: "Réactions",
  live: "Live",
  studio: "Studio",
  instrument: "Instruments",
  dj: "DJ",
  production: "Production",
  music: "Musique",
  digital: "Digital",
  community: "Communauté",
  creation: "Création",
  brand: "MeeWav",
  reward: "Récompenses",
  audio: "Audio",
  badge: "Badges",
  discovery: "Découverte",
  promotion: "Promo",
  video: "Vidéo",
  shorts: "Shorts",
  messaging: "Messages",
  collaboration: "Collab",
  announcement: "Annonce",
  dance: "Danse",
  performance: "Performance",
};

const CLASSIC_EMOJIS = [
  ["❤️", "Cœur amour"], ["🔥", "Feu incroyable"], ["👏", "Bravo applaudissements"],
  ["🎧", "Casque écoute"], ["👍", "Pouce oui"], ["✨", "Étincelles"],
  ["😍", "Admiration"], ["😂", "Rire"], ["🥹", "Émotion"], ["🙌", "Célébration"],
  ["💯", "Cent parfait"], ["🙏", "Merci"], ["😎", "Cool"], ["🤩", "Émerveillé"],
  ["🥰", "Affection"], ["😊", "Sourire"], ["😁", "Heureux"], ["🤔", "Réflexion"],
  ["👀", "Regard"], ["💪", "Force"], ["🤝", "Accord"], ["✅", "Validé"],
  ["🎵", "Note musique"], ["🎶", "Notes musique"], ["🎤", "Micro chant"],
  ["🎸", "Guitare"], ["🥁", "Batterie"], ["🎹", "Piano clavier"],
  ["🎺", "Trompette"], ["🎷", "Saxophone"], ["🎻", "Violon"], ["🎚️", "Mixage fader"],
  ["💜", "Cœur violet"], ["🚀", "Décollage"], ["🏆", "Trophée"], ["⭐", "Étoile"],
  ["💎", "Diamant"], ["🎉", "Fête"], ["🤟", "Rock"], ["🫶", "Cœur mains"],
] as const;
const searchText = (value: string) => value.toLocaleLowerCase("fr-FR").normalize("NFD").replace(/\p{Diacritic}/gu, "");

/** One Android sheet, shared by message reactions and composer insertion. */
export function MeeWavEmoticonSheet({
  title = "Émoticônes", label, preview, onSelectValue, onClose, restoreFocusTo,
  selectedValues = [], includeClassics = true, children, hideLibrary = false,
}: {
  title?: string;
  label?: string;
  preview?: { author: string; body: string };
  onSelectValue: (value: string) => void;
  onClose: () => void;
  restoreFocusTo?: HTMLElement | null;
  selectedValues?: readonly string[];
  includeClassics?: boolean;
  children?: ReactNode;
  hideLibrary?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();
  const categories = useMemo(() => ["all", ...(includeClassics ? ["classic"] : []),
    ...Array.from(new Set(MEEWAV_EMOTICONS.map(item => item.category))),
  ], [includeClassics]);
  const entries = useMemo(() => {
    const normalized = searchText(query.trim());
    const custom = category === "classic" ? [] : MEEWAV_EMOTICONS
      .filter(item => (category === "all" || item.category === category)
        && (!normalized || searchText(item.label + " " + item.name + " " + (item.keywords ?? []).join(" ")).includes(normalized)))
      .map(item => ({ value: meewavEmoticonToken(item.name), label: item.label, name: item.name }));
    const classic = includeClassics && (category === "all" || category === "classic")
      ? CLASSIC_EMOJIS.filter(([emoji, text]) => !normalized || searchText(text + " " + emoji).includes(normalized))
        .map(([value, text]) => ({ value, label: text, name: null })) : [];
    return [...custom, ...classic];
  }, [category, query, includeClassics]);

  useLayoutEffect(() => {
    const root = document.getElementById("root");
    const previousInert = root?.inert ?? false;
    const previousOverflow = document.body.style.overflow;
    if (root) root.inert = true;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus({ preventScroll: true });
    const fitViewport = () => {
      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight;
      sheetRef.current?.parentElement?.style.setProperty("--mw-sheet-height", height + "px");
      sheetRef.current?.parentElement?.style.setProperty("--mw-sheet-top", (viewport?.offsetTop ?? 0) + "px");
      sheetRef.current?.classList.toggle("is-compact", height < 500);
    };
    fitViewport();
    window.visualViewport?.addEventListener("resize", fitViewport);
    window.visualViewport?.addEventListener("scroll", fitViewport);
    window.addEventListener("resize", fitViewport);
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
      } else if (event.key === "Tab") {
        const controls = Array.from(sheetRef.current?.querySelectorAll<HTMLElement>("*") ?? [])
          .filter(element => element.tabIndex >= 0 && !element.matches(":disabled"));
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && (document.activeElement === first || !sheetRef.current?.contains(document.activeElement))) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !sheetRef.current?.contains(document.activeElement))) {
          event.preventDefault(); first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      window.visualViewport?.removeEventListener("resize", fitViewport);
      window.visualViewport?.removeEventListener("scroll", fitViewport);
      window.removeEventListener("resize", fitViewport);
      if (root) root.inert = previousInert;
      document.body.style.overflow = previousOverflow;
      if (restoreFocusTo?.isConnected) restoreFocusTo.focus({ preventScroll: true });
    };
  }, [restoreFocusTo]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="mw-emoji-sheet-backdrop" onClick={event => event.stopPropagation()} onPointerDown={event => {
      event.stopPropagation();
      // Dismiss only a deliberate tap on the scrim, never a drag in the catalogue.
      if (event.target === event.currentTarget) onCloseRef.current();
    }}>
      <div ref={sheetRef} className={"mw-emoji-sheet" + (hideLibrary ? " is-actions-only" : "")} role="dialog" aria-modal="true" aria-label={label} aria-labelledby={label ? undefined : titleId}>
        <div className="mw-emoji-sheet__handle" aria-hidden="true" />
        <header className="mw-emoji-sheet__header">
          <span className="mw-emoji-sheet__mark"><MeewavEmoticonImage name="coeur-casque" size={40} decorative /></span>
          <span><strong id={titleId}>{title}</strong><small>{hideLibrary ? "Actions du message" : preview ? "Plusieurs réactions possibles" : "Tes créations musicales et tes émojis"}</small></span>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Fermer les émoticônes"><X aria-hidden="true" /></button>
        </header>
        {preview && <aside className="mw-emoji-sheet__preview"><small>{preview.author}</small><p><MeeWavRichText emoticonSize={22}>{preview.body}</MeeWavRichText></p></aside>}
        {!hideLibrary && <>
          <label className="mw-emoji-sheet__search"><Search aria-hidden="true" /><input aria-label="Rechercher une émoticône" value={query} onChange={event => setQuery(event.currentTarget.value)} placeholder="Rechercher une vibe…" /></label>
          <nav className="mw-emoji-sheet__categories" aria-label="Catégories d’émoticônes">
            {categories.map(id => <button key={id} type="button" aria-pressed={category === id} onClick={() => setCategory(id)}>{id === "classic" ? "Classiques" : id === "all" ? "Tout" : CATEGORY_LABELS[id] ?? id}</button>)}
          </nav>
          <div className="mw-emoji-sheet__grid" role="group" aria-label="Émoticônes">
            {entries.map(item => <button type="button" key={item.value} title={item.label} aria-label={item.label} aria-pressed={preview ? selectedValues.includes(item.value) : undefined} onClick={() => onSelectValue(item.value)}>
              {item.name ? <MeewavEmoticonImage name={item.name} size={60} decorative /> : <span className="mw-emoji-sheet__unicode" aria-hidden="true">{item.value}</span>}
              <span className="mw-emoji-sheet__caption">{item.label}</span>
            </button>)}
            {!entries.length && <p>Aucune émoticône trouvée.</p>}
          </div>
        </>}
        {children && <footer className="mw-emoji-sheet__footer">{children}</footer>}
      </div>
    </div>, document.body,
  );
}

export function MeeWavEmoticonPicker({
  onSelect, onSelectUnicode, disabled = false, label = "Ajouter une émoticône MeeWav", className, triggerIcon,
}: {
  onSelect: (emoticon: MeeWavEmoticon) => void;
  onSelectUnicode?: (emoji: string) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  triggerIcon?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  return <span className={"mw-emoticon-picker" + (className ? " " + className : "")}>
    <button ref={triggerRef} type="button" className="mw-emoticon-picker__trigger" aria-label={label} aria-haspopup="dialog" aria-expanded={open} disabled={disabled} onClick={() => setOpen(current => !current)}>{triggerIcon ?? <SmilePlus aria-hidden="true" />}</button>
    {open && <MeeWavEmoticonSheet onClose={() => setOpen(false)} restoreFocusTo={triggerRef.current} includeClassics={Boolean(onSelectUnicode)} onSelectValue={value => {
      const match = /^\[\[mw:([a-z0-9-]+)\]\]$/u.exec(value);
      if (match) { const item = itemsByName.get(match[1]); if (item) onSelect(item); }
      else onSelectUnicode?.(value);
    }} />}
  </span>;
}
