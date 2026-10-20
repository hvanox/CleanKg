import type { Report } from "./types";

/** Author line: «Житель» for anonymous reports (HR-7). Never an id, phone or email. */
export function authorLabel(report: Pick<Report, "anonymous" | "author">, anonymousLabel: string): string {
  return report.anonymous ? anonymousLabel : report.author;
}
