import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  // Optimize for embedded deployment
  productionBrowserSourceMaps: false,
};

export default nextConfig;
