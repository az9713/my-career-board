// A separate model call in a clean context. It sees the rubric, the flow's
// expectations, the invariant library and the machine-captured artifacts.
// It never sees the driver's narration — that is the whole anti-collusion
// mechanism, not a performance detail.
import fs from 'node:fs'
import path from 'node:path'
import { JUDGE_MODEL, runStructured } from './agent.mjs'
import { ROOT } from './up.mjs'

const REQUIRED = [
  'steps.json',
  'console.log',
  'server.log',
  'network.har',
  'db-before.json',
  'db-after.json',
]

const MAX_IMAGES = 8

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['PASS', 'FAIL', 'INADMISSIBLE'] },
    expectations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          supported: { type: 'boolean' },
          evidence: { type: 'string' },
        },
        required: ['text', 'supported', 'evidence'],
        additionalProperties: false,
      },
    },
    invariants: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          holds: { type: 'boolean' },
          evidence: { type: 'string' },
        },
        required: ['id', 'holds', 'evidence'],
        additionalProperties: false,
      },
    },
    summary: { type: 'string' },
    repro: { type: 'string', description: 'Shortest reproduction on FAIL; empty string otherwise.' },
  },
  required: ['verdict', 'expectations', 'invariants', 'summary', 'repro'],
  additionalProperties: false,
}

/** HAR files are mostly noise. Keep method, url, status and API bodies. */
function summariseHar(harPath) {
  const har = JSON.parse(fs.readFileSync(harPath, 'utf8'))
  return har.log.entries.map((e) => {
    const row = {
      method: e.request.method,
      url: e.request.url,
      status: e.response.status,
      mimeType: e.response.content?.mimeType,
    }
    if (e.request.url.includes('/api/')) {
      if (e.request.postData?.text) row.requestBody = e.request.postData.text.slice(0, 1000)
      if (e.response.content?.text) row.responseBody = e.response.content.text.slice(0, 2000)
    }
    return row
  })
}

function sampleScreenshots(runDir) {
  const dir = path.join(runDir, 'screenshots')
  if (!fs.existsSync(dir)) return []
  const all = fs.readdirSync(dir).filter((f) => f.endsWith('.png')).sort()
  if (all.length <= MAX_IMAGES) return all
  const step = (all.length - 1) / (MAX_IMAGES - 1)
  return Array.from({ length: MAX_IMAGES }, (_, i) => all[Math.round(i * step)])
}

export async function judge({ flow, runDir }) {
  const missing = REQUIRED.filter((f) => !fs.existsSync(path.join(runDir, f)))
  const shots = sampleScreenshots(runDir)
  if (shots.length === 0) missing.push('screenshots/')

  if (missing.length) {
    // Gate 1 fails without a model call. Admissibility is not a judgement call.
    return {
      verdict: 'INADMISSIBLE',
      expectations: [],
      invariants: [],
      summary: `Missing artifacts: ${missing.join(', ')}`,
      repro: '',
    }
  }

  const read = (f) => fs.readFileSync(path.join(runDir, f), 'utf8')
  const bundle = {
    steps: JSON.parse(read('steps.json')),
    consoleLog: read('console.log'),
    serverLog: read('server.log').slice(-20_000),
    network: summariseHar(path.join(runDir, 'network.har')),
    dbBefore: JSON.parse(read('db-before.json')),
    dbAfter: JSON.parse(read('db-after.json')),
  }

  const content = [
    {
      type: 'text',
      text: [
        '## Invariant library',
        fs.readFileSync(path.join(ROOT, 'verification', 'invariants.md'), 'utf8'),
        '',
        '## Flow under judgement',
        JSON.stringify(
          {
            id: flow.id,
            title: flow.title,
            steps: flow.steps,
            expect: flow.expect,
            invariants: flow.invariants,
          },
          null,
          2
        ),
        '',
        '## Evidence bundle',
        JSON.stringify(bundle, null, 2),
        '',
        `## Screenshots (${shots.length} of the run, in order)`,
        shots.join(', '),
      ].join('\n'),
    },
    ...shots.map((f) => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/png',
        data: fs.readFileSync(path.join(runDir, 'screenshots', f)).toString('base64'),
      },
    })),
  ]

  return runStructured({
    model: JUDGE_MODEL,
    system: fs.readFileSync(path.join(ROOT, 'verification', 'judge', 'rubric.md'), 'utf8'),
    content,
    schema: VERDICT_SCHEMA,
  })
}
