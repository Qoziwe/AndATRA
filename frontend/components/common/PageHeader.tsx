import { Pressable, Text, View } from "react-native";
import { FadeInView } from "@/components/common/FadeInView";
import { useAppTheme } from "@/hooks/useAppTheme";

interface HeaderAction {
  label: string;
  onPress?: () => void;
  primary?: boolean;
}

interface PageHeaderProps {
  title: string;
  subtitle: string;
  actions?: HeaderAction[];
}

export const PageHeader = ({ title, subtitle, actions = [] }: PageHeaderProps) => {
  const { colors } = useAppTheme();

  return (
    <FadeInView>
      <View className="mb-6 flex-row flex-wrap items-start justify-between gap-4">
        <View className="max-w-3xl">
          <Text className="text-3xl font-bold tracking-tight" style={{ color: colors.text }}>
            {title}
          </Text>
          <Text className="mt-2 text-sm leading-6" style={{ color: colors.muted }}>
            {subtitle}
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-3">
          {actions.map((action) => (
            <Pressable
              key={action.label}
              onPress={action.onPress}
              className="rounded-full px-4 py-3"
              style={{
                backgroundColor: action.primary ? colors.primary : colors.surfaceAlt,
                borderWidth: action.primary ? 0 : 1,
                borderColor: action.primary ? "transparent" : colors.border
              }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: action.primary ? "#FFFFFF" : colors.text }}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </FadeInView>
  );
};
