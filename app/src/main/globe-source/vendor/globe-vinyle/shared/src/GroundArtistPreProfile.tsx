import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { PreProfileFrame } from "./reference/features/globe/components/PreProfileFrame";
import HoverPreProfileContent from "./reference/features/globe/components/preProfile/HoverPreProfileContent";
import { openArtistMessaging } from '../../../../messaging-navigation';
import { getPreProfileArtistForSeed } from "./reference/features/globe/components/preProfile/demoPreProfileArtist";
import { getGradeBadgeMeta } from "./reference/features/grades/gradeBadges";
import { getProfileIconImageUrl } from "./reference/components/shared/avatar/profileIconAssets";
import "./ring-artist-preprofile.css";
import { useArtistPopupPosition } from '../../../../use-artist-popup-position';

export type GroundAvatarSelection = {
  id: string;
  name: string;
  role: string;
  icon: string;
  zoneName: string;
  city?: string;
  grade: number;
  live?: boolean;
  avatarUrl?: string | null;
  isHost?: boolean;
  wasConsulted?: boolean;
  anchor: { x: number; y: number; clearance: number; viewportWidth: number; viewportHeight: number };
};

const PINNED_AVATARS_KEY = "globelab.pinnedAvatars.v1";

function readPinnedColor(id: string) {
  try {
    const stored = JSON.parse(localStorage.getItem(PINNED_AVATARS_KEY) || "null");
    const color = stored?.[id];
    return typeof color === "string" && color ? color : null;
  } catch {
    return null;
  }
}

export default function GroundArtistPreProfile({
  selection,
  onClose,
}: {
  selection: GroundAvatarSelection;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useArtistPopupPosition(panel, selection.id, selection.anchor, 'meewav:ground-avatar-anchor');
  const [notice, setNotice] = useState("");
  const [restored, setRestored] = useState(false);
  const [pinnedColor, setPinnedColor] = useState(() => readPinnedColor(selection.id));
  const showRestoreAvatar = Boolean(
    selection.wasConsulted && !selection.isHost && !pinnedColor && !restored,
  );
  const grade = getGradeBadgeMeta(selection.grade);
  const artist = useMemo(() => {
    const seed = getPreProfileArtistForSeed({
      profileId: selection.id,
      displayName: selection.name,
      mainRole: selection.role,
      iconId: selection.icon,
      zoneName: selection.zoneName || selection.city,
      gradeLevel: grade.level,
      gradeColor: grade.mainColor,
    });
    if (!selection.live) return seed;
    // Live markers contain a public identity, not the demonstration artist's
    // photos, audience counts or media. Keep the same pre-profile presentation.
    return { ...seed,
      // The Globe WebView intentionally serves bundled images only. Match the
      // illustration selected at registration until a portrait proxy exists.
      portraitUrl: getProfileIconImageUrl(selection.icon),
      followersLabel: "— abonnés", goldenLikesCount: 0, golden_likes_count: 0,
      bio: `${selection.role} · ${selection.zoneName || selection.city || "MeeWav"}`,
      shorts: [], audios: [], stats: { shorts: 0, audios: 0, collabAvailable: true },
      verified: false, online: false, tremplinRegistered: false, publicStatsPublished: false,
    };
  }, [selection, grade.level, grade.mainColor]);

  useLayoutEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    closeButton.current?.focus({ preventScroll: true });
    return () => {
      if (trigger?.isConnected && (document.activeElement === document.body || panel.current?.contains(document.activeElement))) {
        trigger.focus({ preventScroll: true });
      }
    };
  }, []);
  useEffect(() => {
    const outside = (event: Event) => {
      if (event.target instanceof Node && !panel.current?.contains(event.target)) closeRef.current();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault(); event.stopPropagation(); closeRef.current();
    };
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("wheel", outside, { capture: true, passive: true });
    document.addEventListener("keydown", escape, true);
    return () => {
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("wheel", outside, true);
      document.removeEventListener("keydown", escape, true);
    };
  }, []);
  useEffect(() => {
    setRestored(false);
    setPinnedColor(readPinnedColor(selection.id));
  }, [selection.id, selection.wasConsulted]);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  return createPortal(<div ref={panel} className="ring-artist-preprofile" role="dialog" aria-modal="false"
    aria-label={`Pré-profil de ${selection.name}`}
    onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()}>
    <PreProfileFrame arrow>
      <HoverPreProfileContent artist={artist} demoFollow={!selection.live} showMapPin={!selection.isHost}
        isOwner={Boolean(selection.isHost)}
        pinnedColor={pinnedColor}
        showRestoreAvatar={showRestoreAvatar}
        onRestoreAvatar={(id) => {
          setRestored(true);
          window.dispatchEvent(new CustomEvent("meewav:ground-avatar-restore", { detail: { id } }));
        }}
        onPin={(id, color, active) => {
          setPinnedColor(active ? color : null);
          window.dispatchEvent(new CustomEvent("meewav:ground-avatar-pin", { detail: { id, color, active } }));
        }}
        onOpenProfile={() => selection.live
          ? window.location.assign(`/native/profile?route=${encodeURIComponent(`/profile/view/${selection.id}`)}`)
          : setNotice("Le profil complet sera bientôt disponible.")}
        onContact={() => openArtistMessaging(artist, "message", Boolean(selection.live))}
        onCollabRequest={() => selection.live
          ? openArtistMessaging(artist, "collaboration", true)
          : setNotice("Les demandes de collaboration seront bientôt disponibles.")} />
    </PreProfileFrame>
    <button ref={closeButton} className="ring-artist-preprofile__close" type="button" onClick={onClose} aria-label="Fermer le pré-profil">
      <X aria-hidden="true" />
    </button>
    {notice && <div className="ring-artist-preprofile__notice" role="status">{notice}</div>}
  </div>, document.body);
}
