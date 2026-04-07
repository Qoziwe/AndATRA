import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { APP_NAME } from "@/constants/config";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuthStore } from "@/stores/authStore";

export default function LoginPage() {
  const { colors } = useAppTheme();
  const login = useAuthStore((state) => state.login);
  const isAuthenticating = useAuthStore((state) => state.isAuthenticating);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    try {
      await login(username, password);
      router.replace("/" as never);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Не удалось войти в систему."
      );
    }
  };

  return (
    <View
      className="min-h-screen flex-1 items-center justify-center px-5"
      style={{ backgroundColor: colors.background }}
    >
      <View
        className="w-full max-w-[460px] rounded-[32px] border p-7"
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
      >
        <View
          className="mb-5 h-14 w-14 items-center justify-center rounded-[20px]"
          style={{ backgroundColor: colors.primarySoft }}
        >
          <Text className="text-xl font-bold" style={{ color: colors.primary }}>
            A
          </Text>
        </View>

        <Text className="text-3xl font-bold" style={{ color: colors.text }}>
          Вход в {APP_NAME}
        </Text>
        <Text className="mt-3 text-sm leading-6" style={{ color: colors.muted }}>
          Один служебный аккаунт управляет доступом ко всем разделам платформы.
        </Text>

        <View className="mt-6 gap-4">
          <View>
            <Text className="mb-2 text-sm font-semibold" style={{ color: colors.text }}>
              Логин
            </Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isAuthenticating}
              onChangeText={setUsername}
              placeholder="Введите логин"
              placeholderTextColor={colors.muted}
              value={username}
              className="rounded-[20px] border px-4 py-3 text-sm"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text
              }}
            />
          </View>

          <View>
            <Text className="mb-2 text-sm font-semibold" style={{ color: colors.text }}>
              Пароль
            </Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isAuthenticating}
              onChangeText={setPassword}
              onSubmitEditing={() => {
                void handleSubmit();
              }}
              placeholder="Введите пароль"
              placeholderTextColor={colors.muted}
              secureTextEntry
              value={password}
              className="rounded-[20px] border px-4 py-3 text-sm"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text
              }}
            />
          </View>
        </View>

        {error ? (
          <View
            className="mt-5 rounded-[20px] border px-4 py-3"
            style={{ backgroundColor: "rgba(239, 68, 68, 0.08)", borderColor: "rgba(239, 68, 68, 0.18)" }}
          >
            <Text className="text-sm" style={{ color: colors.text }}>
              {error}
            </Text>
          </View>
        ) : null}

        <Pressable
          disabled={isAuthenticating}
          onPress={() => {
            void handleSubmit();
          }}
          className="mt-6 rounded-full px-5 py-4 items-center"
          style={{ backgroundColor: colors.primary, opacity: isAuthenticating ? 0.7 : 1 }}
        >
          <Text className="text-sm font-semibold text-white">
            {isAuthenticating ? "Входим..." : "Войти"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
