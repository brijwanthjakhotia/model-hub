/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Note: images render via <Image unoptimized> (arbitrary user-supplied hosts),
  // so the Next image optimizer — and its remotePatterns allowlist — is not used.
  // If a trusted-host optimizer is reintroduced, add remotePatterns here.
};

export default nextConfig;
