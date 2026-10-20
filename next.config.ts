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

/**
 * GitHub Pages build (NEXT_PUBLIC_DATA_MODE=browser, FE-P04): a static export whose data comes from the in-browser demo API.
 * NEXT_PUBLIC_BASE_PATH is the sub-path of the site (`/CleanKg` for https://hvanox.github.io/CleanKg). `trailingSlash` writes
 * `/map/index.html`, which every static host (Pages included) serves for `/map/`. Without the variable the default build is unchanged.
 */
const browserMode = process.env.NEXT_PUBLIC_DATA_MODE === "browser";
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");
const staticSite: NextConfig = browserMode
  ? {
      output: "export",
      trailingSlash: true,
      images: { unoptimized: true },
      ...(basePath ? { basePath, assetPrefix: basePath } : {}),
    }
  : {};

// Plain client-rendered demo: Cache Components and partial prefetching from the template are not needed.
const nextConfig: NextConfig = {
  ...staticSite,
  allowedDevOrigins: ["127.0.0.1", ...lanAddresses],
  // The dev overlay button would sit on top of the map in screenshots and demos.
  devIndicators: false,
  // Pin the project root so a package-lock.json higher up the tree is not picked up.
  turbopack: { root: path.dirname(fileURLToPath(import.meta.url)) },
};

export default nextConfig;
