"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { StarterPrompts } from "./StarterPrompts";
import { getTopicById } from "@/src/lib/topics";
import type { ChatSession } from "@/src/types";

interface ChatInterfaceProps {
  session: ChatSession;
  isStreaming: boolean;
  error: string | null;
  onSend: (content: string) => void;
  onReset: () => void;
  onClearError: () => void;
}

export function ChatInterface({
  session,
  isStreaming,
  error,
  onSend,
  onReset,
  onClearError,
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const topicConfig = getTopicById(session.topic);
  const hasMessages = session.messages.length > 0;
  const lastMsgIndex = session.messages.length - 1;

  // Scroll to bottom on new content
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages, isStreaming]);

  return (
    <div className="chat-layout">
      {/* Header */}
      <header className="chat-header">
        <div className="chat-header-left">
          <button className="back-btn" onClick={onReset} aria-label="Back to topics">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M9 2L4 7L9 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="chat-topic-badge" style={{ "--topic-color": topicConfig.color } as React.CSSProperties}>
            <span className="topic-badge-dot" />
            <span>{topicConfig.label}</span>
          </div>
        </div>
        <div className="header-brand">PrepAI</div>
      </header>

      {/* Messages area */}
      <main className="messages-area">
        {!hasMessages ? (
          <StarterPrompts topic={session.topic} onSelect={onSend} />
        ) : (
          <div className="messages-list">
            {session.messages.map((msg, idx) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isLatestAssistant={
                  msg.role === "assistant" && idx === lastMsgIndex && isStreaming
                }
              />
            ))}
            <div ref={messagesEndRef} aria-hidden />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button onClick={onClearError} className="error-dismiss">
              Dismiss
            </button>
          </div>
        )}
      </main>

      {/* Input */}
      <footer className="chat-footer">
        <ChatInput
          onSend={onSend}
          disabled={isStreaming}
          placeholder={`Ask about ${topicConfig.label.toLowerCase()}...`}
        />
      </footer>
    </div>
  );
}
