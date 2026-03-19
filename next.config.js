/** @type {import('next').NextConfig} */
const nextConfig = {
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
