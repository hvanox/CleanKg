"use client";

import Image from "next/image";
import { useState } from "react";
import type { CSSProperties } from "react";
import { useI18n } from "@/i18n";

/** Before and after on one frame; a range input moves the seam. The caption says the two photos are different places. */
export function Proof() {
  const { m } = useI18n();
  const p = m.landing.proof;
  const [position, setPosition] = useState(52);
  return (
    <section className="lp-proof" aria-labelledby="lp-proof-title">
      <div className="lp-proof__copy">
        <h2 id="lp-proof-title" className="lp-section-title">
          {p.title}
        </h2>
        <p className="lp-lead">{p.body}</p>
        <p className="lp-proof__note">{p.note}</p>
      </div>
      <figure className="lp-compare" style={{ "--pos": `${position}%` } as CSSProperties}>
        <div className="lp-compare__frame">
          <Image
            src="/landing/before.webp"
            alt={p.before}
            fill
            sizes="(min-width: 48em) 60vw, 94vw"
            className="lp-compare__img"
          />
          <Image
            src="/landing/after.webp"
            alt={p.after}
            fill
            sizes="(min-width: 48em) 60vw, 94vw"
            className="lp-compare__img lp-compare__img--after"
          />
          <span className="lp-compare__seam" aria-hidden="true" />
          <span className="lp-compare__tag lp-compare__tag--before" aria-hidden="true">
            {p.before}
          </span>
          <span className="lp-compare__tag lp-compare__tag--after" aria-hidden="true">
            {p.after}
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={position}
            onChange={(event) => setPosition(Number(event.target.value))}
            className="lp-compare__range"
            aria-label={p.slider}
          />
        </div>
        <figcaption className="kg-caption kg-muted">{p.caption}</figcaption>
      </figure>
    </section>
  );
}
