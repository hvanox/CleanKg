import { ApiError, NETWORK_ERROR, VALIDATION_ERROR } from "./api-error";
import { API_BASE_URL, isBrowserMode } from "./config";
import type {
  ActorKind,
  CategoriesResponse,
  OrganisationsResponse,
  Report,
  ReportFeatureCollection,
  ReportInput,
  Status,
} from "./types";

export { ApiError, NETWORK_ERROR, VALIDATION_ERROR } from "./api-error";

function codeFromBody(status: number, body: unknown): { code: string; message: string; detail: unknown } {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (detail && typeof detail === "object" && !Array.isArray(detail)) {
    const { code, message } = detail as { code?: unknown; message?: unknown };
    if (typeof code === "string") {
      return { code, message: typeof message === "string" ? message : code, detail };
    }
  }
  if (Array.isArray(detail)) {
    return { code: VALIDATION_ERROR, message: "validation", detail };
  }
  return { code: `http_${status}`, message: `HTTP ${status}`, detail };
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { actorId?: string } = {},
): Promise<T> {
  const { actorId, headers, ...rest } = init;

  // NEXT_PUBLIC_DATA_MODE=browser (GitHub Pages build): the same call is answered by the in-browser demo API,
  // which throws the same ApiError. Loaded lazily so the default build does not carry it.
  if (isBrowserMode()) {
    const { demoRequest } = await import("./demo-api");
    return demoRequest<T>(path, {
      method: rest.method,
      body: typeof rest.body === "string" ? rest.body : undefined,
      actorId,
      signal: rest.signal ?? undefined,
    });
  }

  const merged = new Headers(headers);
  if (actorId) merged.set("X-Actor-Id", actorId);
  if (rest.body && !merged.has("Content-Type")) merged.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...rest, headers: merged });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
    throw new ApiError(0, NETWORK_ERROR, "network");
  }

  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!response.ok) {
    const { code, message, detail } = codeFromBody(response.status, body);
    throw new ApiError(response.status, code, message, detail);
  }
  return body as T;
}

export interface ReportFilters {
  status?: Status;
  category?: string;
}

export function fetchReports(
  bbox: string,
  filters: ReportFilters,
  signal?: AbortSignal,
): Promise<ReportFeatureCollection> {
  const params = new URLSearchParams({ bbox });
  if (filters.status) params.set("status", filters.status);
  if (filters.category) params.set("category", filters.category);
  return apiFetch(`/api/v1/reports?${params.toString()}`, { signal });
}

export function fetchReport(id: string, signal?: AbortSignal): Promise<Report> {
  return apiFetch(`/api/v1/reports/${encodeURIComponent(id)}`, { signal });
}

export function fetchCategories(signal?: AbortSignal): Promise<CategoriesResponse> {
  return apiFetch("/api/v1/categories", { signal });
}

export function createReport(input: ReportInput, actorId: string): Promise<Report> {
  return apiFetch("/api/v1/reports", { method: "POST", body: JSON.stringify(input), actorId });
}

export function fetchOrganisations(signal?: AbortSignal): Promise<OrganisationsResponse> {
  return apiFetch("/api/v1/organisations", { signal });
}

export interface StatusChangeBody {
  to_status: Status;
  actor_kind: ActorKind;
  reason?: string;
}

export function changeStatus(id: number, body: StatusChangeBody, actorId: string): Promise<Report> {
  return apiFetch(`/api/v1/reports/${id}/status`, { method: "PATCH", body: JSON.stringify(body), actorId });
}

export interface ClaimBody {
  actor_kind: ActorKind;
  organisation_id?: number;
}

/** Takes the task; the API moves the report to `in_progress` in the same call. */
export function claimReport(id: number, body: ClaimBody, actorId: string): Promise<{ report: Report }> {
  return apiFetch(`/api/v1/reports/${id}/claim`, { method: "POST", body: JSON.stringify(body), actorId });
}
