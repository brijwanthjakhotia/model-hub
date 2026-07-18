import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";

/* --- mocks for the action's collaborators ------------------------------- */
const { redirect, rateLimit, prisma, sendPasswordResetEmail, getBaseUrl } = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  rateLimit: vi.fn(() => ({ ok: true, retryAfterSec: 0 })),
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    passwordResetToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(async () => []),
  },
  sendPasswordResetEmail: vi.fn(async () => {}),
  getBaseUrl: vi.fn(async () => "http://localhost:3000"),
}));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit, clientIp: async () => "test-ip" }));
vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@/lib/mailer", () => ({ sendPasswordResetEmail, getBaseUrl }));

import { requestPasswordResetAction, resetPasswordAction } from "@/actions/password-reset";

const form = (o: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(o)) fd.append(k, v);
  return fd;
};

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

beforeEach(() => {
  rateLimit.mockReturnValue({ ok: true, retryAfterSec: 0 });
});
afterEach(() => {
  vi.clearAllMocks();
});

describe("requestPasswordResetAction", () => {
  it("creates a token and emails a reset link for a known account", async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ id: "u1", email: "user@example.com" });
    prisma.passwordResetToken.deleteMany.mockResolvedValueOnce({ count: 0 });
    prisma.passwordResetToken.create.mockResolvedValueOnce({});

    const state = await requestPasswordResetAction({}, form({ email: "user@example.com" }));

    expect(state.success).toMatch(/if an account exists/i);
    expect(prisma.passwordResetToken.create).toHaveBeenCalledOnce();
    // Only the hash is persisted — never the raw token.
    const stored = prisma.passwordResetToken.create.mock.calls[0][0].data.tokenHash;
    expect(stored).toMatch(/^[a-f0-9]{64}$/);
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      "user@example.com",
      expect.stringContaining("/reset-password?token="),
    );
  });

  it("returns the same generic message for an unknown email — no token, no email", async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    const state = await requestPasswordResetAction({}, form({ email: "nobody@example.com" }));
    expect(state.success).toMatch(/if an account exists/i);
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("swallows send failures and still returns the generic success (no enumeration)", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    prisma.user.findUnique.mockResolvedValueOnce({ id: "u1", email: "user@example.com" });
    prisma.passwordResetToken.deleteMany.mockResolvedValueOnce({ count: 0 });
    prisma.passwordResetToken.create.mockResolvedValueOnce({});
    sendPasswordResetEmail.mockRejectedValueOnce(new Error("smtp down"));

    const state = await requestPasswordResetAction({}, form({ email: "user@example.com" }));
    expect(state.success).toMatch(/if an account exists/i);
    errSpy.mockRestore();
  });

  it("rejects an invalid email without a DB lookup", async () => {
    const state = await requestPasswordResetAction({}, form({ email: "not-an-email" }));
    expect(state.fieldErrors?.email).toBeTruthy();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("rate-limits repeated requests (per email)", async () => {
    rateLimit.mockReturnValueOnce({ ok: false, retryAfterSec: 3600 });
    const state = await requestPasswordResetAction({}, form({ email: "user@example.com" }));
    expect(state.error).toMatch(/too many/i);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});

describe("resetPasswordAction", () => {
  const future = () => new Date(Date.now() + 60_000);
  const past = () => new Date(Date.now() - 60_000);

  it("sets a new password for a valid token and redirects to login", async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValueOnce({
      id: "t1",
      userId: "u1",
      expiresAt: future(),
      usedAt: null,
    });
    prisma.$transaction.mockResolvedValueOnce([]);

    await expect(
      resetPasswordAction({}, form({ token: "raw-token", password: "brandnew1", confirmPassword: "brandnew1" })),
    ).rejects.toThrow("REDIRECT:/login?reset=1");

    // Looked up by the SHA-256 hash of the raw token, not the raw value.
    expect(prisma.passwordResetToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: sha256("raw-token") },
      select: expect.anything(),
    });
    expect(prisma.$transaction).toHaveBeenCalledOnce();
    const storedHash = prisma.user.update.mock.calls[0][0].data.passwordHash;
    expect(await bcrypt.compare("brandnew1", storedHash)).toBe(true);
  });

  it("rejects an expired token", async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValueOnce({
      id: "t1",
      userId: "u1",
      expiresAt: past(),
      usedAt: null,
    });
    const state = await resetPasswordAction(
      {},
      form({ token: "raw-token", password: "brandnew1", confirmPassword: "brandnew1" }),
    );
    expect(state.error).toMatch(/invalid or has expired/i);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects an already-used token", async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValueOnce({
      id: "t1",
      userId: "u1",
      expiresAt: future(),
      usedAt: new Date(),
    });
    const state = await resetPasswordAction(
      {},
      form({ token: "raw-token", password: "brandnew1", confirmPassword: "brandnew1" }),
    );
    expect(state.error).toMatch(/invalid or has expired/i);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects an unknown token", async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValueOnce(null);
    const state = await resetPasswordAction(
      {},
      form({ token: "nope", password: "brandnew1", confirmPassword: "brandnew1" }),
    );
    expect(state.error).toMatch(/invalid or has expired/i);
  });

  it("rejects mismatched passwords without a token lookup", async () => {
    const state = await resetPasswordAction(
      {},
      form({ token: "raw-token", password: "brandnew1", confirmPassword: "different1" }),
    );
    expect(state.fieldErrors?.confirmPassword?.[0]).toMatch(/do not match/i);
    expect(prisma.passwordResetToken.findUnique).not.toHaveBeenCalled();
  });
});
