import { Pressable, Text, View } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorMessage = ({
  message = "Не удалось загрузить данные.",
  onRetry
}: ErrorMessageProps) => {
  const { colors } = useAppTheme();

  return (
    <View
      className="rounded-[28px] border px-5 py-4"
      style={{ backgroundColor: "rgba(214, 69, 69, 0.12)", borderColor: colors.danger }}
    >
      <Text className="text-base font-semibold" style={{ color: colors.text }}>
        Ошибка
      </Text>
      <Text className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
        {message}
      </Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          className="mt-4 self-start rounded-full px-4 py-3"
          style={{ backgroundColor: colors.danger }}
        >
          <Text className="text-sm font-semibold text-white">Повторить</Text>
        </Pressable>
      ) : null}
    </View>
  );
};
