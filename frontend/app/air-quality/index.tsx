import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { AirQualityMap } from "@/components/air-quality/AirQualityMap";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { FadeInView } from "@/components/common/FadeInView";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { AppIcon } from "@/components/icons/AppIcon";
import { useAlmatyAirQuality } from "@/hooks/useAirQuality";
import { useAppTheme } from "@/hooks/useAppTheme";
import {
  downloadPdfDocument,
  downloadTextFile,
  requestElementFullscreen
} from "@/services/clientActions";
import { useFeedbackStore } from "@/stores/feedbackStore";

const formatNumber = (value: number | null, digits = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : "n/a";

const formatHour = (value: string) =>
  new Date(value).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit"
  });

export default function AirQualityPage() {
  const queryClient = useQueryClient();
  const pushToast = useFeedbackStore((state) => state.pushToast);
  const { colors } = useAppTheme();
  const query = useAlmatyAirQuality();
  const [selectedStationId, setSelectedStationId] = useState<string>();

  useEffect(() => {
    if (!query.data?.length) {
      return;
    }

    if (!selectedStationId || !query.data.some((station) => station.id === selectedStationId)) {
      setSelectedStationId(query.data[0].id);
    }
  }, [query.data, selectedStationId]);

  const selectedStation = useMemo(
    () => query.data?.find((station) => station.id === selectedStationId) ?? query.data?.[0],
    [query.data, selectedStationId]
  );

  if (query.isLoading) {
    return <LoadingSpinner label="Собираем карту загрязнения воздуха Алматы..." />;
  }

  if (query.error || !query.data?.length || !selectedStation) {
    return <ErrorMessage message="Не удалось загрузить карту загрязнения воздуха." />;
  }

  const averagePm25 =
    query.data.reduce((sum, station) => sum + (station.current.pm2_5 ?? 0), 0) / query.data.length;
  const averagePm10 =
    query.data.reduce((sum, station) => sum + (station.current.pm10 ?? 0), 0) / query.data.length;
  const worstStation = query.data[0];
  const snapshot = query.data
    .map(
      (station) =>
        `${station.district}: AQI ${formatNumber(station.current.usAqi)}, PM2.5 ${formatNumber(station.current.pm2_5, 1)}, PM10 ${formatNumber(station.current.pm10, 1)}, тренд: ${station.trend}`
    )
    .join("\n");

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["air-quality-almaty"] });
    pushToast({
      title: "Карта воздуха обновлена",
      description: "Данные Open-Meteo получены заново."
    });
  };

  const handleExportTxt = () => {
    const exported = downloadTextFile("almaty-air-quality.txt", snapshot);
    pushToast({
      title: exported ? "TXT сохранён" : "Экспорт недоступен",
      description: exported
        ? "Сводка по качеству воздуха сохранена в файл."
        : "Откройте web-версию приложения, чтобы скачать файл."
    });
  };

  const handleExportPdf = () => {
    const exported = downloadPdfDocument("Карта загрязнения воздуха Алматы", [
      {
        heading: "Сводка по районам",
        body: snapshot
      }
    ]);
    pushToast({
      title: exported ? "PDF подготовлен" : "Экспорт недоступен",
      description: exported
        ? "Открыто окно печати: сохраните карту как PDF."
        : "PDF-экспорт работает в web-версии."
    });
  };

  const handleFullscreen = () => {
    const success = requestElementFullscreen("air-quality-map");
    pushToast({
      title: success ? "Полный экран открыт" : "Не удалось открыть fullscreen",
      description: success
        ? "Карта воздуха переведена в полноэкранный режим браузера."
        : "Браузер не поддержал этот режим для карты."
    });
  };

  return (
    <View>
      <PageHeader
        title="Карта загрязнения воздуха Алматы"
        subtitle="Онлайн-карта AQI, PM2.5 и PM10 по районам Алматы на базе Open-Meteo Air Quality API. В текущей реализации API key не нужен."
        actions={[
          { label: "Карта города", onPress: () => router.push("/map") },
          { label: "TXT", onPress: handleExportTxt },
          { label: "PDF", onPress: handleExportPdf },
          { label: "Полный экран", onPress: handleFullscreen },
          { label: "Обновить", onPress: handleRefresh, primary: true }
        ]}
      />

      <FadeInView delay={50}>
        <View
          className="mb-5 rounded-[28px] border px-5 py-4"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <View className="flex-row flex-wrap items-center justify-between gap-4">
            <View className="flex-1">
              <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                Источник данных
              </Text>
              <Text className="mt-1 text-sm leading-6" style={{ color: colors.muted }}>
                Используется официальный endpoint Open-Meteo Air Quality API с почасовыми
                прогнозами. Для обычного использования ключ не требуется, поэтому страница
                работает сразу после запуска фронтенда.
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/map")}
              className="rounded-full px-4 py-3"
              style={{ backgroundColor: colors.primarySoft }}
            >
              <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                Открыть карту города
              </Text>
            </Pressable>
          </View>
        </View>
      </FadeInView>

      <View className="flex-row flex-wrap gap-3">
        <FadeInView delay={90} style={{ minWidth: 220, flex: 1 }}>
          <StatCard
            label="Худший район сейчас"
            value={worstStation.label}
            accent={worstStation.level.color}
            delta={`AQI ${formatNumber(worstStation.current.usAqi)} • ${worstStation.level.label}`}
            icon={<AppIcon name="leaf" color={worstStation.level.color} />}
            compact
          />
        </FadeInView>
        <FadeInView delay={130} style={{ minWidth: 220, flex: 1 }}>
          <StatCard
            label="Средний PM2.5"
            value={`${formatNumber(averagePm25, 1)} мкг/м3`}
            accent="#0EA5E9"
            delta="Среднее по всем точкам Алматы"
            icon={<AppIcon name="droplet" color="#0EA5E9" />}
            compact
          />
        </FadeInView>
        <FadeInView delay={170} style={{ minWidth: 220, flex: 1 }}>
          <StatCard
            label="Средний PM10"
            value={`${formatNumber(averagePm10, 1)} мкг/м3`}
            accent="#F97316"
            delta="Текущее среднее значение"
            icon={<AppIcon name="wind" color="#F97316" />}
            compact
          />
        </FadeInView>
        <FadeInView delay={210} style={{ minWidth: 220, flex: 1 }}>
          <StatCard
            label="Покрытие"
            value={`${query.data.length} районов`}
            accent="#8B5CF6"
            delta="Фиксированные точки мониторинга по городу"
            icon={<AppIcon name="map" color="#8B5CF6" />}
            compact
          />
        </FadeInView>
      </View>

      <View className="mt-5 flex-row flex-wrap gap-5">
        <FadeInView delay={240} style={{ minWidth: 380, flex: 1.3 }}>
          <AirQualityMap
            stations={query.data}
            selectedStationId={selectedStation.id}
            onSelectStation={setSelectedStationId}
          />
        </FadeInView>

        <FadeInView delay={280} style={{ minWidth: 320, flex: 0.9 }}>
          <View
            className="rounded-[28px] border p-5"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="text-xl font-bold" style={{ color: colors.text }}>
                  {selectedStation.district}
                </Text>
                <Text className="mt-1 text-sm" style={{ color: colors.muted }}>
                  Обновление:{" "}
                  {new Date(selectedStation.current.time).toLocaleString("ru-RU", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit"
                  })}
                </Text>
              </View>
              <View
                className="rounded-full px-3 py-2"
                style={{ backgroundColor: selectedStation.level.color }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: selectedStation.level.textColor }}
                >
                  {selectedStation.level.label}
                </Text>
              </View>
            </View>

            <Text className="mt-4 text-sm leading-6" style={{ color: colors.textSecondary }}>
              {selectedStation.level.description}. Доминирующий загрязнитель:{" "}
              {selectedStation.dominantPollutant}. {selectedStation.trend}.
            </Text>

            <View className="mt-5 flex-row flex-wrap gap-3">
              {[
                { label: "US AQI", value: formatNumber(selectedStation.current.usAqi) },
                { label: "EU AQI", value: formatNumber(selectedStation.current.europeanAqi) },
                { label: "PM2.5", value: `${formatNumber(selectedStation.current.pm2_5, 1)} мкг/м3` },
                { label: "PM10", value: `${formatNumber(selectedStation.current.pm10, 1)} мкг/м3` },
                { label: "O3", value: `${formatNumber(selectedStation.current.ozone, 1)} мкг/м3` },
                {
                  label: "Пик 24ч",
                  value:
                    selectedStation.nextPeakAqi !== null
                      ? `AQI ${formatNumber(selectedStation.nextPeakAqi)}`
                      : "n/a"
                }
              ].map((metric) => (
                <View
                  key={metric.label}
                  className="min-w-[130px] flex-1 rounded-[22px] border px-4 py-3"
                  style={{ backgroundColor: colors.surfaceAlt, borderColor: colors.border }}
                >
                  <Text
                    className="text-xs uppercase tracking-[1.4px]"
                    style={{ color: colors.muted }}
                  >
                    {metric.label}
                  </Text>
                  <Text className="mt-2 text-base font-semibold" style={{ color: colors.text }}>
                    {metric.value}
                  </Text>
                </View>
              ))}
            </View>

            <Text className="mt-5 text-sm font-semibold" style={{ color: colors.text }}>
              Ближайшие 6 часов
            </Text>
            <View className="mt-3 gap-2">
              {selectedStation.hourly.slice(0, 6).map((point) => (
                <View
                  key={point.time}
                  className="flex-row items-center justify-between rounded-[20px] border px-4 py-3"
                  style={{ backgroundColor: colors.surfaceAlt, borderColor: colors.border }}
                >
                  <Text className="text-sm font-medium" style={{ color: colors.text }}>
                    {formatHour(point.time)}
                  </Text>
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>
                    AQI {formatNumber(point.usAqi)} • PM2.5 {formatNumber(point.pm2_5, 1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </FadeInView>
      </View>

      <FadeInView delay={320}>
        <View className="mt-5 flex-row flex-wrap gap-3">
          {query.data.map((station) => {
            const active = station.id === selectedStation.id;

            return (
              <Pressable
                key={station.id}
                onPress={() => setSelectedStationId(station.id)}
                className="min-w-[180px] flex-1 rounded-[24px] border px-4 py-4"
                style={{
                  backgroundColor: active ? colors.primarySoft : colors.surface,
                  borderColor: active ? colors.primary : colors.border
                }}
              >
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  {station.label}
                </Text>
                <Text className="mt-1 text-xs" style={{ color: colors.muted }}>
                  {station.level.label}
                </Text>
                <Text className="mt-3 text-2xl font-bold" style={{ color: colors.text }}>
                  {formatNumber(station.current.usAqi)}
                </Text>
                <Text className="mt-1 text-xs" style={{ color: colors.textSecondary }}>
                  PM2.5 {formatNumber(station.current.pm2_5, 1)} • PM10{" "}
                  {formatNumber(station.current.pm10, 1)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </FadeInView>
    </View>
  );
}
