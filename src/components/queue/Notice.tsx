"use client";

import { ErrorState, Toast } from "../ui/States";

export type Notice = { kind: "ok"; text: string } | { kind: "error"; error: unknown } | null;

/** Result of the last row action: a success line or the API refusal by its code. */
export function NoticeView({ notice }: { notice: Notice }) {
  if (!notice) return null;
  return notice.kind === "ok" ? <Toast title={notice.text} /> : <ErrorState error={notice.error} />;
}
