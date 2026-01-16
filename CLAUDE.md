# CLAUDE.md - AI Assistant Context for my-career-board

This file provides context for Claude Code and other AI assistants working on the my-career-board (Personal Career Governance System) codebase.

## Project Overview

my-career-board is a Next.js web application that provides AI-powered career accountability through a "personal board of directors" concept. Users define career problems they're solving, and AI directors (powered by Anthropic's Claude) conduct quarterly reviews and audits to keep users accountable.

**Inspired by:** Nate Jones' "AI Board of Directors" concept:
- YouTube: ["Most People Want Validation, Not Perspective"](https://www.youtube.com/watch?v=BaC5FEN2e4Y)
- Substack: ["My honest field notes on being my own unreliable narrator"](https://natesnewsletter.substack.com/p/the-rarest-thing-in-work-why-360)

**Built with AI assistance:**
- Code & Documentation: Claude Code + Claude Opus 4.5
- PRD Brainstorming: Gemini 3.0
- MVP Specification: Claude Code AskUserQuestions tool

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 16 (App Router) | React framework with server components |
| UI | Tailwind CSS + shadcn/ui | Styling and component library |
| Database | SQLite + Prisma ORM | Local-first data persistence |
| Auth | NextAuth.js v5 (beta) | Credentials + OAuth authentication |
| AI | Anthropic Claude API | Director responses and specificity gates |
| Testing | Jest + React Testing Library | Unit and integration tests (897 tests) |
| Language | TypeScript | Type-safe JavaScript |

## Project Structure

```
my-career-board/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── (auth)/               # Auth pages (login, signup)
│   │   ├── (dashboard)/          # Protected dashboard pages
│   │   │   ├── audit/            # Quick audit flow
│   │   │   ├── board/            # Board meeting room
│   │   │   ├── dashboard/        # Main dashboard
│   │   │   ├── history/          # Session history
│   │   │   ├── portfolio/        # Problem portfolio
│   │   │   └── settings/         # User settings
│   │   └── api/                  # API routes (server-side)
│   │       ├── auth/             # Authentication endpoints
│   │       ├── analytics/        # Analytics & bet analytics
│   │       ├── bets/             # Bet tracking & resolution
│   │       ├── board/            # Board sessions & streaming
│   │       ├── calendar/         # Calendar events & export
│   │       ├── checkins/         # Micro check-ins & streaks
│   │       ├── compensation/     # Salary, equity & benchmarks
│   │       ├── context/          # User context uploads
│   │       ├── cron/             # Scheduled reminders
│   │       ├── decisions/        # Decision journal & outcomes
│   │       ├── evidence/         # Evidence vault
│   │       ├── export/           # PDF/CSV export
│   │       ├── feedback/         # 360° feedback
│   │       ├── learning/         # Learning resources & certs
│   │       ├── network/          # Mentor network & contacts
│   │       ├── notifications/    # Notification preferences
│   │       ├── oauth/            # OAuth providers & accounts
│   │       ├── okrs/             # OKR periods & objectives
│   │       ├── portfolio/        # Problem portfolio
│   │       ├── sessions/         # Audit sessions
│   │       ├── skills/           # Skills & gap analysis
│   │       ├── teams/            # Team collaboration
│   │       └── timeline/         # Career timeline
│   ├── components/               # React components
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── audit/                # Audit-specific components
│   │   ├── bets/                 # Bet tracking components
│   │   ├── charts/               # Data visualization
│   │   ├── compensation/         # Compensation tracker UI
│   │   ├── feedback360/          # 360° feedback UI
│   │   ├── learning/             # Learning path UI
│   │   ├── mobile/               # Mobile-responsive components
│   │   └── shared/               # Shared components
│   ├── lib/                      # Core logic
│   │   ├── audit/                # Audit questions and gates
│   │   ├── board/                # Board meeting phases (client-safe)
│   │   ├── directors/            # AI director personas
│   │   ├── insights/             # Pattern detection
│   │   ├── llm/                  # LLM integration (server-only)
│   │   │   ├── providers/        # Anthropic client
│   │   │   └── orchestrator.ts   # Board meeting orchestration
│   │   ├── prisma/               # Database client
│   │   └── streaming/            # Real-time streaming utilities
│   ├── __tests__/                # Test suites (897 tests)
│   │   ├── api/                  # API route tests
│   │   └── components/           # Component tests
│   └── auth.ts                   # NextAuth configuration
├── prisma/
│   └── schema.prisma             # Database schema (40+ models)
├── docs/                         # Documentation
└── public/                       # Static assets
```

## Key Concepts

### 1. Problem Portfolio
Users define 3-5 career problems they're "paid to solve". Each problem has:
- **Name**: Short identifier
- **What breaks**: Consequences if ignored
- **Classification**: Appreciating/Depreciating/Stable (based on AI impact)
- **Time allocation**: Percentage of work time spent

### 2. AI Directors (5 personas)
Each director has a unique perspective:
- **Accountability Hawk** (🦅): Tracks commitments, demands evidence
- **Market Reality Skeptic** (📊): Questions market value, spots depreciation
- **Avoidance Hunter** (🎯): Surfaces avoided decisions/conversations
- **The Strategist** (♟️): Long-term thinking, opportunity cost
- **Devil's Advocate** (😈): Stress-tests reasoning, finds flaws

### 3. Board Meeting Phases (6 phases)
1. Opening - Set context
2. Last Quarter Review - Review commitments
3. Avoidance Audit - Surface avoided issues
4. Market Check - Assess market position
5. Strategy Review - Long-term trajectory
6. Next Quarter Bets - Set falsifiable commitments

### 4. Quick Audit
15-minute accountability check with specificity gates that challenge vague answers.

## Feature Modules (5 Phases Implemented)

### Phase 1: Evidence Vault & Micro Check-ins
- **Evidence Vault**: Document accomplishments, wins, feedback, and artifacts
  - API: `/api/evidence`, `/api/evidence/[id]`, `/api/evidence/summary`
  - Models: Evidence, EvidenceAttachment, EvidenceProblemLink
- **Micro Check-ins**: Lightweight daily/weekly reflection prompts with streak tracking
  - API: `/api/checkins`, `/api/checkins/streak`, `/api/checkins/insights`
  - Models: MicroCheckin, CheckinPrompt, CheckinStreak

### Phase 2: Decision Journal & Career Timeline
- **Decision Journal**: Track decisions, predictions, and outcomes
  - API: `/api/decisions`, `/api/decisions/[id]/outcome`, `/api/decisions/analytics`
  - Models: Decision, DecisionOutcome, DecisionTag
- **Career Timeline**: Visualize career events and inflection points
  - API: `/api/timeline`, `/api/timeline/inflection-points`, `/api/timeline/full`
  - Models: TimelineEvent, CareerPhase, InflectionPoint

### Phase 3: 360° Feedback & Skills Gap Analyzer
- **360° Feedback**: Request and aggregate multi-rater feedback
  - API: `/api/feedback`, `/api/feedback/respond`, `/api/feedback/[id]/results`
  - Models: FeedbackRequest, FeedbackQuestion, FeedbackRecipient, FeedbackResponse, SelfAssessment
- **Skills Gap Analyzer**: Track skills, proficiency, and market demand
  - API: `/api/skills`, `/api/skills/analyze`, `/api/skills/gaps`
  - Models: Skill, MarketSkillDemand, SkillGap, SkillGoal

### Phase 4: Mentor Network & Career OKRs
- **Mentor Network**: CRM for professional relationships and interactions
  - API: `/api/network/contacts`, `/api/network/interactions`, `/api/network/analytics`
  - Models: Contact, Interaction, NetworkingGoal
- **Career OKRs**: Objectives and Key Results with check-ins
  - API: `/api/okrs/periods`, `/api/okrs/objectives`, `/api/okrs/key-results`
  - Models: OKRPeriod, Objective, KeyResult, KeyResultCheckIn

### Phase 5: Compensation Tracker & Learning Path
- **Compensation Tracker**: Salary history, equity grants, and benchmarks
  - API: `/api/compensation/records`, `/api/compensation/equity`, `/api/compensation/analytics`
  - Models: CompensationRecord, EquityGrant, EquityVesting, CompensationBenchmark
- **Learning Path**: Track courses, certifications, and learning goals
  - API: `/api/learning/resources`, `/api/learning/certifications`, `/api/learning/goals`
  - Models: LearningResource, Certification, LearningGoal

## Database Schema (40+ Models)

### Core Models
- `User` - User accounts with settings and timezone
- `Problem` - Career problems in portfolio
- `BoardRole` - AI director configurations
- `BoardSession` - Board meeting sessions
- `SessionMessage` - Chat messages in sessions
- `QuarterlyReport` - Meeting summaries

### Bet Tracking
- `Bet` - Falsifiable commitments with deadlines

### Collaboration
- `Team`, `TeamMember`, `TeamInvite` - Accountability groups
- `PeerFeedback` - Team member feedback

### Infrastructure
- `Account` - OAuth provider accounts
- `CalendarEvent` - Scheduled meetings
- `Reminder` - Notification scheduling
- `UserContext` - Resume/LinkedIn uploads

### Phase 1-5 Models
See prisma/schema.prisma for complete 40+ model definitions including:
- Evidence, MicroCheckin, CheckinStreak
- Decision, DecisionOutcome, TimelineEvent, CareerPhase
- FeedbackRequest, FeedbackResponse, Skill, SkillGap
- Contact, Interaction, OKRPeriod, Objective, KeyResult
- CompensationRecord, EquityGrant, LearningResource, Certification

## Important Files

| File | Purpose |
|------|---------|
| `src/lib/directors/personas.ts` | AI director definitions and system prompts |
| `src/lib/llm/orchestrator.ts` | Board meeting AI orchestration (SERVER ONLY) |
| `src/lib/board/phases.ts` | Meeting phase definitions (client-safe) |
| `src/lib/audit/questions.ts` | Quick audit questions |
| `src/lib/llm/providers/anthropic.ts` | Claude API integration |
| `prisma/schema.prisma` | Database models (40+ models) |
| `src/auth.ts` | Authentication configuration |
| `src/lib/streaming/` | Real-time response streaming |

## Critical Architecture Decisions

### Client/Server Separation
- **`src/lib/board/phases.ts`**: Static data, safe for client components
- **`src/lib/llm/orchestrator.ts`**: Contains Anthropic SDK, SERVER-ONLY
- Never import from `orchestrator.ts` in `'use client'` components

### Authentication Flow
- Uses NextAuth.js v5 with credentials provider
- OAuth providers supported (Google, GitHub)
- Passwords hashed with bcryptjs
- JWT-based sessions (no database sessions)
- Protected routes via middleware

### Database
- SQLite for local development (no external database needed)
- Prisma ORM for type-safe queries
- 40+ models across core and feature modules

### Testing Strategy
- TDD (Test-Driven Development) with Red-Green-Refactor cycle
- 897 tests across all features
- Jest + React Testing Library
- API route tests with mocked Prisma client

## Common Tasks

### Adding a New Director
1. Add persona to `src/lib/directors/personas.ts`
2. Define: id, name, title, avatar, color, systemPrompt, interjectionTriggers
3. Optionally add to phase leadership in `src/lib/board/phases.ts`

### Adding a New Audit Question
1. Edit `src/lib/audit/questions.ts`
2. Add question with id, question text, category, gate configuration

### Adding a New Board Phase
1. Edit `src/lib/board/phases.ts`
2. Add phase with id, name, description, leadDirector, questions

### Modifying Database Schema
1. Edit `prisma/schema.prisma`
2. Run: `npx prisma db push` (development)
3. Run: `npx prisma generate` (regenerate client)

### Adding a New Feature Module
1. Create models in `prisma/schema.prisma`
2. Create API routes in `src/app/api/[feature]/`
3. Create components in `src/components/[feature]/`
4. Write tests in `src/__tests__/`
5. Update documentation

## Environment Variables

```env
# Required
AUTH_SECRET=your-secret-key-min-32-chars
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL="file:./dev.db"

# Optional - OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Optional - Other LLM
OPENAI_API_KEY=sk-...
```

## Running the Project

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Start development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## Testing Checklist

### Core Features
- [ ] User can sign up and log in
- [ ] User can create 3+ problems in portfolio
- [ ] User can start and complete a quick audit
- [ ] User can enter board room and chat with directors
- [ ] Directors reference portfolio problems by name
- [ ] Session history shows past meetings
- [ ] Pattern detection identifies recurring themes

### Phase 1: Evidence & Check-ins
- [ ] User can add evidence items with attachments
- [ ] User can complete daily check-ins
- [ ] Streak tracking updates correctly
- [ ] Evidence links to portfolio problems

### Phase 2: Decisions & Timeline
- [ ] User can log decisions with options
- [ ] User can record decision outcomes
- [ ] Timeline displays career events
- [ ] Inflection points are marked

### Phase 3: Feedback & Skills
- [ ] User can create feedback requests
- [ ] Anonymous feedback submission works
- [ ] Skills gap analysis generates insights
- [ ] Market demand data displays

### Phase 4: Network & OKRs
- [ ] User can add contacts with interactions
- [ ] Follow-up reminders work
- [ ] OKR periods with objectives and key results
- [ ] Progress tracking updates correctly

### Phase 5: Compensation & Learning
- [ ] Salary and bonus records tracked
- [ ] Equity grants with vesting schedules
- [ ] Learning resources with progress
- [ ] Certification expiry alerts

## Code Style

- TypeScript strict mode
- Functional components with hooks
- Server components by default, `'use client'` only when needed
- Tailwind CSS for styling
- Error handling with try/catch in API routes
- TDD with comprehensive test coverage

## Known Limitations

1. SQLite doesn't support concurrent writes well (fine for single-user)
2. No email verification (simplified auth)
3. No password reset flow
4. Market demand data is static (no live API integration)

## Completed Features (Previously "Future Improvements")

All originally planned improvements have been implemented:

- ✅ **Streaming responses**: Real-time director responses via `/api/board/[sessionId]/stream`
- ✅ **OAuth providers**: Google and GitHub authentication
- ✅ **Export functionality**: PDF/CSV export via `/api/export/`
- ✅ **Bet tracking**: Full bet lifecycle with accuracy metrics
- ✅ **Calendar integration**: Events and reminders via `/api/calendar/`

## Additional Resources

- [Architecture Documentation](./docs/ARCHITECTURE.md)
- [Developer Guide](./docs/DEVELOPER_GUIDE.md)
- [User Guide](./docs/USER_GUIDE.md)
- [Feature Enhancements](./docs/FEATURE_ENHANCEMENTS.md)
- [Quick Start Guide](./docs/QUICK_START.md)
