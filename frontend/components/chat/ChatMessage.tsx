import { Pressable, Text, View } from "react-native";
import { AppIcon } from "@/components/icons/AppIcon";
import { useAppTheme } from "@/hooks/useAppTheme";
import { downloadPdfDocument, downloadTextFile } from "@/services/clientActions";
import { useFeedbackStore } from "@/stores/feedbackStore";
import type { ChatAttachment, ChatMessage as ChatMessageType } from "@/types/chat";

const attachmentDescriptions: Record<ChatAttachment["kind"], string> = {
  txt: "Текстовая версия для быстрой выгрузки и пересылки",
  pdf: "Документ для печати, отправки и презентации руководству"
};

export const ChatMessage = ({ message }: { message: ChatMessageType }) => {
  const { colors } = useAppTheme();
  const pushToast = useFeedbackStore((state) => state.pushToast);
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  const handleAttachmentDownload = (attachment: ChatAttachment) => {
    const exported =
      attachment.kind === "txt"
        ? downloadTextFile(attachment.filename, attachment.content)
        : downloadPdfDocument(attachment.title, [
            { heading: attachment.title, body: attachment.content }
          ]);

    pushToast({
      title: exported ? `${attachment.label} подготовлен` : "Экспорт недоступен",
      description: exported
        ? `Файл ${attachment.filename} подготовлен из ответа ассистента.`
        : "Откройте web-версию приложения, чтобы скачать файл."
    });
  };

  return (
    <View
      className={`max-w-[86%] rounded-[28px] px-4 py-4 ${
        isUser ? "self-end" : isSystem ? "self-center" : "self-start"
      }`}
      style={{
        backgroundColor: isUser
          ? colors.primary
          : isSystem
            ? colors.primarySoft
            : colors.surface,
        borderWidth: isUser ? 0 : 1,
        borderColor: isUser ? "transparent" : colors.border
      }}
    >
      {!isUser ? (
        <View className="mb-3 flex-row items-center gap-2">
          <AppIcon
            name={isSystem ? "spark" : "chat"}
            size={16}
            color={isSystem ? colors.primary : colors.text}
          />
          <Text
            className="text-xs font-semibold uppercase tracking-[1.5px]"
            style={{ color: isSystem ? colors.primary : colors.muted }}
          >
            {isSystem ? "Система" : "Ассистент"}
          </Text>
        </View>
      ) : null}

      <Text
        className="text-sm leading-7"
        style={{ color: isUser ? "#FFFFFF" : colors.textSecondary }}
      >
        {message.content}
      </Text>

      {message.attachments?.length ? (
        <View
          className="mt-5 rounded-[24px] border p-4"
          style={{ backgroundColor: colors.surfaceAlt, borderColor: colors.border }}
        >
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Text className="text-xs uppercase tracking-[2px]" style={{ color: colors.muted }}>
                Подготовленные файлы
              </Text>
              <Text className="mt-1 text-base font-semibold" style={{ color: colors.text }}>
                Сводка готова к выгрузке
              </Text>
            </View>
            <View
              className="h-11 w-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: colors.primarySoft }}
            >
              <AppIcon name="file" size={18} color={colors.primary} />
            </View>
          </View>

          <View className="mt-4 gap-3">
            {message.attachments.map((attachment) => (
              <View
                key={attachment.id}
                className="rounded-[22px] border p-4"
                style={{ backgroundColor: colors.surface, borderColor: colors.border }}
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <View
                        className="rounded-full px-3 py-1"
                        style={{ backgroundColor: colors.primarySoft }}
                      >
                        <Text className="text-[11px] font-semibold" style={{ color: colors.primary }}>
                          {attachment.label}
                        </Text>
                      </View>
                      <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                        {attachment.title}
                      </Text>
                    </View>
                    <Text className="mt-2 text-sm leading-6" style={{ color: colors.muted }}>
                      {attachmentDescriptions[attachment.kind]}
                    </Text>
                    <Text className="mt-2 text-xs" style={{ color: colors.textSecondary }}>
                      {attachment.filename}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => handleAttachmentDownload(attachment)}
                    className="flex-row items-center gap-2 rounded-full px-4 py-3"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <AppIcon name="download" size={14} color="#FFFFFF" />
                    <Text className="text-xs font-semibold text-white">
                      Скачать
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <Text
        className="mt-3 text-[11px]"
        style={{ color: isUser ? "rgba(255,255,255,0.76)" : colors.muted }}
      >
        {message.createdAt.slice(11, 16)}
      </Text>
    </View>
  );
};
