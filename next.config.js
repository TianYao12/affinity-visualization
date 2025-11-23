/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  devIndicators: {
    // Hide the default Next.js dev activity logo overlay
    buildActivity: false,
    appIsrStatus: false,
  },
};

module.exports = nextConfig;
