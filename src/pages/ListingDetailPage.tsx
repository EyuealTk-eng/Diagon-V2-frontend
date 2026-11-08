import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../app/auth";
import { useI18n } from "../app/i18n";
import { Icon } from "../components/Icon";
import { ListingCard, ListingGrid } from "../components/ListingCard";
import { Alert, Button, ButtonLink, EmptyState, ErrorNote, Spinner, StatusBadge, VerifiedBadge } from "../components/ui";
import { ReportDialog } from "../features/listings/ReportDialog";
import { telegramUrl } from "../features/listings/telegram";
import { useAsync } from "../hooks/useAsync";
import { useSaveToggle } from "../hooks/useSaveToggle";
import { DEMO, api } from "../services/api";
import type { ListingCard as Card, ListingDetail } from "../types/api";

function Gallery({ listing }: { listing: ListingDetail }) {
  const [index, setIndex] = useState(0);
  const images = listing.images;
  if (!images.length) {
    return <div className="card grid aspect-[4/3] place-items-center text-muted"><Icon name="image" className="size-10" /></div>;
  }
  const current = images[Math.min(index, images.length - 1)];
  const go = (delta: number) => setIndex((i) => (i + delta + images.length) % images.length);

  return (
    <div className="space-y-3">
      <div className="card relative aspect-[4/3] overflow-hidden bg-sand/40">
        <img src={current.url} alt={current.alt_text || listing.title} className="size-full object-contain" />
        {images.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-paper/90 shadow-[var(--shadow-soft)] hover:bg-paper">
              <Icon name="chevronLeft" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next photo" className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-paper/90 shadow-[var(--shadow-soft)] hover:bg-paper">
              <Icon name="chevronRight" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-2.5 py-0.5 text-xs font-semibold text-cream">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <li key={img.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Photo ${i + 1}`}
                aria-current={i === index}
                className={`block size-20 overflow-hidden rounded-xl border-2 ${i === index ? "border-clay" : "border-transparent opacity-75 hover:opacity-100"}`}
              >
                <img src={img.url} alt="" className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ListingDetailPage() {
  const { uuid = "" } = useParams();
  const { t, formatPrice, formatDate, categoryName } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reporting, setReporting] = useState(false);
  const [demoContact, setDemoContact] = useState(false);
  const flash = (useLocation().state as { flash?: "published" | "pending" } | null)?.flash;

  const detail = useAsync((signal) => api<ListingDetail>(`/listings/${uuid}/`, { signal }), [uuid]);
  const similar = useAsync((signal) => api<Card[]>(`/listings/${uuid}/similar/`, { signal }), [uuid]);

  const toggleSave = useSaveToggle((id, saved) => {
    detail.setData((d) => (d && d.id === id ? { ...d, is_saved: saved } : d));
    similar.setData((list) => list?.map((l) => (l.id === id ? { ...l, is_saved: saved } : l)));
  });

  if (detail.loading) return <Spinner />;
  if (detail.error?.status === 404) return <EmptyState title={t("listing.notFound")} action={<ButtonLink to="/explore">{t("nav.explore")}</ButtonLink>} />;
  if (detail.error || !detail.data) return <ErrorNote message={detail.error?.message ?? t("common.error")} onRetry={detail.reload} />;

  const listing = detail.data;
  const parent = typeof listing.category.parent === "object" ? listing.category.parent : null;
  const contactUrl = telegramUrl(listing.telegram_contact);

  return (
    <div className="space-y-12">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link to="/" className="hover:text-ink">{t("nav.home")}</Link></li>
          {parent && (
            <li className="flex items-center gap-1.5">/ <Link to={`/explore?category=${parent.slug}`} className="hover:text-ink">{categoryName(parent)}</Link></li>
          )}
          <li className="flex items-center gap-1.5">/ <Link to={`/explore?category=${listing.category.slug}`} className="hover:text-ink">{categoryName(listing.category)}</Link></li>
          <li className="flex min-w-0 items-center gap-1.5">/ <span aria-current="page" className="truncate text-ink">{listing.title}</span></li>
        </ol>
      </nav>

      {flash && <Alert tone="success">{flash === "pending" ? t("sell.pending") : t("sell.published")}</Alert>}

      {listing.is_owner && (
        <Alert tone={listing.status === "rejected" || listing.status === "suspended" ? "error" : "info"}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              {t("listing.ownerNote")} <StatusBadge status={listing.status} />
              {listing.status_reason && <span>— {listing.status_reason}</span>}
            </span>
            {["draft", "pending", "available", "rejected"].includes(listing.status) && (
              <ButtonLink to={`/listings/${listing.id}/edit`} variant="secondary">
                <Icon name="edit" className="size-4" />
                {t("listing.edit")}
              </ButtonLink>
            )}
          </div>
        </Alert>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        <Gallery listing={listing} />

        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip">{categoryName(listing.category)}</span>
              {listing.status !== "available" && <StatusBadge status={listing.status} />}
            </div>
            <h1 className="text-3xl font-extrabold leading-tight">{listing.title}</h1>
            <p className="font-display text-3xl font-bold text-clay-dark">
              {formatPrice(listing.price)}
              {listing.pricing_type && listing.pricing_type !== "fixed" && (
                <span className="ml-2 text-base font-medium text-muted">{t(`pricing.${listing.pricing_type}`)}</span>
              )}
            </p>
          </div>

          <dl className="card grid grid-cols-2 gap-4 p-5 text-sm">
            <div><dt className="text-muted">{t("listing.campus")}</dt><dd className="font-semibold">{listing.campus.name}</dd></div>
            {listing.condition && <div><dt className="text-muted">{t("listing.condition")}</dt><dd className="font-semibold">{t(`condition.${listing.condition}`)}</dd></div>}
            {listing.availability && <div><dt className="text-muted">{t("listing.availability")}</dt><dd className="font-semibold">{listing.availability}</dd></div>}
            <div><dt className="text-muted">{t("listing.posted")}</dt><dd className="font-semibold">{formatDate(listing.published_at ?? listing.created_at)}</dd></div>
          </dl>

          {/* Seller card */}
          <section className="card space-y-4 p-5" aria-label={t("listing.seller")}>
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-full bg-clay-soft font-display text-lg font-bold text-clay-dark">
                {listing.seller.display_name.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{listing.seller.display_name}</p>
                <p className="text-sm text-muted">
                  {listing.seller.campus ?? listing.campus.name} · {t("listing.memberSince", { date: formatDate(listing.seller.created_at) })}
                </p>
              </div>
            </div>
            {listing.seller.is_verified && (
              <div className="space-y-1">
                <VerifiedBadge />
                <p className="text-xs text-muted">{t("listing.verifiedHelp")}</p>
              </div>
            )}
            {contactUrl && DEMO ? (
              <>
                <button type="button" onClick={() => setDemoContact(true)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-clay px-4 py-3 font-semibold text-white shadow-[var(--shadow-soft)] hover:bg-clay-dark">
                  <Icon name="send" className="size-5" />
                  {t("listing.contact")}
                </button>
                {demoContact && <Alert>{t("demo.contact", { username: listing.telegram_contact ?? "" })}</Alert>}
              </>
            ) : contactUrl ? (
              <a href={contactUrl} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-xl bg-clay px-4 py-3 font-semibold text-white shadow-[var(--shadow-soft)] hover:bg-clay-dark">
                <Icon name="send" className="size-5" />
                {t("listing.contact")}
              </a>
            ) : (
              <Alert>{t("listing.noContact")}</Alert>
            )}
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => toggleSave(listing)} aria-pressed={listing.is_saved}>
                <Icon name="heart" className={`size-4 ${listing.is_saved ? "fill-clay text-clay" : ""}`} />
                {listing.is_saved ? t("listing.saved") : t("listing.save")}
              </Button>
              {!listing.is_owner && (
                <Button
                  variant="ghost"
                  onClick={() => (user ? setReporting(true) : navigate("/login", { state: { from: `/listings/${listing.id}` } }))}
                >
                  <Icon name="flag" className="size-4" />
                  {t("listing.report")}
                </Button>
              )}
            </div>
          </section>

          <aside className="rounded-[var(--radius-card)] border border-sage/30 bg-sage-soft/60 p-4 text-sm">
            <p className="flex items-center gap-2 font-semibold text-sage"><Icon name="shield" className="size-4" />{t("listing.safetyTitle")}</p>
            <p className="mt-1 text-ink/80">{t("listing.safetyBody")}</p>
          </aside>
        </div>
      </div>

      <section className="max-w-3xl space-y-3">
        <h2 className="text-xl font-bold">{t("listing.description")}</h2>
        <p className="whitespace-pre-line leading-relaxed text-ink/90">{listing.description}</p>
      </section>

      {similar.data && similar.data.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold">{t("listing.similar")}</h2>
          <ListingGrid>{similar.data.slice(0, 4).map((l) => <ListingCard key={l.id} listing={l} onToggleSave={toggleSave} />)}</ListingGrid>
        </section>
      )}

      {reporting && <ReportDialog listingId={listing.id} onClose={() => setReporting(false)} />}
    </div>
  );
}
