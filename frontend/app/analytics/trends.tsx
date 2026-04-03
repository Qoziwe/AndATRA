import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { TrendChart } from "@/components/analytics/TrendChart";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { FadeInView } from "@/components/common/FadeInView";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageHeader } from "@/components/common/PageHeader";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useTrends } from "@/hooks/useAnalytics";
import { useCategories } from "@/hooks/useReferenceData";
import {
  downloadPdfDocument,
  downloadTextFile
} from "@/services/clientActions";
import { useFeedbackStore } from "@/stores/feedbackStore";

export default function TrendsPage() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const queryClient = useQueryClient();
  const pushToast = useFeedbackStore((state) => state.pushToast);
  const { colors } = useAppTheme();
  const trendsQuery = useTrends("30d", category);
  const categoriesQuery = useCategories();

  if (trendsQuery.isLoading || categoriesQuery.isLoading) {
    return <LoadingSpinner label="Строим тренды по обращениям..." />;
  }

  if (trendsQuery.error || categoriesQuery.error || !trendsQuery.data || !categoriesQuery.data) {
    return <ErrorMessage message="Не удалось загрузить тренды." />;
  }

  const trendsText = trendsQuery.data
    .map((item) => `${item.date}: всего ${item.total}, решено ${item.resolved}, критических ${item.critical}`)
    .join("\n");

  const handleExportTxt = () => {
    const exported = downloadTextFile(`trends-${category ?? "all"}.txt`, trendsText);
    pushToast({
      title: exported ? "TXT выгружен" : "Экспорт недоступен",
      description: exported ? "Тренды скачаны в текстовом виде." : "Экспорт работает в браузере."
    });
  };

  const handleExportPdf = () => {
    const exported = downloadPdfDocument("Тренды обращений", [
      { heading: category ? `Категория: ${category}` : "Все категории", body: trendsText }
    ]);
    pushToast({
      title: exported ? "PDF подготовлен" : "Экспорт недоступен",
      description: exported
        ? "Открыто окно печати: сохраните трендовый отчет как PDF."
        : "PDF-экспорт работает в web-версии."
    });
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["analytics-trends"] });
    pushToast({
      title: "Тренды обновлены",
      description: "Данные графика загружены заново."
    });
  };

  return (
    <View>
      <PageHeader
        title="Тренды"
        subtitle="Детализированная динамика обращений по дням и категориям"
        actions={[
          { label: "TXT", onPress: handleExportTxt },
          { label: "PDF", onPress: handleExportPdf },
          { label: "Обновить", onPress: handleRefresh, primary: true }
        ]}
      />

      <FadeInView delay={50}>
        <View className="mb-6 flex-row flex-wrap gap-3">
          <Pressable
            onPress={() => setCategory(undefined)}
            className="rounded-full px-4 py-3"
            style={{ backgroundColor: !category ? colors.primary : colors.surfaceAlt }}
          >
            <Text
              className="text-sm font-semibold"
              style={{ color: !category ? "#FFFFFF" : colors.text }}
            >
              Все категории
            </Text>
          </Pressable>
          {categoriesQuery.data.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setCategory(item.slug)}
              className="rounded-full px-4 py-3"
              style={{
                backgroundColor: category === item.slug ? colors.primary : colors.surfaceAlt
              }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: category === item.slug ? "#FFFFFF" : colors.text }}
              >
                {item.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </FadeInView>

      <FadeInView delay={100}>
        <TrendChart data={trendsQuery.data} />
      </FadeInView>
    </View>
  );
};
