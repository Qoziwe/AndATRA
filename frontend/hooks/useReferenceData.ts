import { useQuery } from "@tanstack/react-query";
import { getCategories } from "@/services/categories";
import { getDistricts } from "@/services/districts";

export const useCategories = (period = "30d") =>
  useQuery({
    queryKey: ["categories", period],
    queryFn: () => getCategories(period),
    staleTime: 300_000
  });

export const useDistricts = () =>
  useQuery({
    queryKey: ["districts"],
    queryFn: getDistricts,
    staleTime: 300_000
  });
