// Queue rules of S4 (organisation) and S5 (moderation). Pure functions, no UI.
import type { StatusChangeBody } from "./api";
import type { ActorKind, Report, Status } from "./types";

interface Transition {
  from: Status;
  to: Status;
  actors: readonly ActorKind[];
}

/**
 * Mirror of the transition table in prototipe/api/README.md ("Lifecycle", home: Docs/02-product/lifecycle.md).
 * What an actor may do is derived from this table; nothing is added here.
 */
export const TRANSITION_TABLE: readonly Transition[] = [
  { from: "submitted", to: "under_review", actors: ["system"] },
  { from: "under_review", to: "in_progress", actors: ["volunteer", "operator"] },
  { from: "under_review", to: "rejected", actors: ["moderator"] },
  { from: "in_progress", to: "under_review", actors: ["system"] },
  { from: "in_progress", to: "resolved", actors: ["volunteer", "operator"] },
  { from: "resolved", to: "confirmed", actors: ["system", "resident"] },
  { from: "resolved", to: "disputed", actors: ["resident"] },
  { from: "disputed", to: "in_progress", actors: ["system"] },
  { from: "confirmed", to: "in_progress", actors: ["system"] },
];

/** The fixed reject-reason list of AD-2. `other` is not offered: it needs free text and free text is out of the demo. */
export const REJECT_REASONS = ["duplicate", "not_waste", "private_property", "spam"] as const;
export type RejectReason = (typeof REJECT_REASONS)[number];

export function isRejectReason(value: string): value is RejectReason {
  return (REJECT_REASONS as readonly string[]).includes(value);
}

/** Body of a rejection: the reason code only, never a comment. Throws for anything outside the fixed list. */
export function rejectBody(reason: RejectReason): StatusChangeBody {
  if (!isRejectReason(reason)) throw new Error(`reject reason outside the fixed list: ${String(reason)}`);
  return { to_status: "rejected", actor_kind: "moderator", reason };
}

/** The API writes a rejection into the timeline as `reason: <code>`; returns the code if it is on the fixed list. */
export function rejectionReasonOf(comment: string | null): RejectReason | null {
  const code = /^reason: (\w+)/.exec(comment ?? "")?.[1];
  return code && isRejectReason(code) ? code : null;
}

/**
 * Priority order, then age (older first), then id. The priority number is used to order rows only and is never
 * rendered: the API has one demo number and none of the four factors (docs/04-tasks/prototype.md, Notes).
 */
export function sortQueue<T extends Pick<Report, "id" | "priority" | "created_at">>(items: readonly T[]): T[] {
  return [...items].sort(
    (a, b) =>
      b.priority - a.priority || Date.parse(a.created_at) - Date.parse(b.created_at) || a.id - b.id,
  );
}

export type Assignee = "none" | "volunteer" | "operator";

/**
 * Who holds the active claim, from the report detail: a claim must exist, and the in_progress event says by whom it was
 * taken. Only the kind is kept; no name and no id leave this function (HR-7).
 */
export function assigneeOf(report: Pick<Report, "active_claim" | "timeline">): Assignee {
  if (!report.active_claim) return "none";
  const taken = [...report.timeline].reverse().find((event) => event.to_status === "in_progress");
  if (taken?.actor_kind === "operator") return "operator";
  if (taken?.actor_kind === "volunteer") return "volunteer";
  return "none";
}

export type OperatorAction = "claim" | "resolve";

/**
 * What the operator may do with a row. `claim` is under_review -> in_progress (the API does it through POST /claim).
 * `resolve` is in_progress -> resolved and needs the operator to hold the claim, so it is offered only then.
 */
export function operatorActions(status: Status, assignee: Assignee): OperatorAction[] {
  const actions: OperatorAction[] = [];
  for (const step of TRANSITION_TABLE) {
    if (step.from !== status || !step.actors.includes("operator")) continue;
    if (step.to === "in_progress") actions.push("claim");
    if (step.to === "resolved" && assignee === "operator") actions.push("resolve");
  }
  return actions;
}

export type ModeratorAction = "approve" | "reject";

/**
 * Actor kind sent for «approve» (submitted -> under_review). The matrix lets only `system` do that step and the
 * prototype has no AI worker, so the moderator persona performs it as the stand-in system step. The screen says so.
 * One place to change if the API ever lets a moderator approve.
 */
export const APPROVE_ACTOR_KIND: ActorKind = "system";

export function moderatorActions(status: Status): ModeratorAction[] {
  const actions: ModeratorAction[] = [];
  for (const step of TRANSITION_TABLE) {
    if (step.from !== status) continue;
    if (step.to === "under_review" && status === "submitted" && step.actors.includes(APPROVE_ACTOR_KIND)) {
      actions.push("approve");
    }
    if (step.to === "rejected" && step.actors.includes("moderator")) actions.push("reject");
  }
  return actions;
}

/** Statuses the moderation queue shows: a report waiting for review or under review. */
export const MODERATION_STATUSES: readonly Status[] = ["submitted", "under_review"];
