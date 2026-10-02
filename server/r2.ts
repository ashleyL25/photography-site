import {
  S3Client,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { env } from './env.js'

/**
 * Cloudflare R2 over its S3-compatible API.
 *
 * ## How media is served
 *
 * The bucket is public-read, and the browser fetches every image **straight from
 * Cloudflare** — bytes never pass through the Node process, so images cost
 * nothing against the Hostinger bandwidth allowance and are cached at the edge.
 *
 * That is the right trade here and would not be for the photography galleries,
 * where a bucket had to stay private because the photographs were a client's.
 * Everything in this bucket is published on a public website by definition: a
 * portfolio image, a blog illustration, a downloadable PDF. Locking it behind
 * signed URLs would add expiry bugs and defeat edge caching to protect files
 * whose whole purpose is being seen.
 *
 * Uploads still go browser → R2 directly, but through a **presigned PUT** that
 * this server only issues to a signed-in editor. So writing is authenticated and
 * reading is open, which matches what the files are.
 *
 * `region: 'auto'` is required — R2 has no regions, but SigV4 needs a value.
 */
const endpoint = env.S3_API_ENDPOINT || `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`

const s3 = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    // Empty strings when R2 is not configured; nothing calls S3 in that case,
    // because every media route checks `mediaConfigured` first.
    accessKeyId: env.R2_ACCESS_KEY_ID || 'unset',
    secretAccessKey: env.R2_SECRET_ACCESS_KEY || 'unset',
  },
})

export const BUCKET = env.R2_BUCKET

/** Generous: a large original on slow upstream is slow, and a re-sign is a round trip. */
const UPLOAD_URL_TTL_SECONDS = 30 * 60

/**
 * What may be uploaded.
 *
 * Allowlisted rather than blocklisted because this value is signed into the URL
 * and then echoed back to browsers as the object's `Content-Type` — an
 * attacker-chosen value there is a stored-XSS primitive, which is exactly what
 * `text/html` would give. SVG is excluded for the same reason: it is a document
 * that can carry script, not an image.
 */
export const ALLOWED_UPLOAD_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
  'application/epub+zip': 'epub',
  'text/plain': 'txt',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}

/** 25 MB. Comfortably above a full-resolution photograph and a long PDF. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024

/**
 * Object keys.
 *
 * Prefixed by year and month so the bucket stays browsable by hand years from
 * now, and suffixed with the media id so two files uploaded under the same name
 * cannot overwrite each other. The id is a UUID, which also makes keys
 * unguessable — defense in depth rather than the access control itself, since
 * this bucket is public by design.
 */
export function mediaKey(id: string, filename: string, mime: string): string {
  const now = new Date()
  const stamp = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  const ext = ALLOWED_UPLOAD_TYPES[mime] ?? 'bin'

  // Keep something human-readable from the original name, but only characters
  // that survive a URL, a filesystem and a shell without quoting.
  const base = filename
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'file'

  return `media/${stamp}/${base}-${id.slice(0, 8)}.${ext}`
}

/** The permanent public URL for an object. Stored on the row at upload time. */
/**
 * Where one photograph's renditions live: `media/2026/10/name-ab12cd34`, to
 * which `-<width>.webp` is appended per rendition.
 */
export function photoPrefix(id: string, filename: string): string {
  const now = new Date()
  const stamp = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  const base =
    filename
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'photo'
  return `media/${stamp}/${base}-${id.slice(0, 8)}`
}

export function publicUrl(key: string): string {
  return `${env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`
}

/** A short-lived URL the browser can PUT the file's bytes to. */
export async function presignPut(key: string, contentType: string): Promise<string> {
  return getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
      /**
       * A year, immutable. Safe because a key is never reused: replacing an
       * image uploads a new object under a new id and repoints the row.
       */
      CacheControl: 'public, max-age=31536000, immutable',
    }),
    { expiresIn: UPLOAD_URL_TTL_SECONDS },
  )
}

/**
 * Whether the bytes actually arrived.
 *
 * Checked before the media row is written, rather than trusting the browser's
 * word. A dropped upload that still reported success would otherwise become a
 * permanent broken image with nothing to notice it but looking at the page.
 */
export async function objectExists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    return true
  } catch {
    return false
  }
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

/**
 * Verifies the bucket is reachable and the credentials work, at boot.
 *
 * `MaxKeys: 1` because the answer wanted is "does this respond", not "what is in
 * it" — listing a bucket with thousands of objects to learn that would be rude
 * to both ends.
 */
export async function assertR2Reachable(): Promise<void> {
  await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, MaxKeys: 1 }))
}
