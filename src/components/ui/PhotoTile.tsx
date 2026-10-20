"use client";

import { useI18n } from "@/i18n";

/** Placeholder photo (brief section 5.3): paper, 1 px ink frame, label ФОТО · ДЕМО. No image, no person, no plate. */
export function PhotoTile({ caption }: { caption: string }) {
  const { m } = useI18n();
  return (
    <figure className="kg-photo">
      <div className="kg-photo__tile" role="img" aria-label={m.create.photoTile}>
        <span className="kg-label-text" aria-hidden="true">
          {m.create.photoTile}
        </span>
      </div>
      <figcaption className="kg-caption">{caption}</figcaption>
    </figure>
  );
}
