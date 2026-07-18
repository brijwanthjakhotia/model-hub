"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import type { SessionUser } from "@/lib/session";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/models", label: "Talent" },
  { href: "/#categories", label: "Categories" },
  { href: "/#how-it-works", label: "How it works" },
];

export function Header({
  user,
  isAdmin = false,
}: {
  user: SessionUser | null;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  // Close the account menu on outside click or Escape. (Using onBlur to close
  // races with — and can swallow — a click on a menu item, so it lives here.)
  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuTriggerRef.current?.focus(); // return focus to the trigger
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            Muse<span className="text-accent">.</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                pathname === link.href && "text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                pathname.startsWith("/admin") && "text-foreground",
              )}
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle className="hidden sm:inline-flex" />

          {user ? (
            <div className="relative hidden md:block" ref={menuRef}>
              <button
                ref={menuTriggerRef}
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-controls="account-menu"
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-muted focus-ring"
              >
                <Avatar name={user.name} size={32} />
                <span className="max-w-[9rem] truncate text-sm font-medium">
                  {user.name}
                </span>
              </button>
              {menuOpen && (
                <div
                  id="account-menu"
                  className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-lift"
                >
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <div className="my-1 h-px bg-border" />
                  <MenuLink href="/dashboard" icon={LayoutDashboard} onClick={() => setMenuOpen(false)}>
                    My submissions
                  </MenuLink>
                  <MenuLink href="/submit" icon={Plus} onClick={() => setMenuOpen(false)}>
                    Submit talent
                  </MenuLink>
                  <MenuLink href="/account" icon={Settings} onClick={() => setMenuOpen(false)}>
                    Account settings
                  </MenuLink>
                  {isAdmin && (
                    <MenuLink href="/admin" icon={Shield} onClick={() => setMenuOpen(false)}>
                      Admin console
                    </MenuLink>
                  )}
                  <div className="my-1 h-px bg-border" />
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-danger/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <ButtonLink href="/login" variant="ghost" size="sm">
                Sign in
              </ButtonLink>
              <ButtonLink href="/register" variant="primary" size="sm">
                Join now
              </ButtonLink>
            </div>
          )}

          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted focus-ring md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div id="mobile-menu" className="border-t border-border bg-background md:hidden">
          <div className="container flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-border" />
            {user ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2">
                  <Avatar name={user.name} size={36} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <MobileLink href="/dashboard" icon={LayoutDashboard} onClick={() => setMobileOpen(false)}>
                  My submissions
                </MobileLink>
                <MobileLink href="/submit" icon={Plus} onClick={() => setMobileOpen(false)}>
                  Submit talent
                </MobileLink>
                <MobileLink href="/account" icon={Settings} onClick={() => setMobileOpen(false)}>
                  Account settings
                </MobileLink>
                {isAdmin && (
                  <MobileLink href="/admin" icon={Shield} onClick={() => setMobileOpen(false)}>
                    Admin console
                  </MobileLink>
                )}
                <form action={logoutAction} className="px-1 pt-1">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-col gap-2 px-1">
                <ButtonLink href="/login" variant="outline" onClick={() => setMobileOpen(false)}>
                  Sign in
                </ButtonLink>
                <ButtonLink href="/register" variant="primary" onClick={() => setMobileOpen(false)}>
                  Join now
                </ButtonLink>
              </div>
            )}
            <div className="flex items-center justify-between px-3 pt-3">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function MenuLink({
  href,
  icon: Icon,
  onClick,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      {children}
    </Link>
  );
}

function MobileLink({
  href,
  icon: Icon,
  onClick,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      {children}
    </Link>
  );
}
