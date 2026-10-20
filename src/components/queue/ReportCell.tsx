"use client";

import { ShieldWarning } from "@phosphor-icons/react";
import Link from "next/link";
import { useI18n } from "@/i18n";
import { categoryLabel } from "@/i18n/messages";
import { fmt, formatDateTime } from "@/lib/format";
import type { Report } from "@/lib/types";
import { blockedForVolunteers } from "@/lib/volunteer";
import { DemoChip } from "../ui/Chips";

/** Report cell of a queue row: category and number, size and date, one line of description. No author, no phone, no priority number. */
export function ReportCell({ report }: { report: Report }) {
  const { locale, m } = useI18n();
  const category = categoryLabel(report.category, locale);
  const number = fmt(m.card.reportNo, { id: report.id });
  return (
    <div className="kg-reportcell">
      <p className="kg-reportcell__title">
        <Link href={`/r/${report.id}`} className="kg-link" aria-label={`${category}, ${number}`}>
          {category}
        </Link>
        <span className="kg-mono-data kg-muted">{number}</span>
      </p>
      <p className="kg-reportcell__meta kg-caption kg-muted">
        <span>{m.size[report.size]}</span>
        <time className="kg-mono" dateTime={report.created_at}>
          {formatDateTime(report.created_at)}
        </time>
        {report.is_demo ? <DemoChip /> : null}
      </p>
      <p className="kg-body-small kg-reportcell__desc" title={report.description}>
        {report.description}
      </p>
      {blockedForVolunteers(report) ? (
        <span className="kg-note kg-body-small">
          <ShieldWarning className="kg-icon" weight="light" aria-hidden="true" />
          {m.card.notForVolunteers}
        </span>
      ) : null}
    </div>
  );
}
