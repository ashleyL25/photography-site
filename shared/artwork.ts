/**
 * The site's own line drawings — the motifs set faintly behind a section, and
 * the objects that float in its margins.
 *
 * Drawn here as SVG rather than shipped as image files, so they cost nothing to
 * load, stay sharp at any size, and take their colour from the palette: every
 * drawing is strokes only, painted in `currentColor`. Each is defined on a
 * 100 × 100 grid and returned as the inner markup of an <svg>.
 *
 * They are generated from a little geometry rather than traced, which is why a
 * wreath's leaves are perfectly even — the point is a printed ornament, not a
 * sketch.
 */

const r = (n: number) => Math.round(n * 100) / 100
const rad = (deg: number) => (deg * Math.PI) / 180

/** An almond-shaped leaf, its base at (x, y), pointing at `angle` degrees. */
function leaf(x: number, y: number, angle: number, length: number, width: number) {
  return `<path d="M0 0Q${r(width / 2)} ${r(-length / 2)} 0 ${r(-length)}Q${r(-width / 2)} ${r(-length / 2)} 0 0Z" transform="translate(${r(x)} ${r(y)}) rotate(${r(angle)})"/>`
}

function circle(cx: number, cy: number, radius: number) {
  return `<circle cx="${r(cx)}" cy="${r(cy)}" r="${r(radius)}"/>`
}

function path(d: string) {
  return `<path d="${d}"/>`
}

/** Points around a circle, for rays, petals and blades. */
function around(count: number, offset = 0) {
  return Array.from({ length: count }, (_, i) => rad(offset + (360 / count) * i))
}

const aperture = () => {
  const blades = around(6, 15)
    .map((a, i, all) => {
      const b = all[(i + 1) % all.length]
      const outer = [50 + 40 * Math.cos(a), 50 + 40 * Math.sin(a)]
      const inner = [50 + 15 * Math.cos(b), 50 + 15 * Math.sin(b)]
      return `M${r(outer[0])} ${r(outer[1])}L${r(inner[0])} ${r(inner[1])}`
    })
    .join('')
  const hex = around(6, 15 + 60)
    .map((a, i) => `${i ? 'L' : 'M'}${r(50 + 15 * Math.cos(a))} ${r(50 + 15 * Math.sin(a))}`)
    .join('')
  return circle(50, 50, 40) + circle(50, 50, 44) + path(blades) + path(`${hex}Z`)
}

const camera = () =>
  path('M12 34h18l6-9h28l6 9h18a4 4 0 0 1 4 4v38a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V38a4 4 0 0 1 4-4Z') +
  circle(50, 56, 17) +
  circle(50, 56, 11) +
  circle(50, 56, 4) +
  path('M16 28h9M76 42h8') +
  path('M44 25v-4h12v4')

const filmStrip = () => {
  const holes = Array.from({ length: 7 }, (_, i) => {
    const x = 14 + i * 11.5
    return `<rect x="${r(x)}" y="23" width="5" height="5" rx="1"/><rect x="${r(x)}" y="72" width="5" height="5" rx="1"/>`
  }).join('')
  return (
    path('M6 18h88v64H6Z') +
    holes +
    `<rect x="12" y="34" width="22" height="32" rx="1.5"/><rect x="39" y="34" width="22" height="32" rx="1.5"/><rect x="66" y="34" width="22" height="32" rx="1.5"/>` +
    path('M16 60l6-9 5 6 3-4 4 7')
  )
}

const canister = () =>
  path('M28 22h34v60H28Z') +
  path('M32 22v-6h26v6M32 82v4h26v-4') +
  path('M42 16v-5h6v5') +
  path('M62 34h22a3 3 0 0 1 3 3v26a3 3 0 0 1-3 3H62') +
  path('M68 38v4M74 38v4M80 38v4M68 58v4M74 58v4M80 58v4') +
  path('M34 40h22M34 64h22')

const polaroid = () =>
  `<rect x="18" y="12" width="64" height="76" rx="2"/><rect x="24" y="18" width="52" height="52"/>` +
  path('M28 62l12-14 9 10 6-6 17 14') +
  circle(62, 30, 5) +
  path('M30 80h24')

const lens = () => circle(50, 50, 40) + circle(50, 50, 31) + circle(50, 50, 20) + circle(50, 50, 9) + path('M36 36a20 20 0 0 1 10-6')

const sun = () => {
  const rays = around(16)
    .map((a, i) => {
      const inner = 24
      const outer = i % 2 ? 36 : 44
      return `M${r(50 + inner * Math.cos(a))} ${r(50 + inner * Math.sin(a))}L${r(50 + outer * Math.cos(a))} ${r(50 + outer * Math.sin(a))}`
    })
    .join('')
  return circle(50, 50, 17) + path(rays)
}

const sunset = () => {
  const rays = around(9, 180)
    .slice(0, 9)
    .map((_, i) => {
      const a = rad(180 + i * 22.5)
      return `M${r(50 + 26 * Math.cos(a))} ${r(66 + 26 * Math.sin(a))}L${r(50 + 38 * Math.cos(a))} ${r(66 + 38 * Math.sin(a))}`
    })
    .join('')
  return path('M30 66a20 20 0 0 1 40 0') + path(rays) + path('M8 66h84M18 74h64M30 82h40')
}

const moon = () =>
  path('M58 16a34 34 0 1 0 26 52A28 28 0 0 1 58 16Z') + sparklePath(78, 22, 7) + sparklePath(86, 44, 4) + circle(70, 34, 1.2)

function sparklePath(x: number, y: number, s: number) {
  return path(
    `M${r(x)} ${r(y - s)}Q${r(x + s * 0.18)} ${r(y - s * 0.18)} ${r(x + s)} ${r(y)}Q${r(x + s * 0.18)} ${r(y + s * 0.18)} ${r(x)} ${r(y + s)}Q${r(x - s * 0.18)} ${r(y + s * 0.18)} ${r(x - s)} ${r(y)}Q${r(x - s * 0.18)} ${r(y - s * 0.18)} ${r(x)} ${r(y - s)}Z`,
  )
}

const sparkles = () => sparklePath(44, 46, 30) + sparklePath(78, 22, 11) + sparklePath(76, 76, 7) + circle(20, 82, 1.5) + circle(86, 50, 1.2)

const laurel = () => {
  // Leaves along two arcs of one circle, opening at the top like a wreath.
  const side = (dir: 1 | -1) => {
    let out = ''
    const start = dir === 1 ? 100 : 80
    const arc = `M${r(50 + 38 * Math.cos(rad(start)))} ${r(50 + 38 * Math.sin(rad(start)))}A38 38 0 0 ${dir === 1 ? 1 : 0} ${r(50 + 38 * Math.cos(rad(start + dir * 150)))} ${r(50 + 38 * Math.sin(rad(start + dir * 150)))}`
    out += path(arc)
    for (let i = 0; i < 8; i++) {
      const a = start + dir * (12 + i * 17)
      const x = 50 + 38 * Math.cos(rad(a))
      const y = 50 + 38 * Math.sin(rad(a))
      const tangent = a + dir * 90 + 90
      out += leaf(x, y, tangent - 40, 12, 5.5) + leaf(x, y, tangent + 40, 12, 5.5)
    }
    return out
  }
  return side(1) + side(-1) + path('M44 92l6-4 6 4')
}

const sprig = () => {
  let out = path('M50 94C48 70 50 40 56 8')
  for (let i = 0; i < 7; i++) {
    const y = 84 - i * 11
    const x = 49.5 + (i * i) / 9
    const len = 18 - i * 1.6
    out += leaf(x, y, -55 + i * 3, len, len * 0.42) + leaf(x, y - 4, 50 + i * 2, len * 0.95, len * 0.4)
  }
  return out + leaf(56, 10, 12, 9, 4)
}

const fern = () => {
  let out = path('M50 96C50 70 46 40 34 8')
  for (let i = 0; i < 11; i++) {
    const t = i / 11
    const y = 90 - t * 78
    const x = 50 - t * t * 15
    const len = 26 * (1 - t) + 6
    out += path(`M${r(x)} ${r(y)}q${r(-len * 0.6)} ${r(-len * 0.15)} ${r(-len)} ${r(-len * 0.55)}`)
    out += path(`M${r(x)} ${r(y)}q${r(len * 0.6)} ${r(-len * 0.3)} ${r(len * 0.9)} ${r(-len * 0.75)}`)
  }
  return out
}

const wheat = () => {
  let out = path('M50 96C50 70 51 44 52 22') + path('M50 76C42 70 36 60 34 50') + path('M50 76C58 70 64 60 66 50')
  for (let i = 0; i < 7; i++) {
    const y = 46 - i * 5.5
    out += leaf(51.5, y, -32, 10, 5) + leaf(51.5, y, 32, 10, 5)
  }
  return out + leaf(52, 12, 0, 9, 4.5) + path('M52 4v8')
}

const wildflower = () => {
  const petals = around(10)
    .map((a) => leaf(50 + 5 * Math.cos(a), 30 + 5 * Math.sin(a), (a * 180) / Math.PI + 90, 17, 7))
    .join('')
  return petals + circle(50, 30, 5) + path('M50 36C50 56 48 76 50 96') + leaf(49.5, 72, -60, 18, 7) + leaf(50, 62, 55, 15, 6)
}

const rose = () =>
  // A spiralling bud inside two rings of petals, on a stem with leaves.
  path('M50 30c3-1 5 2 3 4s-6 1-6-3 4-7 9-5 7 7 4 12-10 7-15 3-7-11-3-16') +
  path('M37 26c-6 7-5 19 3 24 8 6 20 4 25-4 5-9 2-19-6-23') +
  path('M33 34c-5 9-1 21 9 25 10 3 21-2 24-12') +
  path('M37 22c5-6 15-7 21-2') +
  path('M50 60c0 12-1 24 0 36') +
  leaf(50, 80, -62, 16, 7) +
  leaf(50, 72, 60, 14, 6) +
  path('M50 88l-5-3')

/** A five-petalled flower head for bouquets. */
function bloom(x: number, y: number, size: number) {
  return (
    around(5, -90)
      .map((a) => leaf(x + size * 0.25 * Math.cos(a), y + size * 0.25 * Math.sin(a), (a * 180) / Math.PI + 90, size, size * 0.62))
      .join('') + circle(x, y, size * 0.22)
  )
}

const bouquet = () =>
  path('M50 54L42 66M50 54L58 66M50 54l-14-6M50 54l14-6M50 54V44') +
  bloom(50, 34, 11) +
  bloom(34, 44, 9) +
  bloom(66, 44, 9) +
  bloom(40, 22, 7) +
  bloom(61, 22, 7) +
  leaf(42, 60, -70, 14, 6) +
  leaf(58, 60, 70, 14, 6) +
  path('M38 62h24L52 94h-4Z') +
  path('M42 74h16M45 74c-4 4-6 9-5 12M55 74c4 4 6 9 5 12')

const birds = () =>
  path('M16 48q8-8 14 0q6-8 14 0') + path('M46 30q10-10 18 0q8-10 18 0') + path('M56 64q6-6 11 0q5-6 11 0') + path('M28 76q4-4 7 0q3-4 7 0')

const archWindow = () =>
  path('M22 92V44a28 28 0 0 1 56 0v48Z') + path('M30 92V46a20 20 0 0 1 40 0v46') + path('M50 26v66M30 60h40') + path('M16 92h68')

const rings = () => circle(40, 56, 22) + circle(62, 56, 22) + path('M58 26l4-8 4 8-4 6Z') + path('M54 24h16')

const heart = () => path('M50 84C30 70 14 56 14 38a16 16 0 0 1 36-8 16 16 0 0 1 36 8c0 18-16 32-36 46Z')

const mountains = () =>
  path('M4 82l26-38 14 18 18-30 34 50Z') + path('M54 44l8-12 8 12-5-3-3 4-3-4Z') + sun_small(76, 22) + path('M10 90h80')

function sun_small(x: number, y: number) {
  return circle(x, y, 6)
}

const pine = () =>
  path('M50 8l-16 22h8l-14 20h9l-15 22h56l-15-22h9L58 30h8Z') + path('M50 72v18') + path('M38 90h24')

const corner = () =>
  path('M8 92V30C8 18 18 8 30 8h62') +
  path('M16 92V36c0-12 8-20 20-20h56') +
  path('M28 30c0-4 4-6 7-4s3 7-1 9-9-1-9-7c0-8 9-12 16-9') +
  leaf(16, 60, 30, 12, 5) +
  leaf(60, 16, 60, 12, 5)

const flourish = () =>
  path('M6 50c12-10 22-10 30 0s18 10 28 0 20-10 30 0') +
  path('M50 50c-4-8-14-8-14-1 0 5 6 7 9 3') +
  path('M50 50c4-8 14-8 14-1 0 5-6 7-9 3') +
  circle(50, 50, 2.5)

const frame = () => `<rect x="12" y="12" width="76" height="76"/><rect x="18" y="18" width="64" height="64"/>` + path('M12 12l6 6M88 12l-6 6M12 88l6-6M88 88l-6-6')

const ARTWORK: Record<string, { label: string; draw: () => string }> = {
  aperture: { label: 'Aperture', draw: aperture },
  camera: { label: 'Camera', draw: camera },
  lens: { label: 'Lens', draw: lens },
  'film-strip': { label: 'Film strip', draw: filmStrip },
  canister: { label: 'Film canister', draw: canister },
  polaroid: { label: 'Instant print', draw: polaroid },
  frame: { label: 'Picture frame', draw: frame },
  sun: { label: 'Sun', draw: sun },
  sunset: { label: 'Sunset', draw: sunset },
  moon: { label: 'Moon and stars', draw: moon },
  sparkles: { label: 'Sparkles', draw: sparkles },
  birds: { label: 'Birds in flight', draw: birds },
  mountains: { label: 'Mountains', draw: mountains },
  pine: { label: 'Pine', draw: pine },
  laurel: { label: 'Laurel wreath', draw: laurel },
  sprig: { label: 'Leaf sprig', draw: sprig },
  fern: { label: 'Fern', draw: fern },
  wheat: { label: 'Wheat', draw: wheat },
  wildflower: { label: 'Wildflower', draw: wildflower },
  rose: { label: 'Rose', draw: rose },
  bouquet: { label: 'Bouquet', draw: bouquet },
  rings: { label: 'Rings', draw: rings },
  heart: { label: 'Heart', draw: heart },
  arch: { label: 'Arched window', draw: archWindow },
  corner: { label: 'Corner flourish', draw: corner },
  flourish: { label: 'Flourish', draw: flourish },
}

const cache = new Map<string, string>()

/** The inner markup of a drawing's <svg viewBox="0 0 100 100">, or '' if unknown. */
export function artworkMarkup(slug: string): string {
  const art = ARTWORK[slug]
  if (!art) return ''
  if (!cache.has(slug)) cache.set(slug, art.draw())
  return cache.get(slug)!
}

export function isArtwork(value: string) {
  return value in ARTWORK
}

/** Every drawing, for the motif picker. `''` is "none". */
export const MOTIF_OPTIONS: readonly { value: string; label: string }[] = [
  { value: '', label: 'None' },
  ...Object.entries(ARTWORK).map(([value, a]) => ({ value, label: a.label })),
]

/** The drawings offered as floating objects, plus prints of the portfolio. */
export const ELEMENT_OPTIONS: readonly { value: string; label: string }[] = [
  ...Object.entries(ARTWORK).map(([value, a]) => ({ value, label: a.label })),
  { value: 'print:1', label: 'Print — first session photograph' },
  { value: 'print:2', label: 'Print — second session photograph' },
  { value: 'print:3', label: 'Print — third session photograph' },
  { value: 'print:4', label: 'Print — fourth session photograph' },
  { value: 'print:5', label: 'Print — fifth session photograph' },
]

export const MOTIF_POSITIONS = [
  { value: 'right', label: 'Right edge' },
  { value: 'left', label: 'Left edge' },
  { value: 'center', label: 'Centred' },
  { value: 'top-right', label: 'Top right' },
  { value: 'bottom-left', label: 'Bottom left' },
] as const

/* ------------------------------------------------------------------ *
 * Floating elements
 * ------------------------------------------------------------------ */

export interface DecorItem {
  /** An artwork slug, `print:N` for the Nth session photograph, or an image URL. */
  src: string
  x: number
  y: number
  size: number
  speed: number
  rotate?: number
  opacity?: number
  flip?: boolean
  desktopOnly?: boolean
}

export interface DecorPreset {
  value: string
  label: string
  items: readonly DecorItem[]
}

export const DECOR_PRESETS: readonly DecorPreset[] = [
  { value: 'none', label: 'None', items: [] },
  {
    value: 'prints',
    label: 'Scattered prints — your session photographs',
    items: [
      { src: 'print:1', x: 6, y: 24, size: 210, speed: 0.7, rotate: -7 },
      { src: 'print:2', x: 94, y: 18, size: 190, speed: 1.25, rotate: 8 },
      { src: 'print:3', x: 93, y: 78, size: 220, speed: 0.55, rotate: -4 },
      { src: 'print:4', x: 8, y: 82, size: 180, speed: 1.1, rotate: 10, desktopOnly: true },
      { src: 'print:5', x: 86, y: 48, size: 150, speed: 1.45, rotate: 3, desktopOnly: true },
    ],
  },
  {
    value: 'meadow',
    label: 'Meadow — wildflowers, wheat and fern',
    items: [
      { src: 'wildflower', x: 6, y: 26, size: 200, speed: 0.7, rotate: -8 },
      { src: 'wheat', x: 94, y: 22, size: 210, speed: 1.2, rotate: 10 },
      { src: 'fern', x: 93, y: 80, size: 220, speed: 0.6, rotate: -6 },
      { src: 'sprig', x: 8, y: 82, size: 180, speed: 1.3, rotate: 14, desktopOnly: true },
      { src: 'rose', x: 85, y: 50, size: 130, speed: 1.5, rotate: -10, desktopOnly: true },
    ],
  },
  {
    value: 'golden-hour',
    label: 'Golden hour — sun, birds and sparkles',
    items: [
      { src: 'sunset', x: 7, y: 22, size: 220, speed: 0.55 },
      { src: 'birds', x: 93, y: 20, size: 190, speed: 1.3 },
      { src: 'sparkles', x: 92, y: 78, size: 150, speed: 0.9, rotate: 8 },
      { src: 'mountains', x: 9, y: 84, size: 200, speed: 1.1, desktopOnly: true },
      { src: 'sparkles', x: 84, y: 46, size: 90, speed: 1.6, rotate: -12, desktopOnly: true },
    ],
  },
  {
    value: 'darkroom',
    label: 'Darkroom — camera, film and lens',
    items: [
      { src: 'camera', x: 7, y: 24, size: 200, speed: 0.7, rotate: -9 },
      { src: 'film-strip', x: 94, y: 20, size: 220, speed: 1.15, rotate: 12 },
      { src: 'aperture', x: 92, y: 80, size: 170, speed: 0.6 },
      { src: 'polaroid', x: 9, y: 82, size: 170, speed: 1.3, rotate: 8, desktopOnly: true },
      { src: 'canister', x: 85, y: 50, size: 120, speed: 1.5, rotate: -14, desktopOnly: true },
    ],
  },
  {
    value: 'wedding',
    label: 'Wedding — rings, bouquet and laurel',
    items: [
      { src: 'bouquet', x: 7, y: 26, size: 200, speed: 0.7, rotate: -6 },
      { src: 'rings', x: 93, y: 22, size: 160, speed: 1.25, rotate: 8 },
      { src: 'laurel', x: 92, y: 80, size: 200, speed: 0.6 },
      { src: 'heart', x: 9, y: 82, size: 110, speed: 1.4, rotate: -10, desktopOnly: true },
      { src: 'sparkles', x: 84, y: 50, size: 100, speed: 1.6, desktopOnly: true },
    ],
  },
  {
    value: 'night',
    label: 'Night sky — moon, stars and pines',
    items: [
      { src: 'moon', x: 8, y: 22, size: 190, speed: 0.6 },
      { src: 'sparkles', x: 93, y: 18, size: 140, speed: 1.3 },
      { src: 'pine', x: 93, y: 80, size: 200, speed: 0.7 },
      { src: 'pine', x: 8, y: 84, size: 170, speed: 1.1, flip: true, desktopOnly: true },
      { src: 'sparkles', x: 86, y: 48, size: 80, speed: 1.6, rotate: 20, desktopOnly: true },
    ],
  },
  { value: 'custom', label: 'Choose my own', items: [] },
]

export const PRESET_VALUES = DECOR_PRESETS.map((p) => p.value).filter((v) => v !== 'none' && v !== 'custom')

export function getDecorPreset(value: string) {
  return DECOR_PRESETS.find((p) => p.value === value)
}

export function decorDensity(items: readonly DecorItem[], density: string): DecorItem[] {
  const count = density === 'sparse' ? 2 : density === 'generous' ? items.length : 4
  return items.slice(0, count)
}

/* ------------------------------------------------------------------ *
 * Textures
 * ------------------------------------------------------------------ */

export const TEXTURES = [
  { value: '', label: 'None' },
  { value: 'grain', label: 'Film grain' },
  { value: 'paper', label: 'Watercolour paper' },
  { value: 'linen', label: 'Linen' },
  { value: 'canvas', label: 'Canvas weave' },
  { value: 'halftone', label: 'Halftone dots' },
] as const

/** A texture as a tiling background image — generated SVG, no file to load. */
export function textureImage(value: string): string | null {
  const svg = (body: string, size = 240) =>
    `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>${body}</svg>`)}")`
  switch (value) {
    case 'grain':
      return svg(
        `<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1.4 -0.2'/></filter><rect width='100%' height='100%' filter='url(#n)'/>`,
        200,
      )
    case 'paper':
      return svg(
        `<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.035' numOctaves='5' stitchTiles='stitch'/><feDiffuseLighting lighting-color='#fff' surfaceScale='1.6'><feDistantLight azimuth='45' elevation='58'/></feDiffuseLighting></filter><rect width='100%' height='100%' filter='url(#n)'/>`,
        400,
      )
    case 'linen':
      return svg(
        `<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.02 0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#n)'/><rect width='100%' height='100%' filter='url(#n)' transform='rotate(90 120 120)' opacity='0.6'/>`,
      )
    case 'canvas':
      return svg(
        `<pattern id='p' width='6' height='6' patternUnits='userSpaceOnUse'><path d='M0 1.5h6M0 4.5h6' stroke='#000' stroke-opacity='0.35' stroke-width='1'/><path d='M1.5 0v6M4.5 0v6' stroke='#fff' stroke-opacity='0.35' stroke-width='1'/></pattern><rect width='100%' height='100%' fill='url(#p)'/>`,
        60,
      )
    case 'halftone':
      return svg(
        `<pattern id='p' width='8' height='8' patternUnits='userSpaceOnUse'><circle cx='4' cy='4' r='1.3' fill='#000' fill-opacity='0.5'/></pattern><rect width='100%' height='100%' fill='url(#p)'/>`,
        80,
      )
    default:
      return null
  }
}
