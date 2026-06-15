"use client";

import { useRef, useState } from "react";

type AnalysisResult = {
  topic: string;
  target_audience: string;
  viral_score: number;
  hook_score: number;
  retention_score: number;
  strengths: string[];
  weaknesses: string[];
  improved_hooks: string[];
  improved_captions: string[];
  transcript: string;
  video_filename: string;
};

type Status = "idle" | "uploading" | "analyzing";

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
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
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

      setMessage(`${file.name} uploaded`);
    } catch {
      setMessage("Upload failed. Check that the API is running.");
    } finally {
      setStatus("idle");
    }
  }

  async function handleAnalyze() {
    setStatus("analyzing");
    setMessage("");

    try {
      const res = await fetch("http://localhost:8000/analyze", {
        method: "POST",
      });

      if (!res.ok) throw new Error("Analysis failed");

      const data = (await res.json()) as AnalysisResult;
      setResult(data);
      setMessage(`Analyzed ${data.video_filename}`);
    } catch {
      setMessage("Analysis failed. Upload a video and check your Groq key.");
    } finally {
      setStatus("idle");
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
            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
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
              disabled={busy}
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

        {result ? (
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="flex flex-col gap-6">
              <div className="rounded-lg border border-white/10 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">{result.video_filename}</p>
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

              <div className="grid gap-6 md:grid-cols-2">
                <InsightList title="Strengths" items={result.strengths} />
                <InsightList title="Weaknesses" items={result.weaknesses} />
              </div>

              <InsightList
                title="Improved Hooks"
                items={result.improved_hooks}
              />
              <InsightList
                title="Improved Captions"
                items={result.improved_captions}
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
