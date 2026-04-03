import Svg, { Circle, Path, Rect } from "react-native-svg";

type IconName =
  | "home"
  | "appeals"
  | "analytics"
  | "map"
  | "categories"
  | "chat"
  | "reports"
  | "search"
  | "refresh"
  | "sun"
  | "moon"
  | "chevronDown"
  | "chevronLeft"
  | "chevronRight"
  | "user"
  | "file"
  | "download"
  | "camera"
  | "expand"
  | "filter"
  | "send"
  | "spark"
  | "close"
  | "menu"
  | "bell"
  | "leaf"
  | "shield"
  | "droplet"
  | "wind"
  | "heartPulse"
  | "road"
  | "bolt"
  | "trafficLight";

interface AppIconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const strokeProps = (color: string, strokeWidth: number) => ({
  stroke: color,
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none"
});

export const AppIcon = ({
  name,
  size = 20,
  color = "currentColor",
  strokeWidth = 1.8
}: AppIconProps) => {
  const stroke = strokeProps(color, strokeWidth);

  switch (name) {
    case "home":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M4 10.5 12 4l8 6.5" {...stroke} />
          <Path d="M6.5 9.5V20h11V9.5" {...stroke} />
          <Path d="M10 20v-5h4v5" {...stroke} />
        </Svg>
      );
    case "appeals":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="5" y="4" width="14" height="16" rx="3" {...stroke} />
          <Path d="M9 9h6M9 13h6M9 17h4" {...stroke} />
        </Svg>
      );
    case "analytics":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M5 19V6" {...stroke} />
          <Path d="M5 19h14" {...stroke} />
          <Path d="M8.5 15.5 11 12l3 2.5 4-6" {...stroke} />
          <Circle cx="8.5" cy="15.5" r="1" fill={color} />
          <Circle cx="11" cy="12" r="1" fill={color} />
          <Circle cx="14" cy="14.5" r="1" fill={color} />
          <Circle cx="18" cy="8.5" r="1" fill={color} />
        </Svg>
      );
    case "map":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M4 6.5 9 4l6 2 5-2v13.5L15 20l-6-2-5 2z" {...stroke} />
          <Path d="M9 4v14M15 6v14" {...stroke} />
        </Svg>
      );
    case "categories":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="4" y="4" width="7" height="7" rx="2" {...stroke} />
          <Rect x="13" y="4" width="7" height="7" rx="2" {...stroke} />
          <Rect x="4" y="13" width="7" height="7" rx="2" {...stroke} />
          <Rect x="13" y="13" width="7" height="7" rx="2" {...stroke} />
        </Svg>
      );
    case "chat":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M6 6h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H11l-4 3v-3H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" {...stroke} />
          <Path d="M9 11h6M9 14h4" {...stroke} />
        </Svg>
      );
    case "reports":
    case "file":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M8 4h6l4 4v12H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" {...stroke} />
          <Path d="M14 4v4h4M9 12h6M9 16h6" {...stroke} />
        </Svg>
      );
    case "search":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="11" cy="11" r="6" {...stroke} />
          <Path d="m16 16 4.5 4.5" {...stroke} />
        </Svg>
      );
    case "refresh":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M19 7v5h-5" {...stroke} />
          <Path d="M5 17v-5h5" {...stroke} />
          <Path d="M18 12a6 6 0 0 0-10-4.5L5 12" {...stroke} />
          <Path d="M6 12a6 6 0 0 0 10 4.5L19 12" {...stroke} />
        </Svg>
      );
    case "sun":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="4" {...stroke} />
          <Path d="M12 2.5v2.5M12 19v2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2.5 12H5M19 12h2.5M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" {...stroke} />
        </Svg>
      );
    case "moon":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M18.5 14.5A7.5 7.5 0 0 1 9.5 5.5a8.5 8.5 0 1 0 9 9Z" {...stroke} />
        </Svg>
      );
    case "chevronDown":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="m6 9 6 6 6-6" {...stroke} />
        </Svg>
      );
    case "chevronLeft":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="m14 6-6 6 6 6" {...stroke} />
        </Svg>
      );
    case "chevronRight":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="m10 6 6 6-6 6" {...stroke} />
        </Svg>
      );
    case "user":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="8" r="3.5" {...stroke} />
          <Path d="M5.5 19a6.5 6.5 0 0 1 13 0" {...stroke} />
        </Svg>
      );
    case "download":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 4v10" {...stroke} />
          <Path d="m8 10 4 4 4-4" {...stroke} />
          <Path d="M5 19h14" {...stroke} />
        </Svg>
      );
    case "camera":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="4" y="7" width="16" height="12" rx="3" {...stroke} />
          <Path d="M9 7 10.5 5h3L15 7" {...stroke} />
          <Circle cx="12" cy="13" r="3.5" {...stroke} />
        </Svg>
      );
    case "expand":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M8 4H4v4M16 4h4v4M8 20H4v-4M20 20h-4v-4" {...stroke} />
          <Path d="M9 9 4 4M15 9l5-5M9 15l-5 5M15 15l5 5" {...stroke} />
        </Svg>
      );
    case "filter":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M5 6h14M8 12h8M10 18h4" {...stroke} />
        </Svg>
      );
    case "send":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="m4 12 16-7-4 14-3.5-5.5z" {...stroke} />
          <Path d="m20 5-7.5 8" {...stroke} />
        </Svg>
      );
    case "spark":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z" {...stroke} />
          <Path d="m18.5 15.5.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9zM5.5 15.5l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7z" {...stroke} />
        </Svg>
      );
    case "close":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M6 6 18 18M18 6 6 18" {...stroke} />
        </Svg>
      );
    case "menu":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M5 7h14M5 12h14M5 17h14" {...stroke} />
        </Svg>
      );
    case "bell":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M8 18h8M7 16V11a5 5 0 1 1 10 0v5l1.5 2H5.5z" {...stroke} />
        </Svg>
      );
    case "leaf":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M18.5 5.5C13 5 8.5 7.5 6.5 12.5c-1.3 3.3-.7 6.2 1.5 8 1.8 1.5 4.4 1.8 6.9.7 4.8-2.1 6.7-8.5 3.6-15.7Z" {...stroke} />
          <Path d="M8 14c2.8-.2 5.5-1.6 8-4.1M10 17c1.2-.1 2.4-.5 3.6-1.2" {...stroke} />
        </Svg>
      );
    case "shield":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 4 6 6.5V11c0 4.1 2.3 7.7 6 9 3.7-1.3 6-4.9 6-9V6.5z" {...stroke} />
          <Path d="M9.5 11.8 11.2 13.5 14.8 9.8" {...stroke} />
        </Svg>
      );
    case "droplet":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 4c3.3 4.1 5 7 5 9.5a5 5 0 1 1-10 0C7 11 8.7 8.1 12 4Z" {...stroke} />
          <Path d="M10 15.2c.3.9 1 1.5 2 1.8" {...stroke} />
        </Svg>
      );
    case "wind":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M4 9h9a3 3 0 1 0-3-3" {...stroke} />
          <Path d="M3 13h13a2.5 2.5 0 1 1-2.5 2.5" {...stroke} />
          <Path d="M5 17h7a2 2 0 1 1-2 2" {...stroke} />
        </Svg>
      );
    case "heartPulse":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 20 5.7 13.7a4.4 4.4 0 0 1 6.2-6.2L12 8.6l.1-.1a4.4 4.4 0 0 1 6.2 6.2z" {...stroke} />
          <Path d="M7.8 12h2.2l1.1-2.2 1.7 4.4 1.2-2.2h2.2" {...stroke} />
        </Svg>
      );
    case "road":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M9 4 6 20M15 4l3 16M8 20h8" {...stroke} />
          <Path d="M12 6v2.5M12 11v2.5M12 16v2" {...stroke} />
        </Svg>
      );
    case "bolt":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M13 3 6.5 13H12l-1 8 6.5-10H12z" {...stroke} />
        </Svg>
      );
    case "trafficLight":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="7" y="2" width="10" height="20" rx="3" {...stroke} />
          <Circle cx="12" cy="7" r="1.5" fill={color} />
          <Circle cx="12" cy="12" r="1.5" fill={color} />
          <Circle cx="12" cy="17" r="1.5" fill={color} />
        </Svg>
      );
    default:
      return null;
  }
};
