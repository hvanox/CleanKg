// Thresholds of the prototype API (prototipe/api/app/config.py), which mirrors
// Docs/02-product/requirements.md#parameters-in-one-place. Values are not redefined here as new facts: same numbers, same home.

/** Largest id the API accepts (32-bit). Larger values are a 422, as on the server. */
export const MAX_ID = 2 ** 31 - 1;

/** Rough bounding box of the Kyrgyz Republic (min lat, min lng, max lat, max lng), as in app/config.py. */
export const KYRGYZSTAN_BBOX = [39.0, 69.0, 43.6, 80.6] as const;

export const SETTINGS = {
  descriptionMaxLength: 1000,
  commentMaxLength: 2000,
  claimHoldHours: 72,
  closingConfirmations: 2,
  closingDaysWithoutDispute: 7,
  mapResultLimit: 500,
} as const;

export const HOUR_MS = 3_600_000;
export const DAY_MS = 24 * HOUR_MS;

/** localStorage key of the visitor's demo state. The version is part of the key: a new shape starts from the seed. */
export const STORAGE_VERSION = 1;
export const STORAGE_KEY = `cleankg-demo-state-v${STORAGE_VERSION}`;
