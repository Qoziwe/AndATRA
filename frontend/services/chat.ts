import { api, unwrapApiResponse } from "@/services/api";
import type { ChatAttachment, ChatMessage } from "@/types/chat";

interface BackendChatAttachment {
  id: string;
  kind: ChatAttachment["kind"];
  label: string;
  filename: string;
  title: string;
  content: string;
}

interface BackendChatMessage {
  id?: number | null;
  role: ChatMessage["role"];
  content: string;
  created_at: string;
  attachments?: BackendChatAttachment[];
}

export const sendMessage = async (
  message: string,
  history: ChatMessage[]
): Promise<ChatMessage> => {
  const response = await api.post("/api/chat", { message, history });
  const data = unwrapApiResponse<BackendChatMessage>(response);

  return {
    id: data.id ? String(data.id) : `assistant-${Date.now()}`,
    role: data.role,
    content: data.content,
    createdAt: data.created_at,
    attachments: data.attachments ?? []
  };
};
