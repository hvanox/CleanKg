// Port of prototipe/api/app/lifecycle.py: the only place that changes `reports.status`. Every change writes an event row.
// The matrix is the subset of Docs/02-product/lifecycle.md#transition-matrix-for-tests that the prototype demonstrates;
// anything not listed is refused with `invalid_transition` (409). Photo and 100 m preconditions are documented, not enforced.
import type { Status } from "../types";
import { SETTINGS } from "./config";
import { volunteerEligibility } from "./eligibility";
import { claimReleased, closingByConfirmations, closingByDays } from "./messages";
import type { ActorKindName, ClaimRow, DemoState, EventRow, ReportRow } from "./types";

export const REJECTION_REASONS = ["duplicate", "not_waste", "private_property", "spam", "other"] as const;

interface Transition {
  source: Status;
  target: Status;
  actors: readonly ActorKindName[];
}

export const TRANSITIONS: readonly Transition[] = [
  { source: "submitted", target: "under_review", actors: ["system"] },
  { source: "under_review", target: "in_progress", actors: ["volunteer", "operator"] },
  { source: "under_review", target: "rejected", actors: ["moderator"] },
  { source: "in_progress", target: "under_review", actors: ["system"] },
  { source: "in_progress", target: "resolved", actors: ["volunteer", "operator"] },
  { source: "resolved", target: "confirmed", actors: ["system", "resident"] },
  { source: "resolved", target: "disputed", actors: ["resident"] },
  { source: "disputed", target: "in_progress", actors: ["system"] },
  { source: "confirmed", target: "in_progress", actors: ["system"] },
];

export function findTransition(source: string, target: string): Transition | undefined {
  return TRANSITIONS.find((row) => row.source === source && row.target === target);
}

/** A rejected status change with a machine-readable code; the router turns it into the same ApiError the server answer gives. */
export class TransitionError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly extra: Record<string, unknown>;

  constructor(statusCode: number, code: string, message: string, extra: Record<string, unknown> = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.extra = extra;
  }

  asDetail(): Record<string, unknown> {
    return { code: this.code, message: this.message, ...this.extra };
  }
}

export function allowedTargets(status: string): Status[] {
  return TRANSITIONS.filter((row) => row.source === status).map((row) => row.target);
}

function sortedActors(actors: readonly string[]): string[] {
  return [...actors].sort();
}

function activeClaim(state: DemoState, reportId: number, userId: number): ClaimRow | undefined {
  return state.claims
    .filter((row) => row.report_id === reportId && row.user_id === userId && row.state === "active")
    .sort((a, b) => b.created_at - a.created_at || b.id - a.id)[0];
}

function latestResolvedEvent(state: DemoState, reportId: number): EventRow | undefined {
  return state.events
    .filter((row) => row.report_id === reportId && row.to_status === "resolved")
    .sort((a, b) => b.created_at - a.created_at || b.id - a.id)[0];
}

export function resolvedBy(state: DemoState, reportId: number): number | null {
  return latestResolvedEvent(state, reportId)?.actor_id ?? null;
}

/** Confirmations of the resolution from residents other than the resolver. */
export function resolutionConfirmations(state: DemoState, reportId: number): number {
  const resolverId = resolvedBy(state, reportId);
  return state.confirmations.filter(
    (row) =>
      row.report_id === reportId && row.kind === "resolution" && (resolverId === null || row.user_id !== resolverId),
  ).length;
}

export interface ClosingRuleState {
  required_confirmations: number;
  received_confirmations: number;
  days_without_dispute: number;
  days_elapsed: number;
  met: boolean;
}

export function closingRuleState(state: DemoState, reportId: number): ClosingRuleState {
  const received = resolutionConfirmations(state, reportId);
  const now = Date.now();
  const resolvedAt = latestResolvedEvent(state, reportId)?.created_at ?? now;
  const elapsedDays = Math.max(0, (now - resolvedAt) / 86_400_000);
  const met =
    received >= SETTINGS.closingConfirmations || elapsedDays >= SETTINGS.closingDaysWithoutDispute;
  return {
    required_confirmations: SETTINGS.closingConfirmations,
    received_confirmations: received,
    days_without_dispute: SETTINGS.closingDaysWithoutDispute,
    days_elapsed: Math.round(elapsedDays * 100) / 100,
    met,
  };
}

export function nextId(rows: readonly { id: number }[]): number {
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}

export function recordEvent(
  state: DemoState,
  report: ReportRow,
  event: {
    actorId: number | null;
    actorKind: ActorKindName;
    fromStatus: Status | null;
    toStatus: Status;
    comment: string | null;
    createdAt?: number;
  },
): EventRow {
  const row: EventRow = {
    id: nextId(state.events),
    report_id: report.id,
    actor_id: event.actorId,
    actor_kind: event.actorKind,
    from_status: event.fromStatus,
    to_status: event.toStatus,
    comment: event.comment,
    created_at: event.createdAt ?? Date.now(),
  };
  state.events.push(row);
  return row;
}

export interface ApplyTransitionOptions {
  toStatus: Status;
  actorId: number | null;
  /** What the matrix checks. */
  actorKind: ActorKindName;
  reason?: string | null;
  comment?: string | null;
  at?: number;
  /** What the timeline shows. Differs from `actorKind` only when a moderator account stands in for the system. */
  recordedActorKind?: ActorKindName;
}

/** Validates and applies one status change. Throws {@link TransitionError}; the caller discards the draft on error. */
export function applyTransition(state: DemoState, report: ReportRow, options: ApplyTransitionOptions): EventRow {
  const { toStatus, actorId, actorKind, reason, comment } = options;
  const source = report.status;
  const transition = findTransition(source, toStatus);
  if (!transition) {
    throw new TransitionError(
      409,
      "invalid_transition",
      `Переход «${source}» → «${toStatus}» не разрешён матрицей жизненного цикла.`,
      { from_status: source, to_status: toStatus, allowed: allowedTargets(source) },
    );
  }

  if (!transition.actors.includes(actorKind)) {
    throw new TransitionError(
      403,
      "actor_not_allowed",
      `Переход «${source}» → «${toStatus}» выполняет: ${sortedActors(transition.actors).join(", ")}.`,
      { from_status: source, to_status: toStatus, allowed_actors: sortedActors(transition.actors) },
    );
  }

  let eventComment: string | null = comment ?? null;
  const now = options.at ?? Date.now();

  if (toStatus === "rejected") {
    if (!reason) {
      throw new TransitionError(409, "rejection_reason_required", "Отклонение требует причины из фиксированного списка.", {
        allowed_reasons: [...REJECTION_REASONS],
      });
    }
    if (!(REJECTION_REASONS as readonly string[]).includes(reason)) {
      throw new TransitionError(
        409,
        "invalid_rejection_reason",
        "Причина отклонения должна быть из фиксированного списка.",
        { allowed_reasons: [...REJECTION_REASONS] },
      );
    }
    if (reason === "other" && !(comment ?? "").trim()) {
      throw new TransitionError(409, "rejection_comment_required", "Причина «other» требует текстового пояснения.", {
        allowed_reasons: [...REJECTION_REASONS],
      });
    }
    eventComment = `reason: ${reason}` + (comment ? `; ${comment}` : "");
  } else if (toStatus === "in_progress" && source === "under_review") {
    if (actorKind === "volunteer") {
      const category = state.categories.find((row) => row.code === report.category_code)!;
      const [eligible, why] = volunteerEligibility(category, report.size);
      if (!eligible) {
        throw new TransitionError(403, "volunteer_not_eligible", "Задача недоступна волонтёрам.", { reason: why });
      }
    }
    const claim = actorId !== null ? activeClaim(state, report.id, actorId) : undefined;
    if (!claim) {
      throw new TransitionError(
        409,
        "claim_required",
        "Взять задачу в работу можно только через заявку (POST /claim).",
        { from_status: source, to_status: toStatus },
      );
    }
  } else if (toStatus === "resolved") {
    const claim = actorId !== null ? activeClaim(state, report.id, actorId) : undefined;
    if (!claim) {
      throw new TransitionError(409, "claim_required", "Закрыть задачу может только держатель активной заявки.", {
        from_status: source,
        to_status: toStatus,
      });
    }
    claim.state = "completed";
  } else if (toStatus === "confirmed") {
    const { met, ...rest } = closingRuleState(state, report.id);
    if (!met) {
      throw new TransitionError(
        409,
        "closing_rule_not_met",
        "Закрытие требует 2 подтверждений жителей или 7 дней без спора.",
        { ...rest },
      );
    }
    eventComment =
      rest.received_confirmations >= SETTINGS.closingConfirmations ? closingByConfirmations() : closingByDays();
  } else if (toStatus === "disputed") {
    if (!(comment ?? "").trim()) {
      throw new TransitionError(
        409,
        "dispute_comment_required",
        "Спор требует комментария и нового фото (в прототипе — комментария).",
        { from_status: source, to_status: toStatus },
      );
    }
    eventComment = comment ?? null;
  } else if (toStatus === "under_review" && source === "in_progress") {
    for (const claim of state.claims) {
      if (claim.report_id === report.id && claim.state === "active") claim.state = "expired";
    }
    eventComment = comment || claimReleased();
  }

  report.status = toStatus;
  report.updated_at = now;

  return recordEvent(state, report, {
    actorId,
    actorKind: options.recordedActorKind ?? actorKind,
    fromStatus: source,
    toStatus,
    comment: eventComment,
    createdAt: now,
  });
}
