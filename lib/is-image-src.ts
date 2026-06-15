/**
 * Is this string an image to render (vs prose to typeset)?
 *
 * Question option / explanation / markscheme content historically used a bare
 * `startsWith("http")` check to decide "render as image". Once CDN images are
 * rewritten to self-hosted local paths (e.g. /q-img/<hash>.svg) that check
 * fails, so this helper also recognises local paths and image extensions.
 */
export function isImageSrc(s: string | null | undefined): boolean {
  if (!s) return false
  const v = s.trim()
  return (
    /^https?:\/\//i.test(v) ||
    v.startsWith("/q-img/") ||
    /\.(svg|png|jpe?g|webp|gif)(\?|$)/i.test(v)
  )
}
