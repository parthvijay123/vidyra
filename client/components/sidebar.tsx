"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Radio,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", index: "01", icon: LayoutDashboard },
  { href: "/classrooms", label: "Classrooms", index: "02", icon: BookOpen },
  { href: "/chat", label: "AI Tutor Chat", index: "03", icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden rounded-xs border-border bg-card text-foreground"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle navigation menu"
      >
        {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </Button>

      {/* Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col justify-between transition-transform duration-200 md:translate-x-0 font-sans",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div>
          {/* Masthead */}
          <div className="px-6 py-5 border-b border-sidebar-border flex items-baseline justify-between">
            <Link href="/dashboard" className="flex items-baseline gap-2">
              <span className="font-serif text-2xl tracking-tight text-sidebar-foreground">Vidyra</span>
              <span className="font-mono text-[10px] text-primary uppercase font-bold">[CONSOLE]</span>
            </Link>
          </div>

          {/* System Telemetry Tag */}
          <div className="px-6 py-3 border-b border-sidebar-border bg-card/30 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>PGVECTOR READY</span>
            </div>
            <span className="text-[10px] text-sidebar-foreground/50">768-DIM</span>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-xs text-xs font-mono tracking-wide transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 shrink-0 opacity-80" />
                    <span>{item.label}</span>
                  </div>
                  <span className={cn("text-[10px]", isActive ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {item.index}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Account / Footer */}
        <div className="p-4 border-t border-sidebar-border space-y-3">
          <div className="p-3 rounded-xs border border-sidebar-border bg-card/60">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-6 h-6 rounded-xs bg-primary/20 border border-primary/40 text-primary flex items-center justify-center font-mono text-xs font-bold shrink-0">
                {user?.name?.charAt(0).toUpperCase() || "S"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-sidebar-foreground truncate">
                  {user?.name || "Student"}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground truncate">
                  {user?.email || "student@vidyra.ac"}
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 h-9 rounded-xs font-mono text-xs uppercase text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={logout}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Terminate Session</span>
          </Button>
        </div>
      </aside>
    </>
  );
}
