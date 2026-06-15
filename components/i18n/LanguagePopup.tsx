"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import i18n from "./i18n"
import LanguageList from "./LanguageList"
import { useChangeLanguage } from "./useChangeLanguage"
import { DEFAULT_LANG, LANG_COOKIE, LANGUAGE_CHOSEN_EVENT } from "@/lib/i18n/languages"

function hasLangCookie(): boolean {
  if (typeof document === "undefined") return true
  return new RegExp(`(?:^|; )${LANG_COOKIE}=`).test(document.cookie)
}

/**
 * First-visit language chooser. Shows once — only when no `lang` cookie exists —
 * so it never nags returning visitors. Picking a language (or "Continue in
 * English") writes the cookie and dismisses it.
 */
export default function LanguagePopup() {
  const { t } = useTranslation()
  const change = useChangeLanguage()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!hasLangCookie()) setOpen(true)
  }, [])

  // Lock background scroll while the full-screen chooser is open.
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  const choose = (code: string) => {
    void change(code)
    setOpen(false)
    // Tell the cookie banner the language step is done so it can appear next,
    // instead of both popups stacking on a first visit.
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(LANGUAGE_CHOSEN_EVENT))
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("language.popupTitle")}
        dir="ltr"
        className="relative w-full max-w-lg rounded-xl border border-rule bg-paper p-5 sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="type-display text-xl text-ink">{t("language.popupTitle")}</h2>
            <p className="mt-1 text-sm text-pencil">{t("language.popupSubtitle")}</p>
          </div>
          <button
            type="button"
            aria-label={t("language.continueInEnglish")}
            onClick={() => choose(DEFAULT_LANG)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-pencil hover:bg-secondary hover:text-ink sm:h-auto sm:w-auto sm:p-1.5"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <LanguageList current={i18n.language || DEFAULT_LANG} onSelect={choose} />
      </div>
    </div>
  )
}
