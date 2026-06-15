"use client"

import { useEffect } from "react"
import { I18nextProvider } from "react-i18next"
import i18n, { ensureLanguageLoaded } from "./i18n"
import LanguagePopup from "./LanguagePopup"
import { DEFAULT_LANG, LANG_COOKIE, isSupported, langDir } from "@/lib/i18n/languages"

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return m ? decodeURIComponent(m[1]) : null
}

/**
 * Mounted once per route group (inside ComplianceProviders). SSR and the first
 * client render are both English, so hydration is clean; after mount we read the
 * `lang` cookie and switch — loading the catalog, re-rendering, and flipping
 * <html lang/dir>. Also renders the first-visit language popup.
 */
export default function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const cookie = readCookie(LANG_COOKIE)
    const lang = isSupported(cookie) ? (cookie as string) : DEFAULT_LANG
    if (lang !== DEFAULT_LANG) {
      ensureLanguageLoaded(lang).then(() => i18n.changeLanguage(lang))
    }
    document.documentElement.lang = lang
    document.documentElement.dir = langDir(lang)
  }, [])

  return (
    <I18nextProvider i18n={i18n}>
      {children}
      <LanguagePopup />
    </I18nextProvider>
  )
}
