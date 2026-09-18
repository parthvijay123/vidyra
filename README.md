# Vidyra — Intelligent AI Learning Ecosystem

> **Vidyra** is a modern, unified academic intelligence platform. It bridges course materials (syllabi, slides, textbooks, lecture notes) from Google Classroom into an autonomous multi-modal Retrieval-Augmented Generation (RAG) agent, offering cited, verifiable answers, semantic course search, and automated study workflows.

---

## Architecture Overview

```mermaid
flowchart TD
    subgraph Client ["Client (Next.js 16 SPA / React 19)"]
        UI["Modern UI / Plus Jakarta Sans"]
        AuthContext["Auth Context & Cookie Session"]
        BFFProxy["BFF Proxy & Route Handler (/api/proxy)"]
        SSEListener["SSE Stream Parser & Citation Cards"]
    end

    subgraph Server ["Server (FastAPI / LangGraph / Uvicorn)"]
        FastAPIApp["FastAPI REST & SSE Gateway"]
        AuthModule["OAuth & Token Module (Fernet + JWT)"]
        CourseService["Google Classroom & Drive Sync"]
        DocPipeline["Document Pipeline (PyMuPDF / Docx / Images)"]
        VectorEngine["VidyraVectorStore (PGVector / HNSW)"]
        ReActAgent["Autonomous ReAct Tutor Agent (LangGraph)"]
    end

    subgraph ExternalServices ["External Infrastructure"]
        GoogleAPI["Google Classroom & Drive APIs"]
        SupabaseDB[("PostgreSQL + PGVector on Supabase")]
        GroqCloud["Groq Cloud Inference (LLM / Vision)"]
        GeminiAI["Google Gemini Embeddings (768-dim)"]
    end

    UI --> BFFProxy
    BFFProxy --> FastAPIApp
    FastAPIApp --> AuthModule
    AuthModule --> GoogleAPI
    CourseService --> GoogleAPI
    DocPipeline --> VectorEngine
    VectorEngine --> SupabaseDB
    ReActAgent --> VectorEngine
    ReActAgent --> GroqCloud
    DocPipeline --> GeminiAI
    FastAPIApp --> SSEListener
```

---

## Monorepo Structure

```text
vidyra/
├── package.json                 # Monorepo root scripts & concurrency runner
├── .gitignore                   # Workspace-wide git hygiene rules
├── README.md                    # System documentation & setup guide
├── client/                      # Frontend application (Next.js 16 + Tailwind CSS)
│   ├── app/                     # App router pages & layouts
│   │   ├── (auth)/              # Login, register, and OAuth callback routes
│   │   ├── (dashboard)/         # Dashboard, classroom explorer, and chat UI
│   │   ├── api/                 # BFF proxy & auth route handlers
│   │   ├── globals.css          # Vidyra design tokens (oklch palette, radius, fonts)
│   │   └── layout.tsx           # Root layout with 'Plus Jakarta Sans' typography
│   ├── components/              # UI components & responsive sidebar
│   ├── lib/                     # API client, auth context, and utilities
│   ├── package.json             # Vidyra client package definition
│   └── vercel.json              # Vercel deployment configuration
└── server/                      # Backend application (FastAPI + LangGraph)
    ├── app/
    │   ├── core/                # Database engines, config, security, exceptions
    │   ├── models/              # SQLAlchemy models (User, Course, File)
    │   ├── modules/             # Modular controllers (auth, courses, assets, indexing, chat)
    │   ├── processing/          # PDF, Word, PowerPoint, image extraction
    │   ├── rag/                 # VidyraVectorStore, retriever, prompts, memory, agent
    │   ├── services/            # Google Classroom & Drive integration
    │   ├── workflows/           # LangGraph indexing state graphs
    │   └── main.py              # Application factory & lifespan handlers
    ├── requirements.txt         # Python dependencies
    ├── render.yaml              # Render blueprint deployment
    ├── vercel.json              # Vercel Python serverless configuration
    └── Dockerfile               # Production container image
```

---

## Key Features

- **Google Classroom Ingestion**: One-click sync imports enrolled courses and material attachments directly via Google Drive API.
- **Multi-Modal Document Parsing**: Native extraction of text, visual schematics, slides, PDFs, and notes using PyMuPDF and layout-aware chunkers.
- **Hybrid RAG Retrieval**: Combines semantic embeddings with Full-Text Search (FTS) and HNSW indexing inside PostgreSQL.
- **Auditable In-Text Citations**: Every claim is tagged with exact source numbers, file names, page indices, and verbatim snippets.
- **Autonomous Tool Selection**: Built on LangGraph; the tutor agent autonomously invokes course search, flashcard synthesis, and topic summaries.
- **Secure Dual-Token Authentication**: HttpOnly access and refresh cookies paired with double-submit CSRF guards and Fernet token encryption at rest.

---

## Environment Variables

### Backend (`server/.env`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string with `asyncpg` | `postgresql+asyncpg://user:pass@host:5432/vidyra_db` |
| `JWT_SECRET` | Secret key for signing session JWTs | `openssl rand -hex 32` |
| `SECRET_KEY` | Starlette session encryption key | `openssl rand -hex 32` |
| `FERNET_KEY` | 32-byte Fernet key for encrypting OAuth tokens | Generated via `cryptography.fernet.Fernet.generate_key()` |
| `GROQ_API_KEY` | Groq Cloud API key for ultra-fast LLM inference | `gsk_...` |
| `GEMINI_API_KEY` | Google Gemini API key for 768-D dense embeddings | `AIzaSy...` |
| `GOOGLE_CLIENT_ID` | Google Cloud Console OAuth 2.0 Client ID | `...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console OAuth 2.0 Client Secret | `GOCSPX-...` |
| `GOOGLE_REDIRECT_URI` | Backend OAuth callback endpoint | `https://your-api.onrender.com/auth/callback` |
| `FRONTEND_URL` | Deployed frontend origin | `https://your-app.vercel.app` |
| `CLIENT_URL` | CORS allowlist origin for the frontend | `https://your-app.vercel.app` |

---

## Deployment Guide

### Deploying Backend to Render
1. Push your repository to GitHub.
2. In Render, select **New > Blueprint** and link your repo (Render will automatically detect `server/render.yaml`).
3. Set the required environment variables in the Render dashboard:
   - `DATABASE_URL`: Your Supabase connection string (`postgresql+asyncpg://...`)
   - `GROQ_API_KEY`: Your Groq API key (`gsk_...`)
   - `GEMINI_API_KEY`: Your Gemini API key (`AIzaSy...`)
   - `FERNET_KEY`: Generated 32-byte key
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
   - `CLIENT_URL` & `FRONTEND_URL`: Your Vercel frontend URL (e.g. `https://vidyra.vercel.app`)
   - `GOOGLE_REDIRECT_URI`: `https://<your-render-service>.onrender.com/auth/callback`

### Deploying Frontend to Vercel
1. Import the repository in Vercel.
2. Set **Root Directory** to `client`.
3. Framework Preset: **Next.js**.
4. Set Environment Variables:
   - `NEXT_PUBLIC_BACKEND_URL`: `https://<your-render-service>.onrender.com`
   - `BACKEND_URL`: `https://<your-render-service>.onrender.com`
5. Deploy! Once deployed, update your Google Cloud Console OAuth Authorized JavaScript Origins and Redirect URIs to match your live domains.

### Frontend (`client/.env.local`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_BACKEND_URL` | Public endpoint for backend API | `http://localhost:8000` or deployed URL |
| `BACKEND_URL` | Server-side endpoint used by Next.js proxy | `http://localhost:8000` or deployed URL |
| `NEXT_PUBLIC_CSRF_COOKIE_NAME` | Name of CSRF double-submit cookie | `vidyra_csrf_token` |
| `AUTH_COOKIE_ACCESS_NAME` | Name of access token cookie | `vidyra_access_token` |
| `AUTH_COOKIE_REFRESH_NAME` | Name of refresh token cookie | `vidyra_refresh_token` |

---

## Quickstart & Local Setup

### 1. Prerequisites
- **Node.js**: `v20+`
- **Python**: `3.11+`
- **PostgreSQL**: `15+` with `pgvector` extension enabled

### 2. Installation
```bash
# Clone and enter monorepo
cd vidyra

# Install frontend dependencies
cd client && npm install && cd ..

# Setup backend virtual environment
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

### 3. Environment Setup
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env.local
# Fill in your database and API credentials in both files
```

### 4. Running the Development Stack
```bash
# Run both client and server concurrently from the monorepo root:
npm run dev

# Or run individually:
# Client (http://localhost:3000):
npm run dev:client

# Server (http://localhost:8000):
npm run dev:server
```

