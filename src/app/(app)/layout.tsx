import { Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";

// The app area renders from browser-persisted state, so it intentionally waits for the client.
export const instant = false;

function ShellFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-1 w-24 overflow-hidden rounded-full bg-paper-2">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-value" />
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
