import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentSession } from "@/lib/auth"
import {
  DEFAULT_LANG,
  LANG_COOKIE,
  LANG_COOKIE_MAX_AGE,
  getLanguage,
  isSupported,
} from "@/lib/i18n/languages"

// Single, deduped notification used as the "reset to English" lifeline for
// signed-in users (see below). Matched by exact title so we keep just one.
const LANG_NOTIF_TITLE = "🌐 Language changed"

/**
 * POST /api/language  { lang }
 *
 * Persists the visitor's language: always sets the first-party `lang` cookie
 * (so it survives reloads and is the source of truth for both signed-out and
 * signed-in users), and for signed-in users mirrors it to UserSettings.language.
 *
 * "Reset to English" as a released notification: when a signed-in user switches
 * to a NON-English language we (re)create one English-language notification
 * telling them how to get back — so a user stranded in an unfamiliar script
 * always has a lifeline in their notifications. Switching back to English clears
 * it. (The notification text is intentionally English.)
 */
export async function POST(req: NextRequest) {
  let lang = DEFAULT_LANG
  try {
    const body = await req.json()
    if (typeof body?.lang === "string") lang = body.lang
  } catch {
    /* fall through to validation */
  }

  if (!isSupported(lang)) {
    return NextResponse.json({ error: "Unsupported language" }, { status: 400 })
  }

  const res = NextResponse.json({ ok: true, lang })
  res.cookies.set(LANG_COOKIE, lang, {
    path: "/",
    maxAge: LANG_COOKIE_MAX_AGE,
    sameSite: "lax",
  })

  const session = await getCurrentSession()
  const userId = session?.user?.id
  if (userId) {
    // updateMany (not upsert) so we never create a half-populated settings row;
    // the cookie covers users who haven't opened settings yet.
    await prisma.userSettings
      .updateMany({ where: { userId }, data: { language: lang } })
      .catch(() => undefined)

    await prisma.notification
      .deleteMany({ where: { userId, title: LANG_NOTIF_TITLE } })
      .catch(() => undefined)

    if (lang !== DEFAULT_LANG) {
      const native = getLanguage(lang)?.native ?? lang
      await prisma.notification
        .create({
          data: {
            userId,
            title: LANG_NOTIF_TITLE,
            message: `Your language is now ${native}. If this was a mistake, open the footer language menu (or Settings) and choose "Reset to English".`,
            type: "INFO",
          },
        })
        .catch(() => undefined)
    }
  }

  return res
}
