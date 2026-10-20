import { renderToStaticMarkup } from "react-dom/server";
import { STATUS_ICONS } from "@/components/ui/status";
import type { Status } from "@/lib/types";

/** HTML of a status marker: icon + status colour; the text for screen readers carries status and category. */
export function statusMarkerHtml(status: Status, accessibleText: string): string {
  const MarkerIcon = STATUS_ICONS[status];
  return renderToStaticMarkup(
    <>
      <span className="kg-marker__body" data-status={status}>
        <MarkerIcon className="kg-icon" weight="light" aria-hidden="true" />
      </span>
      <span className="kg-sr-only">{accessibleText}</span>
    </>,
  );
}

/** HTML of a cluster: the count, a «демо» mark (the count is a seeded counter), and a screen-reader label. */
export function clusterMarkerHtml(count: number, demoLabel: string, accessibleText: string): string {
  return renderToStaticMarkup(
    <>
      <span className="kg-cluster__body">
        <span className="kg-mono kg-cluster__count" aria-hidden="true">
          {count}
        </span>
        <span className="kg-demo-chip kg-cluster__demo" aria-hidden="true">
          {demoLabel}
        </span>
      </span>
      <span className="kg-sr-only">{accessibleText}</span>
    </>,
  );
}

/** The point picker pin on S2. */
export function pinMarkerHtml(): string {
  return renderToStaticMarkup(<span className="kg-marker__body kg-marker__body--pin" />);
}
