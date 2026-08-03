# Ashley Photography

Homepage for a central-Iowa portrait photographer. React 19 + Vite + Tailwind v4,
built to deploy as a static folder on Hostinger shared hosting.

```bash
npm install
npm run images   # one-time: build web renditions from ./images
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

`scripts/optimize-images.mjs` reads the untouched originals in `./images`
(6000×4000, ~20 MB each) and writes WebP renditions at 480/960/1440/2000/2600 px
into `public/photos/<category>/`, plus a typed manifest at
`src/data/photos.generated.ts` holding dimensions, average color and a 20 px
inline blur placeholder for each frame.

Category comes from the source folder name — see the `CATEGORIES` map in the
script. Drop a new shoot folder into `./images`, add it to the map, re-run
`npm run images`, and reference the new ids from `src/data/site.ts`.

The runtime site serves only the optimized files under `public/photos` (copied
into `dist/photos` on build). Raw `images/` is gitignored — never push those
originals to GitHub or Hostinger.

## Pages

| Route               | File                        | Notes                                            |
| ------------------- | --------------------------- | ------------------------------------------------ |
| `/`                 | `src/pages/Home.tsx`        | Eight scrolling sections; the only one in the main bundle |
| `/sessions`         | `src/pages/SessionsPage.tsx`| Index of the six session types                    |
| `/sessions/:id`     | `src/pages/SessionPage.tsx` | One session type: long copy, its three tiers, its guide, real shoots of that kind |
| `/experience`       | `src/pages/ExperiencePage.tsx` | What is true of **every** session: the arc from inquiry to album, what you receive, weather |
| `/guides`           | `src/pages/GuidesPage.tsx`  | Index of the six client prep guides. Not in the nav — see below |
| `/guides/:id`       | `src/pages/GuidePage.tsx`   | One prep guide — the page you send a client on booking |
| `/portfolio`        | `src/pages/Portfolio.tsx`   | Grid of **sessions**, filterable. `?c=seniors` deep-links a category |
| `/portfolio/:slug`  | `src/pages/ShootPage.tsx`   | One shoot: story, particulars, full gallery, lightbox |
| `/about`            | `src/pages/AboutPage.tsx`   | Bio, milestones, design aside                     |
| `/contact`          | `src/pages/ContactPage.tsx` | Inquiry form, pricing, FAQ, booking terms, gallery timeline. `?session=seniors` preselects the form |
| anything else       | `src/pages/NotFound.tsx`    | 404                                               |

`:id` on both `/sessions` and `/guides` is a `SESSIONS` id from
`src/data/site.ts` — `seniors`, `graduation`, `engagements`, `couples`,
`families`, `pets`. An unknown id redirects to the index rather than 404ing,
because it is nearly always a mistyped URL.

**The guides are deliberately absent from the nav.** They are documents for
people who have already booked, so they are reached from the session pages, from
the booking email, and from the "and once you have booked" link on the contact
page. `/guides` still exists and still lists all six — it is just not something a
first-time visitor is invited into. `/experience` is the public equivalent: the
universal half of a session, readable before anybody has committed to a date.

Routing is `react-router-dom` with `BrowserRouter`, so the `.htaccess` rewrite
to `index.html` is what makes a direct hit on `/portfolio` work on the server.
Every interior page is `React.lazy`-loaded, so a first visit to the homepage
does not download the portfolio grid, the guides or the lightbox.

`src/components/Layout.tsx` holds the shared chrome and the scroll manager: it
resets to the top on navigation and honors `/#section` links (used by the
"Sessions" and "Investment" nav items) once the destination has rendered.

### Page transitions

`usePageTransition` (`src/lib/hooks.ts`) and `PageCurtain`
(`src/components/PageTransition.tsx`) put a curtain between pages: it falls from
the top edge, the page is swapped underneath it, and it lifts back out through
the top. `App.tsx` renders `<Routes location={rendered}>` against the deferred
location the hook returns, which is what keeps the outgoing page on screen until
the curtain has covered it. Everything inside `Routes` — Layout, Header, the
scroll manager — reads the deferred location from `useLocation()` for free,
because `<Routes location>` publishes it on the router's own context. A
query-string or hash change is not covered, or the portfolio filter would drop
the curtain on every click.

`Layout` keys `<main>` on the pathname so each page is rebuilt rather than
reconciled. That is not cosmetic: `MaskText` rides its words up from behind a
mask on a one-shot IntersectionObserver, and when only a route param changed —
one guide to the next, one session to the next — React reused the existing
elements, nothing re-observed, and **the heading never appeared until you
reloaded**. The remount happens under the curtain, so it also means every page
replays its entrance animations.

One thing to leave alone: the curtain's timings are plain `setTimeout`s rather
than a wait on the next animation frame. Frames stop entirely in a background
tab, and a curtain that will not lift until the tab is looked at again is a
curtain that has covered the site.

## Shoots

The portfolio is organized by **shoot**, not by loose photograph. Each source
folder in `./images` is one shoot; the pipeline stamps its slug onto every
photo as `shoot`, and [`src/data/shoots.ts`](src/data/shoots.ts) carries the
editorial metadata for each one — title, date, category, cover, and the story.

`location`, `conditions` and `requests` are optional and **mostly blank**. They
render only when filled, so the pages read fine as they are, but they are the
main thing worth filling in: they are what make a session page more than a
gallery. I left them empty rather than invent a client's brief or the weather.

To add a shoot: drop the folder into `./images`, add it to `CATEGORIES` in the
pipeline script, run `npm run images`, then add a `SHOOTS` entry whose `source`
matches the generated `shoot` slug.

## Content

Everything editable lives in `src/data/`, split by what it is. Components read
from it and contain no prose of their own.

| File                                       | What is in it                                            |
| ------------------------------------------ | -------------------------------------------------------- |
| [`site.ts`](src/data/site.ts)              | Nav, the six `SESSIONS`, homepage copy, `/experience`, FAQ, form options |
| [`packages.ts`](src/data/packages.ts)      | The tier ladder per session type, add-ons, booking terms  |
| [`guides.ts`](src/data/guides.ts)          | The six client prep guides                                |
| [`policy.ts`](src/data/policy.ts)          | Weather, reschedules and editing style — shared by the guides, the tier cards and `/experience` |
| [`vendors.ts`](src/data/vendors.ts)        | Hair and makeup, lunch stops, locations                   |
| [`shoots.ts`](src/data/shoots.ts)          | Editorial metadata for each real shoot                    |
| `photos.generated.ts`                      | Written by the image pipeline. Never edit by hand.         |

### The copy is American English

It was not originally, and an Iowa client reading "half seven", "jumper" or
"Enquire" is a client wondering who wrote this. Everything was swept:
color/favorite/realize/gray/center/traveling, "two weeks" not "fortnight",
"backyard" not "back garden", "6:30" not "half six", "sweater" not "jumper",
"fall" not "autumn", "lawyer" not "solicitor", "backpack" not "rucksack", and
**inquire/inquiry everywhere, never enquire** — which is why the component is
`InquiryForm`, the constant is `INQUIRY`, and the contact-page anchor is
`#inquire`.

Write new copy the same way. The one thing deliberately left alone is the
sentence rhythm — long clauses, em dashes, and no contractions ("it is" rather
than "it's"). That is the voice, not a language slip, and changing it is a
separate decision from spelling.

## Client guides

`/guides/<session>` is the page Ashley sends a client the day they book — how
the day runs hour by hour, when to book hair and makeup and where, what to
wear, where we shoot, what to bring, and what happens afterwards. The senior
guide is the long one (ten chapters) because the senior session is the one with
a fixed routine; the other five are shorter because those sessions are simpler.

A guide is a list of **chapters**, and a chapter is a list of **blocks**. Blocks
are a tagged union in [`guides.ts`](src/data/guides.ts) —
`prose`, `timeline`, `steps`, `checklist`, `vendors`, `columns`, `locations`,
`compare`, `note` — rendered by `GuideBlock` in
[`src/components/GuideBlocks.tsx`](src/components/GuideBlocks.tsx). To add a
block kind, add it to the union and add a case to that switch; the compiler will
tell you if you forget one.

Two things worth knowing:

- **Checklists persist.** Ticks are written to `localStorage` under
  `guide:<guide>:<chapter>:<block>`, so a client can pack over two evenings.
- **They print.** Every scroll-triggered element on this site starts at
  `opacity: 0` as an inline style, which means a naive print gives you a stack of
  blank pages. The `@media print` block in
  [`src/index.css`](src/index.css) forces `opacity: 1 !important` on everything —
  a stylesheet `!important` beats an inline style that lacks one — then drops the
  images, the chrome and the dark palette. If you touch that block, print a guide
  before you commit.

Several chapters are shared across session types (hair and makeup, the gallery,
the weather) and are built once as functions at the top of `guides.ts` rather
than copied six times. Change the wording there and it changes everywhere.

## Deploying to Hostinger

1. `npm run build`
2. Upload the **contents** of `dist/` into `public_html` — including the hidden
   `.htaccess` (turn on "show hidden files" in the File Manager, or use SFTP).
3. Open `public_html/php/contact.php` and set `$TO` and `$FROM`. `$FROM` must be
   an address on this domain or the host will drop the mail.
4. Send a test inquiry and confirm it arrives.

`.htaccess` forces HTTPS, sets long cache lifetimes on the fingerprinted assets
while keeping `index.html` revalidating, and routes unknown paths back to
`index.html` so client-side routing keeps working when more pages are added.

`dist/` is roughly 77 MB, almost all of it `photos/` — the full library at every
size, ready for the portfolio pages. Browsers only fetch the one rendition they
need, typically 30–100 KB per image.

## Pricing structure

Every session type has its own ladder of **three tiers**, defined in
[`src/data/packages.ts`](src/data/packages.ts). Nothing is "tailored, ask me" any
more: each tier states its time, locations, outfits and image count, and those
four specs are rendered as a table on every card so a client can compare down a
column and across a row.

### One rate card decides every price

`RATE_CARD` maps a session length to a price, and **every single-session tier is
priced off it** — `money(RATE_CARD.two)` rather than a typed-in `'$575'`. Only
the three multi-session bundles (Two Seasons, Before The Wedding, Every Year) are
hand-set, and each carries a comment showing the arithmetic.

This exists because the ladders had drifted out of step with the time they sell:
a forty-five-minute pet session was $325 while a sixty-minute senior session was
$450 — $130 for fifteen minutes — and no two session types agreed on what an hour
was worth. Now the rate tapers cleanly ($375 for the first hour down to $224/hr
across four), the four-hour senior afternoon stays anchored at $895, and
everything else falls out of that.

**To move the whole business up or down, change `RATE_CARD` and nothing else.**
Do not type a price into a tier; if a tier needs a length the card does not have,
add the length to the card.

### Image counts follow from the editing style

`EDITING_STYLE` in [`policy.ts`](src/data/policy.ts) marks each session type
`retouched` or `natural`, and `RETOUCHING` holds the client-facing explanation of
each. Senior, graduation and family photographs are fully retouched — Lightroom
and then Photoshop frame by frame, so breakouts and sweat marks actually come
out. Engagement, couples and pet sessions are finished in Lightroom with the
small things fixed; major work on one of those is a per-photograph add-on.

That is what sets the counts: roughly **forty delivered photos per hour** on a
retouched session, **eighty** on a natural one. So a ninety-minute engagement
session delivers 120+ while a four-hour senior afternoon delivers 150+, and the
difference is not a mistake — it is the reason the retouched sessions cost more
per hour. Every tier states a floor ("150+"), never an exact number.

The same `RETOUCHING` copy renders in three places — the tier ladder, each prep
guide's gallery chapter, and `/experience` — all from that one constant. If you
change how you edit, change it there.

### Senior and engagement prices are not public

`PRIVATE_PRICING` lists the session types whose figures are withheld: `seniors`
and `engagements`. Their cards show "By request" with the packages otherwise
intact, and `fromPrice` returns "Pricing by request" wherever a from-figure would
normally appear.

To send a client the real list, append `?pricing=<PRICING_KEY>` to any URL:

```
https://ashleyphotographyia.com/sessions/seniors?pricing=iowa2026
https://ashleyphotographyia.com/contact?pricing=iowa2026#investment
```

`usePricingUnlocked` ([`src/lib/pricing.ts`](src/lib/pricing.ts)) remembers it in
`sessionStorage` for the rest of that browser session, so the client can click
through to the contact page without the figures vanishing again. `sessionStorage`
rather than `localStorage` on purpose: a shared machine forgets when the tab
closes.

Three things worth knowing. **It is a courtesy screen, not a lock** — the numbers
ship in the JS bundle and anyone who opens devtools can read them, so do not put
anything in `PACKAGE_SETS` that would genuinely matter if it leaked. **The
`<meta name="description">` on a session page never uses the unlocked figure**,
because search engines are exactly who the list is being kept from. And the tier
select in the inquiry form normally labels options `Name — $895`; it drops the
figure for private sessions, which is the one place it would otherwise leak.

Change `PRICING_KEY` and every link you have already sent stops revealing
anything, which is the point of having it be a constant.

Eighteen cards is too many to show at once, so `src/sections/Investment.tsx` puts
the session type on a tab and shows three at a time. Each session's own page
carries the same ladder without the tabs, via the shared
[`TierCards`](src/components/TierCards.tsx) component — so there is one card
design, not two.

Everything shared across sessions — the online gallery, print rights, the
black-and-white selects, travel, the prep guide — lives in `ALWAYS_INCLUDED`
rather than being repeated per card. `ADD_ONS` is a flat priced list so nothing
is a surprise after the fact, and the gallery's twelve-month life with its 90-
and 30-day reminders is its own section (`src/sections/Delivery.tsx`), which
renders at the foot of the contact page.

The gallery is a Pic-Time one, but the site never says so: "Pic-Time" means
nothing to most clients, so every mention reads "online photo gallery" instead.
Keep it that way if you add copy about delivery.

`TierCards` uses `grid-rows-subgrid` to keep the name, price, spec table and CTA
on the same baselines across all three cards. **The row span has to equal the
number of children in flow** (seven: index, name, summary, price, spec,
inclusions, CTA — the "Most booked" badge is absolutely positioned and does not
count). A subgrid cannot create implicit tracks, so one child too many is crushed
into the last row and the card box ends above its own content, which reads as the
CTA floating loose in the middle of the card. Add a row to the template and the
span together, or not at all.

`fromPrice(sessionId)` and `headlineTier(sessionId)` are the two helpers index
pages use, so a "From $450" figure can never drift from the cheapest tier.

### Where the figures came from

They are pitched against the central-Iowa market as it stood in mid-2026: budget
shooters in the metro run $90–$200 an hour, mid-market senior collections start
around $300, and the premium end of the Des Moines / Pella corridor opens at
$850. The senior flagship — four hours, three locations, three outfits, a lunch
stop and a sit-down review — is priced at that premium end, and the rest of the
ladder is built around it. They are still figures somebody else chose. See the
checklist below.

## The inquiry form

`src/components/InquiryForm.tsx` collects name, email, phone, session type,
tier, timeframe, a location idea and how they found you. The **tier select is
dependent**: pick a session and its options come from that session's own ladder,
with "Not sure yet" first, because plenty of people genuinely do not know and
that is a useful answer rather than a gap.

A session page links to `/contact?session=seniors`, so the first select arrives
already answered. `public/php/contact.php` validates and mails the new fields and
skips the optional ones nobody filled in; the optional fields are still
length-bounded, because anything unbounded that reaches a mail body is a spam
vector.

## Before going live

Three of these are new and they are the important ones.

- [ ] **Confirm the seven numbers in `RATE_CARD`** (`src/data/packages.ts`). Not
      eighteen prices any more — seven, one per session length, and the eighteen
      tiers are computed from them. The shape is right: it tapers, so a longer
      session is better value per hour, and $895 for the four-hour senior
      afternoon is the anchor everything hangs off. The *level* is still
      researched market rates rather than your rates, and setting the whole ladder
      consistently moved several tiers down by 10–20% from where they were. Read
      the seven numbers once. If the whole thing should sit higher, add to every
      row; if only one length is wrong, fix that row.
- [ ] **Confirm `EDITING_STYLE`** (`src/data/policy.ts`). `seniors`,
      `graduation` and `families` are `retouched` and `engagements` is `natural`
      because you said so. `couples` and `pets` are `natural` **by inference** —
      couples sessions are described everywhere as running exactly like an
      engagement session, and retouching a dog means nothing. Flip either one if
      that is wrong; the image counts on those tiers assume it.
- [ ] **Confirm the two new add-on prices** in `ADD_ONS`: `$35` for major
      retouching on a single photograph, and a printed album marked `Quoted`
      because album pricing depends on size and page count. Both are figures I
      picked; neither came from you.
- [ ] **Set `PRICING_KEY`** (`src/data/packages.ts`) to something you are happy
      putting in an email, then check the private links work — see "Senior and
      engagement prices are not public" above. It ships as `iowa2026`.
- [ ] **Confirm the vendor lists** in `src/data/vendors.ts`. `HAIR_AND_MAKEUP`
      and `LUNCH_STOPS` are real, well-regarded businesses in the metro pulled
      from public listings — they are **not** people you have worked with. The
      copy is written as "places that do this well" rather than "my people",
      which is true as written but far less useful to a client than a real
      endorsement. Cross off anyone you would not send a seventeen-year-old to,
      add the stylists and MUAs you actually trust, and use the `note` field on
      the ones you have a relationship with. Links and phone numbers are absent
      rather than guessed — add them as you confirm each one.
- [ ] **Confirm the booking terms** in `BOOKING.terms` (`src/data/packages.ts`):
      the `$150` retainer and the six-to-eight-week lead time. Both were written
      the way most portrait photographers in this market write them, because they
      were the only things on the contact page I could not derive from how the
      business already runs.
- [ ] **Name the second-reschedule fee.** The rule — first change free even the
      day before, second change carries a small fee — is yours, and it is stated
      in `RESCHEDULE_NOTE` (`src/data/policy.ts`) and in `BOOKING.terms`. Neither
      names a figure, both promise you will say what it is before anything is
      decided. Decide the number, then either put it in or keep the promise.
- [ ] Set the real contact address (`SITE.email`, and `$TO`/`$FROM` in
      `contact.php`).
- [ ] Send a test inquiry and check the mail contains the new fields — session,
      tier, timeframe, location, how they found you.
- [ ] Print `/guides/seniors` and read it on paper. It is the document clients
      will judge the whole operation by.
- [ ] **Save the two new photographs of Ashley** into `images/Ashley/` as
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
- [ ] ~~Add the missing FAQ entries: booking lead time, deposit terms, weather /
      reschedule policy.~~ Written, and living in `BOOKING.terms` rather than
      `FAQ` so the still-to-confirm figures sit next to the comment warning about
      them. Confirm them (see above) and this is done.
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
