import { promises as fs } from "fs";
import path from "path";

/**
 * Minimal image storage abstraction.
 *
 * Currently writes to public/uploads/** so files are served statically by
 * Next.js. On serverless hosts (e.g. Vercel) the filesystem is ephemeral —
 * swap the body of `saveImageFromDataUrl` for S3 / Vercel Blob / Cloudinary
 * there; the call sites only depend on the returned public URL.
 */
const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

const DATA_URL_PATTERN =
  /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB

/**
 * Confirms the decoded bytes really are the claimed raster image by checking
 * the file signature (magic bytes). Stops a crafted "image/png" data URL whose
 * body is actually HTML/SVG/script from being written and later served from
 * /uploads where a browser could be tricked into executing it.
 */
function detectImageType(buf: Buffer): "png" | "jpg" | "webp" | null {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
    return "png";
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  )
    return "webp";
  return null;
}

export async function saveImageFromDataUrl(
  dataUrl: string,
  folder: "diagrams" = "diagrams"
): Promise<{ url: string; bytes: number }> {
  const match = DATA_URL_PATTERN.exec(dataUrl);
  if (!match) {
    throw new Error("Expected a base64 data URL of type png, jpeg or webp");
  }
  const [, declaredExt, base64] = match;
  const buffer = Buffer.from(base64, "base64");
  if (buffer.length === 0) throw new Error("Empty image");
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error(`Image exceeds ${MAX_IMAGE_BYTES / 1024 / 1024} MB limit`);
  }

  // Trust the magic bytes, not the declared MIME type.
  const detected = detectImageType(buffer);
  const expected = declaredExt === "jpeg" ? "jpg" : declaredExt;
  if (!detected || detected !== expected) {
    throw new Error("File content does not match a valid PNG, JPEG or WEBP image");
  }

  const fileName = `${globalThis.crypto.randomUUID()}.${detected}`;
  const dir = path.join(UPLOADS_ROOT, folder);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, fileName), buffer);

  return { url: `/uploads/${folder}/${fileName}`, bytes: buffer.length };
}
