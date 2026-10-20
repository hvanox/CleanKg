import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { I18nProvider } from "@/i18n";
import type { Report } from "@/lib/types";

export function renderApp(ui: ReactElement, locale: "ru" | "ky" = "ru") {
  window.localStorage.setItem("cleankg-locale", locale);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider>{ui}</I18nProvider>
    </QueryClientProvider>,
  );
}

export function mockFetch(routes: Record<string, unknown | { status: number; body: unknown }>) {
  const calls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    const key = Object.keys(routes).find((route) => url.includes(route));
    if (!key) return new Response(JSON.stringify({ detail: { code: "report_not_found" } }), { status: 404 });
    const value = routes[key] as { status?: number; body?: unknown };
    const failing = typeof value === "object" && value !== null && "status" in value && "body" in value;
    return new Response(JSON.stringify(failing ? value.body : value), {
      status: failing ? (value.status as number) : 200,
    });
  }) as typeof fetch;
  return calls;
}

export function sampleReport(overrides: Partial<Report> = {}): Report {
  return {
    id: 7,
    category: {
      code: "trash_burning",
      label_ru: "Сжигание мусора",
      label_ky: null,
      is_hazardous: false,
      volunteer_allowed: false,
    },
    size: "medium",
    status: "under_review",
    location: { lat: 42.8822, lng: 74.5411 },
    description: "демо: во дворе жгут мусор",
    priority: 89,
    anonymous: true,
    author: "Житель",
    volunteer_eligible: false,
    volunteer_ineligible_reason: "burning",
    is_demo: true,
    created_at: "2026-10-19T08:20:03Z",
    updated_at: "2026-10-19T10:20:03Z",
    counts: { comments: 1, confirmations: 2, resolution_confirmations: 0 },
    timeline: [
      {
        from_status: null,
        to_status: "submitted",
        actor: "Житель",
        actor_kind: "resident",
        comment: null,
        created_at: "2026-10-19T08:20:03Z",
      },
      {
        from_status: "submitted",
        to_status: "under_review",
        actor: "Система",
        actor_kind: "system",
        comment: null,
        created_at: "2026-10-19T10:20:03Z",
      },
    ],
    comments: [
      { id: 1, author: "Житель", text: "демо-комментарий", state: "published", created_at: "2026-10-19T14:20:03Z" },
    ],
    active_claim: null,
    ...overrides,
  };
}

export interface RecordedCall {
  url: string;
  method: string;
  actorId: string | null;
  body: unknown;
}

type Reply = unknown | { status: number; body: unknown };
type Route = [match: string, reply: Reply | ((call: RecordedCall) => Reply)];

/** Method-aware fetch mock. Routes are matched in order by `METHOD url-fragment`, e.g. "PATCH /api/v1/reports/5/status". */
export function mockApi(routes: Route[]) {
  const calls: RecordedCall[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    const headers = new Headers(init?.headers);
    const call: RecordedCall = {
      url,
      method,
      actorId: headers.get("X-Actor-Id"),
      body: init?.body ? JSON.parse(String(init.body)) : null,
    };
    calls.push(call);
    const route = routes.find(([match]) => {
      const [routeMethod, fragment] = match.includes(" ") ? match.split(" ", 2) : ["GET", match];
      return routeMethod === method && url.includes(fragment);
    });
    if (!route) {
      return new Response(JSON.stringify({ detail: { code: "report_not_found" } }), { status: 404 });
    }
    const raw = typeof route[1] === "function" ? route[1](call) : route[1];
    if (raw instanceof Promise) return raw as Promise<Response>; // a request that never answers (loading state)
    const failing = typeof raw === "object" && raw !== null && "status" in raw && "body" in raw;
    return new Response(JSON.stringify(failing ? (raw as { body: unknown }).body : raw), {
      status: failing ? (raw as { status: number }).status : 200,
    });
  }) as typeof fetch;
  return calls;
}

export function collection(reports: Report[]) {
  return {
    type: "FeatureCollection",
    count: reports.length,
    features: reports.map((report) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [report.location.lng, report.location.lat] },
      properties: report,
    })),
  };
}

export const organisations = {
  items: [
    { id: 1, name: "Городская служба вывоза (демо)", type: "municipal", connection_status: "not_connected" },
    { id: 2, name: "Эко-НКО «Арык» (демо)", type: "ngo", connection_status: "not_connected" },
  ],
};
