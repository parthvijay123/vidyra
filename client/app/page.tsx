"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ArrowUpRight, Check, ShieldCheck, Database, Cpu, Compass } from "lucide-react";

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="w-6 h-6 text-primary" />
      </div>
    );
  }

  const pipelineSteps = [
    {
      step: "01",
      title: "Classroom Ingestion",
      summary: "Syncs directly with Google Classroom to mirror course syllabi, assignments, and uploaded lecture attachments.",
      detail: "Google Classroom & Drive API",
    },
    {
      step: "02",
      title: "Layout-Aware Parsing",
      summary: "Extracts multi-modal slide decks, scans, and PDF notes while preserving tables, diagrams, and section headings.",
      detail: "PyMuPDF & Structured Extraction",
    },
    {
      step: "03",
      title: "Hybrid Vector Memory",
      summary: "Indexes passages into PostgreSQL with HNSW cosine search and Full-Text Search using 768-dim embeddings.",
      detail: "Supabase pgvector + Gemini",
    },
    {
      step: "04",
      title: "Cited Agentic Answers",
      summary: "Every answer provided is anchored by numbered citations referencing specific file names, slides, and page numbers.",
      detail: "ReAct Agent (LangGraph)",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Editorial Header / Masthead */}
      <header className="border-b border-border bg-background/95 backdrop-blur-xs sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-baseline gap-4">
            <Link href="/" className="font-serif text-2xl font-normal tracking-tight text-foreground hover:text-primary transition-colors">
              Vidyra
            </Link>
            <span className="hidden sm:inline font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
              [SYS.ACADEMIC_RAG v1.0]
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>POSTGRES PGVECTOR ACTIVE</span>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="font-mono text-xs uppercase tracking-wider h-9 px-4 rounded-xs text-foreground/80 hover:text-foreground">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="font-mono text-xs uppercase tracking-wider h-9 px-4 rounded-xs bg-primary text-primary-foreground hover:bg-primary/90">
                  Open Workspace
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section — Asymmetric & Editorial */}
      <main className="flex-1">
        <section className="border-b border-border py-16 sm:py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
              
              {/* Left Column: Authoritative Editorial Statement */}
              <div className="lg:col-span-7 space-y-8">
                <div className="inline-flex items-center gap-2 border border-border bg-card px-3 py-1 rounded-xs font-mono text-xs text-primary tracking-wide">
                  <span>AUDITABLE AI TUTOR</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-muted-foreground">ZERO GUESSWORK</span>
                </div>

                <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal tracking-tight leading-[1.04] text-foreground text-balance">
                  Study from your syllabus. <br className="hidden sm:inline" />
                  <span className="italic font-serif text-primary">Verify every footnote.</span>
                </h1>

                <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl font-sans">
                  Vidyra connects directly to your Google Classroom coursework. It indexes assigned papers, slide decks, and lecture notes into an auditable vector store—delivering answers backed by verbatim file citations and slide coordinates.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <Link href="/login">
                    <Button size="lg" className="h-12 px-7 rounded-xs font-mono text-xs uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 gap-2 w-full sm:w-auto">
                      Connect Google Classroom
                      <ArrowUpRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="lg" variant="outline" className="h-12 px-7 rounded-xs font-mono text-xs uppercase tracking-wider border-border hover:bg-card w-full sm:w-auto">
                      Create Manual Account
                    </Button>
                  </Link>
                </div>

                {/* Micro Metadata Metrics */}
                <div className="pt-8 border-t border-border grid grid-cols-3 gap-6 font-mono text-xs text-muted-foreground">
                  <div>
                    <span className="block text-foreground text-sm font-semibold mb-0.5">768 Dim</span>
                    <span>Gemini Embeddings</span>
                  </div>
                  <div>
                    <span className="block text-foreground text-sm font-semibold mb-0.5">Exact HNSW</span>
                    <span>Cosine Distance</span>
                  </div>
                  <div>
                    <span className="block text-foreground text-sm font-semibold mb-0.5">Footnoted</span>
                    <span>Slide Citations</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Grounded Specimen View */}
              <div className="lg:col-span-5 bg-card border border-border p-6 rounded-xs shadow-xs relative">
                <div className="flex items-center justify-between border-b border-border pb-3 mb-4 font-mono text-xs text-muted-foreground">
                  <span className="text-primary font-semibold">// SPECIMEN RETRIEVAL TRACE</span>
                  <span>SESSION: #vid-982f</span>
                </div>

                {/* User Prompt */}
                <div className="mb-4">
                  <span className="font-mono text-[11px] text-muted-foreground uppercase block mb-1">Student Query</span>
                  <div className="bg-background border border-border p-3 rounded-xs text-sm font-sans text-foreground">
                    &quot;Why does the rank of a matrix equal the dimension of its column space?&quot;
                  </div>
                </div>

                {/* Retrieved Document Chunk with Highlight */}
                <div className="mb-4">
                  <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground mb-1">
                    <span>Retrieved Passage (Vector Chunk 04)</span>
                    <span className="text-primary">SCORE: 0.941</span>
                  </div>
                  <div className="bg-background/80 border border-border p-3.5 rounded-xs text-xs font-mono leading-relaxed text-muted-foreground">
                    <p>
                      &quot;...by Theorem 4.2, the row rank and column rank of any matrix are equal. <mark className="bg-primary/20 text-foreground px-1 py-0.5 rounded-xs font-medium">The dimension of the vector space spanned by its columns constitutes the fundamental column rank</mark>, verified under echelon reduction...&quot;
                    </p>
                  </div>
                </div>

                {/* Synthesized Footnote Card */}
                <div className="border border-primary/30 bg-primary/5 p-3.5 rounded-xs">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-xs bg-primary text-primary-foreground font-mono text-[10px] font-bold">
                      1
                    </span>
                    <span className="font-mono text-xs font-semibold text-foreground">
                      Linear_Algebra_Lecture_04.pdf
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground ml-auto">
                      Page 14 · Slide 28
                    </span>
                  </div>
                  <p className="text-xs text-foreground/90 font-sans leading-normal">
                    Column rank corresponds to the number of pivot columns in row echelon form, as proven in Lecture 4.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                  <span>LATENCY: 84ms</span>
                  <span className="text-emerald-500">GROUNDED FACTUAL</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Technical Ledger — Replacing Standard 4-Card Grid */}
        <section className="border-b border-border py-20 lg:py-28 bg-card/40">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <span className="font-mono text-xs text-primary uppercase tracking-wider block mb-3">
                // System Architecture
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-foreground font-normal tracking-tight">
                Designed like a laboratory instrument, not a generic chatbot.
              </h2>
            </div>

            <div className="border-t border-border divide-y divide-border">
              {pipelineSteps.map((step) => (
                <div key={step.step} className="py-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-baseline">
                  <div className="md:col-span-2 font-mono text-xl text-primary font-normal">
                    [{step.step}]
                  </div>
                  <div className="md:col-span-4">
                    <h3 className="font-serif text-xl sm:text-2xl text-foreground font-normal tracking-tight">
                      {step.title}
                    </h3>
                    <span className="font-mono text-xs text-muted-foreground block mt-1">
                      {step.detail}
                    </span>
                  </div>
                  <div className="md:col-span-6 text-muted-foreground text-sm sm:text-base font-sans leading-relaxed">
                    {step.summary}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Technical Contrast / Architectural Rigor */}
        <section className="border-b border-border py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              
              <div className="lg:col-span-5 space-y-4">
                <span className="font-mono text-xs text-primary uppercase tracking-wider block">
                  // Direct Verification
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl text-foreground font-normal tracking-tight leading-snug">
                  The difference between guessing and citations.
                </h2>
                <p className="text-muted-foreground font-sans leading-relaxed text-sm sm:text-base">
                  Standard language models invent page numbers and blur textbooks together. Vidyra enforces a hard barrier between external knowledge and your coursework files.
                </p>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-px bg-border border border-border rounded-xs overflow-hidden">
                <div className="bg-card p-6 space-y-3">
                  <span className="font-mono text-xs text-destructive uppercase tracking-wider font-semibold block">
                    Generic Chatbots
                  </span>
                  <ul className="space-y-2.5 text-xs text-muted-foreground font-sans">
                    <li className="flex items-start gap-2">
                      <span className="text-destructive font-mono mt-0.5">✕</span>
                      <span>Fabricates page citations when uncertain</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive font-mono mt-0.5">✕</span>
                      <span>Blurs syllabi across unrelated academic subjects</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive font-mono mt-0.5">✕</span>
                      <span>Fails to parse tables and diagrams inside slides</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive font-mono mt-0.5">✕</span>
                      <span>Manual, tedious copy-pasting of lecture files</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-card p-6 space-y-3">
                  <span className="font-mono text-xs text-emerald-400 uppercase tracking-wider font-semibold block">
                    Vidyra Engine
                  </span>
                  <ul className="space-y-2.5 text-xs text-foreground/90 font-sans">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Verifiable citations with page and slide numbers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Isolated course collections per classroom</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Layout-aware PDF, PPTX, and Docx chunking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Continuous sync with Google Classroom courses</span>
                    </li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Asymmetric Bottom Call-to-Action */}
        <section className="py-20 lg:py-28 border-b border-border bg-card/20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="border border-border p-8 sm:p-12 lg:p-16 rounded-xs bg-card flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="max-w-xl space-y-4">
                <span className="font-mono text-xs text-primary uppercase tracking-widest block">
                  // START STUDYING ACCURATELY
                </span>
                <h2 className="font-serif text-3xl sm:text-5xl text-foreground font-normal tracking-tight leading-tight">
                  Connect your classroom in sixty seconds.
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base font-sans leading-relaxed">
                  Sign in with your Google account, select the courses you want indexed, and begin querying your study materials with zero hallucinations.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch gap-4 shrink-0">
                <Link href="/login">
                  <Button size="lg" className="h-12 px-8 rounded-xs font-mono text-xs uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 gap-2 w-full sm:w-auto">
                    Sign in with Google
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="outline" className="h-12 px-6 rounded-xs font-mono text-xs uppercase tracking-wider border-border hover:bg-card w-full sm:w-auto">
                    Register Email
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Editorial Colophon / Footer */}
      <footer className="py-12 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start mb-8">
            <div className="md:col-span-5 space-y-2">
              <span className="font-serif text-xl tracking-tight text-foreground block">Vidyra</span>
              <p className="text-xs text-muted-foreground font-sans max-w-sm leading-relaxed">
                Academic retrieval engine powered by PostgreSQL, pgvector HNSW indexing, Google Gemini embeddings, and LangGraph.
              </p>
            </div>

            <div className="md:col-span-7 flex flex-wrap items-center justify-between gap-6 font-mono text-xs text-muted-foreground">
              <div>
                <span className="text-foreground block mb-1">Architecture</span>
                <span>Hybrid RAG / ReAct</span>
              </div>
              <div>
                <span className="text-foreground block mb-1">Embeddings</span>
                <span>768-dim (Gemini)</span>
              </div>
              <div>
                <span className="text-foreground block mb-1">Vector DB</span>
                <span>Supabase pgvector</span>
              </div>
              <div>
                <span className="text-foreground block mb-1">Inference</span>
                <span>Groq Llama-3</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs text-muted-foreground">
            <span>© Vidyra Academic Systems. All rights reserved.</span>
            <div className="flex items-center gap-6">
              <Link href="/login" className="hover:text-foreground transition-colors">Access</Link>
              <Link href="/register" className="hover:text-foreground transition-colors">Register</Link>
              <Link href="/dashboard" className="hover:text-foreground transition-colors">Workspace</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
