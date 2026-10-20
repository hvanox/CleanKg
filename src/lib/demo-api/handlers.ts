// Endpoint logic, a port of prototipe/api/app/routers/reports.py, routers/meta.py and deps.py.
// Each handler works on a private copy of the state and returns the JSON the server returns. Whatever it throws discards
// the copy, which is what the server's `db.rollback()` does.
import { KYRGYZSTAN_BBOX, MAX_ID, SETTINGS, HOUR_MS } from "./config";
import { volunteerEligibility } from "./eligibility";
import { fail, failFrom, unprocessable } from "./http";
import {
  TransitionError,
  applyTransition,
  closingRuleState,
  nextId,
  recordEvent,
  resolutionConfirmations,
  resolvedBy,
} from "./lifecycle";
import { containsPersonalData } from "./personal-data";
import { demoPriority, refreshPriority } from "./priority";
import { requireActorKind, resolveStatusActor } from "./roles";
import type { ClaimCreate, ConfirmationCreate, ReportCreate, StatusUpdate } from "./schemas";
import {
  categoryOut,
  claimOut,
  commentOut,
  confirmationOut,
  featureCollection,
  reportDetail,
} from "./serializers";
import type { CategoryRow, DemoState, ReportRow, UserRow } from "./types";

const MAX_ID_DIGITS = String(MAX_ID).length;

/** Mock authentication (deps.py): the `X-Actor-Id` value picks a demo account. One generic answer for every failure. */
export function getActor(state: DemoState, actorId: string | undefined): UserRow {
  const unknown = (message: string) => fail(401, "unknown_actor", message);
  if (actorId === undefined || !actorId.trim()) return unknown("Укажите заголовок X-Actor-Id.");
  const raw = actorId.trim();
  if (!/^[0-9]+$/.test(raw) || raw.length > MAX_ID_DIGITS) return unknown("Аккаунт не найден.");
  const id = Number(raw);
  const user = id >= 1 && id <= MAX_ID ? state.users.find((row) => row.id === id) : undefined;
  return user ?? unknown("Аккаунт не найден.");
}

/** 422 `personal_data_in_text` when public free text holds a phone or an email: refused, not masked, never echoed (QA-P01 D1, HR-7). */
function refusePersonalData(fields: Record<string, string | null | undefined>): void {
  for (const [field, text] of Object.entries(fields)) {
    if (containsPersonalData(text)) {
      unprocessable(
        "personal_data_in_text",
        "Не указывайте телефон или электронную почту: тексты обращений и комментариев публичны.",
        { field },
      );
    }
  }
}

function getReport(state: DemoState, reportId: number): ReportRow {
  const report = state.reports.find((row) => row.id === reportId);
  return report ?? fail(404, "report_not_found", "Обращение не найдено.");
}

const FLOAT = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

function parseBbox(raw: string): [number, number, number, number] {
  const parts = raw.split(",").map((part) => part.trim());
  if (parts.length !== 4) {
    unprocessable("invalid_bbox", "bbox ожидает четыре числа: minLng,minLat,maxLng,maxLat.");
  }
  const numbers = parts.map((part) => {
    if (FLOAT.test(part)) return Number(part);
    // Python's float() also accepts these spellings; they then fail the range check below.
    if (/^[+-]?(?:nan|inf|infinity)$/i.test(part)) return Number.NaN;
    return unprocessable("invalid_bbox", "bbox содержит не число.");
  });
  const [minLng, minLat, maxLng, maxLat] = numbers;
  if (!(-180 <= minLng && minLng < maxLng && maxLng <= 180 && -90 <= minLat && minLat < maxLat && maxLat <= 90)) {
    unprocessable("invalid_bbox", "bbox вне допустимых координат или границы перепутаны местами.");
  }
  return [minLng, minLat, maxLng, maxLat];
}

function categoryOf(state: DemoState, code: string): CategoryRow | undefined {
  return state.categories.find((row) => row.code === code);
}

// ---------- reference data ----------

export function listCategories(state: DemoState) {
  const sorted = [...state.categories].sort(
    (a, b) => a.sort_order - b.sort_order || (a.code < b.code ? -1 : a.code > b.code ? 1 : 0),
  );
  return { items: sorted.map(categoryOut) };
}

export function listOrganisations(state: DemoState) {
  return {
    items: [...state.organisations]
      .sort((a, b) => a.id - b.id)
      .map((row) => ({ id: row.id, name: row.name, type: row.type, connection_status: row.connection_status })),
  };
}

// ---------- reports ----------

export function createReport(state: DemoState, actor: UserRow, payload: ReportCreate) {
  refusePersonalData({ description: payload.description });
  const category = categoryOf(state, payload.category);
  if (!category) unprocessable("unknown_category", "Категория не найдена в справочнике.");

  const [minLat, minLng, maxLat, maxLng] = KYRGYZSTAN_BBOX;
  if (!(minLat <= payload.lat && payload.lat <= maxLat && minLng <= payload.lng && payload.lng <= maxLng)) {
    unprocessable("location_outside_kyrgyzstan", "Точка должна находиться в пределах Кыргызской Республики.");
  }

  const now = Date.now();
  const report: ReportRow = {
    id: nextId(state.reports),
    category_code: category!.code,
    size: payload.size,
    status: "submitted",
    lat: payload.lat,
    lng: payload.lng,
    description: payload.description.trim(),
    priority: demoPriority(category!, payload.size),
    anonymous: payload.anonymous,
    is_demo: false,
    created_by: actor.id,
    created_at: now,
    updated_at: now,
  };
  state.reports.push(report);
  recordEvent(state, report, {
    actorId: actor.id,
    actorKind: "resident",
    fromStatus: null,
    toStatus: "submitted",
    comment: null,
  });
  return reportDetail(state, report);
}

export function listReports(
  state: DemoState,
  query: { bbox: string | null; status: string | null; category: string | null; limit: number },
) {
  let rows = state.reports;
  if (query.bbox) {
    const [minLng, minLat, maxLng, maxLat] = parseBbox(query.bbox);
    rows = rows.filter((r) => r.lat >= minLat && r.lat <= maxLat && r.lng >= minLng && r.lng <= maxLng);
  }
  if (query.status) rows = rows.filter((r) => r.status === query.status);
  if (query.category) rows = rows.filter((r) => r.category_code === query.category);
  const sorted = [...rows].sort((a, b) => b.created_at - a.created_at || b.id - a.id).slice(0, query.limit);
  return featureCollection(state, sorted);
}

export function getReportDetail(state: DemoState, reportId: number) {
  return reportDetail(state, getReport(state, reportId));
}

export function changeStatus(state: DemoState, actor: UserRow, reportId: number, payload: StatusUpdate) {
  refusePersonalData({ comment: payload.comment, reason: payload.reason });
  const report = getReport(state, reportId);
  try {
    // D2: the role comes from the account; the body only states which hat to wear.
    const [matrixKind, recordedKind] = resolveStatusActor(actor, payload.actor_kind, report.status, payload.to_status);
    applyTransition(state, report, {
      toStatus: payload.to_status,
      actorId: actor.id,
      actorKind: matrixKind,
      recordedActorKind: recordedKind,
      reason: payload.reason,
      comment: payload.comment,
    });
  } catch (error) {
    if (error instanceof TransitionError) failFrom(error);
    throw error;
  }
  return reportDetail(state, report);
}

export function addComment(state: DemoState, actor: UserRow, reportId: number, payload: { text: string }) {
  refusePersonalData({ text: payload.text });
  const report = getReport(state, reportId);
  const now = Date.now();
  const comment = {
    id: nextId(state.comments),
    report_id: report.id,
    user_id: actor.id,
    text: payload.text.trim(),
    state: "published", // pre-moderation for new accounts is production-only (P-2)
    created_at: now,
  };
  state.comments.push(comment);
  report.updated_at = now;
  return commentOut(state, comment, report);
}

export function addConfirmation(state: DemoState, actor: UserRow, reportId: number, payload: ConfirmationCreate) {
  refusePersonalData({ comment: payload.comment });
  const report = getReport(state, reportId);
  const kind = payload.kind;

  if (kind === "resolution") {
    if (report.status !== "resolved") {
      fail(409, "report_not_resolved", "Подтвердить уборку можно только у решённого обращения.", {
        status: report.status,
      });
    }
    if (actor.id === resolvedBy(state, report.id)) {
      fail(403, "cannot_confirm_own_resolution", "Исполнитель не может подтвердить свою же уборку.");
    }
  } else if (!["submitted", "under_review", "in_progress", "disputed"].includes(report.status)) {
    fail(409, "confirmation_not_allowed", "«Я тоже это вижу» доступно только для открытых обращений.", {
      status: report.status,
    });
  }

  const existing = state.confirmations.find(
    (row) => row.report_id === report.id && row.user_id === actor.id && row.kind === kind,
  );
  if (existing) fail(409, "already_confirmed", "Вы уже подтвердили это обращение.");

  const confirmation = {
    id: nextId(state.confirmations),
    report_id: report.id,
    user_id: actor.id,
    kind,
    comment: payload.comment,
    created_at: Date.now(),
  };
  state.confirmations.push(confirmation);
  refreshPriority(state, report); // P-1: confirmations raise the (demo) priority

  let autoConfirmed = false;
  if (kind === "resolution") {
    const rule = closingRuleState(state, report.id);
    if (rule.met && report.status === "resolved") {
      try {
        applyTransition(state, report, { toStatus: "confirmed", actorId: null, actorKind: "system" });
      } catch (error) {
        if (error instanceof TransitionError) failFrom(error);
        throw error;
      }
      autoConfirmed = true;
    }
  }

  return {
    confirmation: confirmationOut(state, confirmation, report),
    report: reportDetail(state, report),
    closing_rule: {
      required: SETTINGS.closingConfirmations,
      received: resolutionConfirmations(state, report.id),
      auto_confirmed: autoConfirmed,
      days_without_dispute: SETTINGS.closingDaysWithoutDispute,
    },
  };
}

export function claimReport(state: DemoState, actor: UserRow, reportId: number, payload: ClaimCreate) {
  refusePersonalData({ comment: payload.comment });
  const report = getReport(state, reportId);
  const actorKind = payload.actor_kind;

  if (actorKind !== "volunteer" && actorKind !== "operator") {
    fail(403, "actor_not_allowed", "Взять задачу в работу может волонтёр или оператор организации.", {
      allowed_actors: ["volunteer", "operator"],
    });
  }

  // D2: a volunteer account cannot claim as operator, an operator account cannot claim as volunteer,
  // and a resident or moderator account cannot claim at all.
  try {
    requireActorKind(actor, actorKind);
  } catch (error) {
    if (error instanceof TransitionError) failFrom(error);
    throw error;
  }

  // HR-5: hazardous waste and burning never reach volunteers. Checked before the state, so the answer does not depend
  // on where the report is in its life.
  if (actorKind === "volunteer") {
    const category = categoryOf(state, report.category_code) as CategoryRow;
    const [eligible, why] = volunteerEligibility(category, report.size);
    if (!eligible) fail(403, "volunteer_not_eligible", "Задача недоступна волонтёрам.", { reason: why });
  }

  if (report.status !== "under_review") {
    fail(409, "claim_not_allowed", "Взять в работу можно только обращение на проверке.", { status: report.status });
  }

  if (state.claims.some((row) => row.report_id === report.id && row.state === "active")) {
    fail(409, "already_claimed", "У обращения уже есть активная заявка.");
  }

  let organisationId: number | null = null;
  if (payload.organisation_id !== null) {
    const organisation = state.organisations.find((row) => row.id === payload.organisation_id);
    if (!organisation) unprocessable("unknown_organisation", "Организация не найдена.");
    organisationId = organisation!.id;
  }

  const now = Date.now();
  const claim = {
    id: nextId(state.claims),
    report_id: report.id,
    user_id: actor.id,
    organisation_id: organisationId,
    state: "active",
    expires_at: now + SETTINGS.claimHoldHours * HOUR_MS,
    created_at: now,
  };
  state.claims.push(claim);

  try {
    applyTransition(state, report, { toStatus: "in_progress", actorId: actor.id, actorKind });
  } catch (error) {
    if (error instanceof TransitionError) failFrom(error);
    throw error;
  }

  return { report: reportDetail(state, report), claim: claimOut(state, claim) };
}
