import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, fetchCategories, fetchOrganisations, fetchReport, fetchReports } from "@/lib/api";
import { demoRequest, resetDemoState } from "@/lib/demo-api";
import { STORAGE_KEY } from "@/lib/demo-api/config";
import { containsPersonalData } from "@/lib/demo-api/personal-data";
import { buildSeedState } from "@/lib/demo-api/seed";
import type { Report, ReportFeatureCollection } from "@/lib/types";

// Actor ids of the demo accounts (prototipe/api/README.md): 1 resident, 2 operator, 3 volunteer, 4 moderator.
const RESIDENT = "1";
const OPERATOR = "2";
const VOLUNTEER = "3";
const MODERATOR = "4";

const BBOX = "74.3,42.6,74.8,43.1";

function call<T>(method: string, path: string, options: { actor?: string; body?: unknown } = {}): Promise<T> {
  return demoRequest<T>(path, {
    method,
    actorId: options.actor,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

async function failure(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    return error as ApiError;
  }
  throw new Error("expected the call to fail");
}

const newReport = (overrides: Record<string, unknown> = {}) => ({
  category: "illegal_dump",
  size: "medium",
  lat: 42.8746,
  lng: 74.5698,
  description: "демо: свалка у арыка",
  anonymous: false,
  ...overrides,
});

const create = (overrides: Record<string, unknown> = {}, actor = RESIDENT) =>
  call<Report>("POST", "/api/v1/reports", { actor, body: newReport(overrides) });

const status = (id: number, to_status: string, actor_kind: string, actor: string, extra: Record<string, unknown> = {}) =>
  call<Report>("PATCH", `/api/v1/reports/${id}/status`, { actor, body: { to_status, actor_kind, ...extra } });

beforeEach(() => {
  window.localStorage.clear();
  resetDemoState();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("seed", () => {
  it("has 15 demo reports, ids 1 to 15, all flagged demo and labelled «демо:»", async () => {
    const list = await call<ReportFeatureCollection>("GET", `/api/v1/reports?bbox=${BBOX}`);
    expect(list.count).toBe(15);
    const reports = list.features.map((feature) => feature.properties);
    expect(reports.map((r) => r.id).sort((a, b) => a - b)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
    expect(reports.every((r) => r.is_demo && r.description.startsWith("демо:"))).toBe(true);
    const byStatus = (s: string) => reports.filter((r) => r.status === s).length;
    expect(["submitted", "under_review", "in_progress", "resolved", "confirmed", "disputed", "rejected"].map(byStatus)).toEqual([
      1, 4, 3, 1, 4, 1, 1,
    ]);
  });

  it("has 7 categories with volunteer flags and caps, and 2 organisations that are not connected (HR-2)", async () => {
    const categories = await call<{ items: Record<string, unknown>[] }>("GET", "/api/v1/categories");
    expect(categories.items.map((c) => c.code)).toEqual([
      "illegal_dump",
      "overflowing_container",
      "missed_collection",
      "trash_burning",
      "construction_debris",
      "littered_area",
      "hazardous_waste",
    ]);
    const dump = categories.items[0];
    expect(dump).toMatchObject({ volunteer_allowed: true, max_volunteer_size: "medium", hidden_from_volunteers: false });
    const hazardous = categories.items[6];
    expect(hazardous).toMatchObject({ is_hazardous: true, volunteer_allowed: false, hidden_from_volunteers: true });
    expect(categories.items[3]).toMatchObject({ code: "trash_burning", hidden_from_volunteers: true });

    const organisations = await call<{ items: { id: number; connection_status: string }[] }>("GET", "/api/v1/organisations");
    expect(organisations.items.map((o) => [o.id, o.connection_status])).toEqual([
      [1, "not_connected"],
      [2, "not_connected"],
    ]);
  });

  it("keeps the timelines, claims, comments and confirmations of the server seed", async () => {
    const confirmed = await call<Report>("GET", "/api/v1/reports/1");
    expect(confirmed.status).toBe("confirmed");
    expect(confirmed.timeline.map((e) => [e.to_status, e.actor_kind])).toEqual([
      ["submitted", "resident"],
      ["under_review", "system"],
      ["in_progress", "volunteer"],
      ["resolved", "volunteer"],
      ["confirmed", "system"],
    ]);
    expect(confirmed.timeline[4].comment).toBe("Правило закрытия: 2 подтверждения от жителей, кроме исполнителя");
    expect(confirmed.counts).toEqual({ comments: 1, confirmations: 0, resolution_confirmations: 2 });
    expect(confirmed.priority).toBe(60 + 5 + 4);

    const held = await call<Report>("GET", "/api/v1/reports/5");
    expect(held.status).toBe("in_progress");
    expect(held.active_claim).toMatchObject({ state: "active", organisation: "Городская служба вывоза (демо)" });

    const rejected = await call<Report>("GET", "/api/v1/reports/8");
    expect(rejected.timeline.at(-1)).toMatchObject({ to_status: "rejected", actor: "Модератор", comment: "reason: not_waste" });

    const disputed = await call<Report>("GET", "/api/v1/reports/11");
    expect(disputed.status).toBe("disputed");
    expect(disputed.timeline.at(-1)?.comment).toBe("демо: мусор на месте, приложено новое фото");
  });

  it("builds the same state twice (the seed is deterministic apart from the clock)", () => {
    const a = buildSeedState(1_700_000_000_000);
    const b = buildSeedState(1_700_000_000_000);
    expect(a).toEqual(b);
  });
});

describe("full happy path", () => {
  it("create, review by the moderator stand-in, operator claim, resolve, two confirmations, confirmed", async () => {
    const created = await create();
    expect(created.id).toBe(16);
    expect(created).toMatchObject({ status: "submitted", is_demo: false, author: "Айгуль", priority_source: "demo_heuristic" });

    const reviewed = await status(created.id, "under_review", "system", MODERATOR);
    expect(reviewed.status).toBe("under_review");
    expect(reviewed.timeline.at(-1)).toMatchObject({ actor: "Модератор", actor_kind: "moderator" });

    const claim = await call<{ report: Report; claim: { state: string; organisation: string | null } }>(
      "POST",
      `/api/v1/reports/${created.id}/claim`,
      { actor: OPERATOR, body: { actor_kind: "operator", organisation_id: 1 } },
    );
    expect(claim.report.status).toBe("in_progress");
    expect(claim.claim).toMatchObject({ state: "active", organisation: "Городская служба вывоза (демо)" });

    const resolved = await status(created.id, "resolved", "operator", OPERATOR);
    expect(resolved.status).toBe("resolved");
    expect(resolved.active_claim).toBeNull();

    type Confirmed = { report: Report; closing_rule: { required: number; received: number; auto_confirmed: boolean } };
    const first = await call<Confirmed>("POST", `/api/v1/reports/${created.id}/confirmations`, {
      actor: RESIDENT,
      body: { kind: "resolution" },
    });
    expect(first.report.status).toBe("resolved");
    expect(first.closing_rule).toMatchObject({ required: 2, received: 1, auto_confirmed: false });

    const second = await call<Confirmed>("POST", `/api/v1/reports/${created.id}/confirmations`, {
      actor: MODERATOR,
      body: { kind: "resolution" },
    });
    expect(second.report.status).toBe("confirmed");
    expect(second.closing_rule).toMatchObject({ received: 2, auto_confirmed: true });
    expect(second.report.timeline.map((e) => e.to_status)).toEqual([
      "submitted",
      "under_review",
      "in_progress",
      "resolved",
      "confirmed",
    ]);
    expect(second.report.timeline.at(-1)).toMatchObject({
      actor: "Система",
      comment: "Правило закрытия: 2 подтверждения от жителей, кроме исполнителя",
    });
    expect(second.report.counts.resolution_confirmations).toBe(2);

    // The new report is on the map and in the card route.
    const list = await call<ReportFeatureCollection>("GET", `/api/v1/reports?bbox=${BBOX}&status=confirmed`);
    expect(list.features.some((f) => f.properties.id === 16)).toBe(true);
  });

  it("closes after 7 days without a dispute when fewer than two residents confirmed", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-20T08:00:00Z"));
    const created = await create();
    await status(created.id, "under_review", "system", MODERATOR);
    await call("POST", `/api/v1/reports/${created.id}/claim`, { actor: VOLUNTEER, body: { actor_kind: "volunteer" } });
    await status(created.id, "resolved", "volunteer", VOLUNTEER);

    const early = await failure(status(created.id, "confirmed", "resident", RESIDENT));
    expect(early).toMatchObject({ status: 409, code: "closing_rule_not_met" });
    expect(early.detail).toMatchObject({ required_confirmations: 2, received_confirmations: 0, days_without_dispute: 7 });

    vi.setSystemTime(new Date("2026-10-27T08:00:01Z"));
    const closed = await status(created.id, "confirmed", "resident", RESIDENT);
    expect(closed.status).toBe("confirmed");
    expect(closed.timeline.at(-1)?.comment).toBe("Правило закрытия: 7 дней без спора");
  });

  it("the resolver cannot confirm their own clean-up, and nobody confirms twice", async () => {
    const created = await create();
    await status(created.id, "under_review", "system", MODERATOR);
    await call("POST", `/api/v1/reports/${created.id}/claim`, { actor: OPERATOR, body: { actor_kind: "operator" } });
    await status(created.id, "resolved", "operator", OPERATOR);

    const own = await failure(
      call("POST", `/api/v1/reports/${created.id}/confirmations`, { actor: OPERATOR, body: { kind: "resolution" } }),
    );
    expect(own).toMatchObject({ status: 403, code: "cannot_confirm_own_resolution" });

    await call("POST", `/api/v1/reports/${created.id}/confirmations`, { actor: RESIDENT, body: { kind: "resolution" } });
    const twice = await failure(
      call("POST", `/api/v1/reports/${created.id}/confirmations`, { actor: RESIDENT, body: { kind: "resolution" } }),
    );
    expect(twice).toMatchObject({ status: 409, code: "already_confirmed" });
  });
});

describe("lifecycle matrix and actor rules", () => {
  it("refuses a transition outside the matrix with 409 and the list of allowed targets", async () => {
    const created = await create();
    const error = await failure(status(created.id, "confirmed", "resident", RESIDENT));
    expect(error).toMatchObject({ status: 409, code: "invalid_transition" });
    expect(error.detail).toMatchObject({ from_status: "submitted", to_status: "confirmed", allowed: ["under_review"] });
    expect((await call<Report>("GET", `/api/v1/reports/${created.id}`)).status).toBe("submitted");
  });

  it("does not let a resident account act as system, moderator or operator (role comes from the account)", async () => {
    const created = await create();
    expect(await failure(status(created.id, "under_review", "system", RESIDENT))).toMatchObject({
      status: 403,
      code: "actor_not_allowed",
    });
    expect(await failure(status(created.id, "rejected", "moderator", OPERATOR, { reason: "spam" }))).toMatchObject({
      status: 403,
      code: "actor_not_allowed",
    });
  });

  it("lets only the two stand-in transitions through for a moderator acting as system", async () => {
    const created = await create();
    await status(created.id, "under_review", "system", MODERATOR);
    await call("POST", `/api/v1/reports/${created.id}/claim`, { actor: OPERATOR, body: { actor_kind: "operator" } });
    // in_progress -> under_review is a system-only transition and not a stand-in one.
    expect(await failure(status(created.id, "under_review", "system", MODERATOR))).toMatchObject({
      status: 403,
      code: "actor_not_allowed",
    });
  });

  it("rejection needs a reason from the fixed list; `other` needs a comment", async () => {
    const created = await create();
    await status(created.id, "under_review", "system", MODERATOR);
    expect(await failure(status(created.id, "rejected", "moderator", MODERATOR))).toMatchObject({
      status: 409,
      code: "rejection_reason_required",
    });
    expect(await failure(status(created.id, "rejected", "moderator", MODERATOR, { reason: "bored" }))).toMatchObject({
      code: "invalid_rejection_reason",
    });
    expect(await failure(status(created.id, "rejected", "moderator", MODERATOR, { reason: "other" }))).toMatchObject({
      code: "rejection_comment_required",
    });
    const rejected = await status(created.id, "rejected", "moderator", MODERATOR, { reason: "duplicate" });
    expect(rejected.timeline.at(-1)).toMatchObject({ actor: "Модератор", comment: "reason: duplicate" });
  });

  it("a dispute needs a comment", async () => {
    const error = await failure(status(10, "disputed", "resident", RESIDENT));
    // report 10 is under_review: the matrix refuses before the comment rule.
    expect(error.code).toBe("invalid_transition");
    const created = await create();
    await status(created.id, "under_review", "system", MODERATOR);
    await call("POST", `/api/v1/reports/${created.id}/claim`, { actor: OPERATOR, body: { actor_kind: "operator" } });
    await status(created.id, "resolved", "operator", OPERATOR);
    expect(await failure(status(created.id, "disputed", "resident", RESIDENT))).toMatchObject({
      code: "dispute_comment_required",
    });
    const disputed = await status(created.id, "disputed", "resident", RESIDENT, { comment: "мусор на месте" });
    expect(disputed.status).toBe("disputed");
  });

  it("requires a claim to move to in_progress and to resolve", async () => {
    const created = await create();
    await status(created.id, "under_review", "system", MODERATOR);
    expect(await failure(status(created.id, "in_progress", "operator", OPERATOR))).toMatchObject({
      status: 409,
      code: "claim_required",
    });
  });

  it("answers the claim preconditions: state, double claim, role and organisation", async () => {
    const created = await create();
    expect(
      await failure(call("POST", `/api/v1/reports/${created.id}/claim`, { actor: OPERATOR, body: { actor_kind: "operator" } })),
    ).toMatchObject({ status: 409, code: "claim_not_allowed" });
    await status(created.id, "under_review", "system", MODERATOR);
    expect(
      await failure(call("POST", `/api/v1/reports/${created.id}/claim`, { actor: VOLUNTEER, body: { actor_kind: "operator" } })),
    ).toMatchObject({ status: 403, code: "actor_not_allowed" });
    expect(
      await failure(call("POST", `/api/v1/reports/${created.id}/claim`, { actor: MODERATOR, body: { actor_kind: "moderator" } })),
    ).toMatchObject({ status: 403, code: "actor_not_allowed" });
    expect(
      await failure(
        call("POST", `/api/v1/reports/${created.id}/claim`, { actor: OPERATOR, body: { actor_kind: "operator", organisation_id: 99 } }),
      ),
    ).toMatchObject({ status: 422, code: "unknown_organisation" });
    await call("POST", `/api/v1/reports/${created.id}/claim`, { actor: OPERATOR, body: { actor_kind: "operator" } });
    expect(
      await failure(call("POST", `/api/v1/reports/${created.id}/claim`, { actor: OPERATOR, body: { actor_kind: "operator" } })),
    ).toMatchObject({ status: 409, code: "claim_not_allowed" });
  });
});

describe("volunteer eligibility (HR-5)", () => {
  it.each([
    [4, "hazardous"],
    [3, "burning"],
  ])("a volunteer cannot claim report %i (%s): 403 volunteer_not_eligible", async (id, reason) => {
    const error = await failure(
      call("POST", `/api/v1/reports/${id}/claim`, { actor: VOLUNTEER, body: { actor_kind: "volunteer" } }),
    );
    expect(error).toMatchObject({ status: 403, code: "volunteer_not_eligible" });
    expect(error.detail).toMatchObject({ reason });
    expect((await call<Report>("GET", `/api/v1/reports/${id}`)).status).toBe("under_review");
  });

  it("checks eligibility before the state, so a hazardous report in any state is still refused", async () => {
    const error = await failure(
      call("POST", "/api/v1/reports/4/claim", { actor: VOLUNTEER, body: { actor_kind: "volunteer" } }),
    );
    expect(error.code).toBe("volunteer_not_eligible");
    const closed = await failure(
      call("POST", "/api/v1/reports/15/claim", { actor: VOLUNTEER, body: { actor_kind: "volunteer" } }),
    );
    expect(closed.code).toBe("volunteer_not_eligible"); // burning, confirmed
  });

  it("a size above the category cap is refused, and a new hazardous report is marked ineligible", async () => {
    const big = await create({ size: "large" });
    await status(big.id, "under_review", "system", MODERATOR);
    const error = await failure(
      call("POST", `/api/v1/reports/${big.id}/claim`, { actor: VOLUNTEER, body: { actor_kind: "volunteer" } }),
    );
    expect(error.detail).toMatchObject({ reason: "size_too_large" });

    const hazardous = await create({ category: "hazardous_waste", size: "small" });
    expect(hazardous).toMatchObject({ volunteer_eligible: false, volunteer_ineligible_reason: "hazardous" });
  });

  it("an eligible report can be taken by a volunteer", async () => {
    const created = await create();
    await status(created.id, "under_review", "system", MODERATOR);
    const taken = await call<{ report: Report }>("POST", `/api/v1/reports/${created.id}/claim`, {
      actor: VOLUNTEER,
      body: { actor_kind: "volunteer" },
    });
    expect(taken.report.status).toBe("in_progress");
    expect(taken.report.active_claim?.organisation).toBeNull();
  });
});

describe("personal data in free text (HR-7)", () => {
  it("refuses a phone number in a description with 422 personal_data_in_text and stores nothing", async () => {
    const error = await failure(create({ description: "свалка, звоните +996 555 12-34-56" }));
    expect(error).toMatchObject({ status: 422, code: "personal_data_in_text" });
    expect(error.detail).toMatchObject({ field: "description" });
    expect(JSON.stringify(error.detail)).not.toContain("555");
    const list = await call<ReportFeatureCollection>("GET", `/api/v1/reports?bbox=${BBOX}`);
    expect(list.count).toBe(15);
  });

  it("refuses an email in a description, a comment, a dispute comment and a reject comment", async () => {
    expect((await failure(create({ description: "пишите ivan@mail.kg" }))).code).toBe("personal_data_in_text");
    expect(
      await failure(call("POST", "/api/v1/reports/1/comments", { actor: RESIDENT, body: { text: "мой номер 0555 123 456" } })),
    ).toMatchObject({ status: 422, code: "personal_data_in_text" });
    expect(
      await failure(status(11, "in_progress", "system", MODERATOR, { comment: "ivan [at] mail.kg" })),
    ).toMatchObject({ code: "personal_data_in_text", detail: { field: "comment" } });
  });

  it("lets plain numbers through: years, street numbers, dates and coordinates", async () => {
    const created = await create({ description: "ул. Токтогула 123, кв. 45, с 20.10.2026, координаты 42.8746 74.5698" });
    expect(created.status).toBe("submitted");
  });

  // The corpus of prototipe/api/tests/test_personal_data.py, so both implementations answer the same.
  const PHONES = [
    "звоните +996 555 12-34-56",
    "+996555123456",
    "+996 (555) 123-456",
    "+996-555-123-456",
    "тел 0555 123 456",
    "тел. 0555123456",
    "0 555 123 456",
    "0 700 12 34 56",
    "0312 12-34-56",
    "0555.123.456",
    "996 555 123 456",
    "555 123 456",
    "8 (312) 123-456",
    "+7 999 123 45 67",
    "мой номер ＋９９６ ５５５ １２３ ４５６",
    "0555\u200b123\u200b456",
    "дом 12, кв 5, звонить 0777 123 456 после шести",
    "٠٥٥٥ ١٢٣ ٤٥٦", // Arabic-Indic digits
  ];
  const EMAILS = [
    "test@example.kg",
    "пишите Ivan.Petrov+waste@mail.ru пожалуйста",
    "айгуль@почта.рф",
    "ivan [at] mail.kg",
    "ivan(at)mail(dot)kg",
    "ivan (собака) mail.kg",
    "ＩＶＡＮ＠ｍａｉｌ.ｋｇ",
    "IVAN (СОБАКА) MAIL (ТОЧКА) KG",
  ];
  const NEAR_MISSES = [
    "Свалка появилась в 2024 году",
    "С 2020 по 2024 год, в 2025 и 2026 годах",
    "в 2024 2025 2026 годах",
    "ул. Токтогула 123, кв. 45",
    "дом 15/2, подъезд 3, этаж 5",
    "проспект Чуй 265, у остановки",
    "координаты 42.8746, 74.5698",
    "координаты 42.874601 74.569812",
    "42.8746 74.5698",
    "42.87460123 74.56981234",
    "20.10.2026 в 14:30",
    "5 июня 2026 года",
    "около 20-30 мешков, примерно 150 кг",
    "площадь 120 150 м2",
    "нужно 3 машины и 2 экскаватора",
    "ГОСТ 12.1.005-88",
    "мусор лежит 14 дней, 7 дней назад приезжали",
    "Свалка у арыка, демо-точка",
    "пишите в @cleankg",
    "почта: не указана; сайт example.kg",
    "демо: без описания",
  ];

  it.each(PHONES)("detects the phone %j", (text) => expect(containsPersonalData(text)).toBe(true));
  it.each(EMAILS)("detects the email %j", (text) => expect(containsPersonalData(text)).toBe(true));
  it.each(NEAR_MISSES)("passes the near miss %j", (text) => expect(containsPersonalData(text)).toBe(false));
});

describe("public shapes and privacy (HR-7)", () => {
  it("shows an anonymous author as «Житель» in the report, its timeline and its comments", async () => {
    const created = await create({ anonymous: true });
    expect(created).toMatchObject({ anonymous: true, author: "Житель" });
    expect(created.timeline[0].actor).toBe("Житель");

    const comment = await call<{ author: string }>("POST", `/api/v1/reports/${created.id}/comments`, {
      actor: RESIDENT,
      body: { text: "демо-комментарий автора" },
    });
    expect(comment.author).toBe("Житель");
    const other = await call<{ author: string }>("POST", `/api/v1/reports/${created.id}/comments`, {
      actor: OPERATOR,
      body: { text: "демо-комментарий соседа" },
    });
    expect(other.author).toBe("Данияр");

    const seeded = await call<Report>("GET", "/api/v1/reports/7");
    expect(seeded).toMatchObject({ anonymous: true, author: "Житель" });
    expect(seeded.timeline[0].actor).toBe("Житель");
  });

  it("carries no phone, email or account id anywhere, and no personal data in any text", async () => {
    await create({ anonymous: true });
    const payloads: unknown[] = [
      await call("GET", `/api/v1/reports?bbox=${BBOX}`),
      await call("GET", "/api/v1/categories"),
      await call("GET", "/api/v1/organisations"),
    ];
    for (let id = 1; id <= 16; id += 1) payloads.push(await call("GET", `/api/v1/reports/${id}`));

    const forbidden = /^(phone|email|user_id|created_by|actor_id|author_id|account_id|user|users|uid|password|token)$/i;
    const walk = (value: unknown, path: string) => {
      if (typeof value === "string") {
        expect(containsPersonalData(value), `${path}: ${value}`).toBe(false);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => walk(item, `${path}[${index}]`));
      } else if (value && typeof value === "object") {
        for (const [key, inner] of Object.entries(value)) {
          expect(forbidden.test(key), `${path}.${key}`).toBe(false);
          walk(inner, `${path}.${key}`);
        }
      }
    };
    payloads.forEach((payload, index) => walk(payload, `payload${index}`));
  });

  it("has the same fields as the API's report shape, and the map items carry no timeline", async () => {
    const report = await call<Report & { priority_source: string }>("GET", "/api/v1/reports/2");
    expect(Object.keys(report)).toEqual([
      "id",
      "category",
      "size",
      "status",
      "location",
      "description",
      "priority",
      "priority_source",
      "anonymous",
      "author",
      "volunteer_eligible",
      "volunteer_ineligible_reason",
      "is_demo",
      "created_at",
      "updated_at",
      "counts",
      "timeline",
      "comments",
      "active_claim",
    ]);
    expect(report.priority_source).toBe("demo_heuristic");
    expect(report.created_at).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/);
    const list = await call<ReportFeatureCollection>("GET", `/api/v1/reports?bbox=${BBOX}&limit=1`);
    expect(list.features).toHaveLength(1);
    expect(list.features[0].geometry.type).toBe("Point");
    expect(Object.keys(list.features[0].properties)).not.toContain("timeline");
  });

  it("raises the demo priority with each confirmation", async () => {
    const before = (await call<Report>("GET", "/api/v1/reports/10")).priority;
    const result = await call<{ report: Report; confirmation: { author: string } }>(
      "POST",
      "/api/v1/reports/10/confirmations",
      { actor: RESIDENT, body: { kind: "report" } },
    );
    expect(result.report.priority).toBe(before + 2);
    expect(result.report.counts.confirmations).toBe(1);
  });
});

describe("errors, statuses and validation", () => {
  it("answers 401 unknown_actor for a missing, malformed or unknown account, in the same words", async () => {
    const missing = await failure(call("POST", "/api/v1/reports", { body: newReport() }));
    expect(missing).toMatchObject({ status: 401, code: "unknown_actor" });
    for (const actor of ["abc", "99", "0", "99999999999999", " "]) {
      const error = await failure(call("POST", "/api/v1/reports", { actor, body: newReport() }));
      expect(error.status).toBe(401);
      expect(JSON.stringify(error.detail)).not.toContain(actor.trim() || "NEVER");
    }
  });

  it("answers 404 report_not_found, and 422 for ids that are not 1 to 2147483647", async () => {
    expect(await failure(call("GET", "/api/v1/reports/999"))).toMatchObject({ status: 404, code: "report_not_found" });
    for (const id of ["0", "abc", "2147483648", "1.5"]) {
      expect(await failure(call("GET", `/api/v1/reports/${id}`))).toMatchObject({ status: 422, code: "validation_error" });
    }
  });

  it("answers 422 unknown_category, location_outside_kyrgyzstan and invalid_bbox", async () => {
    expect(await failure(create({ category: "nope" }))).toMatchObject({ status: 422, code: "unknown_category" });
    expect(await failure(create({ lat: 55, lng: 37 }))).toMatchObject({ status: 422, code: "location_outside_kyrgyzstan" });
    for (const bbox of ["1,2,3", "a,b,c,d", "75,42,74,43", "74,43,75,42", "0,0,181,10"]) {
      expect(await failure(call("GET", `/api/v1/reports?bbox=${bbox}`))).toMatchObject({ status: 422, code: "invalid_bbox" });
    }
  });

  it("answers a schema error list as validation_error without echoing the input", async () => {
    const error = await failure(create({ size: "enormous", lat: "north" }));
    expect(error).toMatchObject({ status: 422, code: "validation_error" });
    const issues = error.detail as { loc: string[]; msg: string; type: string }[];
    expect(issues.map((i) => i.loc.join("."))).toEqual(["body.size", "body.lat"]);
    expect(JSON.stringify(issues)).not.toContain("enormous");
    expect(await failure(call("POST", "/api/v1/reports", { actor: RESIDENT }))).toMatchObject({ status: 422 });
    expect(await failure(call("GET", "/api/v1/reports?status=gone"))).toMatchObject({ status: 422, code: "validation_error" });
    expect(await failure(create({ description: "x".repeat(1001) }))).toMatchObject({ status: 422 });
  });

  it("answers http_404 / http_405 for unknown paths and wrong methods", async () => {
    expect(await failure(call("GET", "/api/v1/nope"))).toMatchObject({ status: 404, code: "http_404" });
    expect(await failure(call("DELETE", "/api/v1/reports/1"))).toMatchObject({ status: 405, code: "http_405" });
  });

  it("checks the confirmation preconditions", async () => {
    expect(
      await failure(call("POST", "/api/v1/reports/1/confirmations", { actor: RESIDENT, body: { kind: "resolution" } })),
    ).toMatchObject({ status: 409, code: "report_not_resolved" });
    expect(
      await failure(call("POST", "/api/v1/reports/1/confirmations", { actor: RESIDENT, body: { kind: "report" } })),
    ).toMatchObject({ status: 409, code: "confirmation_not_allowed" });
  });

  it("filters by status and category and orders newest first", async () => {
    const dumps = await call<ReportFeatureCollection>("GET", `/api/v1/reports?bbox=${BBOX}&category=illegal_dump&status=confirmed`);
    expect(dumps.features.map((f) => f.properties.id).sort()).toEqual([1, 9]);
    const all = await call<ReportFeatureCollection>("GET", `/api/v1/reports?bbox=${BBOX}`);
    const times = all.features.map((f) => Date.parse(f.properties.created_at));
    expect([...times].sort((a, b) => b - a)).toEqual(times);
    const outside = await call<ReportFeatureCollection>("GET", "/api/v1/reports?bbox=70,40,71,41");
    expect(outside.count).toBe(0);
  });
});

describe("state in localStorage", () => {
  it("keeps what the visitor did, under a versioned key, and survives a reload of the module state", async () => {
    await create();
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) as string);
    expect(stored.version).toBe(1);
    expect(stored.reports).toHaveLength(16);
    expect(STORAGE_KEY).toMatch(/-v1$/);
    expect((await call<Report>("GET", "/api/v1/reports/16")).status).toBe("submitted");
  });

  it("does not store a request that failed", async () => {
    const before = window.localStorage.getItem(STORAGE_KEY);
    await failure(create({ description: "0555 123 456" }));
    await failure(status(1, "in_progress", "system", MODERATOR));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(before);
  });

  it("falls back to the seed when the stored state is missing, corrupt or from another version", async () => {
    await create();
    for (const broken of [null, "{not json", "[]", JSON.stringify({ version: 99 }), JSON.stringify({ version: 1, users: [] })]) {
      if (broken === null) window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, broken);
      const list = await call<ReportFeatureCollection>("GET", `/api/v1/reports?bbox=${BBOX}`);
      expect(list.count).toBe(15);
    }
  });

  it("resetDemoState restores the seed", async () => {
    await create();
    await status(3, "rejected", "moderator", MODERATOR, { reason: "spam" });
    resetDemoState();
    expect((await failure(call("GET", "/api/v1/reports/16"))).code).toBe("report_not_found");
    expect((await call<Report>("GET", "/api/v1/reports/3")).status).toBe("under_review");
  });
});

describe("data mode switch", () => {
  it("routes the calls of lib/api.ts to the demo API in browser mode, without fetch", async () => {
    vi.stubEnv("NEXT_PUBLIC_DATA_MODE", "browser");
    const spy = vi.fn(() => Promise.reject(new Error("fetch must not be called")));
    vi.stubGlobal("fetch", spy);
    const reports = await fetchReports(BBOX, {});
    expect(reports.count).toBe(15);
    expect((await fetchReport("1")).id).toBe(1);
    expect((await fetchCategories()).items).toHaveLength(7);
    expect((await fetchOrganisations()).items).toHaveLength(2);
    expect(await failure(fetchReport("999"))).toMatchObject({ status: 404, code: "report_not_found" });
    expect(spy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("keeps using fetch when the mode is not set", async () => {
    const spy = vi.fn(async () => new Response(JSON.stringify({ items: [] }), { status: 200 }));
    vi.stubGlobal("fetch", spy);
    await fetchCategories();
    expect(spy).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it("adds the base path to public files only in browser mode", async () => {
    const { publicPath, reportHref, normalizePath } = await import("@/lib/paths");
    expect(publicPath("/landing/before.webp")).toBe("/landing/before.webp");
    vi.stubEnv("NEXT_PUBLIC_DATA_MODE", "browser");
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/CleanKg/");
    expect(publicPath("/landing/before.webp")).toBe("/CleanKg/landing/before.webp");
    expect(publicPath("landing/after.webp")).toBe("/CleanKg/landing/after.webp");
    vi.stubEnv("NEXT_PUBLIC_DATA_MODE", "");
    expect(publicPath("/landing/before.webp")).toBe("/landing/before.webp");
    expect(reportHref(16)).toBe("/r?id=16");
    expect(normalizePath("/map/")).toBe("/map");
    expect(normalizePath("/")).toBe("/");
    expect(normalizePath(null)).toBe("");
  });
});
