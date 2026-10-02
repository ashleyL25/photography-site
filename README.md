# Ashley Photography — site and dashboard

Portrait photography in central Iowa. React 19 + Vite + Tailwind v4 on the
front, Express + MariaDB on the back, Cloudflare R2 for uploaded photographs,
deployed to Hostinger as a Node.js app.

Every page, session, album and guide is editable at **`/dashboard`** with a page
builder modeled on the one behind elisemariewrites.com. The site itself looks and
behaves exactly as the hand-built version did: each section that used to be a
component reading `src/data` is now a **widget** reading what was saved in the
dashboard, and the seed script converted all of the old data so nothing was
retyped.

---

## Getting it running

```bash
npm install
cp .env.example .env     # then fill in the database credentials
npm run db:migrate
npm run db:seed
npm run dev
```

`npm run dev` starts the API on `:3000` and Vite on `:5173`; Vite proxies `/api`,
so the browser only ever talks to one origin — the same as production, where one
Express process serves both.

The database is on Hostinger, so from your own machine `DB_HOST` is the remote
host (`srv1562.hstgr.io`) and your IP has to be listed under hPanel → Databases →
Remote MySQL for `u628890763_portfolio`. **There is no separate development
database:** anything saved while `npm run dev` is running is saved for real.

| Command | What it does |
| --- | --- |
| `npm run dev` | API and web together |
| `npm run build` | Client to `dist/client`, API to `dist/server` |
| `npm start` | The production server |
| `npm run typecheck` | Both halves, properly |
| `npm run db:migrate` | Applies unrun files in `migrations/`. Idempotent. |
| `npm run db:seed` | Fills an empty database from `scripts/seed-data`. Idempotent — adds nothing that exists. |
| `npm run images` | Re-runs the image pipeline for photographs that ship with the site |
| `echo -n 'pw' \| npm run hash-password` | A password hash, for the day the only way in is an `UPDATE` by hand |

---

## How it fits together

```
shared/       Definitions both halves read
  widgets.ts    every widget and its fields — the page builder's whole vocabulary
  settings.ts   the settings screens, a session's and a guide's fields, tier pricing
  types.ts      the shapes the API sends

server/       Express API. Public routes in routes/public.ts; everything else is
              under /api/admin behind requireAuth.

src/
  widgets/      one renderer per widget — the old section components
  pages/        DynamicPage (any page built in the dashboard), SessionPage,
                AlbumPage, GuidePage, BlogPost
  admin/        the dashboard (one lazy chunk; visitors never download it)

scripts/seed-data/   the hand-built site's data files, kept as the seed's source
```

### What can be edited, and where it shows

| In the dashboard | What it is | Where it shows |
| --- | --- | --- |
| **Pages** | Home, Sessions, Experience, Portfolio, Guides, About, Contact, Journal | Built from widgets |
| **Sessions** | Each session type: details, tiers, and its own page (widgets) | `/sessions/:slug`, the homepage list, the pricing tabs, the inquiry form |
| **Albums** | One shoot each: photographs in order, cover, story, particulars | `/portfolio`, `/portfolio/:slug`, "sessions like yours" |
| **Portfolio categories** | The portfolio filters | The filter bar; a session shows albums in its category |
| **Guides** | The letter and the chapters (widgets) | `/guides/:slug`, the session's page |
| **Journal** | Blog posts, with templates | `/blog`, `/blog/:slug` (not in the menu until you add it) |
| **Media** | Every photograph | Every image field |
| **Inquiries** | Everything sent through the form | — |
| **Settings → Site** | Name, contact, the **menu**, footer, search defaults | Header, footer, every page |
| **Settings → Pricing** | Rate card, private-pricing key, what every session includes, add-ons, booking steps | Every tier and the pricing block |
| **Settings → Policies** | Editing levels, weather, moving a date | Pricing, every guide, the experience page |
| **Settings → Recommendations** | Hair and makeup, lunch stops, locations | The guides |
| **Settings → Inquiry form** | The form's options and what it says once sent | The contact form |

The connections are explicit: a session names its **guide** and its **portfolio
category**; an album names its category; a guide names its session. Each session
page's widgets read the session they sit on, so a new session gets a complete page
the moment it is created.

### The one idea worth knowing

**A page is an ordered list of widget instances**, and a widget is described once
in `shared/widgets.ts`. That description drives the dashboard's form, what the
server accepts (`server/lib/content.ts` cleans everything against it) and the
defaults. Adding a field to a widget is a line there plus reading it in the
renderer. The settings screens and the session and guide detail panels work the
same way, from `shared/settings.ts`.

A guide's chapters are widgets too: a **Chapter** widget starts one and the blocks
after it belong to it. The guide page groups them back into numbered chapters with
the chapter index, so the chapters stay editable in the ordinary page builder.

### Photographs

Every image field stores a plain URL. What the `Photo` component needs to draw a
photograph well — the srcset, the average colour behind it, the 20px blur
placeholder — is looked up in the `media` table and sent alongside every response
as a `photos` map (`photoRegistry` in `server/lib/catalog.ts`). That is why an
uploaded photograph and one that shipped with the site render identically.

- **The photographs that shipped with the site** stay in `public/photos` and are
  served by the app, as before. The seed gave each one a media row, so they are all
  in the library.
- **New uploads** never leave the browser at full size. A worker
  (`src/admin/workers/rendition.worker.ts`, shared with pic) draws the original
  down to five WebP widths plus the colour and placeholder, and those go straight
  to the **img-ashleyphotography** R2 bucket on presigned URLs.
- Uploading is off until the R2 keys and `R2_PUBLIC_URL` are set. The site works
  without them.

### The pic.ashleyphotographyia.com connection is gone

The portfolio no longer fetches anything from the gallery dashboard at runtime.
The two albums that used to arrive that way (Elise's Graduation, ISU Grads) were
imported by the seed as ordinary albums; their photographs stay where they were
in R2. From now on the portfolio changes when an album is published here. The
gallery dashboard itself is untouched and carries on serving client galleries.

### Pricing

The rate card (Settings → Pricing) holds seven session lengths and the album
price. Each tier says **how** it is priced rather than carrying a typed figure:

- **Rate card** — one length, or several added together for a bundle (Before The
  Wedding is ninety minutes plus two and a half hours, plus the album).
- **Fixed** — a hand-set figure. The senior collections and Every Year are fixed,
  because they were never derived from the hours.
- **Words** — "Quoted".

Change the rate card and every tier priced from it follows. The pricing screen
shows what every tier costs right now.

**Private pricing is now an actual lock.** Sessions marked private show "By
request", and their figures — and the rate card — are left out of the public
response entirely. Arriving on `?pricing=<key>` (the key is in Settings → Pricing)
returns them for the rest of that browser session. Change the key and every link
already sent stops working.

### Roles

- **owner** — Ashley. Everything, plus managing accounts and deleting pages,
  sessions, albums and guides.
- **editor** — for anybody else trusted with the content.

Publish, update and unpublish are press-and-hold buttons, separate from Save.

---

## Deploying to Hostinger

This replaces the static upload to `public_html`. Set up once:

1. hPanel → Websites → ashleyphotographyia.com → **Node.js**: create the app from
   the GitHub repo `ashleyL25/photography-site`, branch `main`, Node 22, build
   command `npm run build`, entry file `server.js`.
2. Environment variables — everything in `.env.example`, with `DB_HOST=localhost`.
   **Leave `NODE_ENV` unset**: setting it to `production` makes npm skip
   devDependencies on the server, the build toolchain is never installed, and the
   result is a bare 503. Unset is treated as production. (`npm run env:push` sets
   them through the Hostinger API — it is a full replace, so send all of them.)
3. Once it builds, check **`/api/health`**. It is the only API route that answers
   while configuration is broken, and it says exactly what is missing.
4. Sign in at `/dashboard`, change the owner password under **Your account**.

`server.js` at the root is load-bearing: Hostinger starts whatever it names, and
it loads `dist/server/index.js`.

---

## Before going live

- [ ] **R2** — the access keys for img-ashleyphotography and its public URL
      (`R2_PUBLIC_URL`). Until then, uploads are off.
- [ ] **Inquiry email** — `RESEND_API_KEY`. Pic already sends through Resend
      from `send.ashleyphotographyia.com`, so its key works and `MAIL_FROM` must
      stay on that subdomain. Until then inquiries are stored and listed under
      Inquiries but not emailed.
- [ ] Change the owner password after the first sign-in.
- [ ] Add a **Journal** link to the menu (Settings → Site) when there is a post to
      show. It is deliberately left out so the menu matches the old site.
- [ ] Alt text — every library photograph shows a small "!" until it has some.

The checklist carried over from the static site still applies — confirm the rate
card, the editing styles, the add-on prices, the booking terms, the vendor lists
and the second-reschedule fee. All of them are now edited in Settings rather than
in code.

---

## Copy and design notes

### The copy is American English

Inquire/inquiry everywhere, never enquire. Color, favorite, gray, center, fall,
sweater, backyard, "6:30" not "half six". The sentence rhythm — long clauses, em
dashes, no contractions — is the voice, not a slip.

### The guides print

Every scroll-triggered element starts at `opacity: 0` as an inline style, so the
`@media print` block in `src/index.css` forces `opacity: 1 !important` on
everything and drops the images and chrome. Print `/guides/seniors` after touching
it. Checklist ticks persist in `localStorage` per guide and chapter.

### iPhone safe areas

`viewport-fit=cover` is on, so anything pinned to an edge pads past its inset: the
header (`pt-[calc(…+env(safe-area-inset-top))]`), the mobile drawer, the sticky
process cards and the guide's chapter island, and the footer. Change the header's
padding and those offsets change with it.

### The dashboard's look

Inter on the photography palette, light and dark, scoped to `.admin-ui`
(`src/admin/admin.css`). The page builder's preview is wrapped in `.site-preview`,
which puts the site's own typefaces and palette back, so a preview always looks
exactly like the page. The colour tokens are `@theme inline` in `src/index.css`
for that reason — see the comment there before changing it.
