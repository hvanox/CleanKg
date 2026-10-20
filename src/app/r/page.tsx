import { Suspense } from "react";
import { ReportRoute } from "@/components/ReportRoute";
import { Skeleton } from "@/components/ui/States";

/** S3 report card. The id comes from the query string (`/r?id=1`), see ReportRoute. */
export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="kg-page kg-page--narrow">
          <Skeleton />
        </div>
      }
    >
      <ReportRoute />
    </Suspense>
  );
}
