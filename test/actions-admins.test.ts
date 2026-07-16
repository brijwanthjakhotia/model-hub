import { afterEach, describe, expect, it, vi } from "vitest";

// Shared mock state via vi.hoisted so the hoisted vi.mock factories can use it.
const { requireSuperAdmin, tx, prisma } = vi.hoisted(() => {
  const tx = {
    admin: { findUnique: vi.fn(), count: vi.fn(), delete: vi.fn() },
    model: { updateMany: vi.fn() },
  };
  return {
    requireSuperAdmin: vi.fn(async () => ({
      id: "me",
      name: "Owner",
      email: "super@example.com",
      role: "SUPER_ADMIN" as const,
    })),
    tx,
    prisma: {
      $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
      admin: { create: vi.fn() },
    },
  };
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireSuperAdmin }));
vi.mock("@/lib/prisma", () => ({ prisma }));

import { Prisma } from "@prisma/client";
import { createAdminAction, deleteAdminAction } from "@/actions/admins";

const form = (o: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(o)) fd.append(k, v);
  return fd;
};
const p2002 = new Prisma.PrismaClientKnownRequestError("dup", {
  code: "P2002",
  clientVersion: "test",
});

afterEach(() => vi.clearAllMocks());

describe("createAdminAction", () => {
  it("creates an admin and returns a success message", async () => {
    prisma.admin.create.mockResolvedValueOnce({ id: "a9" });
    const state = await createAdminAction(
      {},
      form({ name: "New Mod", email: "new@x.com", password: "password123", role: "MODERATOR" }),
    );
    expect(prisma.admin.create).toHaveBeenCalledOnce();
    expect(state.success).toMatch(/created/i);
    expect(state.error).toBeUndefined();
  });

  it("maps a duplicate email (P2002) to a friendly error, no throw", async () => {
    prisma.admin.create.mockRejectedValueOnce(p2002);
    const state = await createAdminAction(
      {},
      form({ name: "Dup", email: "taken@x.com", password: "password123", role: "MODERATOR" }),
    );
    expect(state.error).toMatch(/already exists/i);
  });

  it("returns field errors for invalid input without hitting the DB", async () => {
    const state = await createAdminAction(
      {},
      form({ name: "x", email: "bad", password: "short", role: "MODERATOR" }),
    );
    expect(state.fieldErrors).toBeTruthy();
    expect(prisma.admin.create).not.toHaveBeenCalled();
  });
});

describe("deleteAdminAction", () => {
  it("refuses to delete your own account before any DB work", async () => {
    await expect(deleteAdminAction(form({ adminId: "me" }))).rejects.toThrow(
      /your own admin account/i,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("throws when the target no longer exists", async () => {
    tx.admin.findUnique.mockResolvedValueOnce(null);
    await expect(deleteAdminAction(form({ adminId: "gone" }))).rejects.toThrow(
      /no longer exists/i,
    );
    expect(tx.admin.delete).not.toHaveBeenCalled();
  });

  it("clears the target's approval metadata and deletes a moderator", async () => {
    tx.admin.findUnique.mockResolvedValueOnce({ role: "MODERATOR" });
    await deleteAdminAction(form({ adminId: "other" }));
    expect(tx.model.updateMany).toHaveBeenCalledWith({
      where: { reviewedById: "other" },
      data: { reviewedById: null, reviewedAt: null, reviewNote: null },
    });
    expect(tx.admin.delete).toHaveBeenCalledWith({ where: { id: "other" } });
    expect(tx.admin.count).not.toHaveBeenCalled(); // no count for a moderator
  });

  it("rolls back if the recount shows it removed the last super admin", async () => {
    tx.admin.findUnique.mockResolvedValueOnce({ role: "SUPER_ADMIN" });
    tx.admin.count.mockResolvedValueOnce(0); // none remain after the delete
    await expect(deleteAdminAction(form({ adminId: "other" }))).rejects.toThrow(
      /last super admin/i,
    );
    expect(tx.admin.delete).toHaveBeenCalled(); // attempted, then rolled back by the throw
  });

  it("deletes a super admin when others remain", async () => {
    tx.admin.findUnique.mockResolvedValueOnce({ role: "SUPER_ADMIN" });
    tx.admin.count.mockResolvedValueOnce(1);
    await deleteAdminAction(form({ adminId: "other" }));
    expect(tx.admin.delete).toHaveBeenCalledWith({ where: { id: "other" } });
  });
});
