# my-career-board Architecture Overview

## System Architecture for Developers

This document explains the complete architecture of my-career-board, from high-level concepts to implementation details.

---

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [Request Flow](#request-flow)
3. [Component Architecture](#component-architecture)
4. [Data Flow](#data-flow)
5. [AI Integration Architecture](#ai-integration-architecture)
6. [Authentication Architecture](#authentication-architecture)
7. [Database Schema](#database-schema)
8. [Feature Modules](#feature-modules)
9. [File Organization](#file-organization)
10. [Key Design Decisions](#key-design-decisions)
11. [Extending the System](#extending-the-system)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Browser                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Next.js Frontend                             │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │   │
│  │  │   Pages     │  │  Components │  │  Client-Side State      │  │   │
│  │  │  (Routes)   │  │  (React)    │  │  (useState, useEffect)  │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP (fetch)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Next.js Server                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Server Components                            │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │   │
│  │  │   Pages     │  │  Layouts    │  │  Data Fetching          │  │   │
│  │  │  (SSR)      │  │             │  │  (Prisma queries)       │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       API Routes (20+ modules)                   │   │
│  │  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌────────┐  │   │
│  │  │  auth   │ │  board  │ │ evidence │ │ decisions │ │ skills │  │   │
│  │  └─────────┘ └─────────┘ └──────────┘ └───────────┘ └────────┘  │   │
│  │  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌────────┐  │   │
│  │  │ feedback│ │ network │ │   okrs   │ │   comp    │ │learning│  │   │
│  │  └─────────┘ └─────────┘ └──────────┘ └───────────┘ └────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Core Libraries                              │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │   │
│  │  │  Prisma ORM │  │  NextAuth   │  │  LLM Orchestrator       │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
            │                                           │
            ▼                                           ▼
┌─────────────────────────┐               ┌─────────────────────────────┐
│       SQLite DB         │               │      Anthropic API          │
│  ┌───────────────────┐  │               │  ┌───────────────────────┐  │
│  │  40+ Models       │  │               │  │  Claude LLM           │  │
│  │  (Core + Phases)  │  │               │  │  (claude-sonnet-4)    │  │
│  └───────────────────┘  │               │  └───────────────────────┘  │
│      prisma/dev.db      │               └─────────────────────────────┘
└─────────────────────────┘
```

---

## Request Flow

### Page Load Flow (Server Component)

```
1. Browser requests /dashboard
        │
        ▼
2. Next.js middleware checks auth
        │
        ├─── Not authenticated ──▶ Redirect to /login
        │
        ▼
3. Server Component executes
        │
        ├── auth() - Get session
        ├── prisma.problem.count() - Query database
        ├── prisma.boardSession.findMany() - Query database
        │
        ▼
4. React component renders (server-side)
        │
        ▼
5. HTML sent to browser
        │
        ▼
6. Browser hydrates React components
```

### API Request Flow (Board Message with Streaming)

```
1. User types message and clicks Send
        │
        ▼
2. Client component calls fetch('/api/board/{id}/message')
        │
        ▼
3. API route receives request
        │
        ├── auth() - Verify user session
        ├── prisma.boardSession.findFirst() - Get session
        ├── prisma.problem.findMany() - Get portfolio
        │
        ▼
4. Orchestrator builds AI context
        │
        ├── Director system prompt
        ├── Portfolio context
        ├── Conversation history
        ├── User message
        │
        ▼
5. Anthropic API called (streaming)
        │
        ├── messages.create({ stream: true })
        ├── SSE streaming to client
        │
        ▼
6. Response stored in database
        │
        ├── prisma.sessionMessage.create()
        │
        ▼
7. JSON response sent to client
        │
        ▼
8. Client component updates UI
```

---

## Component Architecture

### Server Components vs Client Components

```
Server Components (Default)                 Client Components ('use client')
├── Run on server only                     ├── Run in browser
├── Can use async/await                    ├── Cannot use async directly
├── Can access database                    ├── Cannot access database
├── Can use secrets                        ├── No access to secrets
├── No interactivity                       ├── Full interactivity
└── Better performance                     └── Required for state/effects

Examples:                                   Examples:
├── src/app/page.tsx                       ├── src/app/.../board/[id]/page.tsx
├── src/app/(dashboard)/dashboard          ├── src/components/audit/AuditChat.tsx
└── src/app/(dashboard)/history            └── Any component with onClick, useState
```

### Component Hierarchy

```
RootLayout (Server)
├── Providers (Client) - Theme, Session
│   ├── AuthLayout (Server) - For /login, /signup
│   │   ├── LoginPage (Server)
│   │   └── SignupPage (Server + Client form)
│   │
│   └── DashboardLayout (Server) - For protected routes
│       ├── Sidebar/Header (Server)
│       └── Page Content
│           ├── DashboardPage (Server)
│           ├── PortfolioPage (Server)
│           ├── AuditPage (Client) - Interactive chat
│           ├── BoardPage (Client) - Interactive chat
│           ├── HistoryPage (Server)
│           └── Feature Pages (Phase 1-5)
│               ├── Evidence (Client)
│               ├── Check-ins (Client)
│               ├── Decisions (Client)
│               ├── Timeline (Client)
│               ├── Feedback (Client)
│               ├── Skills (Client)
│               ├── Network (Client)
│               ├── OKRs (Client)
│               ├── Compensation (Client)
│               └── Learning (Client)
```

---

## Data Flow

### Portfolio Creation Flow

```
┌─────────────────────┐
│  Portfolio Setup    │
│  (Client Component) │
└─────────┬───────────┘
          │
          │ Step 1: User fills form
          ▼
┌─────────────────────┐
│  Local State        │
│  (useState array)   │
└─────────┬───────────┘
          │
          │ Step 2: User clicks Save
          ▼
┌─────────────────────┐
│  fetch POST         │
│  /api/portfolio     │
│  /problems          │
└─────────┬───────────┘
          │
          │ Step 3: API processes
          ▼
┌─────────────────────┐
│  Prisma creates     │
│  Problem records    │
└─────────┬───────────┘
          │
          │ Step 4: Redirect to dashboard
          ▼
┌─────────────────────┐
│  Dashboard loads    │
│  with new data      │
└─────────────────────┘
```

### Board Meeting Message Flow (with Streaming)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client State                                 │
│  messages: [...], input: "", isSending: false, currentPhase: 0     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ User types and sends
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  1. Add user message to local state (optimistic update)             │
│  2. Set isSending = true                                            │
│  3. Connect to /api/board/{sessionId}/stream (SSE)                  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Streaming response
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Server:                                                             │
│  1. Verify auth                                                      │
│  2. Load session + messages + portfolio                              │
│  3. Build orchestrator state                                         │
│  4. Call Anthropic API with streaming                                │
│  5. Stream chunks to client via SSE                                  │
│  6. Store complete response in database                              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Stream chunks received
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Client:                                                             │
│  1. Append chunks to director message in real-time                   │
│  2. Update currentPhase if changed                                   │
│  3. Set isSending = false on complete                                │
│  4. Auto-scroll to follow text                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## AI Integration Architecture

### Director System

```
┌────────────────────────────────────────────────────────────────────┐
│                     DIRECTOR_PERSONAS Array                         │
├────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  accountability_hawk                                          │  │
│  │  ├── name: "The Accountability Hawk"                         │  │
│  │  ├── systemPrompt: "You demand evidence and specifics..."    │  │
│  │  └── interjectionTriggers: ["promise", "committed", ...]     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  market_reality                                               │  │
│  │  ├── name: "Market Reality Skeptic"                          │  │
│  │  ├── systemPrompt: "You question market value claims..."     │  │
│  │  └── interjectionTriggers: ["worth", "valuable", ...]        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ... (3 more directors)                                            │
└────────────────────────────────────────────────────────────────────┘
```

### Meeting Phase System

```
┌────────────────────────────────────────────────────────────────────┐
│                     BOARD_MEETING_PHASES Array                      │
├────────────────────────────────────────────────────────────────────┤
│  Phase 0: Opening                                                   │
│  ├── leadDirector: strategist                                      │
│  └── questions: ["What quarter are we reviewing..."]               │
│                                                                     │
│  Phase 1: Last Quarter Review                                       │
│  ├── leadDirector: accountability_hawk                             │
│  └── questions: ["What were your specific bets..."]                │
│                                                                     │
│  Phase 2: Avoidance Audit                                           │
│  ├── leadDirector: avoidance_hunter                                │
│  └── questions: ["What decision have you been avoiding..."]        │
│                                                                     │
│  Phase 3: Market Check                                              │
│  ├── leadDirector: market_reality                                  │
│  └── questions: ["How has your market value changed..."]           │
│                                                                     │
│  Phase 4: Strategy Review                                           │
│  ├── leadDirector: strategist                                      │
│  └── questions: ["Where is your current path leading..."]          │
│                                                                     │
│  Phase 5: Next Quarter Bets                                         │
│  ├── leadDirector: devils_advocate                                 │
│  └── questions: ["What are your bets for next quarter..."]         │
└────────────────────────────────────────────────────────────────────┘
```

### Orchestrator Flow

```
generateBoardResponse(state, userMessage, portfolio)
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  1. Get current phase and lead director                             │
├─────────────────────────────────────────────────────────────────────┤
│  const phase = BOARD_MEETING_PHASES[state.currentPhase]            │
│  const director = getDirector(state.activeDirector)                 │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  2. Check for interjection                                          │
├─────────────────────────────────────────────────────────────────────┤
│  For each director (except current):                                │
│    If userMessage contains director.interjectionTriggers:           │
│      40% chance: interjector = that director                        │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  3. Build context prompt                                            │
├─────────────────────────────────────────────────────────────────────┤
│  THE USER'S PROBLEM PORTFOLIO:                                      │
│  1. "Problem A" (appreciating, 40% of time)                        │
│     - What breaks if ignored: ...                                   │
│  2. "Problem B" (depreciating, 35% of time)                        │
│     - What breaks if ignored: ...                                   │
│                                                                     │
│  You are in phase "Last Quarter Review"...                         │
│  The user just said: "..."                                          │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  4. Call Anthropic API (with streaming)                             │
├─────────────────────────────────────────────────────────────────────┤
│  client.messages.create({                                           │
│    model: 'claude-sonnet-4-20250514',                               │
│    system: director.systemPrompt,                                   │
│    messages: conversationHistory + contextPrompt + userMessage,     │
│    stream: true                                                     │
│  })                                                                 │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  5. Update state and return                                         │
├─────────────────────────────────────────────────────────────────────┤
│  - Add messages to history                                          │
│  - Advance phase if enough exchanges                                │
│  - Return { response, director, newState }                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Authentication Architecture

### NextAuth Flow (Credentials + OAuth)

```
┌──────────────────────────────────────────────────────────────────┐
│                       Login Flow                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Option A: Credentials Login                                      │
│  1. User submits login form                                       │
│         │                                                         │
│         ▼                                                         │
│  2. POST /api/auth/callback/credentials                           │
│         │                                                         │
│         ▼                                                         │
│  3. NextAuth calls authorize() in auth.ts                         │
│         │                                                         │
│         ├── Find user by email in database                        │
│         ├── Compare password hash with bcrypt                     │
│         ├── Return user object or null                            │
│                                                                   │
│  Option B: OAuth Login (Google/GitHub)                            │
│  1. User clicks "Sign in with Google/GitHub"                      │
│         │                                                         │
│         ▼                                                         │
│  2. Redirect to OAuth provider                                    │
│         │                                                         │
│         ▼                                                         │
│  3. User authorizes, redirects back                               │
│         │                                                         │
│         ▼                                                         │
│  4. Account linked/created in database                            │
│                                                                   │
│  Both paths:                                                      │
│         │                                                         │
│         ▼                                                         │
│  4. If authorized:                                                │
│         ├── Create JWT with user data                             │
│         ├── Set auth cookie                                       │
│         ├── Redirect to /dashboard                                │
│         │                                                         │
│     If not authorized:                                            │
│         └── Return error, stay on login page                      │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Session Management

```
┌──────────────────────────────────────────────────────────────────┐
│                     Session Check Flow                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Request to protected route (/dashboard)                          │
│         │                                                         │
│         ▼                                                         │
│  Middleware (src/middleware.ts)                                   │
│         │                                                         │
│         ├── Read auth cookie                                      │
│         ├── Verify JWT signature                                  │
│         ├── Check expiration                                      │
│         │                                                         │
│         ├─── Valid ──────▶ Continue to page                       │
│         │                                                         │
│         └─── Invalid ────▶ Redirect to /login                     │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Getting User in Code

```typescript
// In Server Component or API Route:
import { auth } from '@/auth'

const session = await auth()
// session = {
//   user: {
//     id: "clu...",
//     email: "user@example.com",
//     name: "John Doe"
//   },
//   expires: "2024-02-15T..."
// }

const userId = session?.user?.id
```

---

## Database Schema

### Entity Relationship Overview (40+ Models)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              User (Central)                              │
├─────────────────────────────────────────────────────────────────────────┤
│  id, email, password, name, avatarUrl, settings, timezone               │
│  notificationPreferences, notificationEmail, createdAt, updatedAt       │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│    Problem    │          │ BoardSession  │          │      Bet      │
│  (Portfolio)  │          │  (Meetings)   │          │  (Tracking)   │
└───────────────┘          └───────┬───────┘          └───────────────┘
                                   │
                                   ▼
                           ┌───────────────┐
                           │SessionMessage │
                           └───────────────┘
```

### Core Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| User | User accounts | email, password, settings, timezone |
| Problem | Career problems portfolio | name, whatBreaks, classification, timeAllocation |
| BoardRole | AI director configurations | roleType, focusArea, systemPrompt |
| BoardSession | Meeting sessions | sessionType, quarter, status, currentPhase |
| SessionMessage | Chat messages | speaker, content, messageType, metadata |
| QuarterlyReport | Meeting summaries | bets, avoidedDecision, commitments |
| Bet | Falsifiable commitments | content, deadline, outcome, evidence |

### Phase 1: Evidence & Check-ins

| Model | Purpose | Key Fields |
|-------|---------|------------|
| Evidence | Accomplishments vault | title, type, source, impact, date |
| EvidenceAttachment | File uploads | filename, fileType, url, size |
| EvidenceProblemLink | Link to problems | evidenceId, problemId |
| MicroCheckin | Daily reflections | promptId, response, mood |
| CheckinPrompt | Question templates | category, question, frequency |
| CheckinStreak | Streak tracking | currentStreak, longestStreak |

### Phase 2: Decisions & Timeline

| Model | Purpose | Key Fields |
|-------|---------|------------|
| Decision | Decision tracking | title, options, prediction, confidence |
| DecisionOutcome | Actual outcomes | actualOutcome, accuracy, lessonsLearned |
| DecisionTag | Categorization | decisionId, tag |
| TimelineEvent | Career events | type, title, date, importance |
| CareerPhase | Career chapters | title, startDate, endDate, color |
| InflectionPoint | Key moments | impact, beforeState, afterState |

### Phase 3: Feedback & Skills

| Model | Purpose | Key Fields |
|-------|---------|------------|
| FeedbackRequest | 360 requests | title, anonymous, status, expiresAt |
| FeedbackQuestion | Survey questions | question, category, type |
| FeedbackRecipient | Invited reviewers | email, relationship, token |
| FeedbackResponse | Submitted feedback | respondentId, relationship |
| SelfAssessment | Self-ratings | category, area, rating |
| Skill | User skills | name, proficiency, targetLevel |
| SkillGap | Identified gaps | currentLevel, requiredLevel, priority |
| SkillGoal | Learning goals | targetLevel, deadline, progress |
| MarketSkillDemand | Market data | demandLevel, growthTrend, salaryImpact |

### Phase 4: Network & OKRs

| Model | Purpose | Key Fields |
|-------|---------|------------|
| Contact | Network contacts | name, company, relationship, strength |
| Interaction | Contact log | type, date, summary, sentiment |
| NetworkingGoal | Networking goals | targetCount, category, deadline |
| OKRPeriod | OKR timeframes | name, type, startDate, endDate |
| Objective | Objectives | title, category, priority, progress |
| KeyResult | Key results | title, metricType, targetValue, currentValue |
| KeyResultCheckIn | Progress updates | value, previousValue, notes |

### Phase 5: Compensation & Learning

| Model | Purpose | Key Fields |
|-------|---------|------------|
| CompensationRecord | Salary/bonus history | type, amount, effectiveDate |
| EquityGrant | Stock grants | grantType, totalShares, vestingSchedule |
| EquityVesting | Vesting events | vestDate, shares, vested |
| CompensationBenchmark | Market data | role, level, percentile50 |
| LearningResource | Courses/books | title, type, provider, progress |
| Certification | Certifications | name, issuer, earnedAt, expiresAt |
| LearningGoal | Learning objectives | title, targetDate, progress |

### Infrastructure Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| Account | OAuth accounts | provider, providerAccountId, tokens |
| CalendarEvent | Scheduled events | title, type, startTime, reminders |
| Reminder | Notification queue | type, scheduledFor, sent |
| UserContext | Uploaded context | type, name, rawText, summary |
| Team | Accountability groups | name, description |
| TeamMember | Group membership | role, joinedAt |
| TeamInvite | Pending invites | email, status |
| PeerFeedback | Team feedback | type, content |

---

## Feature Modules

### Phase 1: Evidence Vault & Micro Check-ins

```
Evidence Vault                              Micro Check-ins
├── /api/evidence                          ├── /api/checkins
│   ├── GET    - List evidence             │   ├── GET    - List check-ins
│   └── POST   - Add evidence              │   └── POST   - Submit check-in
├── /api/evidence/[id]                     ├── /api/checkins/today
│   ├── GET    - Get one                   │   └── GET    - Today's prompts
│   ├── PUT    - Update                    ├── /api/checkins/streak
│   └── DELETE - Remove                    │   └── GET    - Streak stats
└── /api/evidence/summary                  └── /api/checkins/insights
    └── GET    - Analytics                     └── GET    - Patterns

Components:                                 Components:
├── EvidenceList                           ├── CheckinCard
├── EvidenceForm                           ├── StreakDisplay
├── EvidenceDetail                         ├── MoodTracker
└── AttachmentUpload                       └── InsightsChart
```

### Phase 2: Decision Journal & Career Timeline

```
Decision Journal                           Career Timeline
├── /api/decisions                         ├── /api/timeline
│   ├── GET    - List decisions            │   ├── GET    - Events list
│   └── POST   - Log decision              │   └── POST   - Add event
├── /api/decisions/[id]                    ├── /api/timeline/[id]
│   ├── GET    - Get one                   │   ├── GET    - Get event
│   ├── PUT    - Update                    │   └── PUT    - Update
│   └── DELETE - Remove                    ├── /api/timeline/full
├── /api/decisions/[id]/outcome            │   └── GET    - Full timeline
│   └── POST   - Record outcome            └── /api/timeline/inflection-points
├── /api/decisions/review                      └── POST   - Mark inflection
│   └── GET    - Due for review
└── /api/decisions/analytics               Components:
    └── GET    - Accuracy stats            ├── TimelineView
                                           ├── EventCard
Components:                                ├── PhaseEditor
├── DecisionForm                           └── InflectionMarker
├── DecisionList
├── OutcomeRecorder
└── AccuracyChart
```

### Phase 3: 360° Feedback & Skills Gap

```
360° Feedback                              Skills Gap Analyzer
├── /api/feedback                          ├── /api/skills
│   ├── GET    - List requests             │   ├── GET    - List skills
│   └── POST   - Create request            │   └── POST   - Add skill
├── /api/feedback/[id]                     ├── /api/skills/[id]
│   └── GET    - Request details           │   ├── PUT    - Update
├── /api/feedback/[id]/results             │   └── DELETE - Remove
│   └── GET    - Aggregated results        ├── /api/skills/analyze
├── /api/feedback/respond                  │   └── POST   - Run analysis
│   └── POST   - Submit feedback           ├── /api/skills/gaps
└── /api/feedback/self-assessment          │   └── GET    - Gap report
    ├── GET    - Get self-ratings          ├── /api/skills/goals
    └── POST   - Submit ratings            │   ├── GET/POST - Goals
                                           └── /api/skills/analytics
Components:                                    └── GET    - Insights
├── FeedbackRequestForm
├── FeedbackSurvey                         Components:
├── ResultsAggregation                     ├── SkillsMatrix
├── BlindSpotAnalysis                      ├── GapChart
└── SelfAssessmentForm                     ├── MarketDemandView
                                           └── GoalTracker
```

### Phase 4: Mentor Network & Career OKRs

```
Mentor Network                             Career OKRs
├── /api/network/contacts                  ├── /api/okrs/periods
│   ├── GET    - List contacts             │   ├── GET    - List periods
│   └── POST   - Add contact               │   └── POST   - Create period
├── /api/network/contacts/[id]             ├── /api/okrs/periods/[id]
│   ├── PUT    - Update                    │   ├── PUT    - Update
│   └── DELETE - Remove                    │   └── DELETE - Remove
├── /api/network/interactions              ├── /api/okrs/objectives
│   ├── GET    - List interactions         │   ├── GET    - List objectives
│   └── POST   - Log interaction           │   └── POST   - Create
├── /api/network/follow-ups                ├── /api/okrs/key-results
│   └── GET    - Due follow-ups            │   ├── GET/POST - Key results
├── /api/network/goals                     ├── /api/okrs/key-results/[id]
│   └── GET/POST - Network goals           │   └── PUT    - Update progress
└── /api/network/analytics                 └── /api/okrs/analytics
    └── GET    - Network health                └── GET    - OKR insights

Components:                                Components:
├── ContactList                            ├── PeriodSelector
├── ContactDetail                          ├── ObjectiveCard
├── InteractionLog                         ├── KeyResultProgress
├── RelationshipMap                        └── OKRDashboard
└── FollowUpReminders
```

### Phase 5: Compensation & Learning

```
Compensation Tracker                       Learning Path
├── /api/compensation/records              ├── /api/learning/resources
│   ├── GET    - History                   │   ├── GET    - List resources
│   └── POST   - Add record                │   └── POST   - Add resource
├── /api/compensation/records/[id]         ├── /api/learning/resources/[id]
│   ├── PUT    - Update                    │   ├── PUT    - Update progress
│   └── DELETE - Remove                    │   └── DELETE - Remove
├── /api/compensation/equity               ├── /api/learning/certifications
│   ├── GET    - List grants               │   ├── GET    - List certs
│   └── POST   - Add grant                 │   └── POST   - Add cert
├── /api/compensation/equity/[id]          ├── /api/learning/certifications/[id]
│   └── PUT    - Update                    │   └── PUT    - Update
├── /api/compensation/vestings             ├── /api/learning/goals
│   └── GET    - Vesting schedule          │   └── GET/POST - Goals
└── /api/compensation/analytics            └── /api/learning/analytics
    └── GET    - Total comp                    └── GET    - Learning stats

Components:                                Components:
├── CompensationHistory                    ├── ResourceList
├── EquityGrants                           ├── CertificationTracker
├── VestingSchedule                        ├── LearningGoals
├── BenchmarkComparison                    ├── ProgressChart
└── TotalCompChart                         └── ExpiryAlerts
```

---

## File Organization

### Detailed File Map

```
my-career-board/
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── (auth)/                       # Auth route group
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   │
│   │   ├── (dashboard)/                  # Protected route group
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── audit/page.tsx
│   │   │   ├── board/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [sessionId]/page.tsx
│   │   │   ├── portfolio/
│   │   │   │   ├── page.tsx
│   │   │   │   └── setup/page.tsx
│   │   │   ├── history/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [sessionId]/page.tsx
│   │   │   └── settings/page.tsx
│   │   │
│   │   ├── api/                          # API Routes (20+ modules)
│   │   │   ├── auth/                     # Authentication
│   │   │   ├── analytics/                # Analytics & insights
│   │   │   ├── bets/                     # Bet tracking
│   │   │   ├── board/                    # Board sessions
│   │   │   ├── calendar/                 # Calendar events
│   │   │   ├── checkins/                 # Micro check-ins
│   │   │   ├── compensation/             # Comp tracking
│   │   │   ├── context/                  # User context
│   │   │   ├── cron/                     # Scheduled jobs
│   │   │   ├── decisions/                # Decision journal
│   │   │   ├── evidence/                 # Evidence vault
│   │   │   ├── export/                   # PDF/CSV export
│   │   │   ├── feedback/                 # 360 feedback
│   │   │   ├── learning/                 # Learning path
│   │   │   ├── network/                  # Mentor network
│   │   │   ├── notifications/            # Notification prefs
│   │   │   ├── oauth/                    # OAuth providers
│   │   │   ├── okrs/                     # Career OKRs
│   │   │   ├── portfolio/                # Problem portfolio
│   │   │   ├── sessions/                 # Audit sessions
│   │   │   ├── skills/                   # Skills gap
│   │   │   ├── teams/                    # Team collaboration
│   │   │   └── timeline/                 # Career timeline
│   │   │
│   │   ├── layout.tsx                    # Root layout
│   │   ├── page.tsx                      # Landing page
│   │   └── globals.css                   # Global styles
│   │
│   ├── components/
│   │   ├── ui/                           # shadcn/ui components
│   │   ├── audit/                        # Audit components
│   │   ├── bets/                         # Bet tracking
│   │   ├── charts/                       # Data visualization
│   │   ├── compensation/                 # Compensation UI
│   │   ├── feedback360/                  # 360 feedback UI
│   │   ├── learning/                     # Learning path UI
│   │   ├── mobile/                       # Mobile responsive
│   │   └── shared/                       # Shared components
│   │
│   ├── lib/
│   │   ├── audit/questions.ts            # Audit questions
│   │   ├── board/phases.ts               # Meeting phases (CLIENT-SAFE)
│   │   ├── directors/personas.ts         # Director definitions
│   │   ├── insights/patterns.ts          # Pattern detection
│   │   ├── llm/
│   │   │   ├── providers/anthropic.ts    # Claude API client
│   │   │   └── orchestrator.ts           # Board orchestration (SERVER)
│   │   ├── prisma/client.ts              # Prisma singleton
│   │   ├── streaming/                    # Real-time streaming
│   │   └── utils.ts                      # Utility functions
│   │
│   ├── __tests__/                        # Test suites (897 tests)
│   │   ├── api/                          # API route tests
│   │   └── components/                   # Component tests
│   │
│   ├── auth.ts                           # NextAuth configuration
│   └── middleware.ts                     # Route protection
│
├── prisma/
│   ├── schema.prisma                     # Database schema (40+ models)
│   └── dev.db                            # SQLite database
│
├── docs/                                 # Documentation
├── public/                               # Static assets
├── .env.local                            # Environment variables
├── package.json                          # Dependencies
├── tsconfig.json                         # TypeScript config
├── tailwind.config.ts                    # Tailwind config
├── jest.config.js                        # Jest config
├── CLAUDE.md                             # AI assistant context
└── README.md                             # Project readme
```

---

## Key Design Decisions

### 1. Client/Server Separation for LLM

**Decision:** Separate `phases.ts` (client-safe) from `orchestrator.ts` (server-only)

**Why:** Anthropic SDK cannot run in browser - it would expose API keys.

**Implementation:**
```typescript
// Client component can import
import { BOARD_MEETING_PHASES } from '@/lib/board/phases'

// Client component CANNOT import
import { generateBoardResponse } from '@/lib/llm/orchestrator'  // Contains Anthropic
```

### 2. SQLite Instead of PostgreSQL

**Decision:** Use SQLite with Prisma instead of external database

**Why:**
- Simpler setup (no external account needed)
- Works offline
- Faster for development
- Easy to reset

**Trade-off:** Not suitable for multi-user production without migration.

### 3. JWT Sessions Instead of Database Sessions

**Decision:** Use JWT-based sessions in NextAuth

**Why:**
- No session table needed in database
- Stateless - easier to scale
- Simpler implementation

**Trade-off:** Cannot revoke sessions (user has to wait for expiration).

### 4. Streaming Responses

**Decision:** Implement SSE streaming for AI responses

**Why:**
- Better UX - see text as it's generated
- Feels more responsive
- Matches modern AI chat experiences

**Implementation:** `/api/board/[sessionId]/stream` endpoint with Server-Sent Events.

### 5. Test-Driven Development

**Decision:** Use TDD (Red-Green-Refactor) for all features

**Why:**
- Ensures comprehensive coverage (897 tests)
- Catches regressions early
- Documents expected behavior
- Enables confident refactoring

### 6. Feature Module Pattern

**Decision:** Organize code by feature domain, not by type

**Why:**
- Related code stays together
- Easier to understand feature scope
- Independent deployment possible
- Clear ownership boundaries

---

## Extending the System

### Adding a New Feature Module

1. **Add database models:**
   ```prisma
   // prisma/schema.prisma
   model NewFeature {
     id        String   @id @default(cuid())
     userId    String
     // ... fields
     user User @relation(fields: [userId], references: [id])
   }
   ```

2. **Push database changes:**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

3. **Create API routes:**
   ```
   src/app/api/new-feature/
   ├── route.ts           # GET list, POST create
   └── [id]/
       └── route.ts       # GET one, PUT update, DELETE
   ```

4. **Write tests first (TDD):**
   ```
   src/__tests__/api/new-feature/
   └── route.test.ts
   ```

5. **Create components:**
   ```
   src/components/new-feature/
   ├── FeatureList.tsx
   ├── FeatureForm.tsx
   └── index.ts
   ```

6. **Add to navigation**

7. **Update documentation**

### Adding a New Director

1. **Edit `src/lib/directors/personas.ts`:**
   ```typescript
   {
     id: 'new_director',
     name: 'The New Director',
     title: 'Chief Something Officer',
     avatar: '...',
     color: 'color',
     systemPrompt: `You are The New Director. You...`,
     interjectionTriggers: ['trigger', 'words'],
   }
   ```

2. **Optionally add to phases in `src/lib/board/phases.ts`**

3. **No other changes needed** - orchestrator automatically uses new director.

---

This architecture is designed to be:
- **Understandable** - Clear separation of concerns
- **Extensible** - Easy to add features
- **Maintainable** - Well-organized file structure
- **Secure** - API keys never exposed to client
- **Testable** - 897 tests ensure reliability
