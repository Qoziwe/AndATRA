import { Text, View } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

export const SummaryBlock = ({
  title = "AI-интерпретация",
  paragraphs,
  highlights
}: {
  title?: string;
  paragraphs: string[];
  highlights?: string[];
}) => {
  const { colors } = useAppTheme();

  return (
    <View
      className="rounded-[30px] border p-5"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <Text className="text-xl font-semibold" style={{ color: colors.text }}>
        {title}
      </Text>
      <View className="mt-4 gap-3">
        {paragraphs.map((paragraph) => (
          <Text key={paragraph} className="text-sm leading-7" style={{ color: colors.textSecondary }}>
            {paragraph}
          </Text>
        ))}
      </View>
      {highlights?.length ? (
        <View className="mt-5 flex-row flex-wrap gap-2">
          {highlights.map((item) => (
            <Text
              key={item}
              className="rounded-full px-3 py-2 text-xs"
              style={{ backgroundColor: colors.primarySoft, color: colors.primary }}
            >
              {item}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
};
