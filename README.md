# AI Recruitment Screening Platform

A desktop application for conducting AI-powered technical interviews for recruitment screening. Recruiters create job postings, invite candidates via email, and candidates complete voice-based interviews with AI agents that evaluate fit against specific job requirements. Built with Tauri 2, React 19, Supabase, and Ollama.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Key Systems](#key-systems)

---

## Features

### Recruitment Workflow

```
Recruiter → Creates job → Adds candidate → Sends invite email with code
                                                    ↓
Candidate ← Installs app ← Enters code ← Gets personalized AI interview
                                                    ↓
Recruiter ← Views results dashboard ← Scores & transcript uploaded
```

### Recruiter Portal (Web App)
- **Job Management**: Create, edit, and manage job postings with required skills and experience levels
- **Candidate Pool**: Add candidates with resume uploads (PDF/text parsing)
- **Invite System**: Generate unique 6-character codes and send email invitations
- **Results Dashboard**: View interview scores, AI recommendations, and transcripts
- **Authentication**: Secure login via Supabase Auth

### Candidate App (Tauri Desktop)
- **Code Entry**: Candidates enter their interview code from the email
- **Job-Tailored Interview**: AI agents ask questions based on resume + job requirements
- **Skill Gap Analysis**: AI evaluates candidate skills against required job skills
- **Results Upload**: Scores and transcripts automatically saved to Supabase

### 3 AI Interview Agents

Three distinct AI personas conduct the interview, each evaluating different aspects:

| Agent | Name | Role | Focus |
|-------|------|------|-------|
| Peer | Alex Chen | Junior Developer | Fundamentals, communication, day-to-day work |
| Team Lead | Sarah Mitchell | Tech Lead | Architecture, trade-offs, team collaboration |
| Veteran | James Rodriguez | Principal Engineer | Edge cases, production experience, deep technical |

**NEW**: Agents now ask questions tailored to both the candidate's resume AND the job requirements. They identify skill gaps and probe missing required skills.

### Voice Interview System

- **Speech Recognition**: Web Speech API with continuous mode and technical grammar hints
- **Voice Activity Detection**: Interrupts agent when user starts speaking
- **Distinct TTS Voices**: Each agent uses different voice characteristics
- **Full Transcription**: All Q&A logged with timestamps

### Resume & Project Parsing

Upload PDF or paste text to extract:
- Skills across 6 categories
- Up to 5 projects with technologies
- Experience level and years

### Skill Fit Analysis

For recruitment screening, the AI performs automatic skill gap analysis:
- ✓ **Matched Skills**: Skills the candidate has that match job requirements
- ✗ **Missing Skills**: Required skills not found on resume (agents will probe these)

### Interview Report

After completion:
- Overall, technical, and communication scores (1-10)
- AI recommendation (Strong Yes / Yes / Maybe / No / Strong No)
- Strengths and weaknesses
- Full Q&A transcript with per-answer scores

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19.1 + Vite 7 |
| Desktop | Tauri 2 (Rust backend) |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions) |
| Code Editor | Monaco Editor (`@monaco-editor/react`) |
| AI / LLM | Ollama (local or cloud) via REST API |
| Speech | Web Speech API + Web Speech Synthesis API (browser-native) |
| PDF Parsing | pdfjs-dist |
| Icons | lucide-react |
| Fonts | JetBrains Mono (editor), system sans-serif (UI) |

---

## Architecture

### System Overview

```
┌─────────────────────────┐      ┌──────────────────────┐      ┌─────────────────────────┐
│   Recruiter Portal      │      │      Supabase        │      │    Candidate App        │
│   (React Web App)       │─────▶│   - PostgreSQL DB    │◀─────│   (Tauri Desktop)       │
│                         │      │   - Edge Functions   │      │                         │
│   • Create jobs         │      │   - SMTP Email       │      │   • Enter code          │
│   • Upload resumes      │      │   - Auth             │      │   • AI Interview        │
│   • View results        │      │                      │      │   • Submit results      │
└─────────────────────────┘      └──────────────────────┘      └─────────────────────────┘
```

### Candidate App Modes

The app has **4 modes** controlled from a single root component:

```
setup → video → coding → report
```

| Mode | Description |
|------|-------------|
| `setup` | Code entry screen: enter interview code to fetch job requirements |
| `video` | Full-screen video view with 3 AI agents asking job-specific questions |
| `coding` | Monaco editor workspace with questions sidebar, output panel, and agent panel |
| `report` | Post-interview analysis with scores, Q&A breakdown, and downloadable HTML |

### Voice System

Two independent speech systems exist in the codebase:

1. **`useAgentVoice`** (core interview engine): Handles the continuous voice interview — agents speak and listen continuously. Starts when "Start Interview" is clicked in video mode. Pauses when switching to coding mode to free the microphone for other uses.

2. **`useVoice`** (general-purpose): A lightweight STT/TTS hook. Currently returns `null` in the UI since voice controls were removed — the interview is fully voice-driven.

### Backend

**Supabase** manages:
- PostgreSQL database (jobs, candidates, applications, interviews)
- Row Level Security policies
- Edge Functions for sending invitation emails
- Authentication for the recruiter portal

**Tauri (Rust)** backend manages:
- Session file creation and transcript appending
- Report generation from completed sessions
- Window-level proctoring (screen capture exclusion)

When running outside Tauri (pure Vite dev), all backend calls fall back to `localStorage`.

---

## Getting Started

### Prerequisites

- **Node.js** 18+ with **pnpm** (or npm)
- **Rust** 1.70+
- **Ollama** running locally (or a cloud Ollama endpoint)
- **Supabase** account (for recruitment screening)

### Setup

```bash
# Install dependencies
pnpm install

# Start Ollama (if local)
ollama serve
ollama pull llama3
# Or use any Ollama-compatible endpoint via .env.local

# Create the recruiter portal
pnpm setup:recruiter
# Or: node setup-recruiter.js

# Install recruiter portal dependencies
cd recruiter && pnpm install && cd ..
```

### Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Run the schema in `supabase_schema.sql` in the Supabase SQL Editor
3. Deploy the email Edge Function:
   ```bash
   supabase functions deploy send-interview-email
   ```
4. Copy your Supabase URL and anon key to `.env.local`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
5. Copy `recruiter/.env.example` to `recruiter/.env` and add the same credentials

### Development

```bash
# Run the candidate app (Tauri dev environment)
pnpm tauri dev

# Run the recruiter portal (in a separate terminal)
cd recruiter && pnpm dev
```

### Production Build

```bash
# Build candidate app
pnpm tauri build

# Build recruiter portal
cd recruiter && pnpm build
```

Outputs:
- **Candidate App (Windows)**: `src-tauri/target/release/bundle/msi/`
- **Candidate App (macOS)**: `src-tauri/target/release/bundle/dmg/`
- **Candidate App (Linux)**: `src-tauri/target/release/bundle/deb/`
- **Recruiter Portal**: `recruiter/dist/` (deploy to any static host)

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Ollama connection (defaults to localhost:11434 if not set)
VITE_OLLAMA_BASE_URL=http://localhost:11434

# Optional: API key for cloud Ollama endpoints
VITE_OLLAMA_API_KEY=

# Model name (defaults to llama3 if not set)
VITE_OLLAMA_MODEL=llama3

# Supabase (required for recruitment screening mode)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Project Structure

```
INTERVIEW/
├── index.html              # Entry HTML
├── package.json            # Frontend dependencies and scripts
├── vite.config.js          # Vite + Tauri configuration
├── setup-recruiter.js      # Script to generate recruiter portal
├── supabase_schema.sql     # Database schema for Supabase
├── supabase_edge_function.ts # Email sending Edge Function
│
├── recruiter/              # Recruiter Portal (created by setup-recruiter.js)
│   ├── src/
│   │   ├── pages/          # Dashboard, Jobs, Candidates, etc.
│   │   ├── components/     # Shared UI components
│   │   └── services/       # Supabase client
│   └── ...
│
├── src/
│   ├── main.jsx            # React entry point
│   ├── App.jsx             # Root component: mode controller, all screens
│   ├── App.css             # Global styles
│   │
│   ├── components/
│   │   ├── AgentPanel.jsx       # 3-agent panel with status indicators
│   │   ├── AIChat.jsx           # Chat UI backed by useOllama hook
│   │   ├── InterviewSetup.jsx   # Code entry screen with job confirmation
│   │   ├── VoiceControls.jsx    # Returns null (voice handled automatically)
│   │   └── Overlay.jsx          # Proctor/lockdown overlay
│   │
│   ├── hooks/
│   │   ├── useAgentVoice.js     # Core voice interview engine (STT + TTS + multi-agent)
│   │   ├── useOllama.js         # Ollama chat session management
│   │   ├── useVoice.js          # General-purpose STT/TTS hook
│   │   ├── useInterviewFlow.js  # Interview phase state machine
│   │   └── useResize.js         # Resizable panel dimensions
│   │
│   ├── services/
│   │   ├── supabase.js          # Supabase client for candidate app
│   │   ├── ollama.js            # Ollama API client (chat, streaming, code review)
│   │   ├── agents.js            # 3 agent personas + system prompts + introductions
│   │   ├── codeRunner.js        # JS execution engine + test runner
│   │   ├── interviewBackend.js  # Tauri command wrapper (localStorage fallback)
│   │   ├── resumeParser.js       # Resume text extraction (skills, projects, experience)
│   │   └── questionGenerator.js  # Project-based question bank (NOT DSA)
│   │
│   └── styles/
│       ├── tokens.css     # Design tokens (CSS variables)
│       ├── typography.css
│       ├── base.css       # Reset + globals
│       ├── components.css
│       └── layout.css     # Workspace layout + resize handles
│
└── src-tauri/
    ├── Cargo.toml          # Rust dependencies
    ├── tauri.conf.json     # Tauri app config
    ├── build.rs           # Build script
    ├── capabilities/
    │   └── default.json   # Window permissions (always-on-top, no decorations)
    ├── icons/
    └── src/
        ├── main.rs       # Window creation + all Tauri commands
        └── lib.rs        # Re-export for mobile support
```

---

## Key Systems

### How the Interview Flow Works

1. **Setup**: Candidate enters name, uploads resume (PDF or text), adds projects
2. **Video Mode**: 20-minute countdown starts. "Start Interview" triggers `useAgentVoice.startInterview()` — Alex (peer agent) introduces first, then continuous speech recognition begins
3. **Agent Response Loop**: User speaks → 1.5s silence → transcript sent to Ollama → agent responds → TTS speaks → repeat
4. **Mode Switch**: Clicking "Start Coding" waits for current agent speech to finish, then pauses voice recognition and switches mode
5. **Coding**: Candidate writes code in Monaco Editor, can run and get test results, AI code review available
6. **Report**: After 20 minutes (or manual end), transcript is analyzed and a report is generated with scores and feedback

### Code Execution

JavaScript code is executed locally in the browser using a sandboxed `new Function()` wrapper that captures `console.log`, `console.error`, and `console.warn` output. Other languages (Python, Go, Rust, etc.) show simulated output since true cross-language execution requires a backend execution service.

### Session Persistence

Sessions are keyed by a 6-character alphanumeric interview code stored in `localStorage`. This enables the "join by code" flow without authentication. Reports are stored in `%APPDATA%/com.phiwa.interview/reports/` when running in Tauri.

---

## Screenshots / UI Layout

### Video Mode
```
┌─────────────────────────────────────────────────────────┐
│ Interview                            Live  19:45  [Bot] [⛶]│
├───────────────────────────────────┬─────────────────────┤
│                                   │  Interview Panel     │
│                                   │  ┌────────────────┐ │
│         Candidate Camera          │  │ Alex  ● Listen │ │
│         + Name Label              │  │ Sarah ○ Idle   │ │
│                                   │  │ James ○ Idle   │ │
│                                   │  └────────────────┘ │
│                                   │  [Start Interview]   │
├───────────────────────────────────┴─────────────────────┤
│  [🎤] [📹] [🖥️]  │ [Start Coding]  │  [End]            │
└─────────────────────────────────────────────────────────┘
```

### Coding Mode (resizable panels)
```
┌─────────────────────────────────────────────────────────┐
│ AI Interview  │ JavaScript │ Live │ 19:12 │ [Bot] [⛶] │
├──────────┬───────────────────────────┬──────────────────┤
│ Problems │                           │                  │
│ ┌──────┐ │  Monaco Editor            │  Agent Panel     │
│ │ Q1 ● │ │  function twoSum(...)     │  Alex ● Speaking │
│ │ Q2   │ │                           │  Sarah ○ Idle    │
│ │ Q3   │ ├───────────────────────────┤  James ○ Idle    │
│ └──────┘ │  [Output] [Test Results]  │                  │
├──────────┤  > Run your code...       │                  │
│ Q1 Title │                           │                  │
│ Desc...  │                           │                  │
└──────────┴───────────────────────────┴──────────────────┘
```
*(Drag the vertical bar to resize the sidebar, drag the horizontal bar to resize the output panel)*
