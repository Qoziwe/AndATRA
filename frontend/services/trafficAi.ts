import { api, unwrapApiResponse } from "@/services/api";
import type { ChatMessage } from "@/types/chat";
import type { TrafficAnalysisResponse } from "@/types/traffic";

export const fetchTrafficAnalysis = async (): Promise<TrafficAnalysisResponse> => {
  const response = await api.get("/api/traffic/analyze");
  return unwrapApiResponse<TrafficAnalysisResponse>(response);
};

interface BackendTrafficChatMessage {
  id?: number | null;
  role: ChatMessage["role"];
  content: string;
  created_at: string;
}

export const sendTrafficChatMessage = async (
  message: string,
  history: ChatMessage[],
  trafficContext: string
): Promise<ChatMessage> => {
  const response = await api.post("/api/traffic/chat", {
    message,
    history,
    traffic_context: trafficContext,
  });
  const data = unwrapApiResponse<BackendTrafficChatMessage>(response);

  return {
    id: data.id ? String(data.id) : `traffic-assistant-${Date.now()}`,
    role: data.role,
    content: data.content,
    createdAt: data.created_at,
  };
};
