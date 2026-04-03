import { Text, View } from "react-native";
import { AppIcon } from "@/components/icons/AppIcon";
import { useAppTheme } from "@/hooks/useAppTheme";

export const AlertBanner = ({ count }: { count: number }) => {
  const { colors } = useAppTheme();

  return (
    <View
      className="mb-5 rounded-[24px] border px-4 py-4"
      style={{ backgroundColor: "rgba(214, 69, 69, 0.08)", borderColor: colors.danger }}
    >
      <View className="flex-row items-center gap-3">
        <AppIcon name="bell" color={colors.danger} />
        <Text className="text-sm font-semibold" style={{ color: colors.text }}>
          Новые критические обращения: {count}
        </Text>
      </View>
      <Text className="mt-2 text-sm leading-6" style={{ color: colors.textSecondary }}>
        Есть кейсы, требующие немедленной маршрутизации.
      </Text>
    </View>
  );
};
