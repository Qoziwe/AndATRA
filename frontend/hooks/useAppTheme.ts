import { useMemo } from "react";
import { useUiStore } from "@/stores/uiStore";
import { palettes } from "@/theme/palette";

export const useAppTheme = () => {
  const theme = useUiStore((state) => state.theme);

  return useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      colors: palettes[theme]
    }),
    [theme]
  );
};
