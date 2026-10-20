export type MissingField = "photo" | "point" | "category";

/** What still blocks the submit button of S2 (brief section 3, S2 must-nots). Order = order on the form. */
export function missingFields(state: {
  hasPhoto: boolean;
  hasPoint: boolean;
  category: string;
}): MissingField[] {
  const missing: MissingField[] = [];
  if (!state.hasPhoto) missing.push("photo");
  if (!state.hasPoint) missing.push("point");
  if (!state.category) missing.push("category");
  return missing;
}
