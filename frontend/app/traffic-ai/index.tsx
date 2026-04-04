import { View, ScrollView, Text, Platform, type ViewStyle, useWindowDimensions } from "react-native";
import { TrafficRecommendationCard } from "@/components/traffic-ai/TrafficRecommendationCard";
import { TrafficChatPanel } from "@/components/traffic-ai/TrafficChatPanel";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { FadeInView } from "@/components/common/FadeInView";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageHeader } from "@/components/common/PageHeader";
import { useTrafficRecommendations } from "@/hooks/useTrafficAi";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useFeedbackStore } from "@/stores/feedbackStore";
import { useQueryClient } from "@tanstack/react-query";

export default function TrafficAiPage() {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const query = useTrafficRecommendations();
  const queryClient = useQueryClient();
  const pushToast = useFeedbackStore((state) => state.pushToast);
  const isDesktopLayout = Platform.OS === "web" && width >= 1100;

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["traffic-recommendations"] });
    pushToast({
      title: "Данные обновлены",
      description: "Анализ пробок и светофоров загружен заново.",
    });
  };

  const handleNotify = (intersection: string) => {
    pushToast({
      title: "Уведомление отправлено",
      description: `Рекомендация по ${intersection} передана в транспортный холдинг.`,
    });
  };

  const recommendations = query.data?.recommendations || [];
  const stickyChatStyle: ViewStyle | undefined =
    isDesktopLayout
      ? (({ position: "sticky", top: 20 } as unknown) as ViewStyle)
      : undefined;

  return (
    <View className="min-h-0 flex-1">
      <PageHeader
        title="ИИ-анализ пробок и светофоров"
        subtitle="Загрузка данных и анализ фаз светофоров по ключевым перекрёсткам Алматы через TomTom Traffic API. Обновляется каждые 2 минуты."
        compact={isDesktopLayout}
        actions={[
          { label: "Обновить данные", onPress: handleRefresh, primary: true },
        ]}
      />

      {query.isLoading ? (
        <LoadingSpinner label="Анализируем загруженность дорог и вычисляем оптимальные фазы светофоров..." />
      ) : query.error ? (
        <ErrorMessage message={query.error.message || "Не удалось загрузить данные ИИ-анализа."} />
      ) : recommendations.length === 0 ? (
        <ErrorMessage message="Рекомендаций пока нет." />
      ) : (
        <View
          className={`min-h-0 flex-1 ${
            isDesktopLayout ? "mt-1 flex-row items-stretch justify-between gap-4" : "mt-2 gap-4"
          }`}
        >
          {/* Левая колонка с карточками перекрёстков (50% ширины) */}
          <FadeInView delay={60} style={isDesktopLayout ? { flex: 1, minWidth: 0, minHeight: 0 } : undefined}>
            <View className="mx-1 mb-3 flex-row items-center justify-between">
              <Text className="text-[18px] font-bold" style={{ color: colors.text }}>
                Рекомендации
              </Text>
              <Text className="text-[13px] font-medium" style={{ color: colors.textSecondary }}>
                {recommendations.length} перекрестков
              </Text>
            </View>
            <ScrollView
              className={isDesktopLayout ? "flex-1" : undefined}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: isDesktopLayout ? 24 : 16 }}
            >
              {recommendations.map((rec) => (
                <TrafficRecommendationCard
                  key={rec.intersection_id}
                  recommendation={rec}
                  onNotify={() => handleNotify(rec.intersection_name)}
                />
              ))}
            </ScrollView>
          </FadeInView>

          {/* Правая колонка с чатом (50% ширины) */}
          <FadeInView
            delay={100}
            style={{
              width: "100%",
              flexBasis: isDesktopLayout ? 410 : undefined,
              maxWidth: isDesktopLayout ? 440 : undefined,
              minHeight: isDesktopLayout ? 0 : undefined,
              ...stickyChatStyle,
            }}
          >
            <TrafficChatPanel recommendations={recommendations} />
          </FadeInView>
        </View>
      )}
    </View>
  );
}
