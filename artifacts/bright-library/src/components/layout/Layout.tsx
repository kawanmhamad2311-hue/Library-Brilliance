import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, BookOpen, MessageSquare, LayoutDashboard } from "lucide-react";
import { useLogout } from "@workspace/api-client-react";
import { NotificationBell } from "@/components/layout/NotificationBell";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        logout();
        setLocation("/");
      }
    });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href={user ? "/library" : "/"} className="flex items-center gap-3 transition-opacity hover:opacity-80">
              <img src={`${import.meta.env.BASE_URL}bright-logo.jpg`} alt="BRIGHT Logo" className="h-10 w-auto rounded-md" />
              <span className="font-bold text-xl text-primary hidden sm:inline-block">کتێبخانەی بڕایت</span>
            </Link>
            
            {user && (
              <nav className="hidden md:flex items-center gap-1">
                <Button variant="ghost" asChild className="gap-2">
                  <Link href="/library">
                    <BookOpen className="h-4 w-4" />
                    <span>کتێبخانە</span>
                  </Link>
                </Button>
                <Button variant="ghost" asChild className="gap-2">
                  <Link href="/feedback">
                    <MessageSquare className="h-4 w-4" />
                    <span>سەرنجەکان</span>
                  </Link>
                </Button>
                {user.role === "admin" && (
                  <Button variant="ghost" asChild className="gap-2">
                    <Link href="/admin">
                      <LayoutDashboard className="h-4 w-4" />
                      <span>بەڕێوەبردن</span>
                    </Link>
                  </Button>
                )}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {user.role === "admin" && <NotificationBell />}
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-semibold text-foreground">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.department}</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 border-border/50 hover:bg-destructive/5 hover:text-destructive">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">چوونە دەرەوە</span>
                </Button>
              </div>
            ) : (
              <Button asChild variant="default" className="gap-2">
                <Link href="/">
                  <span>چوونە ژوورەوە</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-white flex items-center justify-around p-2 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50">
          <Button variant="ghost" size="icon" asChild className="flex-col h-auto py-2 gap-1 rounded-xl">
            <Link href="/library">
              <BookOpen className="h-5 w-5" />
              <span className="text-[10px]">کتێبخانە</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="flex-col h-auto py-2 gap-1 rounded-xl">
            <Link href="/feedback">
              <MessageSquare className="h-5 w-5" />
              <span className="text-[10px]">سەرنجەکان</span>
            </Link>
          </Button>
          {user.role === "admin" && (
            <Button variant="ghost" size="icon" asChild className="flex-col h-auto py-2 gap-1 rounded-xl">
              <Link href="/admin">
                <LayoutDashboard className="h-5 w-5" />
                <span className="text-[10px]">بەڕێوەبردن</span>
              </Link>
            </Button>
          )}
        </nav>
      )}
    </div>
  );
}