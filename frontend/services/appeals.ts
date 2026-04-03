import { api, unwrapApiResponse } from "@/services/api";
import { normalizeBrokenText } from "@/utils/text";
import type { Appeal, AppealFilters, AppealsResponse, Category, District } from "@/types/appeal";

interface BackendCategory {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  children?: BackendCategory[];
}

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

interface BackendAppeal {
  id: number;
  text: string;
  photo_url?: string | null;
  location_text?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  district?: BackendDistrict | null;
  category?: BackendCategory | null;
  priority: Appeal["priority"];
  status: Appeal["status"];
  ai_summary?: string | null;
  ai_tags?: string[] | null;
  created_at: string;
  updated_at?: string | null;
}

interface BackendAppealsResponse {
  items: BackendAppeal[];
  total: number;
  page?: number;
  page_size?: number;
  limit?: number;
}

const toSentenceCasePreview = (text: string, length: number) => {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= length) {
    return normalized;
  }

  return `${normalized.slice(0, length).trimEnd()}...`;
};

const mapCategory = (category?: BackendCategory | null): Category | null =>
  category
    ? {
        id: category.id,
        name: normalizeBrokenText(category.name),
        slug: category.slug,
        icon: category.icon,
        description: normalizeBrokenText(category.description),
        children: category.children?.map(mapCategory).filter(Boolean) as Category[] | undefined
      }
    : null;

const mapDistrict = (district?: BackendDistrict | null): District | null =>
  district
    ? {
        id: district.id,
        name: normalizeBrokenText(district.name),
        slug: district.slug,
        city: normalizeBrokenText(district.city),
        coordinatesCenter: district.coordinates_center
      }
    : null;

const mapAppeal = (appeal: BackendAppeal): Appeal => {
  const text = normalizeBrokenText(appeal.text?.trim() ?? "");
  const category = mapCategory(appeal.category);
  const district = mapDistrict(appeal.district);

  return {
    id: appeal.id,
    text,
    title: toSentenceCasePreview(text, 72),
    preview: toSentenceCasePreview(text, 140),
    district,
    districtName: district?.name ?? "Без района",
    locationText: normalizeBrokenText(appeal.location_text),
    category,
    categoryName: category?.name ?? "Без категории",
    categorySlug: category?.slug,
    priority: appeal.priority,
    status: appeal.status,
    createdAt: appeal.created_at,
    updatedAt: appeal.updated_at,
    aiSummary: normalizeBrokenText(appeal.ai_summary),
    aiTags: (appeal.ai_tags ?? []).map(normalizeBrokenText),
    photoUrl: appeal.photo_url,
    latitude: appeal.latitude,
    longitude: appeal.longitude
  };
};

export const getAppeals = async (filters: AppealFilters = {}): Promise<AppealsResponse> => {
  const response = await api.get("/api/appeals", {
    params: {
      ...filters,
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 10
    }
  });
  const data = unwrapApiResponse<BackendAppealsResponse>(response);

  return {
    items: data.items.map(mapAppeal),
    total: data.total,
    page: data.page ?? filters.page ?? 1,
    pageSize: data.page_size ?? data.limit ?? filters.pageSize ?? 10
  };
};

export const getAppeal = async (id: string): Promise<Appeal> => {
  const numericId = Number(id);
  if (Number.isNaN(numericId)) {
    throw new Error("Некорректный идентификатор обращения.");
  }

  const response = await api.get(`/api/appeals/${numericId}`);
  return mapAppeal(unwrapApiResponse<BackendAppeal>(response));
};
