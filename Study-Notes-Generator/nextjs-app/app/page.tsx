"use client";

import { useState, useRef, useEffect, DragEvent } from "react";
import { UploadCloud, FileText, Bot, AlertTriangle, X } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";
import pdfToText from "react-pdftotext";

export default function StudyNotesGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState("");
  const [sanitizedSummary, setSanitizedSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(""); // <-- track progress
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!summary) return;
    let html = summary
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/^\s*[\*-]\s*(.*)/gm, "<li>$1</li>")
      .replace(/\n\n/g, "</p><p>");
    if (html.includes("<li>")) html = `<ul>${html}</ul>`;
    else html = `<p>${html}</p>`;
    setSanitizedSummary(DOMPurify.sanitize(html));
  }, [summary]);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setSummary("");
    setStep("Extracting text from PDF…");
    console.log("📂 File selected:", file.name);

    try {
      // STEP 1: Extract text from PDF
      const text = await pdfToText(file);
      console.log("📝 Extracted text:", text.slice(0, 200), "...");
      setStep("Sending text to API…");

      // STEP 2: Send extracted text to backend
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      console.log("📥 Response status:", res.status);

      if (!res.ok) {
        const raw = await res.text();
        console.error("❌ Raw Response:", raw);
        throw new Error(`Server error: ${raw.slice(0, 200)}`);
      }

      // STEP 3: Handle API JSON
      const data = await res.json();
      console.log("✅ Response JSON:", data);

      if (data.error) throw new Error(data.message || "Unexpected error");

      setSummary(data.summary);
      setStep("✅ Summary received!");
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message);
      setStep("❌ Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setFile(e.dataTransfer.files?.[0] || null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block p-3 bg-blue-500/10 rounded-lg mb-4">
            <Bot size={40} className="text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 text-transparent bg-clip-text">
            Study Notes Generator
          </h1>
          <p className="text-gray-400 mt-2">
            Upload a PDF and get concise notes powered by local AI.
          </p>
        </div>

        {/* Upload Box */}
        <div
          className="glass p-6 rounded-xl border-2 border-dashed border-gray-600"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <UploadCloud size={48} className="text-gray-500 mx-auto mb-4" />
          <p className="text-center text-gray-400">
            <span
              className="text-blue-400 font-semibold cursor-pointer"
              onClick={() => inputRef.current?.click()}
            >
              Click to upload
            </span>{" "}
            or drag and drop a PDF
          </p>
          <input
            type="file"
            accept="application/pdf"
            ref={inputRef}
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        {/* File Info */}
        {file && (
          <div className="mt-4 flex items-center justify-between bg-gray-800 p-3 rounded">
            <div className="flex items-center gap-2">
              <FileText className="text-blue-400" />
              <span>{file.name}</span>
            </div>
            <button onClick={() => setFile(null)}>
              <X size={20} className="text-gray-400 hover:text-white" />
            </button>
          </div>
        )}

        {/* Progress */}
        {step && (
          <div className="mt-4 text-center text-sm text-gray-300">
            <p>{step}</p>
          </div>
        )}

        {/* Generate Button */}
        <button
          disabled={!file || loading}
          onClick={handleUpload}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded disabled:bg-gray-700"
        >
          {loading ? "Processing…" : "Generate Notes"}
        </button>

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg flex items-center gap-3">
            <AlertTriangle size={20} />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Summary */}
        {sanitizedSummary && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              Your Study Notes
            </h2>
            <div
              className="glass p-6 rounded-xl 
             prose prose-invert 
             prose-strong:text-blue-400 
             prose-li:marker:text-blue-400 
             prose-h1:text-3xl prose-h1:font-bold 
             prose-h2:text-2xl prose-h2:font-semibold 
             prose-h3:text-xl prose-h3:font-semibold"
              dangerouslySetInnerHTML={{ __html: sanitizedSummary }}
            />
          </div>
        )}
      </div>
    </main>
  );
}
