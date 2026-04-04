import { Text, View } from "react-native";
import { STATUS_LABELS } from "@/constants/config";
import { useAppTheme } from "@/hooks/useAppTheme";
import type { AppealStatus } from "@/types/appeal";

const colors: Record<AppealStatus, string> = {
  new: "rgba(37, 99, 235, 0.16)",
  processing: "rgba(245, 158, 11, 0.18)",
  resolved: "rgba(34, 197, 94, 0.16)",
  rejected: "rgba(239, 68, 68, 0.16)",
  irrelevant: "rgba(100, 116, 139, 0.18)"
};

export const StatusBadge = ({ status }: { status: AppealStatus }) => {
  const { colors: themeColors } = useAppTheme();

  return (
    <View
      className="rounded-full px-3 py-2"
      style={{ backgroundColor: colors[status], borderWidth: 1, borderColor: themeColors.border }}
    >
      <Text className="text-xs font-semibold" style={{ color: themeColors.text }}>
        {STATUS_LABELS[status]}
      </Text>
    </View>
  );
};
