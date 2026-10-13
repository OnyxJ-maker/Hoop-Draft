import { chromium } from 'playwright-core'

const url = process.env.URL ?? 'http://127.0.0.1:5477/'
const out = process.env.OUT ?? '/tmp/shots'
const format = process.env.FORMAT ?? 'Ball Knowledge'

const browser = await chromium.launch({ executablePath: '/usr/local/bin/google-chrome', args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console.error: ${m.text()}`)
})
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

await page.locator('button', { hasText: 'Game modes inside' }).click()
await page.waitForTimeout(900)
await page.screenshot({ path: `${out}/formats.png` })

await page.locator('button', { hasText: format }).first().click()
await page.waitForTimeout(700)
await page.screenshot({ path: `${out}/setup.png`, fullPage: true })

await page.getByRole('button', { name: /Start draft/i }).click()
await page.waitForTimeout(1500)
await page.screenshot({ path: `${out}/lottery.png` })
await page.getByRole('button', { name: /Skip/i }).click()
await page.waitForTimeout(600)
await page.screenshot({ path: `${out}/lottery-done.png` })
await page.getByRole('button', { name: /Start the draft/i }).click()
await page.waitForTimeout(1500)
await page.screenshot({ path: `${out}/draft-intro.png` })

console.log('errors:', errors.length ? errors : 'none')
await browser.close()
