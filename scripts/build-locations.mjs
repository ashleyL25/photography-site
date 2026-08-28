/**
 * Turns the Locations folder into web renditions plus a manifest.
 *
 *   npm run locations -- --src "/Volumes/T7/Clients/AM/Photography Site/Locations"
 *
 * ## The folder is the input format
 *
 *   Locations/
 *     Deer Ridge Park/
 *       IMG_1234.jpg              <- Ashley's own. No credit.
 *       laura-wills/
 *         credit.md               <- who took the ones beside it
 *         August2024-83.jpg       <- credited to Laura Wills Photography
 *
 * A photograph sitting directly in a location folder is Ashley's and is not
 * credited. A photograph inside a subfolder belongs to whoever that subfolder's
 * `credit.md` names, and the site prints the credit beside it. That rule is the
 * whole reason for the nesting — it means "is this mine?" is answered by where
 * the file is, not by remembering.
 *
 * ## Output
 *
 * Renditions and `locations.json` land in `.locations-build/`, which is
 * gitignored: these files belong in the Cloudflare bucket, not in this
 * repository. Upload the contents, point `VITE_LOCATIONS_MANIFEST_URL` at the
 * manifest, and the guide picks them up at runtime.
 *
 * Folder names are matched to the slugs in src/data/locations.ts. A folder that
 * matches nothing is a hard error rather than a silent skip, because the
 * failure mode otherwise is photographs that quietly never appear.
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT_DIR = path.join(ROOT, '.locations-build')
const WIDTHS = [480, 960, 1440, 2000, 2600]
const QUALITY = 82

const args = process.argv.slice(2)
const argOf = (flag) => {
  const i = args.indexOf(flag)
  return i === -1 ? undefined : args[i + 1]
}

const SRC =
  argOf('--src') ??
  process.env.LOCATIONS_SRC ??
  '/Volumes/T7/Clients/AM/Photography Site/Locations'

/** Where the bucket serves these from. `src` in the manifest is absolute. */
const BASE_URL = (argOf('--base') ?? process.env.LOCATIONS_BASE_URL ?? '').replace(/\/$/, '')

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/** Slugs the site knows about, read straight from the data file. */
function knownSlugs() {
  const file = fs.readFileSync(path.join(ROOT, 'src', 'data', 'locations.ts'), 'utf8')
  return new Set([...file.matchAll(/slug: '([^']+)'/g)].map((m) => m[1]))
}

/** `Key: value` on one line, or the value on the line after. Both appear. */
function field(text, key) {
  const lines = text.split('\n')
  const i = lines.findIndex((l) => l.trim().toLowerCase().startsWith(key.toLowerCase() + ':'))
  if (i === -1) return undefined
  const inline = lines[i].slice(lines[i].indexOf(':') + 1).trim()
  if (inline) return inline
  return lines.slice(i + 1).find((l) => l.trim())?.trim()
}

function readCredit(dir) {
  const file = path.join(dir, 'credit.md')
  if (!fs.existsSync(file)) return undefined
  const text = fs.readFileSync(file, 'utf8')
  const name = field(text, 'Name') ?? path.basename(dir)
  const credit = { name }
  const url = field(text, 'Website')
  if (url) credit.url = url
  const subject = field(text, 'People/subject') ?? field(text, 'Subject')
  if (subject) credit.subject = subject
  return credit
}

const isImage = (f) => /\.(jpe?g|png|webp)$/i.test(f) && !f.startsWith('._')

/** Every image under a location folder, with the credit its folder implies. */
function collect(locationDir) {
  const out = []
  for (const entry of fs.readdirSync(locationDir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const full = path.join(locationDir, entry.name)
    if (entry.isDirectory()) {
      const credit = readCredit(full)
      if (!credit) {
        console.warn(`  ! ${entry.name}/ has no credit.md — skipped`)
        continue
      }
      for (const file of fs.readdirSync(full)) {
        if (isImage(file)) out.push({ source: path.join(full, file), credit })
      }
    } else if (isImage(entry.name)) {
      out.push({ source: full })
    }
  }
  return out
}

async function render(photo, slug) {
  const dir = path.join(OUT_DIR, 'locations', slug)
  fs.mkdirSync(dir, { recursive: true })

  const image = sharp(photo.source, { failOn: 'none' }).rotate()
  const meta = await image.metadata()
  const widths = WIDTHS.filter((w) => w <= meta.width)
  if (widths.length === 0) widths.push(meta.width)

  const name = slugify(path.basename(photo.source, path.extname(photo.source)))

  for (const w of widths) {
    const file = path.join(dir, `${name}-${w}.webp`)
    if (!fs.existsSync(file)) {
      await image
        .clone()
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: QUALITY, effort: 5 })
        .toFile(file)
    }
  }

  const lqip = await image.clone().resize({ width: 20 }).blur(1.2).webp({ quality: 40 }).toBuffer()
  const stats = await image.clone().resize({ width: 64 }).stats()
  const [r, g, b] = stats.channels.map((c) => Math.round(c.mean))

  return {
    id: `location-${slug}-${name}`,
    src: `${BASE_URL}/locations/${slug}/${name}`,
    widths,
    width: meta.width,
    height: meta.height,
    aspect: +(meta.width / meta.height).toFixed(4),
    color: `rgb(${r} ${g} ${b})`,
    lqip: `data:image/webp;base64,${lqip.toString('base64')}`,
    ...(photo.credit ? { credit: photo.credit } : {}),
  }
}

/* ------------------------------------------------------------------ */

if (!fs.existsSync(SRC)) {
  console.error(`Source folder not found: ${SRC}`)
  console.error('Pass one with --src, or set LOCATIONS_SRC.')
  process.exit(1)
}
if (!BASE_URL) {
  console.warn('! No --base / LOCATIONS_BASE_URL given.')
  console.warn('  `src` will be a bucket-relative path; set it before uploading.\n')
}

const known = knownSlugs()
const albums = []
let count = 0
let credited = 0

for (const entry of fs.readdirSync(SRC, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name.startsWith('.')) continue

  const slug = slugify(entry.name)
  if (!known.has(slug)) {
    console.error(`\n"${entry.name}" slugifies to "${slug}", which is not in locations.ts.`)
    console.error(`Known: ${[...known].join(', ')}`)
    process.exit(1)
  }

  const photos = collect(path.join(SRC, entry.name))
  if (photos.length === 0) continue

  console.log(`${entry.name} -> ${slug} (${photos.length})`)
  const rendered = []
  for (const photo of photos) {
    rendered.push(await render(photo, slug))
    count++
    if (photo.credit) credited++
    process.stdout.write(`  ${path.basename(photo.source)}${photo.credit ? ` — © ${photo.credit.name}` : ''}\n`)
  }
  albums.push({ slug, photos: rendered })
}

fs.mkdirSync(OUT_DIR, { recursive: true })
fs.writeFileSync(path.join(OUT_DIR, 'locations.json'), JSON.stringify({ albums }, null, 2))

console.log(`\n${count} photographs across ${albums.length} locations, ${credited} credited.`)
console.log(`Written to ${path.relative(ROOT, OUT_DIR)}/`)
console.log('Upload its contents to the bucket, keeping the folder structure.')
