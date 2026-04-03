import { useMutation } from "@tanstack/react-query";
import { sendMessage } from "@/services/chat";
import { useChatStore } from "@/stores/chatStore";
import type { ChatMessage } from "@/types/chat";

export const useChat = () => {
  const messages = useChatStore((state) => state.messages);
  const addMessage = useChatStore((state) => state.addMessage);
  const clearMessages = useChatStore((state) => state.clearMessages);

  const mutation = useMutation({
    mutationFn: async (content: string) => {
      const existingMessages = useChatStore.getState().messages;
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        createdAt: new Date().toISOString()
      };
      addMessage(userMessage);
      const assistant = await sendMessage(content, [...existingMessages, userMessage]);
      addMessage(assistant);
      return assistant;
    }
  });

  return {
    messages,
    isTyping: mutation.isPending,
    send: mutation.mutateAsync,
    error: mutation.error,
    clearMessages
  };
};
