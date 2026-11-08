import { Link } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { useReference } from "../app/reference";
import { Icon, categoryIcon } from "../components/Icon";
import { SearchBar } from "../components/Layout";
import { ListingCard, ListingGrid } from "../components/ListingCard";
import { ButtonLink, EmptyState, ErrorNote, Spinner } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { useSaveToggle } from "../hooks/useSaveToggle";
import { api } from "../services/api";
import type { ListingCard as Listing, Paginated } from "../types/api";

const SUGGESTIONS = ["laptop", "textbook", "calculator", "furniture"];

export function HomePage() {
  const { t, categoryName } = useI18n();
  const { topCategories } = useReference();
  const latest = useAsync(
    (signal) => api<Paginated<Listing>>("/listings/", { query: { page_size: 8 }, signal }),
    [],
  );
  const toggleSave = useSaveToggle((id, saved) =>
    latest.setData((d) => d && { ...d, results: d.results.map((l) => (l.id === id ? { ...l, is_saved: saved } : l)) }),
  );

  return (
    <div className="space-y-12">
      {/* Search hero */}
      <section className="relative overflow-hidden rounded-[2rem] bg-paper px-5 py-10 shadow-[var(--shadow-soft)] sm:px-10 sm:py-14">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-clay-soft/80 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-sand/70 blur-2xl" />
        <div className="relative max-w-2xl space-y-5">
          <p className="chip bg-clay-soft text-clay-dark">Addis Ababa University</p>
          <h1 className="text-4xl font-extrabold leading-[1.1] text-ink sm:text-5xl">{t("brand.line")}</h1>
          <p className="text-lg text-muted">{t("brand.tagline")}</p>
          <SearchBar large />
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">{t("search.try")}</span>
            {SUGGESTIONS.map((s) => (
              <Link key={s} to={`/explore?search=${s}`} className="chip hover:bg-clay-soft">
                {s}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section aria-labelledby="cat-title" className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 id="cat-title" className="text-2xl font-bold">{t("home.categoriesTitle")}</h2>
          <Link to="/categories" className="text-sm font-semibold text-clay-dark hover:underline">{t("home.seeAll")}</Link>
        </div>
        <ul className="grid grid-cols-4 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {topCategories.map((c) => (
            <li key={c.slug}>
              <Link
                to={`/explore?category=${c.slug}`}
                className="card flex h-full flex-col items-center gap-2 px-2 py-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
              >
                <span className="grid size-11 place-items-center rounded-2xl bg-cream text-clay-dark">
                  <Icon name={categoryIcon[c.slug] ?? "tag"} className="size-6" />
                </span>
                <span className="text-xs font-semibold leading-tight text-ink sm:text-sm">{categoryName(c)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Announcement — reserved for real campus announcements or, later, paid boosts. */}
      <section className="flex flex-col items-start gap-4 rounded-[1.75rem] bg-ink px-6 py-8 text-cream sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">{t("home.announceTitle")}</h2>
          <p className="max-w-xl text-cream/80">{t("home.announceBody")}</p>
        </div>
        <ButtonLink to="/sell" className="shrink-0">
          <Icon name="plus" className="size-4" />
          {t("home.announceCta")}
        </ButtonLink>
      </section>

      {/* Latest */}
      <section aria-labelledby="latest-title" className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 id="latest-title" className="text-2xl font-bold">{t("home.latestTitle")}</h2>
          <Link to="/explore" className="text-sm font-semibold text-clay-dark hover:underline">{t("home.seeAll")}</Link>
        </div>
        {latest.loading ? (
          <Spinner />
        ) : latest.error ? (
          <ErrorNote message={latest.error.message} onRetry={latest.reload} />
        ) : latest.data?.results.length ? (
          <ListingGrid>
            {latest.data.results.map((l) => (
              <ListingCard key={l.id} listing={l} onToggleSave={toggleSave} />
            ))}
          </ListingGrid>
        ) : (
          <EmptyState title={t("home.empty")} action={<ButtonLink to="/sell">{t("home.announceCta")}</ButtonLink>} />
        )}
      </section>
    </div>
  );
}
