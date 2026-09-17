import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { History, Mic2, Play } from "lucide-react";
import type { ShortsVideoItem } from "../shorts/shorts-wall-data";
import { useSceneListWindow } from "./watch/useSceneListWindow";

export type SceneHomeVerticalRail = {
  id: string;
  title: string;
  to: string;
  items: ShortsVideoItem[];
};

const RAIL_ICONS: Record<string, typeof Play> = {
  "room-replays": History,
  freestyles: Mic2,
};

export default function SceneHomeFeed({ videos, rails, renderVideo, renderShort }: {
  videos: ShortsVideoItem[];
  rails: SceneHomeVerticalRail[];
  renderVideo: (item: ShortsVideoItem) => ReactNode;
  renderShort: (item: ShortsVideoItem) => ReactNode;
}) {
  const [count, setCount] = useSceneListWindow("scene-home-grid", 24);
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = sentinel.current;
    if (!node || count >= videos.length || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setCount((value) => Math.min(value + 24, videos.length));
    }, { rootMargin: "240px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [count, videos.length, setCount]);
  const visibleRails = rails.filter((rail) => rail.items.length > 0).slice(0, 3);
  let cursor = 0;
  const blocks: ReactNode[] = visibleRails.flatMap((rail, index) => {
    const chunk = videos.slice(cursor, cursor + 3);
    cursor += chunk.length;
    const Icon = RAIL_ICONS[rail.id] ?? Play;
    return [
      <div key={`grid-${rail.id}`} className="scene-home-feed__grid">{chunk.map(renderVideo)}</div>,
      <section key={rail.id} className="scene-home-feed__shorts" aria-label={rail.title}>
        <header><h2><Icon aria-hidden="true" /> {rail.title}</h2><Link to={rail.to}>Tout voir</Link></header>
        <div className="scene-home-feed__shorts-track">{rail.items.slice(0, 8).map(renderShort)}</div>
      </section>,
    ];
  });
  if (visibleRails.length === 0) {
    blocks.push(<div key="grid-lead" className="scene-home-feed__grid">{videos.slice(0, 3).map(renderVideo)}</div>);
    cursor = 3;
  }
  return <section className="scene-home-feed" aria-label="Vidéos recommandées">
    <h1 className="sr-only">Accueil de La Scène</h1>
    {blocks}
    <div className="scene-home-feed__grid">{videos.slice(cursor, count).map(renderVideo)}</div>
    <div ref={sentinel} className="scene-home-feed__more">
      {count < videos.length && <button onClick={() => setCount((value) => Math.min(value + 24, videos.length))}>Afficher plus de vidéos</button>}
    </div>
  </section>;
}
