import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { AppIcon } from "@/components/icons/AppIcon";
import { useAppTheme } from "@/hooks/useAppTheme";

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps {
  label: string;
  value?: string;
  placeholder: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  minWidthClassName?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export const SelectField = ({
  label,
  value,
  placeholder,
  options,
  onChange,
  minWidthClassName = "min-w-[220px]",
  isOpen,
  onToggle
}: SelectFieldProps) => {
  const { colors } = useAppTheme();
  const [innerOpen, setInnerOpen] = useState(false);
  const open = isOpen ?? innerOpen;

  const handleOpenChange = (nextOpen: boolean) => {
    if (onToggle) {
      if (nextOpen !== open) {
        onToggle();
      }
      return;
    }

    setInnerOpen(nextOpen);
  };

  const selectedLabel = useMemo(
    () => options.find((item) => item.value === value)?.label,
    [options, value]
  );

  return (
    <View className={`${minWidthClassName} flex-1`} style={{ zIndex: open ? 80 : 1 }}>
      <Text className="mb-2 text-xs font-semibold uppercase tracking-[1.6px]" style={{ color: colors.muted }}>
        {label}
      </Text>
      <View className="relative" style={{ zIndex: open ? 80 : 1 }}>
        <Pressable
          onPress={() => handleOpenChange(!open)}
          className="rounded-[22px] border px-4 py-3"
          style={{
            backgroundColor: colors.surfaceAlt,
            borderColor: open ? colors.primary : colors.border
          }}
        >
          <View className="flex-row items-center justify-between gap-3">
            <Text
              className="flex-1 text-sm"
              numberOfLines={1}
              style={{ color: selectedLabel ? colors.text : colors.muted }}
            >
              {selectedLabel ?? placeholder}
            </Text>
            <AppIcon name="chevronDown" color={colors.textSecondary} size={18} />
          </View>
        </Pressable>

        {open ? (
          <View
            className="absolute left-0 right-0 top-[66px] z-50 rounded-[22px] border p-2"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: colors.shadow,
              shadowOpacity: 1,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 12 },
              elevation: 8
            }}
          >
            <ScrollView nestedScrollEnabled style={{ maxHeight: 220 }}>
              {[{ label: placeholder, value: "" }, ...options].map((option) => {
                const active = (value ?? "") === option.value;

                return (
                  <Pressable
                    key={`${label}-${option.value || "empty"}`}
                    onPress={() => {
                      onChange(option.value);
                      handleOpenChange(false);
                    }}
                    className="rounded-2xl px-4 py-3"
                    style={{
                      backgroundColor: active ? colors.primarySoft : "transparent"
                    }}
                  >
                    <Text
                      className="text-sm"
                      style={{ color: active ? colors.primary : colors.text }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </View>
    </View>
  );
};
