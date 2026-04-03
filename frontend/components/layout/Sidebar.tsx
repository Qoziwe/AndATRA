import { Pressable, Text, View } from "react-native";
import { Link, usePathname } from "expo-router";
import { FadeInView } from "@/components/common/FadeInView";
import { AppIcon } from "@/components/icons/AppIcon";
import { useAppTheme } from "@/hooks/useAppTheme";
import { APP_NAME } from "@/constants/config";
import { useUiStore } from "@/stores/uiStore";

const items = [
  { href: "/", label: "Дашборд", icon: "home" as const },
  { href: "/appeals", label: "Обращения", icon: "appeals" as const },
  { href: "/analytics", label: "Аналитика", icon: "analytics" as const },
  { href: "/map", label: "Карта города", icon: "map" as const },
  { href: "/categories", label: "Категории", icon: "categories" as const },
  { href: "/chat", label: "ИИ-ассистент", icon: "chat" as const },
  { href: "/reports", label: "Отчеты", icon: "reports" as const }
];

export const Sidebar = () => {
  const pathname = usePathname();
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const realtimeStatus = useUiStore((state) => state.realtimeStatus);
  const { colors } = useAppTheme();

  return (
    <View
      className={`border-r px-4 py-6 ${collapsed ? "w-[88px]" : "w-[280px]"}`}
      style={{ backgroundColor: colors.panel, borderColor: colors.border }}
    >
      <FadeInView delay={40}>
        <View className="mb-8">
          <View
            className="mb-3 h-12 w-12 items-center justify-center rounded-2xl"
            style={{ backgroundColor: colors.primarySoft }}
          >
            <AppIcon name="spark" size={22} color={colors.primary} />
          </View>
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            {collapsed ? "A" : APP_NAME}
          </Text>
          {!collapsed ? (
            <Text
              className="mt-1 text-xs uppercase tracking-[2px]"
              style={{ color: colors.muted }}
            >
              Платформа городских обращений
            </Text>
          ) : null}
        </View>
      </FadeInView>

      <View className="gap-2">
        {items.map((item, index) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <FadeInView key={item.href} delay={90 + index * 35}>
              <Link href={item.href as never} asChild>
                <Pressable
                  className="flex-row items-center gap-3 rounded-[22px] px-3 py-3"
                  style={{
                    backgroundColor: active ? colors.primarySoft : "transparent",
                    borderWidth: active ? 1 : 0,
                    borderColor: active ? colors.border : "transparent"
                  }}
                >
                  <View
                    className="h-10 w-10 items-center justify-center rounded-2xl"
                    style={{
                      backgroundColor: active ? colors.primary : colors.surfaceAlt
                    }}
                  >
                    <AppIcon
                      name={item.icon}
                      size={18}
                      color={active ? "#FFFFFF" : colors.textSecondary}
                    />
                  </View>
                  {!collapsed ? (
                    <View className="flex-1">
                      <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                        {item.label}
                      </Text>
                      <Text className="mt-1 text-xs" style={{ color: colors.muted }}>
                        {item.href === "/"
                          ? "Оперативная лента"
                          : item.href === "/appeals"
                            ? "Реестр кейсов"
                            : item.href === "/analytics"
                              ? "Тренды и районы"
                              : item.href === "/map"
                                ? "Геообзор"
                                : item.href === "/categories"
                                  ? "Справочник"
                                  : item.href === "/chat"
                                    ? "Диалоговый режим"
                                    : "PDF и TXT"}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              </Link>
            </FadeInView>
          );
        })}
      </View>

      <FadeInView delay={320} style={{ marginTop: "auto" }}>
        <View
          className="rounded-[28px] border px-4 py-4"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          {!collapsed ? (
            <>
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                Системный статус
              </Text>
              <Text className="mt-2 text-xs" style={{ color: colors.muted }}>
                API: {realtimeStatus === "offline" ? "недоступно" : "онлайн"}
              </Text>
              <Text className="mt-1 text-xs" style={{ color: colors.muted }}>
                WS:{" "}
                {realtimeStatus === "live"
                  ? "подключено"
                  : realtimeStatus === "reconnecting"
                    ? "переподключение"
                    : "офлайн"}
              </Text>
            </>
          ) : null}

          <Pressable
            onPress={toggleSidebar}
            className="mt-4 flex-row items-center justify-center gap-2 rounded-full px-3 py-3"
            style={{ backgroundColor: colors.surfaceAlt }}
          >
            <AppIcon
              name={collapsed ? "chevronRight" : "chevronLeft"}
              size={16}
              color={colors.text}
            />
            {!collapsed ? (
              <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                Свернуть
              </Text>
            ) : null}
          </Pressable>
        </View>
      </FadeInView>
    </View>
  );
};
