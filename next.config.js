/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "soccaportugal.mygol.es",
      },
    ],
  },
};

module.exports = nextConfig;
