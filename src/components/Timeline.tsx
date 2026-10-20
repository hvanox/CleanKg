"use client";

import { useI18n } from "@/i18n";
import type { Messages } from "@/i18n/ru";
import { fmt, formatDateTime } from "@/lib/format";
import { rejectionReasonOf } from "@/lib/queue";
import type { TimelineEvent } from "@/lib/types";
import { DemoChip } from "./ui/Chips";
import { STATUS_ICONS } from "./ui/status";

/** A rejection is stored as `reason: <code>`; print the label of the fixed list instead of the code. */
function commentText(comment: string, m: Messages): string {
  const reason = rejectionReasonOf(comment);
  return reason ? `${m.mod.dialog.reasonLegend}: ${m.mod.reasons[reason]}` : comment;
}

/** Status timeline. The status is printed in words with its date: «Отправлено · 20.10.2026, 14:05» (brief section 2.2). */
export function Timeline({ events, demo }: { events: TimelineEvent[]; demo: boolean }) {
  const { m } = useI18n();
  const lastIndex = events.length - 1;
  return (
    <ol className="kg-timeline">
      {events.map((event, index) => {
        const EventIcon = STATUS_ICONS[event.to_status];
        const current = index === lastIndex;
        return (
          <li
            key={`${event.created_at}-${index}`}
            className="kg-timeline__item"
            data-status={event.to_status}
            aria-current={current ? "step" : undefined}
          >
            <EventIcon className="kg-icon kg-timeline__icon" weight="light" aria-hidden="true" />
            <div>
              <p className="kg-timeline__line">
                <span className={current ? "kg-strong" : undefined}>{m.status[event.to_status]}</span>
                {" · "}
                <time className="kg-mono" dateTime={event.created_at}>
                  {formatDateTime(event.created_at)}
                </time>{" "}
                {demo ? <DemoChip /> : null}
              </p>
              <p className="kg-caption kg-muted">{fmt(m.card.timelineBy, { actor: event.actor })}</p>
              {event.comment ? (
                <p className="kg-body-small">{commentText(event.comment, m)}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
