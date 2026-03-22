<<<<<<< HEAD
# PrepAI — Software Engineering Interview Coach

A purpose-built AI chatbot for software engineering interview preparation, built with Next.js 14 and Claude.

## Why this topic?

Interview prep is a high-stakes, recurring need for engineers. Generic chatbots fail here because they don't know what interviewers actually look for. PrepAI uses topic-specific system prompts that coach differently per domain — DSA gets Big-O focus, behavioral gets STAR framework coaching, system design gets estimation + trade-off reasoning.

## What's built

- 8 topic tracks: DSA, Algorithms, System Design, Behavioral, JavaScript, React, Databases, General
- Real-time streaming responses via SSE + Anthropic Claude
- Custom zero-dependency markdown renderer (no bundle bloat)
- Empty state with curated starter prompts per topic
- Error, loading, and streaming states all handled
- Fully responsive, mobile-friendly layout
- Terminal-dark aesthetic purpose-built for engineers

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Anthropic SDK** (claude-sonnet-4)
- **Edge Runtime** for streaming
- **CSS Variables** — no Tailwind, no CSS-in-JS

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Get your key at: https://console.anthropic.com

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

```bash
npx vercel
```

Add `ANTHROPIC_API_KEY` in your Vercel project environment variables.

## Project Structure

```
prepai/
├── app/
│   ├── api/chat/route.ts     # Edge streaming API route
│   ├── globals.css            # Full design system (CSS variables)
│   ├── layout.tsx             # Root layout + font imports
│   └── page.tsx               # Entry point — session routing
├── src/
│   ├── components/
│   │   ├── TopicSelector.tsx  # Landing — 8 topic cards
│   │   ├── ChatInterface.tsx  # Full chat view with header/footer
│   │   ├── MessageBubble.tsx  # User/assistant message rendering
│   │   ├── StarterPrompts.tsx # Empty state with suggested Qs
│   │   ├── ChatInput.tsx      # Auto-resize textarea with send
│   │   └── Markdown.tsx       # Zero-dep markdown renderer
│   ├── hooks/
│   │   └── useChat.ts         # SSE streaming + session state
│   ├── lib/
│   │   └── topics.ts          # Topic configs + system prompts
│   └── types/index.ts         # Shared TypeScript types
```
=======
# Software_engineer_Interview_coach_project
>>>>>>> 152872f7010edfd5d9e60c9e3af0862d6b5e841d
