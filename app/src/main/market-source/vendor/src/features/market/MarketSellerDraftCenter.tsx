import { FilePenLine, Image, Plus, RefreshCw } from "lucide-react";
import type { MarketplaceOwnerDraft, MarketplacePillar } from "./market.types";
import {
  useMarketplaceSellerDrafts,
  type MarketplaceDraftRepository,
} from "./useMarketplaceSellerDrafts";
import "./market-seller-draft-center.css";

const PILLAR_LABELS: Record<MarketplacePillar, string> = {
  new: "Neuf",
  used: "Occasion",
  rental: "Location",
  services: "Service",
  collective: "Collectif",
};

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPrice(amountMinor: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

export type MarketSellerDraftCenterProps = {
  enabled?: boolean;
  repository?: MarketplaceDraftRepository;
  onResume: (draft: MarketplaceOwnerDraft) => void;
  onCreate?: () => void;
};

export function MarketSellerDraftCenter({
  enabled = true,
  repository,
  onResume,
  onCreate,
}: MarketSellerDraftCenterProps) {
  const { drafts, status, error, refresh } = useMarketplaceSellerDrafts({
    enabled,
    repository,
  });

  return (
    <section className="market-seller-drafts" aria-labelledby="market-seller-drafts-title">
      <header className="market-seller-drafts__header">
        <div>
          <span className="market-seller-drafts__eyebrow">Tes annonces</span>
          <h2 id="market-seller-drafts-title">Brouillons à reprendre</h2>
          <p>Retrouve une annonce enregistrée et continue exactement où tu l’as laissée.</p>
        </div>
        {onCreate ? (
          <button type="button" className="market-seller-drafts__create" onClick={onCreate}>
            <Plus aria-hidden="true" />
            Nouvelle annonce
          </button>
        ) : null}
      </header>

      {error ? (
        <div className="market-seller-drafts__notice" role="status">
          <span>{error.message}</span>
          <button type="button" onClick={() => void refresh()}>
            <RefreshCw aria-hidden="true" />
            Réessayer
          </button>
        </div>
      ) : null}

      {status === "loading" && drafts.length === 0 ? (
        <div className="market-seller-drafts__loading" role="status">
          <span />
          <span />
          <span />
          <span className="sr-only">Chargement de tes brouillons…</span>
        </div>
      ) : null}

      {status === "ready" && drafts.length === 0 ? (
        <div className="market-seller-drafts__empty">
          <FilePenLine aria-hidden="true" />
          <strong>Aucun brouillon en attente</strong>
          <span>Une annonce enregistrée apparaîtra ici, uniquement pour toi.</span>
        </div>
      ) : null}

      {drafts.length > 0 ? (
        <ul className="market-seller-drafts__list">
          {drafts.map((draft) => (
            <li key={draft.listingId}>
              <div className="market-seller-drafts__icon" aria-hidden="true">
                {draft.media[0]?.sourceUrl ? (
                  <img src={draft.media[0].sourceUrl} alt="" />
                ) : (
                  <Image />
                )}
              </div>
              <div className="market-seller-drafts__copy">
                <span>{PILLAR_LABELS[draft.input.pillar]} · modifié le {formatUpdatedAt(draft.updatedAt)}</span>
                <strong>{draft.input.title}</strong>
                <small>
                  {formatPrice(draft.input.unitAmountMinor)} · {draft.input.mediaFileIds.length} média
                  {draft.input.mediaFileIds.length > 1 ? "s" : ""}
                </small>
              </div>
              <button
                type="button"
                className="market-seller-drafts__resume"
                onClick={() => onResume(draft)}
                aria-label={`Reprendre le brouillon ${draft.input.title}`}
              >
                Reprendre
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
