/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@beritakarya/config',
    '@beritakarya/types',
    '@beritakarya/utils',
    'react-image-crop'
  ],
  images: {
    // Keep remote image rendering stable across environments.
    unoptimized: true
  }
}

export default nextConfig
