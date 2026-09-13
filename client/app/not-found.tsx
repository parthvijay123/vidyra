import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col justify-between p-6 sm:p-12 lg:p-20 font-sans">
      <header className="border-b border-border pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs tracking-widest text-primary uppercase font-bold">[VIDYRA]</span>
          <span className="text-muted-foreground font-mono text-xs">/ INDEX FAULT</span>
        </div>
        <span className="font-mono text-xs text-muted-foreground">HTTP_404_NOT_FOUND</span>
      </header>

      <div className="max-w-3xl my-auto py-16">
        <p className="font-mono text-xs text-primary uppercase tracking-wider mb-4">
          Error 404 · Unanchored Resource
        </p>
        <h1 className="text-4xl sm:text-6xl font-serif font-normal tracking-tight text-foreground mb-6 leading-tight">
          This document could not be located in the index.
        </h1>
        <p className="text-lg text-muted-foreground font-sans max-w-xl leading-relaxed mb-8">
          The requested path does not match any registered lecture note, indexed syllabus, or system route. Check the URI or return to your active learning environment.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/dashboard">
            <Button className="rounded-xs font-mono text-xs uppercase tracking-wider h-11 px-6 bg-primary text-primary-foreground hover:bg-primary/90">
              Return to Workspace
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="rounded-xs font-mono text-xs uppercase tracking-wider h-11 px-6 border-border">
              Landing Page
            </Button>
          </Link>
        </div>
      </div>

      <footer className="border-t border-border pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-mono text-muted-foreground gap-2">
        <span>Vidyra Academic Systems · Core Retrieval Engine</span>
        <span>Referenced from client state</span>
      </footer>
    </main>
  );
}

