import { ky } from "./ky";
import { ru, type Messages } from "./ru";

export type Locale = "ru" | "ky";
export const LOCALES: readonly Locale[] = ["ru", "ky"];
export const DEFAULT_LOCALE: Locale = "ru";

export const messages: Record<Locale, Messages> = { ru, ky };

/** Plural form of the "records" word for the demo data line. */
export function recordsWord(locale: Locale, count: number): string {
  const m = messages[locale].demo.records;
  const category = new Intl.PluralRules(locale === "ky" ? "ky" : "ru").select(count);
  if (category === "one") return m.one;
  if (category === "few") return m.few;
  return m.many;
}

/** Category label: ky falls back to ru until a Kyrgyz label exists (OQ-08). */
export function categoryLabel(
  category: { label_ru: string; label_ky: string | null },
  locale: Locale,
): string {
  return locale === "ky" && category.label_ky ? category.label_ky : category.label_ru;
}
