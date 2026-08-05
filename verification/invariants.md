# Invariant library

Properties that must hold in **every** run, regardless of which flow is
executing. The driver does not check them; the judge does, from the evidence
bundle. This is why a flow whose expectations all hold can still fail the run.

| ID | Invariant | Checked from |
|----|-----------|--------------|
| INV-01 | No unhandled server error (500) at any point in the run | `server.log`, `network.har` |
| INV-02 | No uncaught exception or React hydration error in the browser console | `console.log` |
| INV-03 | No raw stack trace, file path, or API key rendered to the page | `steps[].domText`, screenshots |
| INV-04 | A destructive-looking action never happens without a visible response within 5s | `steps[]` timestamps + screenshots |
| INV-05 | Every row written carries the acting user's `userId` — no orphans, no cross-writes | `db-after.json` |
| INV-06 | Session count never decreases during a run (nothing silently deletes history) | `db-before.json` / `db-after.json` |
| INV-07 | The Anthropic API key never appears in any client-bound payload | `network.har` |
| INV-08 | Any protected page reached while logged out redirects, never renders partially | `steps[]` + screenshots |
| INV-09 | The app never advances past a gate it reported as failed | `network.har` + `db-after.json` |
| INV-10 | Director prose references at least one portfolio problem by name when one exists | `steps[].domText` (judge) |

INV-10 is the interesting one. It is a semantic property of generated prose —
no assertion library can express it, and a judge reading the transcript can rule
on it in one sentence. It comes straight out of the app's own manual checklist.

## Adding an invariant

One row per invariant, and the "checked from" column must name an artifact that
the bundle actually contains. An invariant the judge cannot see evidence for is
a comment, not an invariant.
