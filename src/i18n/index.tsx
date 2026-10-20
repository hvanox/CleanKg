"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { DEFAULT_LOCALE, messages, type Locale } from "./messages";
import type { Messages } from "./ru";

const STORAGE_KEY = "cleankg-locale";
const listeners = new Set<() => void>();
/** Choice made in this tab; used when storage is blocked. */
let chosen: Locale | null = null;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readLocale(): Locale {
  if (chosen) return chosen;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "ky" ? "ky" : "ru";
  } catch {
    return DEFAULT_LOCALE;
  }
}

interface I18nValue {
  locale: Locale;
  m: Messages;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, readLocale, () => DEFAULT_LOCALE);

  const setLocale = useCallback((next: Locale) => {
    chosen = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage blocked: the choice lasts until reload only */
    }
    listeners.forEach((listener) => listener());
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(() => ({ locale, m: messages[locale], setLocale }), [locale, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
