import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { storage } from "../services/storage";
import type { Category, Lang } from "../types/api";
import { am, en, type MessageKey } from "./messages";

interface I18n {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  categoryName: (c: Pick<Category, "name_en" | "name_am">) => string;
  formatPrice: (price: string | number) => string;
  formatDate: (iso: string) => string;
}

const I18nContext = createContext<I18n | null>(null);
const LANG_KEY = "diagon.lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (storage.get(LANG_KEY) === "am" ? "am" : "en"));

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    storage.set(LANG_KEY, next);
    setLangState(next);
  }, []);

  const value = useMemo<I18n>(() => {
    const dict = lang === "am" ? am : en;
    const locale = lang === "am" ? "am-ET" : "en-US";
    const numberFmt = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
    const dateFmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" });
    return {
      lang,
      setLang,
      t: (key, vars) => {
        let text: string = dict[key] ?? en[key] ?? key;
        if (vars) for (const [k, v] of Object.entries(vars)) text = text.replace(`{${k}}`, String(v));
        return text;
      },
      categoryName: (c) => (lang === "am" && c.name_am ? c.name_am : c.name_en),
      formatPrice: (price) => `${numberFmt.format(Number(price))} ${lang === "am" ? "ብር" : "ETB"}`,
      formatDate: (iso) => dateFmt.format(new Date(iso)),
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
