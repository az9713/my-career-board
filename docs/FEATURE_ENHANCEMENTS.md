# Feature Enhancement Suggestions

This document outlines 10 meaningful enhancements for the my-career-board application to improve career accountability and user experience.

---

## Development Approach: Test-Driven Development (TDD)

All features will be implemented using the **TDD methodology**:

### TDD Cycle (Red-Green-Refactor)

```
┌─────────────────────────────────────────────────────────┐
│  1. RED     → Write a failing test                      │
│  2. GREEN   → Write minimum code to pass the test       │
│  3. REFACTOR → Improve code while keeping tests green   │
│  4. REPEAT  → Continue until feature is complete        │
└─────────────────────────────────────────────────────────┘
```

### Test Infrastructure Setup (Required First)

Before implementing features, set up testing infrastructure:

```bash
# Install testing dependencies
npm install -D jest @types/jest ts-jest
npm install -D @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event
npm install -D jest-environment-jsdom

# For API route testing
npm install -D node-mocks-http

# For database testing
npm install -D @prisma/client
```

**Test file structure:**
```
src/
├── __tests__/
│   ├── api/           # API route tests
│   ├── components/    # React component tests
│   ├── lib/           # Business logic tests
│   └── integration/   # End-to-end integration tests
├── lib/
│   └── __tests__/     # Co-located unit tests (alternative)
```

**Test naming convention:**
- Unit tests: `*.test.ts` or `*.test.tsx`
- Integration tests: `*.integration.test.ts`

---

## Implementation Order (TDD)

| Order | Feature | Test Categories |
|-------|---------|-----------------|
| 1 | Bet Tracking & Accountability Ledger | Unit, API, Component |
| 2 | Streaming Director Responses | API, Integration |
| 3 | Proactive Nudges & Reminders | Unit, API |
| 4 | Career Trajectory Visualization | Component, Unit |
| 5 | Session Replay & Learning Mode | Unit, Component |
| 6 | Evidence Vault with Integrations | API, Integration |
| 7 | Multi-Model AI Support | Unit, Integration |
| 8 | Custom Director Personas | Unit, API, Component |
| 9 | Problem Dependency Mapping | Unit, Component |
| 10 | Peer Accountability Boards | Full stack |

---

## 1. Bet Tracking & Accountability Ledger

Track quarterly bets with outcomes and calculate accuracy over time.

**Current State:** Infrastructure exists (`QuarterlyReport` model, `betAccuracy` placeholder) but isn't functional.

**Proposed Implementation:**
- Record falsifiable commitments from board meetings with deadlines
- At next review, mark bets as: hit, miss, or excused (with evidence)
- Show accuracy trends: "You've hit 7/12 bets (58%) over 4 quarters"
- Directors reference past bet accuracy in their responses
- Dashboard widget showing bet history and success rate

**Impact:** High | **Effort:** Medium

### TDD Implementation Plan

#### Step 1: RED - Write Failing Tests First

**Unit Tests** (`src/__tests__/lib/bets.test.ts`):
```typescript
describe('Bet Service', () => {
  describe('createBet', () => {
    it('should create a bet with required fields')
    it('should set default status to pending')
    it('should require a deadline date')
    it('should reject bets without falsifiable criteria')
  })

  describe('resolveBet', () => {
    it('should mark bet as hit with evidence')
    it('should mark bet as miss with reflection')
    it('should mark bet as excused with reason')
    it('should not allow resolving already resolved bets')
  })

  describe('calculateAccuracy', () => {
    it('should return 0% with no resolved bets')
    it('should calculate percentage correctly')
    it('should exclude excused bets from calculation')
    it('should filter by quarter when specified')
  })
})
```

**API Tests** (`src/__tests__/api/bets.test.ts`):
```typescript
describe('POST /api/bets', () => {
  it('should create a new bet')
  it('should return 401 if not authenticated')
  it('should return 400 for invalid data')
})

describe('PATCH /api/bets/[id]/resolve', () => {
  it('should resolve bet with outcome')
  it('should return 404 for non-existent bet')
})

describe('GET /api/bets/accuracy', () => {
  it('should return accuracy stats for user')
})
```

**Component Tests** (`src/__tests__/components/BetCard.test.tsx`):
```typescript
describe('BetCard', () => {
  it('should display bet content and deadline')
  it('should show pending status badge')
  it('should enable resolve actions for pending bets')
  it('should display outcome for resolved bets')
})

describe('BetAccuracyWidget', () => {
  it('should display accuracy percentage')
  it('should show hit/miss/excused breakdown')
  it('should link to bet history')
})
```

#### Step 2: GREEN - Implement to Pass Tests

1. Create `Bet` model in Prisma schema
2. Create `src/lib/bets/service.ts` with business logic
3. Create API routes: `POST /api/bets`, `PATCH /api/bets/[id]/resolve`, `GET /api/bets/accuracy`
4. Create React components: `BetCard`, `BetAccuracyWidget`, `BetResolutionModal`
5. Add to dashboard

#### Step 3: REFACTOR

- Extract common validation logic
- Add TypeScript interfaces
- Optimize database queries
- Add error boundaries to components

---

## 2. Evidence Vault with Integrations

Let users attach "receipts" to prove commitments. Currently directors ask for evidence but there's no way to provide it.

**Proposed Implementation:**
- Connect GitHub (commits, PRs, merged code)
- Connect Google Calendar (meeting attendance)
- Connect LinkedIn (profile updates, posts)
- Manual uploads (screenshots, documents)
- Directors can verify claims: "I see you did ship 3 PRs last month"
- Evidence linked to specific bets and claims

**Impact:** High | **Effort:** High

### TDD Implementation Plan

#### Step 1: RED - Write Failing Tests First

**Unit Tests** (`src/__tests__/lib/evidence.test.ts`):
```typescript
describe('Evidence Service', () => {
  describe('attachEvidence', () => {
    it('should link evidence to a bet')
    it('should support multiple evidence types')
    it('should validate evidence URLs')
  })

  describe('fetchGitHubActivity', () => {
    it('should fetch commits for date range')
    it('should fetch merged PRs')
    it('should handle rate limiting')
  })

  describe('verifyEvidence', () => {
    it('should auto-verify GitHub links')
    it('should mark manual uploads as unverified')
  })
})
```

**Integration Tests** (`src/__tests__/integration/github.test.ts`):
```typescript
describe('GitHub Integration', () => {
  it('should OAuth connect successfully')
  it('should fetch user repositories')
  it('should match commits to bet timeframes')
})
```

#### Step 2: GREEN - Implementation Order
1. Create `Evidence` model in Prisma
2. Build manual upload flow first (simplest)
3. Add GitHub OAuth integration
4. Create evidence attachment UI
5. Update director prompts to reference evidence

#### Step 3: REFACTOR
- Abstract integration providers
- Add caching for API calls
- Implement retry logic

---

## 3. Streaming Director Responses

Replace polling with real-time streaming for board meetings. Currently responses feel sluggish.

**Proposed Implementation:**
- Use Server-Sent Events (SSE) or WebSocket for streaming tokens
- Show typing indicator with director avatar
- Enable mid-stream interjections from other directors
- Progressive rendering of responses as they generate
- Fallback to polling if streaming fails

**Impact:** High | **Effort:** Medium

### TDD Implementation Plan

#### Step 1: RED - Write Failing Tests First

**Unit Tests** (`src/__tests__/lib/streaming.test.ts`):
```typescript
describe('Streaming Service', () => {
  describe('createStream', () => {
    it('should create SSE connection')
    it('should emit tokens as they arrive')
    it('should handle connection errors')
    it('should reconnect on disconnect')
  })

  describe('parseStreamChunk', () => {
    it('should parse Anthropic stream format')
    it('should detect end of stream')
    it('should handle malformed chunks')
  })
})
```

**API Tests** (`src/__tests__/api/stream.test.ts`):
```typescript
describe('GET /api/board/[sessionId]/stream', () => {
  it('should return SSE content-type')
  it('should stream tokens progressively')
  it('should include director metadata')
  it('should fallback to polling on error')
})
```

**Component Tests** (`src/__tests__/components/StreamingMessage.test.tsx`):
```typescript
describe('StreamingMessage', () => {
  it('should render tokens as they arrive')
  it('should show typing indicator while streaming')
  it('should complete when stream ends')
  it('should handle stream interruption gracefully')
})
```

#### Step 2: GREEN - Implementation Order
1. Create SSE endpoint with Anthropic streaming
2. Build client-side EventSource hook
3. Create StreamingMessage component
4. Add typing indicator UI
5. Implement fallback polling

#### Step 3: REFACTOR
- Add connection pooling
- Optimize re-renders with useMemo
- Add stream buffering for smooth display

---

## 4. Career Trajectory Visualization

Add visual dashboards showing progress over time. Currently all insights are text-based.

**Proposed Implementation:**
- Problem classification changes over time (is your skillset appreciating?)
- Time allocation shifts across quarters (stacked area chart)
- Avoidance patterns heatmap (what you consistently avoid)
- Commitment completion burndown chart
- Bet accuracy trend line
- Exportable quarterly "report card" PDF

**Libraries:** Recharts, D3.js, or Chart.js

**Impact:** High | **Effort:** Medium

### TDD Implementation Plan

#### Step 1: RED - Write Failing Tests First

**Unit Tests** (`src/__tests__/lib/analytics.test.ts`):
```typescript
describe('Analytics Service', () => {
  describe('calculateTrajectory', () => {
    it('should aggregate data by quarter')
    it('should calculate trend direction')
    it('should handle missing quarters')
  })

  describe('generateChartData', () => {
    it('should format data for Recharts')
    it('should include all required series')
    it('should handle empty datasets')
  })
})
```

**Component Tests** (`src/__tests__/components/charts.test.tsx`):
```typescript
describe('BetAccuracyChart', () => {
  it('should render line chart with accuracy data')
  it('should show tooltip on hover')
  it('should handle zero data gracefully')
})

describe('TimeAllocationChart', () => {
  it('should render stacked area chart')
  it('should show problem breakdown')
  it('should animate on load')
})

describe('AvoidanceHeatmap', () => {
  it('should render heatmap grid')
  it('should color by frequency')
  it('should show theme labels')
})
```

#### Step 2: GREEN - Implementation Order
1. Install Recharts library
2. Create analytics data aggregation service
3. Build individual chart components
4. Create dashboard layout
5. Add PDF export with react-pdf

#### Step 3: REFACTOR
- Memoize expensive calculations
- Add responsive breakpoints
- Implement lazy loading for charts

---

## 5. Custom Director Personas

Allow users to create their own directors with specific expertise relevant to their career.

**Current State:** Only 5 hardcoded directors in `personas.ts`.

**Proposed Implementation:**
- Define name, avatar, focus area, and personality
- Write custom system prompts with guardrails
- Example personas:
  - "Startup Advisor" for founders
  - "Technical Mentor" for engineers
  - "Sales Coach" for business development
- Mix custom directors with default ones in board meetings
- Share custom personas with community (optional)

**Impact:** Medium | **Effort:** Medium

### TDD Implementation Plan

#### Step 1: RED - Write Failing Tests First

**Unit Tests** (`src/__tests__/lib/customDirectors.test.ts`):
```typescript
describe('Custom Director Service', () => {
  describe('createDirector', () => {
    it('should create director with required fields')
    it('should validate system prompt length')
    it('should sanitize prompt for safety')
    it('should generate unique ID')
  })

  describe('mergeWithDefaults', () => {
    it('should combine custom and default directors')
    it('should allow replacing default directors')
    it('should maintain director limit')
  })
})
```

**Component Tests** (`src/__tests__/components/DirectorBuilder.test.tsx`):
```typescript
describe('DirectorBuilder', () => {
  it('should render form with all fields')
  it('should preview director card')
  it('should validate required fields')
  it('should save director on submit')
})
```

#### Step 2: GREEN - Implementation Order
1. Create `CustomDirector` model in Prisma
2. Build director CRUD service
3. Create DirectorBuilder form component
4. Update board meeting to include custom directors
5. Add director management page

#### Step 3: REFACTOR
- Add prompt templates
- Implement director sharing
- Add avatar upload

---

## 6. Proactive Nudges & Reminders

The app is currently passive—users must remember to check in.

**Proposed Implementation:**
- Email/push notifications when quarterly review is due
- Weekly micro-check-ins (1 question, 2 minutes)
- "Avoidance alert" if patterns suggest something's being dodged
- Calendar integration to schedule recurring board meetings
- Streak tracking for consistent accountability
- Configurable reminder frequency and channels

**Infrastructure Needed:** Email service (Resend, SendGrid), cron jobs or scheduled functions

**Impact:** High | **Effort:** Low-Medium

### TDD Implementation Plan

#### Step 1: RED - Write Failing Tests First

**Unit Tests** (`src/__tests__/lib/notifications.test.ts`):
```typescript
describe('Notification Service', () => {
  describe('scheduleReminder', () => {
    it('should create reminder for quarterly review')
    it('should respect user timezone')
    it('should not duplicate reminders')
  })

  describe('detectAvoidanceAlert', () => {
    it('should trigger alert for recurring patterns')
    it('should include pattern details in alert')
    it('should respect alert cooldown')
  })

  describe('calculateStreak', () => {
    it('should count consecutive check-ins')
    it('should reset on missed week')
    it('should handle timezone boundaries')
  })
})
```

**API Tests** (`src/__tests__/api/notifications.test.ts`):
```typescript
describe('POST /api/notifications/preferences', () => {
  it('should update user notification preferences')
  it('should validate email format')
})

describe('POST /api/cron/send-reminders', () => {
  it('should send due reminders')
  it('should mark reminders as sent')
  it('should handle email failures')
})
```

#### Step 2: GREEN - Implementation Order
1. Add notification preferences to User model
2. Create notification service with email provider
3. Build cron job for scheduled reminders
4. Create notification preferences UI
5. Implement streak tracking

#### Step 3: REFACTOR
- Add notification queuing
- Implement batch sending
- Add unsubscribe handling

---

## 7. Multi-Model AI Support

Currently locked to Anthropic Claude. Allow users to choose or compare AI providers.

**Current State:** Settings UI has "Provider selection coming soon" placeholder.

**Proposed Implementation:**
- Add OpenAI GPT-4/GPT-4o support
- Add Google Gemini support
- Add local models via Ollama
- Use OpenRouter as unified API gateway
- "Second opinion" mode: get responses from 2 models side-by-side
- Fallback to alternate provider if primary fails
- Per-director model assignment (different directors use different models)

**Impact:** Medium | **Effort:** Medium

### TDD Implementation Plan

#### Step 1: RED - Write Failing Tests First

**Unit Tests** (`src/__tests__/lib/providers.test.ts`):
```typescript
describe('LLM Provider Factory', () => {
  describe('createProvider', () => {
    it('should create Anthropic provider')
    it('should create OpenAI provider')
    it('should create Gemini provider')
    it('should throw for unknown provider')
  })

  describe('generateResponse', () => {
    it('should use consistent interface across providers')
    it('should handle provider-specific errors')
    it('should respect token limits')
  })

  describe('fallbackChain', () => {
    it('should try next provider on failure')
    it('should log fallback events')
    it('should respect fallback order')
  })
})
```

**Integration Tests** (`src/__tests__/integration/providers.test.ts`):
```typescript
describe('Provider Integration', () => {
  it('should get response from OpenAI')
  it('should get response from Anthropic')
  it('should fallback on rate limit')
})
```

#### Step 2: GREEN - Implementation Order
1. Create provider interface/abstract class
2. Refactor Anthropic provider to implement interface
3. Add OpenAI provider implementation
4. Add provider selection to settings
5. Implement fallback chain

#### Step 3: REFACTOR
- Add response caching
- Implement cost tracking per provider
- Add provider health monitoring

---

## 8. Peer Accountability Boards

Enable trusted peers to join as "external directors" for peer feedback.

**Proposed Implementation:**
- Invite 1-2 real people to your board (colleagues, mentors)
- They receive session summaries and can add async comments
- Option for live peer-AI hybrid sessions
- Privacy controls: choose what peers can see
- Reciprocal accountability: join their board too
- Peer-specific questions: "What has [name] been avoiding?"

**Impact:** High | **Effort:** High

### TDD Implementation Plan

#### Step 1: RED - Write Failing Tests First

**Unit Tests** (`src/__tests__/lib/peers.test.ts`):
```typescript
describe('Peer Service', () => {
  describe('invitePeer', () => {
    it('should create invitation with unique token')
    it('should send invitation email')
    it('should enforce peer limit')
    it('should expire old invitations')
  })

  describe('acceptInvitation', () => {
    it('should link peer to board')
    it('should reject expired invitations')
    it('should handle already-accepted invitations')
  })

  describe('getSharedContent', () => {
    it('should filter content by privacy settings')
    it('should include session summaries')
    it('should exclude private notes')
  })
})
```

**API Tests** (`src/__tests__/api/peers.test.ts`):
```typescript
describe('POST /api/peers/invite', () => {
  it('should create and send invitation')
  it('should return 400 for invalid email')
  it('should return 403 if peer limit reached')
})

describe('POST /api/peers/[id]/comment', () => {
  it('should add peer comment to session')
  it('should notify board owner')
})
```

**Component Tests** (`src/__tests__/components/PeerManagement.test.tsx`):
```typescript
describe('PeerInviteForm', () => {
  it('should validate email input')
  it('should show pending invitations')
  it('should allow revoking invitations')
})

describe('PeerCommentThread', () => {
  it('should display peer comments')
  it('should allow replies')
  it('should show comment timestamps')
})
```

#### Step 2: GREEN - Implementation Order
1. Create `PeerInvitation` and `PeerConnection` models
2. Build invitation flow with email
3. Create privacy settings UI
4. Add peer comment system
5. Build shared session view for peers

#### Step 3: REFACTOR
- Add real-time comment updates
- Implement peer activity notifications
- Add peer removal flow

---

## 9. Problem Dependency Mapping

Help users understand how their problems interconnect.

**Proposed Implementation:**
- Visual graph showing which problems block others
- Identify "keystone" problems that unlock multiple areas
- Time allocation vs. strategic importance matrix (2x2 grid)
- AI-suggested rebalancing: "You're over-investing in depreciating skills"
- Quarterly prompts to reassess problem priorities
- Drag-and-drop problem prioritization

**Impact:** Medium | **Effort:** Medium

### TDD Implementation Plan

#### Step 1: RED - Write Failing Tests First

**Unit Tests** (`src/__tests__/lib/dependencies.test.ts`):
```typescript
describe('Dependency Service', () => {
  describe('addDependency', () => {
    it('should link two problems')
    it('should prevent circular dependencies')
    it('should validate problem ownership')
  })

  describe('findKeystones', () => {
    it('should identify problems with most dependents')
    it('should return empty for no dependencies')
    it('should rank by impact score')
  })

  describe('suggestRebalancing', () => {
    it('should flag over-investment in depreciating skills')
    it('should suggest keystone focus')
    it('should consider time allocation')
  })
})
```

**Component Tests** (`src/__tests__/components/DependencyGraph.test.tsx`):
```typescript
describe('DependencyGraph', () => {
  it('should render nodes for each problem')
  it('should draw edges for dependencies')
  it('should highlight keystones')
  it('should support drag to create dependencies')
})

describe('PriorityMatrix', () => {
  it('should render 2x2 grid')
  it('should position problems by allocation/importance')
  it('should allow drag repositioning')
})
```

#### Step 2: GREEN - Implementation Order
1. Add dependency fields to Problem model
2. Create dependency service with graph algorithms
3. Build interactive graph component (react-flow or d3)
4. Create priority matrix UI
5. Add AI rebalancing suggestions

#### Step 3: REFACTOR
- Optimize graph layout algorithm
- Add dependency templates
- Implement undo/redo for changes

---

## 10. Session Replay & Learning Mode

Help users learn from their best accountability moments.

**Proposed Implementation:**
- Bookmark powerful director challenges
- "Breakthrough moments" detection (when specificity improved dramatically)
- Export session highlights as reflection prompts
- "What I learned" journaling after each session
- Searchable transcript archive with semantic search
- Tag and categorize insights for later reference
- Weekly digest of past insights

**Impact:** Medium | **Effort:** Low-Medium

### TDD Implementation Plan

#### Step 1: RED - Write Failing Tests First

**Unit Tests** (`src/__tests__/lib/replay.test.ts`):
```typescript
describe('Replay Service', () => {
  describe('bookmarkMessage', () => {
    it('should create bookmark for message')
    it('should allow adding notes to bookmark')
    it('should prevent duplicate bookmarks')
  })

  describe('detectBreakthroughs', () => {
    it('should identify specificity improvements')
    it('should compare before/after gate scores')
    it('should flag significant jumps')
  })

  describe('searchTranscripts', () => {
    it('should find messages by keyword')
    it('should rank by relevance')
    it('should filter by date range')
  })

  describe('generateDigest', () => {
    it('should compile weekly insights')
    it('should include top bookmarks')
    it('should summarize patterns')
  })
})
```

**Component Tests** (`src/__tests__/components/SessionReplay.test.tsx`):
```typescript
describe('BookmarkButton', () => {
  it('should toggle bookmark state')
  it('should show bookmark count')
  it('should open note modal on long press')
})

describe('TranscriptSearch', () => {
  it('should render search input')
  it('should show results with highlights')
  it('should link to session context')
})

describe('InsightJournal', () => {
  it('should render journal editor')
  it('should auto-save drafts')
  it('should link to session')
})
```

#### Step 2: GREEN - Implementation Order
1. Add `Bookmark` and `Journal` models to Prisma
2. Create bookmark toggle UI on messages
3. Build transcript search with text indexing
4. Create insight journal component
5. Implement breakthrough detection algorithm

#### Step 3: REFACTOR
- Add semantic search with embeddings
- Implement export to markdown/PDF
- Add bookmark collections/folders

---

## Implementation Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Bet Tracking & Accountability Ledger | High | Medium | P1 |
| Streaming Director Responses | High | Medium | P1 |
| Proactive Nudges & Reminders | High | Low | P1 |
| Career Trajectory Visualization | High | Medium | P2 |
| Evidence Vault with Integrations | High | High | P2 |
| Custom Director Personas | Medium | Medium | P2 |
| Multi-Model AI Support | Medium | Medium | P2 |
| Peer Accountability Boards | High | High | P3 |
| Problem Dependency Mapping | Medium | Medium | P3 |
| Session Replay & Learning Mode | Medium | Low | P3 |

---

## Recommended Implementation Order

### Phase 1: Core Accountability (P1)
1. **Bet Tracking** - Foundational for measuring accountability
2. **Streaming Responses** - Immediate UX improvement
3. **Proactive Nudges** - Drives engagement and retention

### Phase 2: Enhanced Insights (P2)
4. **Career Visualization** - Makes progress tangible
5. **Evidence Vault** - Proves commitments with data
6. **Custom Directors** - Personalization for different careers
7. **Multi-Model Support** - Flexibility and resilience

### Phase 3: Social & Advanced (P3)
8. **Peer Boards** - Adds human accountability layer
9. **Problem Mapping** - Strategic planning support
10. **Session Replay** - Learning from past sessions

---

## Notes

- All features should maintain the core philosophy of challenging users rather than validating them
- Privacy and data security should be prioritized, especially for peer features
- Mobile responsiveness should be considered for all new UI components
- Each feature should include appropriate error handling and fallback states
