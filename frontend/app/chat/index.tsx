import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { FadeInView } from "@/components/common/FadeInView";
import { PageHeader } from "@/components/common/PageHeader";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useChat } from "@/hooks/useChat";
import { useFeedbackStore } from "@/stores/feedbackStore";

const prompts = [
  "Рост категорий",
  "Проблемный район",
  "Сводка руководству",
  "Дорожные жалобы"
];

const promptMap: Record<string, string> = {
  "Рост категорий": "Какие категории создают основной рост обращений на этой неделе?",
  "Проблемный район": "В каком районе больше всего нерешенных кейсов и почему?",
  "Сводка руководству": "Сформируй краткую сводку по критическим обращениям для руководства.",
  "Дорожные жалобы": "Покажи тренд дорожных жалоб и предложи, где усилить контроль."
};

export default function ChatPage() {
  const pushToast = useFeedbackStore((state) => state.pushToast);
  const { colors } = useAppTheme();
  const { messages, isTyping, send, error, clearMessages } = useChat();
  const hasConversation = messages.some((message) => message.role !== "system");

  const handleNewChat = () => {
    clearMessages();
    pushToast({
      title: "Новый диалог создан",
      description: "История текущей сессии очищена."
    });
  };

  return (
    <View>
      <PageHeader
        title="ИИ-ассистент"
        subtitle="Диалог с аналитикой, районами, обращениями и готовыми сводками в формате документов"
        actions={[
          { label: "Новый чат", onPress: handleNewChat },
          { label: "К аналитике", onPress: () => router.push("/analytics") },
          { label: "К отчетам", onPress: () => router.push("/reports"), primary: true }
        ]}
      />

      {error ? <ErrorMessage message={error.message} /> : null}

      {!hasConversation ? (
        <FadeInView delay={40}>
          <View className="min-h-[68vh] items-center justify-center px-4">
            <Text className="text-center text-[42px] font-semibold" style={{ color: colors.text }}>
              Ассистент готов к работе
            </Text>
            <Text className="mt-3 max-w-[720px] text-center text-sm leading-7" style={{ color: colors.muted }}>
              Спросите про обращения, районы, аналитику или попросите сразу подготовить
              сводку в TXT и PDF.
            </Text>
            <View className="mt-8 w-full max-w-[760px]">
              <ChatInput onSend={send} disabled={isTyping} minimal />
              <View className="mt-5 flex-row flex-wrap justify-center gap-3">
                {prompts.map((label, index) => (
                  <FadeInView key={label} delay={80 + index * 35}>
                    <Pressable
                      onPress={async () => {
                        await send(promptMap[label]);
                        pushToast({
                          title: "Запрос отправлен",
                          description: "Ассистент начал формировать ответ."
                        });
                      }}
                      className="rounded-full px-4 py-2.5"
                      style={{
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border
                      }}
                    >
                      <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                        {label}
                      </Text>
                    </Pressable>
                  </FadeInView>
                ))}
              </View>
            </View>
          </View>
        </FadeInView>
      ) : (
        <View className="mt-4 gap-4">
          <FadeInView delay={80}>
            <ChatWindow messages={messages} isTyping={isTyping} />
          </FadeInView>
          <FadeInView delay={120}>
            <View className="mx-auto w-full max-w-[860px]">
              <ChatInput onSend={send} disabled={isTyping} minimal />
            </View>
          </FadeInView>
          <FadeInView delay={140}>
            <View className="flex-row flex-wrap justify-center gap-3">
              {prompts.map((label) => (
                <Pressable
                  key={label}
                  onPress={async () => {
                    await send(promptMap[label]);
                  }}
                  className="rounded-full px-4 py-2.5"
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border
                  }}
                >
                  <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </FadeInView>
        </View>
      )}
    </View>
  );
}
