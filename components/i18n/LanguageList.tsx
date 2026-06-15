"use client"

import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { LANGUAGES, DEFAULT_LANG } from "@/lib/i18n/languages"

/**
 * Shared language picker body: an always-English "Reset to English" affordance
 * (so a user stranded in an unfamiliar script can always escape), a search box,
 * and the grid of languages shown in their own script. Reused by the first-visit
 * popup and the footer/settings switcher.
 */
export default function LanguageList({
  current,
  onSelect,
}: {
  current: string
  onSelect: (code: string) => void
}) {
  const { t } = useTranslation()
  const [query, setQuery] = useState("")

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return LANGUAGES
    return LANGUAGES.filter(
      (l) => l.english.toLowerCase().includes(q) || l.native.toLowerCase().includes(q)
    )
  }, [query])

  return (
    <div className="flex flex-col gap-3" dir="ltr">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <span className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
          {t("language.label")}
        </span>
        <span className="type-data text-[11px] text-pencil">{LANGUAGES.length} available</span>
      </div>

      {/* Reset — intentionally always in English and visually loud. */}
      <button
        type="button"
        onClick={() => onSelect(DEFAULT_LANG)}
        className="flex items-center gap-3 rounded-lg border border-ballpoint bg-ballpoint/6 px-3 py-2.5 text-left transition-colors hover:bg-ballpoint/12"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-ballpoint text-paper">
          <ResetGlyph className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ballpoint">{t("language.resetToEnglish")}</span>
          <span className="block truncate text-xs text-pencil">{t("language.resetHint")}</span>
        </span>
      </button>

      {/* Search */}
      <div className="relative">
        <SearchGlyph className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pencil" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("language.searchPlaceholder")}
          className="h-10 w-full rounded-md border border-rule bg-paper pl-9 pr-3 text-sm text-ink placeholder:text-pencil focus:border-ballpoint focus:outline-none"
        />
      </div>

      {/* Grid */}
      {matches.length === 0 ? (
        <p className="px-1 py-6 text-center text-sm text-pencil">{t("language.noMatches")}</p>
      ) : (
        <div className="-mr-1 grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
          {matches.map((l) => {
            const active = l.code === current
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => onSelect(l.code)}
                dir={l.dir}
                className={`relative flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition-colors ${
                  active
                    ? "border-ballpoint bg-ballpoint/7"
                    : "border-rule hover:border-ballpoint hover:bg-secondary"
                }`}
              >
                {active && (
                  <CheckGlyph className="absolute right-2 top-2 h-3.5 w-3.5 text-ballpoint" />
                )}
                <span className="truncate text-sm font-medium text-ink">{l.native}</span>
                <span className="truncate text-[11px] text-pencil" dir="ltr">
                  {l.english}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <p className="border-t border-rule pt-2.5 text-[11px] leading-snug text-pencil">
        {t("language.contentTip")}
      </p>
    </div>
  )
}

function CheckGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  )
}

function SearchGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.2 4.2" />
    </svg>
  )
}

function ResetGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4.5 12a7.5 7.5 0 1 1 2.2 5.3" />
      <path d="M4.2 18.5V13.7h4.8" />
    </svg>
  )
}
