export type InterviewTopic =
  | "data-structures"
  | "algorithms"
  | "system-design"
  | "behavioral"
  | "javascript"
  | "react"
  | "databases"
  | "general";

export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  topic?: InterviewTopic;
}

export interface ChatSession {
  id: string;
  topic: InterviewTopic;
  messages: Message[];
  createdAt: number;
}

export interface TopicConfig {
  id: InterviewTopic;
  label: string;
  description: string;
  color: string;
  starterPrompts: string[];
}

export interface StreamChunk {
  type: "delta" | "done" | "error";
  content?: string;
  error?: string;
}
