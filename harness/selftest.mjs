#!/usr/bin/env node
// The smallest thing that fails if the reproducible half breaks: template
// build, deterministic seed, and the db snapshot. No app, no browser, no model.
//   npm run vf:selftest
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { ROOT, TEMPLATE_DB, ensureTemplate } from './up.mjs'
import { snapshot } from './db.mjs'
import { FIXTURE_EMAIL, FIXTURE_PASSWORD, seed } from '../verification/fixtures/personas.mjs'

const scratch = path.join(ROOT, '.runs', 'selftest.db')

async function seedInto(dbPath) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  fs.rmSync(dbPath, { force: true })
  fs.copyFileSync(TEMPLATE_DB, dbPath)
  const prisma = new PrismaClient({
    datasources: { db: { url: `file:${dbPath.replace(/\\/g, '/')}` } },
  })
  try {
    await seed(prisma, 'established-user')
  } finally {
    await prisma.$disconnect()
  }
  return snapshot(dbPath)
}

ensureTemplate()
assert.ok(fs.existsSync(TEMPLATE_DB), 'template.db was not built')

const empty = snapshot(TEMPLATE_DB)
assert.equal(empty.counts.User, 0, 'template.db must be migrated but unseeded')

const first = await seedInto(scratch)
assert.equal(first.counts.User, 1)
assert.equal(first.counts.Problem, 3)
assert.equal(first.counts.BoardRole, 5)
assert.equal(first.counts.BoardSession, 0, 'established-user has no session in progress')

const user = first.rows.Problem[0]
assert.equal(user.userId, 'usr_fixture_0001', 'fixed ids are what make flows literal')

// The login the driver will perform must actually work.
const db = new (await import('node:sqlite')).DatabaseSync(scratch)
const row = db.prepare('select email, password from User').get()
db.close()
assert.equal(row.email, FIXTURE_EMAIL)
assert.ok(bcrypt.compareSync(FIXTURE_PASSWORD, row.password), 'fixture password does not verify')

// Determinism: seed twice, get byte-identical state.
const second = await seedInto(scratch)
assert.deepEqual(second, first, 'fixture is not deterministic — no verdict would be comparable')

fs.rmSync(scratch, { force: true })
console.log('selftest ok: template built, fixture deterministic, login credentials valid')
