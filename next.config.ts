import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*", "192.168.1.10"],
  experimental: {
    serverActions: {
      // Le dépôt vocal (5 min à 32 kbps ≈ 1,2 Mo) transite par une Server Action.
      // Vercel plafonne de toute façon les requêtes à ~4,5 Mo.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
