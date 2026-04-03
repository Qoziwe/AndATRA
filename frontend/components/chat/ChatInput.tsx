import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { AppIcon } from "@/components/icons/AppIcon";
import { useAppTheme } from "@/hooks/useAppTheme";

export const ChatInput = ({
  onSend,
  disabled,
  minimal
}: {
  onSend: (value: string) => Promise<unknown>;
  disabled?: boolean;
  minimal?: boolean;
}) => {
  const [value, setValue] = useState("");
  const { colors } = useAppTheme();

  return (
    <View
      className={`${minimal ? "rounded-[30px] p-3" : "rounded-[32px] p-4"} border`}
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <TextInput
        multiline
        value={value}
        onChangeText={setValue}
        placeholder="Спросите о трендах, районах, обращениях или сформируйте сводку..."
        placeholderTextColor={colors.muted}
        className={`${minimal ? "min-h-[74px] rounded-[28px]" : "min-h-[120px] rounded-[24px]"} border px-4 py-4 text-sm`}
        style={{
          color: colors.text,
          backgroundColor: minimal ? colors.card : colors.surfaceAlt,
          borderColor: colors.border,
          textAlignVertical: "top"
        }}
      />
      <View className="mt-4 flex-row flex-wrap items-center justify-between gap-3">
        <Text className="text-xs" style={{ color: colors.muted }}>
          {minimal
            ? "Короткий запрос, сценарий или вопрос по данным"
            : "Формат как в ChatGPT: короткий вопрос, детальный запрос или сценарий для отчета"}
        </Text>
        <Pressable
          disabled={disabled || !value.trim()}
          onPress={async () => {
            const nextValue = value.trim();
            if (!nextValue) {
              return;
            }
            setValue("");
            await onSend(nextValue);
          }}
          className="flex-row items-center gap-2 rounded-full px-5 py-3"
          style={{
            backgroundColor: disabled || !value.trim() ? colors.surfaceAlt : colors.primary
          }}
        >
          <AppIcon
            name="send"
            size={16}
            color={disabled || !value.trim() ? colors.muted : "#FFFFFF"}
          />
          <Text
            className="text-sm font-semibold"
            style={{ color: disabled || !value.trim() ? colors.muted : "#FFFFFF" }}
          >
            Отправить
          </Text>
        </Pressable>
      </View>
    </View>
  );
};
