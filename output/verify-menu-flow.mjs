import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'file:///C:/Users/eriri/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const url = 'http://localhost:5500/dist/webgame-ui/'
const artifactOutput = fileURLToPath(new URL('./menu-flow/', import.meta.url))
const output = 'C:\\tmp\\webgame-menu-flow'
fs.mkdirSync(output, { recursive: true })

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function readState(page) {
  return page.evaluate(() => JSON.parse(window.render_game_to_text()))
}

async function readPlayerStats(page) {
  return page.locator('.stat-row').evaluateAll(rows => Object.fromEntries(
    rows.map(row => {
      const values = row.querySelectorAll('span')
      return [values[0].textContent.trim(), Number(values[1].textContent)]
    }),
  ))
}

async function readLog(page) {
  return page.locator('.event-log li').allTextContents()
}

async function checkDesktop(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  const errors = []
  const failedRequests = []
  page.on('console', message => message.type() === 'error' && errors.push(message.text()))
  page.on('pageerror', error => errors.push(String(error)))
  page.on('response', response => response.status() >= 400 && failedRequests.push(`${response.status()} ${response.url()}`))

  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => {
    const title = document.querySelector('#game-title')
    return title?.tagName === 'IMG' && title.complete && title.naturalWidth > 0
  })
  let state = await readState(page)
  assert(state.screen === 'start' && !state.canContinue, 'initial start state is wrong')
  assert(await page.locator('#start-continue').isDisabled(), 'continue should start disabled')
  assert(await page.locator('#game-title').evaluate(title => title.currentSrc.endsWith('/artsource/ui/title.png')), 'start screen is not using title.png')
  await page.screenshot({ path: path.join(output, 'desktop-start.png'), fullPage: false })

  await page.waitForTimeout(500)
  await page.click('#start-restart')
  await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).screen === 'game')
  state = await readState(page)
  assert(state.screen === 'game' && state.canContinue && state.period === 'morning', 'new session did not initialize')
  const initialStats = await readPlayerStats(page)
  const initialTargets = JSON.stringify(state.visibleTargets)
  const initialLog = await readLog(page)

  await page.locator('.controls').getByRole('button', { name: /学习/ }).click()
  assert(JSON.stringify(await readPlayerStats(page)) !== JSON.stringify(initialStats), 'player action did not change stats before reset test')
  assert(await page.locator('.character-action').count() > 0, 'no nearby character was available for reset test')
  await page.locator('.character-action').first().click()
  assert((await readState(page)).visibleTargets.some(target => target.affection === 5), 'talk did not change affection before reset test')

  await page.getByRole('button', { name: '推进时间' }).click()
  state = await readState(page)
  assert(state.period === 'class1', 'time did not advance before return-to-start test')
  await page.locator('.location-marker-main').filter({ hasText: '图书馆' }).click()
  state = await readState(page)
  assert(state.location === 'library', 'location did not change before return-to-start test')

  const closedMapRect = await page.locator('.map-section').boundingBox()
  await page.click('#map-menu-toggle')
  await page.waitForFunction(() =>
    [...document.querySelectorAll('.map-menu-panel img')]
      .every(image => image.complete && image.naturalWidth > 0),
  )
  await page.waitForFunction(() =>
    getComputedStyle(document.querySelector('#map-menu-save .map-menu-selection')).opacity === '1',
  )
  assert(await page.locator('.map-menu-item').count() === 8, 'map menu should contain eight items')
  assert(await page.locator('#map-menu-save').evaluate(element => element.classList.contains('is-selected')), 'save should be selected when the menu opens')
  const openMenuStyle = await page.evaluate(() => ({
    panelBackground: getComputedStyle(document.querySelector('.map-menu-panel')).backgroundColor,
  }))
  const openMapRect = await page.locator('.map-section').boundingBox()
  assert(['x', 'y', 'width', 'height'].every(key => Math.abs(openMapRect[key] - closedMapRect[key]) < 0.01), 'opening the menu shifted or resized the map')
  assert(openMenuStyle.panelBackground === 'rgba(0, 0, 0, 0)', 'open menu still has a boxed panel background')
  await page.screenshot({ path: path.join(output, 'desktop-menu-open.png'), fullPage: false })
  const beforePlaceholder = JSON.stringify(await readState(page))
  const beforePlaceholderStats = JSON.stringify(await readPlayerStats(page))
  const beforePlaceholderLog = JSON.stringify(await readLog(page))
  await page.evaluate(() => document.querySelector('#map-menu-save').click())
  assert(JSON.stringify(await readState(page)) === beforePlaceholder, 'placeholder changed game state')
  assert(JSON.stringify(await readPlayerStats(page)) === beforePlaceholderStats, 'placeholder changed player stats')
  assert(JSON.stringify(await readLog(page)) === beforePlaceholderLog, 'placeholder wrote to the event log')
  assert(await page.locator('#map-menu-title').isVisible(), 'placeholder unexpectedly closed the menu')
  await page.hover('#map-menu-title')
  await page.waitForFunction(() =>
    getComputedStyle(document.querySelector('#map-menu-title .map-menu-selection')).opacity === '1',
  )
  assert(await page.locator('#map-menu-title').evaluate(element => element.classList.contains('is-selected')), 'hover did not move the selection ring')
  const hoveredItemStyle = await page.locator('#map-menu-title').evaluate(element => ({
    background: getComputedStyle(element).backgroundColor,
    boxShadow: getComputedStyle(element).boxShadow,
    filter: getComputedStyle(element).filter,
    overflow: getComputedStyle(element).overflow,
    pseudoContent: getComputedStyle(element, '::before').content,
  }))
  assert(hoveredItemStyle.background === 'rgba(0, 0, 0, 0)' && hoveredItemStyle.boxShadow === 'none' && hoveredItemStyle.filter === 'none', 'hover added a rectangular button effect')
  assert(hoveredItemStyle.overflow === 'visible' && hoveredItemStyle.pseudoContent === 'none', 'selection ring is still clipped to a button box')
  await page.screenshot({ path: path.join(output, 'desktop-menu-hover-title.png'), fullPage: false })
  await page.locator('#map-menu-dictionary').focus()
  assert(await page.locator('#map-menu-dictionary').evaluate(element => element.classList.contains('is-selected')), 'focus did not move the selection ring')
  const menuLayout = await page.evaluate(() =>
    ['.map-menu', '.map-menu-panel', '#map-menu-save', '#map-menu-save .map-menu-icon'].map(selector => {
      const element = document.querySelector(selector)
      const rect = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return {
        selector,
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        display: style.display,
        opacity: style.opacity,
        zIndex: style.zIndex,
        position: style.position,
        tagName: element.tagName,
        attributeSrc: element.getAttribute('src'),
        src: element.currentSrc || null,
        naturalWidth: element.naturalWidth || null,
      }
    }),
  )
  await page.click('#map-menu-title')
  state = await readState(page)
  assert(state.screen === 'start' && state.canContinue && !state.isPlaying, 'return title did not preserve the session')
  assert(!(await page.locator('#start-continue').isDisabled()), 'continue was not enabled after returning')
  await page.screenshot({ path: path.join(output, 'desktop-returned.png'), fullPage: false })

  await page.click('#start-continue')
  state = await readState(page)
  assert(state.screen === 'game' && state.period === 'class1' && state.location === 'library', 'continue did not resume preserved game state')
  assert(state.visibleTargets.some(target => target.affection === 5), 'continue did not preserve character state')
  assert(JSON.stringify(await readPlayerStats(page)) !== JSON.stringify(initialStats), 'continue did not preserve player state')

  await page.click('#map-menu-toggle')
  await page.click('#map-menu-back')
  assert(!(await page.locator('.map-menu-panel').isVisible()), 'return button did not close the map menu')

  await page.click('#map-menu-toggle')
  await page.click('.map-menu-backdrop', { position: { x: 10, y: 10 } })
  assert(!(await page.locator('.map-menu-panel').isVisible()), 'backdrop did not close the map menu')

  page.once('dialog', dialog => dialog.accept())
  await page.locator('.controls').getByRole('button', { name: '重新开始' }).click()
  state = await readState(page)
  assert(state.period === 'morning' && state.day === 1 && state.location === 'classroom' && state.scene === 'school-map' && state.isPlaying, 'confirmed restart did not reset game state')
  assert(JSON.stringify(state.visibleTargets) === initialTargets, 'confirmed restart did not reset character state')
  assert(JSON.stringify(await readPlayerStats(page)) === JSON.stringify(initialStats), 'confirmed restart did not reset player state')
  assert(JSON.stringify(await readLog(page)) === JSON.stringify(initialLog), 'confirmed restart did not reset the event log')

  assert(errors.length === 0, `console errors: ${errors.join(' | ')}`)
  assert(failedRequests.length === 0, `failed requests: ${failedRequests.join(' | ')}`)
  await page.close()
  return { errors, failedRequests, menuLayout, finalState: state }
}

async function checkMobile(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const errors = []
  const failedRequests = []
  page.on('console', message => message.type() === 'error' && errors.push(message.text()))
  page.on('pageerror', error => errors.push(String(error)))
  page.on('response', response => response.status() >= 400 && failedRequests.push(`${response.status()} ${response.url()}`))

  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => {
    const title = document.querySelector('#game-title')
    return title?.tagName === 'IMG' && title.complete && title.naturalWidth > 0
  })
  const startOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  assert(!startOverflow, 'start screen overflows horizontally on mobile')
  await page.screenshot({ path: path.join(output, 'mobile-start.png'), fullPage: false })

  await page.waitForTimeout(500)
  await page.click('#start-restart')
  await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).screen === 'game')
  await page.click('#map-menu-toggle')
  await page.waitForFunction(() =>
    [...document.querySelectorAll('.map-menu-panel img')]
      .every(image => image.complete && image.naturalWidth > 0),
  )
  const menuOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  assert(!menuOverflow, 'open map menu overflows horizontally on mobile')
  await page.screenshot({ path: path.join(output, 'mobile-menu-open.png'), fullPage: false })
  assert(errors.length === 0, `mobile console errors: ${errors.join(' | ')}`)
  assert(failedRequests.length === 0, `mobile failed requests: ${failedRequests.join(' | ')}`)
  await page.close()
  return { errors, failedRequests, startOverflow, menuOverflow }
}

const browser = await chromium.launch({ headless: true })
try {
  console.log(JSON.stringify({ desktop: await checkDesktop(browser), mobile: await checkMobile(browser) }, null, 2))
} finally {
  await browser.close()
}

fs.mkdirSync(artifactOutput, { recursive: true })
for (const file of fs.readdirSync(output)) {
  fs.copyFileSync(path.join(output, file), path.join(artifactOutput, file))
}
