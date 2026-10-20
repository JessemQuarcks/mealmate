// Baseline security headers applied to every response. A full Content-Security
// -Policy is intentionally deferred (it needs per-origin tuning for Google Maps,
// Paystack and the inline theme script) and tracked as a P8 remaining item.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  {
    key: "Permissions-Policy",
    value: "geolocation=(self), camera=(), microphone=(), payment=(self)",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "**" },
      { protocol: "https", hostname: "lh5.googleusercontent.com", pathname: "**" },
      { protocol: "https", hostname: "maps.googleapis.com", pathname: "**" },
      { protocol: "https", hostname: "maps.gstatic.com", pathname: "**" },
      { protocol: "https", hostname: "streetviewpixels-pa.googleapis.com", pathname: "**" },
      { protocol: "https", hostname: "map.utoronto.ca", pathname: "**" },
    ],
  },
};

export default nextConfig;
