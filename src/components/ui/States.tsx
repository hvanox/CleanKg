"use client";

import { CheckCircle, MapPinSimple, Warning } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/i18n";
import { Button } from "./Button";
import { DemoChip } from "./Chips";

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="kg-state kg-state--empty" role="status">
      <MapPinSimple className="kg-icon kg-icon--empty" weight="light" aria-hidden="true" />
      <p className="kg-state__text">
        {children} <DemoChip />
      </p>
    </div>
  );
}

/** Error by its API `code`; unknown codes use the generic message. The code is printed so it can be reported. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { m } = useI18n();
  const code = error instanceof ApiError ? error.code : "generic";
  const known = m.errors as Record<string, string>;
  const message = known[code] ?? m.errors.generic;
  return (
    <div className="kg-state kg-state--error" role="alert">
      <Warning className="kg-icon kg-icon--empty" weight="light" aria-hidden="true" />
      <p className="kg-state__title">
        {m.errors.title} <DemoChip />
      </p>
      <p className="kg-state__text">{message}</p>
      <p className="kg-mono kg-state__code">
        {m.errors.codeLabel}: {code}
      </p>
      {onRetry ? <Button onClick={onRetry}>{m.common.retry}</Button> : null}
    </div>
  );
}

export function Skeleton({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={`kg-skeleton ${className ?? ""}`} role={label ? "status" : undefined} aria-busy="true">
      {label ? <span className="kg-skeleton__label">{label}</span> : null}
    </div>
  );
}

export function Toast({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="kg-toast" role="status">
      <CheckCircle className="kg-icon kg-icon--button" weight="light" aria-hidden="true" />
      <div>
        <p className="kg-toast__title">{title}</p>
        {children}
      </div>
    </div>
  );
}
