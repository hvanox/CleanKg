import { networkInterfaces } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

/**
 * Next 16 serves dev resources (the HMR socket, dev chunks) only to `localhost`. Opened from 127.0.0.1 or from the
 * machine's LAN address (a phone on the same Wi-Fi), the page would never hydrate and every query would stay on
 * its loading state. Allow those hosts explicitly. The wildcard syntax cannot express IP ranges, so the LAN
 * addresses are read from this machine when the dev server starts.
 */
const lanAddresses = Object.values(networkInterfaces())
  .flat()
  .filter((entry) => entry !== undefined && entry.family === "IPv4" && !entry.internal)
  .map((entry) => entry!.address);

// Plain client-rendered demo: Cache Components and partial prefetching from the template are not needed.
const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", ...lanAddresses],
  // The dev overlay button would sit on top of the map in screenshots and demos.
  devIndicators: false,
  // Pin the project root so a package-lock.json higher up the tree is not picked up.
  turbopack: { root: path.dirname(fileURLToPath(import.meta.url)) },
};

export default nextConfig;
