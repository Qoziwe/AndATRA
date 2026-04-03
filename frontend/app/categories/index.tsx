import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { FadeInView } from "@/components/common/FadeInView";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageHeader } from "@/components/common/PageHeader";
import { AppIcon } from "@/components/icons/AppIcon";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useCategories } from "@/hooks/useReferenceData";
import {
  downloadPdfDocument,
  downloadTextFile
} from "@/services/clientActions";
import { useFeedbackStore } from "@/stores/feedbackStore";

const resolveCategoryIcon = (slug: string) => {
  if (slug.includes("transport")) return "road" as const;
  if (slug.includes("ecology")) return "leaf" as const;
  if (slug.includes("safety")) return "shield" as const;
  if (slug.includes("aryk")) return "droplet" as const;
  if (slug.includes("social")) return "user" as const;
  if (slug.includes("health")) return "heartPulse" as const;
  if (slug.includes("infrastructure")) return "home" as const;
  if (slug.includes("utilities")) return "bolt" as const;
  return "categories" as const;
};

const resolveCategoryTint = (slug: string) => {
  if (slug.includes("transport")) return "#2563EB";
  if (slug.includes("ecology")) return "#16A34A";
  if (slug.includes("safety")) return "#DC2626";
  if (slug.includes("aryk")) return "#0891B2";
  if (slug.includes("social")) return "#7C3AED";
  if (slug.includes("health")) return "#EA580C";
  if (slug.includes("infrastructure")) return "#D97706";
  if (slug.includes("utilities")) return "#0F766E";
  return "#2563EB";
};

export default function CategoriesPage() {
  const pushToast = useFeedbackStore((state) => state.pushToast);
  const { colors } = useAppTheme();
  const query = useCategories();

  if (query.isLoading) {
    return <LoadingSpinner label="Загружаем каталог категорий..." />;
  }

  if (query.error || !query.data) {
    return <ErrorMessage message="Не удалось загрузить категории." />;
  }

  const categoriesText = query.data
    .map(
      (category) =>
        `${category.name}: обращений ${category.appealCount ?? 0}, тренд ${category.trend ?? 0}%`
    )
    .join("\n");

  const handleExportTxt = () => {
    const exported = downloadTextFile("categories.txt", categoriesText);
    pushToast({
      title: exported ? "TXT выгружен" : "Экспорт недоступен",
      description: exported ? "Каталог категорий скачан." : "Экспорт работает в браузере."
    });
  };

  const handleExportPdf = () => {
    const exported = downloadPdfDocument("Категории обращений", [
      { heading: "Каталог категорий", body: categoriesText }
    ]);
    pushToast({
      title: exported ? "PDF подготовлен" : "Экспорт недоступен",
      description: exported
        ? "Открыто окно печати: сохраните каталог как PDF."
        : "PDF-экспорт работает в web-версии."
    });
  };

  const handleRefresh = async () => {
    await query.refetch();
    pushToast({
      title: "Категории обновлены",
      description: "Каталог и счетчики перезагружены."
    });
  };

  return (
    <View>
      <PageHeader
        title="Категории"
        subtitle="Таксономия обращений и объемы по данным backend"
        actions={[
          { label: "TXT", onPress: handleExportTxt },
          { label: "PDF", onPress: handleExportPdf },
          { label: "Обновить", onPress: handleRefresh, primary: true }
        ]}
      />

      <View className="flex-row flex-wrap gap-4">
        {query.data.map((category, index) => (
          <FadeInView key={category.id} delay={50 + index * 35} style={{ minWidth: 300, flex: 1 }}>
            <View
              className="min-w-[300px] flex-1 rounded-[30px] border p-5"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <View
                className="h-14 w-14 items-center justify-center rounded-2xl"
                style={{ backgroundColor: colors.surfaceAlt }}
              >
                <AppIcon
                  name={resolveCategoryIcon(category.slug)}
                  color={resolveCategoryTint(category.slug)}
                  size={24}
                />
              </View>
              <Text className="mt-4 text-xl font-semibold" style={{ color: colors.text }}>
                {category.name}
              </Text>
              <Text className="mt-2 text-sm leading-6" style={{ color: colors.muted }}>
                {category.description ?? "Описание категории отсутствует."}
              </Text>
              <Text className="mt-4 text-sm" style={{ color: colors.textSecondary }}>
                Всего обращений: {category.appealCount ?? 0}
              </Text>
              <Text className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
                Тренд: {(category.trend ?? 0) > 0 ? `+${category.trend}%` : `${category.trend ?? 0}%`}
              </Text>
              <Pressable
                onPress={() => router.push({ pathname: "/appeals", params: { category: category.slug } })}
                className="mt-5 self-start rounded-full px-4 py-3"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-sm font-semibold text-white">Открыть обращения</Text>
              </Pressable>
            </View>
          </FadeInView>
        ))}
      </View>
    </View>
  );
};
