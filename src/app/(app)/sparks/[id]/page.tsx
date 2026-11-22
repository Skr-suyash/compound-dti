"use client";

import { useParams, useRouter } from "next/navigation";
import { SparkPlayer } from "@/components/spark-player";
import { useStore } from "@/lib/store";

export default function SparkPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const feed = useStore((s) => s.feed);
  const ids = feed?.sparks.includes(id) ? feed.sparks : [id];
  return (
    <SparkPlayer
      ids={ids}
      startId={id}
      onClose={() => {
        if (window.history.length > 1) router.back();
        else router.push("/feed");
      }}
    />
  );
}
