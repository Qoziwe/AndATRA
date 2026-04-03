import { PropsWithChildren, useEffect, useRef } from "react";
import { Animated, Easing, ViewStyle } from "react-native";

interface FadeInViewProps extends PropsWithChildren {
  delay?: number;
  yOffset?: number;
  style?: ViewStyle;
}

export const FadeInView = ({
  children,
  delay = 0,
  yOffset = 16,
  style
}: FadeInViewProps) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(yOffset)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 360,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      })
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
};
