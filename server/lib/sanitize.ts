/**
 * HTML sanitizing for rich text and embeds.
 *
 * ## Why this exists at all
 *
 * Only signed-in editors can write this HTML, and a compromised editor account
 * already owns the dashboard — so this is not the load-bearing defense it would
 * be on a site with public submissions. What it does buy is real, though:
 *
 *   * A paste from Word, Google Docs or a website arrives carrying `<style>`
 *     blocks, `<script>` tags, `class="MsoNormal"` and inline colors that fight
 *     the theme. Stripping those is a content-quality fix as much as a security
 *     one.
 *   * It bounds the damage of one bad afternoon: a stolen session cannot leave
 *     behind a persistent script that runs for every future visitor.
 *
 * ## The approach
 *
 * An allowlist over a small hand-written tokenizer, not a regex over the whole
 * document and not a DOM parser. Regex-only sanitizing is famously broken;
 * a DOM parser would mean jsdom, which is 3 MB of dependency installed on the
 * server on every deploy for one function. This walks tags one at a time and
 * emits only what it recognizes — anything it cannot parse is dropped rather
 * than passed through, which is the correct direction to fail in.
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'hr',
  'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup', 'mark', 'small',
  'a',
  'ul', 'ol', 'li',
  'blockquote', 'cite', 'q',
  'h2', 'h3', 'h4', 'h5', 'h6',
  'figure', 'figcaption', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'code', 'pre',
  'span', 'div',
])

/** Tags that carry no closing tag. */
const VOID_TAGS = new Set(['br', 'hr', 'img'])

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel']),
  img: new Set(['src', 'alt', 'width', 'height', 'loading']),
  th: new Set(['colspan', 'rowspan', 'scope']),
  td: new Set(['colspan', 'rowspan']),
  span: new Set(['class']),
  div: new Set(['class']),
  p: new Set(['class']),
}

/**
 * The only classes that survive. Everything else — every `MsoNormal`, every
 * `c12 c7` from a Google Docs paste — is dropped, because a class this
 * stylesheet does not define is at best dead weight and at worst a collision.
 */
const ALLOWED_CLASSES = new Set(['lead', 'small', 'script', 'center', 'drop-cap'])

/** URL schemes that may appear in an href or src. */
const SAFE_SCHEME = /^(https?:|mailto:|tel:|\/|#|data:image\/(png|jpe?g|gif|webp);base64,)/i

function escapeText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function safeUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  // `javascript:` hidden behind entities, newlines or tabs is the classic
  // bypass, so the scheme is tested against a form with all of those removed.
  const normalized = Array.from(trimmed)
    .filter((ch) => ch.charCodeAt(0) > 32)
    .join('')
    .replace(/&#x?[0-9a-f]+;?/gi, '')
  if (!SAFE_SCHEME.test(normalized)) return null
  return trimmed
}

function sanitizeAttributes(tag: string, raw: string): string {
  const allowed = ALLOWED_ATTRS[tag]
  if (!allowed) return ''

  const out: string[] = []
  const attrPattern = /([a-zA-Z-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g

  let m: RegExpExecArray | null
  while ((m = attrPattern.exec(raw)) !== null) {
    const name = m[1].toLowerCase()
    const value = m[3] ?? m[4] ?? m[5] ?? ''
    if (!allowed.has(name)) continue

    if (name === 'href' || name === 'src') {
      const url = safeUrl(value)
      if (!url) continue
      out.push(`${name}="${escapeText(url).replace(/"/g, '&quot;')}"`)
      continue
    }

    if (name === 'class') {
      const kept = value.split(/\s+/).filter((c) => ALLOWED_CLASSES.has(c))
      if (kept.length) out.push(`class="${kept.join(' ')}"`)
      continue
    }

    if (name === 'target') {
      // Only `_blank`, and it always brings `rel` with it — an untrusted
      // `target` can otherwise name a frame, and `_blank` without `noopener`
      // hands the opened page a handle on this one.
      if (value === '_blank') out.push('target="_blank"', 'rel="noopener noreferrer"')
      continue
    }

    if (name === 'rel') continue // emitted alongside target, never taken as given

    out.push(`${name}="${escapeText(value).replace(/"/g, '&quot;')}"`)
  }

  if (tag === 'img' && !out.some((a) => a.startsWith('src='))) return ''
  if (tag === 'img') out.push('loading="lazy"')

  return out.length ? ' ' + out.join(' ') : ''
}

/**
 * Rich text, reduced to the allowlist above.
 *
 * `<script>` and `<style>` have their *contents* removed as well as their tags —
 * dropping only the tag would leave the script body sitting in the document as
 * visible text, which is both ugly and, for `<style>`, still live in some
 * parsers.
 */
export function sanitizeHtml(input: unknown): string {
  if (typeof input !== 'string' || !input) return ''

  let html = input
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|iframe|object|embed|form|input|button|textarea|select|link|meta|base)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|style|iframe|object|embed|form|input|button|textarea|select|link|meta|base)\b[^>]*>/gi, '')

  const openStack: string[] = []
  let out = ''
  let index = 0

  const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)((?:[^<>"']|"[^"]*"|'[^']*')*)>/g
  let match: RegExpExecArray | null

  while ((match = tagPattern.exec(html)) !== null) {
    out += escapeText(html.slice(index, match.index))
    index = match.index + match[0].length

    const tag = match[1].toLowerCase()
    const closing = match[0].startsWith('</')

    if (!ALLOWED_TAGS.has(tag)) continue

    if (closing) {
      // Only close a tag that is actually open, so stray `</div>` from a paste
      // cannot unbalance the surrounding document.
      const at = openStack.lastIndexOf(tag)
      if (at === -1) continue
      // Anything still open inside it is closed too, innermost first.
      for (let i = openStack.length - 1; i >= at; i--) out += `</${openStack[i]}>`
      openStack.length = at
      continue
    }

    const attrs = sanitizeAttributes(tag, match[2] ?? '')
    if (VOID_TAGS.has(tag)) {
      if (tag === 'img' && !attrs) continue
      out += `<${tag}${attrs} />`
      continue
    }

    out += `<${tag}${attrs}>`
    openStack.push(tag)
  }

  out += escapeText(html.slice(index))
  for (let i = openStack.length - 1; i >= 0; i--) out += `</${openStack[i]}>`

  return out.trim()
}

/** Plain text from HTML — for excerpts, reading time and the search index. */
export function htmlToText(input: unknown): string {
  if (typeof input !== 'string' || !input) return ''
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/* ------------------------------------------------------------------ *
 * Embeds
 * ------------------------------------------------------------------ */

/**
 * Hosts an `<iframe>` may point at.
 *
 * An embed widget is the one place arbitrary third-party markup is genuinely
 * wanted, and also the one place it is genuinely dangerous — an iframe is a
 * whole other origin running inside the page. So the tag survives sanitizing
 * only when its `src` is one of these, matched on the *host*, never on a
 * substring of the URL. `"youtube.com" in url` would happily accept
 * `https://youtube.com.attacker.example/`.
 */
const EMBED_HOSTS = [
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'youtu.be',
  'player.vimeo.com',
  'vimeo.com',
  'open.spotify.com',
  'w.soundcloud.com',
  'docs.google.com',
  'forms.gle',
]

export function isAllowedEmbedUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && EMBED_HOSTS.includes(parsed.hostname)
  } catch {
    return false
  }
}

/**
 * Keeps a single `<iframe>` pointing somewhere on the allowlist and throws the
 * rest of the pasted markup away. Anything that is not one recognizable iframe
 * comes back empty rather than partially cleaned.
 */
export function sanitizeEmbed(input: unknown): string {
  if (typeof input !== 'string' || !input.trim()) return ''

  const iframe = /<iframe\b([^>]*)>/i.exec(input)
  if (!iframe) return ''

  const src = /\bsrc\s*=\s*("([^"]*)"|'([^']*)')/i.exec(iframe[1])
  const url = src?.[2] ?? src?.[3] ?? ''
  if (!isAllowedEmbedUrl(url)) return ''

  const title = /\btitle\s*=\s*("([^"]*)"|'([^']*)')/i.exec(iframe[1])
  const safeTitle = escapeText(title?.[2] ?? title?.[3] ?? 'Embedded content').replace(/"/g, '&quot;')

  return (
    `<iframe src="${escapeText(url).replace(/"/g, '&quot;')}" title="${safeTitle}" ` +
    `loading="lazy" allowfullscreen ` +
    `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ` +
    `referrerpolicy="strict-origin-when-cross-origin" ` +
    `sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"></iframe>`
  )
}

/**
 * A YouTube or Vimeo watch URL turned into its embed URL, so Ashley can paste
 * the link from the address bar instead of hunting for "Share → Embed".
 * Returns null for anything it does not recognize.
 */
export function embedUrlFrom(input: unknown): string | null {
  if (typeof input !== 'string' || !input.trim()) return null

  let parsed: URL
  try {
    parsed = new URL(input.trim())
  } catch {
    return null
  }

  if (parsed.hostname === 'youtu.be') {
    const id = parsed.pathname.slice(1)
    return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null
  }

  if (parsed.hostname.endsWith('youtube.com')) {
    const id = parsed.searchParams.get('v') ?? parsed.pathname.split('/').pop()
    return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null
  }

  if (parsed.hostname.endsWith('vimeo.com')) {
    const id = parsed.pathname.split('/').filter(Boolean).pop()
    return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null
  }

  return null
}
