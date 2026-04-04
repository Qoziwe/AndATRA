import { useState } from "react";
import { Image, Modal, Pressable, Text, View } from "react-native";
import { PriorityBadge } from "@/components/appeals/PriorityBadge";
import { StatusBadge } from "@/components/appeals/StatusBadge";
import { AppIcon } from "@/components/icons/AppIcon";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatDateTime } from "@/utils/format";
import type { Appeal, AppealStatus } from "@/types/appeal";

interface AppealDetailProps {
  appeal: Appeal;
  onStatusChange: (status: AppealStatus) => void;
  isStatusUpdating?: boolean;
}

export const AppealDetail = ({
  appeal,
  onStatusChange,
  isStatusUpdating = false
}: AppealDetailProps) => {
  const { colors } = useAppTheme();
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <View className="gap-5">
      <View
        className="rounded-[30px] border p-5"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <View className="flex-row flex-wrap items-start justify-between gap-4">
          <View className="max-w-3xl">
            <Text className="text-xs uppercase tracking-[2px]" style={{ color: colors.muted }}>
              #{appeal.id}
            </Text>
            <Text className="mt-2 text-3xl font-bold" style={{ color: colors.text }}>
              {appeal.title}
            </Text>
          </View>
          <View className="flex-row gap-2">
            <StatusBadge status={appeal.status} />
            <PriorityBadge priority={appeal.priority} />
          </View>
        </View>

        <Text className="mt-5 text-base leading-8" style={{ color: colors.textSecondary }}>
          {appeal.text}
        </Text>

        <View className="mt-5 gap-3">
          <Text className="text-xs font-semibold uppercase tracking-[1.6px]" style={{ color: colors.muted }}>
            Управление статусом
          </Text>
          <View className="flex-row flex-wrap gap-3">
            <Pressable
              disabled={isStatusUpdating || appeal.status === "resolved"}
              onPress={() => onStatusChange("resolved")}
              className="rounded-full px-4 py-3"
              style={{
                backgroundColor: appeal.status === "resolved" ? colors.primary : colors.primarySoft,
                opacity: isStatusUpdating ? 0.6 : 1
              }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: appeal.status === "resolved" ? "#FFFFFF" : colors.primary }}
              >
                {appeal.status === "resolved" ? "Уже решено" : "Отметить как решённое"}
              </Text>
            </Pressable>

            <Pressable
              disabled={isStatusUpdating || appeal.status === "irrelevant"}
              onPress={() => onStatusChange("irrelevant")}
              className="rounded-full px-4 py-3"
              style={{
                backgroundColor: appeal.status === "irrelevant" ? colors.textSecondary : colors.surfaceAlt,
                opacity: isStatusUpdating ? 0.6 : 1
              }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: appeal.status === "irrelevant" ? "#FFFFFF" : colors.text }}
              >
                {appeal.status === "irrelevant" ? "Уже неактуально" : "Отметить как неактуальное"}
              </Text>
            </Pressable>
          </View>
        </View>

        {appeal.photoUrl ? (
          <View className="mt-5">
            <Pressable onPress={() => setPreviewOpen(true)}>
              <Image
                source={{ uri: appeal.photoUrl }}
                className="h-80 w-full rounded-[26px]"
                resizeMode="cover"
              />
            </Pressable>
            <Pressable
              onPress={() => setPreviewOpen(true)}
              className="absolute right-4 top-4 flex-row items-center gap-2 rounded-full px-4 py-3"
              style={{ backgroundColor: colors.overlay }}
            >
              <AppIcon name="expand" size={16} color="#FFFFFF" />
              <Text className="text-sm font-semibold text-white">Во весь экран</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View
        className="rounded-[30px] border p-5"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <Text className="text-xl font-semibold" style={{ color: colors.text }}>
          AI-анализ
        </Text>
        <Text className="mt-3 text-sm leading-7" style={{ color: colors.textSecondary }}>
          {appeal.aiSummary ?? "Сводка по обращению пока не сформирована."}
        </Text>
        {appeal.aiTags.length ? (
          <View className="mt-4 flex-row flex-wrap gap-2">
            {appeal.aiTags.map((tag) => (
              <Text
                key={tag}
                className="rounded-full px-3 py-2 text-xs"
                style={{ backgroundColor: colors.primarySoft, color: colors.primary }}
              >
                {tag}
              </Text>
            ))}
          </View>
        ) : null}
      </View>

      <View
        className="rounded-[30px] border p-5"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <Text className="text-xl font-semibold" style={{ color: colors.text }}>
          Метаданные
        </Text>
        <View className="mt-4 gap-3">
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            Категория: {appeal.categoryName}
          </Text>
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            Район: {appeal.districtName}
          </Text>
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            Адрес: {appeal.locationText ?? "Не указан"}
          </Text>
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            Создано: {formatDateTime(appeal.createdAt)}
          </Text>
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            Обновлено: {appeal.updatedAt ? formatDateTime(appeal.updatedAt) : "Нет обновлений"}
          </Text>
          {appeal.latitude != null && appeal.longitude != null ? (
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              Координаты: {appeal.latitude}, {appeal.longitude}
            </Text>
          ) : null}
        </View>
      </View>

      <Modal visible={previewOpen} transparent animationType="fade" onRequestClose={() => setPreviewOpen(false)}>
        <View
          className="flex-1 items-center justify-center px-6 py-10"
          style={{ backgroundColor: colors.overlay }}
        >
          <Pressable
            onPress={() => setPreviewOpen(false)}
            className="absolute right-6 top-6 h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.16)" }}
          >
            <AppIcon name="close" color="#FFFFFF" />
          </Pressable>
          {appeal.photoUrl ? (
            <Image
              source={{ uri: appeal.photoUrl }}
              className="h-full w-full rounded-[28px]"
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>
    </View>
  );
};
