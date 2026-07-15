import { afterEach, describe, expect, it, vi } from "vitest";

// Shared mock state via vi.hoisted so the hoisted vi.mock factories can use it.
const { requireSuperAdmin, tx, prisma } = vi.hoisted(() => {
  const tx = {
    admin: { findUnique: vi.fn(), count: vi.fn(), delete: vi.fn() },
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

import { deleteAdminAction } from "@/actions/admins";

const form = (o: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(o)) fd.append(k, v);
  return fd;
};

afterEach(() => vi.clearAllMocks());

describe("deleteAdminAction", () => {
  it("refuses to delete your own account", async () => {
    await expect(deleteAdminAction(form({ adminId: "me" }))).rejects.toThrow(
      /your own admin account/i,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("refuses to remove the last super admin", async () => {
    tx.admin.findUnique.mockResolvedValueOnce({ role: "SUPER_ADMIN" });
    tx.admin.count.mockResolvedValueOnce(1);
    await expect(deleteAdminAction(form({ adminId: "other" }))).rejects.toThrow(
      /last super admin/i,
    );
    expect(tx.admin.delete).not.toHaveBeenCalled();
  });

  it("deletes a moderator without a super-admin count check", async () => {
    tx.admin.findUnique.mockResolvedValueOnce({ role: "MODERATOR" });
    await deleteAdminAction(form({ adminId: "other" }));
    expect(tx.admin.count).not.toHaveBeenCalled();
    expect(tx.admin.delete).toHaveBeenCalledWith({ where: { id: "other" } });
  });

  it("deletes a super admin when others remain", async () => {
    tx.admin.findUnique.mockResolvedValueOnce({ role: "SUPER_ADMIN" });
    tx.admin.count.mockResolvedValueOnce(2);
    await deleteAdminAction(form({ adminId: "other" }));
    expect(tx.admin.delete).toHaveBeenCalledWith({ where: { id: "other" } });
  });
});
