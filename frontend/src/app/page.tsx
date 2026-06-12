"use client";
import { useState, useRef } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    await fetch("http://localhost:8000/upload", {
      method: "POST",
      body: formData,
    });
  }

  async function handleAnalyze() {
    const res = await fetch("http://localhost:8000/analyze", {
      method: "POST",
    });
    const data = await res.json();
    setResult(data);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-5xl font-bold">CreatorOS</h1>
      <p className="text-lg">AI-powered creator analytics platform</p>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />

      <button
        onClick={() => inputRef.current?.click()}
        className="mt-4 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
      >
        {file ? file.name : "Choose File"}
      </button>

      <button
        onClick={handleUpload}
        disabled={!file}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40"
      >
        Upload Video
      </button>

      <button
        onClick={handleAnalyze}
        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
      >
        Analyze
      </button>

      {result && (
        <div className="mt-6 p-6 bg-gray-800 rounded-lg max-w-lg w-full text-sm">
          <p><span className="text-gray-400">Topic:</span> {result.topic}</p>
          <p><span className="text-gray-400">Audience:</span> {result.audience}</p>
          <p><span className="text-gray-400">Hook Strength:</span> {result.hook_strength}/10</p>
          <p className="text-gray-400">Hook Ideas:</p>
          <ul className="list-disc ml-4">
            {result.hook_ideas?.map((idea: string, i: number) => (
              <li key={i}>{idea}</li>
            ))}
          </ul>
          <p><span className="text-gray-400">Caption:</span> {result.caption}</p>
        </div>
      )}
    </main>
  );
}