import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { api } from "../services/api";
import type { Campus, Category } from "../types/api";

interface ReferenceData {
  campuses: Campus[];
  categories: Category[];
  topCategories: Category[];
  childrenOf: (slug: string) => Category[];
  loaded: boolean;
}

const ReferenceContext = createContext<ReferenceData | null>(null);

const parentSlug = (c: Category) => (typeof c.parent === "string" ? c.parent : (c.parent?.slug ?? null));

export function ReferenceProvider({ children }: { children: ReactNode }) {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([api<Campus[]>("/campuses/"), api<Category[]>("/categories/")])
      .then(([c, cat]) => {
        setCampuses(c);
        setCategories(cat);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  const value = useMemo<ReferenceData>(
    () => ({
      campuses,
      categories,
      loaded,
      topCategories: categories.filter((c) => !parentSlug(c)),
      childrenOf: (slug) => categories.filter((c) => parentSlug(c) === slug),
    }),
    [campuses, categories, loaded],
  );
  return <ReferenceContext.Provider value={value}>{children}</ReferenceContext.Provider>;
}

export function useReference(): ReferenceData {
  const ctx = useContext(ReferenceContext);
  if (!ctx) throw new Error("useReference must be used inside ReferenceProvider");
  return ctx;
}
