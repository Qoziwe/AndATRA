import { api, unwrapApiResponse } from "@/services/api";
import { normalizeBrokenText } from "@/utils/text";
import type { Category } from "@/types/appeal";

interface BackendCategory {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  children?: BackendCategory[];
  appeal_count?: number;
  trend?: number;
}

const mapCategory = (category: BackendCategory): Category => ({
  id: category.id,
  name: normalizeBrokenText(category.name),
  slug: category.slug,
  icon: category.icon,
  description: normalizeBrokenText(category.description),
  appealCount: category.appeal_count ?? 0,
  trend: category.trend ?? 0,
  children: category.children?.map(mapCategory)
});

export const getCategories = async (period = "30d"): Promise<Category[]> => {
  const response = await api.get("/api/categories", {
    params: { period }
  });
  return unwrapApiResponse<BackendCategory[]>(response).map(mapCategory);
};
