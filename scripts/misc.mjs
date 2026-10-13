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

const hof = {
  state: {
    sound: true,
    fast: false,
    hof: [
      { id: 'a', date: Date.now(), mode: 'season82', kind: 'season82', owner: 'Mike', teamName: "Mike's Maulers", color: '#ff7a1a', icon: 'Flame', wins: 82, losses: 0, perfect: true, power: 105, roster: ['michael-jordan', 'lebron-james', 'kareem-abdul-jabbar', 'nikola-jokic', 'stephen-curry', 'tim-duncan', 'larry-bird', 'kevin-garnett'], format: 'snake' },
      { id: 'b', date: Date.now() - 86400000, mode: 'season82', kind: 'season82', owner: 'Dre', teamName: 'Brooklyn Bodegas', color: '#22d3ee', icon: 'Store', wins: 77, losses: 5, perfect: false, power: 99, roster: ['shaquille-o-neal', 'kobe-bryant', 'magic-johnson', 'hakeem-olajuwon', 'giannis-antetokounmpo'], format: 'pack' },
      { id: 'c', date: Date.now() - 172800000, mode: 'draft', kind: 'champion', owner: 'Sam', teamName: 'Seattle Squalls', color: '#f43f9d', icon: 'CloudLightning', wins: 14, losses: 3, power: 101, roster: ['kevin-durant', 'jayson-tatum', 'luka-doncic', 'joel-embiid', 'jimmy-butler'], format: 'ball-knowledge', note: 'Beat Denver Altitude 4-2 in the finals' },
    ],
  },
  version: 0,
}
await page.goto(url, { waitUntil: 'networkidle' })
await page.evaluate((s) => { localStorage.clear(); localStorage.setItem('hoop-draft-settings-v1', JSON.stringify(s)) }, hof)
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(800)
await page.getByRole('button', { name: /How to play/i }).click()
await page.waitForTimeout(600)
await page.screenshot({ path: `${out}/howto.png` })
await page.keyboard.press('Escape')
await page.getByRole('button', { name: /Hall of Fame/i }).click()
await page.waitForTimeout(900)
await page.screenshot({ path: `${out}/hof.png` })
await page.getByRole('button', { name: 'Back' }).click()

// 12-team lottery
await page.locator('button', { hasText: 'Game modes inside' }).click()
await page.locator('button', { hasText: 'Snake League' }).first().click()
await page.waitForTimeout(500)
const slider = page.locator('[role="slider"]').first()
await slider.focus()
await page.keyboard.press('End')
await page.waitForTimeout(300)
await page.screenshot({ path: `${out}/setup16.png`, fullPage: true })
await page.getByRole('button', { name: /Start draft/i }).click()
await page.waitForTimeout(4200)
await page.screenshot({ path: `${out}/lottery16.png` })
console.log('errors:', errors.length ? errors : 'none')
await browser.close()
