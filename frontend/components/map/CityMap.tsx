import { useEffect, useMemo } from "react";
import { Platform, Text, View } from "react-native";
import { CATEGORY_COLORS, PRIORITY_LABELS, STATUS_LABELS, getTomTomTrafficTileUrl } from "@/constants/config";
import { useAppTheme } from "@/hooks/useAppTheme";
import type { DistrictHeatmap } from "@/types/analytics";
import type { Appeal } from "@/types/appeal";

export type MapLayerMode = "appeals" | "traffic" | "hybrid";

interface CityMapProps {
  points: DistrictHeatmap[];
  appeals?: Appeal[];
  selectedDistrictSlug?: string;
  layerMode?: MapLayerMode;
  focusPoint?: {
    latitude: number;
    longitude: number;
    label?: string;
    description?: string;
  };
}

export const CityMap = ({
  points,
  appeals = [],
  selectedDistrictSlug,
  layerMode = "appeals",
  focusPoint
}: CityMapProps) => {
  const center = useMemo(() => [43.2389, 76.8897] as [number, number], []);
  const { colors, isDark } = useAppTheme();
  const selectedPoint = points.find((point) => point.districtSlug === selectedDistrictSlug);
  const trafficTileUrl = getTomTomTrafficTileUrl(isDark ? "relative0-dark" : "relative0");
  const showAppealsLayer = layerMode !== "traffic";
  const showTrafficLayer = layerMode !== "appeals" && Boolean(trafficTileUrl);
  const visibleAppeals = useMemo(
    () =>
      appeals.filter(
        (appeal) =>
          Boolean(appeal.locationText) &&
          (!selectedDistrictSlug || appeal.district?.slug === selectedDistrictSlug)
      ),
    [appeals, selectedDistrictSlug]
  );

  if (Platform.OS !== "web") {
    return (
      <View
        className="h-[520px] items-center justify-center rounded-[28px] border"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <Text style={{ color: colors.text }}>Карта доступна в web-версии приложения.</Text>
      </View>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("leaflet/dist/leaflet.css");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { CircleMarker, MapContainer, Popup, TileLayer, useMap } = require("react-leaflet");

  const getAppealPosition = (appeal: Appeal): [number, number] => {
    if (appeal.latitude != null && appeal.longitude != null) {
      return [appeal.latitude, appeal.longitude];
    }

    const districtCenter = appeal.district?.coordinatesCenter;
    const baseLat = districtCenter?.lat ?? center[0];
    const baseLng = districtCenter?.lng ?? center[1];
    const seed = appeal.id * 137.508;
    const angle = ((seed % 360) * Math.PI) / 180;
    const radius = districtCenter ? 0.0032 : 0.0075;
    const scale = ((appeal.id % 5) + 1) / 5;

    return [
      baseLat + Math.sin(angle) * radius * scale,
      baseLng + Math.cos(angle) * radius * scale
    ];
  };

  const getAppealColor = (appeal: Appeal) => {
    if (appeal.status === "resolved") {
      return "#22C55E";
    }
    if (appeal.status === "irrelevant" || appeal.status === "rejected") {
      return "#64748B";
    }
    return CATEGORY_COLORS[appeal.categorySlug as keyof typeof CATEGORY_COLORS] ?? CATEGORY_COLORS.default;
  };

  const FocusController = ({
    point,
    exactPoint
  }: {
    point?: DistrictHeatmap;
    exactPoint?: CityMapProps["focusPoint"];
  }) => {
    const map = useMap();

    useEffect(() => {
      if (exactPoint) {
        map.flyTo([exactPoint.latitude, exactPoint.longitude], 17, { duration: 1.2 });
      } else if (point) {
        map.flyTo([point.latitude, point.longitude], 13, { duration: 1.2 });
      } else {
        map.flyTo(center, 11, { duration: 1 });
      }
    }, [exactPoint, map, point]);

    return null;
  };

  return (
    <View
      nativeID="city-map"
      className="h-[560px] overflow-hidden rounded-[28px] border"
      style={{ borderColor: colors.border }}
    >
      <MapContainer center={center} zoom={11} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {showTrafficLayer ? (
          <TileLayer attribution="&copy; TomTom" opacity={0.92} url={trafficTileUrl} zIndex={300} />
        ) : null}
        <FocusController point={selectedPoint} exactPoint={focusPoint} />
        {focusPoint ? (
          <CircleMarker
            center={[focusPoint.latitude, focusPoint.longitude]}
            radius={12}
            pathOptions={{
              color: "#0F766E",
              fillColor: "#14B8A6",
              fillOpacity: 0.8,
              weight: 3
            }}
          >
            <Popup>
              <div>
                <strong>{focusPoint.label ?? "Точка обращения"}</strong>
                {focusPoint.description ? <div>{focusPoint.description}</div> : null}
              </div>
            </Popup>
          </CircleMarker>
        ) : null}
        {showAppealsLayer
          ? visibleAppeals.map((appeal) => {
              const [latitude, longitude] = getAppealPosition(appeal);
              const isApproximate = appeal.latitude == null || appeal.longitude == null;
              const markerColor = getAppealColor(appeal);

              return (
                <CircleMarker
                  key={`appeal-${appeal.id}`}
                  center={[latitude, longitude]}
                  radius={6}
                  pathOptions={{
                    color: markerColor,
                    fillColor: markerColor,
                    fillOpacity: 0.85,
                    weight: 2
                  }}
                >
                  <Popup>
                    <div>
                      <strong>Обращение #{appeal.id}</strong>
                      <div>{appeal.title}</div>
                      <div>Статус: {STATUS_LABELS[appeal.status]}</div>
                      <div>Приоритет: {PRIORITY_LABELS[appeal.priority]}</div>
                      <div>Категория: {appeal.categoryName}</div>
                      <div>Адрес: {appeal.locationText ?? "Не указан"}</div>
                      <div>Район: {appeal.districtName}</div>
                      {isApproximate ? <div>Точка показана приблизительно.</div> : null}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })
          : null}
        {showAppealsLayer
          ? points.map((point) => {
              const isSelected = point.districtSlug === selectedDistrictSlug;

              return (
                <CircleMarker
                  key={point.districtSlug}
                  center={[point.latitude, point.longitude]}
                  radius={isSelected ? Math.max(16, point.count / 6) : Math.max(10, point.count / 8)}
                  pathOptions={{
                    color: isSelected
                      ? "#2563EB"
                      : point.count > 120
                        ? "#EF4444"
                        : point.count > 90
                          ? "#F59E0B"
                          : "#3B82F6",
                    fillColor: isSelected ? "#60A5FA" : undefined,
                    fillOpacity: isSelected ? 0.35 : 0.18,
                    weight: isSelected ? 3 : 2
                  }}
                >
                  <Popup>
                    <div>
                      <strong>{point.district}</strong>
                      <div>Обращений: {point.count}</div>
                      <div>Тренд: {point.trend > 0 ? `+${point.trend}%` : `${point.trend}%`}</div>
                      <div>{point.insight}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })
          : null}
      </MapContainer>
    </View>
  );
};
