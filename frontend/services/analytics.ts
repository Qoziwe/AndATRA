import { CATEGORY_COLORS } from "@/constants/config";
import { api, unwrapApiResponse } from "@/services/api";
import { normalizeBrokenText } from "@/utils/text";
import type {
  AnalyticsSummary,
  CategoryMetric,
  DashboardStats,
  DistrictHeatmap,
  TrendPoint
} from "@/types/analytics";

interface BackendDashboardStats {
  total_appeals: number;
  critical_appeals: number;
  resolved_today: number;
  active_districts: number;
  critical_new_appeals: number;
}

interface BackendCategoryMetric {
  slug: string;
  label: string;
  value: number;
  trend?: number;
  icon?: string | null;
  description?: string | null;
}

interface BackendAnalyticsSummary {
  period: string;
  total: number;
  by_category: Record<string, number>;
  by_district: Record<string, number>;
  by_priority: Record<string, number>;
  by_status: Record<string, number>;
  narrative: string[];
  highlights: string[];
  metrics: BackendDashboardStats & {
    resolution_rate: number;
    avg_response_hours: number;
  };
  category_breakdown: BackendCategoryMetric[];
}

interface BackendTrendPoint {
  date: string;
  total: number;
  resolved: number;
  critical: number;
}

interface BackendHeatmapPoint {
  district: {
    name: string;
    slug: string;
    coordinates_center?: {
      lat: number;
      lng: number;
    } | null;
  };
  appeal_count: number;
  trend: number;
  insight: string;
}

const getCategoryColor = (slug: string) =>
  CATEGORY_COLORS[slug as keyof typeof CATEGORY_COLORS] ?? CATEGORY_COLORS.default;

const CATEGORY_LABELS: Partial<Record<BackendCategoryMetric["slug"], string>> = {
  transport: "Транспорт",
  ecology: "Экология",
  safety: "Безопасность",
  aryk_monitoring: "Арыки и ливневки",
  social: "Социальная сфера",
  healthcare: "Здравоохранение",
  infrastructure: "Инфраструктура",
  utilities: "Коммунальные услуги"
};

const resolveCategoryLabel = (metric: BackendCategoryMetric) =>
  CATEGORY_LABELS[metric.slug] ?? normalizeBrokenText(metric.label);

const mapCategoryMetric = (metric: BackendCategoryMetric): CategoryMetric => ({
  slug: metric.slug,
  label: resolveCategoryLabel(metric),
  value: metric.value,
  color: getCategoryColor(metric.slug),
  trend: metric.trend,
  icon: metric.icon,
  description: normalizeBrokenText(metric.description)
});

const mapDashboardStats = (stats: BackendDashboardStats): DashboardStats => ({
  totalAppeals: stats.total_appeals,
  criticalAppeals: stats.critical_appeals,
  resolvedToday: stats.resolved_today,
  activeDistricts: stats.active_districts,
  criticalNewAppeals: stats.critical_new_appeals
});

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get("/api/analytics/dashboard");
  return mapDashboardStats(unwrapApiResponse<BackendDashboardStats>(response));
};

export const getSummary = async (
  period: string,
  district?: string,
  category?: string
): Promise<AnalyticsSummary> => {
  const response = await api.get("/api/analytics/summary", {
    params: { period, district, category }
  });
  const data = unwrapApiResponse<BackendAnalyticsSummary>(response);

  return {
    period: data.period,
    total: data.total,
    byCategory: data.by_category,
    byDistrict: data.by_district,
    byPriority: data.by_priority,
    byStatus: data.by_status,
    narrative: data.narrative.map(normalizeBrokenText),
    highlights: data.highlights.map(normalizeBrokenText),
    metrics: {
      ...mapDashboardStats(data.metrics),
      resolutionRate: data.metrics.resolution_rate,
      avgResponseHours: data.metrics.avg_response_hours
    },
    categoryBreakdown: data.category_breakdown.map(mapCategoryMetric)
  };
};

export const getTrends = async (
  period: string,
  category?: string
): Promise<TrendPoint[]> => {
  const response = await api.get("/api/analytics/trends", {
    params: { period, category }
  });
  return unwrapApiResponse<BackendTrendPoint[]>(response).map((point) => ({
    date: point.date,
    total: point.total,
    resolved: point.resolved,
    critical: point.critical
  }));
};

export const getHeatmap = async (): Promise<DistrictHeatmap[]> => {
  const response = await api.get("/api/analytics/heatmap");
  return unwrapApiResponse<BackendHeatmapPoint[]>(response).map((item) => ({
    district: normalizeBrokenText(item.district.name),
    districtSlug: item.district.slug,
    count: item.appeal_count,
    trend: item.trend,
    latitude: item.district.coordinates_center?.lat ?? 43.2389,
    longitude: item.district.coordinates_center?.lng ?? 76.8897,
    insight: normalizeBrokenText(item.insight)
  }));
};

export const getCategoryBreakdown = async (period = "30d"): Promise<CategoryMetric[]> => {
  const response = await api.get("/api/analytics/categories", {
    params: { period }
  });
  return unwrapApiResponse<BackendCategoryMetric[]>(response).map(mapCategoryMetric);
};
