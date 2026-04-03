import { Text, View } from "react-native";
import { PRIORITY_LABELS } from "@/constants/config";
import { useAppTheme } from "@/hooks/useAppTheme";
import type { AppealPriority } from "@/types/appeal";

const colors: Record<AppealPriority, string> = {
  low: "rgba(100, 116, 139, 0.18)",
  medium: "rgba(249, 115, 22, 0.18)",
  high: "rgba(239, 68, 68, 0.18)",
  critical: "rgba(185, 28, 28, 0.22)"
};

export const PriorityBadge = ({ priority }: { priority: AppealPriority }) => {
  const { colors: themeColors } = useAppTheme();

  return (
    <View
      className="rounded-full px-3 py-2"
      style={{ backgroundColor: colors[priority], borderWidth: 1, borderColor: themeColors.border }}
    >
      <Text className="text-xs font-semibold" style={{ color: themeColors.text }}>
        {PRIORITY_LABELS[priority]}
      </Text>
    </View>
  );
};
