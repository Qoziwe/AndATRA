import { useEffect } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router, usePathname } from "expo-router";

import { FadeInView } from "@/components/common/FadeInView";
import { AppIcon } from "@/components/icons/AppIcon";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuthStore } from "@/stores/authStore";
import { useFeedbackStore } from "@/stores/feedbackStore";
import { useUiStore } from "@/stores/uiStore";

const titles: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Дашборд",
    subtitle: "Оперативная сводка по обращениям, районам и критическим сигналам"
  },
  "/appeals": {
    title: "Обращения",
    subtitle: "Единый реестр кейсов с фильтрами, статусами и быстрым разбором"
  },
  "/analytics": {
    title: "Аналитика",
    subtitle: "Тренды, районы и ключевые показатели в одном спокойном обзоре"
  },
  "/map": {
    title: "Карта города",
    subtitle: "Пространственный обзор районов и всплесков обращений"
  },
  "/categories": {
    title: "Категории",
    subtitle: "Таксономия обращений и маршрутизация проблем по темам"
  },
  "/chat": {
    title: "ИИ-ассистент",
    subtitle: "Диалог с данными и сводками без лишних действий на экране"
  },
  "/reports": {
    title: "Отчеты",
    subtitle: "Подготовка управленческих отчетов и быстрый экспорт"
  },
  "/profile": {
    title: "Мой профиль",
    subtitle: "Личные настройки, статус системы и быстрые переходы"
  },
  "/traffic-ai": {
    title: "ИИ-пробки",
    subtitle: "Мониторинг трафика, рекомендации и диалог по дорожной обстановке"
  },
  "/air-quality": {
    title: "Карта воздуха",
    subtitle: "Сводка качества воздуха и экологической обстановки"
  }
};

export const Header = () => {
  const pathname = usePathname();
  const pageMeta =
    Object.entries(titles).find(([key]) =>
      key === "/" ? pathname === "/" : pathname.startsWith(key)
    )?.[1] ?? titles["/"];
  const search = useUiStore((state) => state.globalSearch);
  const setSearch = useUiStore((state) => state.setGlobalSearch);
  const realtimeStatus = useUiStore((state) => state.realtimeStatus);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const profileMenuOpen = useUiStore((state) => state.profileMenuOpen);
  const toggleProfileMenu = useUiStore((state) => state.toggleProfileMenu);
  const closeProfileMenu = useUiStore((state) => state.closeProfileMenu);
  const authUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const pushToast = useFeedbackStore((state) => state.pushToast);
  const { colors, isDark } = useAppTheme();

  useEffect(() => {
    closeProfileMenu();
  }, [closeProfileMenu, pathname]);

  const handleSearch = () => {
    const value = search.trim();
    if (!value) {
      pushToast({
        title: "Введите запрос",
        description: "Поиск открывает раздел обращений и переносит к результатам."
      });
      return;
    }

    router.push({ pathname: "/appeals", params: { search: value } });
    pushToast({
      title: "Поиск выполнен",
      description: `Запрос: ${value}`
    });
  };

  const statusColor =
    realtimeStatus === "live"
      ? "rgba(34, 197, 94, 0.12)"
      : realtimeStatus === "reconnecting"
        ? "rgba(245, 158, 11, 0.14)"
        : "rgba(239, 68, 68, 0.12)";

  const initials = (authUser?.display_name?.trim()?.[0] ?? authUser?.username?.trim()?.[0] ?? "A").toUpperCase();

  const handleLogout = () => {
    logout();
    closeProfileMenu();
    pushToast({
      title: "Сессия завершена",
      description: "Для продолжения работы выполните вход снова."
    });
    router.replace("/auth/login" as never);
  };

  return (
    <FadeInView>
      <View
        className="mb-6 rounded-[30px] border px-5 py-4"
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
          zIndex: profileMenuOpen ? 500 : 20,
          elevation: profileMenuOpen ? 20 : 0
        }}
      >
        <View className="flex-row flex-wrap items-center justify-between gap-4">
          <View className="max-w-2xl">
            <View className="flex-row flex-wrap items-center gap-3">
              <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                {pageMeta.title}
              </Text>
              <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: statusColor }}>
                <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                  {realtimeStatus === "live"
                    ? "Онлайн"
                    : realtimeStatus === "reconnecting"
                      ? "Задержка"
                      : "Офлайн"}
                </Text>
              </View>
            </View>
            <Text className="mt-1 max-w-2xl text-sm leading-6" style={{ color: colors.muted }}>
              {pageMeta.subtitle}
            </Text>
          </View>

          <View className="min-w-[320px] flex-1 flex-row flex-wrap items-center justify-end gap-3">
            <View
              className="min-w-[260px] flex-1 flex-row items-center gap-3 rounded-full border px-4 py-3"
              style={{ backgroundColor: colors.surfaceAlt, borderColor: colors.border }}
            >
              <AppIcon name="search" size={18} color={colors.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={handleSearch}
                placeholder="Искать обращения, адреса, категории..."
                placeholderTextColor={colors.muted}
                className="flex-1 text-sm"
                style={{ color: colors.text }}
              />
            </View>

            <Pressable
              onPress={handleSearch}
              className="rounded-full px-4 py-3"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-sm font-semibold text-white">Найти</Text>
            </Pressable>

            <Pressable
              onPress={toggleTheme}
              className="h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.surfaceAlt }}
            >
              <AppIcon name={isDark ? "sun" : "moon"} color={colors.text} size={18} />
            </Pressable>

            <View
              className="relative"
              style={{ zIndex: profileMenuOpen ? 900 : 30, elevation: profileMenuOpen ? 24 : 0 }}
            >
              <Pressable
                onPress={toggleProfileMenu}
                className="flex-row items-center gap-3 rounded-full border px-3 py-2"
                style={{ backgroundColor: colors.surfaceAlt, borderColor: colors.border }}
              >
                <View
                  className="h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: colors.primarySoft }}
                >
                  <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                    {initials}
                  </Text>
                </View>
                <View>
                  <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                    {authUser?.display_name ?? "Оператор"}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.muted }}>
                    {authUser?.username ?? "andatra"}
                  </Text>
                </View>
                <AppIcon name="chevronDown" size={18} color={colors.muted} />
              </Pressable>

              {profileMenuOpen ? (
                <View
                  className="absolute right-0 top-[60px] w-[220px] rounded-[24px] border p-2"
                  style={{
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    shadowColor: colors.shadow,
                    shadowOpacity: 1,
                    shadowRadius: 18,
                    shadowOffset: { width: 0, height: 12 },
                    elevation: 30,
                    zIndex: 9999
                  }}
                >
                  <Pressable
                    onPress={() => {
                      closeProfileMenu();
                      router.push("/profile");
                    }}
                    className="rounded-2xl px-4 py-3"
                  >
                    <Text className="text-sm" style={{ color: colors.text }}>
                      Мой профиль
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      toggleTheme();
                      closeProfileMenu();
                    }}
                    className="rounded-2xl px-4 py-3"
                  >
                    <Text className="text-sm" style={{ color: colors.text }}>
                      {isDark ? "Включить светлую тему" : "Включить темную тему"}
                    </Text>
                  </Pressable>
                  <Pressable onPress={handleLogout} className="rounded-2xl px-4 py-3">
                    <Text className="text-sm" style={{ color: colors.text }}>
                      Выйти
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </FadeInView>
  );
};
