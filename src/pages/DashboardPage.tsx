import { Link, useSearchParams } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { Icon } from "../components/Icon";
import { Button, ButtonLink, EmptyState, ErrorNote, Spinner, StatusBadge } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { api } from "../services/api";
import type { ListingCard, Paginated } from "../types/api";

const TABS = [
  { key: "available", statuses: "available", label: "dash.tabActive" },
  { key: "pending", statuses: "pending,rejected,suspended", label: "dash.tabPending" },
  { key: "draft", statuses: "draft", label: "dash.tabDrafts" },
  { key: "sold", statuses: "sold", label: "dash.tabSold" },
  { key: "removed", statuses: "removed,expired", label: "dash.tabRemoved" },
] as const;

export function DashboardPage() {
  const { t, formatPrice, formatDate } = useI18n();
  const [params, setParams] = useSearchParams();
  const tab = TABS.find((x) => x.key === params.get("tab")) ?? TABS[0];
  const mine = useAsync(
    (signal) => api<Paginated<ListingCard>>("/listings/mine/", { query: { status: tab.statuses }, signal }),
    [tab.key],
  );

  const act = async (listing: ListingCard, action: "sold" | "remove") => {
    if (action === "remove" && !window.confirm(t("dash.confirmRemove"))) return;
    try {
      if (action === "sold") await api(`/listings/${listing.id}/sold/`, { method: "POST" });
      else await api(`/listings/${listing.id}/`, { method: "DELETE" });
      mine.reload();
    } catch (err) {
      window.alert((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{t("dash.title")}</h1>
        <ButtonLink to="/sell"><Icon name="plus" className="size-4" />{t("home.announceCta")}</ButtonLink>
      </div>

      <div role="tablist" className="flex gap-1 overflow-x-auto rounded-2xl bg-sand/50 p-1">
        {TABS.map((x) => (
          <button
            key={x.key}
            role="tab"
            type="button"
            aria-selected={x.key === tab.key}
            onClick={() => setParams({ tab: x.key }, { replace: true })}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${x.key === tab.key ? "bg-paper text-ink shadow-[var(--shadow-soft)]" : "text-muted hover:text-ink"}`}
          >
            {t(x.label)}
          </button>
        ))}
      </div>

      {mine.loading ? (
        <Spinner />
      ) : mine.error ? (
        <ErrorNote message={mine.error.message} onRetry={mine.reload} />
      ) : !mine.data?.results.length ? (
        <EmptyState title={t("dash.empty")} />
      ) : (
        <ul className="space-y-3">
          {mine.data.results.map((l) => (
            <li key={l.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <Link to={`/listings/${l.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-sand/60">
                  {l.cover_image ? <img src={l.cover_image} alt="" className="size-full object-cover" /> : <div className="grid size-full place-items-center text-muted"><Icon name="image" /></div>}
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-semibold">{l.title}</p>
                  <p className="font-display font-bold">{formatPrice(l.price)}</p>
                  <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
                    <StatusBadge status={l.status} /> {l.campus.name} · {formatDate(l.created_at)}
                  </p>
                </div>
              </Link>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                {["draft", "pending", "available", "rejected"].includes(l.status) && (
                  <ButtonLink variant="secondary" to={`/listings/${l.id}/edit`}><Icon name="edit" className="size-4" />{t("listing.edit")}</ButtonLink>
                )}
                {l.status === "available" && (
                  <Button variant="secondary" onClick={() => act(l, "sold")}><Icon name="check" className="size-4" />{t("dash.markSold")}</Button>
                )}
                {!["removed", "suspended"].includes(l.status) && (
                  <Button variant="danger" onClick={() => act(l, "remove")}><Icon name="trash" className="size-4" />{t("dash.remove")}</Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
