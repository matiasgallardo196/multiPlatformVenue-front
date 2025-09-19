/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

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
  // Usa un directorio distinto solo en desarrollo; en producción Vercel espera ".next"
  distDir: isProd ? ".next" : ".next-dev",
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
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    // En producción, si NEXT_PUBLIC_API_URL apunta a un dominio externo, proxyear a ese dominio
    if (apiBase && !apiBase.startsWith("/")) {
      return [
        {
          source: "/api/:path*",
          destination: `${apiBase}/:path*`,
        },
      ];
    }
    // En desarrollo, usa el backend local por defecto
    if (!isProd) {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:3001/:path*",
        },
      ];
    }
    // Sin rewrites en producción si no hay API externa definida
    return [];
  },
};

export default nextConfig;
