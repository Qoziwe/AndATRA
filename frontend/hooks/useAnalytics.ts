import { useQuery } from "@tanstack/react-query";
import {
  getCategoryBreakdown,
  getDashboardStats,
  getHeatmap,
  getSummary,
  getTrends
} from "@/services/analytics";

export const useDashboardStats = () =>
  useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
    staleTime: 30_000
  });

export const useSummary = (period: string, district?: string, category?: string) =>
  useQuery({
    queryKey: ["analytics-summary", period, district, category],
    queryFn: () => getSummary(period, district, category),
    staleTime: 30_000
  });

export const useTrends = (period: string, category?: string) =>
  useQuery({
    queryKey: ["analytics-trends", period, category],
    queryFn: () => getTrends(period, category),
    staleTime: 30_000
  });

export const useHeatmap = () =>
  useQuery({
    queryKey: ["analytics-heatmap"],
    queryFn: getHeatmap,
    staleTime: 300_000
  });

export const useCategoryBreakdown = (period = "30d") =>
  useQuery({
    queryKey: ["analytics-categories", period],
    queryFn: () => getCategoryBreakdown(period),
    staleTime: 300_000
  });
