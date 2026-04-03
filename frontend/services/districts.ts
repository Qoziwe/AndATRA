import { api, unwrapApiResponse } from "@/services/api";
import type { District } from "@/types/appeal";

interface BackendDistrict {
  id: number;
  name: string;
  slug: string;
  city: string;
  coordinates_center?: {
    lat: number;
    lng: number;
  } | null;
}

const mapDistrict = (district: BackendDistrict): District => ({
  id: district.id,
  name: district.name,
  slug: district.slug,
  city: district.city,
  coordinatesCenter: district.coordinates_center
});

export const getDistricts = async (): Promise<District[]> => {
  const response = await api.get("/api/districts");
  return unwrapApiResponse<BackendDistrict[]>(response).map(mapDistrict);
};
