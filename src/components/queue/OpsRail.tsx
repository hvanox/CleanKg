"use client";

import { useI18n } from "@/i18n";
import { DemoChip } from "../ui/Chips";

/**
 * Dark rail of the operator surfaces (brief section 1): straight mono labels, the demo account and its state.
 * It states what the account is and nothing else: no organisation is shown as connected unless the API says so (HR-2).
 */
export function OpsRail({
  persona,
  organisation,
}: {
  persona: string;
  /** Present on S4 only: the organisation name and the connection label (already mapped from `connection_status`). */
  organisation?: { name: string; connection: string };
}) {
  const { m } = useI18n();
  return (
    <aside className="kg-rail" aria-label={m.rail.label}>
      <dl className="kg-rail__list">
        <div>
          <dt>{m.rail.account}</dt>
          <dd>{persona}</dd>
        </div>
        <div>
          <dt>{m.rail.state}</dt>
          <dd>{m.rail.stateValue}</dd>
        </div>
        {organisation ? (
          <>
            <div>
              <dt>{m.rail.organisation}</dt>
              <dd>{organisation.name}</dd>
            </div>
            <div>
              <dt>{m.rail.cityConnection}</dt>
              <dd>{organisation.connection}</dd>
            </div>
          </>
        ) : null}
        <div>
          <dt>{m.rail.area}</dt>
          <dd>
            {m.queue.areaValue} <DemoChip />
          </dd>
        </div>
      </dl>
    </aside>
  );
}
