import { basePath } from "./config";

/**
 * Raw files from `public/` (img/picture src and srcSet, `next/image` src) do not get the `basePath` from Next.
 * Every such path goes through this helper: `publicPath("/landing/before.webp")`. Links use `<Link>`, which prefixes by itself.
 */
export function publicPath(path: string): string {
  return `${basePath()}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Report card route. A static export cannot pre-render reports created in the browser, so the id is a query parameter. */
export function reportHref(id: number | string): string {
  return `/r?id=${encodeURIComponent(String(id))}`;
}

/** Path without the trailing slash that `trailingSlash: true` (static export) adds, so route checks work in both builds. */
export function normalizePath(pathname: string | null | undefined): string {
  const path = pathname ?? "";
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}
