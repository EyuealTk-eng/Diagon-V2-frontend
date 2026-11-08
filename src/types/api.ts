export type Lang = "en" | "am";

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface University {
  id: number;
  name: string;
  slug: string;
}

export interface Campus {
  id: number;
  name: string;
  slug: string;
  university?: University;
}

export interface Category {
  id: number;
  name_en: string;
  name_am: string;
  slug: string;
  parent: string | null | { name_en: string; name_am: string; slug: string };
}

export type ListingType = "item" | "service";
export type Condition = "new" | "like_new" | "good" | "fair" | "";
export type PricingType = "fixed" | "hourly" | "negotiable" | "";
export type ListingStatus =
  | "draft"
  | "pending"
  | "available"
  | "sold"
  | "rejected"
  | "suspended"
  | "expired"
  | "removed";

export interface ListingCard {
  id: string;
  title: string;
  listing_type: ListingType;
  price: string;
  currency: string;
  condition: Condition;
  pricing_type: PricingType;
  status: ListingStatus;
  campus: Campus;
  category: Category;
  cover_image: string | null;
  seller_verified: boolean;
  is_saved: boolean;
  created_at: string;
}

export interface ListingImage {
  id: number;
  url: string;
  position: number;
  alt_text: string;
}

export interface PublicSeller {
  id: number;
  display_name: string;
  campus: string | null;
  is_verified: boolean;
  telegram_username: string;
  created_at: string;
}

export interface ListingDetail extends ListingCard {
  description: string;
  availability: string;
  images: ListingImage[];
  seller: PublicSeller;
  telegram_contact: string | null;
  status_reason: string;
  is_owner: boolean;
  updated_at: string;
  published_at: string | null;
  sold_at: string | null;
}

export interface ListingInput {
  listing_type: ListingType;
  title: string;
  category: string;
  price: string;
  description: string;
  campus: string;
  condition: Condition;
  pricing_type: PricingType;
  availability: string;
  telegram_contact: string;
}

export interface Me {
  id: number;
  email: string;
  display_name: string;
  campus: Campus | null;
  telegram_username: string;
  telegram_linked: boolean;
  is_verified: boolean;
  verified_email: string;
  verified_at: string | null;
  preferred_language: Lang;
  is_moderator: boolean;
  created_at: string;
}

export type ReportReason = "scam" | "misleading" | "inappropriate" | "duplicate" | "already_sold" | "other";

export interface ModerationReport {
  id: number;
  listing: ListingCard;
  reporter: string;
  reason: ReportReason;
  reason_display: string;
  details: string;
  status: "open" | "resolved" | "dismissed";
  created_at: string;
}

export interface ModerationActionEntry {
  id: number;
  moderator: string;
  action: string;
  reason: string;
  listing: string | null;
  listing_title: string | null;
  target_user: string | null;
  created_at: string;
}

export type FieldErrors = Record<string, string[] | string>;
