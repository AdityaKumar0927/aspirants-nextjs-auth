import type { Resource } from "i18next"
import en from "./en/common.json"

/**
 * English is bundled (source of truth + instant first paint / offline). Other
 * languages are loaded at runtime from /public/locales/<code>/common.json by
 * ensureLanguageLoaded() — so the catalogs that scripts/translate-locales.mjs
 * generates are picked up without rebuilding or editing this file.
 */
export const resources: Resource = {
  en: { common: en },
}
