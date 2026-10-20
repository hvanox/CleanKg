"use client";

import { useState } from "react";
import { useI18n } from "@/i18n";
import { recordsWord } from "@/i18n/messages";
import { fmt } from "@/lib/format";
import { MODERATOR_ACTOR } from "@/lib/personas";
import {
  APPROVE_ACTOR_KIND,
  MODERATION_STATUSES,
  moderatorActions,
  rejectBody,
  type ModeratorAction,
  type RejectReason,
} from "@/lib/queue";
import { useQueueReports, useStatusChange } from "@/lib/queries";
import type { Report } from "@/lib/types";
import { NoticeView, type Notice } from "./queue/Notice";
import { OpsRail } from "./queue/OpsRail";
import { ReportCell } from "./queue/ReportCell";
import { RejectDialog } from "./RejectDialog";
import { Button } from "./ui/Button";
import { DemoChip, StatusChip } from "./ui/Chips";
import { EmptyState, ErrorState, Skeleton } from "./ui/States";

/**
 * S5 moderation queue (demo moderator account).
 * Known gaps, on purpose: no merge (no API; a read-only note says so), no priority score, no delete, no "approve all",
 * no free-text reject reason, no organisation action of any kind.
 */
export function ModQueue() {
  const { locale, m } = useI18n();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<Report | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const queue = useQueueReports(MODERATION_STATUSES);
  const change = useStatusChange();

  async function approve(report: Report) {
    setBusyId(report.id);
    setNotice(null);
    try {
      await change.mutateAsync({
        id: report.id,
        body: { to_status: "under_review", actor_kind: APPROVE_ACTOR_KIND },
        actorId: MODERATOR_ACTOR.actorId,
      });
      setNotice({
        kind: "ok",
        text: fmt(m.mod.done.approve, {
          id: report.id,
          status: m.status.under_review,
        }),
      });
    } catch (error) {
      setNotice({ kind: "error", error });
    } finally {
      setBusyId(null);
    }
  }

  async function reject(report: Report, reason: RejectReason) {
    try {
      await change.mutateAsync({
        id: report.id,
        body: rejectBody(reason),
        actorId: MODERATOR_ACTOR.actorId,
      });
      setRejecting(null);
      setNotice({
        kind: "ok",
        text: fmt(m.mod.done.reject, {
          id: report.id,
          reason: m.mod.reasons[reason],
        }),
      });
    } catch {
      /* the dialog stays open and shows `change.error` */
    }
  }

  const label: Record<ModeratorAction, string> = {
    approve: m.mod.actionApprove,
    reject: m.mod.actionReject,
  };
  const count = queue.reports.length;

  return (
    <div className="kg-ops">
      <OpsRail persona={m.moderatorName} />
      <div className="kg-ops__main kg-page">
        <h1 className="kg-display">{m.mod.title}</h1>
        <p className="kg-muted">{m.demo.screenLine}</p>
        <p className="kg-body-small">
          {m.queue.areaLabel}: {m.queue.areaValue} <DemoChip />
        </p>
        <p className="kg-mono-data kg-muted kg-data-line">
          {!queue.isPending && !queue.error
            ? fmt(m.demo.dataLine, {
                count,
                records: recordsWord(locale, count),
              })
            : null}
        </p>

        <NoticeView notice={notice} />

        {queue.isPending ? (
          <Skeleton label={m.queue.loading} />
        ) : queue.error ? (
          <ErrorState error={queue.error} onRetry={queue.refetch} />
        ) : count === 0 ? (
          <EmptyState>{m.mod.empty}</EmptyState>
        ) : (
          <>
            <p className="kg-help" id="queue-sort-note">
              {m.queue.sortNote}
            </p>
            <table className="kg-table" aria-describedby="queue-sort-note">
              <caption className="kg-sr-only">{m.mod.title}</caption>
              <thead>
                <tr>
                  <th scope="col">{m.queue.colPosition}</th>
                  <th scope="col">{m.queue.colReport}</th>
                  <th scope="col">{m.queue.colStatus}</th>
                  <th scope="col">{m.queue.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {queue.reports.map((report, index) => (
                  <tr key={report.id} data-report-id={report.id}>
                    <td
                      className="kg-mono-data"
                      data-label={m.queue.colPosition}
                    >
                      {index + 1}
                    </td>
                    <td data-label={m.queue.colReport}>
                      <ReportCell report={report} />
                    </td>
                    <td data-label={m.queue.colStatus}>
                      <StatusChip status={report.status} />
                    </td>
                    <td data-label={m.queue.colActions}>
                      <div className="kg-row-actions">
                        {moderatorActions(report.status).map((action) => (
                          <Button
                            key={action}
                            disabled={busyId !== null}
                            aria-label={fmt(m.queue.actionFor, {
                              action: label[action],
                              report: fmt(m.card.reportNo, { id: report.id }),
                            })}
                            onClick={() => {
                              if (action === "reject") {
                                change.reset();
                                setNotice(null);
                                setRejecting(report);
                              } else {
                                void approve(report);
                              }
                            }}
                          >
                            {busyId === report.id
                              ? m.queue.busy
                              : label[action]}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <p className="kg-help">{m.mod.approveNote}</p>
        <p className="kg-help">{m.mod.mergeNote}</p>
      </div>

      {rejecting ? (
        <RejectDialog
          reportId={rejecting.id}
          pending={change.isPending}
          error={change.error}
          onCancel={() => setRejecting(null)}
          onConfirm={(reason) => void reject(rejecting, reason)}
        />
      ) : null}
    </div>
  );
}
