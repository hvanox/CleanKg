// Build-time settings. Numbers that are product thresholds are linked to their home file, not redefined.

/**
 * API base URL. Set NEXT_PUBLIC_API_BASE_URL to change it. Without it, the browser calls the mock API on port 8000
 * of the host the page was opened from (localhost, 127.0.0.1 or the LAN address a phone uses); the server side,
 * which never calls the API, falls back to 127.0.0.1.
 */
const DEFAULT_API_BASE_URL =
  typeof window === "undefined" ? "http://127.0.0.1:8000" : `${window.location.protocol}//${window.location.hostname}:8000`;

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/+$/, "");

/**
 * Demo area for the S1 map query: minLng,minLat,maxLng,maxLat.
 * Covers the Bishkek demo points (lat 42.6-43.1, lng 74.3-74.8 in prototipe/api/README.md).
 */
export const DEMO_AREA_BBOX = "74.3,42.6,74.8,43.1";

/**
 * The one fixed demo service area of S4 and S5 (the API has no service-area concept, see prototipe/web/README.md).
 * Same box as the S1 map. Queues are always requested with this bbox; no screen offers another area or a filter outside it.
 * Labelled «демо» wherever it is shown.
 */
export const DEMO_SERVICE_AREA = { bbox: DEMO_AREA_BBOX } as const;

/** Description limit. Home: Docs/02-product/requirements.md#parameters-in-one-place (the API enforces it too). */
export const DESCRIPTION_MAX = 1000;

/** Map start view (Bishkek centre, the point used in the API README examples). */
export const MAP_START = { lat: 42.8746, lng: 74.5698, zoom: 12 } as const;

/** Pan limits of the map frame: Kyrgyzstan plus a margin. A view limit only; the API validates the point. */
export const MAP_VIEW_BOUNDS: [[number, number], [number, number]] = [
  [38.5, 68.5],
  [44.2, 81.2],
];

export const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

/** Time zone used to print dates in both locales (one format, brief section 4 item 6). */
export const DISPLAY_TIME_ZONE = "Asia/Bishkek";

/**
 * The API requires a description of at least one character, the brief says it is optional.
 * When the field is empty this demo text is sent. It is sent in ru for both locales: it is data, not UI.
 */
export const EMPTY_DESCRIPTION = "демо: без описания";

export const MAP_MIN_ZOOM = 6;
export const MAP_MAX_ZOOM = 19;
export const OSM_COPYRIGHT_URL = "https://www.openstreetmap.org/copyright";

/**
 * Data mode. Unset (default): every call goes to the FastAPI in prototipe/api over fetch.
 * `NEXT_PUBLIC_DATA_MODE=browser` (the GitHub Pages build): every call is answered by the in-browser demo API in
 * src/lib/demo-api/, with the state in localStorage. Read at build time; a function so tests can switch it.
 */
export function isBrowserMode(): boolean {
  return process.env.NEXT_PUBLIC_DATA_MODE === "browser";
}

/** Sub-path of the static site (`/CleanKg` on GitHub Pages). Only the browser-mode build uses it, as next.config.ts does. */
export function basePath(): string {
  if (!isBrowserMode()) return "";
  return (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");
}
