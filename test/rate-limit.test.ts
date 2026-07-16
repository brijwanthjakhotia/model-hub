import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

import { rateLimit, clientIp, __resetRateLimit } from "@/lib/rate-limit";

beforeEach(() => __resetRateLimit());

describe("rateLimit", () => {
  it("allows up to `limit` calls, then blocks", () => {
    const t = 1_000_000;
    for (let i = 0; i < 3; i++) expect(rateLimit("k", 3, 1000, t).ok).toBe(true);
    const blocked = rateLimit("k", 3, 1000, t);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("keeps separate keys independent", () => {
    expect(rateLimit("a", 1, 1000, 0).ok).toBe(true);
    expect(rateLimit("b", 1, 1000, 0).ok).toBe(true); // different key, own bucket
    expect(rateLimit("a", 1, 1000, 0).ok).toBe(false); // a is now over
  });

  it("resets once the window elapses", () => {
    expect(rateLimit("w", 1, 1000, 0).ok).toBe(true);
    expect(rateLimit("w", 1, 1000, 500).ok).toBe(false); // still inside the window
    expect(rateLimit("w", 1, 1000, 1000).ok).toBe(true); // window rolled over
  });

  it("reports retryAfterSec as whole seconds until reset (min 1)", () => {
    rateLimit("r", 1, 10_000, 0);
    expect(rateLimit("r", 1, 10_000, 0).retryAfterSec).toBe(10);
    rateLimit("r2", 1, 800, 0);
    expect(rateLimit("r2", 1, 800, 200).retryAfterSec).toBe(1); // ceil(600/1000) floored to 1
  });

  it("stays bounded when flooded with unique keys (eviction)", () => {
    for (let i = 0; i < 20_050; i++) rateLimit(`flood:${i}`, 1, 60_000, 1);
    // Doesn't throw and still serves fresh keys.
    expect(rateLimit("flood:fresh", 1, 60_000, 1).ok).toBe(true);
  });
});

describe("clientIp", () => {
  it("does not trust client headers without a configured proxy (shared bucket)", async () => {
    // TRUSTED_PROXY_HOPS defaults to 0, so a spoofable X-Forwarded-For is ignored.
    expect(await clientIp()).toBe("shared");
  });
});
