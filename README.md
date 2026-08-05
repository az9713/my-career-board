# my-career-board — an agentic verification environment

**The objective of this repository is the verification environment.
The career-board app is the vehicle it is built against.**

An agent uses the app through a real browser like a person would. Everything it does
is recorded as machine evidence. A **second, separate model** — which never speaks to
the first — reads only that evidence and returns a verdict with citations.

```bash
npm run vf flow-016      # the whole loop: isolate → seed → drive → collect → judge
npm run vf:selftest      # the deterministic half only: no app, no browser, no model
```

---

## Why build this

Ordinary automated tests check equality. Click here, expect the string
`"Question 2"`. That works right up until the thing you need to check is **meaning**:

- Did the specificity gate actually *challenge* a vague answer, or did it wave it
  through with a 200?
- Does the director's generated paragraph reference the user's own problem by name,
  or is it generic filler?
- Did the app advance past a gate it had already reported as failed?

No assertion library can express those. A human reading the screen can rule on each in
one sentence — so the design puts a model in the reader's seat and makes it rule from
evidence, under a written standard.

The standard objection to that is obvious: **agents grade their own homework**. This
repo's answer is structural, not a prompt.

---

## The two rules

Everything else in the design is negotiable. These two are not.

**1. The driver never sees the expectations.**
It gets `steps[]` — plain-English instructions — and nothing else. It cannot steer
toward a pass because it does not know what passing looks like. → `harness/drive.mjs:181`

**2. The judge never sees the driver's words.**
The driver's own account of the run is written to `driver-narration.json` and read by
nobody. The judge's bundle is assembled from machine-captured artifacts only.
→ `harness/judge.mjs:112`

Break either and you have built a machine for generating green ticks. Both are
checkable by reading one line, which means they survive code review — and they survive
a rewrite of everything around them.

---

## The loop

```
  isolate      cp verification/template.db → .runs/flow-016.db   (SQLite ⇒ a sandbox is a file copy)
     ↓         boot the app on a port derived from the flow id
  seed         a named fixture writes a known world: fixed ids, fixed hash, fixed dates
     ↓
  drive        the driver agent + Playwright, 6 browser tools, given steps[] only
     ↓         every action recorded: screenshot, URL before/after, timestamps, page text
  collect      steps.json · screenshots/ · console.log · server.log · network.har
     ↓         db-before.json · db-after.json (+ computed diff) · run.webm
  judge        a separate call, clean context, rubric as system prompt
     ↓         admissibility → sufficiency → verdict, every finding cited
  teardown     the environment never survives; the evidence always does
```

Each run leaves a dated folder under `verification/runs/` that a human can read without
re-running anything.

---

## Quick start

**Requires** Node 22+ (the harness reads SQLite with the built-in `node:sqlite`),
an `ANTHROPIC_API_KEY` in `.env.local`, and Playwright's browsers.

```bash
npm install
npx playwright install chromium
npx prisma generate

npm run vf:selftest      # ~20s, no model calls — start here
npm run vf flow-016      # the full loop; exit code 0 on PASS, 1 on FAIL, 2 on error
```

`vf:selftest` is the runnable check for the reproducible half: the template database
builds migrated-but-empty, the fixture seeds to exactly the expected rows with the
fixed ids, the seeded password hash actually verifies against the plaintext the driver
will type, and **seeding twice produces byte-identical state**. If the fixture drifts,
no two verdicts are comparable and the whole accumulated asset is worthless.

Model choice is one env var each, and nothing in `verification/` knows what is running:

```bash
VF_DRIVER_MODEL=claude-opus-5  VF_JUDGE_MODEL=claude-opus-5  npm run vf flow-016
```

---

## What it found on its first honest run

`flow-016` — "Audit gate rejects a semantically vague answer." 23 browser actions.
Verdict: **FAIL**, all three expectations contradicted, with citations.
(`verification/runs/2026-08-05T0345_flow-016/report.md`)

1. `src/lib/llm/providers/anthropic.ts:18` calls model `claude-sonnet-4-20250514`,
   which is **retired** — the API returns 404.
2. The `catch` at `anthropic.ts:47-54` returns
   `{isSpecific: true, reason: 'Evaluation unavailable - response accepted'}`.
   In plain terms: **when the checker is unreachable, the gate says yes.**
3. So the deliberately vague answer — *"I have been avoiding making some changes around
   here"* — sailed through. The API returned `nextPhase: 1`, the UI advanced to
   "Question 2 of 5", no challenge appeared, and the answer was committed with metadata
   `gateResult: "passed"`.

The route returned HTTP 200 and reported success. No equality assertion would have
caught this. And it is not one bug in one gate: **every LLM-gated feature in the app
routes through the same dead model id** — the audit gate, the director prose, and
pattern detection.

That is one datapoint rather than a proof. It is the datapoint the approach needed.

---

## What's in here

The split is deliberate: one half is meant to be thrown away, the other is meant to
only ever grow.

### `verification/` — the asset · git-tracked · durable

| Path | What it is |
|---|---|
| `flows.jsonl` | One line per flow: plain-English `steps[]`, judge-only `expect[]`, the invariants it exercises, and `touches[]` — the source files that should trigger it |
| `invariants.md` | INV-01 … INV-10: properties that must hold in *every* run, each naming the artifact it is checked from. An invariant with no evidence source is a comment, not an invariant |
| `fixtures/personas.mjs` | Named functions that write a known world. Fixed ids, fixed bcrypt salt, fixed timestamps |
| `judge/rubric.md` | The judge's constitution: admissibility → sufficiency → citations → verdict |
| `runs/` | Dated evidence bundles, one folder per run |

**INV-10 is the one that justifies the architecture:** *"director prose references at
least one portfolio problem by name when one exists."* That is a semantic property of
generated text, lifted straight out of the app's own hand-run checklist. A judge model
rules on it in one sentence; no assertion library can express it at all.

### `harness/` — the plumbing · disposable · 774 lines

| File | Lines | What it does |
|---|---:|---|
| `up.mjs` | 114 | Copies the pre-migrated template db, picks a port from the flow id, boots the app, waits for HTTP. Kills the process tree on teardown |
| `db.mjs` | 45 | Direct SQLite reads via `node:sqlite`: row counts for all tables, full dumps for four, plus the before/after diff |
| `agent.mjs` | 78 | **The only file that knows which model or SDK is in use.** An agentic tool loop and a schema-constrained call |
| `drive.mjs` | 198 | Playwright + the driver agent. Six tools; every call wrapped in a recorder |
| `judge.mjs` | 154 | Admissibility checked **in code before any token is spent**, HAR compressed, screenshots sampled, one structured call |
| `run.mjs` | 127 | The loop end to end, plus the human-readable `report.md` |
| `selftest.mjs` | 58 | The runnable check for the non-agentic half |

Swapping model, SDK or agent runtime means editing `agent.mjs`. Most testing setups
tangle the runner and the suite so thoroughly that changing one loses the other.

### Two design choices worth knowing

**Admissibility is code, not a prompt.** A missing artifact returns `INADMISSIBLE`
without calling the model at all. And an expectation that is *neither supported nor
contradicted* by any artifact resolves to `INADMISSIBLE`, never `PASS` — thin evidence
becomes a visible third outcome instead of a silent green tick.

**Isolation is a file copy.** Because the app is on SQLite, a sandbox is
`fs.copyFileSync` of a pre-migrated template plus a port number. No containers, no
compose file, no test-database server — which is what makes per-flow isolation cheap
enough to be the default rather than an aspiration.

---

## Status — phases 0 and 1 of 3

Working today: the full loop for one flow, and the self-test. Honestly, that is one
green self-test and one red flow, which is a thin base:

- **The judge is uncalibrated.** The 7 calibration bundles do not exist yet; below 6/7
  no verdict should be trusted. **Do not write flows 2–28 before this** — 28 flows
  scored by an unvalidated judge manufactures 28 unreliable results.
- **No `PASS` has ever been observed**, because the app bug above is real and unfixed.
- **Flake rate is unmeasured.** One run is not a sample.
- 1 flow, 1 persona, 1 viewport. Exploratory testing is absent by design — every run
  follows a scripted `steps[]`, gated on calibration and flake rate.
- `npm run build` does not typecheck on `main`, so sandboxes boot with `npm run dev`.
  One `spawn` line to flip back; the comment marks it.

| Read this | For |
|---|---|
| [`HANDOFF.md`](HANDOFF.md) | The live resume point — current state and the next task |
| [`verification/STATUS.md`](verification/STATUS.md) | Full write-up: what is implemented, what is tested, every open issue, what the project contributes |
| [`verification/judge/rubric.md`](verification/judge/rubric.md) | What the judge is allowed to conclude |
| [`verification/invariants.md`](verification/invariants.md) | What must hold in every run |
| `verification/runs/…/report.md` | What the one real run found |

The full implementation plan is an HTML document kept outside this repo
(`verification-environment-plan.html`): §04 the seven durable components, §05 the loop,
§07 judge design, §08 flow-016 in full, §13 an honest audit of what it leaves out.

---

# The vehicle: my-career-board

Everything below is the application under test. It is a real app, not a mock — that is
the point of it.

### Why this app was chosen

- **SQLite** — per-flow isolation is a file copy, not a container.
- **Real auth** — sessions, protected routes, redirects: things a driver agent must
  genuinely navigate.
- **LLM-generated prose everywhere** — output that cannot be checked with equality
  assertions, which is what makes a judge model load-bearing rather than decorative.
- **A hand-run manual checklist** already existed, so there was something concrete to
  migrate into machine-checked invariants.

### What it is

my-career-board treats your career like a company — with you as the CEO reporting to a
board of AI directors. They run audits and quarterly reviews to keep you honest about
what you're avoiding, which commitments you've broken, whether your skills are
appreciating or depreciating, and where your career path is actually leading.

Inspired by Nate Jones' "AI Board of Directors" concept.

| Feature | Description | Time |
|---------|-------------|------|
| **Problem Portfolio** | Define the 3–5 problems you're paid to solve | 15–20 min |
| **Quick Audit** | Fast accountability check with specificity gates | 15 min |
| **Board Meeting** | Full quarterly review with 5 AI directors | 45–60 min |
| **Pattern Detection** | Spot recurring themes you're avoiding | Automatic |
| **Session History** | Review past meetings and track progress | — |

**The 5 directors:** 🦅 Accountability Hawk · 📊 Market Reality Skeptic ·
🎯 Avoidance Hunter · ♟️ The Strategist · 😈 Devil's Advocate

### Running the app itself

```bash
npm install
npx prisma generate
npx prisma db push
cp .env.example .env.local     # add AUTH_SECRET (32+ chars) and ANTHROPIC_API_KEY
npm run dev                    # http://localhost:3000
```

Then: create an account, define 3+ problems, run your first Quick Audit.

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Data | SQLite + Prisma (52 models) |
| Auth | NextAuth.js v5 |
| AI | Anthropic Claude API |

```
src/app/            pages and API routes
src/components/     React components
src/lib/directors/  AI director personas
src/lib/llm/        LLM integration and gates
prisma/schema.prisma
```

### App documentation

| Document | Audience |
|----------|----------|
| [Quick Start](docs/QUICK_START.md) | Users — 5 minutes, 10 example use cases |
| [User Guide](docs/USER_GUIDE.md) | Users — every feature |
| [Developer Guide](docs/DEVELOPER_GUIDE.md) | Developers — setup, walkthrough, debugging |
| [Architecture](docs/ARCHITECTURE.md) | Developers — system design and data flow |
| [CLAUDE.md](CLAUDE.md) | AI assistants — conventions (**stale**: written for the 6-model version) |

Other scripts: `npm run build` · `npm run start` · `npm run lint` · `npm test` ·
`npx prisma studio`

---

## License

MIT — see LICENSE.

## Acknowledgments

**The application** is inspired by Nate Jones:
[video](https://www.youtube.com/watch?v=BaC5FEN2e4Y) ·
[substack](https://natesnewsletter.substack.com/p/the-rarest-thing-in-work-why-360).

**The verification environment** derives from Ray Amjad's
["This Is Where AI Coding Goes Next"](https://www.youtube.com/watch?v=_eCtUVds3wA) —
the argument that the durable asset is the verification environment, not the code the
agent writes — together with a GPT-5.6 summary of that talk and a Ramp engineer's
account of running agents as users against their own product. The design decisions —
and the failures — are this repo's own.

Built with [Claude Code](https://claude.ai/claude-code).
