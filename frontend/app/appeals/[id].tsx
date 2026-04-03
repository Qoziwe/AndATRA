import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AppealDetail } from "@/components/appeals/AppealDetail";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageHeader } from "@/components/common/PageHeader";
import { useAppeal } from "@/hooks/useAppeals";
import { downloadPdfDocument, downloadTextFile } from "@/services/clientActions";
import { useFeedbackStore } from "@/stores/feedbackStore";

export default function AppealDetailPage() {
  const params = useLocalSearchParams<{ id: string }>();
  const pushToast = useFeedbackStore((state) => state.pushToast);
  const query = useAppeal(params.id);

  if (query.isLoading) {
    return <LoadingSpinner label="Открываем карточку обращения..." />;
  }

  if (query.error || !query.data) {
    return <ErrorMessage message="Не удалось открыть обращение." />;
  }

  const exportLines = [
    query.data.title,
    query.data.text,
    `Категория: ${query.data.categoryName}`,
    `Район: ${query.data.districtName}`,
    `Статус: ${query.data.status}`,
    `Приоритет: ${query.data.priority}`,
    `Адрес: ${query.data.locationText ?? "Не указан"}`
  ];

  const handleExportTxt = () => {
    const exported = downloadTextFile(`${query.data.id}.txt`, exportLines.join("\n"));

    pushToast({
      title: exported ? "Карточка выгружена" : "Экспорт недоступен",
      description: exported
        ? `Файл ${query.data.id}.txt скачан.`
        : "Откройте web-версию для скачивания файла."
    });
  };

  const handleExportPdf = () => {
    const exported = downloadPdfDocument(`Обращение #${query.data.id}`, [
      { heading: "Карточка обращения", body: exportLines.join("\n") }
    ]);

    pushToast({
      title: exported ? "PDF подготовлен" : "Экспорт недоступен",
      description: exported
        ? "Открыто окно печати: сохраните обращение как PDF."
        : "PDF-экспорт работает в web-версии."
    });
  };

  const handleMapOpen = () => {
    router.push({
      pathname: "/map",
      params: {
        ...(query.data.district?.slug ? { district: query.data.district.slug } : {}),
        ...(query.data.latitude != null ? { lat: String(query.data.latitude) } : {}),
        ...(query.data.longitude != null ? { lng: String(query.data.longitude) } : {}),
        appealId: String(query.data.id),
        title: query.data.title
      }
    });
  };

  return (
    <View>
      <PageHeader
        title={`Обращение #${query.data.id}`}
        subtitle="Полное описание кейса, AI-анализ и переход к точке на карте"
        actions={[
          { label: "Назад к списку", onPress: () => router.push("/appeals") },
          { label: "На карте", onPress: handleMapOpen },
          { label: "TXT", onPress: handleExportTxt },
          { label: "PDF", onPress: handleExportPdf, primary: true }
        ]}
      />
      <AppealDetail appeal={query.data} />
    </View>
  );
}
