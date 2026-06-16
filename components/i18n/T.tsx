"use client"

import { useTranslation } from "react-i18next"
// Importing the configured instance runs its one-time init (registers
// initReactI18next + bundles English), so <T> never renders without an i18n
// instance — even during static prerender, where relying on a provider's import
// left "NO_I18NEXT_INSTANCE" and raw keys (e.g. footer.*, auto.missionPage.*).
import i18n from "./i18n"

/**
 * Translation island: renders a single translated string by key. Lets SERVER
 * components (which can't use the useTranslation hook) show translatable text —
 * drop `<T k="footer.rights" />` wherever a hardcoded string used to be. SSR and
 * the first client render are both English, so hydration stays clean; the string
 * re-renders into the chosen language once the provider switches after mount.
 */
export default function T({
  k,
  values,
}: {
  k: string
  values?: Record<string, unknown>
}) {
  // Subscribe to language changes (re-render on switch) via the hook — the
  // instance now always exists thanks to the import above — and resolve through
  // the instance's synchronous store lookup so the bundled English catalog
  // renders immediately on SSR/prerender, never a raw key.
  useTranslation()
  return <>{i18n.t(k, values)}</>
}
