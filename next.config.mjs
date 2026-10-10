/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh5.googleusercontent.com", pathname: "**" },
      { protocol: "https", hostname: "maps.gstatic.com", pathname: "**" },
      { protocol: "https", hostname: "streetviewpixels-pa.googleapis.com", pathname: "**" },
      { protocol: "https", hostname: "map.utoronto.ca", pathname: "**" },
    ],
  },
};

export default nextConfig;
