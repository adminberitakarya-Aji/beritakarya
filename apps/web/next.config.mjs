/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Keep remote image rendering stable across environments.
    unoptimized: true
  }
}

export default nextConfig
