// The only genuinely agentic step: a model with a browser, told what to do and
// NOT what should happen. It reports what it saw; it judges nothing.
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import { DRIVER_MODEL, runToolLoop } from './agent.mjs'

const SYSTEM = `You are a user of a web application. You are not testing it; you are using it.

Rules:
- Use only the browser tools. Do not read the source, the database, or any file.
- Take a snapshot before acting so you know what is on the page.
- If a step cannot be completed, stop and record exactly what you saw.
- Report what happened, factually. Do not judge whether it was correct.
- Never guess a URL that wasn't in your steps.

When you have finished all the steps, reply with JSON only:
{"steps":[{"n":1,"action":"...","observed":"...","url":"..."}],"stopped_early":boolean,"note":string}`

const TOOLS = [
  {
    name: 'goto',
    description: 'Navigate to a path on the application, e.g. "/audit".',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Path beginning with /' } },
      required: ['path'],
    },
  },
  {
    name: 'snapshot',
    description: 'Return the current URL and an accessibility snapshot of the page.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'click',
    description: 'Click an element. Selector is any Playwright selector, e.g. role=button[name="Submit"] or text=Start Audit.',
    input_schema: {
      type: 'object',
      properties: { selector: { type: 'string' } },
      required: ['selector'],
    },
  },
  {
    name: 'fill',
    description: 'Type text into an input or textarea identified by a Playwright selector.',
    input_schema: {
      type: 'object',
      properties: { selector: { type: 'string' }, text: { type: 'string' } },
      required: ['selector', 'text'],
    },
  },
  {
    name: 'press',
    description: 'Press a keyboard key, e.g. Enter or Tab.',
    input_schema: {
      type: 'object',
      properties: { key: { type: 'string' } },
      required: ['key'],
    },
  },
  {
    name: 'wait',
    description: 'Wait for the page to settle, up to ms milliseconds (max 15000).',
    input_schema: {
      type: 'object',
      properties: { ms: { type: 'integer' } },
      required: ['ms'],
    },
  },
]

/**
 * Drive the flow's steps and write the machine-captured half of the evidence
 * bundle. Returns { narration, steps } — narration is the driver's own words
 * and must never reach the judge.
 */
export async function drive({ flow, url, runDir }) {
  const shotDir = path.join(runDir, 'screenshots')
  fs.mkdirSync(shotDir, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    baseURL: url,
    recordVideo: { dir: runDir },
    // Bodies are embedded: without them the judge cannot see what the server
    // actually returned, which is most of INV-09's evidence.
    recordHar: { path: path.join(runDir, 'network.har'), content: 'embed' },
  })
  const page = await context.newPage()

  const consoleLines = []
  page.on('console', (m) => consoleLines.push(`[${m.type()}] ${m.text()}`))
  page.on('pageerror', (e) => consoleLines.push(`[pageerror] ${e.message}`))

  const steps = []
  let n = 0

  const bodyText = async () => {
    try {
      return (await page.locator('body').innerText()).slice(0, 4000)
    } catch {
      return ''
    }
  }

  async function record(tool, input, act) {
    n += 1
    const urlBefore = page.url()
    const startedAt = new Date().toISOString()
    let result = ''
    let error = null
    try {
      result = (await act()) ?? 'ok'
    } catch (err) {
      error = err.message
    }
    await page.waitForTimeout(400)
    const shot = `${String(n).padStart(2, '0')}_${tool}.png`
    try {
      await page.screenshot({ path: path.join(shotDir, shot) })
    } catch {
      /* page may be mid-navigation */
    }
    steps.push({
      n,
      tool,
      input,
      urlBefore,
      urlAfter: page.url(),
      startedAt,
      finishedAt: new Date().toISOString(),
      screenshot: `screenshots/${shot}`,
      domText: await bodyText(),
      error,
    })
    if (error) throw new Error(error)
    return result
  }

  const execute = (name, input) =>
    record(name, input, async () => {
      switch (name) {
        case 'goto':
          await page.goto(input.path, { waitUntil: 'domcontentloaded' })
          return `navigated to ${page.url()}`
        case 'snapshot':
          return `url: ${page.url()}\n\n${await page.locator('body').ariaSnapshot()}`
        case 'click':
          await page.click(input.selector, { timeout: 10_000 })
          return `clicked ${input.selector}`
        case 'fill':
          await page.fill(input.selector, input.text, { timeout: 10_000 })
          return `filled ${input.selector}`
        case 'press':
          await page.keyboard.press(input.key)
          return `pressed ${input.key}`
        case 'wait':
          await page.waitForTimeout(Math.min(input.ms ?? 1000, 15_000))
          return 'waited'
        default:
          throw new Error(`unknown tool ${name}`)
      }
    })

  let narration
  try {
    narration = await runToolLoop({
      model: DRIVER_MODEL,
      system: SYSTEM,
      // The driver is given steps[] only. expect[] is deliberately withheld.
      content: `The application is at ${url}. Perform these steps in order:\n\n${flow.steps
        .map((s, i) => `${i + 1}. ${s}`)
        .join('\n')}`,
      tools: TOOLS,
      execute,
    })
  } catch (err) {
    narration = `driver aborted: ${err.message}`
  }

  await context.close() // flushes the HAR and the video
  await browser.close()

  const video = fs.readdirSync(runDir).find((f) => f.endsWith('.webm'))
  if (video && video !== 'run.webm') {
    fs.renameSync(path.join(runDir, video), path.join(runDir, 'run.webm'))
  }

  fs.writeFileSync(path.join(runDir, 'steps.json'), JSON.stringify(steps, null, 2))
  fs.writeFileSync(path.join(runDir, 'console.log'), consoleLines.join('\n'))
  fs.writeFileSync(
    path.join(runDir, 'driver-narration.json'),
    JSON.stringify({ WITHHELD_FROM_JUDGE: true, narration }, null, 2)
  )

  return { narration, steps }
}
