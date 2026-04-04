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
  compact?: boolean;
}

export const PageHeader = ({
  title,
  subtitle,
  actions = [],
  compact = false,
}: PageHeaderProps) => {
  const { colors } = useAppTheme();

  return (
    <FadeInView>
      <View className={`${compact ? "mb-4" : "mb-5"} flex-row flex-wrap items-start justify-between gap-4`}>
        <View className="max-w-2xl">
          <Text
            className={`${compact ? "text-[24px]" : "text-[28px]"} font-bold tracking-tight`}
            style={{ color: colors.text }}
          >
            {title}
          </Text>
          <Text
            className={`${compact ? "mt-1.5 text-[13px] leading-5" : "mt-2 text-sm leading-6"}`}
            style={{ color: colors.muted }}
          >
            {subtitle}
          </Text>
        </View>

        {actions.length ? (
          <View className="flex-row flex-wrap gap-2">
            {actions.map((action) => (
              <Pressable
                key={action.label}
                onPress={action.onPress}
                className={`rounded-full ${compact ? "px-3.5 py-2.5" : "px-4 py-3"}`}
                style={{
                  backgroundColor: action.primary ? colors.primary : colors.surfaceAlt,
                  borderWidth: action.primary ? 0 : 1,
                  borderColor: action.primary ? "transparent" : colors.border
                }}
              >
                <Text
                  className={`${compact ? "text-[13px]" : "text-sm"} font-semibold`}
                  style={{ color: action.primary ? "#FFFFFF" : colors.text }}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </FadeInView>
  );
};
