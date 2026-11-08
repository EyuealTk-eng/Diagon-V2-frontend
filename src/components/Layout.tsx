import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../app/auth";
import { DEMO } from "../services/api";
import { useI18n } from "../app/i18n";
import { Icon, type IconName } from "./Icon";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`font-display text-2xl font-extrabold tracking-tight text-ink ${className}`}>
      DIAGON<span className="text-clay">.</span>
    </Link>
  );
}

function LanguageToggle() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="flex items-center rounded-full border border-sand bg-paper p-0.5 text-sm" role="group" aria-label={t("nav.language")}>
      {(["en", "am"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`rounded-full px-2.5 py-1 font-semibold transition-colors ${lang === code ? "bg-ink text-cream" : "text-muted hover:text-ink"}`}
        >
          {code === "en" ? "EN" : "አማ"}
        </button>
      ))}
    </div>
  );
}

function AccountMenu() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/login" className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-sand/60">
          {t("nav.login")}
        </Link>
        <Link to="/register" className="hidden rounded-xl bg-ink px-3.5 py-2 text-sm font-semibold text-cream hover:bg-ink/90 sm:inline-flex">
          {t("nav.register")}
        </Link>
      </div>
    );
  }

  const item = "block rounded-lg px-3 py-2 text-sm hover:bg-cream";
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-sand bg-paper py-1 pl-1 pr-3 text-sm font-semibold hover:border-clay/50"
      >
        <span className="grid size-7 place-items-center rounded-full bg-clay-soft text-clay-dark">
          {user.display_name.slice(0, 1).toUpperCase()}
        </span>
        <span className="max-w-24 truncate">{user.display_name}</span>
      </button>
      {open && (
        <div role="menu" className="card absolute right-0 top-full z-30 mt-2 w-56 p-1.5">
          <Link role="menuitem" to="/dashboard" className={item}>{t("nav.dashboard")}</Link>
          <Link role="menuitem" to="/saved" className={item}>{t("nav.saved")}</Link>
          <Link role="menuitem" to="/profile" className={item}>{t("nav.profile")}</Link>
          {user.is_moderator && <Link role="menuitem" to="/admin" className={item}>{t("nav.admin")}</Link>}
          <hr className="my-1 border-sand" />
          <button role="menuitem" type="button" onClick={logout} className={`${item} w-full text-left text-danger`}>
            {t("nav.logout")}
          </button>
        </div>
      )}
    </div>
  );
}

export function SearchBar({ initial = "", large = false }: { initial?: string; large?: boolean }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [q, setQ] = useState(initial);
  useEffect(() => {
    setQ(initial);
  }, [initial]);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        navigate(`/explore${q.trim() ? `?search=${encodeURIComponent(q.trim())}` : ""}`);
      }}
      className={`flex w-full items-center gap-2 rounded-2xl border border-sand bg-paper shadow-[var(--shadow-soft)] focus-within:border-clay focus-within:ring-2 focus-within:ring-clay/25 ${large ? "p-2" : "p-1"}`}
    >
      <Icon name="search" className={`ml-2 shrink-0 text-muted ${large ? "size-6" : "size-5"}`} />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("search.placeholder")}
        aria-label={t("search.button")}
        className={`min-w-0 flex-1 bg-transparent text-ink placeholder:text-muted/70 focus:outline-none ${large ? "py-2.5 text-base sm:text-lg" : "py-1.5 text-sm"}`}
      />
      <button type="submit" className={`shrink-0 rounded-xl bg-clay font-semibold text-white hover:bg-clay-dark ${large ? "px-5 py-3" : "px-3.5 py-1.5 text-sm"}`}>
        {t("search.button")}
      </button>
    </form>
  );
}

function DemoBanner() {
  const { t } = useI18n();
  if (!DEMO) return null;
  const reset = async () => {
    if (!window.confirm(t("demo.resetConfirm"))) return;
    const { resetDemo } = await import("../services/demo/server");
    resetDemo();
    window.location.assign("/");
  };
  return (
    <div className="bg-ink px-4 py-2 text-center text-xs text-cream sm:text-sm">
      {t("demo.banner")}{" "}
      <button type="button" onClick={reset} className="font-semibold text-clay-soft underline underline-offset-2 hover:text-white">
        {t("demo.reset")}
      </button>
    </div>
  );
}

function Header() {
  const { t } = useI18n();
  const location = useLocation();
  const showSearch = location.pathname !== "/";
  const link = ({ isActive }: { isActive: boolean }) =>
    `rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${isActive ? "bg-sand/70 text-ink" : "text-ink/80 hover:bg-sand/50 hover:text-ink"}`;

  return (
    <header className="sticky top-0 z-20 border-b border-sand/80 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          <NavLink to="/explore" className={link} end>{t("nav.explore")}</NavLink>
          <NavLink to="/categories" className={link}>{t("nav.categories")}</NavLink>
          <NavLink to="/sell" className={link}>{t("nav.sell")}</NavLink>
          <NavLink to="/saved" className={link}>{t("nav.saved")}</NavLink>
        </nav>
        <div className="hidden flex-1 lg:block">{showSearch && <div className="mx-auto max-w-md"><SearchBar /></div>}</div>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <LanguageToggle />
          <div className="hidden md:block"><AccountMenu /></div>
        </div>
      </div>
    </header>
  );
}

function BottomNav() {
  const { t } = useI18n();
  const items: [string, IconName, string][] = [
    ["/", "home", t("nav.home")],
    ["/explore", "compass", t("nav.explore")],
    ["/sell", "plus", t("nav.sell")],
    ["/saved", "heart", t("nav.saved")],
    ["/profile", "user", t("nav.profile")],
  ];
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-sand bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map(([to, icon, label]) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${isActive ? "text-clay-dark" : "text-muted"}`
              }
            >
              {to === "/sell" ? (
                <span className="grid size-8 place-items-center rounded-full bg-clay text-white">
                  <Icon name={icon} className="size-5" />
                </span>
              ) : (
                <Icon name={icon} className="size-6" />
              )}
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-16 border-t border-sand bg-paper/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-2">
          <Logo />
          <p className="text-sm text-muted">{t("brand.line")} · {t("brand.tagline")}</p>
          <p className="text-xs text-muted">{t("footer.note")}</p>
        </div>
        <nav className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm sm:grid-cols-3" aria-label="Footer">
          <Link to="/about" className="hover:text-clay-dark">{t("footer.about")}</Link>
          <Link to="/safety" className="hover:text-clay-dark">{t("footer.safety")}</Link>
          <Link to="/help" className="hover:text-clay-dark">{t("footer.help")}</Link>
          <Link to="/help#contact" className="hover:text-clay-dark">{t("footer.contact")}</Link>
          <Link to="/terms" className="hover:text-clay-dark">{t("footer.terms")}</Link>
        </nav>
      </div>
    </footer>
  );
}

export function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <div className="flex min-h-dvh flex-col pb-20 md:pb-0">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-cream">
        Skip to content
      </a>
      <DemoBanner />
      <Header />
      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
