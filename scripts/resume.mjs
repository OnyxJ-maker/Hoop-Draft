import { chromium } from 'playwright-core'
const url = process.env.URL ?? 'http://127.0.0.1:5477/'
const out = process.env.OUT ?? '/tmp/shots'
const browser = await chromium.launch({ executablePath: '/usr/local/bin/google-chrome', args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console.error: ${m.text().slice(0, 200)}`) })
page.setDefaultTimeout(20000)

await page.goto(url, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle' })
await page.locator('button', { hasText: 'Game modes inside' }).click()
await page.locator('button', { hasText: 'Pack Rip' }).first().click()
await page.waitForTimeout(500)
// 20 second shot clock
await page.getByRole('radio', { name: '20s' }).click()
await page.getByRole('button', { name: /Start draft/i }).click()
await page.getByRole('button', { name: /Skip/i }).click()
await page.getByRole('button', { name: /Start the draft/i }).click()
await page.getByRole('button', { name: /Quick CPU picks/i }).click()
await page.waitForTimeout(1500)

const picksText = async () => (await page.locator('header').first().innerText()).match(/(\d+)\/(\d+) picks/i)?.[0]
console.log('before:', await picksText())

// wait until a human is on the clock (Draft button label present or "YOUR PICK")
await page.getByText('Your pick', { exact: false }).first().waitFor()
const start = await picksText()
console.log('human on clock; picks:', start)
await page.waitForTimeout(23500)
const after = await picksText()
console.log('after waiting out shot clock:', after)
const auto = await page.getByText('Auto').count()
console.log('auto badge visible:', auto > 0)
await page.screenshot({ path: `${out}/shotclock.png` })

// pause to menu and resume
await page.getByRole('button', { name: /Back to menu/i }).click()
await page.getByRole('button', { name: /Pause to menu/i }).click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${out}/resume-menu.png` })
const resumeBtn = page.getByText('Resume your game')
console.log('resume visible after pause:', (await resumeBtn.count()) > 0)

// reload page and resume
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(800)
console.log('resume visible after reload:', (await page.getByText('Resume your game').count()) > 0)
await page.getByText('Resume your game').click()
await page.waitForTimeout(1200)
console.log('after resume:', await picksText())
await page.screenshot({ path: `${out}/resumed.png` })
console.log('errors:', errors.length ? errors : 'none')
await browser.close()
