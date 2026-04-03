export type ChatRole = "user" | "assistant" | "system";

export interface ChatAttachment {
  id: string;
  kind: "txt" | "pdf";
  label: string;
  filename: string;
  title: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  tags?: string[];
  attachments?: ChatAttachment[];
}
