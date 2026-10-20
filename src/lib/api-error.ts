/** An API failure, identified by the `code` of `{"detail": {"code": ...}}`. Shared by the fetch path and the in-browser demo API. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  /** The raw `detail` of the error body (object with `code`, `message` and extras such as `allowed`, or a schema error list). */
  readonly detail: unknown;

  constructor(status: number, code: string, message: string, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

/** Codes the UI has a message for; anything else falls back to `generic`. */
export const NETWORK_ERROR = "network_error";
export const VALIDATION_ERROR = "validation_error";
