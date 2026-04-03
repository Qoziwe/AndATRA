import { View, Pressable, Text } from "react-native";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { FadeInView } from "@/components/common/FadeInView";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useTrafficChat, buildTrafficContext } from "@/hooks/useTrafficAi";
import { useFeedbackStore } from "@/stores/feedbackStore";
import type { TrafficRecommendation } from "@/types/traffic";

const prompts = [
  "Самые проблемные зоны?",
  "Сводка по пробкам",
  "Оптимизация Аль-Фараби",
  "Где срочно нужны изменения?",
];

export const TrafficChatPanel = ({
  recommendations,
}: {
  recommendations: TrafficRecommendation[];
}) => {
  const { colors } = useAppTheme();
  const pushToast = useFeedbackStore((state) => state.pushToast);
  const { messages, isTyping, send, clearMessages } = useTrafficChat();

  const handleSend = async (message: string) => {
    const context = buildTrafficContext(recommendations);
    await send({ content: message, trafficContext: context });
  };

  const handleClear = () => {
    clearMessages();
    pushToast({
      title: "Чат очищен",
      description: "История диалога с ИИ о пробках удалена.",
    });
  };

  const hasHistory = messages.length > 1;

  return (
    <View className="min-h-0 flex-1 rounded-[32px] border bg-card p-4 mx-2">
      <View className="mb-4 flex-row items-center justify-between px-2">
        <Text className="text-xl font-bold" style={{ color: colors.text }}>
          Чат по пробкам
        </Text>
        <Pressable onPress={handleClear} disabled={isTyping || !hasHistory}>
          <Text
            className="text-sm font-semibold"
            style={{ color: isTyping || !hasHistory ? colors.muted : colors.primary }}
          >
            Очистить
          </Text>
        </Pressable>
      </View>

      <View className="min-h-0 flex-1 mb-4">
        <ChatWindow messages={messages} isTyping={isTyping} />
      </View>

      <FadeInView delay={100}>
        <View className="mb-4 flex-row flex-wrap gap-2 justify-center">
          {prompts.map((label) => (
            <Pressable
              key={label}
              onPress={() => handleSend(label)}
              disabled={isTyping}
              className="rounded-full px-4 py-2"
              style={{
                backgroundColor: colors.surfaceAlt,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: isTyping ? 0.5 : 1,
              }}
            >
              <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        <ChatInput onSend={handleSend} disabled={isTyping} minimal />
      </FadeInView>
    </View>
  );
};
