import { useI18n } from "../app/i18n";
import { ListingCard, ListingGrid } from "../components/ListingCard";
import { ButtonLink, EmptyState, ErrorNote, Spinner } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { useSaveToggle } from "../hooks/useSaveToggle";
import { api } from "../services/api";
import type { ListingCard as Listing, Paginated } from "../types/api";

export function SavedPage() {
  const { t } = useI18n();
  const saved = useAsync((signal) => api<Paginated<Listing>>("/favorites/", { signal }), []);
  // Unsaved items disappear from this page.
  const toggleSave = useSaveToggle((id, isSaved) =>
    saved.setData((d) => d && { ...d, results: isSaved ? d.results : d.results.filter((l) => l.id !== id) }),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("saved.title")}</h1>
      {saved.loading ? (
        <Spinner />
      ) : saved.error ? (
        <ErrorNote message={saved.error.message} onRetry={saved.reload} />
      ) : saved.data?.results.length ? (
        <ListingGrid>{saved.data.results.map((l) => <ListingCard key={l.id} listing={l} onToggleSave={toggleSave} />)}</ListingGrid>
      ) : (
        <EmptyState title={t("saved.empty")} action={<ButtonLink to="/explore">{t("nav.explore")}</ButtonLink>} />
      )}
    </div>
  );
}
