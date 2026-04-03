import { useEffect, useMemo } from "react";
import { Platform, Text, View } from "react-native";
import { getTomTomTrafficTileUrl } from "@/constants/config";
import { useAppTheme } from "@/hooks/useAppTheme";
import type { DistrictHeatmap } from "@/types/analytics";

export type MapLayerMode = "appeals" | "traffic" | "hybrid";

interface CityMapProps {
  points: DistrictHeatmap[];
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
          <TileLayer
            attribution="&copy; TomTom"
            opacity={0.92}
            url={trafficTileUrl}
            zIndex={300}
          />
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
                    fillOpacity: isSelected ? 0.7 : 0.45,
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
