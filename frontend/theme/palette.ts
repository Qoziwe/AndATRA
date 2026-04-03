import type { ThemeMode } from "@/stores/uiStore";

export interface ThemePalette {
  background: string;
  backgroundSecondary: string;
  panel: string;
  surface: string;
  surfaceAlt: string;
  card: string;
  border: string;
  text: string;
  textSecondary: string;
  muted: string;
  primary: string;
  primarySoft: string;
  success: string;
  warning: string;
  danger: string;
  shadow: string;
  overlay: string;
}

export const palettes: Record<ThemeMode, ThemePalette> = {
  light: {
    background: "#F4F7FB",
    backgroundSecondary: "#E6EEFF",
    panel: "#F9FBFF",
    surface: "#FFFFFF",
    surfaceAlt: "#F1F5FB",
    card: "#FFFFFF",
    border: "#D8E1EF",
    text: "#10203A",
    textSecondary: "#314563",
    muted: "#677A96",
    primary: "#2563EB",
    primarySoft: "#E7F0FF",
    success: "#1D8A5D",
    warning: "#C07A12",
    danger: "#D64545",
    shadow: "rgba(37, 99, 235, 0.12)",
    overlay: "rgba(11, 18, 32, 0.56)"
  },
  dark: {
    background: "#08111F",
    backgroundSecondary: "#122743",
    panel: "#0F1C31",
    surface: "#11213A",
    surfaceAlt: "#0C172A",
    card: "#132640",
    border: "#27405F",
    text: "#F8FBFF",
    textSecondary: "#D7E2F1",
    muted: "#8FA5C3",
    primary: "#5A8CFF",
    primarySoft: "#162B4D",
    success: "#2AC987",
    warning: "#F4A63A",
    danger: "#FF6B63",
    shadow: "rgba(2, 8, 23, 0.34)",
    overlay: "rgba(2, 6, 23, 0.72)"
  }
};
