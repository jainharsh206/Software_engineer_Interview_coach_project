"use client";

import { useState, useCallback, useRef } from "react";
import type { Message, InterviewTopic, ChatSession } from "@/src/types";

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

interface UseChatReturn {
  session: ChatSession | null;
  isStreaming: boolean;
  error: string | null;
  startSession: (topic: InterviewTopic) => void;
  sendMessage: (content: string) => Promise<void>;
  clearError: () => void;
  resetSession: () => void;
}

export function useChat(): UseChatReturn {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startSession = useCallback((topic: InterviewTopic) => {
    setSession({
      id: generateId(),
      topic,
      messages: [],
      createdAt: Date.now(),
    });
    setError(null);
  }, []);

  const resetSession = useCallback(() => {
    abortControllerRef.current?.abort();
    setSession(null);
    setIsStreaming(false);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!session || isStreaming || !content.trim()) return;

      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content: content.trim(),
        timestamp: Date.now(),
        topic: session.topic,
      };

      const updatedMessages = [...session.messages, userMessage];
      const currentTopic = session.topic;

      setSession((prev) =>
        prev ? { ...prev, messages: updatedMessages } : null
      );
      setIsStreaming(true);
      setError(null);

      const assistantMessageId = generateId();

      setSession((prev) =>
        prev
          ? {
              ...prev,
              messages: [
                ...updatedMessages,
                {
                  id: assistantMessageId,
                  role: "assistant" as const,
                  content: "",
                  timestamp: Date.now(),
                  topic: currentTopic,
                },
              ],
            }
          : null
      );

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages,
            topic: currentTopic,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          let errMsg = "Request failed";
          try {
            const data = await response.json();
            errMsg = data.error ?? errMsg;
          } catch { /* ignore parse error */ }
          throw new Error(errMsg);
        }

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            let chunk: { type: string; content?: string; error?: string };
            try {
              chunk = JSON.parse(jsonStr);
            } catch {
              continue;
            }

            if (chunk.type === "delta" && typeof chunk.content === "string") {
              // Capture content in a const so the closure captures the right value
              const deltaText = chunk.content;
              setSession((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  messages: prev.messages.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: msg.content + deltaText }
                      : msg
                  ),
                };
              });
            } else if (chunk.type === "error") {
              throw new Error(chunk.error ?? "Stream error");
            }
            // "done" type — just let the loop end naturally
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        const msg =
          err instanceof Error ? err.message : "Something went wrong";
        setError(msg);
        // Remove the empty assistant placeholder on error
        setSession((prev) =>
          prev
            ? {
                ...prev,
                messages: prev.messages.filter(
                  (m) => m.id !== assistantMessageId
                ),
              }
            : null
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [session, isStreaming]
  );

  return {
    session,
    isStreaming,
    error,
    startSession,
    sendMessage,
    clearError,
    resetSession,
  };
}