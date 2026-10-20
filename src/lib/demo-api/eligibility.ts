// Port of prototipe/api/app/eligibility.py: volunteer eligibility, the rule from Docs/02-product/taxonomy.md.
// HR-5: hazardous waste and burning never reach volunteers, whatever else is true.
import type { CategoryRow } from "./types";

const SIZE_ORDER: Record<string, number> = { small: 0, medium: 1, large: 2, massive: 3 };
const OPEN_STATUSES = ["submitted", "under_review"];

/** Returns `[eligible, reason_code]`. Hazard checks come first on purpose. */
export function volunteerEligibility(
  category: CategoryRow,
  size: string,
  status?: string,
): [boolean, string | null] {
  if (category.is_hazardous) return [false, "hazardous"];
  if (category.code === "trash_burning") return [false, "burning"];
  if (status !== undefined && !OPEN_STATUSES.includes(status)) return [false, "not_open"];
  if (!category.volunteer_allowed) return [false, "category_not_allowed"];
  if (
    category.max_volunteer_size !== null &&
    (SIZE_ORDER[size] ?? 99) > (SIZE_ORDER[category.max_volunteer_size] ?? -1)
  ) {
    return [false, "size_too_large"];
  }
  return [true, null];
}
