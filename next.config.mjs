/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Server Actions se usan para la escritura transaccional (ventas, caja).
    serverActions: {
      bodySizeLimit: "4mb", // firmas de consentimiento e imágenes de soporte
    },
  },
};

export default nextConfig;
