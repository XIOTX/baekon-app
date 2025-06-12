/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization config for deployment
  images: {
    unoptimized: true
  },

  // Webpack config for compatibility
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  // Skip linting during build for faster deployment
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  }
};

module.exports = nextConfig;
