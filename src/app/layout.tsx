import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { Providers } from "./providers";
import "../styles/fonts.css";
import "../styles/tokens.css";
import "./globals.css";
import "../styles/landing.css";

export const metadata: Metadata = {
  title: "CleanKg · Прототип",
  description: "Прототип · демо-данные",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
