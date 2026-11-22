"use client";

import {
  ArrowRight,
  BarChart3,
  Bold,
  Check,
  ChevronLeft,
  ChevronRight,
  Code,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  List,
  Loader2,
  MessageSquareText,
  PenLine,
  Plus,
  Trash2,
  Video,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Markdown } from "@/components/domain";
import { SPARK_THEMES, YouTubePlayer, sparkBackground } from "@/components/media";
import { SceneView } from "@/components/spark-player";
import { Avatar, Button, Eyebrow } from "@/components/ui";
import { TOPICS, topicName } from "@/lib/seed";
import { quotaFor, useStore } from "@/lib/store";
import type { Media, Post, SparkScene, SparkTheme, SparkVisual, TopicId } from "@/lib/types";
import { cn } from "@/lib/utils";

type Kind = Post["type"] | "poll";

const KINDS: { id: Kind; label: string; Icon: typeof PenLine; hint: string }[] = [
  { id: "note", label: "Note", Icon: MessageSquareText, hint: "A quick thought or win" },
  { id: "image", label: "Photo", Icon: ImagePlus, hint: "A diagram, chart or photo" },
  { id: "video", label: "Video", Icon: Video, hint: "A video worth watching" },
  { id: "spark", label: "Spark", Icon: Zap, hint: "A 30-second lesson" },
  { id: "poll", label: "Poll", Icon: BarChart3, hint: "Ask your circle" },
  { id: "text", label: "Article", Icon: PenLine, hint: "Teach one thing well" },
  { id: "link", label: "Link", Icon: Link2, hint: "Something worth reading" },
];

const TOOLBAR = [
  { Icon: Bold, before: "**", label: "Bold" },
  { Icon: Italic, before: "*", label: "Italic" },
  { Icon: Heading2, before: "## ", after: "", line: true, label: "Heading" },
  { Icon: List, before: "- ", after: "", line: true, label: "List" },
  { Icon: Code, before: "`", label: "Code" },
] as { Icon: typeof Bold; before: string; after?: string; line?: boolean; label: string }[];

const VISUALS: { id: SparkVisual; label: string }[] = [
  { id: "none", label: "Text only" },
  { id: "bars", label: "Bars" },
  { id: "steps", label: "Steps" },
  { id: "checklist", label: "Checklist" },
  { id: "curves", label: "Curves" },
  { id: "waves", label: "Waves" },
  { id: "lever", label: "Lever" },
  { id: "swatches", label: "Contrast" },
];

const STEPS = ["Checking format and length", "Looking for near-duplicates", "Matching to topic readers", "Preparing your first audience"];

function youtubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
}

async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

function PublishOverlay({ topic, postId, kind, onClose }: { topic: TopicId; postId: string; kind: Kind; onClose: () => void }) {
  const finishScreening = useStore((s) => s.finishScreening);
  const [step, setStep] = useState(0);
  const done = step >= STEPS.length;

  useEffect(() => {
    if (done) {
      finishScreening(postId);
      return;
    }
    const t = setTimeout(() => setStep((s) => s + 1), 750);
    return () => clearTimeout(t);
  }, [step, done, postId, finishScreening]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/50 p-5 backdrop-blur-sm">
      <motion.div
        initial={{ y: 24, scale: 0.97, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="relative w-full max-w-[480px] overflow-hidden rounded-[28px] border border-line bg-card p-8 shadow-2xl"
      >
        {done && (
          <button onClick={onClose} className="absolute top-5 right-5 rounded-lg p-1.5 text-muted hover:bg-paper-2 hover:text-ink" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        )}
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div key="screening" exit={{ opacity: 0, y: -10 }}>
              <Eyebrow>Publishing</Eyebrow>
              <p className="mt-3 font-display text-[28px] leading-tight font-semibold tracking-tight text-ink">
                Getting your {kind === "spark" ? "Spark" : kind === "video" ? "video" : "post"} ready
              </p>
              <ul className="mt-8 space-y-4">
                {STEPS.map((s, i) => (
                  <li key={s} className="flex items-center gap-3.5">
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full border transition-colors duration-300",
                        i < step ? "border-value bg-value text-on-ink" : i === step ? "border-ink" : "border-line",
                      )}
                    >
                      {i < step ? (
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      ) : i === step ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-ink" />
                      ) : (
                        <span className="font-mono text-[10px] text-muted">{i + 1}</span>
                      )}
                    </span>
                    <span className={cn("text-[14.5px] transition-colors", i <= step ? "text-ink" : "text-muted")}>
                      {s === "Matching to topic readers" ? `Matching to ${topicName(topic)} readers` : s}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ) : (
            <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 14 }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-value text-on-ink"
              >
                <Check className="h-7 w-7" strokeWidth={2.5} />
              </motion.div>
              <p className="mt-6 font-display text-[32px] leading-tight font-semibold tracking-tight text-ink">Published.</p>
              <p className="mt-3 text-[15px] leading-relaxed text-body">
                About <span className="font-semibold text-ink">20 {topicName(topic)} readers</span> will see it first. If they find it worth
                their time, it climbs to a wider audience.
              </p>
              <div className="mt-6 grid grid-cols-4 items-end gap-1.5">
                {[0, 1, 2, 3].map((s) => (
                  <div key={s} className={cn("rounded-md", s === 0 ? "bg-value" : "bg-paper-2")} style={{ height: 14 + s * 10 }} />
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={`/studio/${postId}`}>
                  <Button>
                    Track it in Studio <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/feed">
                  <Button variant="outline">Back to today</Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function SparkBuilder({
  theme,
  setTheme,
  scenes,
  setScenes,
}: {
  theme: SparkTheme;
  setTheme: (t: SparkTheme) => void;
  scenes: SparkScene[];
  setScenes: (s: SparkScene[]) => void;
}) {
  const [active, setActive] = useState(0);
  const scene = scenes[active] ?? scenes[0]!;
  const update = (patch: Partial<SparkScene>) => setScenes(scenes.map((s, i) => (i === active ? { ...s, ...patch } : s)));

  return (
    <div className="grid gap-6 p-6 md:grid-cols-[1fr_250px] md:p-8">
      <div className="min-w-0">
        <div className="flex items-center justify-between">
          <Eyebrow>Slides</Eyebrow>
          <span className="font-mono text-[11px] text-muted">{scenes.length}/6</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {scenes.map((s, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "h-9 min-w-9 rounded-xl border px-3 font-mono text-[12px] transition-colors",
                i === active ? "border-ink bg-ink text-paper" : s.text.trim() ? "border-line-2 text-ink" : "border-dashed border-line-2 text-muted",
              )}
            >
              {i + 1}
            </button>
          ))}
          {scenes.length < 6 && (
            <button
              onClick={() => {
                setScenes([...scenes, { kicker: "", text: "", visual: "none" }]);
                setActive(scenes.length);
              }}
              className="flex h-9 items-center gap-1 rounded-xl border border-dashed border-line-2 px-3 text-[12.5px] text-body hover:border-ink hover:text-ink"
            >
              <Plus className="h-3.5 w-3.5" /> Slide
            </button>
          )}
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium text-ink">Kicker</span>
            <input
              value={scene.kicker ?? ""}
              onChange={(e) => update({ kicker: e.target.value.slice(0, 30) })}
              placeholder="e.g. Physics in 30s"
              className="h-10 w-full rounded-xl border border-line bg-paper px-3.5 font-mono text-[13px] text-ink outline-none focus:border-ink"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 flex justify-between text-[12.5px] font-medium text-ink">
              Main line <span className="font-mono font-normal text-muted">{scene.text.length}/90</span>
            </span>
            <textarea
              value={scene.text}
              onChange={(e) => update({ text: e.target.value.slice(0, 90) })}
              rows={2}
              placeholder="One idea per slide. Short and true."
              className="w-full resize-none rounded-xl border border-line bg-paper px-3.5 py-2.5 font-display text-[18px] leading-snug text-ink outline-none focus:border-ink"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium text-ink">Supporting line (optional)</span>
            <input
              value={scene.sub ?? ""}
              onChange={(e) => update({ sub: e.target.value.slice(0, 60) || undefined })}
              placeholder="e.g. distance × force × angle"
              className="h-10 w-full rounded-xl border border-line bg-paper px-3.5 font-serif text-[15px] text-ink italic outline-none focus:border-ink"
            />
          </label>
          <div>
            <span className="mb-1.5 block text-[12.5px] font-medium text-ink">Animated visual</span>
            <div className="flex flex-wrap gap-1.5">
              {VISUALS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => update({ visual: v.id })}
                  className={cn(
                    "h-8 rounded-full border px-3 text-[12.5px] transition-colors",
                    (scene.visual ?? "none") === v.id ? "border-ink bg-ink text-paper" : "border-line text-body hover:border-line-2",
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-1.5">
              {(Object.keys(SPARK_THEMES) as SparkTheme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn("h-8 w-8 rounded-full ring-offset-2 ring-offset-card transition-all", theme === t && "ring-2 ring-ink")}
                  style={{ background: sparkBackground(t) }}
                  aria-label={`${t} theme`}
                />
              ))}
            </div>
            {scenes.length > 2 && (
              <button
                onClick={() => {
                  setScenes(scenes.filter((_, i) => i !== active));
                  setActive(Math.max(0, active - 1));
                }}
                className="inline-flex items-center gap-1 text-[12.5px] text-muted hover:text-ember"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove slide
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <Eyebrow className="mb-3">Preview</Eyebrow>
        <div className="relative mx-auto aspect-[9/16] w-full max-w-[250px] overflow-hidden rounded-[22px]" style={{ background: sparkBackground(theme) }}>
          <div className="absolute inset-x-3 top-3 flex gap-1">
            {scenes.map((_, i) => (
              <span key={i} className="h-[3px] flex-1 rounded-full" style={{ background: i <= active ? "#fff" : "rgba(255,255,255,0.3)" }} />
            ))}
          </div>
          <div className="absolute inset-0 origin-top scale-[0.8] pt-10">
            <AnimatePresence mode="wait">
              <SceneView key={`${active}-${scene.visual}-${theme}`} scene={scene.text ? scene : { ...scene, text: "Your main line appears here" }} theme={theme} />
            </AnimatePresence>
          </div>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
            <button onClick={() => setActive(Math.max(0, active - 1))} className="flex h-7 w-7 items-center justify-center rounded-full bg-black/25 text-white" aria-label="Previous slide">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setActive(Math.min(scenes.length - 1, active + 1))} className="flex h-7 w-7 items-center justify-center rounded-full bg-black/25 text-white" aria-label="Next slide">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreatePage() {
  const router = useRouter();
  const params = useSearchParams();
  const user = useStore((s) => s.user);
  const posts = useStore((s) => s.posts);
  const config = useStore((s) => s.config);
  const createPost = useStore((s) => s.createPost);
  const quota = quotaFor({ posts, user, config });

  const initialKind = KINDS.find((k) => k.id === params.get("kind"))?.id ?? "note";
  const [kind, setKind] = useState<Kind>(initialKind);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [topic, setTopic] = useState<TopicId>(user?.topics[0] ?? "coding");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [body, setBody] = useState("");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [image, setImage] = useState<string | null>(null);
  const [alt, setAlt] = useState("");
  const [dragging, setDragging] = useState(false);
  const [videoMeta, setVideoMeta] = useState<{ channel: string; title: string } | null>(null);
  const [theme, setTheme] = useState<SparkTheme>("ink");
  const [scenes, setScenes] = useState<SparkScene[]>([
    { kicker: "", text: "", visual: "none" },
    { kicker: "", text: "", visual: "none" },
    { kicker: "", text: "", visual: "none" },
  ]);
  const [published, setPublished] = useState<string | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const vid = kind === "video" ? youtubeId(url) : null;

  useEffect(() => {
    if (!vid) return;
    let cancelled = false;
    fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${vid}&format=json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) setVideoMeta(d ? { channel: d.author_name, title: d.title } : null);
      })
      .catch(() => !cancelled && setVideoMeta(null));
    return () => {
      cancelled = true;
    };
  }, [vid]);

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  const shouting = /\b[A-Z]{4,}\b/.test(title) || /!!|🤯|🔥/.test(title);
  const short = kind === "note" || kind === "poll";
  const titleOk = title.trim().length >= 5 && title.length <= 120;
  const bodyShouting = /\b[A-Z]{5,}\b/.test(body) || /!!|🤯/.test(body);
  const checks: { ok: boolean; label: string }[] = short
    ? [{ ok: body.trim().length > 0 && !bodyShouting, label: "Not shouting (no ALL CAPS or !!)" }]
    : [
        { ok: titleOk, label: "Title between 5 and 120 characters" },
        { ok: title.trim().length > 0 && !shouting, label: "Title isn't shouting (no ALL CAPS or 🔥)" },
      ];
  if (kind === "note") checks.push({ ok: body.trim().length >= 20 && body.length <= 500, label: "Between 20 and 500 characters" });
  if (kind === "poll") {
    checks.push({ ok: body.trim().length >= 10, label: "A clear question" });
    checks.push({ ok: pollOptions.filter((o) => o.trim()).length >= 2, label: "At least two options" });
  }
  if (kind === "text") checks.push({ ok: words >= 80, label: "At least 80 words of substance" });
  if (kind === "link") {
    checks.push({ ok: /^https?:\/\/\S+\.\S+/.test(url), label: "A valid link" });
    checks.push({ ok: words >= 20, label: "Your take is at least 20 words" });
  }
  if (kind === "video") {
    checks.push({ ok: !!vid, label: "A valid YouTube link" });
    checks.push({ ok: words >= 20, label: "Why it's worth watching (20+ words)" });
  }
  if (kind === "image") {
    checks.push({ ok: !!image, label: "An image uploaded" });
    checks.push({ ok: alt.trim().length >= 5, label: "Alt text describing the image" });
    checks.push({ ok: words >= 10, label: "A caption of at least 10 words" });
  }
  if (kind === "spark") {
    checks.push({ ok: scenes.length >= 2 && scenes.every((s) => s.text.trim()), label: "Every slide has a main line (2+ slides)" });
    checks.push({ ok: words >= 5, label: "A one-line caption" });
  }
  const canPublish = checks.every((c) => c.ok) && quota.left > 0;

  const wrap = (before: string, after = before, linePrefix = false) => {
    const el = area.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    const sel = body.slice(a, b) || (linePrefix ? "Heading" : "text");
    const insert = linePrefix ? `\n${before}${sel}\n` : `${before}${sel}${after}`;
    setBody(body.slice(0, a) + insert + body.slice(b));
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = a + (linePrefix ? before.length + 1 : before.length);
      el.selectionEnd = el.selectionStart + sel.length;
    });
  };

  const onFile = async (file?: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImage(await compressImage(file));
  };

  const publish = () => {
    if (!canPublish) return;
    let media: Media | undefined;
    if (kind === "video" && vid) media = { kind: "youtube", id: vid, channel: videoMeta?.channel ?? "YouTube", title: videoMeta?.title ?? title };
    if (kind === "image" && image) media = { kind: "image", src: image, alt: alt.trim() };
    if (kind === "spark") media = { kind: "spark", theme, scenes: scenes.map((s) => ({ ...s, kicker: s.kicker || undefined })) };
    if (kind === "note" && image) media = { kind: "image", src: image, alt: alt.trim() || "Attached image" };
    if (kind === "poll") media = { kind: "poll", options: pollOptions.filter((o) => o.trim()).map((label) => ({ label: label.trim(), votes: 0 })) };
    const type: Post["type"] = kind === "poll" ? "note" : kind;
    const finalTitle = short ? body.trim().split("\n")[0]!.slice(0, 90) : title;
    const id = createPost({ type, topic, title: finalTitle, body, url: kind === "link" ? url : undefined, media });
    setPublished(id);
  };

  const bodyPlaceholder: Record<Kind, string> = {
    note: `What did you learn, build or figure out today, ${user?.name.split(" ")[0] ?? ""}?`,
    poll: "Ask a question — e.g. “Which topic should I explain next?”",
    text: "Teach one thing well. Use ## for headings, - for lists, **bold** for emphasis.",
    link: "Why is this worth reading? What will someone get out of it?",
    video: "Why is this video worth someone's time? What should they watch for?",
    image: "Caption: what should people notice in this image?",
    spark: "One-line caption shown under your Spark.",
  };

  return (
    <div className="mx-auto grid max-w-[1180px] gap-12 px-5 py-10 md:px-10 lg:py-14 xl:grid-cols-[1fr_300px]">
      <div className="mx-auto w-full max-w-[760px] min-w-0">
        <Eyebrow className="mb-4">Create</Eyebrow>
        <h1 className="font-display text-[40px] leading-[1] font-semibold tracking-[-0.04em] text-ink md:text-[52px]">
          Make something worth <span className="font-serif font-normal italic">someone&apos;s time.</span>
        </h1>

        <div className="mt-10 grid grid-cols-4 gap-2 sm:grid-cols-7">
          {KINDS.map(({ id, label, Icon, hint }) => (
            <button
              key={id}
              onClick={() => setKind(id)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-2xl border p-3 text-left transition-all sm:p-4",
                kind === id ? "border-ink bg-ink text-paper" : "border-line bg-card hover:-translate-y-0.5 hover:border-line-2",
              )}
            >
              <Icon className={cn("h-5 w-5", kind === id ? "text-[#3CC7A4]" : "text-value")} strokeWidth={1.8} />
              <span>
                <span className="block text-[14px] font-semibold">{label}</span>
                <span className={cn("hidden text-[11.5px] leading-snug sm:block", kind === id ? "text-paper/60" : "text-muted")}>{hint}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {TOPICS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTopic(t.id)}
              className={cn(
                "h-8 rounded-full border px-3.5 text-[13px] transition-colors",
                topic === t.id ? "border-ink bg-ink text-paper" : "border-line text-body hover:border-line-2 hover:text-ink",
              )}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-[28px] border border-line bg-card">
          <div className={cn("px-6 pt-6 md:px-8 md:pt-8", short && "hidden")}>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value.replace(/\n/g, ""))}
              rows={2}
              maxLength={120}
              placeholder={kind === "spark" ? "Spark title — e.g. “Torque in 30 seconds”" : "A title that tells the truth"}
              className="w-full resize-none bg-transparent font-serif text-[30px] leading-[1.15] font-medium tracking-[-0.015em] text-ink outline-none placeholder:text-muted/50 md:text-[36px]"
            />
            {(kind === "link" || kind === "video") && (
              <div className="relative mt-2">
                {kind === "video" ? (
                  <Video className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" />
                ) : (
                  <Link2 className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" />
                )}
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={kind === "video" ? "Paste a YouTube link" : "https://"}
                  className="h-11 w-full rounded-xl border border-line bg-paper pr-4 pl-11 font-mono text-[13.5px] text-ink outline-none focus:border-ink"
                />
              </div>
            )}
          </div>

          {kind === "video" && vid && (
            <div className="px-6 pt-5 md:px-8">
              <YouTubePlayer media={{ kind: "youtube", id: vid, channel: videoMeta?.channel ?? "YouTube", title: videoMeta?.title ?? (title || "Video preview") }} />
            </div>
          )}

          {kind === "image" && (
            <div className="px-6 pt-5 md:px-8">
              {image ? (
                <div className="relative overflow-hidden rounded-2xl border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt={alt || "Uploaded image"} className="block max-h-[420px] w-full object-cover" />
                  <button onClick={() => setImage(null)} className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-ink/70 text-paper" aria-label="Remove image">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInput.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    void onFile(e.dataTransfer.files[0]);
                  }}
                  className={cn(
                    "flex h-56 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-colors",
                    dragging ? "border-value bg-value-soft" : "border-line-2 bg-paper hover:border-ink",
                  )}
                >
                  <ImagePlus className="h-8 w-8 text-value" strokeWidth={1.6} />
                  <span className="text-[14.5px] font-medium text-ink">Drop an image or click to upload</span>
                  <span className="text-[12.5px] text-muted">Diagrams, charts, notes, photos — resized automatically</span>
                </button>
              )}
              <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
              <input
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Alt text: describe the image for screen readers"
                className="mt-3 h-10 w-full rounded-xl border border-line bg-paper px-3.5 text-[13.5px] text-ink outline-none focus:border-ink"
              />
            </div>
          )}

          {short && (
            <div className="px-6 pt-6 md:px-8 md:pt-7">
              <div className="flex gap-3">
                {user && <Avatar name={user.name} tone="value" size={42} />}
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value.slice(0, 500))}
                  rows={kind === "poll" ? 2 : 4}
                  autoFocus
                  placeholder={bodyPlaceholder[kind]}
                  className="w-full resize-none bg-transparent pt-2 text-[19px] leading-[1.55] text-ink outline-none placeholder:text-muted/60"
                />
              </div>
              {kind === "poll" && (
                <div className="mt-4 space-y-2 sm:pl-[54px]">
                  {pollOptions.map((o, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={o}
                        onChange={(e) => setPollOptions(pollOptions.map((x, j) => (j === i ? e.target.value.slice(0, 40) : x)))}
                        placeholder={`Option ${i + 1}`}
                        className="h-11 flex-1 rounded-xl border border-line-2 bg-paper px-4 text-[14.5px] text-ink outline-none focus:border-ink"
                      />
                      {pollOptions.length > 2 && (
                        <button onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))} className="rounded-lg p-2 text-muted hover:text-ember" aria-label="Remove option">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 4 && (
                    <button onClick={() => setPollOptions([...pollOptions, ""])} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-value hover:underline">
                      <Plus className="h-3.5 w-3.5" /> Add option
                    </button>
                  )}
                </div>
              )}
              {kind === "note" && image && (
                <div className="relative mt-4 overflow-hidden rounded-2xl border border-line sm:ml-[54px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt={alt || "Attached image"} className="block max-h-[360px] w-full object-cover" />
                  <button onClick={() => setImage(null)} className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-ink/70 text-paper" aria-label="Remove image">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              {kind === "note" && (
                <div className="mt-3 flex items-center gap-2 sm:pl-[54px]">
                  <button onClick={() => fileInput.current?.click()} className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-[13px] font-medium text-value hover:bg-value-soft">
                    <ImagePlus className="h-4 w-4" /> Add photo
                  </button>
                  <input ref={kind === "note" ? fileInput : undefined} type="file" accept="image/*" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
                  <span className="ml-auto font-mono text-[11.5px] text-muted">{body.length}/500</span>
                </div>
              )}
            </div>
          )}

          {kind === "spark" && (
            <div className="mt-2 border-t border-line">
              <SparkBuilder theme={theme} setTheme={setTheme} scenes={scenes} setScenes={setScenes} />
            </div>
          )}

          {kind === "text" ? (
            <>
              <div className="mt-4 flex items-center justify-between border-y border-line px-4 py-2 md:px-6">
                <div className="flex items-center gap-0.5">
                  {TOOLBAR.map(({ Icon, before, after, line, label }) => (
                    <button
                      key={label}
                      onClick={() => wrap(before, after ?? before, line)}
                      disabled={tab === "preview"}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-body hover:bg-paper-2 hover:text-ink disabled:opacity-30"
                      aria-label={label}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
                <div className="inline-flex rounded-lg bg-paper-2 p-0.5 text-[12.5px]">
                  {(["write", "preview"] as const).map((t) => (
                    <button key={t} onClick={() => setTab(t)} className={cn("h-7 rounded-md px-3 capitalize transition-colors", tab === t ? "bg-card text-ink shadow-sm" : "text-muted")}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="min-h-[320px] px-6 py-6 md:px-8">
                {tab === "write" ? (
                  <textarea
                    ref={area}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={bodyPlaceholder.text}
                    className="min-h-[300px] w-full resize-y bg-transparent font-serif text-[19px] leading-[1.7] text-ink-2 outline-none placeholder:text-muted/55"
                  />
                ) : body.trim() ? (
                  <Markdown>{body}</Markdown>
                ) : (
                  <p className="font-serif text-[18px] text-muted italic">Nothing to preview yet.</p>
                )}
              </div>
            </>
          ) : short ? (
            <div className="h-5" />
          ) : (
            <div className="px-6 py-5 md:px-8">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={kind === "spark" ? 2 : 4}
                placeholder={bodyPlaceholder[kind]}
                className="w-full resize-y rounded-xl border border-line bg-paper px-4 py-3 font-serif text-[17px] leading-[1.6] text-ink-2 outline-none placeholder:text-muted/60 focus:border-ink"
              />
            </div>
          )}

          <div className="flex items-center justify-between border-t border-line px-6 py-4 md:px-8">
            <span className="font-mono text-[12px] text-muted">
              {kind === "spark" ? `${scenes.length} slides · ~${scenes.length * 4}s` : short ? topicName(topic) : `${words} words`}
            </span>
            <Button onClick={publish} disabled={!canPublish}>
              Publish <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <aside className="space-y-5">
        <div className="rounded-3xl border border-line bg-card p-6">
          <div className="flex items-center justify-between">
            <Eyebrow>Posts left today</Eyebrow>
            <span className="font-mono text-[12px] text-ink">{quota.left}</span>
          </div>
          <div className="mt-4 flex gap-1.5">
            {Array.from({ length: quota.limit }, (_, i) => (
              <span key={i} className={cn("h-9 flex-1 rounded-lg border", i < quota.used ? "border-ink bg-ink" : "border-dashed border-line-2")} />
            ))}
          </div>
          <p className="mt-4 text-[13px] leading-snug text-body">
            {quota.left === 0 ? "You've used today's posts. Your limit resets at midnight." : "Posting is free. Every 3 valuable posts adds one more per day."}
          </p>
        </div>

        <div className="rounded-3xl border border-line bg-card p-6">
          <Eyebrow>Before you publish</Eyebrow>
          <ul className="mt-4 space-y-3">
            {checks.map((c) => (
              <li key={c.label} className="flex items-start gap-3 text-[13.5px]">
                <span
                  className={cn(
                    "mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                    c.ok ? "border-value bg-value text-on-ink" : "border-line-2",
                  )}
                >
                  {c.ok && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                <span className={c.ok ? "text-ink" : "text-body"}>{c.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-line p-6">
          <Eyebrow>What happens next</Eyebrow>
          <ol className="mt-5 space-y-5">
            {[
              ["Screening", "Format, duplicates and topic checks."],
              ["Fair first audience", `~20 ${topicName(topic)} readers see it first.`],
              ["Earned reach", "It climbs only if people say it was worth it."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-paper-2 font-mono text-[11px] text-ink">{i + 1}</span>
                <span>
                  <span className="block text-[14px] font-semibold text-ink">{t}</span>
                  <span className="block text-[13px] text-body">{d}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </aside>

      <AnimatePresence>
        {published && <PublishOverlay topic={topic} kind={kind} postId={published} onClose={() => router.push(`/studio/${published}`)} />}
      </AnimatePresence>
    </div>
  );
}
