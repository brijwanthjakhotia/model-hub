import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mutable headers so individual tests can set X-Forwarded-For.
const { hdrs } = vi.hoisted(() => ({ hdrs: { value: new Headers() } }));
vi.mock("next/headers", () => ({ headers: async () => hdrs.value }));

import { rateLimit, clientIp, __resetRateLimit } from "@/lib/rate-limit";

beforeEach(() => {
  __resetRateLimit();
  hdrs.value = new Headers();
});

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
  it("returns null without a configured proxy (ignores a spoofable XFF)", async () => {
    // TRUSTED_PROXY_HOPS defaults to 0 → header untrusted → null (callers then
    // skip the per-IP cap rather than collapsing everyone into one bucket).
    hdrs.value = new Headers({ "x-forwarded-for": "1.2.3.4" });
    expect(await clientIp()).toBeNull();
  });

  it("reads the Nth-from-right XFF entry when a trusted proxy is configured", async () => {
    vi.stubEnv("TRUSTED_PROXY_HOPS", "1");
    vi.resetModules();
    hdrs.value = new Headers({ "x-forwarded-for": "9.9.9.9, 10.0.0.1" });
    const fresh = await import("@/lib/rate-limit");
    // hops=1 → the entry our closest proxy appended (rightmost) = real client.
    expect(await fresh.clientIp()).toBe("10.0.0.1");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });
});
