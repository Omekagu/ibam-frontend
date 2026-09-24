import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['api.ibamhealth.com'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**'
      }
    ]
  }
}

export default nextConfig
