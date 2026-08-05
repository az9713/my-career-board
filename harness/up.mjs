// Isolation model: one file copy per flow. SQLite makes a sandbox a `cp`.
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const TEMPLATE_DB = path.join(ROOT, 'verification', 'template.db')

// The harness needs ANTHROPIC_API_KEY the same way the app does. Next loads
// .env itself; plain node does not. Existing env vars always win.
// ponytail: ~8 lines beats a dotenv dependency for KEY=value files.
// .env.local first: it outranks .env, same as Next. .env here declares an
// empty ANTHROPIC_API_KEY, so "first non-empty wins" is load-bearing.
for (const file of ['.env.local', '.env']) {
  const p = path.join(ROOT, file)
  if (!fs.existsSync(p)) continue
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (!m) continue
    const value = m[2].trim().replace(/^["'](.*)["']$/, '$1')
    if (value && !process.env[m[1]]) process.env[m[1]] = value
  }
}

// Deterministic sessions: the same secret every run means the same cookies.
const FIXED_AUTH_SECRET = 'verification-environment-fixed-secret'
const IS_WIN = process.platform === 'win32'

const fileUrl = (p) => `file:${p.replace(/\\/g, '/')}`

/** `prisma db push` against an empty file. Built once per batch, never seeded. */
export function ensureTemplate() {
  if (fs.existsSync(TEMPLATE_DB)) return
  fs.mkdirSync(path.dirname(TEMPLATE_DB), { recursive: true })
  const r = spawnSync('npx', ['prisma', 'db', 'push', '--skip-generate', '--accept-data-loss'], {
    cwd: ROOT,
    shell: true,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: fileUrl(TEMPLATE_DB) },
  })
  if (r.status !== 0) throw new Error('prisma db push failed building template.db')
}

async function waitForHttp(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { redirect: 'manual' })
      if (res.status < 500) return
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`timed out waiting for ${url}`)
}

/** Boot an isolated instance of the app. flow-016 -> port 3116, .runs/flow-016.db */
export async function up(flowId) {
  ensureTemplate()

  const port = 3100 + Number(flowId.split('-')[1])
  const db = path.join(ROOT, '.runs', `${flowId}.db`)
  fs.mkdirSync(path.dirname(db), { recursive: true })
  for (const suffix of ['', '-wal', '-shm']) {
    if (fs.existsSync(db + suffix)) fs.rmSync(db + suffix)
  }
  fs.copyFileSync(TEMPLATE_DB, db) // <- the entire sandbox

  const databaseUrl = fileUrl(db)
  // ponytail: `next dev`, not `next start`. `next build` currently fails
  // typechecking on main (see HANDOFF), and the verification environment must
  // not be blocked on the app's build. Cost is on-demand route compilation
  // (first hit per route is slow) and the dev error overlay in screenshots.
  // Switch to `run start` the moment `npm run build` is green again.
  const proc = spawn('npm', ['run', 'dev'], {
    cwd: ROOT,
    shell: true,
    env: {
      ...process.env,
      PORT: String(port),
      DATABASE_URL: databaseUrl,
      NEXTAUTH_SECRET: FIXED_AUTH_SECRET,
      AUTH_SECRET: FIXED_AUTH_SECRET,
      NEXTAUTH_URL: `http://localhost:${port}`,
    },
  })

  let serverLog = ''
  proc.stdout.on('data', (d) => (serverLog += d))
  proc.stderr.on('data', (d) => (serverLog += d))

  const url = `http://localhost:${port}`
  try {
    await waitForHttp(`${url}/login`, 90_000)
  } catch (err) {
    down({ proc })
    throw new Error(`${err.message}\n--- server log ---\n${serverLog}`)
  }

  return { port, db, databaseUrl, url, proc, serverLog: () => serverLog }
}

/** Kill the port. The evidence survives; the environment never does. */
export function down(instance) {
  if (!instance?.proc || instance.proc.exitCode !== null) return
  if (IS_WIN) {
    // npm spawns node as a child; killing the shell alone leaves the port held.
    spawnSync('taskkill', ['/pid', String(instance.proc.pid), '/T', '/F'], { stdio: 'ignore' })
  } else {
    process.kill(-instance.proc.pid, 'SIGKILL')
  }
}
