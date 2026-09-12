"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowUpRight, ShieldCheck, Lock } from "lucide-react";
import { authApi } from "@/lib/api";

export default function LoginPage() {
  const handleGoogleLogin = () => {
    authApi.googleLogin();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-6 sm:p-12 font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Top Bar */}
      <header className="flex items-center justify-between border-b border-border pb-6">
        <Link href="/" className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors uppercase">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Index</span>
        </Link>
        <span className="font-mono text-xs text-primary uppercase font-bold tracking-widest">[VIDYRA AUTH]</span>
      </header>

      {/* Main Container — Editorial Card */}
      <main className="max-w-md w-full mx-auto my-12">
        <div className="border border-border bg-card p-8 sm:p-10 rounded-xs shadow-xs space-y-6">
          <div className="space-y-2">
            <span className="font-mono text-[11px] text-primary uppercase tracking-wider block">
              // ACADEMIC SINGLE SIGN-ON
            </span>
            <h1 className="font-serif text-3xl font-normal text-foreground tracking-tight">
              Sign in to your workspace
            </h1>
            <p className="text-xs text-muted-foreground font-sans leading-relaxed">
              Authenticate via Google to load your enrolled courses, syllabus documents, and vector retrieval history.
            </p>
          </div>

          <div className="pt-2 space-y-4">
            <Button
              type="button"
              className="w-full h-12 rounded-xs font-mono text-xs uppercase tracking-wider bg-foreground text-background hover:bg-foreground/90 gap-3 border border-border flex items-center justify-center cursor-pointer transition-all"
              onClick={handleGoogleLogin}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
              <ArrowUpRight className="w-4 h-4 ml-auto text-muted-foreground" />
            </Button>

            <div className="border border-border/70 bg-background/50 p-4 rounded-xs text-[11px] font-mono text-muted-foreground space-y-2">
              <div className="flex items-center gap-1.5 text-foreground font-medium">
                <Lock className="w-3.5 h-3.5 text-primary" />
                <span>Security Protocol Notes</span>
              </div>
              <ul className="space-y-1 list-disc list-inside">
                <li>Read-only Google Classroom and Drive scopes</li>
                <li>Encrypted token exchange via Fernet at rest</li>
                <li>HttpOnly session cookies with CSRF double-submit protection</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between font-mono text-[11px] text-muted-foreground">
            <span>Don&apos;t have an account?</span>
            <Link href="/register" className="text-primary hover:underline">
              Create account →
            </Link>
          </div>
        </div>
      </main>

      {/* Footer Colophon */}
      <footer className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between font-mono text-xs text-muted-foreground gap-2">
        <span>Vidyra Academic Systems · Identity Gateway</span>
        <span>OAuth 2.0 State-Protected</span>
      </footer>
    </div>
  );
}
