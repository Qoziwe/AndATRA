import { useQuery } from "@tanstack/react-query";
import { getAlmatyAirQuality } from "@/services/airQuality";

export const useAlmatyAirQuality = () =>
  useQuery({
    queryKey: ["air-quality-almaty"],
    queryFn: getAlmatyAirQuality,
    staleTime: 600_000
  });
