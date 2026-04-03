export interface DashboardStats {
  totalAppeals: number;
  criticalAppeals: number;
  resolvedToday: number;
  activeDistricts: number;
  criticalNewAppeals: number;
}

export interface CategoryMetric {
  slug: string;
  label: string;
  value: number;
  color: string;
  trend?: number;
  icon?: string | null;
  description?: string | null;
}

export interface TrendPoint {
  date: string;
  total: number;
  resolved: number;
  critical: number;
}

export interface DistrictHeatmap {
  district: string;
  districtSlug: string;
  count: number;
  trend: number;
  latitude: number;
  longitude: number;
  insight: string;
}

export interface AnalyticsSummary {
  period: string;
  total: number;
  byCategory: Record<string, number>;
  byDistrict: Record<string, number>;
  byPriority: Record<string, number>;
  byStatus: Record<string, number>;
  narrative: string[];
  highlights: string[];
  metrics: DashboardStats & {
    resolutionRate: number;
    avgResponseHours: number;
  };
  categoryBreakdown: CategoryMetric[];
}
