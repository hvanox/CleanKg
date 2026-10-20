import { DISPLAY_TIME_ZONE } from "./config";

/** `20.10.2026, 14:05` in both locales (brief section 4, item 6). */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: DISPLAY_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("day")}.${pick("month")}.${pick("year")}, ${pick("hour")}:${pick("minute")}`;
}

/** `42.8746, 74.5698` (four decimals, lat first). */
export function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

/** Parses a coordinate typed by a person. Accepts a decimal comma. Returns null if not a finite number in range. */
export function parseCoordinate(raw: string, limit: 90 | 180): number | null {
  const text = raw.trim().replace(",", ".");
  if (!/^[+-]?\d+(\.\d+)?$/.test(text)) return null;
  const value = Number(text);
  if (!Number.isFinite(value) || Math.abs(value) > limit) return null;
  return value;
}

/** Fills `{name}` placeholders of a string-table entry. */
export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in values ? String(values[key]) : whole,
  );
}
