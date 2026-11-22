"use client";

import {
  Award,
  Bell,
  Compass,
  HeartPulse,
  LayoutDashboard,
  PenLine,
  Settings,
  Shield,
  Sunrise,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { activityFor, balances, useHydrated, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Logo } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { Toaster } from "./toast";
import { Avatar } from "./ui";

const NAV = [
  { href: "/feed", label: "Today", Icon: Sunrise },
  { href: "/explore", label: "Explore", Icon: Compass },
  { href: "/activity", label: "Activity", Icon: Bell },
  { href: "/studio", label: "Studio", Icon: LayoutDashboard },
  { href: "/wellbeing", label: "Time well spent", Icon: HeartPulse },
  { href: "/rewards", label: "Merit & Cred", Icon: Award },
];
const NAV_SECONDARY = [
  { href: "/admin", label: "Moderation", Icon: Shield },
  { href: "/settings", label: "Settings", Icon: Settings },
];

function DayProgress() {
  const feed = useStore((s) => s.feed);
  const myRatings = useStore((s) => s.myRatings);
  const reads = useStore((s) => s.reads);
  if (!feed) return null;
  const done = feed.items.filter((i) => myRatings[i.postId] !== undefined || reads[i.postId]?.skipped).length;
  return (
    <Link href="/feed" className="block rounded-2xl border border-line bg-card p-4 transition-colors hover:border-line-2">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="eyebrow text-muted">Today</span>
        <span className="font-mono text-[12px] text-ink">
          {done}/{feed.items.length}
        </span>
      </div>
      <div className="flex gap-[3px]">
        {feed.items.map((i) => {
          const rated = myRatings[i.postId] !== undefined;
          const skipped = reads[i.postId]?.skipped;
          return (
            <span
              key={i.postId}
              className={cn("h-1.5 flex-1 rounded-full", rated ? "bg-value" : skipped ? "bg-line-2" : "bg-paper-2")}
            />
          );
        })}
      </div>
      <p className="mt-3 text-[12.5px] leading-snug text-muted">
        {feed.completedAt ? "You're caught up. See you tomorrow." : `${feed.items.length - done} left — then your feed ends.`}
      </p>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useStore((s) => s.user);
  const ledger = useStore((s) => s.ledger);
  const ensureFeed = useStore((s) => s.ensureFeed);
  const posts = useStore((s) => s.posts);
  const seenAt = useStore((s) => s.activitySeenAt);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace("/login");
    else ensureFeed();
  }, [hydrated, user, router, ensureFeed]);

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-1 w-24 overflow-hidden rounded-full bg-paper-2">
          <div className="h-full w-1/3 animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-value" />
        </div>
      </div>
    );
  }

  const { merit } = balances(ledger);
  const unread = activityFor({ posts, user, ledger }).filter((i) => i.at > seenAt).length;
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line px-5 py-6 lg:flex">
        <Logo href="/feed" className="px-2" />
        <Link
          href="/create"
          className="mt-8 flex h-11 items-center justify-center gap-2 rounded-xl bg-ink text-[14px] font-medium text-paper transition-colors hover:bg-ink-2"
        >
          <PenLine className="h-4 w-4" /> Create
        </Link>
        <nav className="mt-6 flex flex-col gap-0.5">
          {NAV.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] transition-colors",
                active(href) ? "bg-paper-2 font-medium text-ink" : "text-body hover:bg-paper-2/60 hover:text-ink",
              )}
            >
              {active(href) && <span className="absolute top-2.5 bottom-2.5 left-0 w-[3px] rounded-full bg-value" />}
              <Icon className="h-[18px] w-[18px]" strokeWidth={active(href) ? 2.2 : 1.8} />
              {label}
              {href === "/activity" && unread > 0 && (
                <span className="ml-auto rounded-full bg-value px-1.5 py-px font-mono text-[10.5px] text-on-ink">{unread}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="my-5 h-px bg-line" />
        <nav className="flex flex-col gap-0.5">
          {NAV_SECONDARY.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex h-9 items-center gap-3 rounded-xl px-3 text-[13.5px] transition-colors",
                active(href) ? "bg-paper-2 font-medium text-ink" : "text-muted hover:bg-paper-2/60 hover:text-ink",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.8} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-4">
          <DayProgress />
          <div className="flex items-center gap-3 px-1">
            <Link href={`/u/${user.handle}`} className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar name={user.name} tone="value" size={36} />
              <span className="min-w-0">
                <span className="block truncate text-[13.5px] font-medium text-ink">{user.name}</span>
                <span className="block truncate font-mono text-[11px] text-muted">{merit} merit</span>
              </span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-paper/90 px-4 backdrop-blur-md lg:hidden">
        <Logo href="/feed" />
        <div className="flex items-center gap-1">
          <Link href="/activity" className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl text-body hover:bg-paper-2" aria-label="Activity">
            <Bell className="h-[18px] w-[18px]" />
            {unread > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-value" />}
          </Link>
          <ThemeToggle />
          <Link href={`/u/${user.handle}`} aria-label="Your profile">
            <Avatar name={user.name} tone="value" size={30} />
          </Link>
        </div>
      </header>

      <main className="min-w-0 pb-28 lg:pb-0">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center">
          {[NAV[0]!, NAV[1]!, { href: "/create", label: "Write", Icon: PenLine }, NAV[2]!, { href: `/u/${user.handle}`, label: "You", Icon: UserRound }].map(
            ({ href, label, Icon }) =>
              href === "/create" ? (
                <Link key={href} href={href} className="flex justify-center" aria-label="Write a post">
                  <span className="-mt-6 flex h-13 w-13 items-center justify-center rounded-2xl bg-ink text-paper shadow-[0_10px_30px_-10px_rgba(15,27,42,0.6)]">
                    <Icon className="h-5 w-5" />
                  </span>
                </Link>
              ) : (
                <Link
                  key={href}
                  href={href}
                  className={cn("flex flex-col items-center gap-1 text-[10.5px]", active(href) ? "text-ink" : "text-muted")}
                >
                  <Icon className="h-5 w-5" strokeWidth={active(href) ? 2.2 : 1.7} />
                  {label}
                </Link>
              ),
          )}
        </div>
      </nav>
      <Toaster />
    </div>
  );
}
