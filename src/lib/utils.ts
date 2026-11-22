import { clsx, type ClassValue } from "clsx";
import type { AvatarTone } from "./types";

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function longDate(d = new Date()) {
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
}

export function timeAgo(ts: number, now = Date.now()) {
  const s = Math.max(1, Math.round((now - ts) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.round(d / 30);
  return `${mo}mo ago`;
}

export function initials(name: string) {
  return name
    .split(/[\s._]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export const TONE_CLASSES: Record<AvatarTone, string> = {
  value: "bg-value text-on-ink",
  ember: "bg-ember text-on-ink",
  ochre: "bg-ochre text-on-ink",
  slate: "bg-slate text-on-ink",
  ink: "bg-ink text-paper",
  plum: "bg-[#6d4c7d] text-white",
  sky: "bg-[#2f7fb0] text-white",
  rose: "bg-[#b8566b] text-white",
};

export function excerpt(markdown: string, max = 180) {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^\|.*\|$/gm, " ")
    .replace(/[#>*_`|-]/g, " ")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max).replace(/\s\S*$/, "")}…` : text;
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const pct = (x: number) => `${Math.round(x * 100)}%`;
