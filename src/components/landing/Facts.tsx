"use client";

import { ArrowSquareOut } from "@phosphor-icons/react";
import { useI18n } from "@/i18n";

/** Four sourced facts (Docs/05-pitch/facts.md: FACT-01, FACT-03, FACT-05, FACT-09), set as editorial sentences. */
export function Facts() {
  const { m } = useI18n();
  const f = m.landing.facts;
  return (
    <section className="lp-facts" aria-labelledby="lp-facts-title">
      <h2 id="lp-facts-title" className="lp-section-title">
        {f.title}
      </h2>
      <ol className="lp-facts__list">
        {f.items.map((item) => (
          <li key={item.url} className="lp-fact">
            <p className="lp-fact__line">
              <span className="lp-fact__figure">{item.figure}</span> <span className="lp-fact__text">{item.text}</span>
            </p>
            <a className="lp-fact__source" href={item.url} target="_blank" rel="noopener noreferrer">
              {f.source}: {item.source}
              <ArrowSquareOut className="kg-icon" weight="bold" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
