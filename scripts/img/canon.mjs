import { createHash } from "node:crypto"

/**
 * Image identity, shared by extract.mjs and replace.mjs so both agree on which
 * URLs are "the same image" and what SVG filename it maps to.
 *
 * ExamGoal serves each image in two forms that are the SAME underlying file:
 *   .../fly/@width/image/<path>?format=png   (resized variant)
 *   .../image/<path>                          (original)
 * The identity is host + everything from "/image/" on (query stripped), so both
 * forms collapse to one key → one downloaded file → one SVG.
 */
export function canonicalKey(raw) {
  const cleaned = String(raw).trim().replace(/[.,;]+$/, "")
  try {
    const url = new URL(cleaned)
    const idx = url.pathname.indexOf("/image/")
    if (idx >= 0) return `${url.host}/image/${url.pathname.slice(idx + "/image/".length)}`
    return `${url.host}${url.pathname}`
  } catch {
    return cleaned
  }
}

/** Original-quality download URL reconstructed from the canonical key. */
export function downloadUrl(key) {
  return `https://${key}`
}

/** Stable 16-hex filename stem for an image. */
export function hashFor(key) {
  return createHash("sha1").update(key).digest("hex").slice(0, 16)
}

// Matches the image URLs we care about (image extension or a known image CDN).
export const URL_RE = /https?:\/\/[^\s"'<>()\\]+/gi
export function isImageUrl(url) {
  return (
    /\.(png|jpe?g|webp|gif|bmp|svg)(\?|$)/i.test(url) ||
    /examgoal|imghippo|builder\.io|cloudinary|imgur|amazonaws|googleusercontent|grdp\.co|svgshare/i.test(url)
  )
}
