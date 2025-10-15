import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 啟用 Turbopack
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  // Webpack 配置（僅在非 Turbopack 模式下使用）
  webpack: (config, { isServer, dev }) => {
    // 如果使用 Turbopack，跳過 Webpack 配置
    if (dev && process.env.TURBOPACK) {
      return config;
    }
    
    // 解決 Web3 相關模組解析警告
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
      // 添加瀏覽器 API 的 fallback
      'indexeddb': false,
      'idb': false,
    };
    
    // 忽略這些模組的警告
    config.ignoreWarnings = [
      /Module not found: Can't resolve '@react-native-async-storage\/async-storage'/,
      /Module not found: Can't resolve 'pino-pretty'/,
      /indexedDB is not defined/,
    ];
    
    return config;
  },
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
};

export default nextConfig;