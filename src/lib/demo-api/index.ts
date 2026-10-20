// In-browser demo API (task FE-P04): answers the calls of src/lib/api.ts when NEXT_PUBLIC_DATA_MODE=browser, so the
// prototype can run as a static site (GitHub Pages). It reproduces prototipe/api: same seed, lifecycle matrix, actor rules,
// volunteer eligibility, phone/email refusal, public shapes, error codes and statuses. State lives in localStorage per visitor.
//
// Not the production backend and not a security boundary: anything stored in the browser can be edited by its owner.
import { ApiError } from "../api-error";
import {
  addComment,
  addConfirmation,
  changeStatus,
  claimReport,
  createReport,
  getActor,
  getReportDetail,
  listCategories,
  listOrganisations,
  listReports,
} from "./handlers";
import {
  claimCreate,
  commentCreate,
  confirmationCreate,
  listQuery,
  parseBody,
  reportCreate,
  reportId,
  statusUpdate,
} from "./schemas";
import { loadState, saveState } from "./store";
import type { DemoState } from "./types";

export { resetDemoState } from "./store";
export { STORAGE_KEY } from "./config";

export interface DemoRequestInit {
  method?: string;
  /** JSON text, as `fetch` would send it. */
  body?: string;
  /** Value of the `X-Actor-Id` header. */
  actorId?: string;
  signal?: AbortSignal;
}

type Handler = (state: DemoState) => unknown;

/** Matches the request like the FastAPI routes do; `null` means no such path. Writes are persisted only when the handler returns. */
function route(method: string, path: string, init: DemoRequestInit): { handler: Handler; write: boolean } | null {
  const url = new URL(path, "http://demo.invalid");
  const segments = url.pathname.split("/").filter(Boolean);
  const [root, version, resource, id, sub] = segments;
  const wrongMethod = (): never => fail405(method);

  if (segments.length === 1 && root === "health") {
    if (method !== "GET") wrongMethod();
    return { handler: () => ({ status: "ok", service: "cleankg-api", demo: true, database: "browser" }), write: false };
  }
  if (root !== "api" || version !== "v1") return null;

  if (segments.length === 3 && resource === "categories") {
    if (method !== "GET") wrongMethod();
    return { handler: listCategories, write: false };
  }
  if (segments.length === 3 && resource === "organisations") {
    if (method !== "GET") wrongMethod();
    return { handler: listOrganisations, write: false };
  }
  if (resource !== "reports") return null;

  if (segments.length === 3) {
    if (method === "GET") {
      return { handler: (state) => listReports(state, listQuery(url.searchParams)), write: false };
    }
    if (method === "POST") {
      return {
        handler: (state) => {
          const actor = getActor(state, init.actorId);
          const payload = reportCreate(parseBody(init.body));
          return createReport(state, actor, payload);
        },
        write: true,
      };
    }
    return wrongMethod();
  }

  if (segments.length === 4) {
    if (method !== "GET") wrongMethod();
    return { handler: (state) => getReportDetail(state, reportId(id)), write: false };
  }

  if (segments.length === 5) {
    if (sub === "status") {
      if (method !== "PATCH") wrongMethod();
      return {
        handler: (state) => {
          const actor = getActor(state, init.actorId);
          const rid = reportId(id);
          return changeStatus(state, actor, rid, statusUpdate(parseBody(init.body)));
        },
        write: true,
      };
    }
    if (sub === "comments") {
      if (method !== "POST") wrongMethod();
      return {
        handler: (state) => {
          const actor = getActor(state, init.actorId);
          const rid = reportId(id);
          return addComment(state, actor, rid, commentCreate(parseBody(init.body)));
        },
        write: true,
      };
    }
    if (sub === "confirmations") {
      if (method !== "POST") wrongMethod();
      return {
        handler: (state) => {
          const actor = getActor(state, init.actorId);
          const rid = reportId(id);
          return addConfirmation(state, actor, rid, confirmationCreate(parseBody(init.body)));
        },
        write: true,
      };
    }
    if (sub === "claim") {
      if (method !== "POST") wrongMethod();
      return {
        handler: (state) => {
          const actor = getActor(state, init.actorId);
          const rid = reportId(id);
          return claimReport(state, actor, rid, claimCreate(parseBody(init.body)));
        },
        write: true,
      };
    }
  }
  return null;
}

function fail405(method: string): never {
  throw new ApiError(405, "http_405", "HTTP 405", `Method ${method} Not Allowed`);
}

/**
 * Answers one API call. Resolves with the JSON body or throws the ApiError the fetch path would throw for the same answer.
 * A request that throws leaves the stored state untouched (the server's rollback).
 */
export async function demoRequest<T>(path: string, init: DemoRequestInit = {}): Promise<T> {
  if (init.signal?.aborted) throw new DOMException("The operation was aborted.", "AbortError");
  const method = (init.method ?? "GET").toUpperCase();

  const matched = route(method, path, init);
  if (!matched) throw new ApiError(404, "http_404", "HTTP 404", "Not Found");

  const state = loadState();
  const result = matched.handler(state);
  if (matched.write) saveState(state);
  // A JSON round trip: the caller gets a plain copy, never a reference into the store.
  return JSON.parse(JSON.stringify(result)) as T;
}
