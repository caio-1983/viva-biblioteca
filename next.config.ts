import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  allowedDevOrigins: ['192.168.5.32', 'localhost', '127.0.0.1'],
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
  // Garante que o file-tracing inclua os binários nativos do better-sqlite3
  outputFileTracingIncludes: {
    '/api/**': ['./node_modules/better-sqlite3/**/*', './node_modules/node-gyp-build/**/*'],
  },
}

export default nextConfig
