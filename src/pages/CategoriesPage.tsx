import { Link } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { useReference } from "../app/reference";
import { Icon, categoryIcon } from "../components/Icon";
import { Spinner } from "../components/ui";

export function CategoriesPage() {
  const { t, categoryName } = useI18n();
  const { topCategories, childrenOf, loaded } = useReference();
  if (!loaded) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("nav.categories")}</h1>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {topCategories.map((c) => (
          <li key={c.slug} className="card p-5">
            <Link to={`/explore?category=${c.slug}`} className="flex items-center gap-3 font-display text-lg font-bold hover:text-clay-dark">
              <span className="grid size-11 place-items-center rounded-2xl bg-cream text-clay-dark">
                <Icon name={categoryIcon[c.slug] ?? "tag"} className="size-6" />
              </span>
              {categoryName(c)}
            </Link>
            {childrenOf(c.slug).length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {childrenOf(c.slug).map((child) => (
                  <li key={child.slug}>
                    <Link to={`/explore?category=${child.slug}`} className="chip hover:bg-clay-soft">
                      {categoryName(child)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
