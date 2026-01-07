# my-career-board Developer Guide

## Complete Guide for Developers New to Web Development

This guide is written for developers with traditional programming experience (C, C++, Java) who are new to full-stack web development. Every concept is explained from first principles.

---

## Table of Contents

1. [Understanding Web Development](#understanding-web-development)
2. [Technology Stack Explained](#technology-stack-explained)
3. [Setting Up Your Development Environment](#setting-up-your-development-environment)
4. [Project Structure Deep Dive](#project-structure-deep-dive)
5. [How the Code Works](#how-the-code-works)
6. [Database Guide](#database-guide)
7. [Authentication System](#authentication-system)
8. [AI Integration](#ai-integration)
9. [Adding New Features](#adding-new-features)
10. [Debugging Guide](#debugging-guide)
11. [Common Errors and Solutions](#common-errors-and-solutions)
12. [Glossary](#glossary)

---

## Understanding Web Development

### What is a Web Application?

Unlike traditional desktop applications (like a Java Swing app or C++ Qt app), web applications run in a browser. They consist of:

| Component | Traditional Equivalent | Purpose |
|-----------|----------------------|---------|
| **Frontend** | GUI (Swing, Qt) | What users see and interact with |
| **Backend** | Server process | Business logic, data processing |
| **Database** | File system / DB | Persistent data storage |
| **API** | Function calls | Communication between frontend and backend |

### Client-Server Model

```
┌─────────────────┐         HTTP Request          ┌─────────────────┐
│                 │  ──────────────────────────▶  │                 │
│   Web Browser   │                               │   Web Server    │
│   (Frontend)    │  ◀──────────────────────────  │   (Backend)     │
│                 │         HTTP Response         │                 │
└─────────────────┘                               └─────────────────┘
        │                                                  │
        │                                                  │
        ▼                                                  ▼
   User's Computer                                   Server Computer
   (or same machine                                  (or same machine
    in development)                                   in development)
```

In development, both run on your machine. The browser connects to `localhost:3000`.

### How Web Pages Work

1. **HTML** = Structure (like XML or a class definition)
2. **CSS** = Styling (colors, sizes, positions)
3. **JavaScript** = Logic (like Java/C++ code, but runs in browser)

Modern frameworks like React combine all three using JSX syntax.

---

## Technology Stack Explained

### Node.js - JavaScript Runtime

**What it is:** Like the JVM for Java, but for JavaScript. Allows running JavaScript outside browsers.

**Why we use it:** Runs our development server and builds the application.

```bash
# Check if installed
node --version    # Should show v18+

# Node Package Manager (like Maven for Java)
npm --version     # Manages dependencies
```

### TypeScript - Typed JavaScript

**What it is:** JavaScript with static types (like Java's type system).

```typescript
// JavaScript (no types, error at runtime)
function add(a, b) { return a + b; }
add("hello", 5);  // Returns "hello5" - probably not intended!

// TypeScript (catches errors at compile time)
function add(a: number, b: number): number { return a + b; }
add("hello", 5);  // Compile error! Cannot assign string to number
```

**Why we use it:** Catches bugs before runtime, better IDE support, easier refactoring.

### React - UI Library

**What it is:** A way to build UIs using "components" (reusable UI pieces).

```tsx
// Traditional approach (like Java Swing)
// You imperatively build the UI
Button button = new Button("Click me");
button.onClick(() -> counter++);
button.setText("Count: " + counter);

// React approach (declarative)
// You describe what the UI should look like
function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

**Key Concepts:**
- **Component**: A function that returns UI (like a class in OOP)
- **Props**: Input parameters to components
- **State**: Internal data that changes over time
- **Hooks**: Functions to add features (useState, useEffect, etc.)

### Next.js - React Framework

**What it is:** A framework built on React that adds:
- File-based routing (folders = URLs)
- Server-side rendering
- API routes (backend endpoints)
- Build optimization

```
File: src/app/dashboard/page.tsx
URL:  http://localhost:3000/dashboard

File: src/app/api/users/route.ts
URL:  http://localhost:3000/api/users (API endpoint)
```

### Tailwind CSS - Utility-First Styling

**What it is:** Instead of writing CSS files, you add classes directly to elements.

```tsx
// Traditional CSS
// styles.css: .button { background: blue; padding: 10px; }
<button className="button">Click</button>

// Tailwind CSS (no separate file needed)
<button className="bg-blue-500 p-2 rounded hover:bg-blue-600">
  Click
</button>
```

**Common Classes:**
- `bg-blue-500` = blue background
- `p-4` = padding on all sides
- `mt-2` = margin-top
- `text-white` = white text
- `rounded` = rounded corners
- `hover:X` = apply X on hover

### Prisma - Database ORM

**What it is:** Like Hibernate for Java. Maps database tables to TypeScript objects.

```typescript
// Instead of raw SQL
const result = await db.query("SELECT * FROM users WHERE id = ?", [id]);

// Prisma (type-safe, auto-complete)
const user = await prisma.user.findUnique({
  where: { id: userId }
});
// user is typed! user.email, user.name, etc.
```

### SQLite - Database

**What it is:** A file-based database (like H2 in Java). No server needed.

**Location:** `prisma/dev.db` (created automatically)

---

## Setting Up Your Development Environment

### Step 1: Install Node.js

**Windows:**
1. Go to https://nodejs.org
2. Download the LTS version (18.x or higher)
3. Run the installer, accept all defaults
4. Open Command Prompt or PowerShell
5. Verify: `node --version` and `npm --version`

**Mac:**
```bash
# Using Homebrew (install from https://brew.sh first)
brew install node
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 2: Install a Code Editor

**Recommended: Visual Studio Code**
1. Download from https://code.visualstudio.com
2. Install these extensions:
   - **ESLint** (error detection)
   - **Prettier** (code formatting)
   - **Prisma** (database schema highlighting)
   - **Tailwind CSS IntelliSense** (CSS class suggestions)

### Step 3: Install Git (Version Control)

**Windows:**
1. Download from https://git-scm.com
2. Run installer, accept defaults
3. Verify: `git --version`

### Step 4: Clone and Setup the Project

```bash
# 1. Open terminal in your projects folder
cd C:\Users\YourName\Projects  # Windows
cd ~/Projects                   # Mac/Linux

# 2. Clone the repository (if from Git)
git clone <repository-url> pcgs
cd pcgs

# OR if you have the folder already
cd C:\Users\simon\Downloads\pcgs

# 3. Install dependencies (like Maven's mvn install)
npm install

# This reads package.json and downloads all required packages
# into the node_modules folder (like .m2 for Maven)

# 4. Generate Prisma client (creates type-safe database client)
npx prisma generate

# 5. Create the database and tables
npx prisma db push

# 6. Create environment file
# Copy .env.example to .env.local (or create new)
# Add your API keys (see next section)
```

### Step 5: Configure Environment Variables

Create a file named `.env.local` in the project root:

```env
# Authentication secret (generate a random string)
# You can use: openssl rand -base64 32
AUTH_SECRET=your-super-secret-key-at-least-32-characters-long

# Anthropic API key (get from https://console.anthropic.com)
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

**How to get an Anthropic API key:**
1. Go to https://console.anthropic.com
2. Create an account or sign in
3. Go to API Keys section
4. Create a new key
5. Copy and paste into `.env.local`

### Step 6: Start the Development Server

```bash
npm run dev
```

**What happens:**
1. Next.js compiles your TypeScript code
2. Starts a web server on port 3000
3. Opens hot-reload (changes appear instantly)

**Open your browser:** http://localhost:3000

### Step 7: Verify Everything Works

1. Open http://localhost:3000 - should see landing page
2. Click "Get Started" - should see signup form
3. Create an account
4. You should be redirected to the dashboard

---

## Project Structure Deep Dive

### The src/app Folder (Pages and Routes)

```
src/app/
├── (auth)/                    # Route group - doesn't affect URL
│   ├── login/
│   │   └── page.tsx          # /login
│   └── signup/
│       └── page.tsx          # /signup
├── (dashboard)/               # Route group for protected pages
│   ├── dashboard/
│   │   └── page.tsx          # /dashboard
│   ├── audit/
│   │   └── page.tsx          # /audit
│   ├── board/
│   │   ├── page.tsx          # /board
│   │   └── [sessionId]/
│   │       └── page.tsx      # /board/abc123 (dynamic route)
│   ├── portfolio/
│   │   ├── page.tsx          # /portfolio
│   │   └── setup/
│   │       └── page.tsx      # /portfolio/setup
│   ├── history/
│   │   ├── page.tsx          # /history
│   │   └── [sessionId]/
│   │       └── page.tsx      # /history/abc123
│   └── settings/
│       └── page.tsx          # /settings
├── api/                       # Backend API routes
│   ├── auth/
│   │   └── signup/
│   │       └── route.ts      # POST /api/auth/signup
│   ├── portfolio/
│   │   ├── route.ts          # GET /api/portfolio
│   │   └── problems/
│   │       └── route.ts      # POST /api/portfolio/problems
│   ├── board/
│   │   ├── route.ts          # POST /api/board
│   │   └── [sessionId]/
│   │       └── message/
│   │           └── route.ts  # POST /api/board/{id}/message
│   └── sessions/
│       └── [sessionId]/
│           └── route.ts      # GET /api/sessions/{id}
├── layout.tsx                 # Root layout (wraps all pages)
├── page.tsx                   # Home page (/)
└── globals.css                # Global styles
```

**Understanding Route Groups:**
- `(auth)` and `(dashboard)` are "route groups"
- The parentheses mean they don't appear in the URL
- `/signup` not `/(auth)/signup`
- Used for organizing and applying different layouts

**Understanding Dynamic Routes:**
- `[sessionId]` means this part of the URL is a variable
- `/board/abc123` → sessionId = "abc123"
- Access in page: `params.sessionId`

### The src/components Folder

```
src/components/
├── ui/                        # shadcn/ui components (don't edit)
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── ...
├── audit/                     # Audit-specific components
│   ├── AuditChat.tsx
│   └── SpecificityGate.tsx
└── shared/                    # Shared across features
    └── LoadingSpinner.tsx
```

### The src/lib Folder (Core Logic)

```
src/lib/
├── audit/
│   └── questions.ts           # Audit question definitions
├── board/
│   └── phases.ts              # Board meeting phases (CLIENT-SAFE)
├── directors/
│   └── personas.ts            # AI director definitions
├── insights/
│   └── patterns.ts            # Pattern detection logic
├── llm/
│   ├── providers/
│   │   └── anthropic.ts       # Claude API client
│   └── orchestrator.ts        # Board meeting orchestration (SERVER-ONLY)
└── prisma/
    └── client.ts              # Database client singleton
```

**CRITICAL: Client vs Server Code**
- Files in `src/lib/llm/` import Anthropic SDK
- Anthropic SDK CANNOT run in browser (exposes API key)
- Only import these in:
  - API routes (`src/app/api/...`)
  - Server components (no `'use client'` directive)

### The prisma Folder

```
prisma/
├── schema.prisma              # Database schema definition
└── dev.db                     # SQLite database file (created automatically)
```

---

## How the Code Works

### Understanding a Page Component

Let's break down a simple page:

```tsx
// src/app/(dashboard)/dashboard/page.tsx

// 1. IMPORTS - bring in external code
import Link from 'next/link'              // Navigation component
import { auth } from '@/auth'              // Authentication helper
import prisma from '@/lib/prisma/client'   // Database client
import { Card, CardContent } from '@/components/ui/card'  // UI components

// 2. THE PAGE FUNCTION
// In Next.js, pages are async functions that return JSX
export default async function DashboardPage() {

  // 3. GET CURRENT USER (server-side)
  const session = await auth()        // Returns null if not logged in
  const userId = session?.user?.id    // Optional chaining (like Java's Optional)

  // 4. FETCH DATA FROM DATABASE
  const problemCount = userId
    ? await prisma.problem.count({ where: { userId } })
    : 0

  // 5. RETURN JSX (the UI)
  return (
    <div className="space-y-8">          {/* Tailwind: vertical spacing */}
      <h1 className="text-3xl font-bold text-white">
        Welcome back{session?.user?.name ? `, ${session.user.name}` : ''}
      </h1>

      {/* Conditional rendering (like if/else) */}
      {problemCount === 0 ? (
        <Card>
          <CardContent>
            <p>You haven't defined any problems yet.</p>
            <Link href="/portfolio/setup">Get Started</Link>
          </CardContent>
        </Card>
      ) : (
        <p>You have {problemCount} problems in your portfolio.</p>
      )}
    </div>
  )
}
```

**Key Concepts:**
1. `async function` - This is a Server Component (runs on server)
2. `await` - Wait for async operations (database, auth)
3. JSX - HTML-like syntax that becomes React elements
4. `className` - HTML's `class` attribute (renamed in React)
5. `{}` - JavaScript expressions inside JSX
6. `{condition && <element>}` - Render if condition is true
7. `{condition ? <a> : <b>}` - Render a or b

### Understanding an API Route

```typescript
// src/app/api/portfolio/problems/route.ts

import { NextResponse } from 'next/server'  // Response helper
import { auth } from '@/auth'                // Auth helper
import prisma from '@/lib/prisma/client'     // Database

// POST handler - creates a new problem
export async function POST(request: Request) {
  try {
    // 1. CHECK AUTHENTICATION
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }          // HTTP status code
      )
    }

    // 2. PARSE REQUEST BODY
    const data = await request.json()
    // data = { name: "...", whatBreaks: "...", ... }

    // 3. VALIDATE INPUT
    if (!data.name || !data.whatBreaks) {
      return NextResponse.json(
        { error: 'Name and whatBreaks are required' },
        { status: 400 }          // Bad Request
      )
    }

    // 4. INSERT INTO DATABASE
    const problem = await prisma.problem.create({
      data: {
        userId: session.user.id,
        name: data.name,
        whatBreaks: data.whatBreaks,
        classification: data.classification || 'uncertain',
      },
    })

    // 5. RETURN SUCCESS RESPONSE
    return NextResponse.json(problem, { status: 201 })  // Created

  } catch (error) {
    // 6. HANDLE ERRORS
    console.error('Error creating problem:', error)
    return NextResponse.json(
      { error: 'Failed to create problem' },
      { status: 500 }            // Internal Server Error
    )
  }
}

// GET handler - fetches all problems
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const problems = await prisma.problem.findMany({
    where: { userId: session.user.id },
  })

  return NextResponse.json(problems)
}
```

### Understanding Client Components

Client components run in the browser and can use interactivity:

```tsx
// The 'use client' directive is REQUIRED for client components
'use client'

import { useState } from 'react'  // React hook for state

export function Counter() {
  // useState returns [currentValue, setterFunction]
  const [count, setCount] = useState(0)

  // Event handler function
  const handleClick = () => {
    setCount(count + 1)  // Updates state, triggers re-render
  }

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={handleClick}>
        Increment
      </button>
    </div>
  )
}
```

**When to use 'use client':**
- User interactions (onClick, onChange, etc.)
- Browser APIs (localStorage, window, etc.)
- React hooks (useState, useEffect, useRef, etc.)
- Real-time updates

**When NOT to use 'use client':**
- Fetching data from database
- Authentication checks
- Anything that should be hidden from users

---

## Database Guide

### Understanding the Schema

```prisma
// prisma/schema.prisma

// 1. DATABASE CONNECTION
datasource db {
  provider = "sqlite"           // Database type
  url      = "file:./dev.db"   // File location
}

// 2. CLIENT GENERATOR
generator client {
  provider = "prisma-client-js"  // Generates TypeScript types
}

// 3. MODELS (like Java classes / database tables)

model User {
  id        String   @id @default(cuid())  // Primary key
  email     String   @unique                // Unique constraint
  password  String                          // Hashed password
  name      String?                         // ? = nullable
  avatarUrl String?
  settings  String?                         // JSON stored as string
  createdAt DateTime @default(now())        // Auto-set on create
  updatedAt DateTime @updatedAt             // Auto-update

  // Relations (like foreign keys)
  problems      Problem[]        // One-to-many
  boardSessions BoardSession[]   // One-to-many
}

model Problem {
  id                     String   @id @default(cuid())
  userId                 String                         // Foreign key
  name                   String
  whatBreaks             String
  classification         String   @default("uncertain")
  classificationReasoning String?
  timeAllocation         Int?
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt

  // Relation
  user User @relation(fields: [userId], references: [id])
}

model BoardSession {
  id           String    @id @default(cuid())
  userId       String
  sessionType  String                           // "quick_audit" or "quarterly_meeting"
  quarter      String?                          // "Q1 2025"
  status       String    @default("in_progress")
  currentPhase Int       @default(0)
  startedAt    DateTime  @default(now())
  completedAt  DateTime?

  user     User             @relation(fields: [userId], references: [id])
  messages SessionMessage[]
}

model SessionMessage {
  id          String   @id @default(cuid())
  sessionId   String
  speaker     String                    // "user" or director ID
  content     String
  messageType String
  metadata    String?                   // JSON for extra data
  createdAt   DateTime @default(now())

  session BoardSession @relation(fields: [sessionId], references: [id])
}
```

### Common Database Operations

```typescript
import prisma from '@/lib/prisma/client'

// CREATE - Insert new record
const user = await prisma.user.create({
  data: {
    email: 'john@example.com',
    password: hashedPassword,
    name: 'John Doe',
  },
})

// READ - Find one record
const user = await prisma.user.findUnique({
  where: { id: userId },
})

const user = await prisma.user.findFirst({
  where: { email: 'john@example.com' },
})

// READ - Find many records
const problems = await prisma.problem.findMany({
  where: { userId: userId },
  orderBy: { createdAt: 'desc' },  // Newest first
  take: 10,                         // Limit to 10
})

// READ - Count records
const count = await prisma.problem.count({
  where: { userId: userId },
})

// READ - With relations (JOIN)
const session = await prisma.boardSession.findFirst({
  where: { id: sessionId },
  include: {
    messages: true,  // Include related messages
    user: true,      // Include related user
  },
})

// UPDATE - Modify record
const updated = await prisma.user.update({
  where: { id: userId },
  data: { name: 'New Name' },
})

// DELETE - Remove record
await prisma.problem.delete({
  where: { id: problemId },
})

// DELETE - Remove many
await prisma.sessionMessage.deleteMany({
  where: { sessionId: sessionId },
})
```

### Modifying the Database Schema

1. **Edit the schema:**
   ```prisma
   // Add a new field to User
   model User {
     // ... existing fields
     phoneNumber String?  // New optional field
   }
   ```

2. **Push changes (development):**
   ```bash
   npx prisma db push
   ```

3. **Regenerate client:**
   ```bash
   npx prisma generate
   ```

4. **View your database:**
   ```bash
   npx prisma studio
   ```
   Opens a web UI at http://localhost:5555

---

## Authentication System

### How Auth Works in This Project

```
1. User submits signup form
   └── POST /api/auth/signup
       └── Hash password with bcrypt
       └── Insert user into database
       └── Return success

2. User submits login form
   └── NextAuth handles this automatically
   └── POST /api/auth/callback/credentials
       └── Find user by email
       └── Compare password hash
       └── Create JWT session token
       └── Set cookie in browser

3. User visits protected page
   └── Middleware checks for session cookie
   └── If no cookie → redirect to /login
   └── If valid → allow access

4. Page fetches user data
   └── const session = await auth()
   └── session.user.id, session.user.email, etc.
```

### Key Auth Files

**`src/auth.ts`** - NextAuth configuration:
```typescript
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma/client'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        // Find user
        const user = await prisma.user.findFirst({
          where: { email: credentials.email },
        })
        if (!user) return null

        // Verify password
        const valid = await bcrypt.compare(
          credentials.password,
          user.password
        )
        if (!valid) return null

        // Return user object (stored in session)
        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) token.id = user.id
      return token
    },
    session: async ({ session, token }) => {
      if (token) session.user.id = token.id
      return session
    },
  },
})
```

### Protecting Pages

Pages in `(dashboard)` are protected by middleware:

```typescript
// src/middleware.ts
export { auth as middleware } from '@/auth'

export const config = {
  matcher: ['/(dashboard)/:path*']  // Protect dashboard routes
}
```

### Using Auth in Your Code

```typescript
// In a Server Component or API route
import { auth } from '@/auth'

export default async function ProtectedPage() {
  const session = await auth()

  if (!session) {
    // This shouldn't happen if middleware is working
    redirect('/login')
  }

  const userId = session.user.id
  const userEmail = session.user.email
  const userName = session.user.name

  // ... rest of your code
}
```

---

## AI Integration

### How the AI Directors Work

```
1. User sends message in board room
   └── POST /api/board/{sessionId}/message

2. API fetches context
   └── User's portfolio (problems)
   └── Conversation history
   └── Current meeting phase

3. Orchestrator builds prompt
   └── Director's system prompt (personality)
   └── Portfolio context
   └── Phase context
   └── Conversation history
   └── User's message

4. Call Anthropic API
   └── Send to Claude
   └── Get response

5. Store and return response
   └── Save to database
   └── Return to frontend
   └── Display in chat
```

### Understanding Director Personas

```typescript
// src/lib/directors/personas.ts

export interface DirectorPersona {
  id: string                    // Unique identifier
  name: string                  // Display name
  title: string                 // Role title
  avatar: string                // Emoji avatar
  color: string                 // Theme color
  systemPrompt: string          // AI personality prompt
  interjectionTriggers: string[] // Keywords that trigger this director
}

export const DIRECTOR_PERSONAS: DirectorPersona[] = [
  {
    id: 'accountability_hawk',
    name: 'The Accountability Hawk',
    title: 'Chief Accountability Officer',
    avatar: '🦅',
    color: 'blue',
    systemPrompt: `You are The Accountability Hawk...`,
    interjectionTriggers: ['promise', 'committed', 'said I would'],
  },
  // ... more directors
]
```

### Adding a New Director

1. **Edit `src/lib/directors/personas.ts`:**
   ```typescript
   {
     id: 'risk_assessor',           // Lowercase, underscores
     name: 'The Risk Assessor',
     title: 'Chief Risk Officer',
     avatar: '⚠️',
     color: 'orange',
     systemPrompt: `You are The Risk Assessor, focused on identifying
       and quantifying career risks. You ask about worst-case scenarios,
       probability of failure, and mitigation strategies. You don't
       accept vague risk assessments - demand numbers and specifics.`,
     interjectionTriggers: ['risk', 'dangerous', 'might fail', 'worried'],
   }
   ```

2. **Optionally add to a phase in `src/lib/board/phases.ts`:**
   ```typescript
   {
     id: 6,
     name: 'Risk Assessment',
     description: 'Evaluate risks and mitigation',
     leadDirector: 'risk_assessor',
     questions: [
       'What is the biggest risk to your career right now?',
       'What happens if your main bet fails?',
     ],
   }
   ```

### Anthropic API Integration

```typescript
// src/lib/llm/providers/anthropic.ts

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function generateDirectorResponse(
  systemPrompt: string,
  conversationHistory: Array<{ role: string; content: string }>,
  userMessage: string
): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ],
  })

  // Extract text from response
  const textBlock = response.content.find(block => block.type === 'text')
  return textBlock?.text || 'No response generated.'
}
```

---

## Adding New Features

### Step-by-Step: Adding a New Page

**Example: Add a "/goals" page to track career goals**

1. **Create the page file:**
   ```bash
   mkdir -p src/app/\(dashboard\)/goals
   ```

2. **Create `src/app/(dashboard)/goals/page.tsx`:**
   ```tsx
   import { auth } from '@/auth'
   import prisma from '@/lib/prisma/client'
   import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

   export default async function GoalsPage() {
     const session = await auth()

     // You'll need to add Goal model to schema first
     // const goals = await prisma.goal.findMany({
     //   where: { userId: session?.user?.id }
     // })

     return (
       <div className="space-y-8">
         <h1 className="text-3xl font-bold text-white">Career Goals</h1>

         <Card className="border-slate-700 bg-slate-800/50">
           <CardHeader>
             <CardTitle className="text-white">Your Goals</CardTitle>
           </CardHeader>
           <CardContent>
             <p className="text-slate-400">
               Coming soon: Track your career goals here.
             </p>
           </CardContent>
         </Card>
       </div>
     )
   }
   ```

3. **Add to navigation (if needed):**
   Edit the dashboard layout to include a link.

### Step-by-Step: Adding an API Endpoint

**Example: Add API to manage goals**

1. **Create `src/app/api/goals/route.ts`:**
   ```typescript
   import { NextResponse } from 'next/server'
   import { auth } from '@/auth'
   import prisma from '@/lib/prisma/client'

   // GET /api/goals - List all goals
   export async function GET() {
     const session = await auth()
     if (!session?.user?.id) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
     }

     const goals = await prisma.goal.findMany({
       where: { userId: session.user.id },
       orderBy: { createdAt: 'desc' },
     })

     return NextResponse.json(goals)
   }

   // POST /api/goals - Create a goal
   export async function POST(request: Request) {
     const session = await auth()
     if (!session?.user?.id) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
     }

     const data = await request.json()

     if (!data.title) {
       return NextResponse.json(
         { error: 'Title is required' },
         { status: 400 }
       )
     }

     const goal = await prisma.goal.create({
       data: {
         userId: session.user.id,
         title: data.title,
         description: data.description,
         targetDate: data.targetDate ? new Date(data.targetDate) : null,
       },
     })

     return NextResponse.json(goal, { status: 201 })
   }
   ```

2. **Add database model to `prisma/schema.prisma`:**
   ```prisma
   model Goal {
     id          String    @id @default(cuid())
     userId      String
     title       String
     description String?
     targetDate  DateTime?
     completed   Boolean   @default(false)
     createdAt   DateTime  @default(now())
     updatedAt   DateTime  @updatedAt

     user User @relation(fields: [userId], references: [id])
   }
   ```

3. **Update User model to include relation:**
   ```prisma
   model User {
     // ... existing fields
     goals Goal[]
   }
   ```

4. **Push database changes:**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

### Step-by-Step: Adding a New Component

**Example: Add a GoalCard component**

1. **Create `src/components/goals/GoalCard.tsx`:**
   ```tsx
   import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
   import { Badge } from '@/components/ui/badge'
   import { CheckCircle, Circle, Target } from 'lucide-react'

   interface GoalCardProps {
     title: string
     description?: string
     targetDate?: Date
     completed: boolean
     onToggle?: () => void
   }

   export function GoalCard({
     title,
     description,
     targetDate,
     completed,
     onToggle,
   }: GoalCardProps) {
     return (
       <Card className="border-slate-700 bg-slate-800/50">
         <CardHeader>
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <button onClick={onToggle}>
                 {completed ? (
                   <CheckCircle className="h-5 w-5 text-green-400" />
                 ) : (
                   <Circle className="h-5 w-5 text-slate-400" />
                 )}
               </button>
               <CardTitle className="text-white">{title}</CardTitle>
             </div>
             {targetDate && (
               <Badge variant="outline" className="border-slate-600">
                 Due: {new Date(targetDate).toLocaleDateString()}
               </Badge>
             )}
           </div>
         </CardHeader>
         {description && (
           <CardContent>
             <p className="text-slate-400">{description}</p>
           </CardContent>
         )}
       </Card>
     )
   }
   ```

2. **Use in your page:**
   ```tsx
   import { GoalCard } from '@/components/goals/GoalCard'

   // In your page component
   {goals.map((goal) => (
     <GoalCard
       key={goal.id}
       title={goal.title}
       description={goal.description}
       targetDate={goal.targetDate}
       completed={goal.completed}
     />
   ))}
   ```

---

## Debugging Guide

### Browser Developer Tools

**Open DevTools:**
- Windows/Linux: `F12` or `Ctrl+Shift+I`
- Mac: `Cmd+Option+I`

**Console Tab:**
- Shows JavaScript errors
- `console.log()` output appears here
- Network errors

**Network Tab:**
- Shows all HTTP requests
- Click a request to see details
- Check "Response" for API data
- Check "Headers" for status codes

**Application Tab:**
- Cookies (including auth session)
- Local Storage
- Session Storage

### Server-Side Debugging

**Add console.log:**
```typescript
export async function POST(request: Request) {
  console.log('=== API CALLED ===')

  const data = await request.json()
  console.log('Request data:', JSON.stringify(data, null, 2))

  // ... rest of code

  console.log('Response:', result)
  return NextResponse.json(result)
}
```

**View logs:**
- Look at the terminal where `npm run dev` is running
- Server logs appear there

### Database Debugging

**View database contents:**
```bash
npx prisma studio
```
Opens http://localhost:5555 with a visual database browser.

**Reset database:**
```bash
# Delete and recreate
rm prisma/dev.db
npx prisma db push
```

### Common Debug Patterns

**API not returning data:**
```typescript
// Add extensive logging
export async function GET() {
  console.log('1. GET /api/xyz called')

  const session = await auth()
  console.log('2. Session:', session)

  if (!session?.user?.id) {
    console.log('3. No session, returning 401')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('4. Fetching data for user:', session.user.id)

  const data = await prisma.model.findMany({
    where: { userId: session.user.id },
  })

  console.log('5. Found records:', data.length)
  console.log('6. Data:', JSON.stringify(data, null, 2))

  return NextResponse.json(data)
}
```

---

## Common Errors and Solutions

### Error: "Module not found"

**Cause:** Import path is wrong or file doesn't exist.

**Solution:**
```typescript
// Wrong
import { Button } from '@/component/ui/button'

// Correct
import { Button } from '@/components/ui/button'
//                           ^ missing 's'
```

**Check:**
- Spelling of folder/file names
- `@/` means `src/` folder
- File extension (.ts vs .tsx)

### Error: "Unauthorized" (401)

**Cause:** User not logged in or session expired.

**Solution:**
1. Check if you're logged in
2. Clear cookies and log in again
3. Check `AUTH_SECRET` in `.env.local`

### Error: "Cannot read property of undefined"

**Cause:** Trying to access property on null/undefined.

```typescript
// Problem
const name = session.user.name  // session might be null

// Solution
const name = session?.user?.name  // Optional chaining
```

### Error: Database errors

**"table does not exist":**
```bash
npx prisma db push
```

**"unique constraint failed":**
- Trying to insert duplicate value
- Check your data

**"foreign key constraint failed":**
- Related record doesn't exist
- Create parent record first

### Error: "use client" issues

**"useState is not a function":**
- Add `'use client'` at top of file

**"window is not defined":**
- Code running on server but using browser APIs
- Add `'use client'` or use `useEffect`

### Error: Anthropic API errors

**"Invalid API key":**
- Check `ANTHROPIC_API_KEY` in `.env.local`
- Make sure it starts with `sk-ant-`

**"Rate limit exceeded":**
- Too many requests
- Wait and try again

---

## Glossary

| Term | Definition |
|------|------------|
| **API** | Application Programming Interface. A way for programs to communicate. |
| **API Route** | A server endpoint that handles HTTP requests. |
| **Client Component** | React component that runs in the browser. Uses `'use client'`. |
| **Component** | A reusable piece of UI in React. |
| **CRUD** | Create, Read, Update, Delete. Basic database operations. |
| **CSS** | Cascading Style Sheets. Language for styling web pages. |
| **Endpoint** | A URL that accepts requests (like `/api/users`). |
| **Hook** | A function that adds features to React components (useState, useEffect). |
| **HTTP** | Protocol for web communication. GET reads, POST creates, etc. |
| **JSX** | JavaScript XML. HTML-like syntax in React. |
| **JWT** | JSON Web Token. Encrypted data for authentication. |
| **Middleware** | Code that runs between request and response. |
| **ORM** | Object-Relational Mapping. Converts database records to objects. |
| **Props** | Properties passed to React components. |
| **REST** | Representational State Transfer. API design pattern. |
| **Route** | A URL path that maps to a page or API. |
| **Schema** | Definition of database structure. |
| **Server Component** | React component that runs on the server. Default in Next.js. |
| **SSR** | Server-Side Rendering. Generating HTML on the server. |
| **State** | Data that changes over time in a component. |
| **TypeScript** | JavaScript with static types. |

---

## Getting Help

1. **Check the error message carefully** - it often tells you exactly what's wrong
2. **Search the error** - someone else has probably had the same issue
3. **Check documentation:**
   - Next.js: https://nextjs.org/docs
   - Prisma: https://www.prisma.io/docs
   - Tailwind: https://tailwindcss.com/docs
   - React: https://react.dev
4. **Ask Claude** - use Claude Code or Claude chat for debugging help
5. **Review this guide** - the answer might be here!
