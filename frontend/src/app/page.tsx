"use client";

import Link from "next/link";
import { useRef, useState } from "react";

type AnalysisResult = {
  video_id: number;
  topic: string;
  target_audience: string;
  viral_score: number;
  hook_score: number;
  retention_score: number;
  strengths: string[];
  weaknesses: string[];
  improved_hooks: string[];
  improved_captions: string[];
  visual_summary: string;
  visual_hook_score: number;
  pacing_score: number;
  production_quality_score: number;
  on_screen_text: string[];
  visual_strengths: string[];
  visual_weaknesses: string[];
  editing_suggestions: string[];
  transcript: string;
  video_filename: string;
};

type UploadResult = {
  video_id: number;
  filename: string;
  filepath: string;
};

type Status = "idle" | "uploading" | "analyzing";

const analysisStages = [
  { percent: 12, label: "Preparing video" },
  { percent: 28, label: "Transcribing audio" },
  { percent: 46, label: "Sampling video frames" },
  { percent: 66, label: "Analyzing visuals" },
  { percent: 84, label: "Building creator report" },
  { percent: 95, label: "Saving analysis" },
];

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
  value: number;
  max: number;
}) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <section className="rounded-lg border border-white/10 bg-zinc-900 p-4">
      <div className="flex items-end justify-between gap-3">
        <p className="text-sm text-zinc-400">{label}</p>
        <p className="text-3xl font-semibold text-white">
          {value}
          <span className="text-base text-zinc-500">/{max}</span>
        </p>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full ${scoreColor(value, max)}`}
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
    </section>
  );
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [uploadedVideoId, setUploadedVideoId] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    if (!file) return;

    setStatus("uploading");
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = (await res.json()) as UploadResult;
      setUploadedVideoId(data.video_id);
      setResult(null);
      setMessage(`${data.filename} uploaded`);
    } catch {
      setMessage("Upload failed. Check that the API is running.");
    } finally {
      setStatus("idle");
    }
  }

  async function handleAnalyze() {
    if (uploadedVideoId === null) {
      setMessage("Upload a video before analyzing.");
      return;
    }

    setStatus("analyzing");
    setAnalysisProgress(analysisStages[0].percent);
    setAnalysisStage(analysisStages[0].label);
    setMessage("");
    let stageIndex = 0;
    const progressTimer = window.setInterval(() => {
      stageIndex = Math.min(stageIndex + 1, analysisStages.length - 1);
      setAnalysisProgress(analysisStages[stageIndex].percent);
      setAnalysisStage(analysisStages[stageIndex].label);
    }, 3500);

    try {
      const res = await fetch(
        `http://localhost:8000/analyze/${uploadedVideoId}`,
        {
          method: "POST",
        },
      );

      if (!res.ok) throw new Error("Analysis failed");

      const data = (await res.json()) as AnalysisResult;
      setAnalysisProgress(100);
      setAnalysisStage("Analysis complete");
      setResult(data);
      setMessage(`Analyzed ${data.video_filename}`);
    } catch {
      setMessage("Analysis failed. Upload a video and check your Groq key.");
    } finally {
      window.clearInterval(progressTimer);
      setStatus("idle");
      setTimeout(() => {
        setAnalysisProgress(0);
        setAnalysisStage("");
      }, 900);
    }
  }

  const busy = status !== "idle";

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col justify-between gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-4xl font-semibold tracking-normal text-white">
              CreatorOS
            </h1>
            <p className="mt-2 text-zinc-400">
              AI-powered short-form video analysis
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/history"
              className="rounded-lg border border-white/10 bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              History
            </Link>

            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setUploadedVideoId(null);
                setMessage("");
              }}
            />

            <button
              onClick={() => inputRef.current?.click()}
              className="rounded-lg border border-white/10 bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              {file ? file.name : "Choose Video"}
            </button>

            <button
              onClick={handleUpload}
              disabled={!file || busy}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {status === "uploading" ? "Uploading..." : "Upload"}
            </button>

            <button
              onClick={handleAnalyze}
              disabled={uploadedVideoId === null || busy}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {status === "analyzing" ? "Analyzing..." : "Analyze"}
            </button>
          </div>
        </header>

        {message && (
          <p className="rounded-lg border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
            {message}
          </p>
        )}

        {status === "analyzing" && (
          <section className="rounded-lg border border-emerald-500/20 bg-zinc-900 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Analyzing video
                </h2>
                <p className="mt-1 text-sm text-zinc-400">{analysisStage}</p>
              </div>
              <p className="text-2xl font-semibold text-emerald-400">
                {analysisProgress}%
              </p>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
          </section>
        )}

        {result ? (
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="flex flex-col gap-6">
              <div className="rounded-lg border border-white/10 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">
                  #{result.video_id} - {result.video_filename}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {result.topic}
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-300">
                  <span className="text-zinc-500">Target audience:</span>{" "}
                  {result.target_audience}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <MetricCard
                  label="Viral Score"
                  value={result.viral_score}
                  max={100}
                />
                <MetricCard
                  label="Hook Score"
                  value={result.hook_score}
                  max={10}
                />
                <MetricCard
                  label="Retention Score"
                  value={result.retention_score}
                  max={10}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <MetricCard
                  label="Visual Hook"
                  value={result.visual_hook_score}
                  max={10}
                />
                <MetricCard
                  label="Pacing"
                  value={result.pacing_score}
                  max={10}
                />
                <MetricCard
                  label="Production"
                  value={result.production_quality_score}
                  max={10}
                />
              </div>

              <section className="rounded-lg border border-white/10 bg-zinc-900 p-5">
                <h2 className="text-lg font-semibold text-white">
                  Visual Summary
                </h2>
                <p className="mt-4 text-sm leading-7 text-zinc-300">
                  {result.visual_summary}
                </p>
              </section>

              <div className="grid gap-6 md:grid-cols-2">
                <InsightList title="Strengths" items={result.strengths} />
                <InsightList title="Weaknesses" items={result.weaknesses} />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <InsightList
                  title="Visual Strengths"
                  items={result.visual_strengths}
                />
                <InsightList
                  title="Visual Weaknesses"
                  items={result.visual_weaknesses}
                />
              </div>

              <InsightList
                title="On-screen Text"
                items={result.on_screen_text}
              />
              <InsightList
                title="Improved Hooks"
                items={result.improved_hooks}
              />
              <InsightList
                title="Improved Captions"
                items={result.improved_captions}
              />
              <InsightList
                title="Editing Suggestions"
                items={result.editing_suggestions}
              />
            </section>

            <section className="rounded-lg border border-white/10 bg-zinc-900 p-5">
              <h2 className="text-lg font-semibold text-white">Transcript</h2>
              <p className="mt-4 max-h-[760px] overflow-auto whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                {result.transcript}
              </p>
            </section>
          </div>
        ) : (
          <section className="rounded-lg border border-dashed border-white/15 bg-zinc-900 px-5 py-16 text-center">
            <h2 className="text-xl font-semibold text-white">
              No analysis yet
            </h2>
          </section>
        )}
      </div>
    </main>
  );
}
