import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignore local SQLite database writes from triggering Fast Refresh
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

export default nextConfig;
