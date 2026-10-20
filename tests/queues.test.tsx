import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Banner } from "@/components/Banner";
import { ModQueue } from "@/components/ModQueue";
import { OrgQueue } from "@/components/OrgQueue";
import { RejectDialog } from "@/components/RejectDialog";
import { ky } from "@/i18n/ky";
import { ru } from "@/i18n/ru";
import { DEMO_SERVICE_AREA } from "@/lib/config";
import {
  APPROVE_ACTOR_KIND,
  MODERATION_STATUSES,
  REJECT_REASONS,
  assigneeOf,
  moderatorActions,
  operatorActions,
  rejectBody,
  rejectionReasonOf,
  sortQueue,
} from "@/lib/queue";
import { STATUSES, type Report, type Status } from "@/lib/types";
import { collection, mockApi, organisations, renderApp, sampleReport } from "./helpers";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

const base: Partial<Report> = {
  category: { code: "illegal_dump", label_ru: "Стихийная свалка", label_ky: null, is_hazardous: false, volunteer_allowed: true },
  volunteer_eligible: true,
  volunteer_ineligible_reason: null,
  anonymous: false,
  author: "Айгуль",
  timeline: [],
  comments: [],
  active_claim: null,
};

function report(id: number, status: Status, priority: number, overrides: Partial<Report> = {}): Report {
  return sampleReport({
    ...base,
    id,
    status,
    priority,
    created_at: "2026-10-19T08:20:03Z",
    ...overrides,
  });
}

function rowOf(id: number): HTMLElement {
  const row = document.querySelector<HTMLElement>(`tr[data-report-id="${id}"]`);
  if (!row) throw new Error(`no row for report ${id}`);
  return row;
}

const buttonNames = (row: HTMLElement) => within(row).queryAllByRole("button").map((button) => button.getAttribute("aria-label"));

describe("fixed lists and rules (lib/queue)", () => {
  it("the reject-reason list has exactly four entries and no `other`", () => {
    expect(REJECT_REASONS).toEqual(["duplicate", "not_waste", "private_property", "spam"]);
    expect(REJECT_REASONS).not.toContain("other");
    expect(Object.keys(ru.mod.reasons)).toEqual([...REJECT_REASONS]);
    expect(Object.keys(ky.mod.reasons)).toEqual([...REJECT_REASONS]);
  });

  it("a rejection body carries the reason code only, never free text", () => {
    expect(rejectBody("spam")).toEqual({ to_status: "rejected", actor_kind: "moderator", reason: "spam" });
    expect(() => rejectBody("other" as never)).toThrow();
    expect(rejectionReasonOf("reason: not_waste")).toBe("not_waste");
    expect(rejectionReasonOf("reason: other; text")).toBeNull();
  });

  it("the operator is offered only transitions the lifecycle allows", () => {
    const offered = Object.fromEntries(
      STATUSES.map((status) => [
        status,
        {
          none: operatorActions(status, "none"),
          volunteer: operatorActions(status, "volunteer"),
          operator: operatorActions(status, "operator"),
        },
      ]),
    );
    expect(offered.under_review).toEqual({ none: ["claim"], volunteer: ["claim"], operator: ["claim"] });
    expect(offered.in_progress).toEqual({ none: [], volunteer: [], operator: ["resolve"] });
    for (const status of ["submitted", "resolved", "confirmed", "disputed", "rejected"] as const) {
      expect(offered[status]).toEqual({ none: [], volunteer: [], operator: [] });
    }
  });

  it("the moderator is offered approve on submitted and reject on under_review only", () => {
    expect(moderatorActions("submitted")).toEqual(["approve"]);
    expect(moderatorActions("under_review")).toEqual(["reject"]);
    for (const status of STATUSES.filter((s) => !MODERATION_STATUSES.includes(s))) {
      expect(moderatorActions(status)).toEqual([]);
    }
    expect(APPROVE_ACTOR_KIND).toBe("system");
  });

  it("sorts by priority, then age (older first), then id", () => {
    const rows = [
      { id: 1, priority: 50, created_at: "2026-10-19T08:00:00Z" },
      { id: 2, priority: 90, created_at: "2026-10-19T09:00:00Z" },
      { id: 3, priority: 50, created_at: "2026-10-18T08:00:00Z" },
      { id: 4, priority: 50, created_at: "2026-10-18T08:00:00Z" },
    ];
    expect(sortQueue(rows).map((row) => row.id)).toEqual([2, 3, 4, 1]);
  });

  it("reads the assignee kind from the claim and the in_progress event, nothing else", () => {
    const event = (actor_kind: string) => ({ from_status: "under_review" as const, to_status: "in_progress" as const, actor: "x", actor_kind, comment: null, created_at: "2026-10-19T08:00:00Z" });
    const claim = { state: "active", expires_at: null, organisation: null };
    expect(assigneeOf({ active_claim: null, timeline: [event("operator")] })).toBe("none");
    expect(assigneeOf({ active_claim: claim, timeline: [event("operator")] })).toBe("operator");
    expect(assigneeOf({ active_claim: claim, timeline: [event("volunteer")] })).toBe("volunteer");
    expect(assigneeOf({ active_claim: claim, timeline: [event("system")] })).toBe("none");
  });
});

describe("RejectDialog", () => {
  it("offers the four fixed reasons as radios, no text field, and confirms with the reason only", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    renderApp(<RejectDialog reportId={9} pending={false} error={null} onCancel={() => {}} onConfirm={onConfirm} />);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getAllByRole("radio")).toHaveLength(4);
    for (const reason of REJECT_REASONS) {
      expect(within(dialog).getByRole("radio", { name: ru.mod.reasons[reason] })).toBeInTheDocument();
    }
    expect(within(dialog).queryByRole("textbox")).toBeNull();
    expect(dialog.querySelector("textarea, input[type='text']")).toBeNull();
    const confirm = within(dialog).getByRole("button", { name: ru.mod.dialog.confirm });
    expect(confirm).toBeDisabled();
    expect(within(dialog).getByText(ru.mod.dialog.reasonMissing)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("radio", { name: ru.mod.reasons.duplicate }));
    expect(confirm).toBeEnabled();
    await user.click(confirm);
    expect(onConfirm).toHaveBeenCalledWith("duplicate");
  });
});

describe("S5 ModQueue", () => {
  const submitted = report(201, "submitted", 52, { anonymous: true, author: "Житель" });
  const reviewHigh = report(202, "under_review", 91);
  const reviewLow = report(203, "under_review", 63);

  function setup() {
    return mockApi([
      ["PATCH /api/v1/reports/201/status", { id: 201, status: "under_review" }],
      ["PATCH /api/v1/reports/202/status", { id: 202, status: "rejected" }],
      ["status=submitted", collection([submitted])],
      ["status=under_review", collection([reviewLow, reviewHigh])],
    ]);
  }

  it("lists the queue in priority order with the right row actions and no forbidden controls", async () => {
    const calls = setup();
    renderApp(<ModQueue />);
    await screen.findByText(ru.mod.title);
    await waitFor(() => expect(document.querySelectorAll("tbody tr")).toHaveLength(3));
    const ids = [...document.querySelectorAll("tbody tr")].map((row) => row.getAttribute("data-report-id"));
    expect(ids).toEqual(["202", "203", "201"]);

    expect(buttonNames(rowOf(201))).toEqual([`${ru.mod.actionApprove}, ${ru.card.reportNo.replace("{id}", "201")}`]);
    expect(buttonNames(rowOf(202))).toEqual([`${ru.mod.actionReject}, ${ru.card.reportNo.replace("{id}", "202")}`]);

    expect(screen.queryByRole("button", { name: /удалить|delete|все|all|объедин|merge/i })).toBeNull();
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.getByText(ru.mod.mergeNote)).toBeInTheDocument();
    expect(screen.getByText(ru.mod.approveNote)).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(calls.filter((call) => call.method === "GET").every((call) => call.url.includes(`bbox=${encodeURIComponent(DEMO_SERVICE_AREA.bbox)}`))).toBe(true);
  });

  it("renders no priority score, no phone or email, and keeps anonymous authors out", async () => {
    setup();
    const { container } = renderApp(<ModQueue />);
    await waitFor(() => expect(document.querySelectorAll("tbody tr")).toHaveLength(3));
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/(^|\D)(91|63|52)(\D|$)/);
    expect(text).not.toMatch(/\+?\d[\d\s()-]{8,}\d/);
    expect(text).not.toMatch(/@/);
    expect(text).not.toMatch(/Айгуль|Данияр|Эрмек|Мээрим/);
    expect(text).toContain(ru.moderatorName);
    expect(text).toContain("демо");
  });

  it("rejects with a reason from the list as the moderator persona", async () => {
    const calls = setup();
    const user = userEvent.setup();
    renderApp(<ModQueue />);
    await waitFor(() => expect(document.querySelectorAll("tbody tr")).toHaveLength(3));
    await user.click(within(rowOf(202)).getByRole("button"));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("radio", { name: ru.mod.reasons.not_waste }));
    await user.click(within(dialog).getByRole("button", { name: ru.mod.dialog.confirm }));
    await waitFor(() => expect(calls.some((call) => call.method === "PATCH")).toBe(true));
    const patch = calls.find((call) => call.method === "PATCH");
    expect(patch?.url).toContain("/api/v1/reports/202/status");
    expect(patch?.body).toEqual({ to_status: "rejected", actor_kind: "moderator", reason: "not_waste" });
    expect(patch?.actorId).toBe("4");
    await screen.findByText(/Жалоба № 202: отклонена/);
  });

  it("approves a submitted report with the stand-in system step", async () => {
    const calls = setup();
    const user = userEvent.setup();
    renderApp(<ModQueue />);
    await waitFor(() => expect(document.querySelectorAll("tbody tr")).toHaveLength(3));
    await user.click(within(rowOf(201)).getByRole("button"));
    await waitFor(() => expect(calls.some((call) => call.method === "PATCH")).toBe(true));
    const patch = calls.find((call) => call.method === "PATCH");
    expect(patch?.body).toEqual({ to_status: "under_review", actor_kind: "system" });
    expect(patch?.actorId).toBe("4");
  });

  it("shows the empty, error and loading states with the demo mark", async () => {
    mockApi([["status=", collection([])]]);
    const empty = renderApp(<ModQueue />);
    await screen.findByText(ru.mod.empty);
    expect(empty.container.querySelector(".kg-demo-chip")).not.toBeNull();
    empty.unmount();

    mockApi([["status=", { status: 500, body: { detail: { code: "http_500" } } }]]);
    const failed = renderApp(<ModQueue />);
    await screen.findByRole("alert");
    expect(failed.container.querySelector(".kg-demo-chip")).not.toBeNull();
    failed.unmount();

    mockApi([["status=", new Promise(() => {})]]);
    renderApp(<ModQueue />);
    expect(screen.getByText(ru.queue.loading)).toBeInTheDocument();
  });

  it("renders in Kyrgyz", async () => {
    setup();
    renderApp(<ModQueue />, "ky");
    await screen.findByText(ky.mod.title);
    await waitFor(() => expect(document.querySelectorAll("tbody tr")).toHaveLength(3));
  });
});

describe("S4 OrgQueue", () => {
  const rows = [
    report(101, "submitted", 77),
    report(102, "under_review", 58, {
      category: { code: "trash_burning", label_ru: "Сжигание мусора", label_ky: null, is_hazardous: false, volunteer_allowed: false },
      volunteer_eligible: false,
      volunteer_ineligible_reason: "burning",
    }),
    report(103, "in_progress", 47),
    report(104, "in_progress", 33),
    report(105, "resolved", 29),
    report(106, "confirmed", 52),
    report(107, "disputed", 63),
    report(108, "rejected", 44),
  ];

  const timeline = (kind: string) => [
    { from_status: "under_review" as const, to_status: "in_progress" as const, actor: "x", actor_kind: kind, comment: null, created_at: "2026-10-19T10:00:00Z" },
  ];

  function setup() {
    return mockApi([
      ["POST /api/v1/reports/102/claim", { report: { id: 102, status: "in_progress" }, claim: {} }],
      ["PATCH /api/v1/reports/103/status", { id: 103, status: "resolved" }],
      ["/api/v1/organisations", organisations],
      ["/api/v1/reports/103", report(103, "in_progress", 47, { timeline: timeline("operator"), active_claim: { state: "active", expires_at: null, organisation: "Демо" } })],
      ["/api/v1/reports/104", report(104, "in_progress", 33, { timeline: timeline("volunteer"), active_claim: { state: "active", expires_at: null, organisation: null } })],
      ["/api/v1/reports?", collection(rows)],
    ]);
  }

  async function ready() {
    await waitFor(() => expect(document.querySelectorAll("tbody tr")).toHaveLength(8));
    await screen.findByText(ru.rail.connection.not_connected);
    await within(rowOf(103)).findByText(ru.queue.assignee.operator);
  }

  const rail = () => within(screen.getByRole("complementary", { name: ru.rail.label }));

  it("every row has a status chip and the operator sees only allowed actions", async () => {
    setup();
    renderApp(<OrgQueue />);
    await ready();
    for (const row of document.querySelectorAll("tbody tr")) {
      expect(row.querySelector(".kg-chip--status")).not.toBeNull();
    }
    const no = (id: number) => ru.card.reportNo.replace("{id}", String(id));
    expect(buttonNames(rowOf(101))).toEqual([]);
    expect(buttonNames(rowOf(102))).toEqual([`${ru.org.actionClaim}, ${no(102)}`]);
    expect(buttonNames(rowOf(103))).toEqual([`${ru.org.actionResolve}, ${no(103)}`]);
    expect(buttonNames(rowOf(104))).toEqual([]);
    for (const id of [105, 106, 107, 108]) expect(buttonNames(rowOf(id))).toEqual([]);
    expect(within(rowOf(104)).getByText(ru.queue.assignee.volunteer)).toBeInTheDocument();
    expect(within(rowOf(103)).getByText(ru.queue.assignee.operator)).toBeInTheDocument();
  });

  it("has no bulk action, no priority score, no phone, no person's name", async () => {
    setup();
    const { container } = renderApp(<OrgQueue />);
    await ready();
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByRole("button", { name: /все|all|выбранн|selected|удалить|export|csv/i })).toBeNull();
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/(^|\D)(77|58|47|33|29|52|63|44)(\D|$)/);
    expect(text).not.toMatch(/\+?\d[\d\s()-]{8,}\d/);
    expect(text).not.toMatch(/@/);
    expect(text).not.toMatch(/Айгуль|Данияр|Эрмек|Мээрим/);
  });

  it("shows the demo account state and no connection claim", async () => {
    setup();
    const { container } = renderApp(<OrgQueue />);
    await ready();
    expect(rail().getByText(ru.rail.stateValue)).toBeInTheDocument();
    expect(rail().getByText(ru.operatorName)).toBeInTheDocument();
    expect(rail().getByText(ru.rail.cityConnection).nextElementSibling).toHaveTextContent(ru.rail.connection.not_connected);
    expect(container.textContent).not.toMatch(/интеграц|партн|логотип|Мой город/i);
    expect(container.querySelector("img")).toBeNull();
  });

  it("queries only the fixed demo area and offers no area filter", async () => {
    const calls = setup();
    renderApp(<OrgQueue />);
    await ready();
    const listCalls = calls.filter((call) => call.url.includes("/api/v1/reports?"));
    expect(listCalls.length).toBeGreaterThan(0);
    for (const call of listCalls) expect(call.url).toContain(`bbox=${encodeURIComponent(DEMO_SERVICE_AREA.bbox)}`);
    const selects = screen.getAllByRole("combobox");
    expect(selects).toHaveLength(1);
    expect(selects[0]).toHaveAccessibleName(ru.map.filterStatus);
  });

  it("claims and resolves as the operator persona", async () => {
    const calls = setup();
    const user = userEvent.setup();
    renderApp(<OrgQueue />);
    await ready();
    await user.click(within(rowOf(102)).getByRole("button"));
    await waitFor(() => expect(calls.some((call) => call.method === "POST")).toBe(true));
    const post = calls.find((call) => call.method === "POST");
    expect(post?.url).toContain("/api/v1/reports/102/claim");
    expect(post?.body).toEqual({ actor_kind: "operator", organisation_id: 1 });
    expect(post?.actorId).toBe("2");

    await user.click(within(rowOf(103)).getByRole("button"));
    await waitFor(() => expect(calls.some((call) => call.method === "PATCH")).toBe(true));
    const patch = calls.find((call) => call.method === "PATCH");
    expect(patch?.body).toEqual({ to_status: "resolved", actor_kind: "operator" });
    expect(patch?.actorId).toBe("2");
  });

  it("shows an API refusal by its code", async () => {
    mockApi([
      ["PATCH /api/v1/reports/103/status", { status: 409, body: { detail: { code: "claim_required", message: "x" } } }],
      ["/api/v1/organisations", organisations],
      ["/api/v1/reports/103", report(103, "in_progress", 47, { timeline: timeline("operator"), active_claim: { state: "active", expires_at: null, organisation: "Демо" } })],
      ["/api/v1/reports?", collection([report(103, "in_progress", 47)])],
    ]);
    const user = userEvent.setup();
    renderApp(<OrgQueue />);
    await waitFor(() => expect(document.querySelectorAll("tbody tr")).toHaveLength(1));
    const button = await within(rowOf(103)).findByRole("button");
    await user.click(button);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("claim_required");
    expect(alert).toHaveTextContent(ru.errors.claim_required);
  });

  it("shows the empty and error states with the demo mark", async () => {
    mockApi([["/api/v1/organisations", organisations], ["/api/v1/reports?", collection([])]]);
    const empty = renderApp(<OrgQueue />);
    await screen.findByText(ru.org.empty);
    expect(empty.container.querySelector(".kg-demo-chip")).not.toBeNull();
    empty.unmount();

    mockApi([["/api/v1/organisations", organisations], ["/api/v1/reports?", { status: 500, body: {} }]]);
    const failed = renderApp(<OrgQueue />);
    await screen.findByRole("alert");
    expect(failed.container.querySelector(".kg-demo-chip")).not.toBeNull();
  });

  it("does not claim a connection when the organisation request fails", async () => {
    mockApi([["/api/v1/organisations", { status: 500, body: {} }], ["/api/v1/reports?", collection([report(101, "submitted", 77)])]]);
    const { container } = renderApp(<OrgQueue />);
    const connection = (await screen.findByText(ru.rail.cityConnection)).nextElementSibling;
    await waitFor(() => expect(connection).toHaveTextContent(ru.rail.connectionUnknown));
    expect(connection).not.toHaveTextContent(ru.rail.connection.account);
    expect(connection).not.toHaveTextContent(ru.rail.connection.integrated);
    expect(container.textContent).not.toContain(ru.rail.connection.integrated);
  });
});

describe("Banner on operator surfaces", () => {
  it("adds the account segment on /org and /mod only", () => {
    pathname = "/org";
    const org = renderApp(<Banner />);
    expect(screen.getByText(ru.banner.accountSegment)).toBeInTheDocument();
    org.unmount();
    pathname = "/mod";
    const mod = renderApp(<Banner />);
    expect(screen.getByText(ru.banner.accountSegment)).toBeInTheDocument();
    mod.unmount();
    pathname = "/";
    renderApp(<Banner />);
    expect(screen.queryByText(ru.banner.accountSegment)).toBeNull();
    expect(screen.getByText(ru.banner.text)).toBeInTheDocument();
  });
});
