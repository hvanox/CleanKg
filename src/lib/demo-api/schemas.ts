// Request validation, the counterpart of prototipe/api/app/schemas.py (pydantic): wrong or missing fields are a 422
// schema-error list, and the offending value is never echoed back.
import type { Size, Status } from "../types";
import { MAX_ID, SETTINGS } from "./config";
import { schemaError, type SchemaIssue } from "./http";
import type { ActorKindName } from "./types";

export const SIZE_VALUES = ["small", "medium", "large", "massive"] as const;
export const STATUS_VALUES = [
  "submitted",
  "under_review",
  "in_progress",
  "resolved",
  "confirmed",
  "disputed",
  "rejected",
] as const;
export const ACTOR_KIND_VALUES = ["resident", "volunteer", "operator", "moderator", "system"] as const;
export const CONFIRMATION_KINDS = ["report", "resolution"] as const;

export interface ReportCreate {
  category: string;
  size: Size;
  lat: number;
  lng: number;
  description: string;
  anonymous: boolean;
}
export interface StatusUpdate {
  to_status: Status;
  actor_kind: ActorKindName;
  reason: string | null;
  comment: string | null;
}
export interface CommentCreate {
  text: string;
}
export interface ConfirmationCreate {
  kind: "report" | "resolution";
  comment: string | null;
}
export interface ClaimCreate {
  actor_kind: ActorKindName;
  organisation_id: number | null;
  comment: string | null;
}

/** Length in code points, as Python's `len`. */
const length = (text: string) => [...text].length;

class Reader {
  readonly issues: SchemaIssue[] = [];

  constructor(
    private readonly body: Record<string, unknown>,
    private readonly scope: string,
  ) {}

  private add(field: string, msg: string, type: string) {
    this.issues.push({ loc: [this.scope, field], msg, type });
  }

  string(field: string, { min = 0, max = Infinity, required = true } = {}): string | undefined {
    const value = this.body[field];
    if (value === undefined) {
      if (required) this.add(field, "Field required", "missing");
      return undefined;
    }
    if (typeof value !== "string") {
      this.add(field, "Input should be a valid string", "string_type");
      return undefined;
    }
    if (length(value) < min) this.add(field, `String should have at least ${min} character`, "string_too_short");
    else if (length(value) > max) this.add(field, `String should have at most ${max} characters`, "string_too_long");
    return value;
  }

  optionalString(field: string, max: number): string | null {
    const value = this.body[field];
    if (value === undefined || value === null) return null;
    return this.string(field, { max }) ?? null;
  }

  number(field: string, min: number, max: number): number | undefined {
    const value = this.body[field];
    if (value === undefined) {
      this.add(field, "Field required", "missing");
      return undefined;
    }
    if (typeof value !== "number" || !Number.isFinite(value)) {
      this.add(field, "Input should be a valid number", "float_type");
      return undefined;
    }
    if (value < min) this.add(field, `Input should be greater than or equal to ${min}`, "greater_than_equal");
    else if (value > max) this.add(field, `Input should be less than or equal to ${max}`, "less_than_equal");
    return value;
  }

  optionalInt(field: string, min: number, max: number): number | null {
    const value = this.body[field];
    if (value === undefined || value === null) return null;
    if (typeof value !== "number" || !Number.isInteger(value)) {
      this.add(field, "Input should be a valid integer", "int_type");
      return null;
    }
    if (value < min) this.add(field, `Input should be greater than or equal to ${min}`, "greater_than_equal");
    else if (value > max) this.add(field, `Input should be less than or equal to ${max}`, "less_than_equal");
    return value;
  }

  boolean(field: string, fallback: boolean): boolean {
    const value = this.body[field];
    if (value === undefined) return fallback;
    if (typeof value !== "boolean") {
      this.add(field, "Input should be a valid boolean", "bool_type");
      return fallback;
    }
    return value;
  }

  choice<T extends string>(field: string, values: readonly T[], fallback?: T): T | undefined {
    const value = this.body[field];
    if (value === undefined) {
      if (fallback === undefined) this.add(field, "Field required", "missing");
      return fallback;
    }
    if (typeof value !== "string" || !(values as readonly string[]).includes(value)) {
      this.add(field, `Input should be ${values.map((v) => `'${v}'`).join(", ")}`, "enum");
      return fallback;
    }
    return value as T;
  }

  done(): void {
    if (this.issues.length > 0) schemaError(this.issues);
  }
}

/** JSON body of a request: an object, or a 422 (`json_invalid`, `missing`, `model_attributes_type`). */
export function parseBody(raw: string | undefined): Record<string, unknown> {
  if (raw === undefined || raw === "") {
    return schemaError([{ loc: ["body"], msg: "Field required", type: "missing" }]);
  }
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return schemaError([{ loc: ["body"], msg: "JSON decode error", type: "json_invalid" }]);
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return schemaError([{ loc: ["body"], msg: "Input should be a valid dictionary", type: "model_attributes_type" }]);
  }
  return value as Record<string, unknown>;
}

export function reportCreate(body: Record<string, unknown>): ReportCreate {
  const r = new Reader(body, "body");
  const category = r.string("category", { min: 1, max: 64 });
  const size = r.choice("size", SIZE_VALUES);
  const lat = r.number("lat", -90, 90);
  const lng = r.number("lng", -180, 180);
  const description = r.string("description", { min: 1, max: SETTINGS.descriptionMaxLength });
  const anonymous = r.boolean("anonymous", false);
  r.done();
  return { category: category!, size: size!, lat: lat!, lng: lng!, description: description!, anonymous };
}

export function statusUpdate(body: Record<string, unknown>): StatusUpdate {
  const r = new Reader(body, "body");
  const toStatus = r.choice("to_status", STATUS_VALUES);
  const actorKind = r.choice("actor_kind", ACTOR_KIND_VALUES, "resident");
  const reason = r.optionalString("reason", 40);
  const comment = r.optionalString("comment", SETTINGS.commentMaxLength);
  r.done();
  return { to_status: toStatus!, actor_kind: actorKind!, reason, comment };
}

export function commentCreate(body: Record<string, unknown>): CommentCreate {
  const r = new Reader(body, "body");
  const text = r.string("text", { min: 1, max: SETTINGS.commentMaxLength });
  r.done();
  return { text: text! };
}

export function confirmationCreate(body: Record<string, unknown>): ConfirmationCreate {
  const r = new Reader(body, "body");
  const kind = r.choice("kind", CONFIRMATION_KINDS, "report");
  const comment = r.optionalString("comment", SETTINGS.commentMaxLength);
  r.done();
  return { kind: kind!, comment };
}

export function claimCreate(body: Record<string, unknown>): ClaimCreate {
  const r = new Reader(body, "body");
  const actorKind = r.choice("actor_kind", ACTOR_KIND_VALUES, "volunteer");
  const organisationId = r.optionalInt("organisation_id", 1, MAX_ID);
  const comment = r.optionalString("comment", SETTINGS.commentMaxLength);
  r.done();
  return { actor_kind: actorKind!, organisation_id: organisationId, comment };
}

/** `{report_id}` of the path: an integer from 1 to 2147483647, otherwise a 422 and never a 500. */
export function reportId(raw: string): number {
  const text = (() => {
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  })();
  if (!/^[+-]?\d+$/.test(text)) {
    return schemaError([
      { loc: ["path", "report_id"], msg: "Input should be a valid integer, unable to parse string as an integer", type: "int_parsing" },
    ]);
  }
  const id = Number(text);
  if (id < 1) {
    return schemaError([
      { loc: ["path", "report_id"], msg: "Input should be greater than or equal to 1", type: "greater_than_equal" },
    ]);
  }
  if (id > MAX_ID) {
    return schemaError([
      { loc: ["path", "report_id"], msg: `Input should be less than or equal to ${MAX_ID}`, type: "less_than_equal" },
    ]);
  }
  return id;
}

export interface ListQuery {
  bbox: string | null;
  status: Status | null;
  category: string | null;
  limit: number;
}

export function listQuery(params: URLSearchParams): ListQuery {
  const issues: SchemaIssue[] = [];
  const status = params.get("status");
  if (status !== null && !(STATUS_VALUES as readonly string[]).includes(status)) {
    issues.push({ loc: ["query", "status"], msg: `Input should be ${STATUS_VALUES.map((v) => `'${v}'`).join(", ")}`, type: "enum" });
  }
  let limit: number = SETTINGS.mapResultLimit;
  const rawLimit = params.get("limit");
  if (rawLimit !== null) {
    if (!/^[+-]?\d+$/.test(rawLimit.trim())) {
      issues.push({ loc: ["query", "limit"], msg: "Input should be a valid integer, unable to parse string as an integer", type: "int_parsing" });
    } else {
      limit = Number(rawLimit);
      if (limit < 1) issues.push({ loc: ["query", "limit"], msg: "Input should be greater than or equal to 1", type: "greater_than_equal" });
      else if (limit > SETTINGS.mapResultLimit) {
        issues.push({ loc: ["query", "limit"], msg: `Input should be less than or equal to ${SETTINGS.mapResultLimit}`, type: "less_than_equal" });
      }
    }
  }
  if (issues.length > 0) schemaError(issues);
  return { bbox: params.get("bbox"), status: status as Status | null, category: params.get("category"), limit };
}
