// Demo personas from prototipe/api/README.md. The X-Actor-Id header value never reaches the UI (HR-7).
export interface Persona {
  key: string;
  name: string;
  actorId: string;
}

export const PERSONAS: readonly Persona[] = [
  { key: "aigul", name: "Айгуль", actorId: "1" },
  { key: "daniyar", name: "Данияр", actorId: "2" },
  { key: "ermek", name: "Эрмек", actorId: "3" },
  { key: "meerim", name: "Мээрим", actorId: "4" },
];

export const DEFAULT_PERSONA_KEY = PERSONAS[0].key;

/**
 * Acting demo personas of S4 and S5. The UI shows only «Оператор · демо» / «Модератор · демо» (string table);
 * the id is the header value for the mock sign-in and is never shown (HR-7).
 * Operator = demo account "2": the API seed holds its operator claims under that account, so only this account can
 * resolve them (prototipe/api/app/seed.py). Moderator = demo account "4": rejections need any known account.
 */
export const OPERATOR_ACTOR = { actorId: "2", actorKind: "operator" } as const;
export const MODERATOR_ACTOR = { actorId: "4", actorKind: "moderator" } as const;
