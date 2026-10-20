"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/i18n";
import { isBrowserMode } from "@/lib/config";

/** Operator surfaces (S4, S5): the banner gets a second segment so a demo account is never read as a real one (brief 5.1, HR-2). */
const ACCOUNT_SURFACES = ["/org", "/mod"];

/**
 * «Прототип» banner (brief section 5.1): sticky, un-dismissible, a real element before <main>. In ky the demo-text line sits under it.
 * In the browser-only build (NEXT_PUBLIC_DATA_MODE=browser) the visitor's demo data lives in this browser, and a small
 * «Сбросить демо-данные» control in the strip restores the seed.
 */
export function Banner() {
  const { locale, m } = useI18n();
  const pathname = usePathname() ?? "";
  const client = useQueryClient();
  const [resetNote, setResetNote] = useState("");
  const accountSurface = ACCOUNT_SURFACES.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  async function resetDemo() {
    const { resetDemoState } = await import("@/lib/demo-api");
    resetDemoState();
    await client.invalidateQueries();
    setResetNote(m.banner.resetDone);
  }

  return (
    <div className="kg-banner-stack">
      <div className="kg-banner" role="note" aria-label={m.banner.ariaLabel} tabIndex={0}>
        <span className="kg-banner__text">{m.banner.text}</span>
        {accountSurface ? <span className="kg-banner__segment">{m.banner.accountSegment}</span> : null}
        {isBrowserMode() ? (
          <button type="button" className="kg-banner__reset" onClick={() => void resetDemo()}>
            {m.banner.reset}
          </button>
        ) : null}
      </div>
      {isBrowserMode() ? (
        <p className="kg-sr-only" role="status">
          {resetNote}
        </p>
      ) : null}
      {locale === "ky" ? <div className="kg-banner-ky">{m.banner.kyLine}</div> : null}
    </div>
  );
}
