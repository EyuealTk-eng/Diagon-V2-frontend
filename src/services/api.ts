import type { FieldErrors } from "../types/api";
import { ApiError } from "./errors";
import { storage } from "./storage";

export { ApiError };

const API_ROOT = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const BASE = API_ROOT + "/api";

/**
 * Demo mode: with no VITE_API_BASE_URL, requests are answered by a built-in demo
 * server that keeps sample data in this browser. Set VITE_API_BASE_URL to the real
 * Diagon backend to switch it off — no page code changes.
 */
export const DEMO = !API_ROOT;
const ACCESS_KEY = "diagon.access";
const REFRESH_KEY = "diagon.refresh";

export const tokens = {
  get access() {
    return storage.get(ACCESS_KEY);
  },
  get refresh() {
    return storage.get(REFRESH_KEY);
  },
  set(access: string | null, refresh?: string | null) {
    storage.set(ACCESS_KEY, access);
    if (refresh !== undefined) storage.set(REFRESH_KEY, refresh);
  },
  clear() {
    storage.set(ACCESS_KEY, null);
    storage.set(REFRESH_KEY, null);
  },
};

let refreshing: Promise<boolean> | null = null;

async function refreshAccess(): Promise<boolean> {
  const refresh = tokens.refresh;
  if (!refresh) return false;
  refreshing ??= fetch(`${BASE}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  })
    .then(async (res) => {
      if (!res.ok) {
        tokens.clear();
        return false;
      }
      const data = await res.json();
      tokens.set(data.access);
      return true;
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

type Query = Record<string, string | number | boolean | undefined | null>;

export function buildQuery(params?: Query): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Query;
  signal?: AbortSignal;
}

export async function api<T>(path: string, opts: RequestOptions = {}, retry = true): Promise<T> {
  if (DEMO) {
    const { handleDemoRequest } = await import("./demo/server");
    return handleDemoRequest<T>(opts.method ?? "GET", path, opts.query ?? {}, opts.body, tokens.access);
  }
  const headers: Record<string, string> = { Accept: "application/json" };
  let body: BodyInit | undefined;
  if (opts.body instanceof FormData) {
    body = opts.body;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  const access = tokens.access;
  if (access) headers.Authorization = `Bearer ${access}`;

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}${buildQuery(opts.query)}`, {
      method: opts.method ?? "GET",
      headers,
      body,
      signal: opts.signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiError(0, {});
  }

  if (res.status === 401 && retry && tokens.refresh) {
    if (await refreshAccess()) return api<T>(path, opts, false);
  }
  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data as FieldErrors);
  return data as T;
}
