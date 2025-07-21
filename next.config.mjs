/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  onBuildError(err) {
    // 忽略特定的错误
    if (err.message.includes('localStorage is not defined')) {
      return;
    }
    throw err;
  },
  // 忽略特定的构建警告
  onWarning(warning) {
    if (warning.message.includes('localStorage is not defined')) {
      return;
    }
    console.warn(warning);
  }
}

export default nextConfig
