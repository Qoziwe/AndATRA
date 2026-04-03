import { useEffect } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router, usePathname } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { FadeInView } from "@/components/common/FadeInView";
import { AppIcon } from "@/components/icons/AppIcon";
import { useAppTheme } from "@/hooks/useAppTheme";
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
    subtitle: "Тренды, районы и ключевые показатели на русском языке"
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
    subtitle: "Современный чат-интерфейс для диалога с данными и сводками"
  },
  "/reports": {
    title: "Отчеты",
    subtitle: "Подготовка управленческих отчетов с экспортом в PDF и TXT"
  }
};

export const Header = () => {
  const pathname = usePathname();
  const queryClient = useQueryClient();
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
  const pushToast = useFeedbackStore((state) => state.pushToast);
  const { colors, isDark } = useAppTheme();

  useEffect(() => {
    closeProfileMenu();
  }, [closeProfileMenu, pathname]);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries();
    pushToast({
      title: "Данные обновлены",
      description: "Кэш запросов очищен и загружен заново."
    });
  };

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

  return (
    <FadeInView>
      <View
        className="mb-6 rounded-[32px] border px-5 py-4"
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
          zIndex: profileMenuOpen ? 160 : 10
        }}
      >
        <View className="flex-row flex-wrap items-center justify-between gap-4">
          <View>
            <Text className="text-2xl font-bold" style={{ color: colors.text }}>
              {pageMeta.title}
            </Text>
            <Text
              className="mt-1 max-w-2xl text-sm leading-6"
              style={{ color: colors.muted }}
            >
              {pageMeta.subtitle}
            </Text>
          </View>

          <View className="min-w-[320px] flex-1 flex-row flex-wrap items-center justify-end gap-3">
            <View
              className="min-w-[280px] flex-1 flex-row items-center gap-3 rounded-full border px-4 py-3"
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
              onPress={handleRefresh}
              className="h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.primarySoft }}
            >
              <AppIcon name="refresh" color={colors.primary} />
            </Pressable>

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
              <AppIcon
                name={isDark ? "sun" : "moon"}
                color={colors.text}
                size={18}
              />
            </Pressable>

            <View
              className="rounded-full px-3 py-2"
              style={{
                backgroundColor:
                  realtimeStatus === "live"
                    ? "rgba(34, 197, 94, 0.15)"
                    : realtimeStatus === "reconnecting"
                      ? "rgba(245, 158, 11, 0.18)"
                      : "rgba(239, 68, 68, 0.18)"
              }}
            >
              <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                {realtimeStatus === "live"
                  ? "Онлайн"
                  : realtimeStatus === "reconnecting"
                    ? "Задержка"
                    : "Офлайн"}
              </Text>
            </View>

            <View className="relative" style={{ zIndex: profileMenuOpen ? 220 : 1 }}>
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
                    АА
                  </Text>
                </View>
                <View>
                  <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                    Аналитик
                  </Text>
                  <Text className="text-xs" style={{ color: colors.muted }}>
                    Акимат
                  </Text>
                </View>
                <AppIcon name="chevronDown" size={18} color={colors.muted} />
              </Pressable>

              {profileMenuOpen ? (
                <View
                  className="absolute right-0 top-[60px] z-50 w-[220px] rounded-[24px] border p-2"
                  style={{
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    shadowColor: colors.shadow,
                    shadowOpacity: 1,
                    shadowRadius: 18,
                    shadowOffset: { width: 0, height: 12 },
                    elevation: 10,
                    zIndex: 260
                  }}
                >
                  <Pressable
                    onPress={() => {
                      closeProfileMenu();
                      pushToast({
                        title: "Профиль открыт",
                        description: "Раздел профиля доступен из этого меню."
                      });
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
                  <Pressable
                    onPress={() => {
                      closeProfileMenu();
                      router.push("/reports");
                    }}
                    className="rounded-2xl px-4 py-3"
                  >
                    <Text className="text-sm" style={{ color: colors.text }}>
                      Открыть отчеты
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
