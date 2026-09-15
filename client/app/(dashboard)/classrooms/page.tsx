"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { classroomApi, Classroom } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { BookOpen, RefreshCw, ExternalLink, ArrowRight, FolderKanban, ShieldCheck } from "lucide-react";

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchClassrooms = async () => {
    try {
      const data = await classroomApi.getCourses();
      setClassrooms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch classrooms:", error);
      toast.error("Failed to load course catalog");
      setClassrooms([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const courses = await classroomApi.syncCourses();
      if (Array.isArray(courses)) {
        setClassrooms(courses);
      } else {
        await fetchClassrooms();
      }
      toast.success("Courses synchronized from Google Classroom");
    } catch (error) {
      console.error("Failed to sync:", error);
      toast.error(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="mb-8 border-b border-border pb-6">
        <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground uppercase tracking-widest mb-2">
          <span>DIRECTORY 02</span>
          <span>//</span>
          <span>GOOGLE CLASSROOM REPOSITORY</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl text-foreground font-normal tracking-tight">
              Classroom Archives
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Course catalogs synchronized via OAuth with Google Classroom and Drive for document extraction.
            </p>
          </div>
          <Button
            onClick={handleSync}
            disabled={isSyncing}
            size="sm"
            className="rounded-xs font-mono text-xs gap-2 shrink-0"
          >
            {isSyncing ? (
              <Spinner className="w-3.5 h-3.5" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>{isSyncing ? "SYNCHRONIZING..." : "PULL LATEST COURSES"}</span>
          </Button>
        </div>
      </div>

      {/* Directory Diagnostics */}
      <div className="mb-8 border border-border bg-card/60 p-4 rounded-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FolderKanban className="w-3.5 h-3.5 text-primary" />
            <span>TOTAL ENROLLED:</span>
            <span className="text-foreground font-semibold">
              {isLoading ? "—" : `${classrooms.length} SECTIONS`}
            </span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>AUTHENTICATION:</span>
            <span className="text-foreground font-semibold">FERNET OAUTH2 TOKEN</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <span>UPSTREAM:</span>
            <span className="text-foreground font-semibold">CLASSROOM API V1</span>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 border border-border bg-card rounded-xs">
          <Spinner className="w-6 h-6 text-primary mb-3" />
          <p className="font-mono text-xs text-muted-foreground">
            Querying active course metadata from Supabase database...
          </p>
        </div>
      ) : classrooms.length === 0 ? (
        <div className="border border-dashed border-border bg-card/40 p-12 text-center rounded-xs">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="font-serif text-xl text-foreground font-normal mb-2">
            No Synchronized Classrooms
          </h2>
          <p className="text-xs font-mono text-muted-foreground max-w-lg mx-auto mb-6 leading-relaxed">
            Your Vidyra workspace does not yet have indexed classrooms. Click below to fetch active courses and their associated drive documents.
          </p>
          <Button
            onClick={handleSync}
            disabled={isSyncing}
            size="sm"
            className="rounded-xs font-mono text-xs gap-2"
          >
            {isSyncing ? (
              <Spinner className="w-3.5 h-3.5" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Synchronize From Google Classroom
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classrooms.map((classroom, index) => (
            <div
              key={classroom.id}
              className="border border-border bg-card p-6 rounded-xs flex flex-col justify-between hover:border-primary/50 transition-colors group"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground mb-3">
                  <span className="text-primary font-bold">
                    [CRS-{String(index + 1).padStart(2, "0")}]
                  </span>
                  {classroom.classroom_id && (
                    <a
                      href={`https://classroom.google.com/c/${classroom.classroom_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 text-[11px]"
                      title="Open in Google Classroom"
                    >
                      <span className="font-mono text-[10px]">UPSTREAM</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <h2 className="font-serif text-xl text-foreground font-normal mb-2 leading-snug">
                  {classroom.name}
                </h2>

                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                  {classroom.section || classroom.description || "Course repository without supplemental metadata."}
                </p>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {classroom.room && (
                    <span className="px-2 py-0.5 rounded-xs text-[10px] font-mono bg-secondary text-secondary-foreground">
                      LOC: {classroom.room}
                    </span>
                  )}
                  {classroom.last_synced && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      SYNC: {new Date(classroom.last_synced).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between">
                <span
                  className={`px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold uppercase tracking-wider ${
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
                    ? "SYNCING"
                    : classroom.sync_status === "failed"
                    ? "FAILED"
                    : "PENDING"}
                </span>

                <Link
                  href={`/classrooms/${classroom.id}`}
                  className="font-mono text-xs text-primary hover:underline flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Inspect Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
