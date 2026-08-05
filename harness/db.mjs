// Machine-captured database state. No opinions, just rows.
import { DatabaseSync } from 'node:sqlite'

// Tables dumped in full; everything else contributes a row count only.
// ponytail: hand-picked because 52 models of full dump would drown the judge.
// Add a table here when a flow's expectations depend on its contents.
const DETAIL_TABLES = ['BoardSession', 'SessionMessage', 'Problem', 'BoardRole']

export function snapshot(dbPath) {
  const db = new DatabaseSync(dbPath)
  try {
    const tables = db
      .prepare(
        `select name from sqlite_master where type='table'
         and name not like 'sqlite_%' and name not like '_prisma%' order by name`
      )
      .all()
      .map((r) => r.name)

    const counts = {}
    for (const t of tables) {
      counts[t] = db.prepare(`select count(*) as n from "${t}"`).get().n
    }

    const rows = {}
    for (const t of DETAIL_TABLES) {
      if (tables.includes(t)) rows[t] = db.prepare(`select * from "${t}"`).all()
    }

    return { counts, rows }
  } finally {
    db.close()
  }
}

/** Row-count deltas plus the detail tables' before/after, for the judge. */
export function diff(before, after) {
  const changed = {}
  for (const t of new Set([...Object.keys(before.counts), ...Object.keys(after.counts)])) {
    const b = before.counts[t] ?? 0
    const a = after.counts[t] ?? 0
    if (b !== a) changed[t] = { before: b, after: a, delta: a - b }
  }
  return changed
}
