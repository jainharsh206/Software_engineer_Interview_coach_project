"use client";

import { TOPICS } from "@/src/lib/topics";
import type { InterviewTopic, TopicConfig } from "@/src/types";

interface TopicSelectorProps {
  onSelect: (topic: InterviewTopic) => void;
}

export function TopicSelector({ onSelect }: TopicSelectorProps) {
  return (
    <div className="landing">
      <div className="landing-header">
        <div className="brand">
          <span className="brand-prefix">{">"}</span>
          <span className="brand-name">PrepAI</span>
        </div>
        <p className="brand-tagline">
          Your interview coaching environment. Pick a topic to begin.
        </p>
      </div>

      <div className="topics-grid">
        {TOPICS.map((topic) => (
          <TopicCard key={topic.id} topic={topic} onSelect={onSelect} />
        ))}
      </div>

      <div className="landing-footer">
        <span>Powered by Claude</span>
        <span className="dot">·</span>
        <span>Built for engineers, by engineers</span>
      </div>
    </div>
  );
}

function TopicCard({
  topic,
  onSelect,
}: {
  topic: TopicConfig;
  onSelect: (id: InterviewTopic) => void;
}) {
  return (
    <button
      className="topic-card"
      onClick={() => onSelect(topic.id)}
      style={{ "--topic-color": topic.color } as React.CSSProperties}
    >
      <div className="topic-card-accent" />
      <div className="topic-card-body">
        <h3 className="topic-label">{topic.label}</h3>
        <p className="topic-desc">{topic.description}</p>
      </div>
      <div className="topic-card-starters">
        {topic.starterPrompts.slice(0, 1).map((p, i) => (
          <span key={i} className="topic-starter-preview">
            {p}
          </span>
        ))}
      </div>
    </button>
  );
}
