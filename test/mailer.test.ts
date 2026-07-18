import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createTransport, sendMailMock } = vi.hoisted(() => {
  const sendMailMock = vi.fn(
    async (_opts: { from: string; to: string; subject: string; html: string; text: string }) => ({}),
  );
  return { sendMailMock, createTransport: vi.fn(() => ({ sendMail: sendMailMock })) };
});
vi.mock("nodemailer", () => ({ default: { createTransport }, createTransport }));

const OLD_ENV = process.env;

beforeEach(() => {
  vi.resetModules(); // fresh module → resets the cached transport
  vi.clearAllMocks();
  process.env = { ...OLD_ENV };
});
afterEach(() => {
  process.env = OLD_ENV;
});

const load = () => import("@/lib/mailer");

describe("sendMail", () => {
  it("logs instead of sending when SMTP is not configured", async () => {
    delete process.env.SMTP_HOST;
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    const { sendMail } = await load();
    await sendMail({ to: "a@b.com", subject: "Hi", html: "<p>x</p>", text: "hello" });
    expect(createTransport).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it("sends via SMTP when configured, using MAIL_FROM", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.MAIL_FROM = "Muse <no-reply@muse.test>";
    const { sendMail } = await load();
    await sendMail({ to: "a@b.com", subject: "Hi", html: "<p>x</p>", text: "hello" });
    expect(createTransport).toHaveBeenCalledOnce();
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({ from: "Muse <no-reply@muse.test>", to: "a@b.com", subject: "Hi" }),
    );
  });

  it("caches the transport across calls", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    const { sendMail } = await load();
    await sendMail({ to: "a@b.com", subject: "1", html: "", text: "" });
    await sendMail({ to: "a@b.com", subject: "2", html: "", text: "" });
    expect(createTransport).toHaveBeenCalledOnce();
  });
});

describe("sendPasswordResetEmail", () => {
  it("puts the reset URL in both text and html, with a reset subject", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    const { sendPasswordResetEmail } = await load();
    const url = "http://x/reset-password?token=abc";
    await sendPasswordResetEmail("a@b.com", url);
    const arg = sendMailMock.mock.calls[0][0];
    expect(arg.subject).toMatch(/reset/i);
    expect(arg.text).toContain(url);
    expect(arg.html).toContain(url);
  });
});

describe("getBaseUrl", () => {
  it("prefers APP_URL and strips a trailing slash", async () => {
    process.env.APP_URL = "https://muse.example.com/";
    const { getBaseUrl } = await load();
    expect(getBaseUrl()).toBe("https://muse.example.com");
  });

  it("defaults to localhost in development when APP_URL is unset", async () => {
    delete process.env.APP_URL; // NODE_ENV is 'test' → non-production
    const { getBaseUrl } = await load();
    expect(getBaseUrl()).toBe("http://localhost:3000");
  });

  it("throws in production when APP_URL is unset", async () => {
    delete process.env.APP_URL;
    (process.env as Record<string, string>).NODE_ENV = "production";
    const { getBaseUrl } = await load();
    expect(() => getBaseUrl()).toThrow(/APP_URL/);
  });
});
