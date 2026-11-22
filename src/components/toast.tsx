"use client";

import { AnimatePresence, motion } from "motion/react";
import { create } from "zustand";
import { cn } from "@/lib/utils";

interface Toast {
  id: number;
  title: string;
  body?: string;
  tone?: "value" | "ember" | "ink";
}

const useToasts = create<{ toasts: Toast[]; push: (t: Omit<Toast, "id">) => void; drop: (id: number) => void }>((set) => ({
  toasts: [],
  push: (t) => {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 3800);
  },
  drop: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export const toast = (t: Omit<Toast, "id">) => useToasts.getState().push(t);

export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  const drop = useToasts((s) => s.drop);
  return (
    <div className="pointer-events-none fixed right-4 bottom-24 z-[70] flex w-[340px] max-w-[calc(100vw-2rem)] flex-col gap-2 md:bottom-6">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            onClick={() => drop(t.id)}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 text-left shadow-[0_12px_40px_-12px_rgba(15,27,42,0.35)]",
              t.tone === "ember" ? "border-ember/30 bg-card" : "border-line bg-card",
            )}
          >
            <span
              className={cn(
                "mt-1 h-2 w-2 shrink-0 rounded-full",
                t.tone === "ember" ? "bg-ember" : t.tone === "ink" ? "bg-ink" : "bg-value",
              )}
            />
            <span>
              <span className="block text-[14px] font-semibold text-ink">{t.title}</span>
              {t.body && <span className="mt-0.5 block text-[13px] leading-snug text-body">{t.body}</span>}
            </span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
