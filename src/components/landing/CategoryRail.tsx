"use client";

import {
  ArrowLeft,
  ArrowRight,
  Barricade,
  Biohazard,
  CheckCircle,
  Fire,
  Prohibit,
  Trash,
  Truck,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import Image from "next/image";
import { useRef } from "react";
import { useI18n } from "@/i18n";

type CategoryCode =
  | "illegal_dump"
  | "overflowing_container"
  | "missed_collection"
  | "trash_burning"
  | "construction_debris"
  | "littered_area"
  | "hazardous_waste";

type Volunteer = "yes" | "upToMedium" | "no" | "never";

/** Order, look and volunteer rule per category. The rule mirrors Docs/02-product/taxonomy.md (HR-5). */
const CATEGORIES: readonly {
  code: CategoryCode;
  volunteer: Volunteer;
  tone: "photo" | "ink" | "accent" | "surface" | "sunken" | "deep";
  icon?: Icon;
  photo?: { src: string; alt: "photoAltDump" | "photoAltVolunteers" };
}[] = [
  { code: "illegal_dump", volunteer: "upToMedium", tone: "photo", photo: { src: "/landing/before.webp", alt: "photoAltDump" } },
  { code: "overflowing_container", volunteer: "no", tone: "ink", icon: Trash },
  { code: "littered_area", volunteer: "yes", tone: "photo", photo: { src: "/landing/vola.webp", alt: "photoAltVolunteers" } },
  { code: "trash_burning", volunteer: "never", tone: "accent", icon: Fire },
  { code: "missed_collection", volunteer: "no", tone: "surface", icon: Truck },
  { code: "construction_debris", volunteer: "no", tone: "sunken", icon: Barricade },
  { code: "hazardous_waste", volunteer: "never", tone: "deep", icon: Biohazard },
];

/** Tall category cards in a horizontal rail, each saying plainly whether volunteers may take it. */
export function CategoryRail() {
  const { m } = useI18n();
  const r = m.landing.rail;
  const track = useRef<HTMLUListElement>(null);

  function scroll(direction: 1 | -1) {
    const node = track.current;
    if (!node) return;
    const card = node.querySelector("li");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollBy({ left: direction * (card ? card.getBoundingClientRect().width : node.clientWidth), behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <section className="lp-rail" aria-labelledby="lp-rail-title">
      <div className="lp-rail__head">
        <div className="lp-rail__copy">
          <h2 id="lp-rail-title" className="lp-section-title">
            {r.title}
          </h2>
          <p className="lp-lead">{r.sub}</p>
        </div>
        <div className="lp-rail__controls">
          <button type="button" className="lp-round" onClick={() => scroll(-1)} aria-label={r.prev}>
            <ArrowLeft className="kg-icon" weight="bold" aria-hidden="true" />
          </button>
          <button type="button" className="lp-round" onClick={() => scroll(1)} aria-label={r.next}>
            <ArrowRight className="kg-icon" weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>
      <ul className="lp-rail__track" ref={track}>
        {CATEGORIES.map((category) => {
          const item = r.items[category.code];
          const CategoryIcon = category.icon;
          const allowed = category.volunteer === "yes" || category.volunteer === "upToMedium";
          const VolunteerIcon = allowed ? CheckCircle : Prohibit;
          return (
            <li key={category.code} className="lp-cat" data-tone={category.tone}>
              {category.photo ? (
                <Image
                  src={category.photo.src}
                  alt={r[category.photo.alt]}
                  fill
                  sizes="(min-width: 48em) 360px, 80vw"
                  className="lp-cat__img"
                />
              ) : null}
              {CategoryIcon ? <CategoryIcon className="lp-cat__icon" weight="light" aria-hidden="true" /> : null}
              <div className="lp-cat__body">
                <h3 className="lp-cat__label">{item.label}</h3>
                <p className="lp-cat__note">{item.note}</p>
                <p className="lp-cat__volunteer" data-allowed={allowed}>
                  <VolunteerIcon className="kg-icon" weight="fill" aria-hidden="true" />
                  {r.volunteer[category.volunteer]}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
