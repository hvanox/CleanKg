"use client";

import { MapPin } from "@phosphor-icons/react";
import Link from "next/link";
import { useI18n } from "@/i18n";
import { ButtonLink } from "../ui/Button";

/** SDG 11.6 on the vermilion field, then the close: one action, the honest list, the team. */
export function Closing() {
  const { m } = useI18n();
  const s = m.landing.sdg;
  const c = m.landing.close;
  const f = m.landing.footer;
  return (
    <>
      <section className="lp-sdg" aria-labelledby="lp-sdg-title">
        <h2 id="lp-sdg-title" className="kg-sr-only">
          {s.title}
        </h2>
        <figure className="lp-sdg__figure">
          <blockquote className="lp-sdg__quote">
            <p>«{s.quote}»</p>
          </blockquote>
          <figcaption className="lp-sdg__support">{s.support}</figcaption>
        </figure>
      </section>

      <section className="lp-close" aria-labelledby="lp-close-title">
        <div className="lp-close__main">
          <h2 id="lp-close-title" className="lp-close__title">
            {c.title}
          </h2>
          <p className="lp-lead lp-lead--inverse">{c.body}</p>
          <div className="lp-close__actions">
            <ButtonLink href="/map" variant="secondary" island>
              {m.landing.ctaMap}
            </ButtonLink>
            <Link href="/org" className="lp-close__link">
              {c.org}
            </Link>
            <Link href="/mod" className="lp-close__link">
              {c.mod}
            </Link>
          </div>
        </div>
        <div className="lp-close__honest">
          <h3 className="lp-close__honest-title">{c.honestTitle}</h3>
          <p>{c.real}</p>
          <p>{c.demo}</p>
        </div>
        <footer className="lp-footer">
          <span className="lp-footer__brand">
            <MapPin weight="fill" aria-hidden="true" className="kg-brand__mark" />
            {m.appName}
          </span>
          <span>{f.team}</span>
          <span>{f.event}</span>
          <a href={`mailto:${f.contact}`} className="lp-close__link">
            {f.contact}
          </a>
        </footer>
      </section>
    </>
  );
}
