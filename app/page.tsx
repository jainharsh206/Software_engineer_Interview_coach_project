"use client";

import { useChat } from "@/src/hooks/useChat";
import { TopicSelector } from "@/src/components/TopicSelector";
import { ChatInterface } from "@/src/components/ChatInterface";

export default function Home() {
  const { session, isStreaming, error, startSession, sendMessage, clearError, resetSession } =
    useChat();

  return (
    <div className="app-root">
      {!session ? (
        <TopicSelector onSelect={startSession} />
      ) : (
        <ChatInterface
          session={session}
          isStreaming={isStreaming}
          error={error}
          onSend={sendMessage}
          onReset={resetSession}
          onClearError={clearError}
        />
      )}
    </div>
  );
}
