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
      className={`min-w-[220px] flex-1 rounded-[30px] border ${compact ? "p-4" : "p-5"}`}
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <View className="mb-4 flex-row items-center justify-between">
        <View className="h-2 w-14 rounded-full" style={{ backgroundColor: accent }} />
        {icon}
      </View>
      <Text className="text-sm" style={{ color: colors.muted }}>
        {label}
      </Text>
      <Text
        className={`${compact ? "mt-2 text-3xl" : "mt-3 text-4xl"} font-bold`}
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
