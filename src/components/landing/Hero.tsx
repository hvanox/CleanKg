"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useI18n } from "@/i18n";
import { fmt } from "@/lib/format";
import { publicPath } from "@/lib/paths";
import type { Status } from "@/lib/types";
import { ButtonLink } from "../ui/Button";
import { DemoChip, StatusChip } from "../ui/Chips";

/** The happy path, one card per status, in reading order across the wheel. */
export const PARADE_STATUSES: readonly Status[] = [
  "submitted",
  "under_review",
  "in_progress",
  "resolved",
  "confirmed",
];

/** A map pin: the round head sits in the lower half of the first viewport, the point is off-screen. */
const PIN_PATH =
  "M500 30C760 30 960 230 960 485C960 735 690 905 500 990C310 905 40 735 40 485C40 230 240 30 500 30Z";
/** A 120-degree arc over the top of the pin head, inside the cards' rim, so nothing covers the line of type
    and both ends stay above the viewport edge. Radius 340 around the head's centre (500, 485). */
const ARC_PATH = "M205.6 315A340 340 0 0 1 794.4 315";
/** Length of that arc (340 * 2 * pi / 3): the phrase is spaced to fill it exactly once. */
const ARC_LENGTH = 712;

/** Cards with a real photograph; the others carry the demo photo tile. */
const PHOTOS: Partial<Record<number, string>> = { 0: "/landing/before.webp", 3: "/landing/after.webp" };

export function Hero() {
  const { m } = useI18n();
  const h = m.landing.hero;
  const middle = (h.cards.length - 1) / 2;
  return (
    <section className="lp-hero" aria-labelledby="lp-hero-title">
      <div className="lp-hero__stage">
        <div className="lp-hero__copy">
          <h1 id="lp-hero-title" className="lp-hero__title">
            <span>{h.line1}</span>
            <span>{h.line2}</span>
          </h1>
          <p className="lp-hero__sub">{h.sub}</p>
          <div className="lp-hero__actions">
            <ButtonLink href="/map" variant="primary" island>
              {m.landing.ctaMap}
            </ButtonLink>
            <Link href="/new" className="kg-link">
              {m.landing.ctaReport}
            </Link>
          </div>
        </div>

        <div className="lp-field">
          <svg
            className="lp-field__pin"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="xMidYMin slice"
            aria-hidden="true"
            focusable="false"
          >
            <path className="lp-field__shape" d={PIN_PATH} />
            <path id="lp-arc" d={ARC_PATH} fill="none" />
            <g>
              <text className="lp-field__type">
                <textPath href="#lp-arc" textLength={ARC_LENGTH} lengthAdjust="spacing">
                  {h.arc}
                </textPath>
              </text>
            </g>
          </svg>

          <ul className="lp-wheel" aria-label={h.cardsLabel}>
            {h.cards.map((card, index) => {
              const status = PARADE_STATUSES[index];
              const photo = PHOTOS[index];
              return (
                <li
                  key={card.category}
                  className="lp-pcard"
                  style={{ "--slot": index - middle } as CSSProperties}
                  aria-label={fmt(h.cardLabel, { category: card.category, status: m.status[status] })}
                >
                  <div className="lp-pcard__photo">
                    {photo ? (
                      <Image
                        src={publicPath(photo)}
                        alt=""
                        fill
                        sizes="(min-width: 48em) 300px, 210px"
                        priority={index === 0}
                        className="lp-pcard__img"
                      />
                    ) : (
                      <span className="lp-pcard__tile" aria-hidden="true">
                        {m.create.photoTile}
                      </span>
                    )}
                  </div>
                  <div className="lp-pcard__body" aria-hidden="true">
                    <span className="lp-pcard__cat">{card.category}</span>
                    <span className="kg-mono-data kg-muted">{card.place}</span>
                    <span className="lp-pcard__foot">
                      <StatusChip status={status} />
                      <DemoChip />
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
