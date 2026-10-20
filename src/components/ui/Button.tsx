import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary";

export function Button({
  variant = "secondary",
  className,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={`kg-btn kg-btn--${variant} ${className ?? ""}`} {...rest} />;
}

/** A link styled as a pill. `island` adds the trailing arrow island (button-in-button). */
export function ButtonLink({
  href,
  variant = "secondary",
  island = false,
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  island?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`kg-btn kg-btn--${variant}${island ? " kg-btn--island" : ""} ${className ?? ""}`}
    >
      {children}
      {island ? (
        <span className="kg-btn__island" aria-hidden="true">
          <ArrowUpRight className="kg-icon" weight="bold" />
        </span>
      ) : null}
    </Link>
  );
}
