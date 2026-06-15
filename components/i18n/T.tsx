"use client"

import { useTranslation } from "react-i18next"

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
  const { t } = useTranslation()
  return <>{t(k, values)}</>
}
