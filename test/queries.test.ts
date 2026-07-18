import { describe, expect, it, vi } from "vitest";

// toPage is a pure helper; stub prisma so importing queries.ts is cheap.
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { toPage } from "@/lib/queries";

describe("toPage", () => {
  it("clamps invalid, empty, or <=1 values to 1", () => {
    for (const v of [undefined, null, "", "abc", "0", "1", "-5", "  ", NaN, Infinity, -Infinity]) {
      expect(toPage(v)).toBe(1);
    }
  });

  it("returns the integer page for valid values > 1", () => {
    expect(toPage("2")).toBe(2);
    expect(toPage("10")).toBe(10);
    expect(toPage(5)).toBe(5);
    expect(toPage("2.9")).toBe(2); // truncates toward zero
  });
});
