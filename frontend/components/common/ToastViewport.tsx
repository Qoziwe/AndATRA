import { useEffect } from "react";
import { Text, View } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useFeedbackStore } from "@/stores/feedbackStore";

export const ToastViewport = () => {
  const toasts = useFeedbackStore((state) => state.toasts);
  const removeToast = useFeedbackStore((state) => state.removeToast);
  const { colors } = useAppTheme();

  useEffect(() => {
    if (!toasts.length) {
      return;
    }

    const timers = toasts.map((toast) => setTimeout(() => removeToast(toast.id), 2600));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [removeToast, toasts]);

  if (!toasts.length) {
    return null;
  }

  return (
    <View className="pointer-events-none absolute right-5 top-5 z-50 gap-3">
      {toasts.map((toast) => (
        <View
          key={toast.id}
          className="max-w-[360px] rounded-[26px] border px-4 py-3"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <Text className="text-sm font-semibold" style={{ color: colors.text }}>
            {toast.title}
          </Text>
          {toast.description ? (
            <Text className="mt-1 text-xs leading-5" style={{ color: colors.textSecondary }}>
              {toast.description}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
};
