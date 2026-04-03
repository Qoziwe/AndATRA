import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

interface StatCardProps {
  label: string;
  value: number | string;
  accent: string;
  delta?: string;
  icon?: ReactNode;
  compact?: boolean;
}

export const StatCard = ({ label, value, accent, delta, icon, compact }: StatCardProps) => {
  const { colors } = useAppTheme();

  return (
    <View
      className={`min-w-[220px] flex-1 rounded-[28px] border ${compact ? "p-4" : "p-5"}`}
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <View className="mb-4 flex-row items-start justify-between gap-3">
        <View
          className="h-11 w-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: colors.surfaceAlt }}
        >
          {icon}
        </View>
        <View className="mt-1 h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
      </View>

      <Text className="text-sm" style={{ color: colors.muted }}>
        {label}
      </Text>
      <Text
        className={`${compact ? "mt-2 text-[32px]" : "mt-3 text-4xl"} font-bold`}
        style={{ color: colors.text }}
      >
        {value}
      </Text>
      {delta ? (
        <Text
          className={`${compact ? "mt-2" : "mt-3"} text-sm leading-6`}
          style={{ color: colors.textSecondary }}
        >
          {delta}
        </Text>
      ) : null}
    </View>
  );
};
