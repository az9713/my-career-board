#!/usr/bin/env node
// One flow, end to end: isolate -> seed -> drive -> collect -> judge -> teardown.
//   npm run vf flow-016
import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { ROOT, down, up } from './up.mjs'
import { seed } from '../verification/fixtures/personas.mjs'
import { diff, snapshot } from './db.mjs'
import { drive } from './drive.mjs'
import { judge } from './judge.mjs'

function loadFlow(id) {
  const file = path.join(ROOT, 'verification', 'flows.jsonl')
  const flows = fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l))
  const flow = flows.find((f) => f.id === id)
  if (!flow) throw new Error(`no such flow: ${id} (have: ${flows.map((f) => f.id).join(', ')})`)
  return flow
}

function stamp() {
  const iso = new Date().toISOString()
  return `${iso.slice(0, 10)}T${iso.slice(11, 16).replace(':', '')}`
}

function writeReport(runDir, flow, verdict) {
  const line = (e) => `| ${e.supported === false || e.holds === false ? '✗' : '✓'} `
  const md = [
    `# ${flow.id} — ${flow.title}`,
    '',
    `**Verdict: ${verdict.verdict}**`,
    '',
    verdict.summary,
    '',
    '## Expectations',
    '',
    '| | Expectation | Evidence |',
    '|---|---|---|',
    ...verdict.expectations.map(
      (e) => `${line(e)}| ${e.text} | ${e.evidence.replace(/\|/g, '\\|')} |`
    ),
    '',
    '## Invariants',
    '',
    '| | ID | Evidence |',
    '|---|---|---|',
    ...verdict.invariants.map(
      (i) => `${line(i)}| ${i.id} | ${i.evidence.replace(/\|/g, '\\|')} |`
    ),
    '',
    ...(verdict.repro ? ['## Repro', '', verdict.repro, ''] : []),
    '## Artifacts',
    '',
    '- `run.webm` — full session video',
    '- `steps.json` — every action with pre/post URL, timestamps and page text',
    '- `screenshots/` — one per action',
    '- `console.log`, `server.log`, `network.har`',
    '- `db-before.json`, `db-after.json`',
    '- `driver-narration.json` — the driver\'s own words. Withheld from the judge.',
    '',
  ].join('\n')
  fs.writeFileSync(path.join(runDir, 'report.md'), md)
}

async function main() {
  const flowId = process.argv[2]
  if (!flowId) throw new Error('usage: npm run vf <flow-id>')
  const flow = loadFlow(flowId)

  const runDir = path.join(ROOT, 'verification', 'runs', `${stamp()}_${flow.id}`)
  fs.mkdirSync(runDir, { recursive: true })
  console.log(`[vf] ${flow.id} -> ${path.relative(ROOT, runDir)}`)

  let instance
  try {
    console.log('[vf] isolate: copying template.db, booting app')
    instance = await up(flow.id)
    console.log(`[vf] up on ${instance.url}`)

    console.log(`[vf] seed: ${flow.fixture}`)
    const prisma = new PrismaClient({ datasources: { db: { url: instance.databaseUrl } } })
    try {
      await seed(prisma, flow.fixture)
    } finally {
      await prisma.$disconnect()
    }

    const before = snapshot(instance.db)
    fs.writeFileSync(path.join(runDir, 'db-before.json'), JSON.stringify(before, null, 2))

    console.log('[vf] drive: agent as user')
    await drive({ flow, url: instance.url, runDir })
  } finally {
    // Teardown before the final snapshot so SQLite's WAL is flushed.
    if (instance) {
      fs.writeFileSync(path.join(runDir, 'server.log'), instance.serverLog())
      down(instance)
      await new Promise((r) => setTimeout(r, 1000))
      const before = JSON.parse(fs.readFileSync(path.join(runDir, 'db-before.json'), 'utf8'))
      const after = snapshot(instance.db)
      fs.writeFileSync(
        path.join(runDir, 'db-after.json'),
        JSON.stringify({ ...after, diffFromBefore: diff(before, after) }, null, 2)
      )
      fs.rmSync(instance.db, { force: true })
      for (const s of ['-wal', '-shm']) fs.rmSync(instance.db + s, { force: true })
    }
  }

  console.log('[vf] judge: separate context, machine-captured artifacts only')
  const verdict = await judge({ flow, runDir })
  fs.writeFileSync(path.join(runDir, 'verdict.json'), JSON.stringify(verdict, null, 2))
  writeReport(runDir, flow, verdict)

  console.log(`\n[vf] ${verdict.verdict} — ${verdict.summary}`)
  console.log(`[vf] report: ${path.relative(ROOT, path.join(runDir, 'report.md'))}`)
  process.exit(verdict.verdict === 'PASS' ? 0 : 1)
}

main().catch((err) => {
  console.error(`[vf] ${err.stack || err.message}`)
  process.exit(2)
})
