import { type RefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { PreProfileFrame } from "./reference/features/globe/components/PreProfileFrame";
import HoverPreProfileContent from "./reference/features/globe/components/preProfile/HoverPreProfileContent";
import { getPreProfileArtistForSeed, type PreProfileDemoArtist } from "./reference/features/globe/components/preProfile/demoPreProfileArtist";
import { sceneDemoArtist } from "./reference/features/shorts/sceneArtistPortraits";
import { getGradeBadgeMeta } from "./reference/features/grades/gradeBadges";
import "./ring-artist-preprofile.css";
import { useArtistPopupPosition } from '../../../../use-artist-popup-position';
import { TopTenProfileNavigator, type ProfileNavigation } from './TopTenProfileNavigator';
import { TopTenProfilePages } from './TopTenProfilePages';
import { openArtistMessaging } from '../../../../messaging-navigation';

const RING_ARTIST_GRADE = getGradeBadgeMeta(6);

type PortraitSelection = {
  instanceId: number;
  slug: string;
  name: string;
  portraitUrl: string;
  gradeLevel?: number;
  anchor: { x: number; y: number; clearance: number; viewportWidth: number; viewportHeight: number };
};

export default function RingArtistPreProfile({ selection, onClose, navigation, profiles }: {
  selection: PortraitSelection; onClose: () => void; navigation?: ProfileNavigation; profiles?: PortraitSelection[];
}) {
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useArtistPopupPosition(panel, selection.instanceId, selection.anchor,
    navigation ? null : 'meewav:ring-portrait-anchor');

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

  return createPortal(<div ref={panel} className="ring-artist-preprofile" role="dialog" aria-modal="false"
    aria-label={`Pré-profil de ${selection.name}`} data-navigable={Boolean(navigation)}
    onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()}>
    {navigation && profiles ? <TopTenProfilePages index={navigation.index} total={profiles.length}
      onChange={navigation.onChange} renderPage={(index, active) =>
        <ArtistProfileCard key={`${profiles[index].slug}-${active}`} selection={profiles[index]}
          onClose={onClose} closeButton={active ? closeButton : undefined} />}
    /> : <ArtistProfileCard key={selection.slug} selection={selection} onClose={onClose} closeButton={closeButton} />}
    {navigation && <>
      <span id="top-ten-active-profile" className="top-ten-profile-navigation__announcement" role="status">
        {navigation.index + 1} sur {navigation.total} : {selection.name}
      </span>
      <TopTenProfileNavigator {...navigation} />
    </>}
  </div>, document.body);
}

export function ArtistProfileCard({ selection, onClose, closeButton, profileArtist, demo = true, onOpenProfile, onContact, onCollabRequest }: {
  selection: PortraitSelection; onClose: () => void; closeButton?: RefObject<HTMLButtonElement | null>;
  profileArtist?: PreProfileDemoArtist; demo?: boolean; onOpenProfile?: (id: string) => void; onContact?: (id: string) => void; onCollabRequest?: (id: string) => void;
}) {
  const [notice, setNotice] = useState('');
  const artist = useMemo(() => {
    if (profileArtist) return profileArtist;
    const original = sceneDemoArtist(selection.name);
    const grade = selection.gradeLevel == null ? RING_ARTIST_GRADE : getGradeBadgeMeta(selection.gradeLevel);
    const seed = getPreProfileArtistForSeed({
      profileId: original?.artistId || `ring-demo-${selection.slug}`, displayName: selection.name,
      mainRole: original?.role, zoneName: original?.city, gradeLevel: grade.level, gradeColor: grade.mainColor,
    });
    return { ...seed, portraitUrl: selection.portraitUrl,
      role: original?.role || seed.role, location: original?.city || seed.location,
      bio: original ? `${original.role} à ${original.city}. Univers ${original.style.toLowerCase()}.` : seed.bio,
      followersLabel: '0 abonnés', online: false, verified: false, goldenLikesCount: 0, golden_likes_count: 0,
    };
  }, [selection, profileArtist]);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(''), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);
  return <>
    <PreProfileFrame arrow>
      <HoverPreProfileContent artist={artist} demoFollow={demo} showMapPin={false}
        onOpenProfile={() => onOpenProfile ? onOpenProfile(artist.id) : window.dispatchEvent(new CustomEvent('meewav:navigate', { detail: { path: `/profile/view/${encodeURIComponent(artist.id)}` } }))}
        onContact={() => onContact ? onContact(artist.id) : openArtistMessaging(artist)}
        onCollabRequest={() => onCollabRequest ? onCollabRequest(artist.id) : openArtistMessaging(artist, 'collaboration')} />
    </PreProfileFrame>
    <button ref={closeButton} className="ring-artist-preprofile__close" type="button" onClick={onClose} aria-label="Fermer le pré-profil">
      <X aria-hidden="true" />
    </button>
    {notice && <div className="ring-artist-preprofile__notice" role="status">{notice}</div>}
  </>;
}
