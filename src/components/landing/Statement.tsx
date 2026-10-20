"use client";

import { CheckCircle, MapPin } from "@phosphor-icons/react";
import Image from "next/image";
import { Fragment } from "react";
import { useI18n } from "@/i18n";
import { StatusChip } from "../ui/Chips";

/** Words become separate spans so the reading can light up word by word on scroll. */
function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <span className="lp-word">{word}</span>{" "}
        </Fragment>
      ))}
    </>
  );
}

/** One sentence that is the whole mechanism, with the real objects set inline in the line of type. */
export function Statement() {
  const { m } = useI18n();
  const s = m.landing.statement;
  return (
    <section className="lp-statement" aria-labelledby="lp-statement-title">
      <h2 id="lp-statement-title" className="kg-sr-only">
        {s.label}
      </h2>
      <p className="lp-statement__text">
        <Words text={s.s1} />
        <span className="lp-inline lp-inline--photo">
          <Image src="/landing/before.webp" alt={s.photoAlt} width={240} height={120} className="lp-inline__img" />
        </span>{" "}
        <Words text={s.s2} />
        <span className="lp-inline lp-inline--pin" aria-hidden="true">
          <MapPin weight="fill" />
        </span>{" "}
        <Words text={s.s3} />
        <span className="lp-inline lp-inline--chip">
          <StatusChip status="under_review" />
        </span>{" "}
        <Words text={s.s4} />
        <span className="lp-inline lp-inline--check" aria-hidden="true">
          <CheckCircle weight="fill" />
          <CheckCircle weight="fill" />
        </span>{" "}
        <Words text={s.s5} />
      </p>
    </section>
  );
}
