import { useEffect, useRef } from "react";
import { ScrollView, Text, View } from "react-native";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { useAppTheme } from "@/hooks/useAppTheme";
import type { ChatMessage as ChatMessageType } from "@/types/chat";

const TYPING_LABEL = "\u0410\u0441\u0441\u0438\u0441\u0442\u0435\u043d\u0442 \u0433\u043e\u0442\u043e\u0432\u0438\u0442 \u043e\u0442\u0432\u0435\u0442...";

export const ChatWindow = ({
  messages,
  isTyping,
  compact
}: {
  messages: ChatMessageType[];
  isTyping?: boolean;
  compact?: boolean;
}) => {
  const { colors } = useAppTheme();
  const scrollRef = useRef<ScrollView>(null);

  const scrollToBottom = (animated = true) => {
    scrollRef.current?.scrollToEnd({ animated });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [messages.length, isTyping]);

  return (
    <View
      className={`min-h-0 flex-1 border ${compact ? "rounded-[24px] p-2.5" : "rounded-[28px] p-3"}`}
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: compact ? 8 : 12, paddingBottom: compact ? 8 : 12, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollToBottom()}
        onLayout={() => scrollToBottom(false)}
      >
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} compact={compact} />
        ))}
        {isTyping ? (
          <View
            className={`self-start border ${compact ? "rounded-[20px] px-3 py-2.5" : "rounded-[24px] px-4 py-3"}`}
            style={{ backgroundColor: colors.surfaceAlt, borderColor: colors.border }}
          >
            <Text className={`${compact ? "text-[13px]" : "text-sm"}`} style={{ color: colors.textSecondary }}>
              {TYPING_LABEL}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};
