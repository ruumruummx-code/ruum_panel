import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/viajes", destination: "/traslados", permanent: false },
      { source: "/viajes/:id", destination: "/traslados/:id", permanent: false },
    ];
  },
};

export default nextConfig;
