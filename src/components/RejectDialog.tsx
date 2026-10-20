"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n";
import { fmt } from "@/lib/format";
import { REJECT_REASONS, type RejectReason } from "@/lib/queue";
import { Button } from "./ui/Button";
import { ErrorState } from "./ui/States";

/**
 * Reject dialog of S5. The reason is one of the fixed list (AD-2), chosen with radios: there is no text field, so the
 * free-text reason `other` cannot be offered. A native modal <dialog>: focus trap, Esc and inert background come with it.
 */
export function RejectDialog({
  reportId,
  pending,
  error,
  onCancel,
  onConfirm,
}: {
  reportId: number;
  pending: boolean;
  error: unknown;
  onCancel: () => void;
  onConfirm: (reason: RejectReason) => void;
}) {
  const { m } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState<RejectReason | "">("");

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog ref={ref} className="kg-dialog" aria-labelledby="reject-title" onClose={onCancel}>
      <form
        className="kg-dialog__body"
        onSubmit={(event) => {
          event.preventDefault();
          if (reason) onConfirm(reason);
        }}
      >
        <h2 className="kg-h2" id="reject-title">
          {fmt(m.mod.dialog.title, { id: reportId })}
        </h2>
        <fieldset className="kg-fieldset">
          <legend className="kg-label">{m.mod.dialog.reasonLegend}</legend>
          {REJECT_REASONS.map((code) => (
            <label key={code} className="kg-check">
              <input
                type="radio"
                name="reject-reason"
                value={code}
                checked={reason === code}
                onChange={() => setReason(code)}
                className="kg-check__box"
              />
              <span className="kg-check__label">{m.mod.reasons[code]}</span>
            </label>
          ))}
        </fieldset>
        <p className="kg-help">{m.mod.dialog.reasonHelp}</p>
        {error ? <ErrorState error={error} /> : null}
        <div className="kg-submit">
          <Button
            type="submit"
            variant="primary"
            disabled={!reason || pending}
            aria-describedby={reason ? undefined : "reject-missing"}
          >
            {pending ? m.mod.dialog.working : m.mod.dialog.confirm}
          </Button>
          <Button onClick={onCancel}>{m.mod.dialog.cancel}</Button>
          {!reason ? (
            <p className="kg-help kg-submit__reason" id="reject-missing">
              {m.mod.dialog.reasonMissing}
            </p>
          ) : null}
        </div>
      </form>
    </dialog>
  );
}
