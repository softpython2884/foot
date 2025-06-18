
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'e1.pngegg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'toppng.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'brandlogos.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'logo-marque.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'stylfoot.fr',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.goodstickers.fr',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.icon-icons.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.icons101.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tmssl.akamaized.net',
        port: '',
        pathname: '/**',
      },
      // {
      //   protocol: 'https',
      //   hostname: 'crests.football-data.org',
      //   port: '',
      //   pathname: '/**',
      // },
      {
        protocol: 'https',
        hostname: 'media.api-sports.io',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
