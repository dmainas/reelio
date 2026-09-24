import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev server binds to 0.0.0.0; browsers open it as localhost or 127.0.0.1.
  allowedDevOrigins: ["127.0.0.1", "localhost", "cursor"],
};

export default nextConfig;
