import { NextRequest } from "next/server";
import { buildSystemPrompt } from "@/src/lib/topics";
import type { InterviewTopic, Message } from "@/src/types";

// Node.js runtime — required for proper streaming when proxying SSE responses.
export const runtime = "nodejs";

// gemini-2.0-flash often hits free-tier limit:0; 2.5 Flash-Lite is a good default.
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";
const FALLBACK_GEMINI_MODEL = "gemini-2.5-flash";

function resolveApiKey(): string | undefined {
  return (
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_API_KEY ??
    process.env.ANTHROPIC_API_KEY
  );
}

function modelsToTry(): string[] {
  const explicit = process.env.GEMINI_MODEL?.trim();
  if (explicit) {
    return [explicit];
  }
  return [DEFAULT_GEMINI_MODEL, FALLBACK_GEMINI_MODEL];
}

function quotaHint(): string {
  return (
    "Gemini quota exceeded (429). Google often reports `limit: 0` when this API key/project has no free-tier " +
    "allocation for that model, or billing is off. Options: (1) Enable billing for the Cloud project linked to " +
    "your key at https://console.cloud.google.com/billing — (2) Create a new API key in " +
    "https://aistudio.google.com/apikey — (3) Set GEMINI_MODEL in .env.local to another model your account can use."
  );
}

function errorResponse(message: string, status: number = 502) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: NextRequest) {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    return errorResponse(
      "API key not configured. Set GEMINI_API_KEY (or GOOGLE_API_KEY) in .env.local.",
      500
    );
  }

  let body: { messages: Message[]; topic: InterviewTopic };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const { messages, topic } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return errorResponse("Messages are required", 400);
  }

  const systemPrompt = buildSystemPrompt(topic ?? "general");

  const contents = messages.map((msg) => ({
    role: msg.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: msg.content }],
  }));

  const requestBody = JSON.stringify({
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
  });

  let lastStatus = 0;
  let lastErrText = "";
  const modelList = modelsToTry();

  for (const model of modelList) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:streamGenerateContent?alt=sse`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: requestBody,
    });

    lastStatus = geminiRes.status;

    // Must not call .text() on success — that consumes the body and locks the stream before we pipe SSE.
    if (geminiRes.ok && geminiRes.body) {
      return sseStreamFromGemini(geminiRes.body);
    }

    lastErrText = await geminiRes.text().catch(() => "Unknown error");

    if (geminiRes.status === 429) {
      if (modelList.length > 1 && model === modelList[0]) {
        continue;
      }
      return errorResponse(
        quotaHint() + " Last model: " + model + ". Details: " + lastErrText
      );
    }

    return errorResponse(
      "Gemini API error: " + geminiRes.status + " — " + lastErrText
    );
  }

  return errorResponse(
    "Gemini API error: " + lastStatus + " — " + lastErrText
  );
}

function sseStreamFromGemini(body: ReadableStream<Uint8Array>) {
  const encoder = new TextEncoder();
  const geminiReader = body.getReader();
  const decoder = new TextDecoder();

  const readable = new ReadableStream({
    async start(controller) {
      let buffer = "";

      const enqueue = (obj: object) => {
        controller.enqueue(encoder.encode("data: " + JSON.stringify(obj) + "\n\n"));
      };

      try {
        while (true) {
          const { done, value } = await geminiReader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;

            let parsed: {
              candidates?: Array<{
                content?: { parts?: Array<{ text?: string }> };
              }>;
              error?: { message?: string };
            };
            try {
              parsed = JSON.parse(raw);
            } catch {
              continue;
            }

            if (parsed.error?.message) {
              enqueue({ type: "error", error: parsed.error.message });
              controller.close();
              return;
            }

            const parts = parsed.candidates?.[0]?.content?.parts;
            if (!parts?.length) continue;

            for (const part of parts) {
              if (part.text) {
                enqueue({ type: "delta", content: part.text });
              }
            }
          }
        }

        enqueue({ type: "done" });
        controller.close();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Stream error";
        enqueue({ type: "error", error: errorMsg });
        controller.close();
      }
    },
    cancel() {
      geminiReader.cancel();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}
