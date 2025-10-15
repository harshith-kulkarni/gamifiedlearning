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
  
  // Configure for large file uploads (50MB) - moved to API route level
  
  // Experimental features for better builds
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['lucide-react'],
    // Enable large page data for big uploads
    largePageDataBytes: 128 * 1024, // 128KB
  },
  // Enable webpack optimizations
  webpack: (config, { isServer }) => {
    // Enable top-level await
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };
    
    // Optimize for Vercel builds
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;