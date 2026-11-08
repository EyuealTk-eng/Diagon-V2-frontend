import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useId } from "react";
import { Link, type LinkProps } from "react-router-dom";

import { useI18n } from "../app/i18n";
import type { ListingStatus } from "../types/api";
import { Icon } from "./Icon";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-clay text-white hover:bg-clay-dark shadow-[var(--shadow-soft)]",
  secondary: "bg-paper text-ink border border-sand hover:border-clay/60 hover:bg-cream",
  ghost: "text-ink hover:bg-sand/60",
  danger: "bg-paper text-danger border border-danger/30 hover:bg-danger/5",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function ButtonLink({ variant = "primary", className = "", ...props }: LinkProps & { variant?: Variant }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: (props: { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string }) => ReactNode;
}

export function Field({ label, error, hint, children }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`field-input ${className}`} {...props} />;
}

export function TextArea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`field-input min-h-32 ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`field-input appearance-none bg-[length:16px] pr-9 ${className}`} {...props} />;
}

export function Spinner({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted" role="status">
      <span className="size-5 animate-spin rounded-full border-2 border-sand border-t-clay" />
      <span>{label ?? t("common.loading")}</span>
    </div>
  );
}

export function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-4 px-6 py-14 text-center">
      <div className="grid size-14 place-items-center rounded-full bg-clay-soft text-clay-dark">
        <Icon name="tag" className="size-6" />
      </div>
      <p className="max-w-sm text-muted">{title}</p>
      {action}
    </div>
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center" role="alert">
      <p className="text-danger">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
}

export function Alert({ tone = "info", children }: { tone?: "info" | "success" | "error"; children: ReactNode }) {
  const tones = {
    info: "bg-clay-soft/60 text-ink border-clay/30",
    success: "bg-sage-soft text-sage border-sage/30",
    error: "bg-danger/5 text-danger border-danger/30",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`} role={tone === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}

export function VerifiedBadge({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-sage-soft px-2 py-0.5 text-xs font-semibold text-sage"
      title={t("listing.verifiedHelp")}
    >
      <Icon name="shield" className="size-3.5" />
      {compact ? <span className="sr-only">{t("listing.verified")}</span> : t("listing.verified")}
    </span>
  );
}

const statusTone: Record<ListingStatus, string> = {
  draft: "bg-sand text-ink",
  pending: "bg-clay-soft text-clay-dark",
  available: "bg-sage-soft text-sage",
  sold: "bg-ink text-cream",
  rejected: "bg-danger/10 text-danger",
  suspended: "bg-danger/10 text-danger",
  expired: "bg-sand text-muted",
  removed: "bg-sand text-muted",
};

export function StatusBadge({ status }: { status: ListingStatus }) {
  const { t } = useI18n();
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone[status]}`}>
      {t(`status.${status}`)}
    </span>
  );
}
