"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { authApi } from "@/lib/api";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const { register } = useAuth();
  const router = useRouter();

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "Full name is required";
    if (!email.trim()) newErrors.email = "Email address is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Invalid academic or email address";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Minimum 6 characters required";
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await register(email, password, name);
      toast.success("Account registered successfully");
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

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
        <span className="font-mono text-xs text-primary uppercase font-bold tracking-widest">[VIDYRA ENROLLMENT]</span>
      </header>

      {/* Main Container */}
      <main className="max-w-md w-full mx-auto my-12">
        <div className="border border-border bg-card p-8 sm:p-10 rounded-xs shadow-xs space-y-6">
          <div className="space-y-2">
            <span className="font-mono text-[11px] text-primary uppercase tracking-wider block">
              // NEW WORKSPACE REGISTRATION
            </span>
            <h1 className="font-serif text-3xl font-normal text-foreground tracking-tight">
              Create student account
            </h1>
            <p className="text-xs text-muted-foreground font-sans leading-relaxed">
              Register to isolate your course files, study notes, and personal vector retrieval memory.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="name" className="font-mono text-xs text-muted-foreground uppercase block">
                Full Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xs h-10 border-border bg-background font-sans text-sm focus-visible:ring-primary"
              />
              {errors.name && <p className="font-mono text-[11px] text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="font-mono text-xs text-muted-foreground uppercase block">
                Institutional / Personal Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="alex@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xs h-10 border-border bg-background font-sans text-sm focus-visible:ring-primary"
              />
              {errors.email && <p className="font-mono text-[11px] text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="font-mono text-xs text-muted-foreground uppercase block">
                Access Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xs h-10 border-border bg-background font-sans text-sm focus-visible:ring-primary"
              />
              {errors.password && <p className="font-mono text-[11px] text-destructive">{errors.password}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="font-mono text-xs text-muted-foreground uppercase block">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-xs h-10 border-border bg-background font-sans text-sm focus-visible:ring-primary"
              />
              {errors.confirmPassword && (
                <p className="font-mono text-[11px] text-destructive">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xs font-mono text-xs uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
            >
              {isLoading ? <Spinner className="w-4 h-4 mr-2" /> : "Complete Registration"}
            </Button>
          </form>

          <div className="relative py-2 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <span className="relative bg-card px-3 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
              Or Fast-Track
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-xs font-mono text-xs uppercase tracking-wider border-border hover:bg-background gap-2 flex items-center justify-center cursor-pointer"
            onClick={handleGoogleLogin}
          >
            <span>Google Classroom Single Sign-On</span>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
          </Button>

          <div className="pt-4 border-t border-border flex items-center justify-between font-mono text-[11px] text-muted-foreground">
            <span>Already enrolled?</span>
            <Link href="/login" className="text-primary hover:underline">
              Sign in to workspace →
            </Link>
          </div>
        </div>
      </main>

      {/* Footer Colophon */}
      <footer className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between font-mono text-xs text-muted-foreground gap-2">
        <span>Vidyra Academic Systems · Identity Gateway</span>
        <span>Standard Security Isolation</span>
      </footer>
    </div>
  );
}
