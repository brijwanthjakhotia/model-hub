import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";

/* --- mocks for the action's collaborators ------------------------------- */
const { requireUser, createSession, revalidatePath, rateLimit, prisma } = vi.hoisted(() => ({
  requireUser: vi.fn(async () => ({ id: "u1", name: "Jordan", email: "user@example.com" })),
  createSession: vi.fn(),
  revalidatePath: vi.fn(),
  rateLimit: vi.fn(() => ({ ok: true, retryAfterSec: 0 })),
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    passwordResetToken: { deleteMany: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({ requireUser, createSession }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit, clientIp: async () => "test-ip" }));
vi.mock("@/lib/prisma", () => ({ prisma }));

import { Prisma } from "@prisma/client";
import { updateProfileAction, changePasswordAction } from "@/actions/account";

const form = (o: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(o)) fd.append(k, v);
  return fd;
};

beforeEach(() => {
  rateLimit.mockReturnValue({ ok: true, retryAfterSec: 0 });
  requireUser.mockResolvedValue({ id: "u1", name: "Jordan", email: "user@example.com" });
});
afterEach(() => {
  vi.clearAllMocks();
});

describe("updateProfileAction", () => {
  it("updates the profile, re-issues the session, and revalidates", async () => {
    prisma.user.update.mockResolvedValueOnce({});
    const state = await updateProfileAction(
      {},
      form({ name: "New Name", email: "New@Example.com", avatarUrl: "https://x/y.png" }),
    );

    expect(state.success).toBeTruthy();
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { name: "New Name", email: "new@example.com", avatarUrl: "https://x/y.png" },
    });
    // Session refreshed with the new identity so the header updates.
    expect(createSession).toHaveBeenCalledWith({
      id: "u1",
      name: "New Name",
      email: "new@example.com",
    });
    expect(revalidatePath).toHaveBeenCalled();
  });

  it("stores an empty avatar as null", async () => {
    prisma.user.update.mockResolvedValueOnce({});
    await updateProfileAction({}, form({ name: "New Name", email: "new@example.com", avatarUrl: "" }));
    expect(prisma.user.update.mock.calls[0][0].data.avatarUrl).toBeNull();
  });

  it("maps a duplicate email (P2002) to a field error and leaves the session alone", async () => {
    prisma.user.update.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "test" }),
    );
    const state = await updateProfileAction(
      {},
      form({ name: "New Name", email: "taken@example.com", avatarUrl: "" }),
    );
    expect(state.fieldErrors?.email?.[0]).toMatch(/already in use/i);
    expect(createSession).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid input without touching the DB", async () => {
    const state = await updateProfileAction({}, form({ name: "x", email: "bad", avatarUrl: "" }));
    expect(state.fieldErrors).toBeTruthy();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});

describe("changePasswordAction", () => {
  it("changes the password when the current one is correct", async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ passwordHash: await bcrypt.hash("realpass1", 10) });
    prisma.user.update.mockResolvedValueOnce({});
    prisma.passwordResetToken.deleteMany.mockResolvedValueOnce({ count: 0 });

    const state = await changePasswordAction(
      {},
      form({ currentPassword: "realpass1", newPassword: "brandnew1", confirmPassword: "brandnew1" }),
    );

    expect(state.success).toBeTruthy();
    const storedHash = prisma.user.update.mock.calls[0][0].data.passwordHash;
    expect(await bcrypt.compare("brandnew1", storedHash)).toBe(true);
    // Any outstanding reset tokens are invalidated.
    expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
  });

  it("rejects an incorrect current password with a field error", async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ passwordHash: await bcrypt.hash("realpass1", 10) });
    const state = await changePasswordAction(
      {},
      form({ currentPassword: "wrongpass", newPassword: "brandnew1", confirmPassword: "brandnew1" }),
    );
    expect(state.fieldErrors?.currentPassword?.[0]).toMatch(/incorrect/i);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("rejects a new password that doesn't match its confirmation", async () => {
    const state = await changePasswordAction(
      {},
      form({ currentPassword: "realpass1", newPassword: "brandnew1", confirmPassword: "different1" }),
    );
    expect(state.fieldErrors?.confirmPassword?.[0]).toMatch(/do not match/i);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("rejects a new password identical to the current one", async () => {
    const state = await changePasswordAction(
      {},
      form({ currentPassword: "samepass1", newPassword: "samepass1", confirmPassword: "samepass1" }),
    );
    expect(state.fieldErrors?.newPassword?.[0]).toMatch(/different/i);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("rate-limits repeated attempts (per account)", async () => {
    rateLimit.mockReturnValueOnce({ ok: false, retryAfterSec: 60 });
    const state = await changePasswordAction(
      {},
      form({ currentPassword: "realpass1", newPassword: "brandnew1", confirmPassword: "brandnew1" }),
    );
    expect(state.error).toMatch(/too many/i);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
