import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
const url = process.env.URL ?? 'http://127.0.0.1:5477/'
const out = process.env.OUT ?? '/tmp/shots'
const save = readFileSync('/tmp/perfect-state.json', 'utf8')
const browser = await chromium.launch({ executablePath: '/usr/local/bin/google-chrome', args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console.error: ${m.text().slice(0, 200)}`) })
page.setDefaultTimeout(20000)
await page.goto(url, { waitUntil: 'networkidle' })
await page.evaluate((s) => localStorage.setItem('hoop-draft-game-v1', s), save)
await page.reload({ waitUntil: 'networkidle' })
await page.getByText('Resume your game').click()
await page.waitForTimeout(1500)
await page.waitForTimeout(5000)
await page.screenshot({ path: `${out}/perfect-a.png` })
await page.waitForTimeout(9000)
await page.screenshot({ path: `${out}/perfect-b.png` })
await page.waitForTimeout(12000)
await page.screenshot({ path: `${out}/perfect-c.png` })
await page.getByRole('radio', { name: '4x' }).click()
await page.waitForTimeout(500)
await page.getByRole('radio', { name: '1x' }).click()
await page.waitForTimeout(500)
for (let i = 0; i < 12; i++) {
  if (await page.getByText('Perfect season').count()) break
  await page.waitForTimeout(2500)
}
await page.waitForTimeout(2500)
await page.screenshot({ path: `${out}/perfect-final.png` })
console.log('errors:', errors.length ? errors : 'none')
await browser.close()
