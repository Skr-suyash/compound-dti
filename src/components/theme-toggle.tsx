"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    () => (document.documentElement.dataset.theme as "light" | "dark") ?? "light",
    () => "light" as const,
  );
  const setTheme = (t: "light" | "dark") => {
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem("compound-theme", t);
    } catch {}
  };
  return { theme, setTheme };
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl text-body transition-colors hover:bg-paper-2 hover:text-ink",
        className,
      )}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}
