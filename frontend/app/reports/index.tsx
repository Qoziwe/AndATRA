import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { FadeInView } from "@/components/common/FadeInView";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageHeader } from "@/components/common/PageHeader";
import { AppIcon } from "@/components/icons/AppIcon";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppeals } from "@/hooks/useAppeals";
import { useDashboardStats, useHeatmap, useSummary } from "@/hooks/useAnalytics";
import { downloadPdfDocument, downloadTextFile } from "@/services/clientActions";
import { useFeedbackStore } from "@/stores/feedbackStore";

const reportCards = [
  {
    key: "executive",
    title: "Исполнительная сводка",
    description: "Краткий PDF/TXT для руководства с ключевыми цифрами и выводами."
  },
  {
    key: "district",
    title: "Срез по районам",
    description: "Отчет по горячим районам, динамике и картографическому контексту."
  },
  {
    key: "critical",
    title: "Эскалационный отчет",
    description: "Список критических обращений, требующих немедленной маршрутизации."
  }
];

export default function ReportsPage() {
  const pushToast = useFeedbackStore((state) => state.pushToast);
  const { colors } = useAppTheme();
  const statsQuery = useDashboardStats();
  const summaryQuery = useSummary("30d");
  const heatmapQuery = useHeatmap();
  const criticalAppealsQuery = useAppeals({ page: 1, pageSize: 6, priority: "critical" });

  if (
    statsQuery.isLoading ||
    summaryQuery.isLoading ||
    heatmapQuery.isLoading ||
    criticalAppealsQuery.isLoading
  ) {
    return <LoadingSpinner label="Готовим конструктор отчетов..." />;
  }

  if (
    statsQuery.error ||
    summaryQuery.error ||
    heatmapQuery.error ||
    criticalAppealsQuery.error ||
    !statsQuery.data ||
    !summaryQuery.data ||
    !heatmapQuery.data ||
    !criticalAppealsQuery.data
  ) {
    return <ErrorMessage message="Не удалось загрузить данные для отчетов." />;
  }

  const executiveText = [
    `Всего обращений: ${statsQuery.data.totalAppeals}`,
    `Критические: ${statsQuery.data.criticalAppeals}`,
    `Решено сегодня: ${statsQuery.data.resolvedToday}`,
    `Активные районы: ${statsQuery.data.activeDistricts}`,
    "",
    ...summaryQuery.data.narrative
  ].join("\n");

  const districtText = heatmapQuery.data
    .slice(0, 8)
    .map((item) => `${item.district}: ${item.count} обращений, тренд ${item.trend}%`)
    .join("\n");

  const criticalText = criticalAppealsQuery.data.items
    .map((appeal) => `#${appeal.id} • ${appeal.title} • ${appeal.districtName} • ${appeal.priority}`)
    .join("\n");

  const exportTxt = (filename: string, content: string) => {
    const exported = downloadTextFile(filename, content);
    pushToast({
      title: exported ? "TXT выгружен" : "Экспорт недоступен",
      description: exported ? "Отчет скачан в текстовом виде." : "Экспорт работает в браузере."
    });
  };

  const exportPdf = (title: string, body: string) => {
    const exported = downloadPdfDocument(title, [{ heading: title, body }]);
    pushToast({
      title: exported ? "PDF подготовлен" : "Экспорт недоступен",
      description: exported
        ? "Открыто окно печати: сохраните отчет как PDF."
        : "PDF-экспорт работает в web-версии."
    });
  };

  return (
    <View>
      <PageHeader
        title="Отчеты"
        subtitle="Готовые шаблоны управленческих отчетов и быстрый доступ к выгрузкам"
      />

      <FadeInView delay={50}>
        <View
          className="rounded-[30px] border p-6"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <View className="flex-row flex-wrap items-start justify-between gap-5">
            <View className="max-w-3xl">
              <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                Центр подготовки отчетов
              </Text>
              <Text className="mt-3 text-sm leading-7" style={{ color: colors.textSecondary }}>
                Здесь можно собрать управленческую сводку, районный срез и эскалационный отчет на основе
                текущих данных системы.
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/chat")}
              className="rounded-full px-5 py-3"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-sm font-semibold text-white">Открыть ИИ-ассистент</Text>
            </Pressable>
          </View>
        </View>
      </FadeInView>

      <View className="mt-6 flex-row flex-wrap gap-4">
        {reportCards.map((card, index) => {
          const content =
            card.key === "executive"
              ? executiveText
              : card.key === "district"
                ? districtText
                : criticalText;

          return (
            <FadeInView key={card.key} delay={90 + index * 45} style={{ minWidth: 300, flex: 1 }}>
              <View
                className="min-w-[300px] flex-1 rounded-[28px] border p-5"
                style={{ backgroundColor: colors.surface, borderColor: colors.border }}
              >
                <View className="flex-row items-center justify-between">
                  <View
                    className="h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: colors.primarySoft }}
                  >
                    <AppIcon
                      name={card.key === "critical" ? "bell" : card.key === "district" ? "map" : "file"}
                      color={colors.primary}
                    />
                  </View>
                  <Text className="text-xs uppercase tracking-[2px]" style={{ color: colors.muted }}>
                    Готово к выгрузке
                  </Text>
                </View>

                <Text className="mt-4 text-lg font-semibold" style={{ color: colors.text }}>
                  {card.title}
                </Text>
                <Text className="mt-2 text-sm leading-6" style={{ color: colors.muted }}>
                  {card.description}
                </Text>
                <Text className="mt-4 text-sm leading-6" style={{ color: colors.textSecondary }}>
                  {content || "Пока нет данных для формирования этого отчета."}
                </Text>

                <View className="mt-5 flex-row flex-wrap gap-3">
                  <Pressable
                    onPress={() => exportTxt(`${card.key}.txt`, content)}
                    className="rounded-full px-4 py-3"
                    style={{ backgroundColor: colors.surfaceAlt }}
                  >
                    <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                      TXT
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => exportPdf(card.title, content)}
                    className="rounded-full px-4 py-3"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Text className="text-sm font-semibold text-white">PDF</Text>
                  </Pressable>
                </View>
              </View>
            </FadeInView>
          );
        })}
      </View>

      <View className="mt-6 flex-row flex-wrap gap-6">
        <FadeInView delay={240} style={{ minWidth: 320, flex: 1 }}>
          <View
            className="rounded-[28px] border p-5"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <Text className="text-lg font-semibold" style={{ color: colors.text }}>
              Что войдет в сводку
            </Text>
            <Text className="mt-3 text-sm leading-7" style={{ color: colors.textSecondary }}>
              {summaryQuery.data.highlights.join(" • ")}
            </Text>
          </View>
        </FadeInView>
        <FadeInView delay={280} style={{ minWidth: 320, flex: 1 }}>
          <View
            className="rounded-[28px] border p-5"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <Text className="text-lg font-semibold" style={{ color: colors.text }}>
              Критические обращения
            </Text>
            <Text className="mt-3 text-sm leading-7" style={{ color: colors.textSecondary }}>
              {criticalAppealsQuery.data.items.length
                ? criticalAppealsQuery.data.items.map((item) => `#${item.id} ${item.title}`).join("\n")
                : "Критических обращений за текущую выборку не найдено."}
            </Text>
          </View>
        </FadeInView>
      </View>
    </View>
  );
}
