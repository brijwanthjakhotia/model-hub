import { describe, expect, it } from "vitest";
import {
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations";

describe("updateProfileSchema", () => {
  it("accepts a valid profile and normalises the email", () => {
    const r = updateProfileSchema.safeParse({
      name: "Jordan Rivera",
      email: "Jordan@Example.com",
      avatarUrl: "https://example.com/a.png",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("jordan@example.com");
  });

  it("allows a blank avatar URL", () => {
    const r = updateProfileSchema.safeParse({ name: "Jordan", email: "j@x.com", avatarUrl: "" });
    expect(r.success).toBe(true);
  });

  it("rejects a non-URL avatar and a too-short name", () => {
    expect(updateProfileSchema.safeParse({ name: "Jo", email: "j@x.com", avatarUrl: "not-a-url" }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ name: "J", email: "j@x.com", avatarUrl: "" }).success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  const base = { currentPassword: "oldpass12", newPassword: "newpass12", confirmPassword: "newpass12" };

  it("accepts a valid change", () => {
    expect(changePasswordSchema.safeParse(base).success).toBe(true);
  });

  it("rejects mismatched confirmation", () => {
    const r = changePasswordSchema.safeParse({ ...base, confirmPassword: "different" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.flatten().fieldErrors.confirmPassword?.[0]).toMatch(/do not match/i);
  });

  it("rejects a new password identical to the current one", () => {
    const r = changePasswordSchema.safeParse({
      currentPassword: "samepass1",
      newPassword: "samepass1",
      confirmPassword: "samepass1",
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.flatten().fieldErrors.newPassword?.[0]).toMatch(/different/i);
  });

  it("rejects a too-short new password", () => {
    expect(
      changePasswordSchema.safeParse({ ...base, newPassword: "short", confirmPassword: "short" }).success,
    ).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("normalises the email", () => {
    const r = forgotPasswordSchema.safeParse({ email: "  User@Example.COM " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("user@example.com");
  });

  it("rejects an invalid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("accepts a valid reset", () => {
    expect(
      resetPasswordSchema.safeParse({ token: "abc", password: "newpass12", confirmPassword: "newpass12" }).success,
    ).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const r = resetPasswordSchema.safeParse({ token: "abc", password: "newpass12", confirmPassword: "nope" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.flatten().fieldErrors.confirmPassword?.[0]).toMatch(/do not match/i);
  });

  it("rejects a too-short password and a missing token", () => {
    expect(resetPasswordSchema.safeParse({ token: "abc", password: "short", confirmPassword: "short" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ token: "", password: "newpass12", confirmPassword: "newpass12" }).success).toBe(false);
  });
});
