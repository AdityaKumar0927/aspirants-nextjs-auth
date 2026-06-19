"use client"

import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import { useSyncExternalStore } from "react"
import { resources } from "../../locales"
import { DEFAULT_LANG } from "@/lib/i18n/languages"

// Live interpolation variables. i18next reads `defaultVariables` at each t() call,
// so mutating this object changes how the {{siteName}} token resolves in EVERY
// translated string (across all languages) — no per-call-site changes needed.
const interpolationVars = { siteName: "Penwise" }

// Initialise once. Both the server (SSR of the client provider) and the client's
// first render start in English, so hydration matches; the provider switches to
// the cookie language in an effect after mount.
if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: DEFAULT_LANG,
    fallbackLng: DEFAULT_LANG,
    defaultNS: "common",
    ns: ["common"],
    interpolation: { escapeValue: false, defaultVariables: interpolationVars },
    react: { useSuspense: false },
  })
}

/* --------------------------- live site name ----------------------------- */
// One client-side source for the editable site name: drives both the {{siteName}}
// i18n token and the useSiteName() hook (for client literal strings). Fed once by
// I18nProvider from the public GET /api/site-config; server surfaces use
// lib/site-config.getSiteName() instead.
let siteName = "Penwise"
const listeners = new Set<() => void>()

export function setSiteName(name: string | null | undefined): void {
  const n = name?.trim()
  if (!n || n === siteName) return
  siteName = n
  interpolationVars.siteName = n
  // Re-resolve every <T>/useT consumer (they subscribe to languageChanged).
  i18n.emit("languageChanged", i18n.language)
  listeners.forEach((l) => l())
}

/** The live site name, for client components interpolating it into literals. */
export function useSiteName(): string {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => siteName,
    () => "Penwise",
  )
}

/**
 * Lazily pull a non-English catalog from /public/locales and register it. No-op
 * for English (bundled) or an already-loaded language; on any failure (e.g. the
 * catalog hasn't been generated yet) i18next falls back to English.
 */
export async function ensureLanguageLoaded(lng: string): Promise<void> {
  if (lng === DEFAULT_LANG || i18n.hasResourceBundle(lng, "common")) return
  try {
    // `no-cache` (revalidate), NOT `force-cache`: a catalog fetched before it
    // existed (404) must not be replayed from cache forever once generated.
    const res = await fetch(`/locales/${lng}/common.json`, { cache: "no-cache" })
    if (res.ok) {
      i18n.addResourceBundle(lng, "common", await res.json(), true, true)
    }
  } catch {
    /* keep English fallback */
  }
}

export default i18n
