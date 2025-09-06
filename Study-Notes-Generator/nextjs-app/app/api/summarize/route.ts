import { NextRequest, NextResponse } from "next/server";

const OLLAMA_URL = "http://localhost:11434/api/chat";

export async function POST(req: NextRequest) {
  try {
    console.log("🚀 API called: /api/summarize");

    const { text } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: true, message: "No text found to summarize." },
        { status: 400 }
      );
    }

    const prompt = `Summarize the following into concise study notes with bullet points and bold keywords:\n\n${text}`;

    const ollamaRes = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3:latest",
        stream: false,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!ollamaRes.ok) {
      const errorText = await ollamaRes.text();
      console.error("❌ Ollama error:", errorText);
      return NextResponse.json(
        { error: true, message: "Ollama responded with an error.", details: errorText },
        { status: 502 }
      );
    }

    const data = await ollamaRes.json();
    const summary = data?.message?.content || data?.response || "";

    if (!summary.trim()) {
      return NextResponse.json(
        { error: true, message: "Ollama returned empty summary." },
        { status: 500 }
      );
    }

    return NextResponse.json({ summary });
  } catch (err: any) {
    console.error("❌ Summarize API error:", err);
    return NextResponse.json(
      { error: true, message: err.message || "Unexpected server error." },
      { status: 500 }
    );
  }
}
