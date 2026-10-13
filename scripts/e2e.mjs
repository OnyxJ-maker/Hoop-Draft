import { chromium } from 'playwright-core'

const url = process.env.URL ?? 'http://127.0.0.1:5477/'
const out = process.env.OUT ?? '/tmp/shots'
const mode = process.env.MODE ?? 'draft'
const format = process.env.FORMAT ?? 'Snake League'
const tag = process.env.TAG ?? format.replace(/\s+/g, '-').toLowerCase()
const humans = Number(process.env.HUMANS ?? 1)
const cpu = process.env.CPU === undefined ? null : Number(process.env.CPU)
const viewport = process.env.MOBILE ? { width: 390, height: 844 } : { width: 1440, height: 900 }

const browser = await chromium.launch({ executablePath: '/usr/local/bin/google-chrome', args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console.error: ${m.text().slice(0, 300)}`)
})
page.setDefaultTimeout(15000)

const log = (...a) => console.log(`[${tag}]`, ...a)

await page.goto(url, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(600)

if (mode === '82') {
  await page.locator('button', { hasText: 'Game mode' }).first().click()
  await page.waitForTimeout(500)
  if (format && format !== 'Pack') {
    await page.getByRole('radio', { name: new RegExp(format, 'i') }).click()
  }
} else {
  await page.locator('button', { hasText: 'Game modes inside' }).click()
  await page.waitForTimeout(400)
  await page.locator('button', { hasText: format }).first().click()
}
await page.waitForTimeout(600)
for (let i = 1; i < humans; i++) await page.getByRole('button', { name: /Add a player/i }).click()
if (cpu !== null) {
  const slider = page.locator('[role="slider"]').first()
  await slider.focus()
  await page.keyboard.press('Home')
  for (let i = 0; i < cpu; i++) await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(200)
}
await page.screenshot({ path: `${out}/${tag}-setup.png` })
await page.getByRole('button', { name: /Start draft/i }).click()
await page.waitForTimeout(600)
await page.getByRole('button', { name: /Skip/i }).click()
await page.getByRole('button', { name: /Start the draft/i }).click()
await page.waitForTimeout(500)
const firstGo = page.getByRole('button', { name: /Let's go/i })
if (await firstGo.count()) {
  await firstGo.click()
  await page.waitForTimeout(300)
}
await page.getByRole('button', { name: /Quick CPU picks/i }).click()

let picks = 0
let shotMid = false
const deadline = Date.now() + 150000
while (Date.now() < deadline) {
  if (await page.getByText('Draft report cards').count()) break
  const go = page.getByRole('button', { name: /Let's go/i })
  if (await go.count()) {
    await go.click().catch(() => {})
    await page.waitForTimeout(300)
    continue
  }
  const next = page.getByRole('button', { name: /^(Next round|See the teams)$/i })
  if (await next.count()) {
    if (!shotMid) {
      await page.screenshot({ path: `${out}/${tag}-reveal.png` })
    }
    await next.first().click().catch(() => {})
    await page.waitForTimeout(300)
    continue
  }
  const selectable = page.locator('[role="button"][aria-label*="overall"]:not([aria-disabled])')
  const rows = page.locator('tbody tr:not(.opacity-40)')
  const draftBtn = page.getByRole('button', { name: /^Draft [A-Za-zÀ-ž'.-]/ })
  if (await draftBtn.count()) {
    // need a selection first
    const cardCount = await selectable.count()
    if (cardCount > 0) await selectable.first().click({ force: true })
    else if ((await rows.count()) > 0) await rows.first().click({ force: true })
    await page.waitForTimeout(150)
    if (await draftBtn.first().isEnabled()) {
      if (!shotMid && picks === 2) {
        await page.screenshot({ path: `${out}/${tag}-draft.png` })
        shotMid = true
      }
      await draftBtn.first().click()
      picks++
      await page.waitForTimeout(250)
      continue
    }
  }
  // human not on clock or nothing selectable yet
  const bodyBtn = page.getByRole('button', { name: /Select a player|picking|Waiting|starting/i })
  void bodyBtn
  // if a row is selectable but the Draft button reads "Select a player", click a row/card
  if ((await selectable.count()) > 0) await selectable.first().click({ force: true }).catch(() => {})
  else if ((await rows.count()) > 0) await rows.first().click({ force: true }).catch(() => {})
  await page.waitForTimeout(300)
}
log('human picks made:', picks)
if (!(await page.getByText('Draft report cards').count())) await page.screenshot({ path: `${out}/${tag}-stuck.png` })
await page.getByText('Draft report cards').waitFor({ timeout: 20000 })
await page.waitForTimeout(1200)
await page.screenshot({ path: `${out}/${tag}-recap.png`, fullPage: false })

await page.getByRole('button', { name: /(Play the season|Start the showdown|Sim the 82-game season)/i }).click()
await page.waitForTimeout(1200)

if (mode === '82') {
  await page.waitForTimeout(3000)
  await page.screenshot({ path: `${out}/${tag}-season-live.png` })
  await page.getByRole('button', { name: /Sim to the end/i }).click()
  await page.waitForTimeout(2500)
  await page.screenshot({ path: `${out}/${tag}-season-final.png` })
} else {
  if (await page.getByRole('button', { name: /Sim the season/i }).count()) {
    await page.waitForTimeout(2500)
    await page.screenshot({ path: `${out}/${tag}-season-live.png` })
    await page.getByRole('button', { name: /Sim the season/i }).click()
    await page.waitForTimeout(800)
    await page.screenshot({ path: `${out}/${tag}-season-done.png` })
    await page.getByRole('button', { name: /To the playoffs/i }).click()
    await page.waitForTimeout(800)
  }
  await page.waitForTimeout(3500)
  await page.screenshot({ path: `${out}/${tag}-playoffs-live.png` })
  await page.getByRole('button', { name: /To the champion/i }).click()
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${out}/${tag}-playoffs-done.png` })
  await page.getByRole('button', { name: /^Crown/i }).click()
  await page.waitForTimeout(1800)
  await page.screenshot({ path: `${out}/${tag}-champion.png` })
}

log('errors:', errors.length ? errors : 'none')
await browser.close()
process.exit(errors.length ? 1 : 0)
