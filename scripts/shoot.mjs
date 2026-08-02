/**
 * Dev-only visual check: drives the local Chrome over the running dev server
 * and writes screenshots at a few scroll depths, in both themes.
 *
 *   node scripts/shoot.mjs [outDir] [width] [height]
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const CHROME = 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
const URL = process.env.SHOOT_URL ?? 'http://localhost:5173'
const OUT = process.argv[2] ?? './shots'
const W = Number(process.argv[3] ?? 1440)
const H = Number(process.argv[4] ?? 900)

fs.mkdirSync(OUT, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--force-device-scale-factor=1', '--hide-scrollbars'],
  defaultViewport: { width: W, height: H },
})

const page = await browser.newPage()
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise((r) => setTimeout(r, 2600)) // preloader + hero entrance

const total = await page.evaluate(() => document.body.scrollHeight)
const stops = [0, 0.5, 1.15, 1.9, 2.75, 3.7, 4.7, 5.6, 6.6, 7.5, 8.4, 9.3, 10.2, 11.1]

for (const theme of ['light', 'dark']) {
  await page.evaluate((t) => {
    localStorage.setItem('ap-theme', t)
    document.documentElement.classList.toggle('dark', t === 'dark')
    document.documentElement.classList.toggle('light', t === 'light')
  }, theme)

  for (const [i, mult] of stops.entries()) {
    const y = Math.min(mult * H, total - H)
    if (y < 0) continue
    await page.evaluate((to) => window.scrollTo(0, to), y)
    await new Promise((r) => setTimeout(r, 1500))
    await page.screenshot({ path: `${OUT}/${theme}-${String(i).padStart(2, '0')}.png` })
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await new Promise((r) => setTimeout(r, 800))
}

await browser.close()
console.log(`Wrote screenshots to ${OUT} (page height ${total}px)`)
