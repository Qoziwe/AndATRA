import { create } from "zustand";
import type { ChatMessage } from "@/types/chat";

const initialMessages: ChatMessage[] = [
  {
    id: "system-1",
    role: "system",
    createdAt: new Date().toISOString(),
    content: "Ассистент подключен к актуальным данным по обращениям, районам и аналитике."
  }
];

interface ChatState {
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: initialMessages,
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: initialMessages })
}));
