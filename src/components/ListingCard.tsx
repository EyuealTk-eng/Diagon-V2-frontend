import { Link } from "react-router-dom";

import { useI18n } from "../app/i18n";
import type { ListingCard as Listing } from "../types/api";
import { Icon } from "./Icon";
import { StatusBadge, VerifiedBadge } from "./ui";

export function ListingCard({ listing, onToggleSave }: { listing: Listing; onToggleSave?: (l: Listing) => void }) {
  const { t, formatPrice, categoryName } = useI18n();
  const unavailable = listing.status !== "available";

  return (
    <article className="group card relative flex flex-col overflow-hidden transition-shadow hover:shadow-[var(--shadow-lift)]">
      <Link to={`/listings/${listing.id}`} className="flex flex-1 flex-col focus-visible:outline-offset-[-3px]">
        <div className="relative aspect-[4/3] overflow-hidden bg-sand/60">
          {listing.cover_image ? (
            <img
              src={listing.cover_image}
              alt=""
              loading="lazy"
              className={`size-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${unavailable ? "opacity-60 grayscale-[40%]" : ""}`}
            />
          ) : (
            <div className="grid size-full place-items-center text-muted">
              <Icon name="image" className="size-8" />
            </div>
          )}
          {unavailable && (
            <span className="absolute left-3 top-3">
              <StatusBadge status={listing.status} />
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{categoryName(listing.category)}</p>
          <h3 className="line-clamp-2 font-display text-[15px] font-semibold leading-snug text-ink">{listing.title}</h3>
          <p className="font-display text-lg font-bold text-ink">
            {formatPrice(listing.price)}
            {listing.pricing_type === "hourly" && <span className="text-sm font-medium text-muted"> / {t("pricing.hourly").toLowerCase()}</span>}
          </p>
          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1">
              <Icon name="pin" className="size-4" />
              {listing.campus.name}
            </span>
            {listing.condition && <span>· {t(`condition.${listing.condition}`)}</span>}
            {listing.listing_type === "service" && <span>· {t("listing.service")}</span>}
            {listing.seller_verified && <VerifiedBadge compact />}
          </div>
        </div>
      </Link>
      {onToggleSave && (
        <button
          type="button"
          onClick={() => onToggleSave(listing)}
          aria-pressed={listing.is_saved}
          aria-label={listing.is_saved ? t("saved.unsave") : t("listing.save")}
          className={`absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-paper/90 shadow-[var(--shadow-soft)] backdrop-blur transition-colors hover:text-clay ${listing.is_saved ? "text-clay" : "text-ink"}`}
        >
          <Icon name="heart" className={`size-[18px] ${listing.is_saved ? "fill-current" : ""}`} />
        </button>
      )}
    </article>
  );
}

export function ListingGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">{children}</div>;
}
