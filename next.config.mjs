// Baseline security headers. CSP is limited to `frame-ancestors` (clickjacking
// defense that doesn't require hashing the inline theme script); a full
// script-src CSP would need a nonce/hash for that script.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Note: images render via <Image unoptimized> (arbitrary user-supplied hosts),
  // so the Next image optimizer — and its remotePatterns allowlist — is not used.
  // If a trusted-host optimizer is reintroduced, add remotePatterns here.
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
