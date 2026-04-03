import { useQuery } from "@tanstack/react-query";
import { getAppeal, getAppeals } from "@/services/appeals";
import type { AppealFilters } from "@/types/appeal";

export const useAppeals = (filters: AppealFilters) =>
  useQuery({
    queryKey: ["appeals", filters],
    queryFn: () => getAppeals(filters),
    staleTime: 30_000
  });

export const useAppeal = (id?: string) =>
  useQuery({
    queryKey: ["appeals", id],
    queryFn: () => getAppeal(id ?? ""),
    enabled: Boolean(id),
    staleTime: 30_000
  });
