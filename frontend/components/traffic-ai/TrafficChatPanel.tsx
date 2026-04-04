import { Platform, Pressable, Text, View, useWindowDimensions } from "react-native";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useAppTheme } from "@/hooks/useAppTheme";
import { buildTrafficContext, useTrafficChat } from "@/hooks/useTrafficAi";
import { useFeedbackStore } from "@/stores/feedbackStore";
import type { TrafficRecommendation } from "@/types/traffic";

const CHAT_TITLE = "\u0427\u0430\u0442 \u043f\u043e \u043f\u0440\u043e\u0431\u043a\u0430\u043c";
const CLEAR_LABEL = "\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c";
const CLEAR_TOAST_TITLE = "\u0427\u0430\u0442 \u043e\u0447\u0438\u0449\u0435\u043d";
const CLEAR_TOAST_DESCRIPTION =
  "\u0418\u0441\u0442\u043e\u0440\u0438\u044f \u0434\u0438\u0430\u043b\u043e\u0433\u0430 \u0441 \u0418\u0418 \u043e \u043f\u0440\u043e\u0431\u043a\u0430\u0445 \u0443\u0434\u0430\u043b\u0435\u043d\u0430.";

export const TrafficChatPanel = ({
  recommendations,
}: {
  recommendations: TrafficRecommendation[];
}) => {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const pushToast = useFeedbackStore((state) => state.pushToast);
  const { messages, isTyping, send, clearMessages } = useTrafficChat();
  const isDesktopLayout = Platform.OS === "web" && width >= 1100;

  const handleSend = async (message: string) => {
    const context = buildTrafficContext(recommendations);
    await send({ content: message, trafficContext: context });
  };

  const handleClear = () => {
    clearMessages();
    pushToast({
      title: CLEAR_TOAST_TITLE,
      description: CLEAR_TOAST_DESCRIPTION,
    });
  };

  const hasHistory = messages.length > 1;
  const conversationMessages = messages.filter((message) => message.role !== "system");

  return (
    <View
      className="min-h-0 flex-1 rounded-[28px] border bg-card px-3 py-3"
      style={{ minHeight: isDesktopLayout ? 0 : 560 }}
    >
      <View className="mb-3 flex-row items-center justify-between px-1">
        <Text className="text-[18px] font-bold" style={{ color: colors.text }}>
          {CHAT_TITLE}
        </Text>
        <Pressable onPress={handleClear} disabled={isTyping || !hasHistory}>
          <Text
            className="text-[13px] font-semibold"
            style={{ color: isTyping || !hasHistory ? colors.muted : colors.primary }}
          >
            {CLEAR_LABEL}
          </Text>
        </Pressable>
      </View>

      <View className="min-h-0 flex-1 mb-3" style={{ minHeight: isDesktopLayout ? 340 : 260 }}>
        <ChatWindow messages={conversationMessages} isTyping={isTyping} compact />
      </View>

      <View style={{ flexShrink: 0 }}>
        <ChatInput onSend={handleSend} disabled={isTyping} minimal compact />
      </View>
    </View>
  );
};
