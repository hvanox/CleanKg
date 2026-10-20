// Port of prototipe/api/app/priority.py. NOT the production priority model (requirement A-4): a deterministic 0-100 demo
// value from category and size plus a small bonus per confirmation; responses mark it `priority_source: "demo_heuristic"`.
import type { CategoryRow, DemoState, ReportRow } from "./types";

const CATEGORY_BASE: Record<string, number> = {
  hazardous_waste: 92,
  trash_burning: 84,
  illegal_dump: 60,
  overflowing_container: 56,
  missed_collection: 50,
  construction_debris: 46,
  littered_area: 40,
};
const SIZE_BONUS: Record<string, number> = { small: 0, medium: 5, large: 10, massive: 15 };

// Demo only: each confirmation adds 2 points, capped at +20.
const CONFIRMATION_BONUS = 2;
const CONFIRMATION_BONUS_CAP = 20;

export function demoPriority(category: CategoryRow, size: string, confirmations = 0): number {
  const base = CATEGORY_BASE[category.code] ?? 40;
  const bonus = Math.min(CONFIRMATION_BONUS_CAP, CONFIRMATION_BONUS * confirmations);
  return Math.max(0, Math.min(100, base + (SIZE_BONUS[size] ?? 0) + bonus));
}

/** Recomputes the demo priority from the stored confirmations (all kinds, as the server counts them). */
export function refreshPriority(state: DemoState, report: ReportRow): void {
  const confirmations = state.confirmations.filter((row) => row.report_id === report.id).length;
  const category = state.categories.find((row) => row.code === report.category_code) as CategoryRow;
  report.priority = demoPriority(category, report.size, confirmations);
}
