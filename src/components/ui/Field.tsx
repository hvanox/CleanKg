import type { ReactNode } from "react";

/** Label + control + helper + error. The control is passed in and must use `id`, `aria-describedby` from here. */
export function Field({
  id,
  label,
  helper,
  error,
  children,
}: {
  id: string;
  label: string;
  helper?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="kg-field">
      <label className="kg-label" htmlFor={id}>
        {label}
      </label>
      {children}
      {helper ? (
        <p className="kg-help" id={`${id}-help`}>
          {helper}
        </p>
      ) : null}
      {error ? (
        <p className="kg-error-text" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
