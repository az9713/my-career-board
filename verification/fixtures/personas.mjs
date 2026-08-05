// State generation. A fixture is a named function that writes a known world.
// Everything is deterministic: fixed ids, fixed timestamps, fixed password hash.
// If the seed varies, no verdict is comparable to any other verdict.
//
// ponytail: plain JS against the Prisma client, not an agent and not TypeScript.
// A model here would add cost, latency and nondeterminism; a build step would
// add a build step. Move to .ts when a fixture outgrows ~50 lines of Prisma.
import bcrypt from 'bcryptjs'

export const FIXTURE_EMAIL = 'fixture@test.local'
export const FIXTURE_PASSWORD = 'Fixture123!'

// Fixed salt => byte-identical hash on every seed.
const FIXED_HASH = bcrypt.hashSync(FIXTURE_PASSWORD, '$2a$10$abcdefghijklmnopqrstuv')
const T0 = new Date('2026-01-01T00:00:00.000Z')

export const personas = {
  /** Signed up, 3 classified problems, 5 board roles, no session in progress. */
  'established-user': async (prisma) => {
    const user = await prisma.user.create({
      data: {
        id: 'usr_fixture_0001',
        email: FIXTURE_EMAIL,
        password: FIXED_HASH,
        name: 'Fixture User',
        createdAt: T0,
        updatedAt: T0,
      },
    })

    const problems = [
      ['prb_fixture_0001', 'Onboarding drop-off', 'New users stall at step 3 of setup', 'appreciating'],
      ['prb_fixture_0002', 'Manual invoice reconciliation', 'Finance reconciles invoices by hand each month', 'depreciating'],
      ['prb_fixture_0003', 'Incident triage rota', 'Nobody owns first-response for pager alerts', 'stable'],
    ]
    for (const [id, name, whatBreaks, classification] of problems) {
      await prisma.problem.create({
        data: {
          id,
          userId: user.id,
          name,
          whatBreaks,
          classification,
          classificationReasoning: `Seeded fixture problem classified as ${classification}.`,
          createdAt: T0,
          updatedAt: T0,
        },
      })
    }

    const roles = ['operator', 'strategist', 'skeptic', 'connector', 'chair']
    for (let i = 0; i < roles.length; i++) {
      await prisma.boardRole.create({
        data: {
          id: `rol_fixture_000${i + 1}`,
          userId: user.id,
          roleType: roles[i],
          anchoredProblemId: problems[i % problems.length][0],
          focusArea: `Focus area for the ${roles[i]}`,
          generatedAt: T0,
        },
      })
    }

    return user
  },
}

export async function seed(prisma, name) {
  const fixture = personas[name]
  if (!fixture) throw new Error(`unknown fixture: ${name}`)
  return fixture(prisma)
}
