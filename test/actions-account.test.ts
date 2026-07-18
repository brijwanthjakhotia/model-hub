import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";

/* --- mocks for the action's collaborators ------------------------------- */
const { requireUser, createSession, revalidatePath, rateLimit, prisma } = vi.hoisted(() => ({
  requireUser: vi.fn(async () => ({ id: "u1", name: "Jordan", email: "user@example.com", tokenVersion: 0 })),
  createSession: vi.fn(),
  revalidatePath: vi.fn(),
  rateLimit: vi.fn(() => ({ ok: true, retryAfterSec: 0 })),
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    passwordResetToken: { deleteMany: vi.fn() },
    // array-form transaction: resolve the built operations
    $transaction: vi.fn(async (ops: unknown[]) => Promise.all(ops)),
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
  requireUser.mockResolvedValue({ id: "u1", name: "Jordan", email: "user@example.com", tokenVersion: 0 });
});
afterEach(() => {
  vi.clearAllMocks();
});

describe("updateProfileAction", () => {
  it("enforces auth via requireUser", async () => {
    prisma.user.update.mockResolvedValueOnce({});
    await updateProfileAction({}, form({ name: "New Name", email: "user@example.com", avatarUrl: "" }));
    expect(requireUser).toHaveBeenCalled();
  });

  it("updates name/avatar (no email change → no re-auth) and re-issues the session", async () => {
    prisma.user.update.mockResolvedValueOnce({});
    const state = await updateProfileAction(
      {},
      form({ name: "New Name", email: "user@example.com", avatarUrl: "https://x/y.png" }),
    );

    expect(state.success).toBeTruthy();
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { name: "New Name", email: "user@example.com", avatarUrl: "https://x/y.png" },
    });
    // Session refreshed carrying the unchanged tokenVersion.
    expect(createSession).toHaveBeenCalledWith({
      id: "u1",
      name: "New Name",
      email: "user@example.com",
      tokenVersion: 0,
    });
    expect(revalidatePath).toHaveBeenCalled();
    // No email change → no password re-check.
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("requires the current password to change the email", async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ passwordHash: await bcrypt.hash("secret1", 10) });
    const state = await updateProfileAction(
      {},
      form({ name: "Jordan", email: "new@example.com", avatarUrl: "", currentPassword: "wrong" }),
    );
    expect(state.fieldErrors?.currentPassword?.[0]).toMatch(/current password/i);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("changes the email when the current password is correct", async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ passwordHash: await bcrypt.hash("secret1", 10) });
    prisma.user.update.mockResolvedValueOnce({});
    const state = await updateProfileAction(
      {},
      form({ name: "Jordan", email: "new@example.com", avatarUrl: "", currentPassword: "secret1" }),
    );
    expect(state.success).toBeTruthy();
    expect(prisma.user.update.mock.calls[0][0].data.email).toBe("new@example.com");
  });

  it("stores an empty avatar as null", async () => {
    prisma.user.update.mockResolvedValueOnce({});
    await updateProfileAction({}, form({ name: "New Name", email: "user@example.com", avatarUrl: "" }));
    expect(prisma.user.update.mock.calls[0][0].data.avatarUrl).toBeNull();
  });

  it("rejects a non-http(s) avatar URL", async () => {
    const state = await updateProfileAction(
      {},
      form({ name: "New Name", email: "user@example.com", avatarUrl: "javascript:alert(1)" }),
    );
    expect(state.fieldErrors?.avatarUrl).toBeTruthy();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("maps a duplicate email (P2002) to a field error and leaves the session alone", async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ passwordHash: await bcrypt.hash("secret1", 10) });
    prisma.user.update.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "test" }),
    );
    const state = await updateProfileAction(
      {},
      form({ name: "New Name", email: "taken@example.com", avatarUrl: "", currentPassword: "secret1" }),
    );
    expect(state.fieldErrors?.email?.[0]).toMatch(/already in use/i);
    expect(createSession).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid input without touching the DB", async () => {
    const state = await updateProfileAction({}, form({ name: "x", email: "bad", avatarUrl: "" }));
    expect(state.fieldErrors).toBeTruthy();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("reports an expired session if the account vanished during an email change", async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null); // row gone
    const state = await updateProfileAction(
      {},
      form({ name: "Jordan", email: "new@example.com", avatarUrl: "", currentPassword: "secret1" }),
    );
    expect(state.error).toMatch(/session has expired/i);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});

describe("changePasswordAction", () => {
  it("changes the password, bumps tokenVersion, re-issues the session, clears reset tokens", async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ passwordHash: await bcrypt.hash("realpass1", 10) });
    prisma.user.update.mockResolvedValueOnce({ tokenVersion: 1 });
    prisma.passwordResetToken.deleteMany.mockResolvedValueOnce({ count: 0 });

    const state = await changePasswordAction(
      {},
      form({ currentPassword: "realpass1", newPassword: "brandnew1", confirmPassword: "brandnew1" }),
    );

    expect(state.success).toBeTruthy();
    const data = prisma.user.update.mock.calls[0][0].data;
    expect(await bcrypt.compare("brandnew1", data.passwordHash)).toBe(true);
    expect(data.tokenVersion).toEqual({ increment: 1 });
    expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
    // Current session re-issued with the new tokenVersion so this device stays in.
    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({ id: "u1", tokenVersion: 1 }),
    );
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

  it("reports an expired session if the account row is gone", async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    const state = await changePasswordAction(
      {},
      form({ currentPassword: "realpass1", newPassword: "brandnew1", confirmPassword: "brandnew1" }),
    );
    expect(state.error).toMatch(/session has expired/i);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
