// Persistence of the demo state: one JSON value in localStorage per visitor, under a versioned key. Missing, corrupt or
// out-of-date state falls back to the seed. When localStorage is unavailable (private mode, blocked storage, server
// render) the state lives in memory for the page's life.
import { STORAGE_KEY, STORAGE_VERSION } from "./config";
import { buildSeedState } from "./seed";
import type { DemoState } from "./types";

let memoryState: DemoState | null = null;

function storage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rowsOf(value: unknown, check: (row: Record<string, unknown>) => boolean): boolean {
  return Array.isArray(value) && value.every((row) => isObject(row) && check(row));
}

const num = (v: unknown) => typeof v === "number" && Number.isFinite(v);
const str = (v: unknown) => typeof v === "string";
const bool = (v: unknown) => typeof v === "boolean";
const strOrNull = (v: unknown) => v === null || typeof v === "string";
const numOrNull = (v: unknown) => v === null || num(v);

/** Structural check of a parsed value. Anything that does not look like our own state is discarded for the seed. */
export function isValidState(value: unknown): value is DemoState {
  if (!isObject(value) || value.version !== STORAGE_VERSION) return false;
  return (
    rowsOf(value.users, (r) => num(r.id) && strOrNull(r.display_name) && str(r.role)) &&
    rowsOf(value.organisations, (r) => num(r.id) && str(r.name) && str(r.type) && str(r.connection_status)) &&
    rowsOf(
      value.categories,
      (r) => str(r.code) && str(r.label_ru) && bool(r.volunteer_allowed) && bool(r.is_hazardous) && strOrNull(r.max_volunteer_size),
    ) &&
    rowsOf(
      value.reports,
      (r) =>
        num(r.id) && str(r.category_code) && str(r.size) && str(r.status) && num(r.lat) && num(r.lng) &&
        str(r.description) && num(r.priority) && bool(r.anonymous) && bool(r.is_demo) && num(r.created_by) &&
        num(r.created_at) && num(r.updated_at),
    ) &&
    rowsOf(
      value.events,
      (r) => num(r.id) && num(r.report_id) && numOrNull(r.actor_id) && str(r.actor_kind) && strOrNull(r.from_status) && str(r.to_status) && strOrNull(r.comment) && num(r.created_at),
    ) &&
    rowsOf(value.comments, (r) => num(r.id) && num(r.report_id) && num(r.user_id) && str(r.text) && str(r.state) && num(r.created_at)) &&
    rowsOf(
      value.confirmations,
      (r) => num(r.id) && num(r.report_id) && num(r.user_id) && str(r.kind) && strOrNull(r.comment) && num(r.created_at),
    ) &&
    rowsOf(
      value.claims,
      (r) => num(r.id) && num(r.report_id) && num(r.user_id) && numOrNull(r.organisation_id) && str(r.state) && num(r.expires_at) && num(r.created_at),
    )
  );
}

let memoryOnly = false;

function clone(state: DemoState): DemoState {
  return JSON.parse(JSON.stringify(state)) as DemoState;
}

function persist(state: DemoState): void {
  memoryState = state;
  const store = storage();
  if (!store) {
    memoryOnly = true;
    return;
  }
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(state));
    memoryOnly = false;
  } catch {
    // Quota or blocked storage: the in-memory copy keeps the session working.
    memoryOnly = true;
  }
}

/** A fresh, private copy of the state. The caller may mutate it and hand it back to {@link saveState}, or drop it (a rejected request). */
export function loadState(): DemoState {
  if (memoryOnly && memoryState) return clone(memoryState);

  let raw: string | null = null;
  try {
    raw = storage()?.getItem(STORAGE_KEY) ?? null;
  } catch {
    raw = null;
  }
  if (raw !== null) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isValidState(parsed)) return parsed;
    } catch {
      // Corrupt JSON: fall through to the seed.
    }
  }

  const seeded = buildSeedState();
  persist(seeded);
  return clone(seeded);
}

export function saveState(state: DemoState): void {
  persist(state);
}

/** «Сбросить демо-данные»: replaces everything the visitor did with the seed. */
export function resetDemoState(): void {
  persist(buildSeedState());
}
