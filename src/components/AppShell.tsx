"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useI18n } from "@/i18n";
import { normalizePath } from "@/lib/paths";
import { Banner } from "./Banner";
import { Header } from "./Header";

/** Skip link, banner, header, then <main>. The banner is the first tab stop after the skip link. The landing runs full bleed. */
export function AppShell({ children }: { children: ReactNode }) {
  const { m } = useI18n();
  const landing = normalizePath(usePathname()) === "/";
  return (
    <>
      <a href="#main" className="kg-skip">
        {m.skipLink}
      </a>
      <Banner />
      <Header />
      <main id="main" className={landing ? "kg-main kg-main--bleed" : "kg-main"}>
        {children}
      </main>
    </>
  );
}
