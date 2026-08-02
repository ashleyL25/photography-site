/**
 * Build-time image pipeline.
 *
 * Reads the untouched originals from ./images (6000x4000, ~20MB each), and emits
 * responsive WebP renditions into public/photos plus a typed manifest at
 * src/data/photos.generated.ts.
 *
 * Run with `npm run images`. Re-runs skip files that are already up to date.
 */
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIR = path.join(ROOT, 'images')
const OUT_DIR = path.join(ROOT, 'public', 'photos')
const MANIFEST = path.join(ROOT, 'src', 'data', 'photos.generated.ts')

const WIDTHS = [480, 960, 1440, 2000, 2600]
const QUALITY = 78

/** Source folder -> category slug. Anything unlisted falls back to `misc`. */
const CATEGORIES = {
  '06-27-2024__puppies': 'pets',
  '2022.06.10 Grant & Sara Wedding Rehearsal': 'wedding',
  '2022.06.22 SG Engagement': 'engagement',
  '2023.08.04 MC Engagement': 'engagement',
  '2023.09.17 Elise Portraits': 'seniors',
  '2024.05.03 forest portrait': 'seniors',
  '2024.05.03 Graduation-family portraits': 'family',
  '2024.09.28 Maddie & Will': 'couples',
  '2025.06.10 Europe': 'travel',
  '2026.05.09 Elise Grad Pictures': 'graduation',
  Backgrounds: 'backgrounds',
  Ashley: 'about',
}

const slug = (s) =>
  s
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/**
 * Slug for a filename: drops the extension first.
 *
 * Folder names here contain dots ("2022.06.22 SG Engagement"), so stripping a
 * trailing ".ext" from them would truncate the name and collide two shoots.
 * Only filenames go through this.
 */
const fileSlug = (s) => slug(s.replace(/\.[^.]+$/, ''))

/**
 * One-off sources outside the images tree.
 * TODO: replace the about portrait with a current photo of Ashley — this one is
 * from the 2019 site and its teal grade fights the palette.
 * Prefer dropping new portraits into images/Ashley instead.
 */
const EXTRA = [
  {
    category: 'about',
    file: path.resolve(
      ROOT,
      '..',
      'Old Sites',
      'HTML-2020-photography',
      'Ashley Main Street (5 of 1).jpg',
    ),
  },
]

function collect() {
  const out = []
  for (const extra of EXTRA) {
    if (!fs.existsSync(extra.file)) continue
    out.push({
      id: `${extra.category}-${fileSlug(path.basename(extra.file))}`,
      category: extra.category,
      shoot: extra.category,
      source: extra.file,
      mtime: fs.statSync(extra.file).mtimeMs,
    })
  }
  for (const dir of fs.readdirSync(SRC_DIR).sort()) {
    const full = path.join(SRC_DIR, dir)
    if (!fs.statSync(full).isDirectory()) continue
    const category = CATEGORIES[dir] ?? 'misc'
    for (const file of fs.readdirSync(full).sort()) {
      if (!/\.(jpe?g|png|webp)$/i.test(file)) continue
      out.push({
        id: `${category}-${fileSlug(file)}`,
        category,
        // The source folder is one shoot; the portfolio groups on this.
        shoot: slug(dir),
        source: path.join(full, file),
        mtime: fs.statSync(path.join(full, file)).mtimeMs,
      })
    }
  }
  return out
}

async function process(photo) {
  const dir = path.join(OUT_DIR, photo.category)
  fs.mkdirSync(dir, { recursive: true })

  const image = sharp(photo.source, { failOn: 'none' }).rotate()
  const meta = await image.metadata()
  const widths = WIDTHS.filter((w) => w <= meta.width)
  if (widths.length === 0) widths.push(meta.width)

  const name = fileSlug(path.basename(photo.source))
  const rendered = []

  for (const w of widths) {
    const file = path.join(dir, `${name}-${w}.webp`)
    if (!fs.existsSync(file) || fs.statSync(file).mtimeMs < photo.mtime) {
      await image
        .clone()
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: QUALITY, effort: 5 })
        .toFile(file)
    }
    rendered.push(w)
  }

  // Tiny inline placeholder so images fade up from a colour-correct blur
  // instead of a blank box.
  const lqip = await image
    .clone()
    .resize({ width: 20 })
    .blur(1.2)
    .webp({ quality: 40 })
    .toBuffer()

  const stats = await image.clone().resize({ width: 64 }).stats()
  const [r, g, b] = stats.channels.map((c) => Math.round(c.mean))

  return {
    id: photo.id,
    category: photo.category,
    shoot: photo.shoot,
    src: `/photos/${photo.category}/${name}`,
    widths: rendered,
    width: meta.width,
    height: meta.height,
    aspect: +(meta.width / meta.height).toFixed(4),
    color: `rgb(${r} ${g} ${b})`,
    lqip: `data:image/webp;base64,${lqip.toString('base64')}`,
  }
}

const photos = collect()
console.log(`Found ${photos.length} source images.`)

const results = []
for (const [i, photo] of photos.entries()) {
  results.push(await process(photo))
  process_log(i + 1, photos.length, photo.id)
}

function process_log(i, total, id) {
  console.log(`[${String(i).padStart(3)}/${total}] ${id}`)
}

fs.mkdirSync(path.dirname(MANIFEST), { recursive: true })
fs.writeFileSync(
  MANIFEST,
  `// AUTO-GENERATED by scripts/optimize-images.mjs — do not edit by hand.
export type PhotoCategory = ${[...new Set(results.map((r) => r.category))]
    .sort()
    .map((c) => `'${c}'`)
    .join(' | ')}

export type Photo = {
  id: string
  category: PhotoCategory
  /** Slug of the source folder — one real shoot. */
  shoot: string
  /** Path prefix; append \`-\${width}.webp\` for a rendition. */
  src: string
  widths: number[]
  width: number
  height: number
  aspect: number
  /** Average colour, used as the pre-load background. */
  color: string
  /** 20px inline blur placeholder. */
  lqip: string
}

export const PHOTOS: Photo[] = ${JSON.stringify(results, null, 2)}

export const BY_ID = Object.fromEntries(PHOTOS.map((p) => [p.id, p])) as Record<string, Photo>

export const BY_SHOOT = PHOTOS.reduce<Record<string, Photo[]>>((acc, p) => {
  ;(acc[p.shoot] ??= []).push(p)
  return acc
}, {})
`,
  'utf8',
)

console.log(`\nWrote ${results.length} entries to ${path.relative(ROOT, MANIFEST)}`)
