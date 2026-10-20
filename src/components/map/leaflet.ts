import type * as Leaflet from "leaflet";

export type LeafletModule = typeof Leaflet;

/** Leaflet touches `window`, so it is imported in the browser only, from an effect. */
export async function loadLeaflet(options: { cluster?: boolean } = {}): Promise<LeafletModule> {
  const mod = await import("leaflet");
  if (options.cluster) await import("leaflet.markercluster");
  return ((mod as { default?: LeafletModule }).default ?? mod) as LeafletModule;
}

/** Reads a pixel token from the CSS variable block (Leaflet options need numbers; the values stay in tokens.css). */
export function tokenPx(name: string): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
  const value = parseFloat(raw);
  return Number.isFinite(value) ? value : 0;
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
