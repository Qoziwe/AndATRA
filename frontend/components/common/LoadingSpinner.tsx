import { ActivityIndicator, Text, View } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

export const LoadingSpinner = ({ label = "Загрузка..." }: { label?: string }) => {
  const { colors } = useAppTheme();

  return (
    <View
      className="items-center justify-center rounded-[30px] border px-6 py-10"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      <Text className="mt-3 text-sm" style={{ color: colors.muted }}>
        {label}
      </Text>
    </View>
  );
};
