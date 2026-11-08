import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../app/auth";
import { useI18n } from "../app/i18n";
import { useReference } from "../app/reference";
import { Icon } from "../components/Icon";
import { Alert, Button, ErrorNote, Field, Select, Spinner, StatusBadge, TextArea, TextInput } from "../components/ui";
import { ApiError, api } from "../services/api";
import type { ListingDetail, ListingImage, ListingInput, ListingType } from "../types/api";

const MAX_PHOTOS = 8;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

const emptyForm = (campus = ""): ListingInput => ({
  listing_type: "item", title: "", category: "", price: "", description: "", campus,
  condition: "", pricing_type: "", availability: "", telegram_contact: "",
});

interface PendingPhoto { file: File; url: string }

export function SellPage() {
  const { uuid } = useParams();
  const editing = Boolean(uuid);
  const navigate = useNavigate();
  const { t, categoryName, formatPrice } = useI18n();
  const { user } = useAuth();
  const { campuses, topCategories, childrenOf } = useReference();

  const [form, setForm] = useState<ListingInput>(() => emptyForm(user?.campus?.slug));
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [existing, setExisting] = useState<ListingImage[]>([]);
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [step, setStep] = useState<"form" | "preview">("form");
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(editing);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!uuid) return;
    api<ListingDetail>(`/listings/${uuid}/`)
      .then((l) => {
        if (!l.is_owner) throw new ApiError(404, {});
        setListing(l);
        setExisting(l.images);
        setForm({
          listing_type: l.listing_type, title: l.title, category: l.category.slug, price: String(Number(l.price)),
          description: l.description, campus: l.campus.slug, condition: l.condition, pricing_type: l.pricing_type,
          availability: l.availability, telegram_contact: l.telegram_contact === user?.telegram_username ? "" : (l.telegram_contact ?? ""),
        });
      })
      .catch((err) => setLoadError(err))
      .finally(() => setLoading(false));
  }, [uuid, user?.telegram_username]);

  useEffect(() => () => pending.forEach((p) => URL.revokeObjectURL(p.url)), [pending]);

  const categoryOptions = useMemo(() => {
    const isService = form.listing_type === "service";
    return topCategories
      .filter((c) => (isService ? c.slug === "services" : c.slug !== "services"))
      .map((c) => ({ parent: c, children: childrenOf(c.slug) }));
  }, [form.listing_type, topCategories, childrenOf]);

  const set = <K extends keyof ListingInput>(k: K, v: ListingInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setType = (type: ListingType) => setForm((f) => ({ ...f, listing_type: type, category: "", condition: "", pricing_type: "" }));

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    setPhotoError(null);
    const room = MAX_PHOTOS - existing.length - pending.length;
    const accepted: PendingPhoto[] = [];
    for (const file of Array.from(files)) {
      if (!ACCEPTED.includes(file.type) || file.size > MAX_BYTES) {
        setPhotoError(t("sell.photosHint"));
        continue;
      }
      if (accepted.length >= room) break;
      accepted.push({ file, url: URL.createObjectURL(file) });
    }
    setPending((p) => [...p, ...accepted]);
    if (fileInput.current) fileInput.current.value = "";
  };

  const removeExisting = async (img: ListingImage) => {
    if (!listing) return;
    try {
      await api(`/listings/${listing.id}/images/${img.id}/`, { method: "DELETE" });
      setExisting((list) => list.filter((i) => i.id !== img.id));
    } catch (err) {
      setPhotoError((err as ApiError).field("image") ?? (err as ApiError).message);
    }
  };

  const removePending = (index: number) =>
    setPending((list) => {
      URL.revokeObjectURL(list[index].url);
      return list.filter((_, i) => i !== index);
    });

  /** Create or update the listing, then upload new photos. Returns the fresh listing. */
  const save = async (): Promise<ListingDetail | null> => {
    setBusy(true);
    setError(null);
    setPhotoError(null);
    try {
      const body = { ...form, price: form.price || "0" };
      let saved = listing
        ? await api<ListingDetail>(`/listings/${listing.id}/`, { method: "PATCH", body })
        : await api<ListingDetail>("/listings/", { method: "POST", body });
      setListing(saved);
      const queue = [...pending];
      for (const photo of queue) {
        const data = new FormData();
        data.append("image", photo.file);
        await api(`/listings/${saved.id}/images/`, { method: "POST", body: data });
        setPending((list) => list.filter((p) => p !== photo));
      }
      saved = await api<ListingDetail>(`/listings/${saved.id}/`);
      setListing(saved);
      setExisting(saved.images);
      return saved;
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.field("image")) setPhotoError(apiErr.field("image")!);
      else setError(apiErr);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return null;
    } finally {
      setBusy(false);
    }
  };

  const toPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (existing.length + pending.length === 0) {
      setPhotoError(t("sell.photosHint"));
      return;
    }
    if (await save()) {
      setStep("preview");
      window.scrollTo({ top: 0 });
    }
  };

  const saveDraft = async () => {
    if (await save()) navigate("/dashboard?tab=draft");
  };

  const publish = async () => {
    if (!listing) return;
    if (!["draft", "rejected"].includes(listing.status)) {
      navigate(`/listings/${listing.id}`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const published = await api<ListingDetail>(`/listings/${listing.id}/publish/`, { method: "POST" });
      navigate(`/listings/${published.id}`, { state: { flash: published.status === "pending" ? "pending" : "published" } });
    } catch (err) {
      setError(err as ApiError);
      setStep("form");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner />;
  if (loadError) return <ErrorNote message={loadError.status === 404 ? t("listing.notFound") : loadError.message} />;

  const fieldKeys: (keyof ListingInput)[] = ["listing_type", "title", "category", "price", "description", "campus", "condition", "pricing_type", "availability", "telegram_contact"];
  const generalError = error && !fieldKeys.some((k) => error.field(k)) ? (error.field("images") ?? error.field("status") ?? error.message) : null;
  const isService = form.listing_type === "service";

  if (step === "preview" && listing) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold">{t("sell.preview")}</h1>
        {generalError && <Alert tone="error">{generalError}</Alert>}
        <article className="card overflow-hidden">
          {listing.images[0] && <img src={listing.images[0].url} alt="" className="aspect-[4/3] w-full object-cover" />}
          <div className="space-y-3 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip">{categoryName(listing.category)}</span>
              <StatusBadge status={listing.status} />
            </div>
            <h2 className="text-2xl font-bold">{listing.title}</h2>
            <p className="font-display text-2xl font-bold text-clay-dark">{formatPrice(listing.price)}</p>
            <p className="text-sm text-muted">
              {listing.campus.name}
              {listing.condition && ` · ${t(`condition.${listing.condition}`)}`}
              {listing.pricing_type && ` · ${t(`pricing.${listing.pricing_type}`)}`}
              {listing.telegram_contact && ` · @${listing.telegram_contact}`}
            </p>
            <p className="whitespace-pre-line text-ink/90">{listing.description}</p>
            {listing.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pt-2">
                {listing.images.slice(1).map((img) => <img key={img.id} src={img.url} alt="" className="size-20 shrink-0 rounded-xl object-cover" />)}
              </div>
            )}
          </div>
        </article>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setStep("form")}>{t("sell.backToEdit")}</Button>
          <Button onClick={publish} disabled={busy}>
            {busy ? t("sell.publishing") : ["draft", "rejected"].includes(listing.status) ? t("sell.publish") : t("form.save")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={toPreview} className="mx-auto max-w-2xl space-y-6" noValidate>
      <h1 className="text-3xl font-bold">{editing ? t("sell.editTitle") : t("sell.title")}</h1>
      {generalError && <Alert tone="error">{generalError}</Alert>}
      {listing?.status === "rejected" && listing.status_reason && <Alert tone="error">{listing.status_reason}</Alert>}

      <section className="card space-y-5 p-5 sm:p-6">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">{t("sell.type")}</legend>
          <div className="grid grid-cols-2 gap-3">
            {(["item", "service"] as const).map((type) => (
              <label key={type} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 font-semibold transition-colors ${form.listing_type === type ? "border-clay bg-clay-soft/60" : "border-sand bg-paper hover:border-clay/50"}`}>
                <input type="radio" name="listing_type" value={type} checked={form.listing_type === type} onChange={() => setType(type)} className="accent-[var(--color-clay)]" />
                <Icon name={type === "item" ? "tag" : "wrench"} className="size-5 text-clay-dark" />
                {type === "item" ? t("sell.typeItem") : t("sell.typeService")}
              </label>
            ))}
          </div>
        </fieldset>

        <Field label={t("sell.fieldTitle")} hint={t("sell.fieldTitleHint")} error={error?.field("title")}>
          {(p) => <TextInput {...p} required maxLength={120} value={form.title} onChange={(e) => set("title", e.target.value)} />}
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("sell.fieldCategory")} error={error?.field("category")}>
            {(p) => (
              <Select {...p} required value={form.category} onChange={(e) => set("category", e.target.value)}>
                <option value="">{t("sell.chooseCategory")}</option>
                {categoryOptions.map(({ parent, children }) =>
                  children.length ? (
                    <optgroup key={parent.slug} label={categoryName(parent)}>
                      {children.map((c) => <option key={c.slug} value={c.slug}>{categoryName(c)}</option>)}
                    </optgroup>
                  ) : (
                    <option key={parent.slug} value={parent.slug}>{categoryName(parent)}</option>
                  ),
                )}
              </Select>
            )}
          </Field>
          <Field label={t("sell.fieldPrice")} error={error?.field("price")}>
            {(p) => <TextInput {...p} required inputMode="decimal" value={form.price} onChange={(e) => set("price", e.target.value.replace(/[^\d.]/g, ""))} />}
          </Field>
        </div>

        {isService ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t("sell.fieldPricing")} error={error?.field("pricing_type")}>
              {(p) => (
                <Select {...p} required value={form.pricing_type} onChange={(e) => set("pricing_type", e.target.value as ListingInput["pricing_type"])}>
                  <option value="">—</option>
                  {(["fixed", "hourly", "negotiable"] as const).map((v) => <option key={v} value={v}>{t(`pricing.${v}`)}</option>)}
                </Select>
              )}
            </Field>
            <Field label={t("sell.fieldAvailability")} hint={t("sell.fieldAvailabilityHint")} error={error?.field("availability")}>
              {(p) => <TextInput {...p} maxLength={200} value={form.availability} onChange={(e) => set("availability", e.target.value)} />}
            </Field>
          </div>
        ) : (
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">{t("sell.fieldCondition")}</legend>
            <div className="flex flex-wrap gap-2">
              {(["new", "like_new", "good", "fair"] as const).map((c) => (
                <label key={c} className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold ${form.condition === c ? "border-clay bg-clay-soft text-clay-dark" : "border-sand bg-paper hover:border-clay/50"}`}>
                  <input type="radio" name="condition" value={c} checked={form.condition === c} onChange={() => set("condition", c)} className="sr-only" />
                  {t(`condition.${c}`)}
                </label>
              ))}
            </div>
            {error?.field("condition") && <p className="mt-1.5 text-sm text-danger" role="alert">{error.field("condition")}</p>}
          </fieldset>
        )}

        <Field label={t("sell.fieldDescription")} error={error?.field("description")}>
          {(p) => <TextArea {...p} required maxLength={4000} value={form.description} onChange={(e) => set("description", e.target.value)} />}
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("sell.fieldCampus")} error={error?.field("campus")}>
            {(p) => (
              <Select {...p} required value={form.campus} onChange={(e) => set("campus", e.target.value)}>
                <option value="">{t("sell.chooseCampus")}</option>
                {campuses.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </Select>
            )}
          </Field>
          <Field label={t("sell.fieldTelegram")} hint={t("sell.fieldTelegramHint")} error={error?.field("telegram_contact")}>
            {(p) => <TextInput {...p} placeholder={user?.telegram_username ? `@${user.telegram_username}` : "@username"} value={form.telegram_contact} onChange={(e) => set("telegram_contact", e.target.value)} />}
          </Field>
        </div>
      </section>

      <section className="card space-y-4 p-5 sm:p-6" aria-labelledby="photos-title">
        <div>
          <h2 id="photos-title" className="text-lg font-bold">{t("sell.photos")}</h2>
          <p className="text-sm text-muted">{t("sell.photosHint")}</p>
        </div>
        {photoError && <Alert tone="error">{photoError}</Alert>}
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {existing.map((img) => (
            <li key={img.id} className="relative aspect-square overflow-hidden rounded-xl bg-sand/50">
              <img src={img.url} alt="" className="size-full object-cover" />
              <button type="button" onClick={() => removeExisting(img)} aria-label={t("sell.removePhoto")} className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-paper/90 text-danger shadow">
                <Icon name="x" className="size-4" />
              </button>
            </li>
          ))}
          {pending.map((p, i) => (
            <li key={p.url} className="relative aspect-square overflow-hidden rounded-xl bg-sand/50">
              <img src={p.url} alt="" className="size-full object-cover" />
              <button type="button" onClick={() => removePending(i)} aria-label={t("sell.removePhoto")} className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-paper/90 text-danger shadow">
                <Icon name="x" className="size-4" />
              </button>
            </li>
          ))}
          {existing.length + pending.length < MAX_PHOTOS && (
            <li>
              <button type="button" onClick={() => fileInput.current?.click()} className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-sand text-sm font-semibold text-muted hover:border-clay hover:text-clay-dark">
                <Icon name="plus" className="size-6" />
                {t("sell.addPhotos")}
              </button>
            </li>
          )}
        </ul>
        <input ref={fileInput} type="file" accept={ACCEPTED.join(",")} multiple hidden onChange={(e) => addPhotos(e.target.files)} />
      </section>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {(!listing || listing.status === "draft") && (
          <Button type="button" variant="secondary" onClick={saveDraft} disabled={busy}>{t("sell.saveDraft")}</Button>
        )}
        <Button type="submit" disabled={busy}>{busy ? t("form.saving") : t("sell.continue")}</Button>
      </div>
    </form>
  );
}
