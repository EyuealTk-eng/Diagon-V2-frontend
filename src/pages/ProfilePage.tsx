import { useState } from "react";

import { useAuth } from "../app/auth";
import { useI18n } from "../app/i18n";
import { useReference } from "../app/reference";
import { Icon } from "../components/Icon";
import { Alert, Button, Field, Select, TextInput, VerifiedBadge } from "../components/ui";
import { ApiError, DEMO, api } from "../services/api";
import type { Me } from "../types/api";

function VerificationCard({ user }: { user: Me }) {
  const { t } = useI18n();
  const { setUser } = useAuth();
  const [email, setEmail] = useState(user.email.endsWith("aau.edu.et") ? user.email : "");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  if (user.is_verified) {
    return (
      <section className="card space-y-2 p-5">
        <VerifiedBadge />
        <p className="text-sm text-muted">{t("profile.verifiedAs", { email: user.verified_email })}</p>
        <p className="text-xs text-muted">{t("listing.verifiedHelp")}</p>
      </section>
    );
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ demo_code?: string }>("/auth/verify-email/request/", { method: "POST", body: { email } });
      setDemoCode(res?.demo_code ?? null);
      setSentTo(email);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setUser(await api<Me>("/auth/verify-email/", { method: "POST", body: { code } }));
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card space-y-4 p-5">
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Icon name="shield" className="size-5 text-sage" />{t("profile.verifyTitle")}</h2>
        <p className="text-sm text-muted">{t("profile.verifyBody")}</p>
      </div>
      {sentTo ? (
        <form onSubmit={confirm} className="space-y-3">
          <Alert tone="success">{t("profile.codeSent", { email: sentTo })}</Alert>
          {demoCode && <Alert>{t("demo.code", { code: demoCode })}</Alert>}
          <Field label={t("profile.code")} error={error?.field("code") ?? (error && !error.field("code") ? error.message : undefined)}>
            {(p) => <TextInput {...p} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />}
          </Field>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy || code.length !== 6}>{t("profile.confirm")}</Button>
            <Button type="button" variant="ghost" onClick={() => setSentTo(null)}>{t("common.back")}</Button>
          </div>
        </form>
      ) : (
        <form onSubmit={send} className="space-y-3">
          <Field label={t("profile.verifyEmail")} error={error?.field("email") ?? (error && !error.field("email") ? error.message : undefined)}>
            {(p) => <TextInput {...p} type="email" required placeholder="name@aau.edu.et" value={email} onChange={(e) => setEmail(e.target.value)} />}
          </Field>
          <Button type="submit" disabled={busy}>{t("profile.sendCode")}</Button>
        </form>
      )}
    </section>
  );
}

function TelegramCard({ user }: { user: Me }) {
  const { t } = useI18n();
  const bot = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const link = async () => {
    setBusy(true);
    setError(null);
    try {
      const { token } = await api<{ token: string }>("/auth/telegram-link/", { method: "POST" });
      window.open(`https://t.me/${bot}?start=${token}`, "_blank", "noopener");
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card space-y-3 p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold"><Icon name="send" className="size-5 text-clay-dark" />{t("profile.telegramTitle")}</h2>
      {user.telegram_linked ? (
        <Alert tone="success">{t("profile.telegramLinked")}</Alert>
      ) : (
        <>
          <p className="text-sm text-muted">{t("profile.telegramHelp")}</p>
          {error && <Alert tone="error">{error}</Alert>}
          {bot && <Button variant="secondary" onClick={link} disabled={busy}>{t("profile.telegramLink")}</Button>}
        </>
      )}
    </section>
  );
}

export function ProfilePage() {
  const { t, formatDate } = useI18n();
  const { user, setUser, logout } = useAuth();
  const { campuses } = useReference();
  const [form, setForm] = useState({
    display_name: user?.display_name ?? "",
    campus_id: user?.campus?.id ? String(user.campus.id) : "",
    telegram_username: user?.telegram_username ?? "",
  });
  const [error, setError] = useState<ApiError | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!user) return null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      setUser(await api<Me>("/users/me/", {
        method: "PATCH",
        body: { ...form, campus_id: form.campus_id ? Number(form.campus_id) : null },
      }));
      setSaved(true);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{t("profile.title")}</h1>
        <Button variant="ghost" className="md:hidden" onClick={logout}>{t("nav.logout")}</Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <form onSubmit={save} className="card space-y-4 p-5 sm:p-6">
          {saved && <Alert tone="success">{t("profile.saved")}</Alert>}
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-muted">{t("auth.email")}</dt><dd className="truncate font-semibold">{user.email}</dd></div>
            <div><dt className="text-muted">{t("profile.memberSince")}</dt><dd className="font-semibold">{formatDate(user.created_at)}</dd></div>
            <div><dt className="text-muted">{t("profile.university")}</dt><dd className="font-semibold">{user.campus?.university?.name ?? "Addis Ababa University"}</dd></div>
          </dl>
          <Field label={t("auth.displayName")} error={error?.field("display_name")}>
            {(p) => <TextInput {...p} required maxLength={80} value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />}
          </Field>
          <Field label={t("auth.campus")} error={error?.field("campus_id")}>
            {(p) => (
              <Select {...p} value={form.campus_id} onChange={(e) => setForm({ ...form, campus_id: e.target.value })}>
                <option value="">—</option>
                {campuses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            )}
          </Field>
          <Field label={t("sell.fieldTelegram")} error={error?.field("telegram_username")}>
            {(p) => <TextInput {...p} placeholder="@username" value={form.telegram_username} onChange={(e) => setForm({ ...form, telegram_username: e.target.value })} />}
          </Field>
          <Button type="submit" disabled={busy}>{busy ? t("form.saving") : t("form.save")}</Button>
        </form>
        <div className="space-y-6">
          <VerificationCard user={user} />
          {!DEMO && <TelegramCard user={user} />}
        </div>
      </div>
    </div>
  );
}
