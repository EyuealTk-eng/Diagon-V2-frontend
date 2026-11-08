import { useNavigate } from "react-router-dom";

import { useAuth } from "../app/auth";
import { api } from "../services/api";
import type { ListingCard } from "../types/api";

/** Returns a handler that saves/unsaves a listing, sending guests to log in. */
export function useSaveToggle(onChange: (id: string, saved: boolean) => void) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return async (listing: Pick<ListingCard, "id" | "is_saved">) => {
    if (!user) {
      navigate("/login", { state: { from: `/listings/${listing.id}` } });
      return;
    }
    const next = !listing.is_saved;
    onChange(listing.id, next); // optimistic
    try {
      await api(`/listings/${listing.id}/favorite/`, { method: next ? "POST" : "DELETE" });
    } catch {
      onChange(listing.id, !next);
    }
  };
}
