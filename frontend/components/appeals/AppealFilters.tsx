import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SelectField } from "@/components/common/SelectField";
import { AppIcon } from "@/components/icons/AppIcon";
import { useAppTheme } from "@/hooks/useAppTheme";
import type {
  AppealFilters as AppealFiltersType,
  Category,
  District
} from "@/types/appeal";

interface AppealFiltersProps {
  value: AppealFiltersType;
  onChange: (value: AppealFiltersType) => void;
  categories: Category[];
  districts: District[];
}

const statusOptions = [
  { label: "Новый", value: "new" },
  { label: "В работе", value: "processing" },
  { label: "Решен", value: "resolved" },
  { label: "Отклонен", value: "rejected" },
  { label: "Неактуально", value: "irrelevant" }
];

const priorityOptions = [
  { label: "Низкий", value: "low" },
  { label: "Средний", value: "medium" },
  { label: "Высокий", value: "high" },
  { label: "Критический", value: "critical" }
];

export const AppealFilters = ({
  value,
  onChange,
  categories,
  districts
}: AppealFiltersProps) => {
  const { colors } = useAppTheme();
  const [openField, setOpenField] = useState<string | null>(null);
  const activeCount = [
    value.search,
    value.category,
    value.district,
    value.status,
    value.priority
  ].filter(Boolean).length;

  return (
    <View
      className="rounded-[30px] border p-5"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        zIndex: openField ? 120 : 1,
        paddingBottom: openField ? 240 : 20
      }}
    >
      <View className="mb-4 flex-row flex-wrap items-center justify-between gap-3">
        <View className="flex-row items-center gap-3">
          <View
            className="h-11 w-11 items-center justify-center rounded-2xl"
            style={{ backgroundColor: colors.primarySoft }}
          >
            <AppIcon name="filter" color={colors.primary} />
          </View>
          <View>
            <Text className="text-lg font-semibold" style={{ color: colors.text }}>
              Фильтры обращений
            </Text>
            <Text className="text-sm" style={{ color: colors.muted }}>
              {activeCount > 0 ? `Активных фильтров: ${activeCount}` : "Фильтры пока не заданы"}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => onChange({ page: 1, pageSize: value.pageSize ?? 10 })}
          className="rounded-full px-4 py-3"
          style={{ backgroundColor: colors.surfaceAlt }}
        >
          <Text className="text-sm font-semibold" style={{ color: colors.text }}>
            Сбросить
          </Text>
        </Pressable>
      </View>

      <View className="flex-row flex-wrap gap-4" style={{ zIndex: openField ? 120 : 1 }}>
        <View className="min-w-[260px] flex-1">
          <Text className="mb-2 text-xs font-semibold uppercase tracking-[1.6px]" style={{ color: colors.muted }}>
            Поиск
          </Text>
          <View
            className="flex-row items-center gap-3 rounded-[22px] border px-4 py-3"
            style={{ backgroundColor: colors.surfaceAlt, borderColor: colors.border }}
          >
            <AppIcon name="search" color={colors.muted} size={18} />
            <TextInput
              value={value.search}
              onChangeText={(search) => onChange({ ...value, search, page: 1 })}
              placeholder="По тексту, адресу или ID"
              placeholderTextColor={colors.muted}
              className="flex-1 text-sm"
              style={{ color: colors.text }}
            />
          </View>
        </View>

        <SelectField
          label="Категория"
          value={value.category}
          placeholder="Все категории"
          options={categories.map((category) => ({
            label: category.name,
            value: category.slug
          }))}
          onChange={(category) => onChange({ ...value, category, page: 1 })}
          isOpen={openField === "category"}
          onToggle={() => setOpenField((current) => (current === "category" ? null : "category"))}
        />

        <SelectField
          label="Район"
          value={value.district}
          placeholder="Все районы"
          options={districts.map((district) => ({
            label: district.name,
            value: district.slug
          }))}
          onChange={(district) => onChange({ ...value, district, page: 1 })}
          isOpen={openField === "district"}
          onToggle={() => setOpenField((current) => (current === "district" ? null : "district"))}
        />

        <SelectField
          label="Статус"
          value={value.status}
          placeholder="Все статусы"
          options={statusOptions}
          onChange={(status) =>
            onChange({ ...value, status: status as AppealFiltersType["status"], page: 1 })
          }
          minWidthClassName="min-w-[190px]"
          isOpen={openField === "status"}
          onToggle={() => setOpenField((current) => (current === "status" ? null : "status"))}
        />

        <SelectField
          label="Приоритет"
          value={value.priority}
          placeholder="Все приоритеты"
          options={priorityOptions}
          onChange={(priority) =>
            onChange({
              ...value,
              priority: priority as AppealFiltersType["priority"],
              page: 1
            })
          }
          minWidthClassName="min-w-[190px]"
          isOpen={openField === "priority"}
          onToggle={() => setOpenField((current) => (current === "priority" ? null : "priority"))}
        />
      </View>
    </View>
  );
};
