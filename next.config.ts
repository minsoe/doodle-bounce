import type {NextConfig} from 'next';
import {PHASE_DEVELOPMENT_SERVER} from 'next/constants';

const nextConfig = (phase: string): NextConfig => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;
  const isExport = process.env.STATIC_EXPORT === 'true' || process.env.GITHUB_ACTIONS === 'true';

  let basePath: string | undefined = undefined;
  if (isExport) {
    if (process.env.NEXT_PUBLIC_BASE_PATH) {
      basePath = process.env.NEXT_PUBLIC_BASE_PATH;
    } else if (process.env.GITHUB_REPOSITORY) {
      const repoName = process.env.GITHUB_REPOSITORY.split('/')[1];
      if (repoName && !repoName.endsWith('.github.io')) {
        basePath = `/${repoName}`;
      }
    }
  }

  return {
    output: isExport ? 'export' : 'standalone',
    basePath,
    trailingSlash: isExport ? true : undefined,
    distDir: isDev ? '.next-dev' : '.next',
    reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    unoptimized: isExport,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
  };
};

export default nextConfig;
