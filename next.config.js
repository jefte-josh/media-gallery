/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/media-gallery' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/media-gallery/' : '',
}

module.exports = nextConfig 