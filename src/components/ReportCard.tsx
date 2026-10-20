"use client";

import { blockedForVolunteers } from "@/lib/volunteer";
import { ShieldWarning } from "@phosphor-icons/react";
import Link from "next/link";
import { useI18n } from "@/i18n";
import { categoryLabel } from "@/i18n/messages";
import { authorLabel } from "@/lib/author";
import { fmt, formatCoords, formatDateTime } from "@/lib/format";
import { useReport } from "@/lib/queries";
import { Timeline } from "./Timeline";
import { CategoryChip, DemoChip, StatusChip } from "./ui/Chips";
import { PhotoTile } from "./ui/PhotoTile";
import { ErrorState, Skeleton } from "./ui/States";

/**
 * S3 report card.
 * Known gaps, on purpose (docs/04-tasks/prototype.md, Notes): no priority score (the API has one number and no
 * four factors), no subscribe button (no API), no volunteer action of any kind (HR-5), no comment field.
 */
export function ReportCard({ id }: { id: string }) {
  const { locale, m } = useI18n();
  const query = useReport(id);

  const back = (
    <Link href="/map" className="kg-link">
      {m.common.backToMap}
    </Link>
  );

  if (query.isPending) {
    return (
      <div className="kg-page kg-page--narrow">
        {back}
        <Skeleton label={m.card.loading} />
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="kg-page kg-page--narrow">
        {back}
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </div>
    );
  }

  const report = query.data;
  const demo = report.is_demo;
  const comments = report.comments.filter((comment) => comment.state === "published");
  const counts = [
    { key: "comments", label: m.card.commentsCount, value: report.counts.comments },
    { key: "confirmations", label: m.card.confirmationsCount, value: report.counts.confirmations },
    {
      key: "resolution",
      label: m.card.resolutionCount,
      value: report.counts.resolution_confirmations,
    },
  ];

  return (
    <article className="kg-page kg-page--narrow">
      {back}
      <header className="kg-card-head">
        <p className="kg-mono-data kg-muted">{fmt(m.card.reportNo, { id: report.id })}</p>
        <h1 className="kg-h1">{categoryLabel(report.category, locale)}</h1>
        <StatusChip status={report.status} />
      </header>

      <PhotoTile caption={m.card.photoNote} />

      <section aria-labelledby="card-details" className="kg-section">
        <h2 className="kg-h2" id="card-details">
          {m.card.details}
        </h2>
        <dl className="kg-dl kg-dl--wide">
          <dt>{m.card.category}</dt>
          <dd>
            <CategoryChip label={categoryLabel(report.category, locale)} />
          </dd>
          <dt>{m.card.size}</dt>
          <dd>{m.size[report.size]}</dd>
          <dt>{m.card.location}</dt>
          <dd className="kg-mono">{formatCoords(report.location.lat, report.location.lng)}</dd>
          <dt>{m.card.created}</dt>
          <dd>
            <time className="kg-mono" dateTime={report.created_at}>
              {formatDateTime(report.created_at)}
            </time>{" "}
            {demo ? <DemoChip /> : null}
          </dd>
          <dt>{m.card.author}</dt>
          <dd>{authorLabel(report, m.anonymousAuthor)}</dd>
          <dt>{m.card.description}</dt>
          <dd className="kg-prose">{report.description}</dd>
          <dt>{m.card.organisation}</dt>
          <dd>
            {m.card.organisationValue} · <DemoChip />
          </dd>
          {blockedForVolunteers(report) ? (
            <>
              <dt>{m.card.volunteers}</dt>
              <dd>
                <span className="kg-note">
                  <ShieldWarning className="kg-icon" weight="light" aria-hidden="true" />
                  {m.card.notForVolunteers}
                </span>
              </dd>
            </>
          ) : null}
        </dl>
      </section>

      <section aria-labelledby="card-timeline" className="kg-section">
        <h2 className="kg-h2" id="card-timeline">
          {m.card.timeline}
        </h2>
        <Timeline events={report.timeline} demo={demo} />
      </section>

      <section aria-labelledby="card-counts" className="kg-section">
        <h2 className="kg-h2" id="card-counts">
          {m.card.counts}
        </h2>
        <ul className="kg-counts">
          {counts.map((count) => (
            <li key={count.key} className="kg-count">
              <span className="kg-mono-figure">
                {count.value} {demo ? <DemoChip /> : null}
              </span>
              <span className="kg-body-small">{count.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="card-comments" className="kg-section">
        <h2 className="kg-h2" id="card-comments">
          {m.card.commentsTitle}
        </h2>
        {comments.length === 0 ? (
          <p className="kg-muted">{m.card.noComments}</p>
        ) : (
          <ul className="kg-comments">
            {comments.map((comment) => (
              <li key={comment.id} className="kg-comment">
                <p className="kg-caption kg-muted">
                  {comment.author} ·{" "}
                  <time className="kg-mono" dateTime={comment.created_at}>
                    {formatDateTime(comment.created_at)}
                  </time>{" "}
                  {demo ? <DemoChip /> : null}
                </p>
                <p className="kg-prose">{comment.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
