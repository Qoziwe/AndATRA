import { Text, View } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

interface EmptyStateProps {
  title: string;
  description: string;
}

export const EmptyState = ({ title, description }: EmptyStateProps) => {
  const { colors } = useAppTheme();

  return (
    <View
      className="rounded-[30px] border px-6 py-10"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderStyle: "dashed"
      }}
    >
      <Text className="text-xl font-semibold" style={{ color: colors.text }}>
        {title}
      </Text>
      <Text className="mt-2 max-w-2xl text-sm leading-6" style={{ color: colors.muted }}>
        {description}
      </Text>
    </View>
  );
};
