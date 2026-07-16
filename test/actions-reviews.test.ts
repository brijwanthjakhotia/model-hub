import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { requireUser, rateLimit, tx, prisma } = vi.hoisted(() => {
  const tx = {
    review: { upsert: vi.fn(), aggregate: vi.fn() },
    model: { update: vi.fn() },
  };
  return {
    requireUser: vi.fn(async () => ({ id: "u1", name: "J", email: "j@x.com" })),
    rateLimit: vi.fn(() => ({ ok: true, retryAfterSec: 0 })),
    tx,
    prisma: {
      model: { findUnique: vi.fn() },
      $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
    },
  };
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireUser }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit }));
vi.mock("@/lib/prisma", () => ({ prisma }));

import { Prisma } from "@prisma/client";
import { addReviewAction } from "@/actions/reviews";

const form = (o: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(o)) fd.append(k, v);
  return fd;
};

const approvedByOther = {
  id: "m1",
  slug: "someone",
  status: "APPROVED",
  submittedById: "other",
};
const validReview = { modelId: "m1", rating: "5", title: "Great", body: "A thorough, genuine review of the shoot." };

beforeEach(() => rateLimit.mockReturnValue({ ok: true, retryAfterSec: 0 }));
afterEach(() => vi.clearAllMocks());

describe("addReviewAction", () => {
  it("writes the review and recomputes the rating in one transaction", async () => {
    prisma.model.findUnique.mockResolvedValueOnce(approvedByOther);
    tx.review.aggregate.mockResolvedValueOnce({ _avg: { rating: 5 }, _count: { _all: 1 } });
    const state = await addReviewAction({}, form(validReview));
    expect(state.success).toBe(true);
    expect(requireUser).toHaveBeenCalledOnce(); // authz enforced
    expect(tx.review.upsert).toHaveBeenCalledOnce();
    expect(tx.model.update).toHaveBeenCalledWith({
      where: { id: "m1" },
      data: { ratingAvg: 5, ratingCount: 1 },
    });
  });

  it("blocks reviewing a profile you submitted", async () => {
    prisma.model.findUnique.mockResolvedValueOnce({ ...approvedByOther, submittedById: "u1" });
    const state = await addReviewAction({}, form(validReview));
    expect(state.error).toMatch(/cannot review a profile you submitted/i);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects a non-APPROVED (or missing) target", async () => {
    prisma.model.findUnique.mockResolvedValueOnce({ ...approvedByOther, status: "PENDING" });
    const pending = await addReviewAction({}, form(validReview));
    expect(pending.error).toMatch(/not available for reviews/i);

    prisma.model.findUnique.mockResolvedValueOnce(null);
    const missing = await addReviewAction({}, form(validReview));
    expect(missing.error).toMatch(/not available for reviews/i);
  });

  it("returns field errors for invalid input without loading the model", async () => {
    const state = await addReviewAction({}, form({ modelId: "m1", rating: "0", body: "short" }));
    expect(state.fieldErrors).toBeTruthy();
    expect(prisma.model.findUnique).not.toHaveBeenCalled();
  });

  it("throttles a member who posts reviews too quickly", async () => {
    prisma.model.findUnique.mockResolvedValueOnce(approvedByOther);
    rateLimit.mockReturnValueOnce({ ok: false, retryAfterSec: 60 });
    const state = await addReviewAction({}, form(validReview));
    expect(state.error).toMatch(/too quickly/i);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("maps a model deleted mid-write (P2003) to the friendly message", async () => {
    prisma.model.findUnique.mockResolvedValueOnce(approvedByOther);
    prisma.$transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("fk", { code: "P2003", clientVersion: "test" }),
    );
    const state = await addReviewAction({}, form(validReview));
    expect(state.error).toMatch(/not available for reviews/i);
  });

  it("rethrows an unexpected transaction error", async () => {
    prisma.model.findUnique.mockResolvedValueOnce(approvedByOther);
    prisma.$transaction.mockRejectedValueOnce(new Error("db down"));
    await expect(addReviewAction({}, form(validReview))).rejects.toThrow("db down");
  });
});
