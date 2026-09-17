import { tremplinArtists, type TremplinArtist } from "./tremplinArtistData";
import { getTremplinTokenLifecycleStage } from "./tremplinProductModel";
import { tremplinArtistTokens, type TremplinArtistToken } from "./tremplinTokenData";

export type TremplinStatisticsSort = "value" | "progression7d" | "holders";

export type TremplinStatisticsEntry = {
  artist: TremplinArtist;
  token: TremplinArtistToken;
};

export const TREMPLIN_STATISTICS_SORTS: readonly { id: TremplinStatisticsSort; label: string }[] = [
  { id: "value", label: "Valeur" },
  { id: "progression7d", label: "Progression 7j" },
  { id: "holders", label: "Communauté" },
];

export function getTremplinStatisticsRanking(
  sort: TremplinStatisticsSort = "value",
  artists: readonly TremplinArtist[] = tremplinArtists,
  tokens: readonly TremplinArtistToken[] = tremplinArtistTokens,
): TremplinStatisticsEntry[] {
  const tokenByArtist = new Map(tokens.map((token) => [token.artistId, token]));
  const entries = artists.flatMap((artist) => {
    if (getTremplinTokenLifecycleStage(artist) !== "active") return [];
    const token = tokenByArtist.get(artist.id);
    return token ? [{ artist, token }] : [];
  });
  const metric = ({ token }: TremplinStatisticsEntry) => {
    const value = sort === "progression7d" ? token.trend7d.changePercent
      : sort === "holders" ? token.holderCount : token.currentValueEur;
    return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
  };
  return entries.sort((left, right) => {
    const leftValue = metric(left);
    const rightValue = metric(right);
    if (leftValue !== rightValue) return leftValue > rightValue ? -1 : 1;
    return left.artist.name.localeCompare(right.artist.name, "fr")
      || left.artist.id.localeCompare(right.artist.id, "fr");
  });
}
