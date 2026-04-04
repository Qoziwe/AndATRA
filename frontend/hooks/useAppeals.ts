import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAppeal, getAppeals, getMapAppeals, updateAppealStatus } from "@/services/appeals";
import type { AppealFilters, AppealStatus } from "@/types/appeal";

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

export const useMapAppeals = () =>
  useQuery({
    queryKey: ["appeals-map"],
    queryFn: getMapAppeals,
    staleTime: 30_000
  });

export const useUpdateAppealStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: AppealStatus }) => updateAppealStatus(id, status),
    onSuccess: async (appeal) => {
      queryClient.setQueryData(["appeals", String(appeal.id)], appeal);
      await queryClient.invalidateQueries({ queryKey: ["appeals"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      await queryClient.invalidateQueries({ queryKey: ["analytics-summary"] });
      await queryClient.invalidateQueries({ queryKey: ["analytics-heatmap"] });
      await queryClient.invalidateQueries({ queryKey: ["analytics-trends"] });
    }
  });
};
