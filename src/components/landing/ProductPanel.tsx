"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useI18n } from "@/i18n";
import { ButtonLink } from "../ui/Button";

const SCREENS = [
  { key: "map", href: "/map" },
  { key: "card", href: "/r/1" },
  { key: "org", href: "/org" },
  { key: "mod", href: "/mod" },
] as const;

/** The real prototype inside a dark device panel: one tab per screen, each a capture of the running demo. */
export function ProductPanel() {
  const { m } = useI18n();
  const p = m.landing.product;
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const screen = SCREENS[active];

  function onKey(event: KeyboardEvent<HTMLButtonElement>) {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (active + delta + SCREENS.length) % SCREENS.length;
    setActive(next);
    tabs.current[next]?.focus();
  }

  return (
    <section className="lp-product" aria-labelledby="lp-product-title">
      <div className="lp-product__head">
        <h2 id="lp-product-title" className="lp-section-title">
          {p.title}
        </h2>
        <p className="lp-lead">{p.sub}</p>
      </div>
      <div className="lp-device">
        <div className="lp-device__bar">
          <div className="lp-tabs" role="tablist" aria-label={p.tabsLabel}>
            {SCREENS.map((item, index) => (
              <button
                key={item.key}
                ref={(node) => {
                  tabs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`lp-tab-${item.key}`}
                aria-selected={index === active}
                aria-controls="lp-device-panel"
                tabIndex={index === active ? 0 : -1}
                className="lp-tab"
                onClick={() => setActive(index)}
                onKeyDown={onKey}
              >
                {p.tabs[item.key].label}
              </button>
            ))}
          </div>
          <ButtonLink href={screen.href} variant="secondary" island className="lp-device__open">
            {p.open}
          </ButtonLink>
        </div>
        <div
          className="lp-device__screen"
          role="tabpanel"
          id="lp-device-panel"
          aria-labelledby={`lp-tab-${screen.key}`}
        >
          {SCREENS.map((item, index) => (
            <picture key={item.key}>
              <source media="(max-width: 47.99em)" srcSet={`/landing/screen-${item.key}-m.webp`} />
              <img
                src={`/landing/screen-${item.key}.webp`}
                alt={index === active ? p.tabs[item.key].alt : ""}
                aria-hidden={index === active ? undefined : true}
                width={1440}
                height={900}
                loading="eager"
                decoding="async"
                className="lp-device__img"
                data-active={index === active}
              />
            </picture>
          ))}
        </div>
      </div>
    </section>
  );
}
