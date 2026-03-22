"use client";

import { Markdown } from "./Markdown";
import type { Message } from "@/src/types";

interface MessageBubbleProps {
  message: Message;
  isLatestAssistant?: boolean;
}

export function MessageBubble({
  message,
  isLatestAssistant,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isEmpty = !message.content && !isUser;

  return (
    <div className={`message ${isUser ? "message-user" : "message-assistant"}`}>
      <div className="message-role">
        {isUser ? "you" : "prepai"}
      </div>
      <div className="message-content">
        {isEmpty ? (
          <span className="thinking-indicator">
            <span />
            <span />
            <span />
          </span>
        ) : isUser ? (
          <p className="user-text">{message.content}</p>
        ) : (
          <Markdown content={message.content} />
        )}
        {isLatestAssistant && message.content && (
          <div className="cursor-blink" aria-hidden />
        )}
      </div>
    </div>
  );
}
