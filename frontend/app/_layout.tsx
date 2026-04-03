import "@/global.css";
import { useEffect } from "react";
import { Slot } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Platform, Text, TextInput } from "react-native";
import { StatusBar } from "expo-status-bar";
import { AppShell } from "@/components/layout/AppShell";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useRealtime } from "@/hooks/useRealtime";
import { useUiStore } from "@/stores/uiStore";

const queryClient = new QueryClient();

const RealtimeBridge = () => {
  useRealtime();
  return null;
};

const ThemeBridge = () => {
  const { isDark } = useAppTheme();
  const theme = useUiStore((state) => state.theme);

  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.body.dataset.theme = theme;
    }

    const fontFamily =
      Platform.OS === "web"
        ? "Montserrat, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        : "sans-serif";

    const textComponent = Text as typeof Text & {
      defaultProps?: { style?: unknown };
    };
    const textInputComponent = TextInput as typeof TextInput & {
      defaultProps?: { style?: unknown };
    };

    textComponent.defaultProps = {
      ...textComponent.defaultProps,
      style: [{ fontFamily }, textComponent.defaultProps?.style].filter(Boolean)
    };

    textInputComponent.defaultProps = {
      ...textInputComponent.defaultProps,
      style: [{ fontFamily }, textInputComponent.defaultProps?.style].filter(Boolean)
    };
  }, [theme]);

  return <StatusBar style={isDark ? "light" : "dark"} />;
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <RealtimeBridge />
          <ThemeBridge />
          <AppShell>
            <Slot />
          </AppShell>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
