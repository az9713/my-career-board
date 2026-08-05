# flow-016 — Audit gate rejects a semantically vague answer

**Verdict: FAIL**

The specificity gate never evaluated: server.log shows 'Anthropic API error: 404 ... model: claude-sonnet-4-20250514' thrown inside evaluateSpecificity/checkSpecificityGate, and the answer route swallowed it and returned gateResult {passed:true, reason:'Evaluation unavailable - response accepted'}. The deliberately vague answer was therefore accepted: the API returned nextPhase=1, the UI advanced to 'Question 2 of 5 / 20% complete', no challenge message was rendered, and the Q1 text was committed to SessionMessage with metadata gateResult:'passed' (db-after BoardSession.currentPhase=1). All three flow expectations are contradicted by the DOM, network and DB artifacts. Listed invariants INV-01, INV-02 and INV-09 technically hold (no 500 surfaced, clean console, and the gate self-reported as passed), but the gate fails open, which is precisely what the flow was written to catch.

## Expectations

| | Expectation | Evidence |
|---|---|---|
| ✗ | The app does not advance to question 2 | step 20 domText shows 'Question 2 of 5 / 20% complete / What conversation have you been avoiding?' immediately after submitting; network.har POST /api/sessions/cmsfjp0hx000112k4mgirbvk9/answer -> 200 with {"gateResult":{"passed":true,...},"nextPhase":1}; db-after BoardSession.currentPhase = 1 |
| ✗ | A challenge message is displayed asking for a more specific decision | steps 20/21/23 domText contain no challenge text at all — only the next question 'What conversation have you been avoiding?'; screenshot 20_wait.png shows Q2 with an empty textarea and no challenge banner |
| ✗ | The answer text remains editable on question 1 | screenshot 20_wait.png / step 21 domText show the form replaced by Question 2 with placeholder "I've been putting off talking to..."; the Q1 answer 'I have been avoiding making some changes around here' was persisted as db-after SessionMessage with metadata gateResult:"passed" and is no longer editable |

## Invariants

| | ID | Evidence |
|---|---|---|
| ✓ | INV-01 | server.log shows all routes returning 200 (POST /api/sessions/.../answer 200 in 4.6s); network.har contains no non-2xx/3xx status. The Anthropic 404 was caught and handled server-side, not surfaced as a 500. |
| ✓ | INV-02 | console.log contains only React DevTools info, HMR connect and Fast Refresh logs — no uncaught exceptions or hydration errors |
| ✓ | INV-09 | network.har: POST /api/sessions/cmsfjp0hx000112k4mgirbvk9/answer returned gateResult.passed=true with reason 'Evaluation unavailable - response accepted'; the gate was never reported as failed, so advancing to nextPhase=1 does not violate this invariant as written (the failure is that the gate fails open, which is the expectation breach) |

## Repro

Log in as fixture@test.local / Fixture123!, go to /audit, click Start Audit, type 'I have been avoiding making some changes around here' into the Q1 textarea and click Submit — with an invalid/unavailable Anthropic model the gate returns passed:true ('Evaluation unavailable - response accepted') and the app advances to Question 2.

## Artifacts

- `run.webm` — full session video
- `steps.json` — every action with pre/post URL, timestamps and page text
- `screenshots/` — one per action
- `console.log`, `server.log`, `network.har`
- `db-before.json`, `db-after.json`
- `driver-narration.json` — the driver's own words. Withheld from the judge.
