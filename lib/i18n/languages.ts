/**
 * Supported languages — English plus the 22 languages of the Eighth Schedule
 * to the Constitution of India. `native` is the endonym (the language's own
 * name in its own script), so the picker is readable even before any UI strings
 * have been translated. `dir` flips the layout for right-to-left scripts.
 */
export type LangDir = "ltr" | "rtl"

export interface Language {
  code: string // BCP-47-ish code used for the cookie, <html lang>, and locale files
  english: string
  native: string
  dir: LangDir
}

export const DEFAULT_LANG = "en"
export const LANG_COOKIE = "lang"
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

// Window event dispatched when the first-visit language chooser is dismissed, so
// the cookie banner can wait its turn instead of stacking on top of it.
export const LANGUAGE_CHOSEN_EVENT = "penwise:language-chosen"

export const LANGUAGES: Language[] = [
  { code: "en", english: "English", native: "English", dir: "ltr" },
  { code: "hi", english: "Hindi", native: "हिन्दी", dir: "ltr" },
  { code: "bn", english: "Bengali", native: "বাংলা", dir: "ltr" },
  { code: "te", english: "Telugu", native: "తెలుగు", dir: "ltr" },
  { code: "mr", english: "Marathi", native: "मराठी", dir: "ltr" },
  { code: "ta", english: "Tamil", native: "தமிழ்", dir: "ltr" },
  { code: "ur", english: "Urdu", native: "اردو", dir: "rtl" },
  { code: "gu", english: "Gujarati", native: "ગુજરાતી", dir: "ltr" },
  { code: "kn", english: "Kannada", native: "ಕನ್ನಡ", dir: "ltr" },
  { code: "or", english: "Odia", native: "ଓଡ଼ିଆ", dir: "ltr" },
  { code: "ml", english: "Malayalam", native: "മലയാളം", dir: "ltr" },
  { code: "pa", english: "Punjabi", native: "ਪੰਜਾਬੀ", dir: "ltr" },
  { code: "as", english: "Assamese", native: "অসমীয়া", dir: "ltr" },
  { code: "mai", english: "Maithili", native: "मैथिली", dir: "ltr" },
  { code: "sat", english: "Santali", native: "ᱥᱟᱱᱛᱟᱲᱤ", dir: "ltr" },
  { code: "ks", english: "Kashmiri", native: "کٲشُر", dir: "rtl" },
  { code: "ne", english: "Nepali", native: "नेपाली", dir: "ltr" },
  { code: "kok", english: "Konkani", native: "कोंकणी", dir: "ltr" },
  { code: "sd", english: "Sindhi", native: "سنڌي", dir: "rtl" },
  { code: "doi", english: "Dogri", native: "डोगरी", dir: "ltr" },
  { code: "mni", english: "Manipuri", native: " মৈতৈলোন্", dir: "ltr" },
  { code: "brx", english: "Bodo", native: "बड़ो", dir: "ltr" },
  { code: "sa", english: "Sanskrit", native: "संस्कृतम्", dir: "ltr" },
]

export const LANG_CODES = LANGUAGES.map((l) => l.code)

const BY_CODE = new Map(LANGUAGES.map((l) => [l.code, l]))

export function isSupported(code: string | null | undefined): boolean {
  return !!code && BY_CODE.has(code)
}

export function getLanguage(code: string): Language | undefined {
  return BY_CODE.get(code)
}

export function langDir(code: string): LangDir {
  return BY_CODE.get(code)?.dir ?? "ltr"
}
