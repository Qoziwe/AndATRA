import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { AppealCard } from "@/components/appeals/AppealCard";
import { AppealFilters } from "@/components/appeals/AppealFilters";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { FadeInView } from "@/components/common/FadeInView";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageHeader } from "@/components/common/PageHeader";
import { AppIcon } from "@/components/icons/AppIcon";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppeals } from "@/hooks/useAppeals";
import { useCategories, useDistricts } from "@/hooks/useReferenceData";
import {
  buildTextTable,
  downloadPdfDocument,
  downloadTextFile
} from "@/services/clientActions";
import { useFeedbackStore } from "@/stores/feedbackStore";
import type { AppealFilters as AppealFiltersType } from "@/types/appeal";

export default function AppealsPage() {
  const params = useLocalSearchParams<{ category?: string; search?: string; priority?: string }>();
  const queryClient = useQueryClient();
  const pushToast = useFeedbackStore((state) => state.pushToast);
  const { colors } = useAppTheme();
  const [filters, setFilters] = useState<AppealFiltersType>({
    page: 1,
    pageSize: 10,
    category: params.category,
    search: params.search,
    priority: params.priority as AppealFiltersType["priority"]
  });
  const appealsQuery = useAppeals(filters);
  const categoriesQuery = useCategories();
  const districtsQuery = useDistricts();

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      category: params.category ?? current.category,
      search: params.search ?? current.search,
      priority: (params.priority as AppealFiltersType["priority"]) ?? current.priority,
      page: 1
    }));
  }, [params.category, params.priority, params.search]);

  if (appealsQuery.isLoading || categoriesQuery.isLoading || districtsQuery.isLoading) {
    return <LoadingSpinner label="Загружаем обращения..." />;
  }

  if (
    appealsQuery.error ||
    categoriesQuery.error ||
    districtsQuery.error ||
    !appealsQuery.data ||
    !categoriesQuery.data ||
    !districtsQuery.data
  ) {
    return <ErrorMessage message="Не удалось загрузить обращения." />;
  }

  const totalPages = Math.max(1, Math.ceil(appealsQuery.data.total / appealsQuery.data.pageSize));

  const exportRows = [
    ["ID", "Заголовок", "Категория", "Район", "Статус", "Приоритет", "Адрес"],
    ...appealsQuery.data.items.map((appeal) => [
      String(appeal.id),
      appeal.title,
      appeal.categoryName,
      appeal.districtName,
      appeal.status,
      appeal.priority,
      appeal.locationText ?? ""
    ])
  ];

  const handleExportTxt = () => {
    const exported = downloadTextFile("appeals-export.txt", buildTextTable(exportRows));

    pushToast({
      title: exported ? "TXT выгружен" : "Экспорт недоступен",
      description: exported
        ? "Текущая страница обращений сохранена в текстовом виде."
        : "Откройте приложение в браузере, чтобы скачать файл."
    });
  };

  const handleExportPdf = () => {
    const exported = downloadPdfDocument("Реестр обращений", [
      {
        heading: "Сводная таблица",
        body: buildTextTable(exportRows)
      }
    ]);

    pushToast({
      title: exported ? "PDF подготовлен" : "Экспорт недоступен",
      description: exported
        ? "Открыто окно печати: сохраните документ как PDF."
        : "PDF-экспорт работает в web-версии."
    });
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["appeals"] });
    await queryClient.invalidateQueries({ queryKey: ["categories"] });
    await queryClient.invalidateQueries({ queryKey: ["districts"] });
    pushToast({
      title: "Список обновлен",
      description: "Обращения и справочники перезагружены."
    });
  };

  return (
    <View>
      <PageHeader
        title="Обращения граждан"
        subtitle="Фильтрация, быстрый разбор и переход к детальной карточке с фото и AI-анализом"
        actions={[
          { label: "TXT", onPress: handleExportTxt },
          { label: "PDF", onPress: handleExportPdf },
          { label: "Обновить", onPress: handleRefresh, primary: true }
        ]}
      />

      <FadeInView delay={60}>
        <AppealFilters
          value={filters}
          onChange={setFilters}
          categories={categoriesQuery.data}
          districts={districtsQuery.data}
        />
      </FadeInView>

      <FadeInView delay={110}>
        <View className="my-5 flex-row flex-wrap items-center justify-between gap-3">
          <Text className="text-sm" style={{ color: colors.muted }}>
            Показано {appealsQuery.data.total} обращений
          </Text>
          <Text className="text-sm" style={{ color: colors.muted }}>
            Страница {appealsQuery.data.page} из {totalPages}
          </Text>
        </View>
      </FadeInView>

      {appealsQuery.data.items.length === 0 ? (
        <EmptyState
          title="Ничего не найдено"
          description="Попробуйте изменить фильтры или очистить поисковый запрос."
        />
      ) : (
        <View className="gap-4">
          {appealsQuery.data.items.map((appeal, index) => (
            <FadeInView key={appeal.id} delay={130 + index * 30}>
              <AppealCard appeal={appeal} />
            </FadeInView>
          ))}
        </View>
      )}

      <View className="mt-6 flex-row flex-wrap gap-3">
        <Pressable
          disabled={(filters.page ?? 1) <= 1}
          onPress={() =>
            setFilters((current) => ({ ...current, page: Math.max(1, (current.page ?? 1) - 1) }))
          }
          className="flex-row items-center gap-2 rounded-full px-4 py-3"
          style={{
            backgroundColor: colors.surfaceAlt,
            opacity: (filters.page ?? 1) <= 1 ? 0.5 : 1
          }}
        >
          <AppIcon name="chevronLeft" size={16} color={colors.text} />
          <Text className="text-sm font-semibold" style={{ color: colors.text }}>
            Назад
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/reports")}
          className="rounded-full px-4 py-3"
          style={{ backgroundColor: colors.primarySoft }}
        >
          <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
            В отчет
          </Text>
        </Pressable>
        <Pressable
          disabled={(filters.page ?? 1) >= totalPages}
          onPress={() =>
            setFilters((current) => ({
              ...current,
              page: Math.min(totalPages, (current.page ?? 1) + 1)
            }))
          }
          className="flex-row items-center gap-2 rounded-full px-4 py-3"
          style={{
            backgroundColor: colors.primary,
            opacity: (filters.page ?? 1) >= totalPages ? 0.5 : 1
          }}
        >
          <Text className="text-sm font-semibold text-white">Вперед</Text>
          <AppIcon name="chevronRight" size={16} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
};
