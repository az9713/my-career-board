# my-career-board - Personal Career Governance System

Your AI-powered personal board of directors for career accountability.

---

## What is my-career-board?

my-career-board treats your career like a company - with you as the CEO reporting to a board of AI directors. These directors conduct regular audits and quarterly reviews to keep you honest about:

- What you're avoiding
- What commitments you've broken
- Whether your skills are appreciating or depreciating
- Where your career path is actually leading

**Inspired by:** Nate Jones' ["AI Board of Directors"](https://natejones.substack.com) concept.

---

## Features

| Feature | Description | Time |
|---------|-------------|------|
| **Problem Portfolio** | Define the 3-5 problems you're paid to solve | 15-20 min |
| **Quick Audit** | Fast accountability check with specificity gates | 15 min |
| **Board Meeting** | Full quarterly review with 5 AI directors | 45-60 min |
| **Pattern Detection** | Spot recurring themes you're avoiding | Automatic |
| **Session History** | Review past meetings and track progress | - |

### The 5 AI Directors

- 🦅 **Accountability Hawk** - Tracks commitments, demands evidence
- 📊 **Market Reality Skeptic** - Questions your market value assessment
- 🎯 **Avoidance Hunter** - Surfaces decisions you're avoiding
- ♟️ **The Strategist** - Long-term thinking, opportunity cost
- 😈 **Devil's Advocate** - Stress-tests your reasoning

---

## Quick Start

### Prerequisites

- Node.js 18+ ([download](https://nodejs.org))
- Anthropic API key ([get one](https://console.anthropic.com))

### Installation

```bash
# 1. Clone or navigate to the project
cd my-career-board

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npx prisma generate

# 4. Create database
npx prisma db push

# 5. Configure environment
cp .env.example .env.local
# Edit .env.local and add your API keys

# 6. Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file:

```env
# Required: Authentication secret (min 32 characters)
AUTH_SECRET=your-super-secret-key-at-least-32-characters-long

# Required: Anthropic API key
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

### First Steps

1. Open http://localhost:3000
2. Click "Get Started" to create an account
3. Define 3+ problems in your portfolio
4. Run your first Quick Audit

---

## Documentation

| Document | Audience | Description |
|----------|----------|-------------|
| [Quick Start Guide](docs/QUICK_START.md) | Users | Get started in 5 minutes with 10 example use cases |
| [User Guide](docs/USER_GUIDE.md) | Users | Complete guide to all features |
| [Developer Guide](docs/DEVELOPER_GUIDE.md) | Developers | Setup, code walkthrough, debugging |
| [Architecture](docs/ARCHITECTURE.md) | Developers | System design and data flow |
| [CLAUDE.md](CLAUDE.md) | AI Assistants | Context for Claude Code and other AI tools |

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 16 (App Router) | React framework |
| UI | Tailwind CSS + shadcn/ui | Styling |
| Database | SQLite + Prisma | Data persistence |
| Auth | NextAuth.js v5 | Authentication |
| AI | Anthropic Claude API | Director responses |
| Language | TypeScript | Type safety |

---

## Project Structure

```
my-career-board/
├── src/
│   ├── app/              # Pages and API routes
│   ├── components/       # React components
│   ├── lib/              # Core logic
│   │   ├── directors/    # AI director personas
│   │   ├── llm/          # LLM integration
│   │   └── prisma/       # Database client
│   └── auth.ts           # Auth configuration
├── prisma/
│   └── schema.prisma     # Database schema
├── docs/                 # Documentation
└── public/               # Static assets
```

---

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint

npx prisma studio # Open database browser
npx prisma db push # Apply schema changes
npx prisma generate # Regenerate client
```

---

## Development

### Adding a New Director

1. Edit `src/lib/directors/personas.ts`
2. Add persona with id, name, systemPrompt, triggers
3. (Optional) Add to phases in `src/lib/board/phases.ts`

### Adding Database Fields

1. Edit `prisma/schema.prisma`
2. Run `npx prisma db push`
3. Run `npx prisma generate`

### Adding New Pages

1. Create file in `src/app/(dashboard)/your-page/page.tsx`
2. Server components by default
3. Add `'use client'` for interactivity

---

## Contributing

Contributions welcome! Please read the [Developer Guide](docs/DEVELOPER_GUIDE.md) first.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## License

MIT License - see LICENSE file for details.

---

## Acknowledgments

### Inspiration

This project is inspired by **Nate Jones**:

- **YouTube Video**: ["Most People Want Validation, Not Perspective (Why This Matters Now)"](https://www.youtube.com/watch?v=BaC5FEN2e4Y)
- **Substack Article**: ["My honest field notes on being my own unreliable narrator + the governance mechanism I finally built to help"](https://natesnewsletter.substack.com/p/the-rarest-thing-in-work-why-360)

### AI-Assisted Development

This project was built with AI assistance:

- **Code & Documentation**: Generated by [Claude Code](https://claude.ai/claude-code) with [Claude Opus 4.5](https://anthropic.com)
- **PRD Brainstorming**: Collaborated with [Gemini 3.0](https://gemini.google.com)
- **MVP Specification**: Created using Claude Code's interactive AskUserQuestions tool

### Technologies

- [Anthropic](https://anthropic.com) - Claude AI for director responses
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Prisma](https://prisma.io) - Database ORM
- [Next.js](https://nextjs.org) - React framework
