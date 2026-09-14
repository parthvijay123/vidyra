"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { classroomApi, healthApi, Classroom } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import {
  BookOpen,
  Plus,
  MessageSquare,
  FileText,
  ArrowRight,
  ExternalLink,
  Cpu,
  Layers,
  Database,
  Terminal,
} from "lucide-react";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState<"healthy" | "unhealthy" | "checking">("checking");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const health = await healthApi.check();
        setHealthStatus(health.status === "healthy" ? "healthy" : "unhealthy");

        if (isAuthenticated) {
          const classroomsData = await classroomApi.getCourses();
          setClassrooms(Array.isArray(classroomsData) ? classroomsData : []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        if (isAuthenticated) {
          toast.error("Unable to load repository data");
        }
        setHealthStatus("unhealthy");
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [isAuthenticated, authLoading]);

  const operations = [
    {
      index: "OP-01",
      title: "Classroom Archives",
      description: "Import course files, syllabus PDFs, and lecture materials from Google Classroom.",
      href: "/classrooms",
      action: "Manage Archives",
      icon: BookOpen,
    },
    {
      index: "OP-02",
      title: "Document Ledger",
      description: "Upload academic papers and vector-index them into 768-dimensional space.",
      href: "/classrooms",
      action: "Examine Files",
      icon: FileText,
    },
    {
      index: "OP-03",
      title: "AI Study Console",
      description: "Perform cited research queries against indexed course materials with page references.",
      href: "/chat",
      action: "Launch Console",
      icon: MessageSquare,
    },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="mb-8 border-b border-border pb-6">
        <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground uppercase tracking-widest mb-2">
          <span>SERIES 01</span>
          <span>//</span>
          <span>CONSOLE OVERVIEW</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl text-foreground font-normal tracking-tight">
              Welcome back, {user?.name?.split(" ")[0] || "Scholar"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Workspace connected to Supabase pgvector storage and Groq Llama-3.3 inference engine.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/classrooms">
              <Button size="sm" className="rounded-xs font-mono text-xs gap-2">
                <Plus className="w-3.5 h-3.5" />
                Sync Classroom
              </Button>
            </Link>
            <Link href="/chat">
              <Button size="sm" variant="outline" className="rounded-xs font-mono text-xs gap-2">
                <Terminal className="w-3.5 h-3.5" />
                Open Console
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Telemetry Strip */}
      <div className="mb-8 border border-border bg-card/60 p-4 rounded-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                healthStatus === "healthy"
                  ? "bg-emerald-500 animate-pulse"
                  : healthStatus === "checking"
                  ? "bg-amber-500 animate-pulse"
                  : "bg-destructive"
              }`}
            />
            <span className="text-muted-foreground">SERVER:</span>
            <span className="text-foreground font-semibold">
              {healthStatus === "healthy"
                ? "ONLINE"
                : healthStatus === "checking"
                ? "DIAGNOSING"
                : "OFFLINE"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-primary" />
            <span className="text-muted-foreground">VECTORS:</span>
            <span className="text-foreground font-semibold">PGVECTOR 768-D</span>
          </div>

          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-primary" />
            <span className="text-muted-foreground">INFERENCE:</span>
            <span className="text-foreground font-semibold">GROQ LLAMA-3.3</span>
          </div>

          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span className="text-muted-foreground">RETRIEVAL:</span>
            <span className="text-foreground font-semibold">HYBRID (HNSW+FTS)</span>
          </div>
        </div>
      </div>

      {/* Metrics Ledger */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="border border-border bg-card p-5 rounded-xs">
          <div className="text-[11px] font-mono text-muted-foreground uppercase mb-1">
            01 // Ingested Courses
          </div>
          <div className="font-serif text-3xl text-foreground font-normal tabular-nums my-2">
            {isLoading ? "—" : classrooms.length}
          </div>
          <p className="text-xs text-muted-foreground">
            Active repositories synchronized from Google Classroom
          </p>
        </div>

        <div className="border border-border bg-card p-5 rounded-xs">
          <div className="text-[11px] font-mono text-muted-foreground uppercase mb-1">
            02 // Vector Embeddings
          </div>
          <div className="font-serif text-3xl text-foreground font-normal tabular-nums my-2">
            768-Dim
          </div>
          <p className="text-xs text-muted-foreground">
            Gemini embedding-001 dense semantic representation
          </p>
        </div>

        <div className="border border-border bg-card p-5 rounded-xs">
          <div className="text-[11px] font-mono text-muted-foreground uppercase mb-1">
            03 // Context Retrieval
          </div>
          <div className="font-serif text-3xl text-foreground font-normal tabular-nums my-2">
            Top-5 Citations
          </div>
          <p className="text-xs text-muted-foreground">
            Cosine similarity with reciprocal rank fusion scoring
          </p>
        </div>

        <div className="border border-border bg-card p-5 rounded-xs">
          <div className="text-[11px] font-mono text-muted-foreground uppercase mb-1">
            04 // Generation Speed
          </div>
          <div className="font-serif text-3xl text-foreground font-normal tabular-nums my-2">
            ~280 t/s
          </div>
          <p className="text-xs text-muted-foreground">
            Hardware-accelerated LPUs with verified token streaming
          </p>
        </div>
      </div>

      {/* Recent Classrooms Dossier */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
          <div>
            <h2 className="font-serif text-xl font-normal text-foreground">
              Repository Dossiers
            </h2>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              RECENTLY SYNCHRONIZED ACADEMIC SECTIONS
            </p>
          </div>
          <Link href="/classrooms">
            <Button variant="ghost" size="sm" className="font-mono text-xs gap-1.5 hover:bg-secondary">
              View All Classrooms
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 border border-border bg-card rounded-xs">
            <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
              <Spinner className="w-4 h-4 text-primary" />
              <span>Querying local database catalog...</span>
            </div>
          </div>
        ) : classrooms.length === 0 ? (
          <div className="border border-dashed border-border bg-card/40 p-10 text-center rounded-xs">
            <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-60" />
            <h3 className="font-serif text-lg text-foreground font-normal mb-1">
              No Course Repositories Found
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mb-5 font-mono">
              Connect your Google Classroom account to import course materials, lecture syllabi, and reference readings.
            </p>
            <Link href="/classrooms">
              <Button size="sm" className="rounded-xs font-mono text-xs gap-2">
                <Plus className="w-3.5 h-3.5" />
                Synchronize First Classroom
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {classrooms.slice(0, 3).map((classroom, idx) => (
              <div
                key={classroom.id}
                className="border border-border bg-card p-5 rounded-xs flex flex-col justify-between hover:border-primary/50 transition-colors group"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground mb-2">
                    <span>CATALOG #{String(idx + 1).padStart(2, "0")}</span>
                    {classroom.classroom_id && (
                      <a
                        href={`https://classroom.google.com/c/${classroom.classroom_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors flex items-center gap-1"
                        title="Open Classroom in external tab"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <h3 className="font-serif text-lg text-foreground font-normal line-clamp-1 mb-1">
                    {classroom.name}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                    {classroom.section || classroom.description || "Course materials repository without description."}
                  </p>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-mono">
                  <span
                    className={`px-2 py-0.5 rounded-xs text-[10px] uppercase font-bold tracking-wider ${
                      classroom.sync_status === "completed"
                        ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40"
                        : classroom.sync_status === "syncing"
                        ? "bg-amber-950/40 text-amber-400 border border-amber-800/40"
                        : classroom.sync_status === "failed"
                        ? "bg-destructive/20 text-destructive border border-destructive/40"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {classroom.sync_status === "completed"
                      ? "INDEXED"
                      : classroom.sync_status === "syncing"
                      ? "INDEXING"
                      : classroom.sync_status === "failed"
                      ? "FAILED"
                      : "PENDING"}
                  </span>

                  <Link
                    href={`/classrooms/${classroom.id}`}
                    className="text-primary hover:underline flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Operational Workflows */}
      <div>
        <div className="mb-4 border-b border-border pb-3">
          <h2 className="font-serif text-xl font-normal text-foreground">
            Operational Workflows
          </h2>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">
            AVAILABLE AGENTIC ROUTINES IN VIDYRA
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {operations.map((op) => (
            <Link key={op.index} href={op.href} className="group">
              <div className="border border-border bg-card p-5 rounded-xs h-full flex flex-col justify-between group-hover:border-primary/50 transition-colors">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground mb-3">
                    <span className="text-primary font-bold">[{op.index}]</span>
                    <op.icon className="w-4 h-4 opacity-60" />
                  </div>
                  <h3 className="font-serif text-base text-foreground font-normal mb-2">
                    {op.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    {op.description}
                  </p>
                </div>
                <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-mono text-primary group-hover:underline">
                  <span>{op.action}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
