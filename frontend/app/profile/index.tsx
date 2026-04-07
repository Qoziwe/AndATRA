import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";

import { FadeInView } from "@/components/common/FadeInView";
import { PageHeader } from "@/components/common/PageHeader";
import { AppIcon } from "@/components/icons/AppIcon";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";

export default function ProfilePage() {
  const { colors, isDark } = useAppTheme();
  const realtimeStatus = useUiStore((state) => state.realtimeStatus);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const authUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const initials = (authUser?.display_name?.trim()?.[0] ?? authUser?.username?.trim()?.[0] ?? "A").toUpperCase();

  return (
    <View>
      <PageHeader
        title="Мой профиль"
        subtitle="Личные настройки и быстрый доступ к ключевым разделам"
      />

      <View className="flex-row flex-wrap gap-4">
        <FadeInView delay={50} style={{ minWidth: 320, flex: 1.1 }}>
          <View
            className="rounded-[30px] border p-6"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <View className="flex-row items-center gap-4">
              <View
                className="h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.primarySoft }}
              >
                <Text className="text-xl font-bold" style={{ color: colors.primary }}>
                  {initials}
                </Text>
              </View>
              <View>
                <Text className="text-2xl font-semibold" style={{ color: colors.text }}>
                  {authUser?.display_name ?? "Оператор AndATRA"}
                </Text>
                <Text className="mt-1 text-sm" style={{ color: colors.muted }}>
                  {authUser?.username ?? "andatra"}
                </Text>
              </View>
            </View>

            <View className="mt-6 gap-3">
              <View
                className="rounded-[22px] border px-4 py-4"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <Text className="text-xs uppercase tracking-[2px]" style={{ color: colors.muted }}>
                  Тема
                </Text>
                <Text className="mt-2 text-base font-semibold" style={{ color: colors.text }}>
                  {isDark ? "Темная" : "Светлая"} по умолчанию
                </Text>
              </View>
              <View
                className="rounded-[22px] border px-4 py-4"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <Text className="text-xs uppercase tracking-[2px]" style={{ color: colors.muted }}>
                  Роль
                </Text>
                <Text className="mt-2 text-base font-semibold" style={{ color: colors.text }}>
                  {authUser?.role === "operator" ? "Оператор" : "Пользователь"}
                </Text>
              </View>
              <View
                className="rounded-[22px] border px-4 py-4"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <Text className="text-xs uppercase tracking-[2px]" style={{ color: colors.muted }}>
                  Статус
                </Text>
                <Text className="mt-2 text-base font-semibold" style={{ color: colors.text }}>
                  {realtimeStatus === "live"
                    ? "Система онлайн"
                    : realtimeStatus === "reconnecting"
                      ? "Идет переподключение"
                      : "Система офлайн"}
                </Text>
              </View>
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={90} style={{ minWidth: 320, flex: 0.9 }}>
          <View
            className="rounded-[30px] border p-6"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <Text className="text-lg font-semibold" style={{ color: colors.text }}>
              Быстрые действия
            </Text>

            <View className="mt-5 gap-3">
              <Pressable
                onPress={toggleTheme}
                className="flex-row items-center justify-between rounded-[22px] border px-4 py-4"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <View className="flex-row items-center gap-3">
                  <AppIcon name={isDark ? "sun" : "moon"} color={colors.primary} />
                  <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                    {isDark ? "Включить светлую тему" : "Включить темную тему"}
                  </Text>
                </View>
                <AppIcon name="chevronRight" color={colors.muted} />
              </Pressable>

              <Pressable
                onPress={() => router.push("/chat")}
                className="flex-row items-center justify-between rounded-[22px] border px-4 py-4"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <View className="flex-row items-center gap-3">
                  <AppIcon name="chat" color={colors.primary} />
                  <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                    Открыть ИИ-ассистент
                  </Text>
                </View>
                <AppIcon name="chevronRight" color={colors.muted} />
              </Pressable>

              <Pressable
                onPress={() => router.push("/reports")}
                className="flex-row items-center justify-between rounded-[22px] border px-4 py-4"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <View className="flex-row items-center gap-3">
                  <AppIcon name="reports" color={colors.primary} />
                  <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                    Перейти к отчетам
                  </Text>
                </View>
                <AppIcon name="chevronRight" color={colors.muted} />
              </Pressable>

              <Pressable
                onPress={() => {
                  logout();
                  router.replace("/auth/login" as never);
                }}
                className="flex-row items-center justify-between rounded-[22px] border px-4 py-4"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <View className="flex-row items-center gap-3">
                  <AppIcon name="close" color={colors.primary} />
                  <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                    Выйти из аккаунта
                  </Text>
                </View>
                <AppIcon name="chevronRight" color={colors.muted} />
              </Pressable>
            </View>
          </View>
        </FadeInView>
      </View>
    </View>
  );
}
