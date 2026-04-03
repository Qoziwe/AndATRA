import { create } from "zustand";
import type { ChatMessage } from "@/types/chat";

const initialMessages: ChatMessage[] = [
  {
    id: "traffic-system-1",
    role: "system",
    createdAt: new Date().toISOString(),
    content:
      "Ассистент по анализу трафика подключен. Задавайте вопросы о пробках, светофорах и рекомендациях.",
  },
];

interface TrafficAiChatState {
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
}

export const useTrafficAiChatStore = create<TrafficAiChatState>((set) => ({
  messages: initialMessages,
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: initialMessages }),
}));
