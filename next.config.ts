import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Prevent webpack from bundling these server-only Node.js packages
  // into the browser bundle. They use native Node modules (net, tls, dns)
  // which don't exist in the browser.
  serverExternalPackages: [
    'firebase-admin',
    '@google-cloud/firestore',
    '@google-cloud/storage',
    'google-auth-library',
    'google-gax',
    'gaxios',
    'https-proxy-agent',
    'agent-base',
    '@langchain/openai',
    '@langchain/langgraph',
    '@langchain/core',
    '@pinecone-database/pinecone',
    'node-fetch',
    'cheerio',
  ],

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
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      }
    ],
  },
};


export default nextConfig;
