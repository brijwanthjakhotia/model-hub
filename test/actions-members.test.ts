import { afterEach, describe, expect, it, vi } from "vitest";

const { requireAdmin, prisma } = vi.hoisted(() => ({
  requireAdmin: vi.fn(async () => ({
    id: "a1",
    name: "Mod",
    email: "m@x.com",
    role: "MODERATOR" as const,
  })),
  prisma: { user: { update: vi.fn() } },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAdmin }));
vi.mock("@/lib/prisma", () => ({ prisma }));

import { Prisma } from "@prisma/client";
import { updateMemberStatusAction } from "@/actions/members";

const form = (o: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(o)) fd.append(k, v);
  return fd;
};

afterEach(() => vi.clearAllMocks());

describe("updateMemberStatusAction", () => {
  it("updates a member's status", async () => {
    await updateMemberStatusAction(form({ userId: "u1", status: "ACTIVE" }));
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { status: "ACTIVE" },
    });
  });

  it("rejects an invalid status payload without touching the DB", async () => {
    await expect(
      updateMemberStatusAction(form({ userId: "u1", status: "BOGUS" })),
    ).rejects.toThrow(/invalid status/i);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("maps a vanished member (P2025) to a friendly error", async () => {
    prisma.user.update.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("gone", {
        code: "P2025",
        clientVersion: "test",
      }),
    );
    await expect(
      updateMemberStatusAction(form({ userId: "gone", status: "ACTIVE" })),
    ).rejects.toThrow(/no longer exists/i);
  });
});
