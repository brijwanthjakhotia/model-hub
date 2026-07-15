import { describe, expect, it } from "vitest";
import { statusLoginMessage } from "@/lib/auth-messages";

describe("statusLoginMessage", () => {
  it("tells a PENDING member they're awaiting approval", () => {
    expect(statusLoginMessage("PENDING")).toMatch(/awaiting approval/i);
  });

  it("tells an INACTIVE member their account is inactive", () => {
    expect(statusLoginMessage("INACTIVE")).toMatch(/inactive/i);
  });

  it("uses one generic 'suspended' message for both suspended states (no fraud disclosure)", () => {
    const suspended = statusLoginMessage("SUSPENDED");
    expect(suspended).toMatch(/suspended/i);
    expect(statusLoginMessage("SUSPENDED_FRAUD")).toBe(suspended);
    expect(suspended.toLowerCase()).not.toContain("fraud");
  });
});
