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
  { href: "/air-quality", label: "Карта воздуха", icon: "leaf" as const },
  { href: "/traffic-ai", label: "ИИ-пробки", icon: "trafficLight" as const },
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
      className={`border-r px-4 py-6 ${collapsed ? "w-[88px]" : "w-[248px]"}`}
      style={{ backgroundColor: colors.panel, borderColor: colors.border }}
    >
      <FadeInView delay={40}>
        <View className="mb-6">
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
            <Text className="mt-1 text-xs uppercase tracking-[2px]" style={{ color: colors.muted }}>
              Городская платформа
            </Text>
          ) : null}
        </View>
      </FadeInView>

      <View className="gap-1.5">
        {items.map((item, index) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <FadeInView key={item.href} delay={90 + index * 35}>
              <Link href={item.href as never} asChild>
                <Pressable
                  className="flex-row items-center gap-3 rounded-[20px] px-3 py-2.5"
                  style={{
                    backgroundColor: active ? colors.primarySoft : "transparent",
                    borderWidth: active ? 1 : 0,
                    borderColor: active ? colors.border : "transparent"
                  }}
                >
                  <View
                    className="h-9 w-9 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: active ? colors.primary : colors.surfaceAlt }}
                  >
                    <AppIcon
                      name={item.icon}
                      size={18}
                      color={active ? "#FFFFFF" : colors.textSecondary}
                    />
                  </View>
                  {!collapsed ? (
                    <Text className="flex-1 text-sm font-semibold" style={{ color: colors.text }}>
                      {item.label}
                    </Text>
                  ) : null}
                </Pressable>
              </Link>
            </FadeInView>
          );
        })}
      </View>

      <FadeInView delay={320} style={{ marginTop: "auto" }}>
        <View
          className="rounded-[24px] border px-4 py-3.5"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          {!collapsed ? (
            <View
              className="mb-3 self-start rounded-full px-3 py-1.5"
              style={{
                backgroundColor:
                  realtimeStatus === "live"
                    ? "rgba(34, 197, 94, 0.12)"
                    : realtimeStatus === "reconnecting"
                      ? "rgba(245, 158, 11, 0.12)"
                      : "rgba(239, 68, 68, 0.12)"
              }}
            >
              <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                {realtimeStatus === "live"
                  ? "Система онлайн"
                  : realtimeStatus === "reconnecting"
                    ? "Идет переподключение"
                    : "Система офлайн"}
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={toggleSidebar}
            className="flex-row items-center justify-center gap-2 rounded-full px-3 py-2.5"
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
