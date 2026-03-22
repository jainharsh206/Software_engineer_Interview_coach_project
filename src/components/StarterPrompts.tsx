"use client";

import { getTopicById } from "@/src/lib/topics";
import type { InterviewTopic } from "@/src/types";

interface StarterPromptsProps {
  topic: InterviewTopic;
  onSelect: (prompt: string) => void;
}

export function StarterPrompts({ topic, onSelect }: StarterPromptsProps) {
  const config = getTopicById(topic);

  return (
    <div className="starter-prompts">
      <div className="starter-header">
        <span className="starter-label">
          <span className="starter-dot" style={{ background: config.color }} />
          {config.label} session started
        </span>
        <p className="starter-hint">Try one of these to get started:</p>
      </div>
      <div className="starter-list">
        {config.starterPrompts.map((prompt, i) => (
          <button
            key={i}
            className="starter-item"
            onClick={() => onSelect(prompt)}
          >
            <span className="starter-index">{String(i + 1).padStart(2, "0")}</span>
            <span className="starter-text">{prompt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
