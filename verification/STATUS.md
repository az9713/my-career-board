# Verification environment — implementation status

**Project:** an agentic verification environment for `my-career-board`
(`az9713/my-career-board`, local `C:\Users\simon\Downloads\projects\my-career-board`).
**Spec:** `verification-environment-plan.html` — kept **outside** this repo, not
git-tracked anywhere (local: `C:\Users\simon\Downloads\ai_coding_future_ray_amjad\`).
**Origin:** Ray Amjad, ["This Is Where AI Coding Goes Next"](https://www.youtube.com/watch?v=_eCtUVds3wA)
— the verification environment is the durable asset, not the generated code.
**Code:** commit `f12faf1`, docs commit `4fc4a42`, both pushed to `origin/main`.
**Date of this document:** 2026-08-04. **Phases complete:** 0 and 1 of 3.

---

## 1. What this thing is, in one paragraph

Normal automated tests check equality: click here, expect the string "Question 2".
That works until the thing you need to check is *meaning* — whether a paragraph the
LLM wrote actually references the user's problem by name, whether a vague answer got
challenged instead of waved through. You cannot write `assert.equal` for that. So
this project builds the alternative: a model **uses** the app through a real browser
like a person would, everything it does is recorded as machine evidence (screenshots,
network traffic, server log, database before/after), and then a **second, separate
model** — which never talks to the first one — reads only that evidence and issues a
verdict with citations. The app under test is a good choice for this because it stores
data in SQLite (so an isolated sandbox is literally a file copy, not a Docker
container), it has real login, and most of its output is generated prose.

The design's load-bearing idea is **separation of powers**. Two rules hold the whole
thing up:

1. **The driver never sees the expectations.** It gets `steps[]` — plain-English
   instructions — and nothing else. It cannot steer toward a pass because it does not
   know what passing looks like. (`harness/drive.mjs:181`)
2. **The judge never sees the driver's words.** The driver's own account of the run is
   written to `driver-narration.json` and read by no one; the judge's bundle is
   assembled from machine-captured files only. (`harness/judge.mjs:112`)

Break either and you have built a machine for generating green ticks.

---

## 2. What is implemented

Two commands work today:

```bash
npm run vf flow-016      # the whole loop: isolate → seed → drive → collect → judge
npm run vf:selftest      # the deterministic half only: no app, no browser, no model
```

The code splits into a **disposable harness** (~600 lines of plumbing, expected to be
rewritten) and a **durable asset** (the flows, invariants, fixtures, rubric and
accumulated run evidence — the part that's supposed to only ever grow).

### The harness — `harness/`, 774 lines total

| File | Lines | What it does |
|---|---:|---|
| `up.mjs` | 114 | Builds a template database once (`prisma db push` against an empty file), then per flow: copies it, picks a port from the flow number (`flow-016` → 3116), boots the app with that database, waits for HTTP. Also loads `.env.local`/`.env` by hand — ~8 lines instead of a dotenv dependency. Teardown kills the process tree (`taskkill /T /F` on Windows, because npm spawns node as a child and killing the shell alone leaves the port held). |
| `db.mjs` | 45 | Reads the SQLite file directly with Node 22's built-in `node:sqlite`. Row counts for all tables; full row dumps for four hand-picked ones (`BoardSession`, `SessionMessage`, `Problem`, `BoardRole`) — dumping all 52 models would drown the judge. Computes the before/after diff. |
| `agent.mjs` | 78 | The only file that knows which model or SDK is in use. Two functions: an agentic tool loop (max 40 turns, a runaway guard) and a single structured call constrained to a JSON schema. Models are overridable by env var; both default to `claude-opus-5`. |
| `drive.mjs` | 198 | Launches Playwright Chromium, gives the model six browser tools (`goto`, `snapshot`, `click`, `fill`, `press`, `wait`), and wraps every single call in a recorder: screenshot, URL before and after, timestamps, 4 000 characters of visible page text, and any error. Records video and a HAR with response bodies embedded. |
| `judge.mjs` | 154 | Checks the bundle is complete *in code* before spending a token — a missing artifact returns `INADMISSIBLE` with no model call at all. Then compresses the HAR (method, URL, status, plus request/response bodies for `/api/` routes only), samples 8 screenshots evenly across the run, and makes one schema-constrained call whose system prompt is the rubric file. |
| `run.mjs` | 127 | The loop end to end, plus the human-readable `report.md`. One subtlety: the app is shut down *before* the final database snapshot, so SQLite's write-ahead log is flushed and the "after" state is real. |
| `selftest.mjs` | 58 | The runnable check for everything that doesn't need a model (details in §3). |

### The asset — `verification/`

- **`flows.jsonl`** — 1 flow so far. `flow-016`: "Audit gate rejects a semantically
  vague answer." Each flow carries an id, title, priority tier, fixture name,
  plain-English `steps[]`, `expect[]` (judge-only), the invariant ids it claims to
  exercise, and `touches[]` — the source files that should trigger it.
- **`invariants.md`** — INV-01 … INV-10: properties that must hold in *every* run
  regardless of flow (no 500s, no console exceptions, no stack traces rendered to the
  page, no orphan rows, no silent history deletion, the API key never in a
  client-bound payload, protected pages never render partially when logged out, the
  app never advances past a gate it said failed). Each row names the artifact it is
  checked from — an invariant with no evidence source is a comment, not an invariant.
  INV-10 is the one that justifies the whole architecture: "director prose references
  at least one portfolio problem by name" is a semantic property no assertion library
  can express.
- **`fixtures/personas.mjs`** — one persona, `established-user`: fixed user id, fixed
  bcrypt salt (so the password hash is byte-identical every seed), fixed timestamps,
  3 classified problems, 5 board roles, no session in progress.
- **`judge/rubric.md`** — the judge's constitution. Three gates in order:
  admissibility (are all seven artifact types present?), sufficiency (is each
  expectation supported *or* contradicted by a specific artifact? — if neither, the
  answer is `INADMISSIBLE`, never `PASS`), and citations (every finding must name
  where it was seen). Then the verdict table: `PASS` / `FAIL` / `INADMISSIBLE`.
- **`runs/`** — one dated evidence bundle per run.

---

## 3. What has been tested — and what that testing actually proves

### The self-test: 8 assertions, no model, no browser

`npm run vf:selftest` passes. It checks the reproducible half of the system, which is
the half where a bug would silently corrupt every future verdict:

- the template database builds and is **migrated but empty** (`User` count 0);
- seeding produces exactly 1 user, 3 problems, 5 board roles, 0 sessions;
- ids are the fixed ones (`usr_fixture_0001`) — this is what lets a flow say
  "problem prb_fixture_0002" literally;
- the seeded password hash actually verifies against the plaintext the driver will
  type — otherwise every flow would fail at login for the wrong reason;
- **seeding twice produces byte-identical state.** If the fixture drifts, no two
  verdicts are comparable and the entire accumulated asset is worthless.

### The end-to-end run: exactly one, and it FAILED — usefully

`verification/runs/2026-08-05T0345_flow-016/` — 23 recorded browser actions, 23
screenshots, a 12 MB HAR, full server and console logs, database before and after,
and a verdict with citations. The judge returned **FAIL**, all three expectations
contradicted.

What it found is a genuine production bug, not a harness artifact:

1. `src/lib/llm/providers/anthropic.ts:18` and `:69` call model
   `claude-sonnet-4-20250514`, which is **retired** — the API returns 404.
   `src/lib/streaming/service.ts:30` defaults to the same dead id.
2. The `catch` block at `anthropic.ts:47-54` returns
   `{isSpecific: true, reason: 'Evaluation unavailable - response accepted'}`.
   In plain terms: **when the checker is unreachable, the gate says yes.** The comment
   above it even says "Default to accepting the response if API fails."
3. So the deliberately vague answer — "I have been avoiding making some changes around
   here" — sailed through. The API returned `nextPhase: 1`, the UI advanced to
   "Question 2 of 5 / 20% complete", no challenge appeared, and the answer was
   committed to the database with metadata `gateResult: "passed"`.

Every claim above is a citation in `report.md`, traced to a specific step's page text,
a specific HAR entry, or a specific database row. This is the strongest available
evidence that the setup works: the first honest run of the first flow found a real
defect that had been sitting on `main`, and it is a defect that **disables every
LLM-gated feature in the app at once** — the audit gate, the director prose, and
pattern detection all route through the same dead model id.

### What has *not* been tested

Be clear about this, because one green self-test and one red flow is a thin base:

- **The judge is uncalibrated.** No bundle with a known-correct answer has ever been
  fed to it. Its FAIL here looks right to a human reader, but nothing has established
  its false-positive or false-negative rate. Plan §07 calls for 7 calibration bundles
  and a 6/7 minimum before any verdict is trusted.
- **No `PASS` has ever been observed.** The pass path through `run.mjs` (exit code 0,
  the `✓` branch of the report writer) has literally never executed.
- **`INADMISSIBLE` has never been observed either** — the no-model admissibility gate
  in `judge.mjs` has only ever taken its happy path.
- **Flake rate is unknown.** One run is not a sample. The driver is a model choosing
  Playwright selectors from an accessibility snapshot; how often it picks a wrong one
  is unmeasured.
- **Only one flow, one persona, one browser, one screen size.** No logged-out flow, no
  multi-user tenancy flow, no mobile viewport.
- **27 of the 28 flows in the plan don't exist**, and the plan's flow inventory was
  written against a 6-model, 21-route checkout. The app now has 52 Prisma models and
  roughly 100 routes.

---

## 4. Open issues

### Blocking — the next thing to do

**B1. The fail-open gate.** Two independent fixes, neither done:
update the retired model id everywhere it appears (`anthropic.ts:18`, `:69`,
`streaming/service.ts:30`), and make the gate **fail closed** — on an API error,
challenge rather than accept. A gate that accepts when its checker is down is not a
gate. `flow-016` will keep failing until both land, which is the point of it.

**B2. The judge is uncalibrated.** Build the 7 calibration bundles under
`verification/judge/calibration/` and score the judge against known answers. Below
6/7, no verdict is trusted. **Do not write flows 1–28 before this** — writing 28 flows
scored by an unvalidated judge manufactures 28 unreliable results.

### Structural — will bite as soon as the thing scales

**S1. `npm run build` is broken on main, so sandboxes boot in dev mode.**
`origin/main` does not typecheck. Two errors in
`src/app/api/board/[sessionId]/stream/route.ts` are fixed in the working tree;
at least one more remains in `src/app/api/context/upload/route.ts`
(`parseResumeText` argument type). Consequence: `up.mjs` spawns `npm run dev`, so every
route compiles on first hit (slow) and the dev error overlay can appear in screenshots
the judge is reading. One `spawn` line to flip back when the build is green; the
comment marks it. Do **not** reach for `typescript.ignoreBuildErrors`.

**S2. Committed run bundles cannot be re-judged.** `.gitignore` excludes
`screenshots/`, `*.har` and `*.webm` from `verification/runs/`. Those are three of the
seven artifacts the admissibility gate requires — so replaying any committed run
through the judge returns `INADMISSIBLE`. Either commit them (16 MB per run, 12 MB of
it HAR — 28 flows nightly is roughly 450 MB/night, so: no) or accept that the git
history holds verdicts and reports but not re-judgeable evidence, and say so
explicitly. Currently it is neither decided nor documented.

**S3. Evidence volume.** 12 MB of HAR for 23 actions, because bodies are embedded.
`summariseHar()` trims it for the judge, but the file on disk is the full thing. A
retention policy is needed before the nightly tier exists.

**S4. Failure history is write-only.** `verification/runs/` accumulates and nothing
ever reads it back — no "this flow has failed 3 of the last 5 runs," no flake
quarantine. Roughly 30 lines to fix; worth pulling forward into Phase 3.

**S5. Flow selection is a filename lookup, not inference.** A flow declares
`touches[]`; a PR that adds a brand-new route matches nothing, so the newest and least
proven code is exactly what gets skipped.

**S6. The invariant library is only half-enforced.** INV-01…INV-10 are documented as
holding in *every* run, but the judge is only asked about the ids a flow lists in its
`invariants[]` field. `flow-016` lists three; the other seven are never evaluated.
Either pass the whole library every time or stop calling them universal.

**S7. The judge's evidence is sampled, not complete.** 8 screenshots out of 23, page
text truncated at 4 000 characters, response bodies at 2 000, server log at the last
20 000. All defensible defaults, none of them measured against a case where the
missing slice mattered.

**S8. `DETAIL_TABLES` is hand-picked** — four of 52 models get full row dumps. Any
flow whose expectations depend on another table gets a judge that can see only a row
count. There is a comment saying to add tables as needed; there is no check that
catches the omission.

### Smaller, known, and fine for now

- Port derived from the flow number (`flow-016` → 3116) — collides if two runs of the
  same flow overlap, and caps the scheme at 100 flows.
- The turn cap of 40 browser actions is a runaway guard, not a considered budget.
- The judge rules on screenshots, not the video — a model cannot read a `.webm`.
  `run.webm` exists for humans only.
- No rerun-on-`INADMISSIBLE`; one run writes one verdict. That is Phase 3.
- Exploratory testing is entirely absent — every run follows a scripted `steps[]`.
  Deliberately gated on calibration 7/7 and a flake rate under 5%.
- `CLAUDE.md` is stale: it documents the 6-model version of the app and ends with a
  7-item manual testing checklist that no longer covers it.

---

## 5. What this project contributes, incomplete as it is

None of the following depends on getting to Phase 3.

**1. A working demonstration that the architecture catches real bugs.** The first
honest run of the first flow found a defect that disables every LLM-gated feature in
the app, and it was a defect that no equality assertion would have caught: the gate
returned HTTP 200 and reported success. The only way to see it was to check the
*meaning* of what the app did against what it should have done. That is one datapoint,
not a proof — but it is the datapoint the whole approach needed.

**2. A concrete anti-collusion design, reduced to two enforceable lines of code.**
"Agents grade their own homework" is the standard objection to agentic testing. This
answers it structurally rather than by prompting: the driver is never told the
expectations, and the judge is never shown the driver's narration — the narration is
written to disk and read by nothing. It is checkable by reading two lines
(`drive.mjs:181`, `judge.mjs:112`), which means it is checkable in code review, which
means it can survive a rewrite of everything around it.

**3. Admissibility as code, not as a prompt.** The judge cannot rule on an incomplete
bundle, because completeness is checked in plain JavaScript before the model is called.
A missing artifact returns `INADMISSIBLE` for free. Likewise "neither supported nor
contradicted" resolves to `INADMISSIBLE`, not `PASS` — the failure mode of every
LLM-as-judge setup is a confident verdict on thin evidence, and this makes thin
evidence a distinct, visible outcome instead of a silent green tick.

**4. The durable/disposable split.** `verification/` is the asset — flows, invariants,
fixtures, rubric, accumulated verdicts — and it only ever grows. `harness/` is 774
lines of plumbing that is *supposed* to be thrown away and rewritten as the tooling
changes. Swapping model or SDK means editing one file, `agent.mjs`; nothing in
`verification/` knows what model exists. Most testing setups tangle these two so
thoroughly that changing the runner means losing the test suite.

**5. An invariant library separate from the tests.** Properties that must hold in
every run live in one file, versioned, each naming the artifact it is checked from —
rather than being copy-pasted into every test case. INV-10 in particular ("director
prose references at least one portfolio problem by name") is a property that only a
judge model can rule on, lifted straight out of the app's own manual checklist. That
is the migration path the whole design is arguing for: hand-run checklist item →
machine-checked invariant.

**6. Isolation cheap enough to actually run.** Because the app is on SQLite, a sandbox
is `fs.copyFileSync` of a pre-migrated template, plus a port number derived from the
flow id. No containers, no compose file, no test-database server. This is what makes
per-flow isolation affordable enough to be the default rather than an aspiration.

**7. Evidence bundles that outlive the run.** Each run leaves a dated folder that a
human can read without re-running anything: 23 screenshots, a video, the full network
trace, both logs, database before and after, and a `report.md` where every claim
carries a citation. Even with zero further development, the existing bundle is a
complete, self-contained bug report for the fail-open gate — including the shortest
reproduction, written by the judge.

**8. An honest, specific record of what it does not yet do.** §3's "not tested" list
and §4's open issues are part of the deliverable. A verification system whose own
limits are undocumented is exactly the thing it exists to prevent.

---

## 6. Where to look next

| Question | File |
|---|---|
| What do I do next? | `HANDOFF.md` (repo root) — the live resume point |
| Why is it designed this way? | `verification-environment-plan.html` — §04 components, §05 the loop, §07 judge design, §08 flow-016 in full, §13 an honest audit of what it leaves out |
| What is the judge allowed to conclude? | `verification/judge/rubric.md` |
| What must hold in every run? | `verification/invariants.md` |
| What did the one real run find? | `verification/runs/2026-08-05T0345_flow-016/report.md` |
| Repo conventions (stale — 6-model era) | `CLAUDE.md` |
