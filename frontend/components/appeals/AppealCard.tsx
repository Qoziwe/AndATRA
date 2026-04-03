import { Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { PriorityBadge } from "@/components/appeals/PriorityBadge";
import { StatusBadge } from "@/components/appeals/StatusBadge";
import { AppIcon } from "@/components/icons/AppIcon";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatDateTime } from "@/utils/format";
import type { Appeal } from "@/types/appeal";

export const AppealCard = ({ appeal }: { appeal: Appeal }) => {
  const { colors } = useAppTheme();

  return (
    <Link href={`/appeals/${appeal.id}` as never} asChild>
      <Pressable
        className="rounded-[30px] border p-5"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <View className="flex-row flex-wrap items-center justify-between gap-3">
          <View className="max-w-3xl">
            <Text className="text-xs uppercase tracking-[2px]" style={{ color: colors.muted }}>
              #{appeal.id}
            </Text>
            <Text className="mt-2 text-xl font-semibold" style={{ color: colors.text }}>
              {appeal.title}
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            <StatusBadge status={appeal.status} />
            <PriorityBadge priority={appeal.priority} />
          </View>
        </View>

        <Text className="mt-4 text-sm leading-7" style={{ color: colors.textSecondary }}>
          {appeal.preview}
        </Text>

        <View className="mt-5 flex-row flex-wrap gap-3">
          <Text
            className="rounded-full px-3 py-2 text-xs"
            style={{ backgroundColor: colors.primarySoft, color: colors.primary }}
          >
            {appeal.categoryName}
          </Text>
          <Text
            className="rounded-full px-3 py-2 text-xs"
            style={{ backgroundColor: colors.surfaceAlt, color: colors.textSecondary }}
          >
            {appeal.districtName}
          </Text>
        </View>

        <View className="mt-5 flex-row flex-wrap items-center justify-between gap-3">
          <View className="flex-row items-center gap-2">
            <AppIcon name="map" size={16} color={colors.muted} />
            <Text className="text-xs" style={{ color: colors.muted }}>
              {appeal.locationText ?? "Локация не указана"}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <AppIcon name="chevronRight" size={16} color={colors.muted} />
            <Text className="text-xs" style={{ color: colors.muted }}>
              {formatDateTime(appeal.createdAt)}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
};
