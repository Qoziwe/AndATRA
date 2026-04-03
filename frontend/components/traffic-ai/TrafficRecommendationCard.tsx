import { Pressable, Text, View } from "react-native";
import { AppIcon } from "@/components/icons/AppIcon";
import { useAppTheme } from "@/hooks/useAppTheme";
import type { TrafficRecommendation, TrafficSeverity } from "@/types/traffic";

export const TrafficRecommendationCard = ({
  recommendation,
  onNotify,
}: {
  recommendation: TrafficRecommendation;
  onNotify?: () => void;
}) => {
  const { colors } = useAppTheme();

  const severityColor: Record<TrafficSeverity, string> = {
    critical: "rgba(220, 38, 38, 1)", // Red-600
    high: "rgba(234, 88, 12, 1)",      // Orange-600
    medium: "rgba(202, 138, 4, 1)",    // Yellow-600
    low: "rgba(22, 163, 74, 1)",       // Green-600
  };
  
  const bgSeverityColor: Record<TrafficSeverity, string> = {
    critical: "rgba(220, 38, 38, 0.12)",
    high: "rgba(234, 88, 12, 0.12)",
    medium: "rgba(202, 138, 4, 0.12)",
    low: "rgba(22, 163, 74, 0.12)",
  };

  const severityLabels: Record<TrafficSeverity, string> = {
    critical: "Критическая загрузка",
    high: "Высокая",
    medium: "Средняя",
    low: "Свободно",
  };

  return (
    <View
      className="mb-4 rounded-[28px] border px-5 py-5"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
      }}
    >
      <View className="mb-4 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-lg font-bold" style={{ color: colors.text }}>
            {recommendation.intersection_name}
          </Text>
          <Text className="mt-1 text-sm font-medium" style={{ color: colors.muted }}>
            {recommendation.streets.join(" — ")}
          </Text>
        </View>

        <View
          className="rounded-full px-3 py-1.5"
          style={{ backgroundColor: bgSeverityColor[recommendation.severity] }}
        >
          <Text
            className="text-xs font-semibold"
            style={{ color: severityColor[recommendation.severity] }}
          >
            {severityLabels[recommendation.severity]} ({recommendation.congestion_percent}%)
          </Text>
        </View>
      </View>

      <Text className="mb-4 text-sm leading-6" style={{ color: colors.textSecondary }}>
        {recommendation.reasoning}
      </Text>

      <View
        className="mb-5 rounded-[20px] p-4"
        style={{ backgroundColor: colors.surfaceAlt }}
      >
        <Text className="text-sm font-semibold" style={{ color: colors.text }}>
          Рекомендуемое действие:
        </Text>
        <Text className="mt-2 text-sm leading-6" style={{ color: colors.textSecondary }}>
          {recommendation.recommendation}
        </Text>
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-xs" style={{ color: colors.muted }}>
          Скорость: {recommendation.current_speed_kmh} км/ч (своб. {recommendation.free_flow_speed_kmh})
        </Text>
        
        {onNotify && (
          <Pressable
            onPress={onNotify}
            className="flex-row items-center gap-2 rounded-full px-4 py-2.5"
            style={{ backgroundColor: colors.primarySoft }}
          >
            <AppIcon name="bell" size={14} color={colors.primary} />
            <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
              Сообщить Транспортному Холдингу
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};
