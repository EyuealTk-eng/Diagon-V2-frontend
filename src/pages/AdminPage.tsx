import { useState } from "react";
import { Link } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { Button, EmptyState, ErrorNote, Spinner } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { api } from "../services/api";
import type { ListingCard, ModerationActionEntry, ModerationReport, Paginated } from "../types/api";

type Tab = "pending" | "reports" | "history";

function askReason(prompt: string): string | null {
  const reason = window.prompt(prompt);
  return reason === null ? null : reason.trim();
}

function ListingRow({ listing, children }: { listing: ListingCard; children?: React.ReactNode }) {
  const { formatPrice } = useI18n();
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Link to={`/listings/${listing.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-sand/60">
          {listing.cover_image && <img src={listing.cover_image} alt="" className="size-full object-cover" />}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold">{listing.title}</p>
          <p className="text-sm text-muted">{formatPrice(listing.price)} · {listing.campus.name}</p>
        </div>
      </Link>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function AdminPage() {
  const { t, formatDate } = useI18n();
  const [tab, setTab] = useState<Tab>("pending");
  const summary = useAsync((signal) => api<{ pending_listings: number; open_reports: number }>("/moderation/summary/", { signal }), [tab]);
  const pending = useAsync((signal) => api<Paginated<ListingCard>>("/moderation/listings/", { signal }), [tab === "pending"]);
  const reports = useAsync((signal) => api<Paginated<ModerationReport>>("/moderation/reports/", { signal }), [tab === "reports"]);
  const history = useAsync((signal) => api<Paginated<ModerationActionEntry>>("/moderation/history/", { signal }), [tab === "history"]);

  const run = async (fn: () => Promise<unknown>, reload: () => void) => {
    try {
      await fn();
      reload();
      summary.reload();
    } catch (err) {
      window.alert((err as Error).message);
    }
  };

  const moderate = (listing: ListingCard, action: string, needsReason: boolean) => {
    const reason = needsReason ? askReason(t("admin.reasonPrompt")) : "";
    if (reason === null) return;
    run(() => api(`/moderation/listings/${listing.id}/action/`, { method: "POST", body: { action, reason } }), pending.reload);
  };

  const resolve = (report: ModerationReport, outcome: "resolved" | "dismissed", listingAction?: "suspend" | "remove") => {
    const reason = askReason(t("admin.reasonPrompt"));
    if (reason === null) return;
    run(
      () => api(`/moderation/reports/${report.id}/resolve/`, { method: "POST", body: { outcome, reason, listing_action: listingAction ?? null } }),
      reports.reload,
    );
  };

  const tabs: [Tab, string, number | undefined][] = [
    ["pending", t("admin.pending"), summary.data?.pending_listings],
    ["reports", t("admin.reports"), summary.data?.open_reports],
    ["history", t("admin.history"), undefined],
  ];

  const current = tab === "pending" ? pending : tab === "reports" ? reports : history;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("admin.title")}</h1>
      <div role="tablist" className="flex gap-1 overflow-x-auto rounded-2xl bg-sand/50 p-1">
        {tabs.map(([key, label, count]) => (
          <button key={key} role="tab" type="button" aria-selected={tab === key} onClick={() => setTab(key)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${tab === key ? "bg-paper shadow-[var(--shadow-soft)]" : "text-muted hover:text-ink"}`}>
            {label}
            {count !== undefined && <span className="rounded-full bg-clay px-2 text-xs text-white">{count}</span>}
          </button>
        ))}
      </div>

      {current.loading ? (
        <Spinner />
      ) : current.error ? (
        <ErrorNote message={current.error.message} onRetry={current.reload} />
      ) : tab === "pending" ? (
        pending.data?.results.length ? (
          <ul className="space-y-3">
            {pending.data.results.map((l) => (
              <li key={l.id} className="card p-4">
                <ListingRow listing={l}>
                  <Button onClick={() => moderate(l, "approve", false)}>{t("admin.approve")}</Button>
                  <Button variant="danger" onClick={() => moderate(l, "reject", true)}>{t("admin.reject")}</Button>
                </ListingRow>
              </li>
            ))}
          </ul>
        ) : <EmptyState title={t("admin.empty")} />
      ) : tab === "reports" ? (
        reports.data?.results.length ? (
          <ul className="space-y-3">
            {reports.data.results.map((r) => (
              <li key={r.id} className="card space-y-3 p-4">
                <p className="text-sm">
                  <span className="font-semibold text-danger">{r.reason_display}</span>
                  <span className="text-muted"> · {t("admin.reportedBy", { name: r.reporter })} · {formatDate(r.created_at)}</span>
                </p>
                {r.details && <p className="rounded-xl bg-cream p-3 text-sm">{r.details}</p>}
                <ListingRow listing={r.listing}>
                  <Button variant="danger" onClick={() => resolve(r, "resolved", "suspend")}>{t("admin.suspend")}</Button>
                  <Button variant="danger" onClick={() => resolve(r, "resolved", "remove")}>{t("admin.remove")}</Button>
                  <Button variant="secondary" onClick={() => resolve(r, "dismissed")}>{t("admin.dismiss")}</Button>
                </ListingRow>
              </li>
            ))}
          </ul>
        ) : <EmptyState title={t("admin.empty")} />
      ) : history.data?.results.length ? (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-sand text-muted">
              <tr><th className="p-3">Date</th><th className="p-3">Moderator</th><th className="p-3">Action</th><th className="p-3">Listing / user</th><th className="p-3">Reason</th></tr>
            </thead>
            <tbody>
              {history.data.results.map((h) => (
                <tr key={h.id} className="border-b border-sand/60 last:border-0">
                  <td className="p-3 whitespace-nowrap">{formatDate(h.created_at)}</td>
                  <td className="p-3">{h.moderator}</td>
                  <td className="p-3 font-semibold">{h.action.replace("_", " ")}</td>
                  <td className="p-3">{h.listing ? <Link className="text-clay-dark hover:underline" to={`/listings/${h.listing}`}>{h.listing_title}</Link> : h.target_user}</td>
                  <td className="p-3 text-muted">{h.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState title={t("admin.empty")} />}
    </div>
  );
}
