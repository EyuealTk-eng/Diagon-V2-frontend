/**
 * In-browser stand-in for the Diagon API, used when no backend is configured.
 *
 * It follows the real backend's rules (listing lifecycle, permissions, validation)
 * so every page behaves as it will in production. Data lives in localStorage, so
 * each visitor has their own private copy.
 */
import { ApiError } from "../errors";
import { storage } from "../storage";
import {
  CAMPUSES,
  CATEGORIES,
  DEMO_ACCOUNTS,
  OTHER_SELLERS,
  SEED_LISTINGS,
  UNIVERSITY,
  illustration,
  type DemoCategory,
} from "./seed";

// --- Stored shapes ------------------------------------------------------------

type Status = "draft" | "pending" | "available" | "sold" | "rejected" | "suspended" | "expired" | "removed";

interface DUser {
  id: number;
  email: string;
  password_hash: string;
  display_name: string;
  campus: string | null;
  telegram_username: string;
  is_verified: boolean;
  verified_email: string;
  verified_at: string | null;
  preferred_language: "en" | "am";
  is_staff: boolean;
  is_active: boolean;
  created_at: string;
}

interface DImage {
  id: number;
  src: string; // "seed:<n>" (generated illustration) or a data: URL
  alt_text: string;
}

interface DListing {
  id: string;
  seller: number;
  campus: string;
  category: string;
  listing_type: "item" | "service";
  title: string;
  description: string;
  price: string;
  condition: string;
  pricing_type: string;
  availability: string;
  telegram_contact: string;
  status: Status;
  status_reason: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  sold_at: string | null;
  images: DImage[];
}

interface DReport {
  id: number;
  reporter: number;
  listing: string;
  reason: string;
  details: string;
  status: "open" | "resolved" | "dismissed";
  created_at: string;
}

interface DAction {
  id: number;
  moderator: number;
  action: string;
  reason: string;
  listing: string | null;
  target_user: number | null;
  report: number | null;
  created_at: string;
}

interface DB {
  version: number;
  nextId: number;
  users: DUser[];
  listings: DListing[];
  favorites: { user: number; listing: string; created_at: string }[];
  reports: DReport[];
  actions: DAction[];
  verifications: Record<number, { email: string; code: string; expires: number; attempts: number }>;
}

const DB_KEY = "diagon.demo.db";
const DB_VERSION = 1;
const PUBLIC: Status[] = ["available", "sold"];
const SELLER_EDITABLE: Status[] = ["draft", "pending", "available", "rejected"];
const MAX_IMAGES = 8;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const REPORT_REASONS: Record<string, string> = {
  scam: "Suspected scam",
  misleading: "Misleading information",
  inappropriate: "Inappropriate content",
  duplicate: "Duplicate listing",
  already_sold: "Already sold",
  other: "Other",
};

// --- Helpers ------------------------------------------------------------------

const now = () => new Date().toISOString();
const fail = (status: number, fields: Record<string, string | string[]>): never => {
  throw new ApiError(status, Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, Array.isArray(v) ? v : [v]])));
};
const notFound = () => fail(404, { detail: "Not found." });

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`diagon-demo:${password}`);
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return btoa(String.fromCharCode(...data)); // very old browsers; demo only
}

function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const cat = (slug: string) => CATEGORIES.find((c) => c.slug === slug);
const campus = (slug: string | null) => CAMPUSES.find((c) => c.slug === slug);
const topCategory = (slug: string) => {
  const c = cat(slug);
  return c?.parent ?? c?.slug ?? "other";
};

// --- Database -----------------------------------------------------------------

let db: DB | null = null;

async function seed(): Promise<DB> {
  const fresh: DB = { version: DB_VERSION, nextId: 1, users: [], listings: [], favorites: [], reports: [], actions: [], verifications: {} };
  const ids: Record<string, number> = {};
  const started = Date.now();
  for (const u of [...DEMO_ACCOUNTS, ...OTHER_SELLERS]) {
    const id = fresh.nextId++;
    ids[u.key] = id;
    const joined = new Date(started - (40 + id * 9) * 86400000).toISOString();
    fresh.users.push({
      id, email: u.email, password_hash: await hashPassword(u.password), display_name: u.display_name,
      campus: u.campus, telegram_username: u.telegram_username, is_verified: u.is_verified,
      verified_email: u.is_verified ? u.email : "", verified_at: u.is_verified ? joined : null,
      preferred_language: "en", is_staff: u.is_staff, is_active: true, created_at: joined,
    });
  }
  let imageSeed = 1;
  for (const s of SEED_LISTINGS) {
    const created = new Date(started - s.hoursAgo * 3600000).toISOString();
    const status = s.status ?? "available";
    fresh.listings.push({
      id: uuid(), seller: ids[s.seller], campus: s.campus, category: s.category,
      listing_type: s.pricing_type ? "service" : "item", title: s.title, description: s.description,
      price: s.price.toFixed(2), condition: s.condition ?? "", pricing_type: s.pricing_type ?? "",
      availability: s.availability ?? "", telegram_contact: "", status, status_reason: "",
      created_at: created, updated_at: created, published_at: created,
      sold_at: status === "sold" ? created : null,
      images: Array.from({ length: s.photos }, () => ({ id: fresh.nextId++, src: `seed:${imageSeed++}`, alt_text: "" })),
    });
  }
  // One open report so the moderation page has something to show.
  const reported = fresh.listings.find((l) => l.title.startsWith("Sony"));
  if (reported) {
    fresh.reports.push({
      id: fresh.nextId++, reporter: ids.dawit, listing: reported.id, reason: "misleading",
      details: "Seller told me on Telegram it's actually used, not new.", status: "open",
      created_at: new Date(started - 3 * 3600000).toISOString(),
    });
  }
  return fresh;
}

async function load(): Promise<DB> {
  if (db) return db;
  const raw = storage.get(DB_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as DB;
      if (parsed.version === DB_VERSION) return (db = parsed);
    } catch {
      /* fall through to a fresh seed */
    }
  }
  db = await seed();
  save();
  return db;
}

function save() {
  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    fail(400, { image: "Demo storage is full. Remove some photos or reset the demo." });
  }
}

/** Wipe everything the visitor changed and start over with the sample data. */
export function resetDemo() {
  db = null;
  storage.set(DB_KEY, null);
  storage.set("diagon.access", null);
  storage.set("diagon.refresh", null);
}

// --- Output shapes (match the real API) -----------------------------------------

function imageUrl(img: DImage, listing: DListing) {
  return img.src.startsWith("seed:") ? illustration(Number(img.src.slice(5)), topCategory(listing.category)) : img.src;
}

function campusOut(slug: string | null, withUniversity = false) {
  const c = campus(slug);
  if (!c) return null;
  return withUniversity ? { ...c, university: UNIVERSITY } : c;
}

function categoryOut(c: DemoCategory) {
  const parent = c.parent ? cat(c.parent)! : null;
  return {
    id: c.id, name_en: c.name_en, name_am: c.name_am, slug: c.slug,
    parent: parent ? { name_en: parent.name_en, name_am: parent.name_am, slug: parent.slug } : null,
  };
}

function cardOut(d: DB, l: DListing, viewer: DUser | null) {
  const seller = d.users.find((u) => u.id === l.seller)!;
  return {
    id: l.id, title: l.title, listing_type: l.listing_type, price: l.price, currency: "ETB",
    condition: l.condition, pricing_type: l.pricing_type, status: l.status,
    campus: campusOut(l.campus), category: categoryOut(cat(l.category)!),
    cover_image: l.images[0] ? imageUrl(l.images[0], l) : null,
    seller_verified: seller.is_verified,
    is_saved: !!viewer && d.favorites.some((f) => f.user === viewer.id && f.listing === l.id),
    created_at: l.created_at,
  };
}

function detailOut(d: DB, l: DListing, viewer: DUser | null) {
  const seller = d.users.find((u) => u.id === l.seller)!;
  return {
    ...cardOut(d, l, viewer),
    description: l.description, availability: l.availability,
    images: l.images.map((img, position) => ({ id: img.id, url: imageUrl(img, l), position, alt_text: img.alt_text })),
    seller: {
      id: seller.id, display_name: seller.display_name, campus: campus(seller.campus)?.name ?? null,
      is_verified: seller.is_verified, telegram_username: seller.telegram_username, created_at: seller.created_at,
    },
    telegram_contact: l.telegram_contact || seller.telegram_username || null,
    status_reason: l.status_reason, is_owner: viewer?.id === l.seller,
    updated_at: l.updated_at, published_at: l.published_at, sold_at: l.sold_at,
  };
}

function meOut(u: DUser) {
  return {
    id: u.id, email: u.email, display_name: u.display_name, campus: campusOut(u.campus, true),
    telegram_username: u.telegram_username, telegram_linked: false, is_verified: u.is_verified,
    verified_email: u.verified_email, verified_at: u.verified_at, preferred_language: u.preferred_language,
    is_moderator: u.is_staff, created_at: u.created_at,
  };
}

function paginate<T>(items: T[], query: Query) {
  const size = Math.min(Math.max(Number(query.page_size) || 24, 1), 60);
  const page = Math.max(Number(query.page) || 1, 1);
  const start = (page - 1) * size;
  if (page > 1 && start >= items.length) notFound();
  return {
    count: items.length,
    next: start + size < items.length ? `?page=${page + 1}` : null,
    previous: page > 1 ? `?page=${page - 1}` : null,
    results: items.slice(start, start + size),
  };
}

// --- Validation -------------------------------------------------------------------

const TELEGRAM_RE = /^[A-Za-z0-9_]{5,32}$/;

function cleanTelegram(value: unknown, field: string, errors: Record<string, string>) {
  const v = String(value ?? "").trim().replace(/^@/, "");
  if (v && !TELEGRAM_RE.test(v)) errors[field] = "5-32 characters: letters, digits and underscores.";
  return v;
}

function validateListing(input: Record<string, unknown>, existing?: DListing) {
  const merged = { ...existing, ...input } as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const listing_type = merged.listing_type === "service" ? "service" : "item";
  const title = String(merged.title ?? "").trim();
  if (title.length < 3) errors.title = "Title must be at least 3 characters.";
  const category = cat(String(merged.category ?? ""));
  if (!category) errors.category = "Choose a category.";
  const camp = campus(String(merged.campus ?? ""));
  if (!camp) errors.campus = "Choose a campus.";
  const priceNum = Number(merged.price);
  if (merged.price === "" || merged.price === undefined || Number.isNaN(priceNum)) errors.price = "A valid number is required.";
  else if (priceNum < 0) errors.price = "Ensure this value is greater than or equal to 0.";
  const description = String(merged.description ?? "").trim();
  if (!description) errors.description = "This field may not be blank.";
  const telegram_contact = cleanTelegram(merged.telegram_contact, "telegram_contact", errors);
  let condition = String(merged.condition ?? "");
  let pricing_type = String(merged.pricing_type ?? "");
  let availability = String(merged.availability ?? "");
  if (listing_type === "item") {
    if (!["new", "like_new", "good", "fair"].includes(condition)) errors.condition = "Choose the item's condition.";
    pricing_type = "";
    availability = "";
  } else {
    if (!["fixed", "hourly", "negotiable"].includes(pricing_type)) errors.pricing_type = "Choose how the service is priced.";
    condition = "";
  }
  if (Object.keys(errors).length) fail(400, errors);
  return {
    listing_type, title: title.slice(0, 120), category: category!.slug, campus: camp!.slug,
    price: priceNum.toFixed(2), description: description.slice(0, 4000), telegram_contact,
    condition, pricing_type, availability: availability.slice(0, 200),
  } as const;
}

async function readImage(file: unknown): Promise<string> {
  if (!(file instanceof File)) fail(400, { image: "No file was submitted." });
  const f = file as File;
  if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) fail(400, { image: "Upload a valid JPEG, PNG or WebP image." });
  if (f.size > MAX_IMAGE_BYTES) fail(400, { image: "Images must be 5 MB or smaller." });
  // Shrink photos so they fit in browser storage.
  try {
    const bitmap = await createImageBitmap(f);
    const scale = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.78);
  } catch {
    return fail(400, { image: "Upload a valid JPEG, PNG or WebP image." });
  }
}

// --- Request handling ----------------------------------------------------------------

type Query = Record<string, string | number | boolean | undefined | null>;
type Body = Record<string, unknown>;

interface Ctx {
  db: DB;
  user: DUser | null;
  query: Query;
  body: Body;
  rawBody: unknown;
}

function requireUser(ctx: Ctx): DUser {
  if (!ctx.user) fail(401, { detail: "Authentication credentials were not provided." });
  return ctx.user!;
}

function requireModerator(ctx: Ctx): DUser {
  const user = requireUser(ctx);
  if (!user.is_staff) fail(403, { detail: "Moderator access is required." });
  return user;
}

function visibleListing(ctx: Ctx, id: string): DListing {
  const l = ctx.db.listings.find((x) => x.id === id);
  if (!l) return notFound();
  const canSee = PUBLIC.includes(l.status) || l.seller === ctx.user?.id || ctx.user?.is_staff;
  return canSee ? l : notFound();
}

function ownListing(ctx: Ctx, id: string): DListing {
  const user = requireUser(ctx);
  const l = visibleListing(ctx, id);
  if (l.seller !== user.id) fail(403, { detail: "Only the seller can change this listing." });
  return l;
}

function assertEditable(l: DListing) {
  if (!SELLER_EDITABLE.includes(l.status)) fail(400, { status: `Listings that are ${l.status} can't be edited.` });
}

function logAction(ctx: Ctx, action: string, reason: string, listing: DListing | null, targetUser: number | null, report: number | null = null) {
  ctx.db.actions.unshift({
    id: ctx.db.nextId++, moderator: ctx.user!.id, action, reason, listing: listing?.id ?? null,
    target_user: targetUser, report, created_at: now(),
  });
}

const LISTING_TRANSITIONS: Record<string, [Status[], Status]> = {
  approve: [["pending"], "available"],
  reject: [["pending"], "rejected"],
  suspend: [["pending", "available", "sold"], "suspended"],
  remove: [["draft", "pending", "available", "sold", "rejected", "suspended", "expired"], "removed"],
  restore: [["suspended", "removed"], "available"],
};

function moderate(ctx: Ctx, l: DListing, action: string, reason: string, report: number | null = null) {
  const rule = LISTING_TRANSITIONS[action];
  if (!rule) fail(400, { action: "Unknown listing action." });
  if (["reject", "suspend", "remove"].includes(action) && !reason.trim()) fail(400, { reason: "A reason is required for this action." });
  const [from, to] = rule;
  if (!from.includes(l.status)) fail(400, { action: `Can't ${action} a listing that is ${l.status}.` });
  l.status = action === "restore" && l.sold_at ? "sold" : to;
  l.status_reason = reason;
  if (l.status === "available" && !l.published_at) l.published_at = now();
  l.updated_at = now();
  logAction(ctx, action, reason, l, l.seller, report);
}

function filterListings(ctx: Ctx): DListing[] {
  const q = ctx.query;
  const availability = String(q.availability ?? "");
  let items = ctx.db.listings.filter((l) =>
    availability === "sold" ? l.status === "sold" : availability === "all" ? PUBLIC.includes(l.status) : l.status === "available",
  );
  if (q.campus) items = items.filter((l) => l.campus === q.campus);
  if (q.category) items = items.filter((l) => l.category === q.category || cat(l.category)?.parent === q.category);
  if (q.condition) items = items.filter((l) => l.condition === q.condition);
  if (q.listing_type) items = items.filter((l) => l.listing_type === q.listing_type);
  if (q.min_price !== undefined && q.min_price !== "") items = items.filter((l) => Number(l.price) >= Number(q.min_price));
  if (q.max_price !== undefined && q.max_price !== "") items = items.filter((l) => Number(l.price) <= Number(q.max_price));
  if (q.search) {
    const words = String(q.search).toLowerCase().split(/\s+/).filter(Boolean);
    items = items.filter((l) => {
      const text = `${l.title} ${l.description}`.toLowerCase();
      return words.every((w) => text.includes(w));
    });
  }
  const ordering = String(q.ordering || "-created_at");
  const dir = ordering.startsWith("-") ? -1 : 1;
  const field = ordering.replace(/^-/, "");
  return [...items].sort((a, b) =>
    field === "price" ? dir * (Number(a.price) - Number(b.price)) : dir * a.created_at.localeCompare(b.created_at),
  );
}

type Handler = (ctx: Ctx, params: string[]) => unknown | Promise<unknown>;
const routes: [string, RegExp, Handler][] = [];
const route = (method: string, pattern: string, handler: Handler) =>
  routes.push([method, new RegExp(`^${pattern.replace(/:id/g, "([^/]+)")}/?$`), handler]);

// Reference data
route("GET", "/campuses", () => CAMPUSES.map((c) => ({ ...c, university: UNIVERSITY })));
route("GET", "/categories", () => CATEGORIES.map((c) => ({ id: c.id, name_en: c.name_en, name_am: c.name_am, slug: c.slug, parent: c.parent })));

// Auth
route("POST", "/auth/register", async (ctx) => {
  const b = ctx.body;
  const errors: Record<string, string> = {};
  const email = String(b.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
  else if (ctx.db.users.some((u) => u.email === email)) errors.email = "An account with this email already exists.";
  const password = String(b.password ?? "");
  if (password.length < 8) errors.password = "This password is too short. It must contain at least 8 characters.";
  else if (/^\d+$/.test(password)) errors.password = "This password is entirely numeric.";
  const display_name = String(b.display_name ?? "").trim();
  if (!display_name) errors.display_name = "This field may not be blank.";
  const telegram_username = cleanTelegram(b.telegram_username, "telegram_username", errors);
  const campusId = b.campus_id ? Number(b.campus_id) : null;
  const camp = campusId ? CAMPUSES.find((c) => c.id === campusId) : null;
  if (campusId && !camp) errors.campus_id = "Invalid campus.";
  if (Object.keys(errors).length) fail(400, errors);
  const user: DUser = {
    id: ctx.db.nextId++, email, password_hash: await hashPassword(password), display_name: display_name.slice(0, 80),
    campus: camp?.slug ?? null, telegram_username, is_verified: false, verified_email: "", verified_at: null,
    preferred_language: b.preferred_language === "am" ? "am" : "en", is_staff: false, is_active: true, created_at: now(),
  };
  ctx.db.users.push(user);
  save();
  return meOut(user);
});

route("POST", "/auth/login", async (ctx) => {
  const email = String(ctx.body.email ?? "").trim().toLowerCase();
  const hash = await hashPassword(String(ctx.body.password ?? ""));
  const user = ctx.db.users.find((u) => u.email === email && u.password_hash === hash && u.is_active);
  if (!user) fail(401, { detail: "No active account found with the given credentials" });
  const token = `demo.${user!.id}`;
  return { access: token, refresh: token };
});

route("POST", "/auth/refresh", (ctx) => {
  const token = String(ctx.body.refresh ?? "");
  if (!userFromToken(ctx.db, token)) fail(401, { detail: "Token is invalid or expired" });
  return { access: token };
});

route("GET", "/users/me", (ctx) => meOut(requireUser(ctx)));
route("PATCH", "/users/me", (ctx) => {
  const user = requireUser(ctx);
  const b = ctx.body;
  const errors: Record<string, string> = {};
  if ("display_name" in b) {
    const name = String(b.display_name ?? "").trim();
    if (!name) errors.display_name = "This field may not be blank.";
    else user.display_name = name.slice(0, 80);
  }
  if ("campus_id" in b) {
    const camp = b.campus_id ? CAMPUSES.find((c) => c.id === Number(b.campus_id)) : null;
    if (b.campus_id && !camp) errors.campus_id = "Invalid campus.";
    else user.campus = camp?.slug ?? null;
  }
  if ("telegram_username" in b) user.telegram_username = cleanTelegram(b.telegram_username, "telegram_username", errors);
  if (b.preferred_language === "en" || b.preferred_language === "am") user.preferred_language = b.preferred_language;
  if (Object.keys(errors).length) fail(400, errors);
  save();
  return meOut(user);
});

route("POST", "/auth/verify-email/request", (ctx) => {
  const user = requireUser(ctx);
  const email = String(ctx.body.email ?? "").trim().toLowerCase();
  if (!email.endsWith("@aau.edu.et")) fail(400, { email: "Use a university email address (aau.edu.et)." });
  const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
  ctx.db.verifications[user.id] = { email, code, expires: Date.now() + 15 * 60000, attempts: 0 };
  save();
  // No email is sent in the demo, so the code is returned for the page to show.
  return { detail: "Verification code sent.", demo_code: code };
});

route("POST", "/auth/verify-email", (ctx) => {
  const user = requireUser(ctx);
  const code = String(ctx.body.code ?? "").trim();
  if (!/^\d{6}$/.test(code)) fail(400, { code: "Enter the 6-digit code." });
  const record = ctx.db.verifications[user.id];
  const invalid = () => fail(400, { code: "This code is invalid or has expired." });
  if (!record || record.expires < Date.now() || record.attempts >= 5) invalid();
  if (record.code !== code) {
    record.attempts += 1;
    save();
    invalid();
  }
  delete ctx.db.verifications[user.id];
  Object.assign(user, { is_verified: true, verified_email: record.email, verified_at: now() });
  save();
  return meOut(user);
});

route("POST", "/auth/telegram-link", () => fail(400, { detail: "Telegram linking isn't available in the demo." }));

// Listings
route("GET", "/listings", (ctx) => {
  const page = paginate(filterListings(ctx), ctx.query);
  return { ...page, results: page.results.map((l) => cardOut(ctx.db, l, ctx.user)) };
});

route("POST", "/listings", (ctx) => {
  const user = requireUser(ctx);
  const data = validateListing(ctx.body);
  const l: DListing = {
    id: uuid(), seller: user.id, ...data, status: "draft", status_reason: "", created_at: now(), updated_at: now(),
    published_at: null, sold_at: null, images: [],
  };
  ctx.db.listings.unshift(l);
  save();
  return detailOut(ctx.db, l, user);
});

route("GET", "/listings/mine", (ctx) => {
  const user = requireUser(ctx);
  const wanted = String(ctx.query.status ?? "").split(",").filter(Boolean);
  const items = ctx.db.listings
    .filter((l) => l.seller === user.id && (!wanted.length || wanted.includes(l.status)))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  const page = paginate(items, ctx.query);
  return { ...page, results: page.results.map((l) => cardOut(ctx.db, l, user)) };
});

route("GET", "/listings/:id", (ctx, [id]) => detailOut(ctx.db, visibleListing(ctx, id), ctx.user));

route("PATCH", "/listings/:id", (ctx, [id]) => {
  const l = ownListing(ctx, id);
  assertEditable(l);
  Object.assign(l, validateListing(ctx.body, l), { updated_at: now() });
  save();
  return detailOut(ctx.db, l, ctx.user);
});

route("DELETE", "/listings/:id", (ctx, [id]) => {
  const l = ownListing(ctx, id);
  if (l.status === "suspended") fail(400, { status: "This listing is under review and cannot be removed right now." });
  Object.assign(l, { status: "removed", status_reason: "Removed by seller", updated_at: now() });
  save();
});

route("POST", "/listings/:id/publish", (ctx, [id]) => {
  const l = ownListing(ctx, id);
  if (!["draft", "rejected"].includes(l.status)) fail(400, { status: "Only drafts or rejected listings can be published." });
  if (!l.images.length) fail(400, { images: "Add at least one photo before publishing." });
  const seller = ctx.db.users.find((u) => u.id === l.seller)!;
  if (!l.telegram_contact && !seller.telegram_username) fail(400, { telegram_contact: "Add a Telegram username so buyers can contact you." });
  Object.assign(l, { status: "available", status_reason: "", published_at: now(), updated_at: now() });
  save();
  return detailOut(ctx.db, l, ctx.user);
});

route("POST", "/listings/:id/sold", (ctx, [id]) => {
  const l = ownListing(ctx, id);
  if (l.status !== "available") fail(400, { status: "Only available listings can be marked as sold." });
  Object.assign(l, { status: "sold", sold_at: now(), updated_at: now() });
  save();
  return detailOut(ctx.db, l, ctx.user);
});

route("GET", "/listings/:id/similar", (ctx, [id]) => {
  const l = visibleListing(ctx, id);
  return ctx.db.listings
    .filter((x) => x.id !== l.id && x.status === "available" && x.category === l.category)
    .slice(0, 8)
    .map((x) => cardOut(ctx.db, x, ctx.user));
});

route("POST", "/listings/:id/favorite", (ctx, [id]) => {
  const user = requireUser(ctx);
  const l = visibleListing(ctx, id);
  if (!ctx.db.favorites.some((f) => f.user === user.id && f.listing === l.id)) {
    ctx.db.favorites.unshift({ user: user.id, listing: l.id, created_at: now() });
    save();
  }
  return { saved: true };
});

route("DELETE", "/listings/:id/favorite", (ctx, [id]) => {
  const user = requireUser(ctx);
  ctx.db.favorites = ctx.db.favorites.filter((f) => !(f.user === user.id && f.listing === id));
  save();
});

route("POST", "/listings/:id/images", async (ctx, [id]) => {
  const l = ownListing(ctx, id);
  assertEditable(l);
  if (l.images.length >= MAX_IMAGES) fail(400, { image: `A listing can have at most ${MAX_IMAGES} photos.` });
  const file = ctx.rawBody instanceof FormData ? ctx.rawBody.get("image") : null;
  const src = await readImage(file);
  const img = { id: ctx.db.nextId++, src, alt_text: "" };
  l.images.push(img);
  l.updated_at = now();
  try {
    save();
  } catch (err) {
    l.images.pop();
    throw err;
  }
  return { id: img.id, url: src, position: l.images.length - 1, alt_text: "" };
});

route("DELETE", "/listings/:id/images/:id", (ctx, [id, imageId]) => {
  const l = ownListing(ctx, id);
  assertEditable(l);
  if (!l.images.some((i) => i.id === Number(imageId))) notFound();
  if (["available", "pending"].includes(l.status) && l.images.length === 1) fail(400, { image: "A published listing needs at least one photo." });
  l.images = l.images.filter((i) => i.id !== Number(imageId));
  save();
});

// Favorites & reports
route("GET", "/favorites", (ctx) => {
  const user = requireUser(ctx);
  const items = ctx.db.favorites
    .filter((f) => f.user === user.id)
    .map((f) => ctx.db.listings.find((l) => l.id === f.listing))
    .filter((l): l is DListing => !!l && PUBLIC.includes(l.status));
  const page = paginate(items, ctx.query);
  return { ...page, results: page.results.map((l) => cardOut(ctx.db, l, user)) };
});

route("POST", "/reports", (ctx) => {
  const user = requireUser(ctx);
  const l = ctx.db.listings.find((x) => x.id === ctx.body.listing && PUBLIC.includes(x.status));
  if (!l) fail(400, { listing: "Object with public_uuid does not exist." });
  if (l!.seller === user.id) fail(400, { listing: "You can't report your own listing." });
  if (ctx.db.reports.some((r) => r.reporter === user.id && r.listing === l!.id && r.status === "open")) {
    fail(400, { listing: "You have already reported this listing." });
  }
  const reason = String(ctx.body.reason ?? "");
  if (!(reason in REPORT_REASONS)) fail(400, { reason: "Choose a reason." });
  const details = String(ctx.body.details ?? "").trim();
  if (reason === "other" && !details) fail(400, { details: "Tell us briefly what's wrong." });
  const report: DReport = { id: ctx.db.nextId++, reporter: user.id, listing: l!.id, reason, details: details.slice(0, 1000), status: "open", created_at: now() };
  ctx.db.reports.unshift(report);
  save();
  return report;
});

// Moderation
route("GET", "/moderation/summary", (ctx) => {
  requireModerator(ctx);
  return {
    pending_listings: ctx.db.listings.filter((l) => l.status === "pending").length,
    open_reports: ctx.db.reports.filter((r) => r.status === "open").length,
    suspended_listings: ctx.db.listings.filter((l) => l.status === "suspended").length,
  };
});

route("GET", "/moderation/listings", (ctx) => {
  requireModerator(ctx);
  const wanted = String(ctx.query.status ?? "pending").split(",");
  const items = ctx.db.listings.filter((l) => wanted.includes(l.status)).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const page = paginate(items, ctx.query);
  return { ...page, results: page.results.map((l) => cardOut(ctx.db, l, ctx.user)) };
});

route("POST", "/moderation/listings/:id/action", (ctx, [id]) => {
  requireModerator(ctx);
  const l = ctx.db.listings.find((x) => x.id === id) ?? notFound();
  moderate(ctx, l, String(ctx.body.action ?? ""), String(ctx.body.reason ?? ""));
  save();
  return detailOut(ctx.db, l, ctx.user);
});

route("GET", "/moderation/reports", (ctx) => {
  requireModerator(ctx);
  const wanted = String(ctx.query.status ?? "open").split(",");
  const items = ctx.db.reports.filter((r) => wanted.includes(r.status)).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const page = paginate(items, ctx.query);
  return {
    ...page,
    results: page.results.map((r) => ({
      id: r.id, listing: cardOut(ctx.db, ctx.db.listings.find((l) => l.id === r.listing)!, ctx.user),
      reporter: ctx.db.users.find((u) => u.id === r.reporter)?.display_name ?? "?",
      reason: r.reason, reason_display: REPORT_REASONS[r.reason], details: r.details, status: r.status, created_at: r.created_at,
    })),
  };
});

route("POST", "/moderation/reports/:id/resolve", (ctx, [id]) => {
  requireModerator(ctx);
  const report = ctx.db.reports.find((r) => r.id === Number(id)) ?? notFound();
  if (report.status !== "open") fail(400, { report: "This report has already been handled." });
  const outcome = ctx.body.outcome === "resolved" ? "resolved" : "dismissed";
  const reason = String(ctx.body.reason ?? "");
  const listing = ctx.db.listings.find((l) => l.id === report.listing)!;
  const listingAction = ctx.body.listing_action as string | null | undefined;
  if (listingAction) moderate(ctx, listing, listingAction, reason, report.id);
  report.status = outcome;
  logAction(ctx, outcome === "resolved" ? "resolve_report" : "dismiss_report", reason, listing, listing.seller, report.id);
  save();
  return { id: report.id, status: report.status };
});

route("GET", "/moderation/history", (ctx) => {
  requireModerator(ctx);
  const page = paginate(ctx.db.actions, ctx.query);
  return {
    ...page,
    results: page.results.map((a) => {
      const l = a.listing ? ctx.db.listings.find((x) => x.id === a.listing) : null;
      return {
        id: a.id, moderator: ctx.db.users.find((u) => u.id === a.moderator)?.display_name ?? "?", action: a.action,
        reason: a.reason, listing: l?.id ?? null, listing_title: l?.title ?? null,
        target_user: ctx.db.users.find((u) => u.id === a.target_user)?.display_name ?? null, report: a.report, created_at: a.created_at,
      };
    }),
  };
});

// --- Entry point ------------------------------------------------------------------

function userFromToken(d: DB, token: string | null): DUser | null {
  const match = /^demo\.(\d+)$/.exec(token ?? "");
  return match ? (d.users.find((u) => u.id === Number(match[1]) && u.is_active) ?? null) : null;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function handleDemoRequest<T>(method: string, path: string, query: Query, body: unknown, token: string | null): Promise<T> {
  await delay(120 + Math.random() * 120); // feel like a real network request
  const d = await load();
  const [pathname] = path.split("?");
  const user = userFromToken(d, token);
  if (token && !user && pathname !== "/auth/login/" && pathname !== "/auth/refresh/") {
    fail(401, { detail: "Given token not valid for any token type" });
  }
  const ctx: Ctx = { db: d, user, query, body: body && !(body instanceof FormData) ? (body as Body) : {}, rawBody: body };
  for (const [m, re, handler] of routes) {
    const match = m === method.toUpperCase() ? re.exec(pathname) : null;
    if (match) {
      const result = await handler(ctx, match.slice(1));
      // Return copies so pages can't accidentally mutate the stored data.
      return (result === undefined ? undefined : JSON.parse(JSON.stringify(result))) as T;
    }
  }
  return notFound();
}
