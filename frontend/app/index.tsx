import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { AlertBanner } from "@/components/dashboard/AlertBanner";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { RecentAppeals } from "@/components/dashboard/RecentAppeals";
import { StatCard } from "@/components/dashboard/StatCard";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { FadeInView } from "@/components/common/FadeInView";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageHeader } from "@/components/common/PageHeader";
import { AppIcon } from "@/components/icons/AppIcon";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppeals } from "@/hooks/useAppeals";
import { useCategoryBreakdown, useDashboardStats } from "@/hooks/useAnalytics";
import { downloadPdfDocument, downloadTextFile } from "@/services/clientActions";
import { useFeedbackStore } from "@/stores/feedbackStore";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const pushToast = useFeedbackStore((state) => state.pushToast);
  const { colors } = useAppTheme();
  const statsQuery = useDashboardStats();
  const categoriesQuery = useCategoryBreakdown("30d");
  const recentAppealsQuery = useAppeals({ page: 1, pageSize: 5 });

  if (statsQuery.isLoading || categoriesQuery.isLoading || recentAppealsQuery.isLoading) {
    return <LoadingSpinner label="Собираем оперативную сводку..." />;
  }

  if (
    statsQuery.error ||
    categoriesQuery.error ||
    recentAppealsQuery.error ||
    !statsQuery.data ||
    !categoriesQuery.data ||
    !recentAppealsQuery.data
  ) {
    return <ErrorMessage message="Не удалось загрузить данные дашборда." />;
  }

  const dashboardSummary = [
    "Оперативный дашборд AndATRA",
    `Всего обращений: ${statsQuery.data.totalAppeals}`,
    `Критические: ${statsQuery.data.criticalAppeals}`,
    `Решено сегодня: ${statsQuery.data.resolvedToday}`,
    `Активные районы: ${statsQuery.data.activeDistricts}`
  ].join("\n");

  const handleExportTxt = () => {
    const exported = downloadTextFile("andatra-dashboard-summary.txt", dashboardSummary);

    pushToast({
      title: exported ? "TXT выгружен" : "Экспорт недоступен",
      description: exported
        ? "Оперативная сводка скачана."
        : "Откройте приложение в браузере, чтобы скачать файл."
    });
  };

  const handleExportPdf = () => {
    const exported = downloadPdfDocument("Оперативный дашборд", [
      { heading: "Ключевые показатели", body: dashboardSummary }
    ]);

    pushToast({
      title: exported ? "PDF подготовлен" : "Экспорт недоступен",
      description: exported
        ? "Открыто окно печати: сохраните дашборд как PDF."
        : "PDF-экспорт работает в web-версии."
    });
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    await queryClient.invalidateQueries({ queryKey: ["analytics-categories"] });
    await queryClient.invalidateQueries({ queryKey: ["appeals"] });
    pushToast({
      title: "Дашборд обновлен",
      description: "Ключевые показатели и последние обращения загружены заново."
    });
  };

  return (
    <View>
      <PageHeader
        title="Оперативный дашборд"
        subtitle="Ключевые сигналы по обращениям, районам и критическим кейсам в аккуратной сводке"
        actions={[
          { label: "TXT", onPress: handleExportTxt },
          { label: "PDF", onPress: handleExportPdf },
          { label: "Обновить", onPress: handleRefresh, primary: true }
        ]}
      />

      <FadeInView delay={45}>
        <View
          className="mb-5 rounded-[28px] border px-5 py-4"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <View className="flex-row flex-wrap items-center justify-between gap-4">
            <View className="flex-1">
              <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                Городская сводка за сегодня
              </Text>
              <Text className="mt-1 text-sm leading-6" style={{ color: colors.muted }}>
                {statsQuery.data.totalAppeals} обращений в системе, {statsQuery.data.criticalAppeals} критических кейсов и {statsQuery.data.resolvedToday} решено сегодня.
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/reports")}
              className="rounded-full px-4 py-3"
              style={{ backgroundColor: colors.primarySoft }}
            >
              <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                Открыть отчеты
              </Text>
            </Pressable>
          </View>
        </View>
      </FadeInView>

      {statsQuery.data.criticalNewAppeals > 0 ? (
        <FadeInView delay={60}>
          <AlertBanner count={statsQuery.data.criticalNewAppeals} />
        </FadeInView>
      ) : null}

      <View className="flex-row flex-wrap gap-3">
        <FadeInView delay={90} style={{ minWidth: 220, flex: 1 }}>
          <Pressable onPress={() => router.push("/appeals")} className="min-w-[220px] flex-1">
            <StatCard
              label="Всего обращений"
              value={statsQuery.data.totalAppeals}
              accent="#3B82F6"
              icon={<AppIcon name="appeals" color={colors.primary} />}
              compact
            />
          </Pressable>
        </FadeInView>
        <FadeInView delay={130} style={{ minWidth: 220, flex: 1 }}>
          <Pressable
            onPress={() => router.push({ pathname: "/appeals", params: { priority: "critical" } })}
            className="min-w-[220px] flex-1"
          >
            <StatCard
              label="Критические"
              value={statsQuery.data.criticalAppeals}
              accent="#EF4444"
              icon={<AppIcon name="bell" color="#EF4444" />}
              compact
            />
          </Pressable>
        </FadeInView>
        <FadeInView delay={170} style={{ minWidth: 220, flex: 1 }}>
          <Pressable onPress={() => router.push("/analytics")} className="min-w-[220px] flex-1">
            <StatCard
              label="Решено сегодня"
              value={statsQuery.data.resolvedToday}
              accent="#22C55E"
              icon={<AppIcon name="analytics" color="#22C55E" />}
              compact
            />
          </Pressable>
        </FadeInView>
        <FadeInView delay={210} style={{ minWidth: 220, flex: 1 }}>
          <Pressable onPress={() => router.push("/map")} className="min-w-[220px] flex-1">
            <StatCard
              label="Активные районы"
              value={statsQuery.data.activeDistricts}
              accent="#8B5CF6"
              icon={<AppIcon name="map" color="#8B5CF6" />}
              compact
            />
          </Pressable>
        </FadeInView>
      </View>

      <View className="mt-5 flex-row flex-wrap gap-5">
        <FadeInView delay={240} style={{ minWidth: 360, flex: 1.15 }}>
          <CategoryBreakdown data={categoriesQuery.data} />
        </FadeInView>
        <FadeInView delay={280} style={{ minWidth: 320, flex: 1 }}>
          <RecentAppeals appeals={recentAppealsQuery.data.items} />
        </FadeInView>
      </View>
    </View>
  );
}
