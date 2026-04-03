import { Text, View } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatPercent } from "@/utils/format";
import type { DistrictHeatmap } from "@/types/analytics";

export const HeatmapCard = ({ item }: { item: DistrictHeatmap }) => {
  const { colors } = useAppTheme();

  return (
    <View
      className="rounded-[24px] border p-4"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-base font-semibold" style={{ color: colors.text }}>
          {item.district}
        </Text>
        <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
          {item.count}
        </Text>
      </View>
      <Text className="mt-2 text-sm leading-6" style={{ color: colors.muted }}>
        {item.insight}
      </Text>
      <Text className="mt-3 text-xs" style={{ color: colors.textSecondary }}>
        Тренд: {formatPercent(item.trend)}
      </Text>
    </View>
  );
};
