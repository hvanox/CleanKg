// Error plumbing of the in-browser API: the same `{"detail": {"code", "message", ...}}` bodies as prototipe/api,
// thrown as the ApiError the UI already handles.
import { ApiError, VALIDATION_ERROR } from "../api-error";
import { TransitionError } from "./lifecycle";

/** `HTTPException(status, {"code", "message", **extra})`. */
export function fail(status: number, code: string, message: string, extra: Record<string, unknown> = {}): never {
  throw new ApiError(status, code, message, { code, message, ...extra });
}

/** A TransitionError becomes the HTTP answer the server gives for it. */
export function failFrom(error: TransitionError): never {
  throw new ApiError(error.statusCode, error.code, error.message, error.asDetail());
}

export function unprocessable(code: string, message: string, extra: Record<string, unknown> = {}): never {
  return fail(422, code, message, extra);
}

export interface SchemaIssue {
  loc: (string | number)[];
  msg: string;
  type: string;
}

/** FastAPI's 422 list `{"detail": [{"loc", "msg", "type"}]}`, without `input` and `ctx` (QA-P01 D4). */
export function schemaError(issues: SchemaIssue[]): never {
  throw new ApiError(422, VALIDATION_ERROR, "validation", issues);
}
