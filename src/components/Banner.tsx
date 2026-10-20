"use client";

import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n";

/** Operator surfaces (S4, S5): the banner gets a second segment so a demo account is never read as a real one (brief 5.1, HR-2). */
const ACCOUNT_SURFACES = ["/org", "/mod"];

/** «Прототип» banner (brief section 5.1): sticky, un-dismissible, a real element before <main>. In ky the demo-text line sits under it. */
export function Banner() {
  const { locale, m } = useI18n();
  const pathname = usePathname() ?? "";
  const accountSurface = ACCOUNT_SURFACES.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  return (
    <div className="kg-banner-stack">
      <div className="kg-banner" role="note" aria-label={m.banner.ariaLabel} tabIndex={0}>
        <span className="kg-banner__text">{m.banner.text}</span>
        {accountSurface ? <span className="kg-banner__segment">{m.banner.accountSegment}</span> : null}
      </div>
      {locale === "ky" ? <div className="kg-banner-ky">{m.banner.kyLine}</div> : null}
    </div>
  );
}
