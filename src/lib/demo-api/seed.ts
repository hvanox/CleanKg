// Port of the seeding logic of prototipe/api/app/seed.py: 4 demo accounts (ids 1 to 4), 2 demo organisations,
// 7 categories and 15 demo reports with their timelines, comments, confirmations and claims. Built through the same
// lifecycle engine as live changes, so the seed cannot drift from the rules.
import type { Status } from "../types";
import { HOUR_MS, DAY_MS, SETTINGS, STORAGE_VERSION } from "./config";
import {
  CATEGORY_SPECS,
  DEMO_ORGANISATION_SPECS,
  DEMO_REPORTS,
  DEMO_USER_SPECS,
  type DemoReportSpec,
} from "./seed-data";
import { applyTransition, nextId, recordEvent } from "./lifecycle";
import { demoPriority, refreshPriority } from "./priority";
import type { ActorKindName, CategoryRow, DemoState, ReportRow } from "./types";

function stageOffsets(createdAt: number) {
  return {
    under_review: createdAt + 2 * HOUR_MS,
    rejected: createdAt + 2 * HOUR_MS + 2 * DAY_MS,
    claim: createdAt + 2 * HOUR_MS + 1 * DAY_MS,
    resolved: createdAt + 2 * HOUR_MS + 4 * DAY_MS,
    confirmed: createdAt + 2 * HOUR_MS + 5 * DAY_MS,
    disputed: createdAt + 2 * HOUR_MS + 6 * DAY_MS,
  };
}

function buildDemoReport(
  state: DemoState,
  spec: DemoReportSpec,
  users: Record<string, number>,
  organisations: Record<string, number>,
  now: number,
): ReportRow {
  const category = state.categories.find((row) => row.code === spec.category) as CategoryRow;
  const createdAt = now - spec.age_days * DAY_MS - spec.age_hours * HOUR_MS;
  const authorId = users[spec.author];
  const report: ReportRow = {
    id: nextId(state.reports),
    category_code: category.code,
    size: spec.size,
    status: "submitted",
    lat: spec.lat,
    lng: spec.lng,
    description: `демо: ${spec.description}`,
    priority: demoPriority(category, spec.size),
    anonymous: spec.anonymous,
    is_demo: true,
    created_by: authorId,
    created_at: createdAt,
    updated_at: createdAt,
  };
  state.reports.push(report);

  recordEvent(state, report, {
    actorId: authorId,
    actorKind: "resident",
    fromStatus: null,
    toStatus: "submitted",
    comment: null,
    createdAt,
  });

  const stage: Status = spec.stage;
  if (stage === "submitted") return report;

  const offsets = stageOffsets(createdAt);
  applyTransition(state, report, {
    toStatus: "under_review",
    actorId: null,
    actorKind: "system",
    at: offsets.under_review,
  });
  if (stage === "under_review") return report;

  if (stage === "rejected") {
    applyTransition(state, report, {
      toStatus: "rejected",
      actorId: null,
      actorKind: "moderator",
      reason: spec.rejection_reason ?? "duplicate",
      at: offsets.rejected,
    });
    return report;
  }

  const claimKind = spec.claim;
  const claimActorKey = claimKind === "volunteer" ? "volunteer" : "operator";
  const claimUserId = users[claimActorKey];
  const claimAt = offsets.claim;
  const claimActorKind: ActorKindName = claimKind === "volunteer" ? "volunteer" : "operator";
  state.claims.push({
    id: nextId(state.claims),
    report_id: report.id,
    user_id: claimUserId,
    organisation_id: claimKind === "operator" ? organisations.municipal : null,
    state: "active",
    expires_at: claimAt + SETTINGS.claimHoldHours * HOUR_MS,
    created_at: claimAt,
  });

  applyTransition(state, report, {
    toStatus: "in_progress",
    actorId: claimUserId,
    actorKind: claimActorKind,
    at: claimAt,
  });
  if (stage === "in_progress") return report;

  applyTransition(state, report, {
    toStatus: "resolved",
    actorId: claimUserId,
    actorKind: claimActorKind,
    comment: null,
    at: offsets.resolved,
  });

  // Account keys in insertion order (resident, operator, volunteer, moderator), as the server iterates them.
  const others = Object.entries(users)
    .filter(([key, id]) => key !== "volunteer" && id !== claimUserId)
    .map(([, id]) => id);

  if (stage === "resolved") {
    state.confirmations.push({
      id: nextId(state.confirmations),
      report_id: report.id,
      user_id: others[0],
      kind: "resolution",
      comment: null,
      created_at: offsets.resolved + 12 * HOUR_MS,
    });
    return report;
  }

  if (stage === "disputed") {
    const operatorId = claimUserId !== users.operator ? users.operator : users.resident;
    applyTransition(state, report, {
      toStatus: "disputed",
      actorId: operatorId,
      actorKind: "resident",
      comment: "демо: мусор на месте, приложено новое фото",
      at: offsets.disputed,
    });
    return report;
  }

  // stage === "confirmed": two residents confirm the resolution, then the system closes.
  for (const confirmerId of others.slice(0, 2)) {
    state.confirmations.push({
      id: nextId(state.confirmations),
      report_id: report.id,
      user_id: confirmerId,
      kind: "resolution",
      comment: null,
      created_at: offsets.confirmed - 6 * HOUR_MS,
    });
  }
  applyTransition(state, report, {
    toStatus: "confirmed",
    actorId: null,
    actorKind: "system",
    at: offsets.confirmed,
  });
  return report;
}

/** The demo dataset as of `now`: ages are relative, as in the server seed. */
export function buildSeedState(now: number = Date.now()): DemoState {
  const state: DemoState = {
    version: STORAGE_VERSION,
    users: [],
    organisations: [],
    categories: [],
    reports: [],
    events: [],
    comments: [],
    confirmations: [],
    claims: [],
  };

  for (const [code, labelRu, allowed, maxSize, hazardous, order] of CATEGORY_SPECS) {
    state.categories.push({
      code,
      label_ru: labelRu,
      label_ky: null,
      volunteer_allowed: allowed,
      max_volunteer_size: maxSize,
      is_hazardous: hazardous,
      sort_order: order,
    });
  }

  const users: Record<string, number> = {};
  for (const [key, name, role] of DEMO_USER_SPECS) {
    const id = nextId(state.users);
    state.users.push({ id, display_name: name, role });
    users[key] = id;
  }

  const organisations: Record<string, number> = {};
  for (const [key, name, type] of DEMO_ORGANISATION_SPECS) {
    const id = nextId(state.organisations);
    // HR-2: demo organisations are explicitly NOT connected.
    state.organisations.push({ id, name, type, connection_status: "not_connected" });
    organisations[key] = id;
  }

  for (const spec of DEMO_REPORTS) {
    const report = buildDemoReport(state, spec, users, organisations, now);
    refreshPriority(state, report);
    const commenterKey = spec.author !== "operator" ? "operator" : "moderator";
    state.comments.push({
      id: nextId(state.comments),
      report_id: report.id,
      user_id: users[commenterKey],
      text: "демо-комментарий: проблема на месте, наблюдаю",
      state: "published",
      created_at: Math.min(report.created_at + 6 * HOUR_MS, now - 30 * 60_000),
    });
  }

  return state;
}
