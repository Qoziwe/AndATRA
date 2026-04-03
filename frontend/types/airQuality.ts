export interface AirQualityLocation {
  id: string;
  district: string;
  label: string;
  latitude: number;
  longitude: number;
}

export interface AirQualitySnapshot {
  time: string;
  usAqi: number | null;
  europeanAqi: number | null;
  pm2_5: number | null;
  pm10: number | null;
  carbonMonoxide: number | null;
  nitrogenDioxide: number | null;
  sulphurDioxide: number | null;
  ozone: number | null;
}

export interface AirQualityForecastPoint {
  time: string;
  usAqi: number | null;
  pm2_5: number | null;
  pm10: number | null;
  ozone: number | null;
  nitrogenDioxide: number | null;
}

export interface AirQualityLevel {
  label: string;
  description: string;
  color: string;
  textColor: string;
}

export interface AirQualityStation extends AirQualityLocation {
  timezone: string;
  current: AirQualitySnapshot;
  hourly: AirQualityForecastPoint[];
  level: AirQualityLevel;
  dominantPollutant: string;
  trend: string;
  nextPeakAqi: number | null;
}
