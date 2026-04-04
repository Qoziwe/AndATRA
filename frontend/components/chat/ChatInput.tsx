import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { AppIcon } from "@/components/icons/AppIcon";
import { useAppTheme } from "@/hooks/useAppTheme";

export const ChatInput = ({
  onSend,
  disabled,
  minimal,
  compact
}: {
  onSend: (value: string) => Promise<unknown>;
  disabled?: boolean;
  minimal?: boolean;
  compact?: boolean;
}) => {
  const [value, setValue] = useState("");
  const { colors } = useAppTheme();
  const isCompactMinimal = minimal && compact;

  return (
    <View
      className={`${
        isCompactMinimal ? "rounded-[26px] p-2.5" : minimal ? "rounded-[30px] p-3" : "rounded-[32px] p-4"
      } border`}
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <TextInput
        multiline
        value={value}
        onChangeText={setValue}
        placeholder="Спросите о трендах, районах, обращениях или сформируйте сводку..."
        placeholderTextColor={colors.muted}
        className={`${
          isCompactMinimal
            ? "min-h-[56px] max-h-[104px] rounded-[22px] px-3 py-3 text-[13px]"
            : minimal
              ? "min-h-[74px] rounded-[28px] px-4 py-4 text-sm"
              : "min-h-[120px] rounded-[24px] px-4 py-4 text-sm"
        } border`}
        style={{
          color: colors.text,
          backgroundColor: minimal ? colors.card : colors.surfaceAlt,
          borderColor: colors.border,
          textAlignVertical: "top"
        }}
      />
      <View className={`${isCompactMinimal ? "mt-3" : "mt-4"} flex-row flex-wrap items-center justify-between gap-3`}>
        <Text className={`${isCompactMinimal ? "text-[11px]" : "text-xs"}`} style={{ color: colors.muted }}>
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
          className={`flex-row items-center gap-2 rounded-full ${isCompactMinimal ? "px-4 py-2.5" : "px-5 py-3"}`}
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
