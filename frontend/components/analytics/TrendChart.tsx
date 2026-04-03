import { Text, View } from "react-native";
import Svg, { Circle, Polyline } from "react-native-svg";
import { useAppTheme } from "@/hooks/useAppTheme";
import type { TrendPoint } from "@/types/analytics";

interface TrendChartProps {
  data: TrendPoint[];
  metric?: "total" | "resolved" | "critical";
}

const titles = {
  total: "Тренд обращений",
  resolved: "Тренд решенных обращений",
  critical: "Тренд критических обращений"
} as const;

export const TrendChart = ({ data, metric = "total" }: TrendChartProps) => {
  const width = 640;
  const height = 220;
  const padding = 20;
  const values = data.map((item) => item[metric]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1);
  const { colors } = useAppTheme();

  const points = data
    .map((item, index) => {
      const x = padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
      const y = height - padding - ((item[metric] - min) / span) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <View
      className="rounded-[30px] border p-5"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <Text className="text-xl font-semibold" style={{ color: colors.text }}>
        {titles[metric]}
      </Text>
      <Text className="mt-2 text-sm" style={{ color: colors.muted }}>
        Динамика по дням
      </Text>
      <View
        className="mt-6 overflow-hidden rounded-2xl border p-3"
        style={{ backgroundColor: colors.surfaceAlt, borderColor: colors.border }}
      >
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <Polyline
            points={points}
            fill="none"
            stroke={colors.primary}
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {data.map((item, index) => {
            const x = padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
            const y = height - padding - ((item[metric] - min) / span) * (height - padding * 2);
            return <Circle key={item.date} cx={x} cy={y} r="5" fill={colors.text} />;
          })}
        </Svg>
      </View>
      <View className="mt-4 flex-row flex-wrap justify-between gap-3">
        {data.map((item) => (
          <Text key={item.date} className="text-xs" style={{ color: colors.muted }}>
            {item.date}: {item[metric]}
          </Text>
        ))}
      </View>
    </View>
  );
};
