import { useEffect, useRef, useState } from "react";

import { useI18n } from "../../app/i18n";
import { Alert, Button, Field, Select, TextArea } from "../../components/ui";
import { ApiError, api } from "../../services/api";
import type { ReportReason } from "../../types/api";

const REASONS: ReportReason[] = ["scam", "misleading", "inappropriate", "duplicate", "already_sold", "other"];

export function ReportDialog({ listingId, onClose }: { listingId: string; onClose: () => void }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState<ReportReason>("scam");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      await api("/reports/", { method: "POST", body: { listing: listingId, reason, details } });
      setDone(true);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setSending(false);
    }
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-auto w-[min(92vw,28rem)] rounded-[var(--radius-card)] bg-paper p-0 text-ink shadow-[var(--shadow-lift)] backdrop:bg-ink/40"
    >
      <form onSubmit={submit} className="space-y-4 p-6">
        <h2 className="text-xl font-bold">{t("report.title")}</h2>
        {done ? (
          <>
            <Alert tone="success">{t("report.thanks")}</Alert>
            <div className="flex justify-end">
              <Button type="button" onClick={() => ref.current?.close()}>OK</Button>
            </div>
          </>
        ) : (
          <>
            {error && !error.field("reason") && !error.field("details") && <Alert tone="error">{error.field("listing") ?? error.message}</Alert>}
            <Field label={t("report.reason")} error={error?.field("reason")}>
              {(p) => (
                <Select {...p} value={reason} onChange={(e) => setReason(e.target.value as ReportReason)}>
                  {REASONS.map((r) => <option key={r} value={r}>{t(`report.${r}`)}</option>)}
                </Select>
              )}
            </Field>
            <Field label={reason === "other" ? t("report.detailsRequired") : t("report.details")} error={error?.field("details")}>
              {(p) => <TextArea {...p} value={details} maxLength={1000} onChange={(e) => setDetails(e.target.value)} className="min-h-24" />}
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => ref.current?.close()}>{t("form.cancel")}</Button>
              <Button type="submit" disabled={sending}>{t("report.submit")}</Button>
            </div>
          </>
        )}
      </form>
    </dialog>
  );
}
