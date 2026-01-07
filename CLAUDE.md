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
| Auth | NextAuth.js v5 (beta) | Credentials-based authentication |
| AI | Anthropic Claude API | Director responses and specificity gates |
| Language | TypeScript | Type-safe JavaScript |

## Project Structure

```
pcgs/
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
│   ├── components/               # React components
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── audit/                # Audit-specific components
│   │   └── shared/               # Shared components
│   ├── lib/                      # Core logic
│   │   ├── audit/                # Audit questions and gates
│   │   ├── board/                # Board meeting phases (client-safe)
│   │   ├── directors/            # AI director personas
│   │   ├── insights/             # Pattern detection
│   │   ├── llm/                  # LLM integration (server-only)
│   │   │   ├── providers/        # Anthropic client
│   │   │   └── orchestrator.ts   # Board meeting orchestration
│   │   └── prisma/               # Database client
│   └── auth.ts                   # NextAuth configuration
├── prisma/
│   └── schema.prisma             # Database schema
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

## Important Files

| File | Purpose |
|------|---------|
| `src/lib/directors/personas.ts` | AI director definitions and system prompts |
| `src/lib/llm/orchestrator.ts` | Board meeting AI orchestration (SERVER ONLY) |
| `src/lib/board/phases.ts` | Meeting phase definitions (client-safe) |
| `src/lib/audit/questions.ts` | Quick audit questions |
| `src/lib/llm/providers/anthropic.ts` | Claude API integration |
| `prisma/schema.prisma` | Database models |
| `src/auth.ts` | Authentication configuration |

## Critical Architecture Decisions

### Client/Server Separation
- **`src/lib/board/phases.ts`**: Static data, safe for client components
- **`src/lib/llm/orchestrator.ts`**: Contains Anthropic SDK, SERVER-ONLY
- Never import from `orchestrator.ts` in `'use client'` components

### Authentication Flow
- Uses NextAuth.js v5 with credentials provider
- Passwords hashed with bcryptjs
- JWT-based sessions (no database sessions)
- Protected routes via middleware

### Database
- SQLite for local development (no external database needed)
- Prisma ORM for type-safe queries
- Schema includes: User, Problem, BoardSession, SessionMessage

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

## Environment Variables

```env
# Required
AUTH_SECRET=your-secret-key-min-32-chars
ANTHROPIC_API_KEY=sk-ant-...

# Optional
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
```

## Testing Checklist

- [ ] User can sign up and log in
- [ ] User can create 3+ problems in portfolio
- [ ] User can start and complete a quick audit
- [ ] User can enter board room and chat with directors
- [ ] Directors reference portfolio problems by name
- [ ] Session history shows past meetings
- [ ] Pattern detection identifies recurring themes

## Code Style

- TypeScript strict mode
- Functional components with hooks
- Server components by default, `'use client'` only when needed
- Tailwind CSS for styling
- Error handling with try/catch in API routes

## Known Limitations

1. SQLite doesn't support concurrent writes well (fine for single-user)
2. No email verification (simplified auth)
3. No password reset flow
4. No real-time streaming for director responses (uses polling)

## Future Improvements

- Add streaming responses for better UX
- Implement OAuth providers (Google, GitHub)
- Add export functionality (PDF reports)
- Implement bet tracking and accuracy metrics
- Add calendar integration for meeting reminders
