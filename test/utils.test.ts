import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatDate,
  gradientFromString,
  initials,
  parseGallery,
  parseGalleryUrls,
  pluralize,
  safeRedirect,
  slugify,
  timeAgo,
} from "@/lib/utils";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("Amara Nkosi")).toBe("amara-nkosi");
  });

  it("strips punctuation and diacritic-less symbols", () => {
    expect(slugify("Sofia (Milan) — Editorial!")).toBe("sofia-milan-editorial");
  });

  it("collapses repeated separators and trims", () => {
    expect(slugify("  Multiple   Spaces  ")).toBe("multiple-spaces");
    expect(slugify("a---b")).toBe("a-b");
  });

  it("returns empty string for symbol-only input", () => {
    expect(slugify("!!!")).toBe("");
  });
});

describe("initials", () => {
  it("returns up to two uppercase initials", () => {
    expect(initials("Amara Nkosi")).toBe("AN");
    expect(initials("liam foster")).toBe("LF");
  });

  it("handles a single name", () => {
    expect(initials("Cher")).toBe("C");
  });

  it("ignores extra whitespace and extra names", () => {
    expect(initials("  Mary  Jane  Watson ")).toBe("MJ");
  });

  it("returns empty string for empty input", () => {
    expect(initials("")).toBe("");
  });
});

describe("gradientFromString", () => {
  it("is deterministic for the same seed", () => {
    expect(gradientFromString("Amara")).toBe(gradientFromString("Amara"));
  });

  it("produces different gradients for different seeds", () => {
    expect(gradientFromString("Amara")).not.toBe(gradientFromString("Liam"));
  });

  it("returns a valid CSS linear-gradient", () => {
    expect(gradientFromString("x")).toMatch(/^linear-gradient\(135deg, hsl\(/);
  });
});

describe("parseGallery", () => {
  it("parses a JSON array of strings", () => {
    expect(parseGallery('["a.jpg","b.jpg"]')).toEqual(["a.jpg", "b.jpg"]);
  });

  it("returns [] for null/undefined/empty", () => {
    expect(parseGallery(null)).toEqual([]);
    expect(parseGallery(undefined)).toEqual([]);
    expect(parseGallery("")).toEqual([]);
  });

  it("returns [] for malformed JSON", () => {
    expect(parseGallery("not json")).toEqual([]);
  });

  it("filters out non-string entries", () => {
    expect(parseGallery('["a", 1, null, "b"]')).toEqual(["a", "b"]);
  });

  it("returns [] when JSON is not an array", () => {
    expect(parseGallery('{"a":1}')).toEqual([]);
  });
});

describe("parseGalleryUrls", () => {
  it("splits on newlines and commas keeping only http(s) urls", () => {
    const input = "https://a.com/1.jpg\nhttp://b.com/2.jpg, https://c.com/3.jpg";
    expect(parseGalleryUrls(input)).toEqual([
      "https://a.com/1.jpg",
      "http://b.com/2.jpg",
      "https://c.com/3.jpg",
    ]);
  });

  it("drops non-url and non-http lines", () => {
    expect(parseGalleryUrls("not-a-url\nftp://x.com\nhttps://ok.com/a.jpg")).toEqual([
      "https://ok.com/a.jpg",
    ]);
  });

  it("caps the number of urls", () => {
    const many = Array.from({ length: 20 }, (_, i) => `https://x.com/${i}.jpg`).join("\n");
    expect(parseGalleryUrls(many)).toHaveLength(12);
    expect(parseGalleryUrls(many, 3)).toHaveLength(3);
  });

  it("returns [] for empty/null", () => {
    expect(parseGalleryUrls("")).toEqual([]);
    expect(parseGalleryUrls(null)).toEqual([]);
    expect(parseGalleryUrls(undefined)).toEqual([]);
  });
});

describe("safeRedirect (open-redirect guard)", () => {
  it("allows same-origin absolute paths", () => {
    expect(safeRedirect("/admin")).toBe("/admin");
    expect(safeRedirect("/models/amara-nkosi")).toBe("/models/amara-nkosi");
  });

  it("rejects protocol-relative urls", () => {
    expect(safeRedirect("//evil.com")).toBe("/");
  });

  it("rejects backslash tricks", () => {
    expect(safeRedirect("/\\evil.com")).toBe("/");
  });

  it("rejects absolute external urls", () => {
    expect(safeRedirect("https://evil.com")).toBe("/");
    expect(safeRedirect("http://evil.com")).toBe("/");
  });

  it("rejects non-string / relative values", () => {
    expect(safeRedirect(undefined)).toBe("/");
    expect(safeRedirect(null)).toBe("/");
    expect(safeRedirect(123)).toBe("/");
    expect(safeRedirect("relative/path")).toBe("/");
  });

  it("uses the first element of an array", () => {
    expect(safeRedirect(["/dashboard", "/other"])).toBe("/dashboard");
    expect(safeRedirect(["//evil.com"])).toBe("/");
  });

  it("honours a custom fallback", () => {
    expect(safeRedirect("https://evil.com", "/login")).toBe("/login");
  });
});

describe("pluralize", () => {
  it("returns the singular for count of 1", () => {
    expect(pluralize(1, "review")).toBe("review");
  });

  it("appends 's' by default for non-1 counts", () => {
    expect(pluralize(0, "review")).toBe("reviews");
    expect(pluralize(2, "profile")).toBe("profiles");
  });

  it("uses an explicit plural when provided", () => {
    expect(pluralize(3, "person", "people")).toBe("people");
    expect(pluralize(1, "person", "people")).toBe("person");
  });
});

describe("formatDate", () => {
  it("formats a Date as 'Mon DD, YYYY'", () => {
    expect(formatDate(new Date("2026-07-14T12:00:00Z"))).toBe("Jul 14, 2026");
  });

  it("accepts an ISO string", () => {
    expect(formatDate("2026-01-05T12:00:00Z")).toBe("Jan 5, 2026");
  });
});

describe("timeAgo", () => {
  afterEach(() => vi.useRealTimers());

  it("formats relative times against a fixed 'now'", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-14T12:00:00Z"));
    const now = new Date("2026-07-14T12:00:00Z").getTime();

    expect(timeAgo(new Date(now - 5 * 60 * 1000))).toContain("minute");
    expect(timeAgo(new Date(now - 2 * 60 * 60 * 1000))).toContain("hour");
    expect(timeAgo(new Date(now - 3 * 24 * 60 * 60 * 1000))).toContain("day");
  });
});
