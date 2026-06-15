"use client"

import { useCallback } from "react"
import i18n, { ensureLanguageLoaded } from "./i18n"
import {
  DEFAULT_LANG,
  LANG_COOKIE,
  LANG_COOKIE_MAX_AGE,
  isSupported,
  langDir,
} from "@/lib/i18n/languages"

/**
 * Switches the active language everywhere: loads the catalog, re-renders via
 * i18next, flips <html lang/dir>, writes the first-party `lang` cookie (so SSR
 * and return visits remember it), and mirrors the choice server-side (DB for
 * signed-in users, plus the "reset to English" notification — see
 * /api/language). The cookie is set client-side first so the UI never waits on
 * the network.
 */
export function useChangeLanguage() {
  return useCallback(async (code: string) => {
    const lang = isSupported(code) ? code : DEFAULT_LANG

    await ensureLanguageLoaded(lang)
    await i18n.changeLanguage(lang)

    if (typeof document !== "undefined") {
      document.documentElement.lang = lang
      document.documentElement.dir = langDir(lang)
      document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=${LANG_COOKIE_MAX_AGE}; samesite=lax`
    }

    try {
      await fetch("/api/language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang }),
      })
    } catch {
      /* cookie + UI already updated; server mirror is best-effort */
    }
  }, [])
}
