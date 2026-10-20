// Port of prototipe/api/app/serializers.py: the public JSON shapes. Rules (HR-7, Docs/03-architecture/security-privacy.md):
// no phone numbers and no account ids in any response; anonymous reports show the author as «Житель»;
// comments and events show role labels, never ids. Everything is built from the current state.
import type { Report, ReportFeatureCollection } from "../types";
import { volunteerEligibility } from "./eligibility";
import type {
  CategoryRow,
  ClaimRow,
  CommentRow,
  ConfirmationRow,
  DemoState,
  ReportRow,
  UserRow,
} from "./types";

export const ANONYMOUS_LABEL = "Житель";

const ACTOR_LABELS: Record<string, string | null> = {
  system: "Система",
  moderator: "Модератор",
  volunteer: "Волонтёр",
  operator: "Организация",
  resident: null, // resolved from the account, anonymous reports stay «Житель»
};

/** `2026-10-20T08:00:00Z`: seconds precision, like the server. */
export function iso(value: number): string {
  return `${new Date(value).toISOString().slice(0, 19)}Z`;
}

function displayName(user: UserRow | undefined): string {
  if (!user || !user.display_name) return ANONYMOUS_LABEL;
  return user.display_name;
}

function authorLabel(user: UserRow | undefined, anonymous: boolean): string {
  return anonymous ? ANONYMOUS_LABEL : displayName(user);
}

function userOf(state: DemoState, id: number | null): UserRow | undefined {
  return id === null ? undefined : state.users.find((row) => row.id === id);
}

function categoryOf(state: DemoState, report: ReportRow): CategoryRow {
  return state.categories.find((row) => row.code === report.category_code) as CategoryRow;
}

export function categoryRef(category: CategoryRow) {
  return {
    code: category.code,
    label_ru: category.label_ru,
    label_ky: category.label_ky,
    is_hazardous: category.is_hazardous,
    volunteer_allowed: category.volunteer_allowed,
  };
}

export function categoryOut(category: CategoryRow) {
  return {
    ...categoryRef(category),
    max_volunteer_size: category.max_volunteer_size,
    hidden_from_volunteers: category.is_hazardous || category.code === "trash_burning",
  };
}

interface Counts {
  comments: number;
  confirmations: number;
  resolution_confirmations: number;
}

function countsOf(state: DemoState, reportId: number): Counts {
  const counts: Counts = { comments: 0, confirmations: 0, resolution_confirmations: 0 };
  for (const comment of state.comments) {
    if (comment.report_id === reportId && comment.state === "published") counts.comments += 1;
  }
  for (const confirmation of state.confirmations) {
    if (confirmation.report_id !== reportId) continue;
    if (confirmation.kind === "resolution") counts.resolution_confirmations += 1;
    else counts.confirmations += 1;
  }
  return counts;
}

export function activeClaimOf(state: DemoState, reportId: number): ClaimRow | undefined {
  return state.claims
    .filter((row) => row.report_id === reportId && row.state === "active")
    .sort((a, b) => b.created_at - a.created_at || b.id - a.id)[0];
}

export function claimOut(state: DemoState, claim: ClaimRow) {
  const organisation =
    claim.organisation_id === null ? undefined : state.organisations.find((row) => row.id === claim.organisation_id);
  return {
    state: claim.state,
    expires_at: iso(claim.expires_at),
    organisation: organisation ? organisation.name : null,
  };
}

function summary(state: DemoState, report: ReportRow, counts: Counts) {
  const category = categoryOf(state, report);
  const [eligible, reason] = volunteerEligibility(category, report.size, report.status);
  return {
    id: report.id,
    category: categoryRef(category),
    size: report.size,
    status: report.status,
    location: { lat: report.lat, lng: report.lng },
    description: report.description,
    priority: report.priority,
    // HR-1: the score is a demo heuristic, never presented as the production model.
    priority_source: "demo_heuristic",
    anonymous: report.anonymous,
    author: authorLabel(userOf(state, report.created_by), report.anonymous),
    volunteer_eligible: eligible,
    volunteer_ineligible_reason: reason,
    is_demo: report.is_demo,
    created_at: iso(report.created_at),
    updated_at: iso(report.updated_at),
    counts,
  };
}

function timeline(state: DemoState, report: ReportRow) {
  return state.events
    .filter((row) => row.report_id === report.id)
    .sort((a, b) => a.created_at - b.created_at || a.id - b.id)
    .map((event) => {
      let actor: string;
      if (event.actor_kind === "resident") {
        actor =
          report.anonymous && event.actor_id === report.created_by
            ? ANONYMOUS_LABEL
            : displayName(userOf(state, event.actor_id));
      } else {
        actor = ACTOR_LABELS[event.actor_kind] || event.actor_kind;
      }
      return {
        from_status: event.from_status,
        to_status: event.to_status,
        actor,
        actor_kind: event.actor_kind,
        comment: event.comment,
        created_at: iso(event.created_at),
      };
    });
}

export function commentOut(state: DemoState, comment: CommentRow, report: ReportRow) {
  const anonymous = report.anonymous && comment.user_id === report.created_by;
  return {
    id: comment.id,
    author: authorLabel(userOf(state, comment.user_id), anonymous),
    text: comment.text,
    state: comment.state,
    created_at: iso(comment.created_at),
  };
}

function comments(state: DemoState, report: ReportRow) {
  return state.comments
    .filter((row) => row.report_id === report.id && row.state === "published")
    .sort((a, b) => a.created_at - b.created_at || a.id - b.id)
    .slice(0, 100)
    .map((comment) => commentOut(state, comment, report));
}

export function reportDetail(state: DemoState, report: ReportRow): Report {
  const claim = activeClaimOf(state, report.id);
  return {
    ...summary(state, report, countsOf(state, report.id)),
    timeline: timeline(state, report),
    comments: comments(state, report),
    active_claim: claim ? claimOut(state, claim) : null,
  } as Report;
}

export function featureCollection(state: DemoState, reports: ReportRow[]): ReportFeatureCollection {
  const features = reports.map((report) => ({
    type: "Feature" as const,
    geometry: { type: "Point" as const, coordinates: [report.lng, report.lat] as [number, number] },
    properties: summary(state, report, countsOf(state, report.id)) as unknown as Report,
  }));
  return { type: "FeatureCollection", features, count: features.length };
}

export function confirmationOut(state: DemoState, confirmation: ConfirmationRow, report: ReportRow) {
  const anonymous = report.anonymous && confirmation.user_id === report.created_by;
  return {
    id: confirmation.id,
    author: authorLabel(userOf(state, confirmation.user_id), anonymous),
    kind: confirmation.kind,
    comment: confirmation.comment,
    created_at: iso(confirmation.created_at),
  };
}
