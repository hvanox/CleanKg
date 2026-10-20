import type { Report } from "./types";

/**
 * True when volunteers may never take this report (HR-5): the category is closed to volunteers, hazardous or burning,
 * or the API names a size or safety reason. A category ban outranks `not_open`, which on its own only means
 * the report is not claimable right now (already in work, closed, rejected) and must not read as a volunteer ban.
 */
export function blockedForVolunteers(
  report: Pick<Report, "volunteer_eligible" | "volunteer_ineligible_reason" | "category">,
): boolean {
  const { category } = report;
  if (!category.volunteer_allowed || category.is_hazardous || category.code === "trash_burning") return true;
  return !report.volunteer_eligible && report.volunteer_ineligible_reason !== "not_open";
}
