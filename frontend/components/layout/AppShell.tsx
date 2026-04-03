import { PropsWithChildren } from "react";
import { ScrollView, View } from "react-native";
import { ToastViewport } from "@/components/common/ToastViewport";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAppTheme } from "@/hooks/useAppTheme";

export const AppShell = ({ children }: PropsWithChildren) => {
  const { colors } = useAppTheme();

  return (
    <View
      className="min-h-screen flex-1 flex-row overflow-hidden"
      style={{ backgroundColor: colors.background }}
    >
      <View
        className="absolute -left-24 top-10 h-72 w-72 rounded-full"
        style={{ backgroundColor: colors.primary, opacity: 0.1 }}
      />
      <View
        className="absolute right-10 top-28 h-56 w-56 rounded-full"
        style={{ backgroundColor: colors.success, opacity: 0.08 }}
      />
      <ToastViewport />
      <Sidebar />
      <View className="min-h-0 flex-1 px-4 py-4 md:px-6 md:py-6">
        <Header />
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 56, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    </View>
  );
};
