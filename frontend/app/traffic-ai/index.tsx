import { View, ScrollView, Text } from "react-native";
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
  const query = useTrafficRecommendations();
  const queryClient = useQueryClient();
  const pushToast = useFeedbackStore((state) => state.pushToast);

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

  return (
    <View className="min-h-0 flex-1">
      <PageHeader
        title="ИИ-анализ пробок и светофоров"
        subtitle="Загрузка данных и анализ фаз светофоров по ключевым перекрёсткам Алматы через TomTom Traffic API. Обновляется каждые 2 минуты."
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
        <View className="min-h-0 flex-1 flex-row flex-wrap justify-between gap-5 mt-2">
          {/* Левая колонка с карточками перекрёстков (50% ширины) */}
          <FadeInView delay={60} style={{ flex: 1, minWidth: 400 }}>
            <View className="flex-row items-center justify-between mb-4 mx-1">
              <Text className="text-xl font-bold" style={{ color: colors.text }}>
                Рекомендации
              </Text>
              <Text className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                {recommendations.length} перекрестков
              </Text>
            </View>
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 30 }}
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
          <FadeInView delay={100} style={{ flex: 1, minWidth: 380 }}>
            <TrafficChatPanel recommendations={recommendations} />
          </FadeInView>
        </View>
      )}
    </View>
  );
}
