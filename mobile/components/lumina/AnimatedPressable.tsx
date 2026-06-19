import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

type AnimatedPressableProps = PressableProps & {
  style?: StyleProp<ViewStyle>;
};

export function AnimatedPressable({ children, style, onPressIn, onPressOut, ...rest }: AnimatedPressableProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressableBase
      {...rest}
      style={[animStyle, style]}
      onPressIn={(e) => {
        scale.value = withSpring(0.97, { damping: 15 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 15 });
        onPressOut?.(e);
      }}
    >
      {children}
    </AnimatedPressableBase>
  );
}
