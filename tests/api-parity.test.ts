import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api";
import { demoRequest, resetDemoState } from "@/lib/demo-api";

/**
 * The in-browser demo API against the real FastAPI: tests/fixtures/api-recording.json holds the answers of prototipe/api to
 * a fixed scenario of 119 requests (happy path, every error family, privacy cases), recorded by tests/fixtures/record_api.py.
 * Same statuses, same bodies (timestamps and the elapsed-days float aside), same order. Pydantic's English schema messages
 * are not compared, only the `loc` and `type` of each issue.
 */
interface Recorded {
  method: string;
  path: string;
  actor: string | null;
  body: unknown;
  status: number;
  response: unknown;
}

const recorded = JSON.parse(
  readFileSync(path.join(__dirname, "fixtures", "api-recording.json"), "utf8"),
) as Recorded[];

function normalise(value: unknown): unknown {
  if (typeof value === "string") return /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(value) ? "<timestamp>" : value;
  if (Array.isArray(value)) return value.map(normalise);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [key, key === "days_elapsed" ? "<days>" : normalise(inner)]),
    );
  }
  return value;
}

function issuesOnly(detail: unknown): unknown {
  if (!Array.isArray(detail)) return detail;
  return (detail as { loc: unknown[]; type: string }[]).map((issue) => ({ loc: issue.loc, type: issue.type }));
}

beforeEach(() => {
  window.localStorage.clear();
  resetDemoState();
});

describe("in-browser API against the recorded FastAPI answers", () => {
  it("has a scenario worth comparing", () => {
    expect(recorded.length).toBeGreaterThan(100);
    expect(recorded.filter((entry) => entry.status >= 400).length).toBeGreaterThan(40);
  });

  it("answers every recorded request with the same status and body", async () => {
    const differences: string[] = [];
    for (const [index, entry] of recorded.entries()) {
      let status = 200;
      let body: unknown;
      try {
        body = await demoRequest(entry.path, {
          method: entry.method,
          actorId: entry.actor ?? undefined,
          body: entry.body === null ? undefined : JSON.stringify(entry.body),
        });
      } catch (error) {
        if (!(error instanceof ApiError)) throw error;
        status = error.status;
        body = { detail: issuesOnly(error.detail) };
      }
      const expected = entry.response as { detail?: unknown } | null;
      const expectedBody = expected && "detail" in expected ? { detail: issuesOnly(expected.detail) } : expected;
      const sameStatus = status === entry.status || (status < 300 && entry.status < 300);
      const sameBody = JSON.stringify(normalise(body)) === JSON.stringify(normalise(expectedBody));
      if (!sameStatus || !sameBody) {
        differences.push(
          `#${index} ${entry.method} ${entry.path} (actor ${entry.actor})\n  api ${entry.status} ${JSON.stringify(normalise(expectedBody)).slice(0, 500)}\n  web ${status} ${JSON.stringify(normalise(body)).slice(0, 500)}`,
        );
      }
    }
    expect(differences.join("\n")).toBe("");
  });
});
