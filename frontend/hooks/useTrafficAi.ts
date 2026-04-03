import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchTrafficAnalysis, sendTrafficChatMessage } from "@/services/trafficAi";
import { useTrafficAiChatStore } from "@/stores/trafficAiStore";
import type { ChatMessage } from "@/types/chat";
import type { TrafficRecommendation } from "@/types/traffic";

export const useTrafficRecommendations = () =>
  useQuery({
    queryKey: ["traffic-recommendations"],
    queryFn: fetchTrafficAnalysis,
    refetchInterval: 120_000,
    staleTime: 60_000,
  });

export const useTrafficChat = () => {
  const messages = useTrafficAiChatStore((state) => state.messages);
  const addMessage = useTrafficAiChatStore((state) => state.addMessage);
  const clearMessages = useTrafficAiChatStore((state) => state.clearMessages);

  const mutation = useMutation({
    mutationFn: async ({
      content,
      trafficContext,
    }: {
      content: string;
      trafficContext: string;
    }) => {
      const existingMessages = useTrafficAiChatStore.getState().messages;
      const userMessage: ChatMessage = {
        id: `traffic-user-${Date.now()}`,
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };
      addMessage(userMessage);
      const assistant = await sendTrafficChatMessage(
        content,
        [...existingMessages, userMessage],
        trafficContext
      );
      addMessage(assistant);
      return assistant;
    },
  });

  return {
    messages,
    isTyping: mutation.isPending,
    send: mutation.mutateAsync,
    error: mutation.error,
    clearMessages,
  };
};

export const buildTrafficContext = (
  recommendations: TrafficRecommendation[]
): string => {
  if (!recommendations.length) return "Данные пробок не загружены.";

  const lines = recommendations.map(
    (rec) =>
      `${rec.intersection_name}: скорость ${rec.current_speed_kmh} км/ч (свободная ${rec.free_flow_speed_kmh}), ` +
      `загрузка ${rec.congestion_percent}%, severity: ${rec.severity}. ` +
      `Рекомендация: ${rec.recommendation}`
  );

  return `Текущие данные пробок Алматы:\n${lines.join("\n")}`;
};
