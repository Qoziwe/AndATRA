import { useEffect, useMemo } from "react";
import { Platform, Text, View } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import type { AirQualityStation } from "@/types/airQuality";

interface AirQualityMapProps {
  stations: AirQualityStation[];
  selectedStationId?: string;
  onSelectStation?: (stationId: string) => void;
}

const defaultCenter: [number, number] = [43.2389, 76.8897];

export const AirQualityMap = ({
  stations,
  selectedStationId,
  onSelectStation
}: AirQualityMapProps) => {
  const { colors } = useAppTheme();
  const selectedStation = useMemo(
    () => stations.find((station) => station.id === selectedStationId) ?? stations[0],
    [selectedStationId, stations]
  );

  if (Platform.OS !== "web") {
    return (
      <View
        className="h-[520px] items-center justify-center rounded-[28px] border px-6"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <Text className="text-center leading-6" style={{ color: colors.text }}>
          Карта загрязнения воздуха доступна в web-версии приложения.
        </Text>
      </View>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("leaflet/dist/leaflet.css");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { CircleMarker, MapContainer, Popup, TileLayer, useMap } = require("react-leaflet");

  const FocusController = ({ station }: { station?: AirQualityStation }) => {
    const map = useMap();

    useEffect(() => {
      if (station) {
        map.flyTo([station.latitude, station.longitude], 11, { duration: 1.1 });
      } else {
        map.flyTo(defaultCenter, 10, { duration: 1 });
      }
    }, [map, station]);

    return null;
  };

  return (
    <View
      nativeID="air-quality-map"
      className="h-[560px] overflow-hidden rounded-[28px] border"
      style={{ borderColor: colors.border }}
    >
      <MapContainer center={defaultCenter} zoom={10} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FocusController station={selectedStation} />
        {stations.map((station) => {
          const isSelected = station.id === selectedStation?.id;
          const radiusBase = station.current.usAqi ?? 30;
          const radius = Math.min(24, Math.max(10, radiusBase / 7));

          return (
            <CircleMarker
              key={station.id}
              center={[station.latitude, station.longitude]}
              radius={isSelected ? radius + 4 : radius}
              pathOptions={{
                color: isSelected ? "#10203A" : station.level.color,
                fillColor: station.level.color,
                fillOpacity: isSelected ? 0.85 : 0.65,
                weight: isSelected ? 3 : 2
              }}
              eventHandlers={{
                click: () => onSelectStation?.(station.id)
              }}
            >
              <Popup>
                <div>
                  <strong>{station.district}</strong>
                  <div>US AQI: {station.current.usAqi ?? "n/a"}</div>
                  <div>PM2.5: {station.current.pm2_5 ?? "n/a"} мкг/м3</div>
                  <div>PM10: {station.current.pm10 ?? "n/a"} мкг/м3</div>
                  <div>{station.trend}</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </View>
  );
};
