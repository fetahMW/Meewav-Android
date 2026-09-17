import { ChartNoAxesColumnIncreasing, ChevronRight, MapPin, TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { TremplinArtist } from "./tremplinArtistData";
import { getTremplinStatisticsRanking, TREMPLIN_STATISTICS_SORTS, type TremplinStatisticsSort } from "./tremplinStatisticsRanking";
import "./tremplin-statistics.css";

const priceFormat = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 4 });
const changeFormat = new Intl.NumberFormat("fr-FR", { signDisplay: "exceptZero", maximumFractionDigits: 2 });
const countFormat = new Intl.NumberFormat("fr-FR");

export default function TremplinStatistics({ sort, onSortChange, onOpen }: {
  sort: TremplinStatisticsSort;
  onSortChange: (sort: TremplinStatisticsSort) => void;
  onOpen: (artist: TremplinArtist) => void;
}) {
  const entries = getTremplinStatisticsRanking(sort);
  const sortLabel = TREMPLIN_STATISTICS_SORTS.find(({ id }) => id === sort)?.label;
  return <section className="tremplin-statistics" aria-labelledby="tremplin-statistics-title">
    <header className="tremplin-statistics__header">
      <span className="tremplin-statistics__eyebrow"><ChartNoAxesColumnIncreasing aria-hidden="true" /> Jetons de talent</span>
      <h1 id="tremplin-statistics-title">Top jetons de talent</h1>
      <span className="tremplin-statistics__country"><MapPin aria-hidden="true" /> France <b>DÉMO</b></span>
      <p>Classement des jetons émis par les artistes — pas un classement des artistes eux-mêmes. Données fictives issues des profils et jetons locaux de démonstration. Aucun cours réel ni classement officiel.</p>
    </header>
    <div className="tremplin-statistics__filters" role="group" aria-label="Trier le classement">
      {TREMPLIN_STATISTICS_SORTS.map(({ id, label }) => <button key={id} type="button" data-sort={id} aria-pressed={sort === id} onClick={() => onSortChange(id)}>{label}</button>)}
    </div>
    <p className="tremplin-statistics__summary" role="status">{entries.length} jetons actifs · {sortLabel} · Ordre décroissant</p>
    <ol className="tremplin-statistics__list" aria-label={`Classement par ${sortLabel}`}>
      {entries.map(({ artist, token }, index) => {
        const change = token.trend7d.changePercent;
        const direction = change > 0 ? "up" : change < 0 ? "down" : "stable";
        const TrendIcon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
        return <li key={artist.id}>
          <button type="button" className="tremplin-statistics__row" onClick={() => onOpen(artist)}>
            <span className="tremplin-statistics__rank"><span className="tremplin-visually-hidden">Rang </span>{index + 1}</span>
            <img src={artist.portrait} alt="" loading="lazy" width={44} height={44} />
            <span className="tremplin-statistics__identity"><strong>{artist.name}</strong><small>{token.symbol} · {artist.city}</small></span>
            <ChevronRight className="tremplin-statistics__chevron" aria-hidden="true" />
            <span className="tremplin-statistics__metrics">
              <span data-selected={sort === "value"}><small>Prix du jeton</small><strong>{Number.isFinite(token.currentValueEur) ? priceFormat.format(token.currentValueEur) : "Indisponible"}</strong></span>
              <span data-selected={sort === "progression7d"}><small>Progression 7j</small><strong className={`is-${direction}`}><TrendIcon aria-hidden="true" />{Number.isFinite(change) ? `${changeFormat.format(change)} %` : "Indisponible"}</strong></span>
              <span data-selected={sort === "holders"}><small>Détenteurs</small><strong>{Number.isFinite(token.holderCount) ? countFormat.format(token.holderCount) : "Indisponible"}</strong></span>
            </span>
          </button>
        </li>;
      })}
    </ol>
    {entries.length === 0 ? <p className="tremplin-statistics__empty" role="status">Aucun jeton actif dans les données de démonstration.</p> : null}
    <p className="tremplin-statistics__note">Le prix et sa progression ne mesurent ni le talent ni le grade de l’artiste. Ces données fictives ne prédisent aucun gain.</p>
  </section>;
}
