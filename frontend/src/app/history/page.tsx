"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type VideoSummary = {
  video_id: number;
  filename: string;
  uploaded_at: string;
  analyzed: boolean;
  topic: string | null;
  viral_score: number | null;
};

type AnalysisResult = {
  video_id: number;
  video_filename: string;
  transcript: string | null;
  topic: string | null;
  target_audience: string | null;
  viral_score: number | null;
  hook_score: number | null;
  retention_score: number | null;
  strengths: string[];
  weaknesses: string[];
  improved_hooks: string[];
  improved_captions: string[];
  visual_summary: string | null;
  visual_hook_score: number | null;
  pacing_score: number | null;
  production_quality_score: number | null;
  on_screen_text: string[];
  visual_strengths: string[];
  visual_weaknesses: string[];
  editing_suggestions: string[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function scoreColor(score: number, max: number) {
  const percent = (score / max) * 100;

  if (percent >= 75) return "bg-emerald-500";
  if (percent >= 50) return "bg-amber-400";
  return "bg-rose-500";
}

function MetricCard({
  label,
  value,
  max,
}: {
  label: string;
  value: number | null;
  max: number;
}) {
  const score = value ?? 0;
  const percent = Math.min(100, Math.max(0, (score / max) * 100));

  return (
    <section className="rounded-lg border border-white/10 bg-zinc-900 p-4">
      <div className="flex items-end justify-between gap-3">
        <p className="text-sm text-zinc-400">{label}</p>
        <p className="text-3xl font-semibold text-white">
          {value ?? "-"}
          <span className="text-base text-zinc-500">/{max}</span>
        </p>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full ${scoreColor(score, max)}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </section>
  );
}

function InsightList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg border border-white/10 bg-zinc-900 p-5">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {items.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {items.map((item, index) => (
            <li
              key={`${title}-${index}`}
              className="rounded-md bg-zinc-950 px-4 py-3 text-sm leading-6 text-zinc-200"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-zinc-500">None saved</p>
      )}
    </section>
  );
}

export default function HistoryPage() {
  const [videos, setVideos] = useState<VideoSummary[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<AnalysisResult | null>(
    null,
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");

  async function loadVideo(videoId: number) {
    setSelectedId(videoId);
    setLoadingDetail(true);
    setError("");

    try {
      const res = await fetch(`http://localhost:8000/videos/${videoId}`);
      if (!res.ok) throw new Error("Could not load video");

      const data = (await res.json()) as AnalysisResult;
      setSelectedVideo(data);
    } catch {
      setError("Could not load that saved analysis.");
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    async function loadVideos() {
      setLoadingList(true);
      setError("");

      try {
        const res = await fetch("http://localhost:8000/videos");
        if (!res.ok) throw new Error("Could not load videos");

        const data = (await res.json()) as VideoSummary[];
        setVideos(data);

        if (data.length > 0) {
          void loadVideo(data[0].video_id);
        }
      } catch {
        setError("Could not load history. Check that the API is running.");
      } finally {
        setLoadingList(false);
      }
    }

    void loadVideos();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col justify-between gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-4xl font-semibold tracking-normal text-white">
              History
            </h1>
            <p className="mt-2 text-zinc-400">Saved CreatorOS analyses</p>
          </div>

          <Link
            href="/"
            className="w-fit rounded-lg border border-white/10 bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Analyzer
          </Link>
        </header>

        {error && (
          <p className="rounded-lg border border-rose-500/20 bg-zinc-900 px-4 py-3 text-sm text-rose-200">
            {error}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-lg border border-white/10 bg-zinc-900 p-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-white">Videos</h2>
              <p className="text-sm text-zinc-500">{videos.length}</p>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {loadingList && (
                <p className="rounded-md bg-zinc-950 px-4 py-3 text-sm text-zinc-400">
                  Loading history...
                </p>
              )}

              {!loadingList && videos.length === 0 && (
                <p className="rounded-md bg-zinc-950 px-4 py-3 text-sm text-zinc-400">
                  No saved videos yet
                </p>
              )}

              {videos.map((video) => (
                <button
                  key={video.video_id}
                  onClick={() => loadVideo(video.video_id)}
                  className={`rounded-lg border px-4 py-3 text-left hover:bg-zinc-800 ${
                    selectedId === video.video_id
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-white/10 bg-zinc-950"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {video.filename}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {formatDate(video.uploaded_at)}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-emerald-400">
                      {video.viral_score ?? "-"}
                    </p>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-400">
                    {video.analyzed ? video.topic : "Not analyzed"}
                  </p>
                </button>
              ))}
            </div>
          </aside>

          <section className="min-w-0">
            {loadingDetail && (
              <div className="rounded-lg border border-white/10 bg-zinc-900 px-5 py-16 text-center">
                <h2 className="text-xl font-semibold text-white">
                  Loading report
                </h2>
              </div>
            )}

            {!loadingDetail && selectedVideo && (
              <div className="flex flex-col gap-6">
                <section className="rounded-lg border border-white/10 bg-zinc-900 p-5">
                  <p className="text-sm text-zinc-400">
                    #{selectedVideo.video_id} - {selectedVideo.video_filename}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {selectedVideo.topic ?? "Untitled analysis"}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    <span className="text-zinc-500">Target audience:</span>{" "}
                    {selectedVideo.target_audience ?? "Not saved"}
                  </p>
                </section>

                <div className="grid gap-4 md:grid-cols-3">
                  <MetricCard
                    label="Viral Score"
                    value={selectedVideo.viral_score}
                    max={100}
                  />
                  <MetricCard
                    label="Hook Score"
                    value={selectedVideo.hook_score}
                    max={10}
                  />
                  <MetricCard
                    label="Retention Score"
                    value={selectedVideo.retention_score}
                    max={10}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <MetricCard
                    label="Visual Hook"
                    value={selectedVideo.visual_hook_score}
                    max={10}
                  />
                  <MetricCard
                    label="Pacing"
                    value={selectedVideo.pacing_score}
                    max={10}
                  />
                  <MetricCard
                    label="Production"
                    value={selectedVideo.production_quality_score}
                    max={10}
                  />
                </div>

                <section className="rounded-lg border border-white/10 bg-zinc-900 p-5">
                  <h2 className="text-lg font-semibold text-white">
                    Visual Summary
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-zinc-300">
                    {selectedVideo.visual_summary ?? "Not saved"}
                  </p>
                </section>

                <div className="grid gap-6 md:grid-cols-2">
                  <InsightList
                    title="Strengths"
                    items={selectedVideo.strengths}
                  />
                  <InsightList
                    title="Weaknesses"
                    items={selectedVideo.weaknesses}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <InsightList
                    title="Visual Strengths"
                    items={selectedVideo.visual_strengths}
                  />
                  <InsightList
                    title="Visual Weaknesses"
                    items={selectedVideo.visual_weaknesses}
                  />
                </div>

                <InsightList
                  title="Improved Hooks"
                  items={selectedVideo.improved_hooks}
                />
                <InsightList
                  title="Improved Captions"
                  items={selectedVideo.improved_captions}
                />
                <InsightList
                  title="Editing Suggestions"
                  items={selectedVideo.editing_suggestions}
                />

                <section className="rounded-lg border border-white/10 bg-zinc-900 p-5">
                  <h2 className="text-lg font-semibold text-white">
                    Transcript
                  </h2>
                  <p className="mt-4 max-h-[520px] overflow-auto whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                    {selectedVideo.transcript ?? "Not saved"}
                  </p>
                </section>
              </div>
            )}

            {!loadingDetail && !selectedVideo && videos.length === 0 && (
              <div className="rounded-lg border border-dashed border-white/15 bg-zinc-900 px-5 py-16 text-center">
                <h2 className="text-xl font-semibold text-white">
                  No report selected
                </h2>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
