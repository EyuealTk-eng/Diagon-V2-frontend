/** Public t.me link for a Telegram username, or null if it isn't a valid username. */
export function telegramUrl(username: string | null | undefined): string | null {
  const clean = (username ?? "").trim().replace(/^@/, "");
  return /^[A-Za-z0-9_]{5,32}$/.test(clean) ? `https://t.me/${clean}` : null;
}
