import { Text, View } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatPercent } from "@/utils/format";
import type { CategoryMetric } from "@/types/analytics";

interface CategoryBreakdownProps {
  data: CategoryMetric[];
  title?: string;
}

export const CategoryBreakdown = ({
  data,
  title = "Распределение по категориям"
}: CategoryBreakdownProps) => {
  const { colors } = useAppTheme();
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <View
      className="rounded-[28px] border p-5"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <Text className="text-lg font-semibold" style={{ color: colors.text }}>
        {title}
      </Text>
      <Text className="mt-2 text-sm" style={{ color: colors.muted }}>
        Данные за выбранный период
      </Text>

      <View className="mt-5 gap-4">
        {data.map((item) => (
          <View key={item.slug}>
            <View className="mb-2 flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <Text className="text-sm font-medium" style={{ color: colors.text }}>
                  {item.label}
                </Text>
                {item.description ? (
                  <Text className="mt-1 text-xs" style={{ color: colors.muted }}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
              <View className="items-end">
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  {item.value}
                </Text>
                {item.trend != null ? (
                  <Text className="mt-1 text-xs" style={{ color: colors.muted }}>
                    {formatPercent(item.trend)}
                  </Text>
                ) : null}
              </View>
            </View>

            <View
              className="h-2 overflow-hidden rounded-full"
              style={{ backgroundColor: colors.surfaceAlt }}
            >
              <View
                className="h-full rounded-full"
                style={{
                  width: `${(item.value / max) * 100}%`,
                  backgroundColor: item.color
                }}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};
