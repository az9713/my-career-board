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
8. [File Organization](#file-organization)
9. [Key Design Decisions](#key-design-decisions)
10. [Extending the System](#extending-the-system)

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
│  │                       API Routes                                 │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │   │
│  │  │  /api/auth  │  │ /api/board  │  │  /api/portfolio         │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │   │
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
│  │  Users            │  │               │  │  Claude LLM           │  │
│  │  Problems         │  │               │  │  (claude-sonnet-4)    │  │
│  │  BoardSessions    │  │               │  └───────────────────────┘  │
│  │  SessionMessages  │  │               └─────────────────────────────┘
│  └───────────────────┘  │
│      prisma/dev.db      │
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

### API Request Flow (Board Message)

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
5. Anthropic API called
        │
        ├── messages.create()
        ├── Waits for response
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
│           └── HistoryPage (Server)
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

### Board Meeting Message Flow

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
│  3. POST to /api/board/{sessionId}/message                          │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ API processes
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Server:                                                             │
│  1. Verify auth                                                      │
│  2. Load session + messages + portfolio                              │
│  3. Build orchestrator state                                         │
│  4. Call Anthropic API with full context                             │
│  5. Store user message + director response                           │
│  6. Return { response, director, currentPhase }                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Response received
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Client:                                                             │
│  1. Add director message to local state                              │
│  2. Update currentPhase if changed                                   │
│  3. Set isSending = false                                            │
│  4. Scroll to bottom                                                 │
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
│  4. Call Anthropic API                                              │
├─────────────────────────────────────────────────────────────────────┤
│  client.messages.create({                                           │
│    model: 'claude-sonnet-4-20250514',                               │
│    system: director.systemPrompt,                                   │
│    messages: conversationHistory + contextPrompt + userMessage      │
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

### NextAuth Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                       Login Flow                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
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

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                           User                                   │
├─────────────────────────────────────────────────────────────────┤
│  id          String    @id @default(cuid())                     │
│  email       String    @unique                                   │
│  password    String                                              │
│  name        String?                                             │
│  avatarUrl   String?                                             │
│  settings    String?   (JSON as string)                          │
│  createdAt   DateTime                                            │
│  updatedAt   DateTime                                            │
├─────────────────────────────────────────────────────────────────┤
│  problems       Problem[]                                        │
│  boardSessions  BoardSession[]                                   │
└─────────────────────────────────────────────────────────────────┘
           │                              │
           │ 1:N                          │ 1:N
           ▼                              ▼
┌─────────────────────────┐    ┌─────────────────────────────────┐
│        Problem          │    │         BoardSession            │
├─────────────────────────┤    ├─────────────────────────────────┤
│  id                     │    │  id                             │
│  userId                 │    │  userId                         │
│  name                   │    │  sessionType                    │
│  whatBreaks             │    │  quarter                        │
│  classification         │    │  status                         │
│  classificationReasoning│    │  currentPhase                   │
│  timeAllocation         │    │  startedAt                      │
│  createdAt              │    │  completedAt                    │
│  updatedAt              │    ├─────────────────────────────────┤
├─────────────────────────┤    │  messages  SessionMessage[]     │
│  user  User             │    │  user      User                 │
└─────────────────────────┘    └─────────────────────────────────┘
                                          │
                                          │ 1:N
                                          ▼
                               ┌─────────────────────────────────┐
                               │       SessionMessage            │
                               ├─────────────────────────────────┤
                               │  id                             │
                               │  sessionId                      │
                               │  speaker     (user/director id) │
                               │  content                        │
                               │  messageType                    │
                               │  metadata    (JSON string)      │
                               │  createdAt                      │
                               ├─────────────────────────────────┤
                               │  session  BoardSession          │
                               └─────────────────────────────────┘
```

---

## File Organization

### Detailed File Map

```
my-career-board/
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── (auth)/                       # Auth route group
│   │   │   ├── login/
│   │   │   │   └── page.tsx              # Login page UI
│   │   │   └── signup/
│   │   │       └── page.tsx              # Signup page UI
│   │   │
│   │   ├── (dashboard)/                  # Protected route group
│   │   │   ├── layout.tsx                # Dashboard layout wrapper
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx              # Main dashboard (server)
│   │   │   ├── audit/
│   │   │   │   └── page.tsx              # Audit chat (client)
│   │   │   ├── board/
│   │   │   │   ├── page.tsx              # Board selection (server)
│   │   │   │   └── [sessionId]/
│   │   │   │       └── page.tsx          # Board chat (client)
│   │   │   ├── portfolio/
│   │   │   │   ├── page.tsx              # Portfolio view (server)
│   │   │   │   └── setup/
│   │   │   │       └── page.tsx          # Setup wizard (client)
│   │   │   ├── history/
│   │   │   │   ├── page.tsx              # Session list (server)
│   │   │   │   └── [sessionId]/
│   │   │   │       └── page.tsx          # Session detail (server)
│   │   │   └── settings/
│   │   │       └── page.tsx              # Settings page (server)
│   │   │
│   │   ├── api/                          # API Routes
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/
│   │   │   │   │   └── route.ts          # NextAuth handler
│   │   │   │   └── signup/
│   │   │   │       └── route.ts          # User registration
│   │   │   ├── portfolio/
│   │   │   │   ├── route.ts              # GET portfolio
│   │   │   │   └── problems/
│   │   │   │       └── route.ts          # POST new problem
│   │   │   ├── board/
│   │   │   │   ├── route.ts              # POST create session
│   │   │   │   └── [sessionId]/
│   │   │   │       └── message/
│   │   │   │           └── route.ts      # POST send message
│   │   │   ├── sessions/
│   │   │   │   └── [sessionId]/
│   │   │   │       └── route.ts          # GET session data
│   │   │   └── audit/
│   │   │       ├── route.ts              # POST create audit
│   │   │       └── [sessionId]/
│   │   │           └── message/
│   │   │               └── route.ts      # POST audit message
│   │   │
│   │   ├── layout.tsx                    # Root layout
│   │   ├── page.tsx                      # Landing page
│   │   └── globals.css                   # Global styles
│   │
│   ├── components/
│   │   ├── ui/                           # shadcn/ui (don't edit)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── audit/
│   │   │   ├── AuditChat.tsx             # Audit chat interface
│   │   │   └── SpecificityGate.tsx       # Gate challenge UI
│   │   └── shared/
│   │       └── LoadingSpinner.tsx        # Shared loading component
│   │
│   ├── lib/
│   │   ├── audit/
│   │   │   └── questions.ts              # Audit question definitions
│   │   ├── board/
│   │   │   └── phases.ts                 # Meeting phases (CLIENT-SAFE)
│   │   ├── directors/
│   │   │   └── personas.ts               # Director definitions
│   │   ├── insights/
│   │   │   └── patterns.ts               # Pattern detection logic
│   │   ├── llm/
│   │   │   ├── providers/
│   │   │   │   └── anthropic.ts          # Claude API client
│   │   │   └── orchestrator.ts           # Board orchestration (SERVER)
│   │   ├── prisma/
│   │   │   └── client.ts                 # Prisma singleton
│   │   └── utils.ts                      # Utility functions
│   │
│   ├── auth.ts                           # NextAuth configuration
│   └── middleware.ts                     # Route protection
│
├── prisma/
│   ├── schema.prisma                     # Database schema
│   └── dev.db                            # SQLite database
│
├── docs/                                 # Documentation
│   ├── DEVELOPER_GUIDE.md
│   ├── USER_GUIDE.md
│   ├── QUICK_START.md
│   └── ARCHITECTURE.md
│
├── public/                               # Static assets
├── .env.local                            # Environment variables
├── package.json                          # Dependencies
├── tsconfig.json                         # TypeScript config
├── tailwind.config.ts                    # Tailwind config
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
// ✅ Client component can import
import { BOARD_MEETING_PHASES } from '@/lib/board/phases'

// ❌ Client component CANNOT import
import { generateBoardResponse } from '@/lib/llm/orchestrator'  // Contains Anthropic
```

### 2. SQLite Instead of Supabase

**Decision:** Use SQLite with Prisma instead of Supabase

**Why:**
- Simpler setup (no external account needed)
- Works offline
- Faster for development
- Easy to reset

**Trade-off:** Not suitable for multi-user production without migration to PostgreSQL.

### 3. JWT Sessions Instead of Database Sessions

**Decision:** Use JWT-based sessions in NextAuth

**Why:**
- No session table needed in database
- Stateless - easier to scale
- Simpler implementation

**Trade-off:** Cannot revoke sessions (user has to wait for expiration).

### 4. Optimistic Updates for Chat

**Decision:** Add user message to UI before API confirms

**Why:**
- Better UX - message appears instantly
- AI response takes 2-5 seconds
- User sees their message immediately

**Implementation:**
```typescript
// 1. Add to local state immediately
setMessages(prev => [...prev, userMessage])

// 2. Send to API
const response = await fetch('/api/board/.../message', ...)

// 3. Add AI response when received
setMessages(prev => [...prev, aiMessage])
```

### 5. Director Interjection System

**Decision:** Allow any director to interject based on triggers

**Why:**
- Makes conversation more dynamic
- Prevents gaming one director
- Simulates real board dynamics

**Implementation:**
```typescript
// If user says "I promise...", Accountability Hawk might interject
if (userMessage.includes('promise')) {
  if (Math.random() > 0.6) {  // 40% chance
    respondingDirector = accountability_hawk
  }
}
```

---

## Extending the System

### Adding a New Feature: Goals Tracking

1. **Add database model:**
   ```prisma
   model Goal {
     id          String    @id @default(cuid())
     userId      String
     title       String
     description String?
     targetDate  DateTime?
     completed   Boolean   @default(false)
     createdAt   DateTime  @default(now())

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
   src/app/api/goals/
   ├── route.ts           # GET list, POST create
   └── [goalId]/
       └── route.ts       # GET one, PUT update, DELETE
   ```

4. **Create pages:**
   ```
   src/app/(dashboard)/goals/
   ├── page.tsx           # List goals
   └── new/
       └── page.tsx       # Create goal form
   ```

5. **Add navigation link in dashboard layout**

6. **Integrate with board meetings:**
   - Include goals in portfolio context
   - Add goal progress to Market Check phase

### Adding a New Director

1. **Edit `src/lib/directors/personas.ts`:**
   ```typescript
   {
     id: 'risk_officer',
     name: 'The Risk Officer',
     title: 'Chief Risk Officer',
     avatar: '⚠️',
     color: 'orange',
     systemPrompt: `You are The Risk Officer. You identify and quantify
       career risks. You ask about worst-case scenarios, failure modes,
       and mitigation strategies. You don't accept vague risk assessments.`,
     interjectionTriggers: ['risk', 'dangerous', 'might fail', 'worried'],
   }
   ```

2. **Optionally add to phases in `src/lib/board/phases.ts`:**
   ```typescript
   {
     id: 6,
     name: 'Risk Assessment',
     description: 'Evaluate career risks',
     leadDirector: 'risk_officer',
     questions: ['What is the biggest risk to your career?'],
   }
   ```

3. **No other changes needed** - orchestrator automatically uses new director.

### Adding Email Notifications

1. **Install Resend:**
   ```bash
   npm install resend
   ```

2. **Add API key to `.env.local`:**
   ```
   RESEND_API_KEY=re_...
   ```

3. **Create email service:**
   ```typescript
   // src/lib/email/client.ts
   import { Resend } from 'resend'
   export const resend = new Resend(process.env.RESEND_API_KEY)
   ```

4. **Create email templates:**
   ```
   src/lib/email/templates/
   ├── quarterly-reminder.tsx
   └── session-complete.tsx
   ```

5. **Add cron job for reminders (using Vercel Cron or similar)**

---

This architecture is designed to be:
- **Understandable** - Clear separation of concerns
- **Extensible** - Easy to add features
- **Maintainable** - Well-organized file structure
- **Secure** - API keys never exposed to client
