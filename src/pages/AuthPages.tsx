import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../app/auth";
import { useI18n } from "../app/i18n";
import { useReference } from "../app/reference";
import { Logo } from "../components/Layout";
import { Alert, Button, Field, Select, TextInput } from "../components/ui";
import { ApiError, DEMO, api } from "../services/api";
import { DEMO_ACCOUNTS } from "../services/demo/seed";

function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md py-6">
      <div className="card space-y-6 p-6 sm:p-8">
        <div className="space-y-2 text-center">
          <Logo />
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}

function useRedirectTarget() {
  const location = useLocation();
  return (location.state as { from?: string } | null)?.from ?? "/";
}

export function LoginPage() {
  const { t } = useI18n();
  const { login } = useAuth();
  const navigate = useNavigate();
  const target = useRedirectTarget();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigate(target, { replace: true });
    } catch (err) {
      setError((err as ApiError).status === 401 ? t("auth.badLogin") : (err as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title={t("auth.loginTitle")}>
      {location.state?.from && !error && <Alert>{t("auth.loginRequired")}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}
      {DEMO && (
        <div className="space-y-2 rounded-xl border border-sand bg-cream p-3 text-sm">
          <p className="font-semibold">{t("demo.accounts")}</p>
          {DEMO_ACCOUNTS.map((a) => (
            <div key={a.email} className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate">
                <span className="font-semibold">{a.is_staff ? t("demo.moderator") : t("demo.seller")}</span>
                <span className="text-muted"> · {a.email}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setEmail(a.email);
                  setPassword(a.password);
                }}
                className="shrink-0 rounded-lg bg-paper px-2.5 py-1 font-semibold text-clay-dark ring-1 ring-sand hover:ring-clay"
              >
                {t("demo.use")}
              </button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={submit} className="space-y-4">
        <Field label={t("auth.email")}>
          {(p) => <TextInput {...p} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />}
        </Field>
        <Field label={t("auth.password")}>
          {(p) => <TextInput {...p} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />}
        </Field>
        <Button type="submit" className="w-full" disabled={busy}>{t("auth.loginCta")}</Button>
      </form>
      <p className="text-center text-sm text-muted">
        {t("auth.noAccount")}{" "}
        <Link to="/register" state={location.state} className="font-semibold text-clay-dark hover:underline">{t("nav.register")}</Link>
      </p>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { t, lang } = useI18n();
  const { campuses } = useReference();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "", display_name: "", campus_id: "", telegram_username: "" });
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/auth/register/", {
        method: "POST",
        body: { ...form, campus_id: form.campus_id ? Number(form.campus_id) : null, preferred_language: lang },
      });
      await login(form.email.trim(), form.password);
      navigate("/profile", { replace: true, state: location.state });
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setBusy(false);
    }
  };

  const fieldErrorKeys = ["email", "password", "display_name", "campus_id", "telegram_username"];
  const generalError = error && !fieldErrorKeys.some((k) => error.field(k)) ? error.message : null;

  return (
    <AuthShell title={t("auth.registerTitle")}>
      {generalError && <Alert tone="error">{generalError}</Alert>}
      <form onSubmit={submit} className="space-y-4">
        <Field label={t("auth.displayName")} error={error?.field("display_name")}>
          {(p) => <TextInput {...p} required maxLength={80} autoComplete="nickname" value={form.display_name} onChange={set("display_name")} />}
        </Field>
        <Field label={t("auth.email")} error={error?.field("email")}>
          {(p) => <TextInput {...p} type="email" required autoComplete="email" value={form.email} onChange={set("email")} />}
        </Field>
        <Field label={t("auth.password")} error={error?.field("password")}>
          {(p) => <TextInput {...p} type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={set("password")} />}
        </Field>
        <Field label={t("auth.campus")} error={error?.field("campus_id")}>
          {(p) => (
            <Select {...p} value={form.campus_id} onChange={set("campus_id")}>
              <option value="">—</option>
              {campuses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          )}
        </Field>
        <Field label={t("auth.telegram")} error={error?.field("telegram_username")}>
          {(p) => <TextInput {...p} placeholder="@username" value={form.telegram_username} onChange={set("telegram_username")} />}
        </Field>
        <Button type="submit" className="w-full" disabled={busy}>{t("auth.registerCta")}</Button>
      </form>
      <p className="text-center text-sm text-muted">
        {t("auth.haveAccount")}{" "}
        <Link to="/login" state={location.state} className="font-semibold text-clay-dark hover:underline">{t("nav.login")}</Link>
      </p>
    </AuthShell>
  );
}
