import { Text, View } from "react-native";
import { AppIcon } from "@/components/icons/AppIcon";
import { useAppTheme } from "@/hooks/useAppTheme";

export const AlertBanner = ({ count }: { count: number }) => {
  const { colors } = useAppTheme();

  return (
    <View
      className="mb-6 rounded-[28px] border px-5 py-4"
      style={{ backgroundColor: "rgba(214, 69, 69, 0.12)", borderColor: colors.danger }}
    >
      <View className="flex-row items-center gap-3">
        <AppIcon name="bell" color={colors.danger} />
        <Text className="text-base font-semibold" style={{ color: colors.text }}>
          Критические обращения: {count}
        </Text>
      </View>
      <Text className="mt-2 text-sm leading-6" style={{ color: colors.textSecondary }}>
        Есть новые критические кейсы, требующие немедленной маршрутизации.
      </Text>
    </View>
  );
};
