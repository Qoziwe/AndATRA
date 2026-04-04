import { PropsWithChildren } from "react";
import { ScrollView, View, Platform, useWindowDimensions } from "react-native";
import { usePathname } from "expo-router";
import { ToastViewport } from "@/components/common/ToastViewport";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAppTheme } from "@/hooks/useAppTheme";

export const AppShell = ({ children }: PropsWithChildren) => {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const disablePageScroll =
    Platform.OS === "web" &&
    ((pathname.startsWith("/chat") && width >= 960) ||
      (pathname.startsWith("/traffic-ai") && width >= 1100));

  return (
    <View className="min-h-screen flex-1 flex-row" style={{ backgroundColor: colors.background }}>
      <View
        className="absolute -left-24 top-10 h-72 w-72 rounded-full"
        style={{ backgroundColor: colors.primary, opacity: 0.05 }}
      />
      <View
        className="absolute right-10 top-28 h-56 w-56 rounded-full"
        style={{ backgroundColor: colors.success, opacity: 0.04 }}
      />
      <ToastViewport />
      <Sidebar />
      <View className="min-h-0 flex-1 px-4 py-4 md:px-6 md:py-6" style={{ overflow: "visible" }}>
        <Header />
        {disablePageScroll ? (
          <View className="min-h-0 flex-1" style={{ overflow: "visible" }}>
            {children}
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 56, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        )}
      </View>
    </View>
  );
};
