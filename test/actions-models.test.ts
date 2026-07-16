import { afterEach, describe, expect, it, vi } from "vitest";

const { requireUser, requireAdmin, redirect, tx, prisma } = vi.hoisted(() => {
  const tx = { model: { findUnique: vi.fn(), update: vi.fn() } };
  return {
    requireUser: vi.fn(async () => ({ id: "u1", name: "J", email: "j@x.com" })),
    requireAdmin: vi.fn(async () => ({
      id: "a1",
      name: "M",
      email: "m@x.com",
      role: "MODERATOR" as const,
    })),
    redirect: vi.fn((u: string) => {
      throw new Error(`REDIRECT:${u}`);
    }),
    tx,
    prisma: {
      model: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
      $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
    },
  };
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/auth", () => ({ requireUser, requireAdmin }));
vi.mock("@/lib/prisma", () => ({ prisma }));

import { Prisma } from "@prisma/client";
import {
  createModelAction,
  decideModelAction,
  toggleFeaturedAction,
  deleteModelAction,
} from "@/actions/models";

const form = (o: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(o)) fd.append(k, v);
  return fd;
};

const validModel = {
  name: "Casey Newface",
  category: "Runway",
  gender: "FEMALE",
  location: "Cape Town",
  experience: "New Face",
  bio: "An experienced runway and editorial model with a versatile, camera-ready look.",
  heightCm: "178",
};

const p2002 = new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "test" });
const p2025 = new Prisma.PrismaClientKnownRequestError("gone", { code: "P2025", clientVersion: "test" });

afterEach(() => vi.clearAllMocks());

describe("createModelAction", () => {
  it("creates a PENDING profile owned by the user and redirects", async () => {
    prisma.model.create.mockResolvedValueOnce({ id: "m1" });
    await expect(createModelAction({}, form(validModel))).rejects.toThrow(
      "REDIRECT:/dashboard?submitted=1",
    );
    const data = prisma.model.create.mock.calls[0][0].data;
    expect(data.status).toBe("PENDING");
    expect(data.submittedById).toBe("u1");
    expect(data.slug).toBe("casey-newface");
  });

  it("retries with a new slug on a unique collision", async () => {
    prisma.model.create.mockRejectedValueOnce(p2002).mockResolvedValueOnce({ id: "m2" });
    await expect(createModelAction({}, form(validModel))).rejects.toThrow(
      "REDIRECT:/dashboard?submitted=1",
    );
    expect(prisma.model.create).toHaveBeenCalledTimes(2);
    expect(prisma.model.create.mock.calls[0][0].data.slug).toBe("casey-newface");
    expect(prisma.model.create.mock.calls[1][0].data.slug).toBe("casey-newface-2");
  });

  it("returns field errors for invalid input", async () => {
    const state = await createModelAction({}, form({ ...validModel, bio: "too short" }));
    expect(state.fieldErrors).toBeTruthy();
    expect(prisma.model.create).not.toHaveBeenCalled();
  });
});

describe("decideModelAction", () => {
  it("applies an APPROVED decision with reviewer metadata", async () => {
    await decideModelAction(form({ modelId: "m1", decision: "APPROVED", note: "" }));
    const arg = prisma.model.update.mock.calls[0][0];
    expect(arg.where).toEqual({ id: "m1" });
    expect(arg.data.status).toBe("APPROVED");
    expect(arg.data.reviewedById).toBe("a1");
  });

  it("throws on an invalid decision", async () => {
    await expect(
      decideModelAction(form({ modelId: "m1", decision: "MAYBE" })),
    ).rejects.toThrow(/invalid decision/i);
  });

  it("maps a vanished model (P2025) to a friendly error", async () => {
    prisma.model.update.mockRejectedValueOnce(p2025);
    await expect(
      decideModelAction(form({ modelId: "gone", decision: "REJECTED", note: "n" })),
    ).rejects.toThrow(/no longer exists/i);
  });
});

describe("toggleFeaturedAction", () => {
  it("flips featured atomically inside a transaction", async () => {
    tx.model.findUnique.mockResolvedValueOnce({ featured: false });
    await toggleFeaturedAction(form({ modelId: "m1" }));
    expect(tx.model.update).toHaveBeenCalledWith({
      where: { id: "m1" },
      data: { featured: true },
    });
  });

  it("throws when the model no longer exists", async () => {
    tx.model.findUnique.mockResolvedValueOnce(null);
    await expect(toggleFeaturedAction(form({ modelId: "gone" }))).rejects.toThrow(
      /no longer exists/i,
    );
  });
});

describe("deleteModelAction", () => {
  it("deletes a model", async () => {
    await deleteModelAction(form({ modelId: "m1" }));
    expect(prisma.model.delete).toHaveBeenCalledWith({ where: { id: "m1" } });
  });

  it("maps a vanished model (P2025) to a friendly error", async () => {
    prisma.model.delete.mockRejectedValueOnce(p2025);
    await expect(deleteModelAction(form({ modelId: "gone" }))).rejects.toThrow(
      /no longer exists/i,
    );
  });
});
