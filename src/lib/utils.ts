import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names with conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Turn a display name into a URL-safe slug. */
export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Format a date as e.g. "Jul 14, 2026". */
export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Relative time, e.g. "3 days ago". */
export function timeAgo(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.34524, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const duration = seconds;
  let divisor = 1;
  let unit: Intl.RelativeTimeFormatUnit = "second";
  for (const [amount, u] of units) {
    if (Math.abs(duration) < amount * divisor) {
      unit = u;
      break;
    }
    divisor *= amount;
    unit = u;
  }
  return rtf.format(-Math.round(duration / divisor), unit);
}

/** Turn a full name into up-to-two-letter initials. */
export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join("");
}

/** Deterministic pleasant gradient from a string seed (for avatar fallbacks). */
export function gradientFromString(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${h1} 55% 62%), hsl(${h2} 60% 45%))`;
}

/** Safe JSON parse of the gallery column. */
export function parseGallery(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function pluralize(count: number, singular: string, plural?: string) {
  return count === 1 ? singular : plural ?? `${singular}s`;
}

/**
 * Validate a post-auth redirect target, guarding against open redirects.
 * Only same-origin absolute paths are allowed; anything else falls back.
 * Rejects protocol-relative (`//host`) and backslash (`/\host`) tricks.
 */
export function safeRedirect(value: unknown, fallback = "/"): string {
  const v = Array.isArray(value) ? value[0] : value;
  if (typeof v !== "string" || !v.startsWith("/")) return fallback;
  // Control chars (tab/CR/LF/etc.) are stripped by the URL parser, so a value
  // like "/\t/evil.com" would resolve to "//evil.com" → off-site. Reject them
  // before the "//" / "/\" checks, which operate on the raw string.
  if (/[\u0000-\u001f\u007f]/.test(v)) return fallback;
  if (v.startsWith("//") || v.startsWith("/\\")) return fallback;
  return v;
}

/**
 * Parse a newline/comma separated list of image URLs into a clean array,
 * keeping only http(s) URLs and capping the count.
 */
export function parseGalleryUrls(raw: string | undefined | null, max = 12): string[] {
  if (!raw) return [];
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s))
    .slice(0, max);
}
