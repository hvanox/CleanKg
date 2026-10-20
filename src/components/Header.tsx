"use client";

import { MapPin } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n";
import { LOCALES, type Locale } from "@/i18n/messages";
import { ButtonLink } from "./ui/Button";

/** Floating island navigation: brand and links on the left, language (and on the landing the main action) on the right. */
export function Header() {
  const { locale, m, setLocale } = useI18n();
  const pathname = usePathname() ?? "";
  const landing = pathname === "/";
  const links = [
    { href: "/map", label: m.nav.map, current: pathname === "/map" || pathname.startsWith("/r/") },
    { href: "/new", label: m.nav.newReport, current: pathname === "/new" },
    { href: "/org", label: m.nav.org, current: pathname === "/org" },
    { href: "/mod", label: m.nav.mod, current: pathname === "/mod" },
  ];
  return (
    <header className="kg-header">
      <div className="kg-header__inner">
        <div className="kg-island kg-island--nav">
          <Link href="/" className="kg-brand" aria-label={m.nav.home}>
            <MapPin className="kg-brand__mark" weight="fill" aria-hidden="true" />
            {m.appName}
          </Link>
          <nav aria-label={m.nav.label} className="kg-nav">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="kg-nav__link"
                aria-current={link.current ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="kg-island">
          <div className="kg-locale">
            <label htmlFor="kg-locale" className="kg-label">
              {m.nav.language}
            </label>
            <select
              id="kg-locale"
              className="kg-select kg-select--compact"
              value={locale}
              onChange={(event) => setLocale(event.target.value as Locale)}
            >
              {LOCALES.map((code) => (
                <option key={code} value={code} lang={code}>
                  {code === "ru" ? m.nav.localeRu : m.nav.localeKy}
                </option>
              ))}
            </select>
          </div>
          {landing ? (
            <ButtonLink href="/map" variant="primary" island className="kg-header__cta">
              {m.landing.ctaMap}
            </ButtonLink>
          ) : null}
        </div>
      </div>
    </header>
  );
}
