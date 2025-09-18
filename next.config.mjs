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
  // Usa un directorio de salida distinto para reducir colisiones
  distDir: ".next-dev",
  // Mitigar problemas de permisos/caché en entornos OneDrive/Windows
  // Desactiva cache persistente de webpack en dev y usa directorio temporal
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
      // Alternativamente, para mantener cache pero en tmp, descomenta:
      // config.cache = {
      //   type: 'filesystem',
      //   cacheDirectory: require('path').join(require('os').tmpdir(), 'nextjs-cache'),
      // }
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/:path*",
      },
    ];
  },
};

export default nextConfig;
