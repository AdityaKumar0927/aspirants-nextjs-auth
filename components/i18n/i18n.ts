"use client"

import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import { resources } from "../../locales"
import { DEFAULT_LANG } from "@/lib/i18n/languages"

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
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  })
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
