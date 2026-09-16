import { useEffect, useRef, type CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import "./meewav-pillar-tabs.css";

export type MeewavPillarTabItem<Id extends string = string> = {
  id: Id;
  label: string;
  icon: LucideIcon;
  accent?: string;
};

export const MEEWAV_PILLAR_SEMANTIC_ACCENTS = {
  home: "#f7f5ff",
  statistics: "#45dfa8",
  media: "#c56cff",
  fallback: "#a77cff",
} as const;

export function resolveMeewavPillarAccent(
  item: Pick<MeewavPillarTabItem, "id" | "label" | "accent">,
) {
  const normalizedLabel = item.label
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLocaleLowerCase("fr-FR");

  if (item.id === "home" || normalizedLabel === "accueil") {
    return MEEWAV_PILLAR_SEMANTIC_ACCENTS.home;
  }

  if (normalizedLabel.startsWith("statistique")) {
    return MEEWAV_PILLAR_SEMANTIC_ACCENTS.statistics;
  }

  if (normalizedLabel === "medias" || normalizedLabel === "media") {
    return MEEWAV_PILLAR_SEMANTIC_ACCENTS.media;
  }

  return item.accent ?? MEEWAV_PILLAR_SEMANTIC_ACCENTS.fallback;
}

type MeewavPillarTabsProps<Id extends string> = {
  items: readonly MeewavPillarTabItem<Id>[];
  activeId: string;
  ariaLabel: string;
  onSelect: (id: Id) => void;
  className?: string;
  visibleCount?: number;
};

export default function MeewavPillarTabs<Id extends string>({
  items,
  activeId,
  ariaLabel,
  onSelect,
  className,
  visibleCount,
}: MeewavPillarTabsProps<Id>) {
  const navigationRef = useRef<HTMLElement>(null);
  const activeIndex = items.findIndex((item) => item.id === activeId);
  const activeAccent = activeIndex >= 0
    ? resolveMeewavPillarAccent(items[activeIndex])
    : undefined;
  const indicatorStyle = {
    width: `calc((100% - 8px) / ${Math.max(1, items.length)})`,
    transform: `translateX(${Math.max(0, activeIndex) * 100}%)`,
    opacity: activeIndex >= 0 ? 1 : 0,
    "--meewav-pillar-tab-accent": activeAccent ?? MEEWAV_PILLAR_SEMANTIC_ACCENTS.fallback,
  } as CSSProperties;

  useEffect(() => {
    const navigation = navigationRef.current;
    const activeTab = navigation?.querySelector<HTMLElement>('[aria-current="page"]');
    if (navigation && activeTab && visibleCount) {
      // Keep a previous destination and reveal the upcoming ones. Only move this
      // rail: scrollIntoView can also move the surrounding page on Android.
      const reveal = (smooth: boolean) => {
        const firstVisible = Math.max(0, Math.min(activeIndex - 1, items.length - visibleCount));
        const target = navigation.children[firstVisible] as HTMLElement | undefined;
        if (!target) return;
        navigation.scrollTo({
          left: target.offsetLeft,
          behavior: smooth && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant',
        });
      };
      reveal(true);
      let lastWidth = navigation.clientWidth;
      const observer = new ResizeObserver(() => {
        if (navigation.clientWidth === lastWidth) return;
        lastWidth = navigation.clientWidth;
        reveal(false);
      });
      observer.observe(navigation);
      return () => observer.disconnect();
    }
    if (activeTab && typeof activeTab.scrollIntoView === "function") {
      activeTab.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [activeId, activeIndex, items.length, visibleCount]);

  return (
    <nav
      ref={navigationRef}
      className={["meewav-pillar-tabs", className].filter(Boolean).join(" ")}
      aria-label={ariaLabel}
      style={{ "--meewav-pillar-tab-count": items.length } as CSSProperties}
    >
      {items.map((item) => {
        const { id, label, icon: Icon } = item;
        const active = id === activeId;
        const resolvedAccent = resolveMeewavPillarAccent(item);
        return (
          <button
            key={id}
            type="button"
            className={active ? "is-active" : ""}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            onClick={() => onSelect(id)}
            style={{ "--meewav-pillar-tab-accent": resolvedAccent } as CSSProperties}
          >
            <span className="meewav-pillar-tabs__icon"><Icon aria-hidden="true" /></span>
            <strong>{label}</strong>
          </button>
        );
      })}
      <span className="meewav-pillar-tabs__indicator" style={indicatorStyle} aria-hidden="true" />
    </nav>
  );
}
