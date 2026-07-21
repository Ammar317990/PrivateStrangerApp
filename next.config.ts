import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next's dev server blocks cross-origin requests to its internal assets/HMR
  // by default. Allow access from other devices on the local network (e.g.
  // testing on your phone or a friend's laptop via your LAN IP).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.16.*.*"],
};

export default nextConfig;
