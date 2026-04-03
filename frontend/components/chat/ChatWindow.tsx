import { ScrollView, Text, View } from "react-native";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { useAppTheme } from "@/hooks/useAppTheme";
import type { ChatMessage as ChatMessageType } from "@/types/chat";

export const ChatWindow = ({
  messages,
  isTyping
}: {
  messages: ChatMessageType[];
  isTyping?: boolean;
}) => {
  const { colors } = useAppTheme();

  return (
    <View
      className="min-h-0 flex-1 rounded-[28px] border p-3"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 12, paddingBottom: 12, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isTyping ? (
          <View
            className="self-start rounded-[24px] border px-4 py-3"
            style={{ backgroundColor: colors.surfaceAlt, borderColor: colors.border }}
          >
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              Ассистент готовит ответ...
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};
