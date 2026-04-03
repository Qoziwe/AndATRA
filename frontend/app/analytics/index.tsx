import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { HeatmapCard } from "@/components/analytics/HeatmapCard";
import { SummaryBlock } from "@/components/analytics/SummaryBlock";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { FadeInView } from "@/components/common/FadeInView";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageHeader } from "@/components/common/PageHeader";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useCategoryBreakdown, useHeatmap, useSummary } from "@/hooks/useAnalytics";
import {
  downloadPdfDocument,
  downloadTextFile
} from "@/services/clientActions";
import { useFeedbackStore } from "@/stores/feedbackStore";

const periods = ["7d", "30d", "90d"];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30d");
  const queryClient = useQueryClient();
  const pushToast = useFeedbackStore((state) => state.pushToast);
  const { colors } = useAppTheme();
  const summaryQuery = useSummary(period);
  const heatmapQuery = useHeatmap();
  const categoriesQuery = useCategoryBreakdown(period);

  if (summaryQuery.isLoading || heatmapQuery.isLoading || categoriesQuery.isLoading) {
    return <LoadingSpinner label="Собираем аналитический обзор..." />;
  }

  if (
    summaryQuery.error ||
    heatmapQuery.error ||
    categoriesQuery.error ||
    !summaryQuery.data ||
    !heatmapQuery.data ||
    !categoriesQuery.data
  ) {
    return <ErrorMessage message="Не удалось загрузить аналитические данные." />;
  }

  const analyticsText = [
    `Период: ${period}`,
    ...summaryQuery.data.narrative,
    "",
    "Тепловая карта районов:",
    ...heatmapQuery.data.map(
      (item) => `${item.district}: ${item.count} обращений, тренд ${item.trend}%`
    )
  ].join("\n");

  const handleExportTxt = () => {
    const exported = downloadTextFile(`analytics-${period}.txt`, analyticsText);
    pushToast({
      title: exported ? "TXT выгружен" : "Экспорт недоступен",
      description: exported
        ? "Текстовая версия аналитической сводки скачана."
        : "Экспорт доступен в браузере."
    });
  };

  const handleExportPdf = () => {
    const exported = downloadPdfDocument("Аналитический обзор", [
      {
        heading: `Период ${period}`,
        body: analyticsText
      }
    ]);

    pushToast({
      title: exported ? "PDF подготовлен" : "Экспорт недоступен",
      description: exported
        ? "Открыто окно печати: сохраните обзор как PDF."
        : "PDF-экспорт работает в web-версии."
    });
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["analytics-summary"] });
    await queryClient.invalidateQueries({ queryKey: ["analytics-heatmap"] });
    await queryClient.invalidateQueries({ queryKey: ["analytics-categories"] });
    pushToast({
      title: "Аналитика обновлена",
      description: "Сводка, карта районов и категории перезагружены."
    });
  };

  return (
    <View>
      <PageHeader
        title="Аналитический обзор"
        subtitle="Макро-тренды, активность районов и интерпретация данных за период"
        actions={[
          { label: "TXT", onPress: handleExportTxt },
          { label: "PDF", onPress: handleExportPdf },
          { label: "Обновить", onPress: handleRefresh, primary: true }
        ]}
      />

      <FadeInView delay={50}>
        <View className="mb-6 flex-row gap-3">
          {periods.map((item) => (
            <Pressable
              key={item}
              onPress={() => setPeriod(item)}
              className="rounded-full px-4 py-3"
              style={{
                backgroundColor: period === item ? colors.primary : colors.surfaceAlt
              }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: period === item ? "#FFFFFF" : colors.text }}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
      </FadeInView>

      <View className="flex-row flex-wrap gap-6">
        <FadeInView delay={90} style={{ minWidth: 360, flex: 1.2 }}>
          <SummaryBlock
            paragraphs={summaryQuery.data.narrative}
            highlights={summaryQuery.data.highlights}
          />
        </FadeInView>
        <View className="min-w-[320px] flex-1 gap-4">
          {heatmapQuery.data.slice(0, 5).map((item, index) => (
            <FadeInView key={item.districtSlug} delay={120 + index * 35}>
              <Pressable
                onPress={() =>
                  router.push({ pathname: "/map", params: { district: item.districtSlug } })
                }
              >
                <HeatmapCard item={item} />
              </Pressable>
            </FadeInView>
          ))}
        </View>
      </View>

      <FadeInView delay={260}>
        <View className="mt-6">
          <CategoryBreakdown
            title="Категории обращений"
            data={categoriesQuery.data}
          />
        </View>
      </FadeInView>
    </View>
  );
};
