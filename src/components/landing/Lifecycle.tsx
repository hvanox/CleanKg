"use client";

import type { CSSProperties } from "react";
import { useI18n } from "@/i18n";
import { STATUS_ICONS } from "../ui/status";
import { PARADE_STATUSES } from "./Hero";

/** The lifecycle as a ring that draws itself while the stage is pinned; each status lights up as the line reaches it. */
export function Lifecycle() {
  const { m } = useI18n();
  const r = m.landing.ring;
  return (
    <section className="lp-ring" aria-labelledby="lp-ring-title">
      <div className="lp-ring__stage">
        <div className="lp-ring__copy">
          <h2 id="lp-ring-title" className="lp-section-title">
            {r.title}
          </h2>
          <p className="lp-lead">{r.body}</p>
          <p className="lp-ring__note">{r.note}</p>
        </div>
        <div className="lp-ring__dial">
          <div className="lp-ring__face">
            <svg
              className="lp-ring__svg"
              viewBox="0 0 100 100"
              aria-hidden="true"
              focusable="false"
            >
              <circle
                className="lp-ring__track"
                cx="50"
                cy="50"
                r="44"
                pathLength={100}
              />
              <circle
                className="lp-ring__line"
                cx="50"
                cy="50"
                r="44"
                pathLength={100}
              />
            </svg>
            <div className="lp-ring__center">
              <span className="lp-ring__figure">{r.centerFigure}</span>
              <span className="lp-ring__label">{r.centerLabel}</span>
              <span className="lp-ring__small">{r.centerSub}</span>
            </div>
          </div>
          <ol className="lp-ring__steps" aria-label={r.stepsLabel}>
            {PARADE_STATUSES.map((status, step) => {
              const Icon = STATUS_ICONS[status];
              return (
                <li
                  key={status}
                  className={`lp-ring__step lp-light-${step}`}
                  data-status={status}
                  style={{ "--a": `${step * 72 - 90}deg` } as CSSProperties}
                >
                  <span className="lp-ring__chip">
                    <Icon
                      className="kg-icon"
                      weight="bold"
                      aria-hidden="true"
                    />
                    {m.status[status]}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
