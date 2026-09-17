import { type CSSProperties, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { PreProfileFrame } from "../globe/components/PreProfileFrame";
import { HoverPreProfileContent } from "../globe/components/preProfile/HoverPreProfileContent";
import { demoFollowedProfiles } from "../globe/components/preProfile/demoFollowState";
import { getPreProfileArtistForSeed, type PreProfileDemoArtist } from "../globe/components/preProfile/demoPreProfileArtist";
import { getGradeBadgeMeta } from "../grades/gradeBadges";
import type { TremplinArtist } from "./tremplinArtistData";
import "./tremplin-preprofile.css";

// Same screen rectangle rule as the globe's mobileArtistPanel: in landscape the
// popup becomes a side panel instead of a scaled bubble.
function mobileArtistPanel(viewport: { width: number; height: number }) {
  if (viewport.width <= viewport.height || viewport.height > 600) return null;
  const style = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: number) => parseFloat(style.getPropertyValue(name)) || fallback;
  const width = read("--mobile-artist-panel-width", 288);
  const top = read("--mobile-artist-panel-top", 10);
  const bottom = read("--mobile-artist-panel-bottom", 10);
  const right = read("--mobile-artist-panel-right", 12);
  const height = Math.max(1, viewport.height - top - bottom);
  return { scale: 1, width, height, left: viewport.width - right - width, top };
}

function toPreProfileArtist(artist: TremplinArtist): PreProfileDemoArtist {
  const grade = getGradeBadgeMeta(artist.gradeLevel);
  const seeded = getPreProfileArtistForSeed({
    profileId: artist.id,
    displayName: artist.name,
    mainRole: artist.exactProfession ?? artist.disciplines.join(" · "),
    zoneName: artist.city,
    gradeLevel: grade.level,
    gradeColor: grade.mainColor,
    tremplinRegistered: true,
    publicStatsPublished: true,
  });
  return {
    ...seeded,
    portraitUrl: artist.portrait,
    bio: artist.biography || seeded.bio,
    audios: artist.audio?.audioSrc
      ? [{
          id: `${artist.id}-preview`,
          mediaUrl: artist.audio.audioSrc,
          title: artist.audio.title,
          subtitle: artist.name,
          duration: artist.audio.durationLabel,
          color: "purple" as const,
        }, ...seeded.audios.slice(1)]
      : seeded.audios,
    stats: { ...seeded.stats, audios: artist.audio?.audioSrc ? Math.max(1, seeded.stats.audios) : seeded.stats.audios },
  };
}

/** Portrait tap → the globe's pre-profile bubble, anchored to the tapped portrait. */
export default function TremplinPreProfile({ artist, anchor, followed, onClose, onOpenProfile, onFollow, onContact }: {
  artist: TremplinArtist;
  anchor: { x: number; y: number; clearance: number };
  followed: boolean;
  onClose: () => void;
  onOpenProfile: () => void;
  onFollow: (artistId: string) => void;
  onContact: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const [notice, setNotice] = useState("");
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  const preArtist = useMemo(() => toPreProfileArtist(artist), [artist]);
  if (followed) demoFollowedProfiles.add(artist.id); else demoFollowedProfiles.delete(artist.id);

  const margin = 16, leftGuard = 10;
  const mobile = mobileArtistPanel(viewport);
  const scale = mobile?.scale ?? Math.min(1, (viewport.width - leftGuard - margin * 2) / 413, (viewport.height - 104) / 530);
  const width = 413 * scale, height = 530 * scale;
  const gapFromAnchor = -20;
  const arrowSize = 8;
  const right = anchor.x + anchor.clearance + gapFromAnchor + arrowSize;
  const left = anchor.x - anchor.clearance - gapFromAnchor - arrowSize - width;
  const placement = right + width <= viewport.width - margin ? "right"
    : left >= leftGuard ? "left" : viewport.width - anchor.x >= anchor.x - leftGuard ? "right" : "left";
  const popupLeft = Math.max(leftGuard, Math.min(viewport.width - margin - width, placement === "right" ? right : left));
  const popupTop = Math.max(64, Math.min(viewport.height - margin - height, anchor.y - height / 2));

  useLayoutEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    closeButton.current?.focus({ preventScroll: true });
    return () => { if (trigger?.isConnected) trigger.focus({ preventScroll: true }); };
  }, []);
  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    const outside = (event: Event) => {
      if (event.target instanceof Node && !panel.current?.contains(event.target)) closeRef.current();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault(); event.stopPropagation(); closeRef.current();
    };
    window.addEventListener("resize", resize);
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("wheel", outside, { capture: true, passive: true });
    document.addEventListener("keydown", escape, true);
    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("wheel", outside, true);
      document.removeEventListener("keydown", escape, true);
    };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  return createPortal(<div ref={panel} className="tremplin-preprofile" role="dialog" aria-modal="false"
    aria-label={`Pré-profil de ${artist.name}`} data-placement={placement}
    style={{ left: mobile?.left ?? popupLeft, top: mobile?.top ?? popupTop, transform: `scale(${scale})`,
      ...(mobile ? { width: mobile.width, height: mobile.height,
        '--mw-bubble-w': `${mobile.width}px`, '--mw-bubble-h': `${mobile.height}px` } : {}),
      "--mw-arrow-y": `${Math.max(40, Math.min(490, (anchor.y - popupTop) / scale))}px` } as CSSProperties}
    onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
    <PreProfileFrame arrow>
      <HoverPreProfileContent artist={preArtist} demoFollow showMapPin={false}
        onFollow={onFollow}
        onOpenProfile={onOpenProfile}
        onContact={onContact}
        onCollabRequest={() => setNotice("Les demandes de collaboration seront bientôt disponibles.")} />
    </PreProfileFrame>
    <button ref={closeButton} className="tremplin-preprofile__close" type="button" onClick={onClose} aria-label="Fermer le pré-profil">
      <X aria-hidden="true" />
    </button>
    {notice && <div className="tremplin-preprofile__notice" role="status">{notice}</div>}
  </div>, document.body);
}
