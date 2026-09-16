"use client";

import { useEffect, useState, useRef, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  classroomApi,
  chatApi,
  Classroom,
  ChatMessage,
  ChatSession,
  getGroqKey,
  setGroqKey,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Send,
  Plus,
  Trash2,
  History,
  Key,
  BookOpen,
  ArrowRight,
  Database,
  Quote,
  Terminal,
} from "lucide-react";

function ChatContent() {
  const STREAM_CHARS_PER_TICK = 5;
  const STREAM_TICK_MS = 45;

  const searchParams = useSearchParams();
  const initialCourse = searchParams.get("course");

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>(initialCourse || "");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamBufferRef = useRef("");
  const streamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamDrainResolverRef = useRef<(() => void) | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const appendAssistantDelta = useCallback((delta: string) => {
    if (!delta) {
      return;
    }

    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];

      if (!last || last.role !== "assistant") {
        next.push({ role: "assistant", content: delta });
        return next;
      }

      next[next.length - 1] = {
        ...last,
        content: `${last.content || ""}${delta}`,
      };
      return next;
    });
  }, []);

  const resolveStreamDrainIfIdle = useCallback(() => {
    if (!streamBufferRef.current && !streamTimerRef.current && streamDrainResolverRef.current) {
      const resolve = streamDrainResolverRef.current;
      streamDrainResolverRef.current = null;
      resolve();
    }
  }, []);

  const startStreamRenderer = useCallback(() => {
    if (streamTimerRef.current) {
      return;
    }

    streamTimerRef.current = setInterval(() => {
      if (!streamBufferRef.current) {
        if (streamTimerRef.current) {
          clearInterval(streamTimerRef.current);
          streamTimerRef.current = null;
        }
        resolveStreamDrainIfIdle();
        return;
      }

      const delta = streamBufferRef.current.slice(0, STREAM_CHARS_PER_TICK);
      streamBufferRef.current = streamBufferRef.current.slice(STREAM_CHARS_PER_TICK);
      appendAssistantDelta(delta);

      if (!streamBufferRef.current && streamTimerRef.current) {
        clearInterval(streamTimerRef.current);
        streamTimerRef.current = null;
        resolveStreamDrainIfIdle();
      }
    }, STREAM_TICK_MS);
  }, [appendAssistantDelta, resolveStreamDrainIfIdle]);

  const enqueueStreamDelta = useCallback(
    (delta: string) => {
      if (!delta) {
        return;
      }

      streamBufferRef.current += delta;
      startStreamRenderer();
    },
    [startStreamRenderer]
  );

  const stopStreamRenderer = useCallback(
    (flushRemaining: boolean) => {
      if (streamTimerRef.current) {
        clearInterval(streamTimerRef.current);
        streamTimerRef.current = null;
      }

      if (flushRemaining && streamBufferRef.current) {
        const pending = streamBufferRef.current;
        streamBufferRef.current = "";
        appendAssistantDelta(pending);
      } else if (!flushRemaining) {
        streamBufferRef.current = "";
      }

      resolveStreamDrainIfIdle();
    },
    [appendAssistantDelta, resolveStreamDrainIfIdle]
  );

  const waitForStreamDrain = useCallback(async () => {
    if (!streamBufferRef.current && !streamTimerRef.current) {
      return;
    }

    await new Promise<void>((resolve) => {
      streamDrainResolverRef.current = resolve;
    });
  }, []);

  useEffect(() => {
    return () => {
      stopStreamRenderer(false);
    };
  }, [stopStreamRenderer]);

  // Check if Groq API key is set
  useEffect(() => {
    const key = getGroqKey();
    if (!key) {
      setShowApiKeyDialog(true);
    }
  }, []);

  // Fetch classrooms
  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const data = await classroomApi.getCourses();
        const classroomsArray = Array.isArray(data) ? data : [];
        setClassrooms(classroomsArray);
        if (initialCourse && classroomsArray.some((c) => c.id === initialCourse)) {
          setSelectedCourse(initialCourse);
        }
      } catch (error) {
        console.error("Failed to fetch classrooms:", error);
        toast.error("Failed to load courses");
        setClassrooms([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassrooms();
  }, [initialCourse]);

  // Fetch sessions when we have a Groq key
  const fetchSessions = useCallback(async () => {
    const key = getGroqKey();
    if (!key) return;

    try {
      const sessionsData = await chatApi.getSessions();
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Load session history when selecting a session
  const loadSessionHistory = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    try {
      const history = await chatApi.getHistory(sessionId);
      setMessages(history);
    } catch (error) {
      console.error("Failed to load session history:", error);
      toast.error("Failed to load inquiry history");
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId("");
    setMessages([]);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Delete this inquiry thread from session history?")) return;

    try {
      await chatApi.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        handleNewChat();
      }
      toast.success("Inquiry session deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete session");
    }
  };

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast.error("Please enter a valid Groq API key");
      return;
    }
    setGroqKey(apiKey.trim());
    setShowApiKeyDialog(false);
    toast.success("Groq API key configured");
    fetchSessions();
  };

  const handleSend = async () => {
    const question = input.trim();
    if (!question || !selectedCourse) return;

    const key = getGroqKey();
    if (!key) {
      setShowApiKeyDialog(true);
      return;
    }

    const userMessage: ChatMessage = { role: "user", content: question };
    stopStreamRenderer(false);
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const response = await chatApi.queryStream(
        question,
        currentSessionId || undefined,
        selectedCourse || undefined,
        {
          onAnswer: (delta) => {
            enqueueStreamDelta(delta);
          },
        }
      );

      if (response && typeof response === "object" && response.session_id) {
        setCurrentSessionId(response.session_id);
      }

      let messageContent = "No response synthesized.";
      let citations: ChatMessage["citations"] = [];

      if (typeof response === "string") {
        messageContent = response;
      } else if (response && typeof response === "object") {
        messageContent =
          response.answer ||
          response.response ||
          response.message ||
          response.content ||
          JSON.stringify(response);
        citations = Array.isArray(response.citations) ? response.citations : [];
      }

      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];

        if (last?.role === "assistant") {
          next[next.length - 1] = {
            ...last,
            content: last.content || messageContent,
            citations,
          };
          return next;
        }

        next.push({
          role: "assistant",
          content: messageContent,
          citations,
        });
        return next;
      });

      await waitForStreamDrain();
      fetchSessions();
    } catch (streamError) {
      console.warn("[chat] Stream failed, falling back to one-shot response", streamError);
      stopStreamRenderer(false);

      setMessages((prev) => {
        const next = [...prev];
        if (next[next.length - 1]?.role === "assistant") {
          next.pop();
        }
        return next;
      });

      try {
        const response = await chatApi.query(
          question,
          currentSessionId || undefined,
          selectedCourse || undefined
        );

        if (response && typeof response === "object" && response.session_id) {
          setCurrentSessionId(response.session_id);
        }

        let messageContent = "No response received";
        let citations: ChatMessage["citations"] = [];

        if (typeof response === "string") {
          messageContent = response;
        } else if (response && typeof response === "object") {
          messageContent =
            response.answer ||
            response.response ||
            response.message ||
            response.content ||
            JSON.stringify(response);
          citations = Array.isArray(response.citations) ? response.citations : [];
        }

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: messageContent,
          citations,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        fetchSessions();
      } catch (error) {
        console.error("[chat] Query error:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast.error(errorMessage);

        setMessages((prev) => prev.slice(0, -1));
        setInput(question);

        if (
          errorMessage.toLowerCase().includes("api key") ||
          errorMessage.toLowerCase().includes("groq")
        ) {
          setShowApiKeyDialog(true);
        }
      }
    } finally {
      stopStreamRenderer(true);
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedClassroomData = classrooms.find((c) => c.id === selectedCourse);
  const isAssistantStreaming = isSending && messages[messages.length - 1]?.role === "assistant";

  const getSessionLabel = (session: ChatSession) => {
    if (session.created_at) {
      const createdAt = new Date(session.created_at);
      if (!Number.isNaN(createdAt.getTime())) {
        return createdAt.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    }

    return `Inquiry ${session.id.slice(-6)}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen font-mono text-xs text-muted-foreground">
        <Spinner className="w-6 h-6 text-primary mb-3" />
        <span>Initializing Study Console...</span>
      </div>
    );
  }

  return (
    <>
      {/* Groq Key Dialog */}
      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent className="border border-border bg-card rounded-xs max-w-md">
          <DialogHeader>
            <div className="font-mono text-[10px] text-primary uppercase font-bold mb-1">
              [CREDENTIALS REQUIRED]
            </div>
            <DialogTitle className="font-serif text-2xl font-normal text-foreground">
              Groq API Key
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Vidyra uses Groq hardware LPUs to run Llama-3.3-70B for zero-latency retrieval synthesis. Get your free key at{" "}
              <a
                href="https://console.groq.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2"
              >
                console.groq.com
              </a>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Input
              type="password"
              placeholder="gsk_..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono text-xs rounded-xs border-border bg-secondary/30"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApiKeyDialog(false)}
              className="rounded-xs font-mono text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveApiKey}
              className="rounded-xs font-mono text-xs"
            >
              Store Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex h-screen font-sans">
        {/* Sessions Ledger Sidebar */}
        <div className="w-72 border-r border-border bg-card/60 hidden md:flex flex-col">
          <div className="p-4 border-b border-border">
            <Button
              className="w-full rounded-xs font-mono text-xs gap-2"
              onClick={handleNewChat}
            >
              <Plus className="w-3.5 h-3.5" />
              New Inquiry
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-3">
            <div className="flex items-center gap-2 px-2 py-1 mb-2 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
              <History className="w-3.5 h-3.5" />
              <span>Inquiry Chronology</span>
            </div>

            {sessions.length === 0 ? (
              <p className="font-mono text-xs text-muted-foreground/60 text-center py-6">
                No archived inquiries
              </p>
            ) : (
              <div className="space-y-1">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group flex items-center justify-between rounded-xs px-3 py-2 cursor-pointer transition-colors font-mono text-xs ${
                      currentSessionId === session.id
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-foreground hover:bg-secondary/60"
                    }`}
                    onClick={() => loadSessionHistory(session.id)}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="truncate">{getSessionLabel(session)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-5 w-5 rounded-xs p-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                        currentSessionId === session.id
                          ? "hover:bg-primary-foreground/20 text-primary-foreground"
                          : "hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full font-mono text-xs gap-2 justify-start hover:bg-secondary text-muted-foreground"
              onClick={() => setShowApiKeyDialog(true)}
            >
              <Key className="w-3.5 h-3.5 text-primary" />
              <span>Groq API Key</span>
            </Button>
          </div>
        </div>

        {/* Main Workstation */}
        <div className="flex-1 flex flex-col bg-background">
          {/* Masthead */}
          <div className="border-b border-border bg-card/80 p-4">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                  <span>WORKSTATION</span>
                  <span>//</span>
                  <span>RETRIEVAL AUGMENTED GENERATION</span>
                </div>
                <h1 className="font-serif text-xl font-normal text-foreground">
                  AI Study Console
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="md:hidden rounded-xs"
                  onClick={handleNewChat}
                  title="New Inquiry"
                >
                  <Plus className="w-4 h-4" />
                </Button>

                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="w-full sm:w-72 font-mono text-xs rounded-xs border-border bg-secondary/30">
                    <SelectValue placeholder="Select course repository" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xs border-border bg-card">
                    {classrooms.map((classroom) => (
                      <SelectItem key={classroom.id} value={classroom.id} className="font-mono text-xs">
                        {classroom.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Inquiry Viewport */}
          <div className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
              {!selectedCourse ? (
                <div className="border border-dashed border-border bg-card/40 p-12 text-center rounded-xs mt-12">
                  <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <h2 className="font-serif text-xl font-normal text-foreground mb-1">
                    Select a Course Repository
                  </h2>
                  <p className="font-mono text-xs text-muted-foreground max-w-md mx-auto">
                    Choose a course from the header dropdown to target vector similarity retrieval against its indexed materials.
                  </p>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-12">
                  <div className="border border-border bg-card p-6 md:p-8 rounded-xs mb-8">
                    <div className="flex items-center gap-2 font-mono text-[10px] text-primary uppercase font-bold mb-2">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>TARGET: {selectedClassroomData?.name || "SELECTED REPOSITORY"}</span>
                    </div>
                    <h2 className="font-serif text-2xl font-normal text-foreground mb-2">
                      Academic Inquiry Workspace
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                      All responses are grounded in vector chunks extracted from your course documents. Every assertion includes pinpoint citations to the source file and page coordinates.
                    </p>
                  </div>

                  <div className="font-mono text-[11px] text-muted-foreground uppercase mb-3 tracking-wider">
                    EXEMPLAR INQUIRIES
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      "Summarize the key mathematical concepts and theorems in Lecture 04.",
                      "Extract all assigned homework problems and their respective due dates.",
                      "Explain the derivation in Chapter 3 with step-by-step intermediate equations.",
                      "Compare the methodology in Section 2 with the textbook reference reading.",
                    ].map((sample) => (
                      <button
                        key={sample}
                        type="button"
                        onClick={() => setInput(sample)}
                        className="text-left p-4 border border-border bg-card/50 hover:bg-secondary/40 hover:border-primary/50 transition-colors rounded-xs group flex flex-col justify-between"
                      >
                        <p className="text-xs text-foreground leading-relaxed mb-3">
                          "{sample}"
                        </p>
                        <div className="font-mono text-[10px] text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          <span>Dispatch query</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6 pb-6">
                  {messages.map((message, index) => (
                    <div key={index} className="space-y-3">
                      {message.role === "user" ? (
                        <div className="flex justify-end">
                          <div className="max-w-[85%] md:max-w-[75%] border border-border bg-card p-4 rounded-xs">
                            <div className="flex items-center justify-between font-mono text-[10px] text-primary mb-1">
                              <span>[QUERY // SCHOLAR]</span>
                            </div>
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                              {message.content}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="border-l-2 border-primary pl-4 md:pl-6 py-2">
                          <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground uppercase mb-2">
                            <Database className="w-3 h-3 text-primary" />
                            <span>SYNTHESIS // GROQ LLAMA-3.3 + PGVECTOR</span>
                          </div>

                          <div className="font-serif text-[15px] leading-relaxed text-foreground whitespace-pre-wrap">
                            {message.content}
                          </div>

                          {/* Bibliographic Citations */}
                          {message.citations && message.citations.length > 0 && (
                            <div className="mt-5 pt-4 border-t border-border">
                              <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Quote className="w-3 h-3 text-primary" />
                                <span>Verified Source Loci ({message.citations.length})</span>
                              </div>

                              <div className="space-y-2">
                                {message.citations.map((citation, i) => (
                                  <div
                                    key={i}
                                    className="p-3 bg-card border border-border rounded-xs text-xs font-mono"
                                  >
                                    {typeof citation === "string" ? (
                                      <span className="text-foreground">{citation}</span>
                                    ) : (
                                      <div>
                                        <div className="flex items-center justify-between text-primary font-bold mb-1">
                                          <span>
                                            [REF-{String(citation.number ?? i + 1).padStart(2, "0")}] {citation.file_name || citation.source_id || "Document"}
                                          </span>
                                          {citation.page_number != null && (
                                            <span className="text-muted-foreground text-[10px]">
                                              PAGE {citation.page_number}
                                            </span>
                                          )}
                                        </div>
                                        {citation.text_snippet && (
                                          <p className="text-[11px] font-sans italic text-muted-foreground mt-1 leading-relaxed border-l border-border pl-2">
                                            "{citation.text_snippet}"
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {isSending && !isAssistantStreaming && (
                    <div className="border-l-2 border-primary pl-4 md:pl-6 py-2">
                      <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground uppercase mb-2">
                        <Spinner className="w-3 h-3 text-primary" />
                        <span>RETRIEVING 768-D EMBEDDINGS & SYNTHESIZING...</span>
                      </div>
                      <div className="h-4 w-48 bg-muted/40 animate-pulse rounded-xs" />
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Workstation Dispatch Bar */}
          {selectedCourse && (
            <div className="border-t border-border bg-card/80 p-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Pose an academic inquiry against this course corpus..."
                    className="min-h-[56px] max-h-[160px] resize-none font-sans text-sm rounded-xs border-border bg-background"
                    disabled={isSending}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isSending}
                    className="h-auto px-5 rounded-xs font-mono text-xs gap-1.5 shrink-0"
                  >
                    {isSending ? (
                      <Spinner className="w-4 h-4" />
                    ) : (
                      <>
                        <span>TRANSMIT</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mt-2 px-1">
                  <span>[ENTER] TO DISPATCH · [SHIFT + ENTER] FOR NEWLINE</span>
                  <span>GROUNDED IN PGVECTOR COSINE SIMILARITY</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen font-mono text-xs text-muted-foreground">
          <Spinner className="w-6 h-6 text-primary mb-3" />
          <span>Mounting Study Console...</span>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
