import axios from "axios";
import { AIR_QUALITY_API_URL } from "@/constants/config";
import type {
  AirQualityForecastPoint,
  AirQualityLevel,
  AirQualityLocation,
  AirQualitySnapshot,
  AirQualityStation
} from "@/types/airQuality";

interface OpenMeteoAirQualityResponse {
  timezone?: string;
  current?: {
    time?: string;
    us_aqi?: number | null;
    european_aqi?: number | null;
    pm2_5?: number | null;
    pm10?: number | null;
    carbon_monoxide?: number | null;
    nitrogen_dioxide?: number | null;
    sulphur_dioxide?: number | null;
    ozone?: number | null;
  };
  hourly?: {
    time?: string[];
    us_aqi?: Array<number | null>;
    pm2_5?: Array<number | null>;
    pm10?: Array<number | null>;
    ozone?: Array<number | null>;
    nitrogen_dioxide?: Array<number | null>;
  };
}

export const ALMATY_AIR_QUALITY_LOCATIONS: AirQualityLocation[] = [
  {
    id: "almaly",
    district: "Алмалинский район",
    label: "Алмалинский",
    latitude: 43.2567,
    longitude: 76.9286
  },
  {
    id: "bostandyk",
    district: "Бостандыкский район",
    label: "Бостандыкский",
    latitude: 43.2224,
    longitude: 76.9093
  },
  {
    id: "auezov",
    district: "Ауэзовский район",
    label: "Ауэзовский",
    latitude: 43.2288,
    longitude: 76.8502
  },
  {
    id: "medeu",
    district: "Медеуский район",
    label: "Медеуский",
    latitude: 43.2459,
    longitude: 76.9738
  },
  {
    id: "turksib",
    district: "Турксибский район",
    label: "Турксибский",
    latitude: 43.3437,
    longitude: 77.0007
  },
  {
    id: "nauryzbay",
    district: "Наурызбайский район",
    label: "Наурызбайский",
    latitude: 43.1779,
    longitude: 76.7934
  },
  {
    id: "zhetysu",
    district: "Жетысуский район",
    label: "Жетысуский",
    latitude: 43.2943,
    longitude: 76.8929
  },
  {
    id: "alatau",
    district: "Алатауский район",
    label: "Алатауский",
    latitude: 43.2834,
    longitude: 76.8205
  }
];

const currentVariables = [
  "us_aqi",
  "european_aqi",
  "pm2_5",
  "pm10",
  "carbon_monoxide",
  "nitrogen_dioxide",
  "sulphur_dioxide",
  "ozone"
].join(",");

const hourlyVariables = ["us_aqi", "pm2_5", "pm10", "ozone", "nitrogen_dioxide"].join(",");

const airQualityClient = axios.create({
  timeout: 20000,
  headers: {
    "Content-Type": "application/json"
  }
});

const isNumber = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value);

const getAirQualityLevel = (aqi: number | null): AirQualityLevel => {
  if (!isNumber(aqi)) {
    return {
      label: "Нет данных",
      description: "Данные временно недоступны",
      color: "#64748B",
      textColor: "#FFFFFF"
    };
  }

  if (aqi <= 50) {
    return {
      label: "Хорошо",
      description: "Качество воздуха благоприятное",
      color: "#22C55E",
      textColor: "#FFFFFF"
    };
  }

  if (aqi <= 100) {
    return {
      label: "Умеренно",
      description: "Чувствительным группам лучше сократить нагрузку",
      color: "#EAB308",
      textColor: "#10203A"
    };
  }

  if (aqi <= 150) {
    return {
      label: "Вредно для чувствительных групп",
      description: "Желательно ограничить длительные прогулки",
      color: "#F97316",
      textColor: "#FFFFFF"
    };
  }

  if (aqi <= 200) {
    return {
      label: "Вредно",
      description: "Лучше сократить время на улице",
      color: "#EF4444",
      textColor: "#FFFFFF"
    };
  }

  if (aqi <= 300) {
    return {
      label: "Очень вредно",
      description: "Нужны защитные меры и меньше активности на улице",
      color: "#9333EA",
      textColor: "#FFFFFF"
    };
  }

  return {
    label: "Опасно",
    description: "Рекомендуется избегать длительного пребывания на улице",
    color: "#7F1D1D",
    textColor: "#FFFFFF"
  };
};

const getDominantPollutant = (snapshot: AirQualitySnapshot) => {
  const candidates = [
    { label: "PM2.5", value: snapshot.pm2_5 },
    { label: "PM10", value: snapshot.pm10 },
    { label: "O3", value: snapshot.ozone },
    { label: "NO2", value: snapshot.nitrogenDioxide },
    { label: "CO", value: snapshot.carbonMonoxide },
    { label: "SO2", value: snapshot.sulphurDioxide }
  ].filter((item): item is { label: string; value: number } => isNumber(item.value));

  if (!candidates.length) {
    return "Нет данных";
  }

  return candidates.sort((left, right) => right.value - left.value)[0].label;
};

const createForecast = (response: OpenMeteoAirQualityResponse): AirQualityForecastPoint[] => {
  const time = response.hourly?.time ?? [];

  return time.slice(0, 24).map((timestamp, index) => ({
    time: timestamp,
    usAqi: response.hourly?.us_aqi?.[index] ?? null,
    pm2_5: response.hourly?.pm2_5?.[index] ?? null,
    pm10: response.hourly?.pm10?.[index] ?? null,
    ozone: response.hourly?.ozone?.[index] ?? null,
    nitrogenDioxide: response.hourly?.nitrogen_dioxide?.[index] ?? null
  }));
};

const createTrend = (currentAqi: number | null, hourly: AirQualityForecastPoint[]) => {
  if (!isNumber(currentAqi)) {
    return "Тренд пока не определён";
  }

  const futureValues = hourly
    .slice(1, 7)
    .map((point) => point.usAqi)
    .filter(isNumber);

  if (!futureValues.length) {
    return "Недостаточно прогноза";
  }

  const futurePeak = Math.max(...futureValues);
  const diff = futurePeak - currentAqi;

  if (diff >= 15) {
    return "Ожидается ухудшение в ближайшие часы";
  }

  if (diff <= -15) {
    return "Ожидается улучшение в ближайшие часы";
  }

  return "Фон остаётся стабильным";
};

const fetchStationAirQuality = async (location: AirQualityLocation): Promise<AirQualityStation> => {
  const { data } = await airQualityClient.get<OpenMeteoAirQualityResponse>(AIR_QUALITY_API_URL, {
    params: {
      latitude: location.latitude,
      longitude: location.longitude,
      current: currentVariables,
      hourly: hourlyVariables,
      timezone: "auto",
      forecast_hours: 24
    }
  });

  const current: AirQualitySnapshot = {
    time: data.current?.time ?? new Date().toISOString(),
    usAqi: data.current?.us_aqi ?? null,
    europeanAqi: data.current?.european_aqi ?? null,
    pm2_5: data.current?.pm2_5 ?? null,
    pm10: data.current?.pm10 ?? null,
    carbonMonoxide: data.current?.carbon_monoxide ?? null,
    nitrogenDioxide: data.current?.nitrogen_dioxide ?? null,
    sulphurDioxide: data.current?.sulphur_dioxide ?? null,
    ozone: data.current?.ozone ?? null
  };
  const hourly = createForecast(data);
  const nextPeakAqi = hourly
    .map((point) => point.usAqi)
    .filter(isNumber)
    .reduce<number | null>((peak, value) => (peak === null || value > peak ? value : peak), null);

  return {
    ...location,
    timezone: data.timezone ?? "Asia/Almaty",
    current,
    hourly,
    level: getAirQualityLevel(current.usAqi),
    dominantPollutant: getDominantPollutant(current),
    trend: createTrend(current.usAqi, hourly),
    nextPeakAqi
  };
};

export const getAlmatyAirQuality = async () => {
  const settled = await Promise.allSettled(
    ALMATY_AIR_QUALITY_LOCATIONS.map((location) => fetchStationAirQuality(location))
  );

  const stations = settled
    .filter(
      (item): item is PromiseFulfilledResult<AirQualityStation> => item.status === "fulfilled"
    )
    .map((item) => item.value)
    .sort((left, right) => (right.current.usAqi ?? -1) - (left.current.usAqi ?? -1));

  if (!stations.length) {
    throw new Error("Не удалось загрузить данные по качеству воздуха для Алматы.");
  }

  return stations;
};
