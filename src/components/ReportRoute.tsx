"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/i18n";
import { ApiError } from "@/lib/api";
import { ReportCard } from "./ReportCard";
import { ErrorState } from "./ui/States";

/**
 * `/r?id=7`: the report id is read on the client. A static export cannot pre-render the reports a visitor creates in the
 * browser (ids 16 and up), so the card is one static page that asks the API (or the in-browser demo API) for `id`.
 */
export function ReportRoute() {
  const { m } = useI18n();
  const id = useSearchParams().get("id");
  if (!id) {
    return (
      <div className="kg-page kg-page--narrow">
        <Link href="/map" className="kg-link">
          {m.common.backToMap}
        </Link>
        <ErrorState error={new ApiError(404, "report_not_found", "report id missing")} />
      </div>
    );
  }
  return <ReportCard id={id} />;
}
