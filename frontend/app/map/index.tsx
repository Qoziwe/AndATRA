import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { FadeInView } from "@/components/common/FadeInView";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageHeader } from "@/components/common/PageHeader";
import { CityMap, type MapLayerMode } from "@/components/map/CityMap";
import { TOMTOM_TRAFFIC_API_KEY } from "@/constants/config";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useHeatmap } from "@/hooks/useAnalytics";
import { useMapAppeals } from "@/hooks/useAppeals";
import { requestElementFullscreen } from "@/services/clientActions";
import { useFeedbackStore } from "@/stores/feedbackStore";

const layerOptions: Array<{
  key: MapLayerMode;
  label: string;
}> = [
  { key: "appeals", label: "Обращения" },
  { key: "traffic", label: "Пробки" },
  { key: "hybrid", label: "Оба слоя" }
];

export default function MapPage() {
  const trafficEnabled = Boolean(TOMTOM_TRAFFIC_API_KEY);
  const params = useLocalSearchParams<{
    district?: string;
    lat?: string;
    lng?: string;
    appealId?: string;
    title?: string;
  }>();
  const [layerMode, setLayerMode] = useState<MapLayerMode>(trafficEnabled ? "hybrid" : "appeals");
  const queryClient = useQueryClient();
  const pushToast = useFeedbackStore((state) => state.pushToast);
  const { colors } = useAppTheme();
  const heatmapQuery = useHeatmap();
  const mapAppealsQuery = useMapAppeals();
  const focusLatitude = params.lat ? Number(params.lat) : NaN;
  const focusLongitude = params.lng ? Number(params.lng) : NaN;
  const focusPoint =
    Number.isFinite(focusLatitude) && Number.isFinite(focusLongitude)
      ? {
          latitude: focusLatitude,
          longitude: focusLongitude,
          label: params.appealId ? `Обращение #${params.appealId}` : "Точка обращения",
          description: params.title
        }
      : undefined;

  if (heatmapQuery.isLoading || mapAppealsQuery.isLoading) {
    return <LoadingSpinner label="Подготавливаем карту города..." />;
  }

  if (heatmapQuery.error || mapAppealsQuery.error || !heatmapQuery.data || !mapAppealsQuery.data) {
    return <ErrorMessage message="Не удалось загрузить карту." />;
  }

  const selectedPoint = params.district
    ? heatmapQuery.data.find((item) => item.districtSlug === params.district)
    : undefined;
  const activeLayerLabel =
    layerMode === "traffic"
      ? "Пробки TomTom"
      : layerMode === "hybrid"
        ? "Обращения и пробки"
        : "Обращения";

  const handleFullscreen = () => {
    const success = requestElementFullscreen("city-map");
    pushToast({
      title: success ? "Полноэкранный режим открыт" : "Не удалось открыть fullscreen",
      description: success
        ? "Карта переведена в полноэкранный режим браузера."
        : "Браузер не поддержал этот режим для карты."
    });
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["analytics-heatmap"] });
    await queryClient.invalidateQueries({ queryKey: ["appeals-map"] });
    pushToast({
      title: "Слой карты обновлён",
      description: "Данные по районам и обращениям получены заново."
    });
  };

  return (
    <View>
      <PageHeader
        title="Карта города"
        subtitle="Пространственный обзор по обращениям, адресам и активным районам"
        actions={[
          { label: "Полный экран", onPress: handleFullscreen },
          { label: "Обновить", onPress: handleRefresh, primary: true }
        ]}
      />

      <FadeInView delay={60}>
        <View
          className="mb-4 rounded-[28px] border p-4"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <View className="mb-3 flex-row flex-wrap gap-3">
            {layerOptions.map((item) => {
              const disabled = !trafficEnabled && item.key !== "appeals";
              const active = layerMode === item.key;

              return (
                <Pressable
                  key={item.key}
                  onPress={disabled ? undefined : () => setLayerMode(item.key)}
                  className="rounded-full px-4 py-3"
                  style={{
                    backgroundColor: active ? colors.primary : colors.surfaceAlt,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.border,
                    opacity: disabled ? 0.45 : 1
                  }}
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: active ? "#FFFFFF" : colors.text }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text className="text-sm leading-6" style={{ color: colors.muted }}>
            Активный режим: {activeLayerLabel}. На карте теперь отображаются сами обращения с адресом, а если точных координат нет, точка ставится приблизительно по району или по центру города.
          </Text>

          {!trafficEnabled ? (
            <Text className="mt-2 text-sm" style={{ color: colors.warning }}>
              Чтобы включить слой пробок, добавьте `EXPO_PUBLIC_TOMTOM_API_KEY` в `frontend/.env`.
            </Text>
          ) : (
            <Text className="mt-2 text-sm" style={{ color: colors.textSecondary }}>
              Слой пробок загружается из Open API TomTom поверх базовой карты OpenStreetMap.
            </Text>
          )}

          {focusPoint ? (
            <Text className="mt-2 text-sm" style={{ color: colors.textSecondary }}>
              Карта открыта на точной точке обращения. Масштаб и центр выставлены по координатам из карточки.
            </Text>
          ) : null}

          {selectedPoint ? (
            <Text className="mt-2 text-sm" style={{ color: colors.textSecondary }}>
              Фокус по району: {selectedPoint.district}. Карта автоматически приближает именно этот район.
            </Text>
          ) : null}
        </View>
      </FadeInView>

      <FadeInView delay={120}>
        <CityMap
          points={heatmapQuery.data}
          appeals={mapAppealsQuery.data}
          layerMode={layerMode}
          selectedDistrictSlug={params.district}
          focusPoint={focusPoint}
        />
      </FadeInView>
    </View>
  );
}
