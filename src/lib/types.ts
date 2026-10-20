// Shapes of the prototype API (prototipe/api/README.md, "Response shape"). No account ids, no phone field.

export const STATUSES = [
  "submitted",
  "under_review",
  "in_progress",
  "resolved",
  "confirmed",
  "disputed",
  "rejected",
] as const;
export type Status = (typeof STATUSES)[number];

export const SIZES = ["small", "medium", "large", "massive"] as const;
export type Size = (typeof SIZES)[number];

export interface Category {
  code: string;
  label_ru: string;
  label_ky: string | null;
  is_hazardous: boolean;
  volunteer_allowed: boolean;
  max_volunteer_size?: string | null;
  hidden_from_volunteers?: boolean;
}

export interface CategoriesResponse {
  items: Category[];
}

export interface TimelineEvent {
  from_status: Status | null;
  to_status: Status;
  actor: string;
  actor_kind: string;
  comment: string | null;
  created_at: string;
}

export interface ReportComment {
  id: number;
  author: string;
  text: string;
  state: string;
  created_at: string;
}

export type ActorKind = "resident" | "volunteer" | "operator" | "moderator" | "system";

/** `organisation` is the demo organisation name for an operator claim, null for a volunteer claim. */
export interface ActiveClaim {
  state: string;
  expires_at: string | null;
  organisation: string | null;
}

export const CONNECTION_STATUSES = ["not_connected", "account", "integrated"] as const;
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];

export interface Organisation {
  id: number;
  name: string;
  type: string;
  connection_status: ConnectionStatus;
}

export interface OrganisationsResponse {
  items: Organisation[];
}

export interface Report {
  id: number;
  category: Pick<Category, "code" | "label_ru" | "label_ky" | "is_hazardous" | "volunteer_allowed">;
  size: Size;
  status: Status;
  location: { lat: number; lng: number };
  description: string;
  /** Present in the API, deliberately never rendered: the API has no four factors (docs/04-tasks/prototype.md, Notes). */
  priority: number;
  anonymous: boolean;
  author: string;
  volunteer_eligible: boolean;
  volunteer_ineligible_reason: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  counts: { comments: number; confirmations: number; resolution_confirmations: number };
  timeline: TimelineEvent[];
  comments: ReportComment[];
  /** Only the detail endpoint returns it; map/list items do not carry it. */
  active_claim?: ActiveClaim | null;
}

export interface ReportFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: Report;
}

export interface ReportFeatureCollection {
  type: "FeatureCollection";
  count: number;
  features: ReportFeature[];
}

export interface ReportInput {
  category: string;
  size: Size;
  lat: number;
  lng: number;
  description: string;
  anonymous: boolean;
}
