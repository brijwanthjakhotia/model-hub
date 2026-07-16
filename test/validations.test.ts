import { describe, expect, it } from "vitest";
import {
  loginSchema,
  modelSchema,
  registerSchema,
  reviewDecisionSchema,
  reviewSchema,
  userStatusSchema,
} from "@/lib/validations";

describe("registerSchema", () => {
  const valid = {
    name: "Alex Morgan",
    email: "Alex@Example.com",
    password: "supersecret",
    confirmPassword: "supersecret",
  };

  it("accepts a valid registration and normalises the email", () => {
    const r = registerSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("alex@example.com");
  });

  it("rejects mismatched passwords on confirmPassword", () => {
    const r = registerSchema.safeParse({ ...valid, confirmPassword: "different" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.flatten().fieldErrors.confirmPassword?.[0]).toMatch(/do not match/i);
    }
  });

  it("rejects short passwords", () => {
    const r = registerSchema.safeParse({ ...valid, password: "short", confirmPassword: "short" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.flatten().fieldErrors.password).toBeDefined();
  });

  it("rejects invalid emails and short names", () => {
    expect(registerSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, name: "A" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.com", password: "x" }).success,
    ).toBe(true);
  });

  it("rejects an invalid email or empty password", () => {
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("modelSchema", () => {
  const base = {
    name: "Test Model",
    category: "Runway",
    gender: "FEMALE",
    location: "Paris, FR",
    experience: "New Face",
    bio: "A".repeat(50),
    heightCm: "178",
    hairColor: "",
    eyeColor: "",
    instagram: "",
    agencyEmail: "",
    headshotUrl: "",
    gallery: "",
  };

  it("accepts a valid minimal submission", () => {
    const r = modelSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.heightCm).toBe(178);
  });

  it("coerces filled measurement strings to numbers", () => {
    const r = modelSchema.safeParse({ ...base, bust: "82", waist: "61", shoeEu: "40.5" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.bust).toBe(82);
      expect(r.data.shoeEu).toBe(40.5);
    }
  });

  // Regression: blank optional measurements must be treated as "not provided",
  // not coerced to 0 (which previously failed the min() checks).
  it("treats blank optional measurements as undefined", () => {
    const r = modelSchema.safeParse({ ...base, bust: "", waist: "", hips: "", shoeEu: "" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.bust).toBeUndefined();
      expect(r.data.waist).toBeUndefined();
      expect(r.data.hips).toBeUndefined();
      expect(r.data.shoeEu).toBeUndefined();
    }
  });

  it("rejects out-of-range measurements", () => {
    expect(modelSchema.safeParse({ ...base, bust: "10" }).success).toBe(false);
    expect(modelSchema.safeParse({ ...base, heightCm: "300" }).success).toBe(false);
    expect(modelSchema.safeParse({ ...base, heightCm: "50" }).success).toBe(false);
  });

  it("requires name, location and a long-enough bio", () => {
    expect(modelSchema.safeParse({ ...base, name: "A" }).success).toBe(false);
    expect(modelSchema.safeParse({ ...base, location: "" }).success).toBe(false);
    expect(modelSchema.safeParse({ ...base, bio: "too short" }).success).toBe(false);
  });

  it("rejects an unknown category or gender", () => {
    expect(modelSchema.safeParse({ ...base, category: "Astronaut" }).success).toBe(false);
    expect(modelSchema.safeParse({ ...base, gender: "ROBOT" }).success).toBe(false);
  });

  it("rejects a malformed contact email but allows a blank one", () => {
    expect(modelSchema.safeParse({ ...base, agencyEmail: "nope" }).success).toBe(false);
    expect(modelSchema.safeParse({ ...base, agencyEmail: "agent@x.com" }).success).toBe(true);
    expect(modelSchema.safeParse({ ...base, agencyEmail: "" }).success).toBe(true);
  });
});

describe("reviewSchema", () => {
  const valid = { modelId: "abc", rating: "5", body: "Great to work with on set." };

  it("accepts a valid review and coerces the rating", () => {
    const r = reviewSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.rating).toBe(5);
  });

  it("rejects ratings outside 1..5", () => {
    expect(reviewSchema.safeParse({ ...valid, rating: "0" }).success).toBe(false);
    expect(reviewSchema.safeParse({ ...valid, rating: "6" }).success).toBe(false);
  });

  it("rejects a too-short body", () => {
    expect(reviewSchema.safeParse({ ...valid, body: "short" }).success).toBe(false);
  });

  it("requires a modelId", () => {
    expect(reviewSchema.safeParse({ ...valid, modelId: "" }).success).toBe(false);
  });
});

describe("reviewDecisionSchema", () => {
  it("accepts APPROVED and REJECTED decisions", () => {
    expect(reviewDecisionSchema.safeParse({ modelId: "x", decision: "APPROVED" }).success).toBe(true);
    expect(
      reviewDecisionSchema.safeParse({ modelId: "x", decision: "REJECTED", note: "Missing photos" }).success,
    ).toBe(true);
  });

  it("rejects an invalid decision", () => {
    expect(reviewDecisionSchema.safeParse({ modelId: "x", decision: "MAYBE" }).success).toBe(false);
  });

  it("requires a note when rejecting", () => {
    const missing = reviewDecisionSchema.safeParse({ modelId: "x", decision: "REJECTED" });
    expect(missing.success).toBe(false);
    expect(reviewDecisionSchema.safeParse({ modelId: "x", decision: "REJECTED", note: "" }).success).toBe(false);
    // whitespace-only trims away → still rejected, error on the `note` path
    const ws = reviewDecisionSchema.safeParse({ modelId: "x", decision: "REJECTED", note: "   " });
    expect(ws.success).toBe(false);
    if (!ws.success) expect(ws.error.flatten().fieldErrors.note).toBeTruthy();
  });

  it("allows APPROVED with no note", () => {
    expect(reviewDecisionSchema.safeParse({ modelId: "x", decision: "APPROVED" }).success).toBe(true);
  });
});

describe("userStatusSchema", () => {
  it("accepts every valid member status", () => {
    for (const status of [
      "PENDING",
      "ACTIVE",
      "INACTIVE",
      "SUSPENDED_FRAUD",
      "SUSPENDED",
    ]) {
      expect(userStatusSchema.safeParse({ userId: "u1", status }).success).toBe(true);
    }
  });

  it("rejects an unknown status", () => {
    expect(userStatusSchema.safeParse({ userId: "u1", status: "BANNED" }).success).toBe(false);
  });

  it("requires a userId", () => {
    expect(userStatusSchema.safeParse({ userId: "", status: "ACTIVE" }).success).toBe(false);
  });
});
