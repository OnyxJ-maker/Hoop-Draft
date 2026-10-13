import { chromium } from 'playwright-core'

const browser = await chromium.launch({ executablePath: '/usr/local/bin/google-chrome', args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
page.on('pageerror', (e) => console.log('pageerror', e.message))
page.on('console', (m) => console.log('console', m.type(), m.text().slice(0, 300)))
await page.goto('http://127.0.0.1:5477/', { waitUntil: 'networkidle' })
await page.locator('button', { hasText: 'Game modes inside' }).click()
await page.waitForTimeout(600)
await page.locator('button', { hasText: 'Snake League' }).first().click()
await page.waitForTimeout(2500)
const info = await page.evaluate(() => {
  const main = document.querySelector('main')
  const wrapper = document.querySelector('#root > div')
  const walk = (el) => {
    const cs = getComputedStyle(el)
    return { tag: el.tagName, cls: String(el.className).slice(0, 60), opacity: cs.opacity, transform: cs.transform, vis: cs.visibility, h: el.getBoundingClientRect().height }
  }
  const chain = []
  let el = main
  while (el && el.id !== 'root') {
    chain.push(walk(el))
    el = el.parentElement
  }
  return { hasMain: !!main, chain, wrapper: wrapper ? walk(wrapper) : null, bodyText: document.body.innerText.slice(0, 200) }
})
console.log(JSON.stringify(info, null, 2))
await page.screenshot({ path: '/tmp/shots/setup2.png' })
await browser.close()
