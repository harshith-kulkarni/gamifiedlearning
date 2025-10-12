/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  /* config options here */
  typescript: {
    // Ignore build errors for faster development, but allow production builds
    ignoreBuildErrors: false,
  },
  eslint: {
    // Allow warnings during builds, but fail on errors
    ignoreDuringBuilds: true,
  },
  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Enable compression
  compress: true,
  // Enable webpack optimizations
  webpack: (config) => {
    // Enable top-level await
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };
    return config;
  },
};

module.exports = nextConfig;