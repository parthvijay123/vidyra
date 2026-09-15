"use client";

import { use, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  classroomApi,
  filesApi,
  indexingApi,
  Classroom,
  FileItem,
  getGroqKey,
  getCachedCourseFiles,
  updateCachedCourseFile,
  upsertCachedCourseFile,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import {
  ArrowLeft,
  Upload,
  FileText,
  Trash2,
  MessageSquare,
  RefreshCw,
  ExternalLink,
  Layers,
  Database,
  Cpu,
} from "lucide-react";

interface ClassroomDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ClassroomDetailPage({ params }: ClassroomDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncingFiles, setIsSyncingFiles] = useState(false);
  const [indexingFileIds, setIndexingFileIds] = useState<Set<string>>(new Set());
  const [showFilesUnavailableHint, setShowFilesUnavailableHint] = useState(false);
  const pollingIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const fetchCourseFiles = useCallback(async () => {
    try {
      const filesData = await classroomApi.getCourseFiles(id);
      const cachedFiles = getCachedCourseFiles(id);
      const shouldShowHint = filesData.length === 0 && cachedFiles.length === 0;
      setShowFilesUnavailableHint(shouldShowHint);

      setFiles((prev) => {
        if (filesData.length === 0 && prev.length > 0) {
          return prev;
        }
        return filesData;
      });
    } catch (error) {
      console.error("Failed to fetch files:", error);
    }
  }, [id]);

  const fetchData = useCallback(async () => {
    try {
      const courses = await classroomApi.getCourses();
      const course = courses.find((c) => c.id === id);
      if (course) {
        setClassroom(course);
      }
      await fetchCourseFiles();
    } catch (error) {
      console.error("Failed to fetch classroom:", error);
      toast.error("Failed to load classroom dossier");
      router.push("/classrooms");
    } finally {
      setIsLoading(false);
    }
  }, [id, router, fetchCourseFiles]);

  useEffect(() => {
    fetchData();

    return () => {
      pollingIntervals.current.forEach((interval) => clearInterval(interval));
    };
  }, [fetchData]);

  // Poll for indexing status
  const pollIndexingStatus = useCallback((fileId: string) => {
    const interval = setInterval(async () => {
      try {
        const status = await indexingApi.getFileStatus(fileId);
        if (status.status === "completed") {
          clearInterval(interval);
          pollingIntervals.current.delete(fileId);
          setIndexingFileIds((prev) => {
            const next = new Set(prev);
            next.delete(fileId);
            return next;
          });
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileId ? { ...f, indexing_status: "completed", indexed: true } : f
            )
          );
          updateCachedCourseFile(id, fileId, { indexing_status: "completed", indexed: true });
          toast.success("File indexed into pgvector memory");
        } else if (status.status === "failed") {
          clearInterval(interval);
          pollingIntervals.current.delete(fileId);
          setIndexingFileIds((prev) => {
            const next = new Set(prev);
            next.delete(fileId);
            return next;
          });
          setFiles((prev) =>
            prev.map((f) => (f.id === fileId ? { ...f, indexing_status: "failed" } : f))
          );
          updateCachedCourseFile(id, fileId, { indexing_status: "failed", indexed: false });
          toast.error("Failed to vectorize file");
        }
      } catch {
        // Continue polling
      }
    }, 3000);

    pollingIntervals.current.set(fileId, interval);
  }, [id]);

  const handleSyncFiles = async () => {
    setIsSyncingFiles(true);
    try {
      const result = await classroomApi.syncCourseFiles(id);
      toast.success(result.message || "File ingestion initiated in background");

      let attempts = 0;
      const maxAttempts = 15;
      const pollInterval = 4000;

      const poll = async () => {
        attempts++;
        try {
          const courseStatus = await classroomApi.getCourseStatus(id);
          if (courseStatus) {
            setClassroom(courseStatus);
          }

          await fetchCourseFiles();

          const status = courseStatus?.sync_status;
          if (status === "completed" || status === "failed") {
            setIsSyncingFiles(false);
            if (status === "completed") {
              toast.success("Course files ingested successfully");
            } else {
              toast.error("File sync encountered errors on some items");
            }
            return;
          }

          if (attempts < maxAttempts) {
            setTimeout(poll, pollInterval);
          } else {
            setIsSyncingFiles(false);
            toast.info("Ingestion continuing in background task");
          }
        } catch {
          if (attempts < maxAttempts) {
            setTimeout(poll, pollInterval);
          } else {
            setIsSyncingFiles(false);
          }
        }
      };

      setTimeout(poll, 2000);
    } catch (error) {
      setIsSyncingFiles(false);
      toast.error(error instanceof Error ? error.message : "Ingestion failed");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploaded = await filesApi.upload(file, id);

      setFiles((prev) => {
        const exists = prev.some((f) => f.id === uploaded.file_id);
        if (exists) return prev;

        return [
          {
            id: uploaded.file_id,
            filename: uploaded.file_name || file.name,
            file_type: file.type || "uploaded",
            course_id: id,
            indexed: false,
            indexing_status: "pending",
          },
          ...prev,
        ];
      });

      upsertCachedCourseFile(id, {
        id: uploaded.file_id,
        filename: uploaded.file_name || file.name,
        file_type: file.type || "uploaded",
        course_id: id,
        indexed: false,
        indexing_status: "pending",
      });

      toast.success("Document uploaded to course archive");
      void fetchCourseFiles();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload document");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleIndexFile = async (fileId: string) => {
    if (!getGroqKey()) {
      toast.error("Groq API key required. Configure your key in the AI Chat console.");
      return;
    }

    setIndexingFileIds((prev) => new Set(prev).add(fileId));
    try {
      await indexingApi.indexFile(fileId);
      toast.info("Vectorizing document into 768-D space...");
      updateCachedCourseFile(id, fileId, { indexing_status: "processing", indexed: false });
      pollIndexingStatus(fileId);
    } catch (error) {
      setIndexingFileIds((prev) => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });

      const errorMessage = error instanceof Error ? error.message : "Failed to start indexing";

      if (errorMessage.toLowerCase().includes("already indexed")) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, indexed: true, indexing_status: "completed" } : f
          )
        );
        updateCachedCourseFile(id, fileId, { indexed: true, indexing_status: "completed" });
        toast.success("Document is already indexed and queryable.");
        return;
      }

      toast.error(errorMessage);
    }
  };

  const handleIndexAllFiles = async () => {
    if (!getGroqKey()) {
      toast.error("Groq API key required. Configure your key in the AI Chat console.");
      return;
    }

    try {
      await indexingApi.indexCourse(id);
      toast.info("Batch vectorization dispatched. Embedding all corpus documents...");
      files.forEach((file) => {
        if (!file.indexed && file.indexing_status !== "completed") {
          setIndexingFileIds((prev) => new Set(prev).add(file.id));
          pollIndexingStatus(file.id);
        }
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Batch indexing failed");
    }
  };

  const handleDeleteFromMemory = async (fileId: string) => {
    if (!confirm("Purge vector embeddings for this file from pgvector memory? The document record will be kept.")) return;

    try {
      await indexingApi.deleteFile(fileId);
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, indexed: false, indexing_status: "pending" } : f))
      );
      updateCachedCourseFile(id, fileId, { indexed: false, indexing_status: "pending" });
      toast.success("Document vectors removed from active index");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to purge vectors");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] font-mono text-xs text-muted-foreground">
        <Spinner className="w-6 h-6 text-primary mb-3" />
        <span>Loading classroom archival record...</span>
      </div>
    );
  }

  if (!classroom) {
    return null;
  }

  const indexedCount = files.filter((f) => f.indexed || f.indexing_status === "completed").length;
  const coveragePercent = files.length > 0 ? Math.round((indexedCount / files.length) * 100) : 0;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto font-sans">
      {/* Back Link */}
      <div className="mb-6">
        <Link href="/classrooms">
          <Button variant="ghost" size="sm" className="font-mono text-xs gap-1.5 hover:bg-secondary">
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Classroom Archives
          </Button>
        </Link>
      </div>

      {/* Dossier Masthead */}
      <div className="border border-border bg-card p-6 md:p-8 rounded-xs mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground uppercase">
              <span className="text-primary font-bold">[DOSSIER]</span>
              <span>//</span>
              <span>REF: {id.slice(0, 12)}</span>
            </div>

            <h1 className="font-serif text-3xl md:text-4xl text-foreground font-normal tracking-tight">
              {classroom.name}
            </h1>

            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {classroom.section || classroom.description || "Archival repository initialized without supplemental description."}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              {classroom.room && (
                <span className="px-2.5 py-1 rounded-xs text-[11px] font-mono bg-secondary text-secondary-foreground">
                  ROOM: {classroom.room}
                </span>
              )}

              <span
                className={`px-2.5 py-1 rounded-xs text-[11px] font-mono font-bold uppercase tracking-wider ${
                  classroom.sync_status === "completed"
                    ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40"
                    : classroom.sync_status === "syncing"
                    ? "bg-amber-950/40 text-amber-400 border border-amber-800/40"
                    : classroom.sync_status === "failed"
                    ? "bg-destructive/20 text-destructive border border-destructive/40"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                STATUS: {classroom.sync_status ? classroom.sync_status.toUpperCase() : "PENDING"}
              </span>

              {classroom.last_synced && (
                <span className="text-[11px] font-mono text-muted-foreground px-2">
                  LAST SYNC: {new Date(classroom.last_synced).toLocaleDateString()}
                </span>
              )}

              {classroom.classroom_id && (
                <a
                  href={`https://classroom.google.com/c/${classroom.classroom_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-primary hover:underline inline-flex items-center gap-1 ml-auto"
                >
                  <span>Google Classroom</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            <Link href={`/chat?course=${id}`} className="w-full">
              <Button className="w-full rounded-xs font-mono text-xs gap-2">
                <MessageSquare className="w-3.5 h-3.5" />
                Query in Study Console
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Vectorization Status & Ingestion Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Coverage Meter */}
        <div className="border border-border bg-card p-6 rounded-xs lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between font-mono text-xs text-muted-foreground uppercase mb-2">
              <span>VECTOR COVERAGE</span>
              <span className="text-foreground font-bold">{coveragePercent}%</span>
            </div>
            <div className="font-serif text-3xl text-foreground font-normal tabular-nums mb-1">
              {indexedCount} / {files.length}
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              Documents converted to 768-dim embeddings in Supabase pgvector.
            </p>
          </div>

          <div className="pt-4 border-t border-border mt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-xs font-mono text-xs gap-2"
              onClick={handleIndexAllFiles}
              disabled={files.length === 0 || indexedCount === files.length}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Vectorize Entire Corpus
            </Button>
          </div>
        </div>

        {/* Telemetry Architecture */}
        <div className="border border-border bg-card p-6 rounded-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="font-mono text-xs text-muted-foreground uppercase mb-3">
              RETRIEVAL APPARATUS // CONFIGURATION
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3 bg-secondary/30 border border-border rounded-xs">
                <div className="text-muted-foreground text-[10px] uppercase mb-1">EMBEDDING MODEL</div>
                <div className="text-foreground font-bold">gemini-embedding-001</div>
                <div className="text-muted-foreground text-[10px] mt-0.5">768-D Dense Vectors</div>
              </div>
              <div className="p-3 bg-secondary/30 border border-border rounded-xs">
                <div className="text-muted-foreground text-[10px] uppercase mb-1">VECTOR INDEX</div>
                <div className="text-foreground font-bold">HNSW (Cosine)</div>
                <div className="text-muted-foreground text-[10px] mt-0.5">m=16, ef_c=64</div>
              </div>
              <div className="p-3 bg-secondary/30 border border-border rounded-xs">
                <div className="text-muted-foreground text-[10px] uppercase mb-1">RAG SYNTHESIS</div>
                <div className="text-foreground font-bold">Groq Llama-3.3 70B</div>
                <div className="text-muted-foreground text-[10px] mt-0.5">Multi-Document Fusion</div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-4 flex items-center justify-between text-xs font-mono text-muted-foreground">
            <span>STORAGE: SUPABASE POSTGRESQL</span>
            <span>TOKEN BUDGET: 8,192 CONTEXT</span>
          </div>
        </div>
      </div>

      {/* Corpus Ledger */}
      <div className="border border-border bg-card rounded-xs overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl font-normal text-foreground">
              Document Ledger
            </h2>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              INDEXED SCHOLARLY ARTIFACTS AND LECTURE MATERIALS
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xs font-mono text-xs gap-2"
              onClick={handleSyncFiles}
              disabled={isSyncingFiles}
            >
              {isSyncingFiles ? <Spinner className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5 text-primary" />}
              <span>{isSyncingFiles ? "PULLING..." : "Pull Classroom Drive"}</span>
            </Button>

            <div className="relative">
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              <Button size="sm" className="rounded-xs font-mono text-xs gap-2" disabled={isUploading}>
                {isUploading ? <Spinner className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                <span>Upload PDF</span>
              </Button>
            </div>
          </div>
        </div>

        {files.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="font-serif text-lg text-foreground font-normal mb-1">
              {showFilesUnavailableHint ? "Corpus File Listing Unavailable" : "No Course Artifacts Present"}
            </h3>
            <p className="text-xs font-mono text-muted-foreground max-w-md mx-auto mb-5 leading-relaxed">
              {showFilesUnavailableHint
                ? "The backend file listing is currently unavailable. Upload local PDFs or study notes using the button above."
                : "Pull lecture slides, syllabi, or problem sets from Google Drive, or upload local academic files."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncFiles}
              disabled={isSyncingFiles}
              className="rounded-xs font-mono text-xs gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5 text-primary" />
              Dispatch Google Drive Sync
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {files.map((file, idx) => {
              const isIndexed = file.indexed || file.indexing_status === "completed";
              const isProcessing = indexingFileIds.has(file.id) || file.indexing_status === "processing";
              const isFailed = file.indexing_status === "failed";

              return (
                <div
                  key={file.id}
                  className="p-4 md:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/20 transition-colors"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <span className="font-mono text-xs text-muted-foreground mt-0.5">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {file.filename}
                        </p>
                        <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-mono uppercase bg-secondary text-secondary-foreground shrink-0">
                          {file.file_type.includes("pdf") ? "PDF" : file.file_type.slice(0, 8)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                        <span
                          className={`inline-flex items-center gap-1.5 ${
                            isIndexed
                              ? "text-emerald-400 font-bold"
                              : isProcessing
                              ? "text-amber-400 font-bold"
                              : isFailed
                              ? "text-destructive font-bold"
                              : "text-muted-foreground"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isIndexed
                                ? "bg-emerald-400"
                                : isProcessing
                                ? "bg-amber-400 animate-pulse"
                                : isFailed
                                ? "bg-destructive"
                                : "bg-muted-foreground/50"
                            }`}
                          />
                          {isIndexed
                            ? "VECTORIZED (768-D)"
                            : isProcessing
                            ? "EMBEDDING IN PROGRESS..."
                            : isFailed
                            ? "VECTORIZATION FAILED"
                            : "UNINDEXED ARTIFACT"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {isIndexed ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xs font-mono text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5"
                        onClick={() => handleDeleteFromMemory(file.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Purge Embeddings</span>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xs font-mono text-xs gap-1.5"
                        onClick={() => handleIndexFile(file.id)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Spinner className="w-3.5 h-3.5" />
                        ) : (
                          <Database className="w-3.5 h-3.5 text-primary" />
                        )}
                        <span>{isProcessing ? "Vectorizing..." : "Index for AI"}</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
