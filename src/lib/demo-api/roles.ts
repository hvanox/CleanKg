// Port of prototipe/api/app/roles.py: mock RBAC. The acting role comes from the account, never from the request body
// (QA-P01 D2). The client may send `actor_kind`, but it is only a statement of intent, checked against the account role.
import { TransitionError, findTransition } from "./lifecycle";
import type { ActorKindName, UserRow } from "./types";

// Every account may act as a plain resident (report, comment, confirm, dispute).
const KINDS_BY_ROLE: Record<string, readonly ActorKindName[]> = {
  resident: ["resident"],
  volunteer: ["resident", "volunteer"],
  operator: ["resident", "operator"],
  // `system` is only a stand-in for a moderator account, see STAND_IN_TRANSITIONS.
  moderator: ["resident", "moderator", "system"],
};

// The prototype has no AI step and no scheduler, so a moderator account may perform these two `system` transitions by
// hand. The event is recorded as `moderator`, not as `system`, so the history stays honest.
const STAND_IN_TRANSITIONS: readonly (readonly [string, string])[] = [
  ["submitted", "under_review"],
  ["disputed", "in_progress"],
];

function kindsOf(user: UserRow): readonly ActorKindName[] {
  return KINDS_BY_ROLE[user.role] ?? ["resident"];
}

function notAllowed(user: UserRow): TransitionError {
  return new TransitionError(403, "actor_not_allowed", "Ваша учётная запись не может действовать в этой роли.", {
    allowed_actors: [...kindsOf(user)].sort(),
  });
}

/** Refuses a role the account does not hold. */
export function requireActorKind(user: UserRow, requested: string): void {
  if (!(kindsOf(user) as readonly string[]).includes(requested)) throw notAllowed(user);
}

/** Returns `[kind the matrix checks, kind written to the timeline]`. */
export function resolveStatusActor(
  user: UserRow,
  requested: ActorKindName,
  source: string,
  target: string,
): [ActorKindName, ActorKindName] {
  requireActorKind(user, requested);
  if (requested === "system") {
    const inMatrix = findTransition(source, target) !== undefined;
    const standIn = STAND_IN_TRANSITIONS.some(([from, to]) => from === source && to === target);
    if (inMatrix && !standIn) throw notAllowed(user);
    return ["system", "moderator"];
  }
  return [requested, requested];
}
