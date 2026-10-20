"use client";

import { useState } from "react";
import { useI18n } from "@/i18n";
import { recordsWord } from "@/i18n/messages";
import { fmt } from "@/lib/format";
import { OPERATOR_ACTOR } from "@/lib/personas";
import { operatorActions, type OperatorAction } from "@/lib/queue";
import {
  useAssignees,
  useClaim,
  useOrganisations,
  useQueueReports,
  useStatusChange,
  type AssigneeState,
} from "@/lib/queries";
import {
  STATUSES,
  type ConnectionStatus,
  type Report,
  type Status,
} from "@/lib/types";
import { NoticeView, type Notice } from "./queue/Notice";
import { OpsRail } from "./queue/OpsRail";
import { ReportCell } from "./queue/ReportCell";
import { Button } from "./ui/Button";
import { DemoChip, StatusChip } from "./ui/Chips";
import { EmptyState, ErrorState, Skeleton } from "./ui/States";

/** Statuses that have no executor yet; later statuses show a dash, the API list carries no claim for them. */
const UNASSIGNED_STATUSES: readonly Status[] = ["submitted", "under_review"];

/**
 * S4 organisation queue (demo operator account).
 * Known gaps, on purpose: no priority score and no four factors (the API has one number), no plan-date field and no
 * assignment to a named person (no API), no CSV export, no bulk action, no area filter (one fixed demo area).
 */
export function OrgQueue() {
  const { locale, m } = useI18n();
  const [status, setStatus] = useState<Status | "">("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const queue = useQueueReports([status || undefined]);
  const assignees = useAssignees(queue.reports);
  const organisations = useOrganisations();
  const claim = useClaim();
  const change = useStatusChange();

  const organisation =
    organisations.data?.items.find((item) => item.type === "municipal") ??
    organisations.data?.items[0];
  const connection = organisations.isPending
    ? m.common.loading
    : ((organisation &&
        m.rail.connection[
          organisation.connection_status as ConnectionStatus
        ]) ??
      m.rail.connectionUnknown);

  const label: Record<OperatorAction, string> = {
    claim: m.org.actionClaim,
    resolve: m.org.actionResolve,
  };

  async function perform(report: Report, action: OperatorAction) {
    setBusyId(report.id);
    setNotice(null);
    const done = (key: "claim" | "resolve", to: Status) =>
      setNotice({
        kind: "ok",
        text: fmt(m.org.done[key], { id: report.id, status: m.status[to] }),
      });
    try {
      if (action === "claim") {
        await claim.mutateAsync({
          id: report.id,
          body: {
            actor_kind: OPERATOR_ACTOR.actorKind,
            organisation_id: organisation?.id,
          },
          actorId: OPERATOR_ACTOR.actorId,
        });
        done("claim", "in_progress");
      } else {
        await change.mutateAsync({
          id: report.id,
          body: { to_status: "resolved", actor_kind: OPERATOR_ACTOR.actorKind },
          actorId: OPERATOR_ACTOR.actorId,
        });
        done("resolve", "resolved");
      }
    } catch (error) {
      setNotice({ kind: "error", error });
    } finally {
      setBusyId(null);
    }
  }

  function assigneeText(
    report: Report,
    info: AssigneeState | undefined,
  ): string {
    if (report.status === "in_progress") {
      if (!info || info.state === "loading") return m.common.loading;
      if (info.state === "error") return m.queue.assignee.unknown;
      return m.queue.assignee[info.assignee];
    }
    return UNASSIGNED_STATUSES.includes(report.status)
      ? m.queue.assignee.none
      : m.queue.assignee.na;
  }

  const count = queue.reports.length;

  return (
    <div className="kg-ops">
      <OpsRail
        persona={m.operatorName}
        organisation={{ name: m.rail.organisationName, connection }}
      />
      <div className="kg-ops__main kg-page">
        <h1 className="kg-display">{m.org.title}</h1>
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

        <div className="kg-field kg-field--filter">
          <label className="kg-label" htmlFor="org-status">
            {m.map.filterStatus}
          </label>
          <select
            id="org-status"
            className="kg-select"
            value={status}
            onChange={(event) => setStatus(event.target.value as Status | "")}
          >
            <option value="">{m.map.allStatuses}</option>
            {STATUSES.map((code) => (
              <option key={code} value={code}>
                {m.status[code]}
              </option>
            ))}
          </select>
        </div>

        <NoticeView notice={notice} />

        {queue.isPending ? (
          <Skeleton label={m.queue.loading} />
        ) : queue.error ? (
          <ErrorState error={queue.error} onRetry={queue.refetch} />
        ) : count === 0 ? (
          <EmptyState>{m.org.empty}</EmptyState>
        ) : (
          <>
            <p className="kg-help" id="queue-sort-note">
              {m.queue.sortNote}
            </p>
            <table className="kg-table" aria-describedby="queue-sort-note">
              <caption className="kg-sr-only">{m.org.title}</caption>
              <thead>
                <tr>
                  <th scope="col">{m.queue.colPosition}</th>
                  <th scope="col">{m.queue.colReport}</th>
                  <th scope="col">{m.queue.colStatus}</th>
                  <th scope="col">{m.queue.colAssignee}</th>
                  <th scope="col">{m.queue.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {queue.reports.map((report, index) => {
                  const info = assignees.get(report.id);
                  const waiting =
                    report.status === "in_progress" &&
                    (!info || info.state === "loading");
                  const actions =
                    info?.state === "ready" || report.status !== "in_progress"
                      ? operatorActions(
                          report.status,
                          info?.state === "ready" ? info.assignee : "none",
                        )
                      : [];
                  return (
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
                      <td
                        className="kg-body-small"
                        data-label={m.queue.colAssignee}
                      >
                        {assigneeText(report, info)}
                      </td>
                      <td data-label={m.queue.colActions}>
                        {actions.length === 0 ? (
                          <span className="kg-body-small kg-muted">
                            {waiting ? m.common.loading : m.queue.noActions}
                          </span>
                        ) : (
                          <div className="kg-row-actions">
                            {actions.map((action) => (
                              <Button
                                key={action}
                                disabled={busyId !== null}
                                aria-label={fmt(m.queue.actionFor, {
                                  action: label[action],
                                  report: fmt(m.card.reportNo, {
                                    id: report.id,
                                  }),
                                })}
                                onClick={() => void perform(report, action)}
                              >
                                {busyId === report.id
                                  ? m.queue.busy
                                  : label[action]}
                              </Button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        <p className="kg-help">{m.org.afterPhotoNote}</p>
      </div>
    </div>
  );
}
