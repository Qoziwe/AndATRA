import { Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatDateTime } from "@/utils/format";
import type { Appeal } from "@/types/appeal";

export const RecentAppeals = ({ appeals }: { appeals: Appeal[] }) => {
  const { colors } = useAppTheme();

  return (
    <View
      className="rounded-[30px] border p-5"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <View className="mb-5 flex-row items-center justify-between">
        <Text className="text-xl font-semibold" style={{ color: colors.text }}>
          Последние обращения
        </Text>
        <Link href="/appeals" asChild>
          <Pressable>
            <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
              Смотреть все
            </Text>
          </Pressable>
        </Link>
      </View>
      <View className="gap-4">
        {appeals.length ? (
          appeals.map((appeal) => (
            <Link href={`/appeals/${appeal.id}` as never} key={appeal.id} asChild>
              <Pressable
                className="rounded-[22px] border px-4 py-4"
                style={{ backgroundColor: colors.surfaceAlt, borderColor: colors.border }}
              >
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  {appeal.title}
                </Text>
                <Text className="mt-1 text-sm" style={{ color: colors.muted }}>
                  {appeal.districtName} • {appeal.locationText ?? "Локация не указана"}
                </Text>
                <Text className="mt-2 text-xs" style={{ color: colors.muted }}>
                  {formatDateTime(appeal.createdAt)}
                </Text>
              </Pressable>
            </Link>
          ))
        ) : (
          <Text className="text-sm" style={{ color: colors.muted }}>
            Обращения пока не поступали.
          </Text>
        )}
      </View>
    </View>
  );
};
