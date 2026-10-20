import { describe, expect, it } from "vitest";
import { ky } from "@/i18n/ky";
import { messages, recordsWord } from "@/i18n/messages";
import { ru } from "@/i18n/ru";
import { authorLabel } from "@/lib/author";
import { fmt, formatCoords, formatDateTime, parseCoordinate } from "@/lib/format";
import { missingFields } from "@/lib/submit";
import { STATUSES } from "@/lib/types";

function keys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, inner]) => keys(inner, prefix ? `${prefix}.${key}` : key));
}

function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value === "object" && value !== null) return Object.values(value).flatMap(strings);
  return [];
}

describe("string table", () => {
  it("ru and ky have exactly the same keys and no empty strings", () => {
    expect(keys(ky).sort()).toEqual(keys(ru).sort());
    expect(strings(ru).every((text) => text.length > 0)).toBe(true);
    expect(strings(ky).every((text) => text.length > 0)).toBe(true);
  });

  it("has a label for every lifecycle status in both locales", () => {
    for (const status of STATUSES) {
      expect(messages.ru.status[status]).toBeTruthy();
      expect(messages.ky.status[status]).toBeTruthy();
    }
  });

  it("keeps the fixed Russian terms in ky", () => {
    expect(ky.anonymousAuthor).toBe("Житель");
    expect(ky.card.organisationValue).toBe("не подключена");
    expect(ky.demo.chip).toBe("демо");
    expect(ky.banner.text).toBe(ru.banner.text);
  });

  it("uses the Russian plural forms of the records word", () => {
    expect(recordsWord("ru", 1)).toBe("запись");
    expect(recordsWord("ru", 3)).toBe("записи");
    expect(recordsWord("ru", 15)).toBe("записей");
  });
});

describe("format", () => {
  it("prints dates as DD.MM.YYYY, HH:mm in Bishkek time", () => {
    expect(formatDateTime("2026-10-20T08:05:00Z")).toBe("20.10.2026, 14:05");
  });
  it("prints coordinates with four decimals", () => {
    expect(formatCoords(42.8746, 74.5698)).toBe("42.8746, 74.5698");
  });
  it("parses coordinates and rejects junk and out-of-range values", () => {
    expect(parseCoordinate("42,8746", 90)).toBe(42.8746);
    expect(parseCoordinate(" -10.5 ", 90)).toBe(-10.5);
    expect(parseCoordinate("abc", 90)).toBeNull();
    expect(parseCoordinate("", 90)).toBeNull();
    expect(parseCoordinate("91", 90)).toBeNull();
    expect(parseCoordinate("181", 180)).toBeNull();
  });
  it("fills placeholders", () => {
    expect(fmt("{a} / {b}", { a: 1, b: 1000 })).toBe("1 / 1000");
  });
});

describe("rules", () => {
  it("lists what blocks submit, in form order", () => {
    expect(missingFields({ hasPhoto: false, hasPoint: false, category: "" })).toEqual(["photo", "point", "category"]);
    expect(missingFields({ hasPhoto: true, hasPoint: true, category: "illegal_dump" })).toEqual([]);
  });
  it("shows «Житель» for anonymous reports whatever the author field says", () => {
    expect(authorLabel({ anonymous: true, author: "Айгуль" }, "Житель")).toBe("Житель");
    expect(authorLabel({ anonymous: false, author: "Айгуль" }, "Житель")).toBe("Айгуль");
  });
});
