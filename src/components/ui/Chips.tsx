"use client";

import { useI18n } from "@/i18n";
import type { Status } from "@/lib/types";
import { STATUS_ICONS } from "./status";

/** Status chip: tint background, 1 px status border, ink text, icon in the status colour, and the label. Never colour alone. */
export function StatusChip({ status }: { status: Status }) {
  const { m } = useI18n();
  const StatusIcon = STATUS_ICONS[status];
  return (
    <span className="kg-chip kg-chip--status" data-status={status}>
      <StatusIcon className="kg-icon kg-chip__icon" weight="light" aria-hidden="true" />
      <span>{m.status[status]}</span>
    </span>
  );
}

/** Neutral chip for a category. */
export function CategoryChip({ label }: { label: string }) {
  return <span className="kg-chip kg-chip--neutral">{label}</span>;
}

/** «демо» mark (brief section 5.2): placed after the value, never instead of it. */
export function DemoChip() {
  const { m } = useI18n();
  return <span className="kg-demo-chip">{m.demo.chip}</span>;
}
