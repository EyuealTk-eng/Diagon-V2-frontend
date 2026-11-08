import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { useReference } from "../app/reference";
import { Icon } from "../components/Icon";
import { ListingCard, ListingGrid } from "../components/ListingCard";
import { Button, EmptyState, ErrorNote, Select, Spinner, TextInput } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { useSaveToggle } from "../hooks/useSaveToggle";
import { api } from "../services/api";
import type { ListingCard as Listing, Paginated } from "../types/api";

// Every filter lives in the URL so results can be shared.
const FILTER_KEYS = ["search", "campus", "category", "min_price", "max_price", "condition", "availability", "ordering"] as const;

function Filters({ params, setParam, clear }: { params: URLSearchParams; setParam: (k: string, v: string) => void; clear: () => void }) {
  const { t, categoryName } = useI18n();
  const { campuses, topCategories, childrenOf } = useReference();
  const [minPrice, setMinPrice] = useState(params.get("min_price") ?? "");
  const [maxPrice, setMaxPrice] = useState(params.get("max_price") ?? "");
  useEffect(() => {
    setMinPrice(params.get("min_price") ?? "");
    setMaxPrice(params.get("max_price") ?? "");
  }, [params]);

  const label = "mb-1.5 block text-sm font-semibold";
  return (
    <div className="space-y-5">
      <div>
        <label className={label} htmlFor="f-campus">{t("explore.campus")}</label>
        <Select id="f-campus" value={params.get("campus") ?? ""} onChange={(e) => setParam("campus", e.target.value)}>
          <option value="">{t("explore.allCampuses")}</option>
          {campuses.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </Select>
      </div>
      <div>
        <label className={label} htmlFor="f-category">{t("explore.category")}</label>
        <Select id="f-category" value={params.get("category") ?? ""} onChange={(e) => setParam("category", e.target.value)}>
          <option value="">{t("explore.allCategories")}</option>
          {topCategories.map((c) => (
            <optgroup key={c.slug} label={categoryName(c)}>
              <option value={c.slug}>{categoryName(c)} — {t("explore.all")}</option>
              {childrenOf(c.slug).map((child) => <option key={child.slug} value={child.slug}>{categoryName(child)}</option>)}
            </optgroup>
          ))}
        </Select>
      </div>
      <fieldset>
        <legend className={label}>{t("explore.price")}</legend>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setParam("min_price", minPrice);
            setParam("max_price", maxPrice);
          }}
          onBlur={() => {
            setParam("min_price", minPrice);
            setParam("max_price", maxPrice);
          }}
        >
          <TextInput inputMode="numeric" placeholder={t("explore.min")} aria-label={t("explore.min")} value={minPrice} onChange={(e) => setMinPrice(e.target.value.replace(/[^\d]/g, ""))} />
          <span className="text-muted">–</span>
          <TextInput inputMode="numeric" placeholder={t("explore.max")} aria-label={t("explore.max")} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/[^\d]/g, ""))} />
          <button type="submit" className="sr-only">{t("search.button")}</button>
        </form>
      </fieldset>
      <div>
        <label className={label} htmlFor="f-condition">{t("explore.condition")}</label>
        <Select id="f-condition" value={params.get("condition") ?? ""} onChange={(e) => setParam("condition", e.target.value)}>
          <option value="">{t("explore.all")}</option>
          {(["new", "like_new", "good", "fair"] as const).map((c) => <option key={c} value={c}>{t(`condition.${c}`)}</option>)}
        </Select>
      </div>
      <fieldset>
        <legend className={label}>{t("explore.availability")}</legend>
        <div className="flex flex-wrap gap-2">
          {([["", t("explore.availableOnly")], ["sold", t("explore.soldOnly")], ["all", t("explore.all")]] as const).map(([value, text]) => {
            const active = (params.get("availability") ?? "") === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => setParam("availability", value)}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${active ? "border-clay bg-clay-soft text-clay-dark" : "border-sand bg-paper text-ink hover:border-clay/50"}`}
              >
                {text}
              </button>
            );
          })}
        </div>
      </fieldset>
      <button type="button" onClick={clear} className="text-sm font-semibold text-clay-dark hover:underline">
        {t("explore.clear")}
      </button>
    </div>
  );
}

export function ExplorePage() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const [panelOpen, setPanelOpen] = useState(false);
  const [extra, setExtra] = useState<Listing[]>([]);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const query = Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) ?? undefined]));
  const key = FILTER_KEYS.map((k) => params.get(k) ?? "").join("|");

  const results = useAsync(async (signal) => {
    const data = await api<Paginated<Listing>>("/listings/", { query, signal });
    setExtra([]);
    setNextPage(data.next ? 2 : null);
    return data;
  }, [key]);

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if ((params.get(k) ?? "") !== v) setParams(next, { replace: true });
  };
  const clear = () => setParams(params.get("search") ? { search: params.get("search")! } : {}, { replace: true });

  const updateSaved = (id: string, saved: boolean) => {
    const patch = (l: Listing) => (l.id === id ? { ...l, is_saved: saved } : l);
    results.setData((d) => d && { ...d, results: d.results.map(patch) });
    setExtra((list) => list.map(patch));
  };
  const toggleSave = useSaveToggle(updateSaved);

  const loadMore = async () => {
    if (!nextPage) return;
    setLoadingMore(true);
    try {
      const data = await api<Paginated<Listing>>("/listings/", { query: { ...query, page: nextPage } });
      setExtra((list) => [...list, ...data.results]);
      setNextPage(data.next ? nextPage + 1 : null);
    } finally {
      setLoadingMore(false);
    }
  };

  const listings = [...(results.data?.results ?? []), ...extra];
  const search = params.get("search");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{search ? `“${search}”` : t("explore.title")}</h1>
          {results.data && <p className="mt-1 text-muted">{t("explore.results", { count: results.data.count })}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="lg:hidden" onClick={() => setPanelOpen(true)} aria-expanded={panelOpen}>
            <Icon name="filter" className="size-4" />
            {t("explore.filters")}
          </Button>
          <label htmlFor="sort" className="sr-only">{t("explore.sort")}</label>
          <Select id="sort" className="w-auto" value={params.get("ordering") ?? "-created_at"} onChange={(e) => setParam("ordering", e.target.value === "-created_at" ? "" : e.target.value)}>
            <option value="-created_at">{t("explore.sortNewest")}</option>
            <option value="price">{t("explore.sortPriceAsc")}</option>
            <option value="-price">{t("explore.sortPriceDesc")}</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="card sticky top-24 p-5">
            <Filters params={params} setParam={setParam} clear={clear} />
          </div>
        </aside>

        {/* Mobile slide-over */}
        {panelOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label={t("explore.filters")}>
            <button type="button" aria-label={t("form.cancel")} className="absolute inset-0 bg-ink/40" onClick={() => setPanelOpen(false)} />
            <div className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col bg-cream shadow-[var(--shadow-lift)]">
              <div className="flex items-center justify-between border-b border-sand p-4">
                <h2 className="text-lg font-bold">{t("explore.filters")}</h2>
                <button type="button" onClick={() => setPanelOpen(false)} aria-label={t("form.cancel")} className="rounded-lg p-1.5 hover:bg-sand/60">
                  <Icon name="x" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4"><Filters params={params} setParam={setParam} clear={clear} /></div>
              <div className="border-t border-sand p-4">
                <Button className="w-full" onClick={() => setPanelOpen(false)}>{t("explore.applyFilters")}</Button>
              </div>
            </div>
          </div>
        )}

        <section aria-live="polite">
          {results.loading ? (
            <Spinner />
          ) : results.error ? (
            <ErrorNote message={results.error.message} onRetry={results.reload} />
          ) : listings.length ? (
            <div className="space-y-8">
              <ListingGrid>{listings.map((l) => <ListingCard key={l.id} listing={l} onToggleSave={toggleSave} />)}</ListingGrid>
              {nextPage && (
                <div className="flex justify-center">
                  <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? t("common.loading") : t("explore.loadMore")}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <EmptyState title={t("explore.noResults")} action={<Button variant="secondary" onClick={clear}>{t("explore.clear")}</Button>} />
          )}
        </section>
      </div>
    </div>
  );
}
