/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Improve chunk loading reliability in production
  productionBrowserSourceMaps: false,
  // Ensure static assets are handled properly
  poweredByHeader: false,
  // Generate a stable build ID for cache busting
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  }
};

module.exports = nextConfig;
