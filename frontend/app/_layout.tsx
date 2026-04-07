import "@/global.css";
import { useEffect } from "react";
import { Slot, router, usePathname, useRootNavigationState } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ActivityIndicator, Platform, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { AppShell } from "@/components/layout/AppShell";
import { useRenderKeepAlive } from "@/hooks/useRenderKeepAlive";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useRealtime } from "@/hooks/useRealtime";
import { loadAuthSession, subscribeToAuthSession } from "@/services/authSession";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";

const queryClient = new QueryClient();

const RealtimeBridge = () => {
  useRealtime();
  return null;
};

const KeepAliveBridge = () => {
  useRenderKeepAlive();
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
  const pathname = usePathname();
  const rootNavigationState = useRootNavigationState();
  const hydrateAuth = useAuthStore((state) => state.hydrate);
  const hydrated = useAuthStore((state) => state.hydrated);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const token = useAuthStore((state) => state.token);
  const { colors } = useAppTheme();

  useEffect(() => {
    void hydrateAuth();
  }, [hydrateAuth]);

  useEffect(() => {
    return subscribeToAuthSession(() => {
      restoreSession(loadAuthSession());
    });
  }, [restoreSession]);

  useEffect(() => {
    if (!rootNavigationState?.key || !hydrated) {
      return;
    }

    const isAuthRoute = pathname.startsWith("/auth");
    if (!token && !isAuthRoute) {
      router.replace("/auth/login" as never);
      return;
    }

    if (token && isAuthRoute) {
      router.replace("/" as never);
    }
  }, [hydrated, pathname, rootNavigationState?.key, token]);

  const isAuthRoute = pathname.startsWith("/auth");
  const isRedirecting =
    hydrated && Boolean(rootNavigationState?.key) && ((!token && !isAuthRoute) || (token && isAuthRoute));
  const shouldMaskContent = !hydrated || isRedirecting;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <RealtimeBridge />
          <KeepAliveBridge />
          <ThemeBridge />
          {isAuthRoute ? (
            <Slot />
          ) : (
            <AppShell>
              <Slot />
            </AppShell>
          )}
          {shouldMaskContent ? (
            <View
              pointerEvents="auto"
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.background
              }}
            >
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : null}
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
