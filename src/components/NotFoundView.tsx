"use client";

import Link from "next/link";
import { useI18n } from "@/i18n";
import { ApiError } from "@/lib/api";
import { ErrorState } from "./ui/States";

/** Unknown route: shown inside the shell, so the banner is still there. */
export function NotFoundView() {
  const { m } = useI18n();
  return (
    <div className="kg-page kg-page--narrow">
      <ErrorState error={new ApiError(404, "page_not_found", "not found")} />
      <Link href="/map" className="kg-link">
        {m.common.backToMap}
      </Link>
    </div>
  );
}
