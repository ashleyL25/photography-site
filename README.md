# Ashley Photography

Homepage for a central-Iowa portrait photographer. React 19 + Vite + Tailwind v4,
built to deploy as a static folder on Hostinger shared hosting.

```bash
npm install
npm run images   # one-time: build web renditions from ../Images
npm run dev
```

## Commands

| Command          | What it does                                                    |
| ---------------- | --------------------------------------------------------------- |
| `npm run dev`    | Dev server on :5173                                               |
| `npm run build`  | Typecheck, then emit `dist/`                                      |
| `npm run images` | Re-run the image pipeline (skips renditions already up to date)   |
| `npm run lint`   | oxlint                                                            |

## Images

`scripts/optimize-images.mjs` reads the untouched originals in `../Images`
(6000×4000, ~20 MB each) and writes WebP renditions at 480/960/1440/2000/2600 px
into `public/photos/<category>/`, plus a typed manifest at
`src/data/photos.generated.ts` holding dimensions, average colour and a 20 px
inline blur placeholder for each frame.

Category comes from the source folder name — see the `CATEGORIES` map in the
script. Drop a new shoot folder into `../Images`, add it to the map, re-run
`npm run images`, and reference the new ids from `src/data/site.ts`.

Never upload the originals; only `public/photos` ships.

## Pages

| Route               | File                        | Notes                                            |
| ------------------- | --------------------------- | ------------------------------------------------ |
| `/`                 | `src/pages/Home.tsx`        | Nine scrolling sections; the only one in the main bundle |
| `/sessions`         | `src/pages/SessionsPage.tsx`| The six session types in depth, with a jump nav   |
| `/portfolio`        | `src/pages/Portfolio.tsx`   | Grid of **sessions**, filterable. `?c=seniors` deep-links a category |
| `/portfolio/:slug`  | `src/pages/ShootPage.tsx`   | One shoot: story, particulars, full gallery, lightbox |
| `/about`            | `src/pages/AboutPage.tsx`   | Bio, milestones, design aside                     |
| `/contact`          | `src/pages/ContactPage.tsx` | Enquiry form + FAQ accordion                      |
| anything else       | `src/pages/NotFound.tsx`    | 404                                               |

Routing is `react-router-dom` with `BrowserRouter`, so the `.htaccess` rewrite
to `index.html` is what makes a direct hit on `/portfolio` work on the server.
The three interior pages are `React.lazy`-loaded, so a first visit to the
homepage does not download the portfolio grid or the lightbox.

`src/components/Layout.tsx` holds the shared chrome and the scroll manager: it
resets to the top on navigation and honours `/#section` links (used by the
"Sessions" and "Investment" nav items) once the destination has rendered.

## Shoots

The portfolio is organised by **shoot**, not by loose photograph. Each source
folder in `../Images` is one shoot; the pipeline stamps its slug onto every
photo as `shoot`, and [`src/data/shoots.ts`](src/data/shoots.ts) carries the
editorial metadata for each one — title, date, category, cover, and the story.

`location`, `conditions` and `requests` are optional and **mostly blank**. They
render only when filled, so the pages read fine as they are, but they are the
main thing worth filling in: they are what make a session page more than a
gallery. I left them empty rather than invent a client's brief or the weather.

To add a shoot: drop the folder into `../Images`, add it to `CATEGORIES` in the
pipeline script, run `npm run images`, then add a `SHOOTS` entry whose `source`
matches the generated `shoot` slug.

## Content

Everything editable — headings, blurbs, package contents, FAQ answers, contact
details — lives in [`src/data/site.ts`](src/data/site.ts). Components read from
it and contain no prose of their own.

## Deploying to Hostinger

1. `npm run build`
2. Upload the **contents** of `dist/` into `public_html` — including the hidden
   `.htaccess` (turn on "show hidden files" in the File Manager, or use SFTP).
3. Open `public_html/php/contact.php` and set `$TO` and `$FROM`. `$FROM` must be
   an address on this domain or the host will drop the mail.
4. Send a test enquiry and confirm it arrives.

`.htaccess` forces HTTPS, sets long cache lifetimes on the fingerprinted assets
while keeping `index.html` revalidating, and routes unknown paths back to
`index.html` so client-side routing keeps working when more pages are added.

`dist/` is roughly 77 MB, almost all of it `photos/` — the full library at every
size, ready for the portfolio pages. Browsers only fetch the one rendition they
need, typically 30–100 KB per image.

## Pricing structure

Senior sessions are the one fixed package (60 edited images); graduation,
engagement, couples and family sessions are tailored, so they carry a "from"
figure instead. Everything shared across sessions — Pic-Time gallery, print
rights, the black-and-white selects, travel — lives in `ALWAYS_INCLUDED` rather
than being repeated per card, and the gallery's twelve-month life with its 90-
and 30-day reminders is its own section (`src/sections/Delivery.tsx`).

## Before going live

- [ ] **Confirm the three prices** in `PACKAGES` (`src/data/site.ts`): `$475`,
      `From $325`, `From $400`. The deliverables are accurate; the figures are
      market-rate placeholders and are the only invented numbers on the page.
- [ ] Set the real contact address (`SITE.email`, and `$TO`/`$FROM` in
      `contact.php`).
- [ ] **Save the two new photographs of Ashley** into `../Images/Ashley/` as
      `porch.jpg` and `bridal.jpg`, then run `npm run images`. The About page
      resolves `ABOUT_PAGE.portraits` / `.secondary` against the manifest and
      swaps them in automatically; until then it falls back to the 2019 photo.
- [ ] Replace the placeholder monogram in `src/components/Brand.tsx` and
      `public/favicon.svg` once a real logo exists.
- [ ] Fill in `location`, `conditions` and `requests` for the shoots in
      `src/data/shoots.ts` — currently blank on most of them.
- [ ] Check the client names used as shoot titles in `src/data/shoots.ts`; they
      come from the source folder names. Swap for initials if anyone would
      rather not be named.
- [ ] Set the travel fee, or the rule for it. The site says travel beyond the
      Des Moines metro is quoted before you commit; it never names a number.
- [ ] Add the missing FAQ entries in `FAQ` (`src/data/site.ts`): booking lead
      time, deposit terms, and the weather / reschedule policy. The seven that
      are there are all answerable from how the business runs; those three are
      not, so I left them out rather than invent them.
- [ ] Check the "Celebrations" portfolio filter. It maps to the `wedding`
      category — rehearsal-dinner and party coverage — and is named that way
      because weddings are not an advertised service. Rename it in
      `PORTFOLIO_FILTERS` if they should be.

## Design notes

Palette, type scale and the `shell` container live in
[`src/index.css`](src/index.css). Theme is a class on `<html>`, resolved by an
inline script before first paint so there is no flash; the toggle wipes the new
palette in with a View Transition where supported.

Shared motion primitives (`Reveal`, `MaskText`, `Unveil`, `Parallax`,
`DrawRule`) are in [`src/components/motion.tsx`](src/components/motion.tsx).
One rule worth remembering: a scroll trigger must sit on an element that is not
fully clipped by an `overflow: hidden` ancestor, or its IntersectionObserver
never fires and the content stays hidden forever. That is why the mask-reveal
components put `whileInView` on the wrapper and drive the clipped child through
variants.
