// Row types of the in-browser demo store. They mirror prototipe/api/app/models.py (the same tables, the same columns),
// with timestamps as epoch milliseconds so the state is plain JSON. `users` has no phone column at all (HR-7).
import type { Size, Status } from "../types";

export type UserRole = "resident" | "operator" | "volunteer" | "moderator";
export type ActorKindName = "resident" | "volunteer" | "operator" | "moderator" | "system";

export interface UserRow {
  id: number;
  display_name: string | null;
  role: UserRole;
}

export interface OrganisationRow {
  id: number;
  name: string;
  type: string;
  connection_status: string;
}

export interface CategoryRow {
  code: string;
  label_ru: string;
  label_ky: string | null;
  volunteer_allowed: boolean;
  max_volunteer_size: string | null;
  is_hazardous: boolean;
  sort_order: number;
}

export interface ReportRow {
  id: number;
  category_code: string;
  size: Size;
  status: Status;
  lat: number;
  lng: number;
  description: string;
  priority: number;
  anonymous: boolean;
  is_demo: boolean;
  created_by: number;
  created_at: number;
  updated_at: number;
}

export interface EventRow {
  id: number;
  report_id: number;
  actor_id: number | null;
  actor_kind: ActorKindName;
  from_status: Status | null;
  to_status: Status;
  comment: string | null;
  created_at: number;
}

export interface CommentRow {
  id: number;
  report_id: number;
  user_id: number;
  text: string;
  state: string;
  created_at: number;
}

export interface ConfirmationRow {
  id: number;
  report_id: number;
  user_id: number;
  kind: "report" | "resolution";
  comment: string | null;
  created_at: number;
}

export interface ClaimRow {
  id: number;
  report_id: number;
  user_id: number;
  organisation_id: number | null;
  state: string;
  expires_at: number;
  created_at: number;
}

/** The whole store: what the SQLite file is in the API. Persisted as one JSON value in localStorage. */
export interface DemoState {
  version: number;
  users: UserRow[];
  organisations: OrganisationRow[];
  categories: CategoryRow[];
  reports: ReportRow[];
  events: EventRow[];
  comments: CommentRow[];
  confirmations: ConfirmationRow[];
  claims: ClaimRow[];
}
