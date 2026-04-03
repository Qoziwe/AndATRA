import { api, unwrapApiResponse } from "@/services/api";
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
  name: category.name,
  slug: category.slug,
  icon: category.icon,
  description: category.description,
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
