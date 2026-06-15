"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import LanguageList from "./LanguageList"
import { useChangeLanguage } from "./useChangeLanguage"
import { DEFAULT_LANG, getLanguage } from "@/lib/i18n/languages"

/**
 * Compact language control for the footer (reachable by signed-out users) and
 * settings (signed-in users). Opens the shared picker — including the prominent
 * "Reset to English" — in a popover anchored to the trigger.
 */
export default function LanguageSwitcher({ className }: { className?: string }) {
  const { t, i18n } = useTranslation()
  const change = useChangeLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = i18n.language || DEFAULT_LANG
  const currentNative = getLanguage(current)?.native ?? "English"

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  const choose = (code: string) => {
    void change(code)
    setOpen(false)
  }

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t("language.label")}
        className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:hover:text-white"
      >
        <GlobeGlyph className="h-4 w-4" />
        <span>{currentNative}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          dir="ltr"
          className="absolute bottom-full right-0 z-50 mb-2 w-80 rounded-xl border border-rule bg-paper p-3 sm:w-88"
        >
          <LanguageList current={current} onSelect={choose} />
        </div>
      )}
    </div>
  )
}

function GlobeGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.4 2.4 3.6 5.4 3.6 8.5S14.4 18.1 12 20.5C9.6 18.1 8.4 15.1 8.4 12S9.6 5.9 12 3.5z" />
    </svg>
  )
}
