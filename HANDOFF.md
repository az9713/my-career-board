# HANDOFF — resume point for my-career-board

**Read this first each new session, then `CLAUDE.md` for the full conventions.**
This file is the live "what to do next"; `CLAUDE.md` is the standing playbook.
Don't duplicate what's already in the files referenced below — open them.

## Current state (2026-08-04, pushed at `f12faf1`)

The 31-commit gap to `origin/main` is closed, and two commits sit on top:

| Commit | What landed |
|--------|-------------|
| `f863b22` | Two type-error fixes in `src/app/api/board/[sessionId]/stream/route.ts` — revert this one alone if you'd rather own those yourself |
| `f12faf1` | The verification environment (this document, `harness/`, `verification/`) |

Working tree clean; local and `origin/main` both at `f12faf1`.

**Phase 0 and Phase 1 of the verification environment are built.** One command
boots an isolated instance of this app, seeds a known
database, drives a browser agent through plain-English steps, records the
evidence, and gets a verdict from a separate judge model:

```bash
npm run vf flow-016        # the full loop, one flow
npm run vf:selftest        # template + fixture determinism, no app/browser/model
```

### What exists

```
verification/          ← THE ASSET · git-tracked · only ever grows
├─ flows.jsonl         1 entry (flow-016)
├─ invariants.md       INV-01 … INV-10
├─ fixtures/personas.mjs   established-user (fixed ids, fixed hash, fixed dates)
├─ judge/rubric.md     admissibility → sufficiency → verdict, with citations
└─ runs/               dated evidence bundles, one folder per run
harness/               ← DISPOSABLE · ~600 lines
├─ agent.mjs           the CLI adapter (swap this to swap model/SDK)
├─ up.mjs              cp template.db, pick port, boot, wait for HTTP
├─ db.mjs              node:sqlite snapshot + diff
├─ drive.mjs           Playwright + driver agent, writes the evidence bundle
├─ judge.mjs           separate call, structured verdict, artifacts only
├─ run.mjs             the loop, end to end
└─ selftest.mjs        the runnable check for the non-agentic half
.runs/                 ← scratch: *.db, gitignored
```

### ⚠ `npm run build` fails on main — the harness works around it

`origin/main` does not typecheck. Two errors in
`src/app/api/board/[sessionId]/stream/route.ts` are fixed in the working tree
(a null-narrowing lost into a hoisted `function*`, and a wrong cast on
`createSSEStream`); at least one more remains in
`src/app/api/context/upload/route.ts` (`parseResumeText` argument type).

Because of that, `harness/up.mjs` boots each sandbox with **`npm run dev`**, not
`npm run start` as §10 of the plan sketches. Cost: on-demand route compilation
and the dev error overlay in screenshots. When the build is green, flip the one
`spawn` line back — the comment marks it. Do **not** reach for
`typescript.ignoreBuildErrors`.

## ⚠ First honest run found a real bug: the specificity gate fails open

`verification/runs/2026-08-05T0345_flow-016/` — verdict **FAIL**, all three
expectations contradicted, with citations.

Root cause chain:

1. `src/lib/llm/providers/anthropic.ts` calls model
   `claude-sonnet-4-20250514`, which is **retired** — the API returns 404.
2. Its `catch` returns `{isSpecific: true, reason: 'Evaluation unavailable -
   response accepted'}` — i.e. **the gate fails open on any API error**.
3. `checkSpecificityGate` therefore passes, the answer route advances
   `currentPhase` 0 → 1, and the deliberately vague answer ("I have been
   avoiding making some changes around here") is accepted with no challenge.

This is exactly the failure §08 of the plan predicted, and it means **every
LLM-gated feature in the app is currently a no-op** — the audit gate, the
director prose, and pattern detection all route through the same 404.

Two independent fixes are needed and neither is done:

- Update the model id in `src/lib/llm/providers/anthropic.ts` (and anywhere
  else `claude-sonnet-4-20250514` appears) to a current model.
- Make the gate **fail closed**: on an API error, challenge rather than accept.
  A gate that accepts when its checker is down is not a gate.

`flow-016` will keep failing until both land — which is the point.

## Next task

**Fix the fail-open gate above, re-run `npm run vf flow-016`, and expect PASS.**
Then Phase 2 — make the asset real. In priority order:

1. **Re-derive the flow inventory against current main.** The plan's 28 flows
   were scoped to 21 routes; there are now ~100. Its priority tiers (P0 every
   PR, P1 nightly, P2 weekly) become mandatory, not optional.
2. **Write `verification/fixtures/roles.ts`** — now a genuine role matrix, not
   just tenancy: `Team` / `TeamMember` / `TeamInvite` exist on main.
3. **Build the 7 calibration bundles** (`verification/judge/calibration/`) and
   score the judge. Below 6/7, no verdict is trusted.
4. Only then Phase 3 (fan-out, flake quarantine, reading `runs/` back).

Do **not** write flows 1–28 before the judge is calibrated.

## The two rules that must not be broken

Everything else in the design is negotiable. These two are not:

1. **The driver never sees `expect[]`.** `harness/drive.mjs` passes `flow.steps`
   and nothing else.
2. **The judge never sees the driver's narration.** It is written to
   `driver-narration.json` and read by nobody; `harness/judge.mjs` assembles the
   bundle from machine-captured artifacts only.

Break either and the result is a machine for generating green ticks.

## Deliberate deviations from the plan

- **`.mjs`, not `.ts`** for the harness and fixtures. Node 22 runs them with no
  build step; the plan's compile-time-safety argument for `.ts` costs a
  toolchain. Revisit if fixtures outgrow ~50 lines of Prisma calls.
- **Judge reads screenshots, not video.** `run.webm` is recorded for the human
  report; the judge rules on per-action screenshots, page text, HAR bodies and
  the db diff, because a model cannot read a `.webm`.
- **No rerun-on-INADMISSIBLE yet.** That is Phase 3 in the plan; a single run
  writes a single verdict today.

## Where to read things (reference, don't re-derive)

- `../../Downloads/ai_coding_future_ray_amjad/verification-environment-plan.html`
  — the spec. §04 = the seven durable components; §05 = the loop; §07 = judge
  design; §08 = flow-016 in full; §13 = an honest audit of what it leaves out.
- `verification/judge/rubric.md` — what the judge is allowed to conclude.
- `prisma/schema.prisma` — 52 models, still SQLite (which is why isolation is a
  file copy and not a container).
- `CLAUDE.md` — conventions. **Stale**: documents the 6-model version and ends
  with a 7-item manual testing checklist that no longer covers the app.

## Known gaps (deliberate — see plan §13)

- **Exploratory testing is absent.** Every run follows a scripted `steps[]`.
  Gated on calibration 7/7 and flake rate under 5%.
- **Failure history is write-only.** `verification/runs/` accumulates but
  nothing reads it back. ~30 lines to fix; pull it forward into Phase 3.
- **Flow selection is a filename lookup, not inference.** A PR adding a new
  route matches nothing in `touches[]`, so the newest code gets skipped.

## Session-transient scratch

None. `.runs/` and `verification/template.db` are gitignored and rebuilt on
demand (`ensureTemplate()` in `harness/up.mjs`).
