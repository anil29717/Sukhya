/**
 * Spring-animated bottom sheet with drag handle.
 * Supports fixed height or percentage max-height with scrollable body layouts.
 */
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';

import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaRadius } from '@/theme/lumina';

const SCREEN_HEIGHT = Dimensions.get('window').height;

function resolveSheetHeight(height: number, maxHeight?: number | `${number}%`): number {
  if (typeof maxHeight === 'string' && maxHeight.endsWith('%')) {
    return SCREEN_HEIGHT * (parseFloat(maxHeight) / 100);
  }
  if (typeof maxHeight === 'number') {
    return Math.min(height, maxHeight);
  }
  return Math.min(height, SCREEN_HEIGHT * 0.92);
}

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Default sheet height when maxHeight is not a percentage */
  height?: number;
  /** Cap / set sheet height — use e.g. "92%" for scrollable forms */
  maxHeight?: number | `${number}%`;
};

export function BottomSheet({
  visible,
  onClose,
  children,
  height = 400,
  maxHeight,
}: BottomSheetProps) {
  const { colors } = useLuminaTheme();
  const sheetHeight = useMemo(() => resolveSheetHeight(height, maxHeight), [height, maxHeight]);
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(sheetHeight)).current;

  useEffect(() => {
    sheetAnim.setValue(sheetHeight);
  }, [sheetHeight, sheetAnim]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(sheetAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(sheetAnim, { toValue: sheetHeight, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, backdropAnim, sheetAnim, sheetHeight]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.surface,
            height: sheetHeight,
            transform: [{ translateY: sheetAnim }],
          },
        ]}
      >
        <View style={styles.handleWrap}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
        </View>
        <View style={styles.body}>{children}</View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.50)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: LuminaRadius.xl + 4,
    borderTopRightRadius: LuminaRadius.xl + 4,
    overflow: 'hidden',
  },
  handleWrap: { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  body: { flex: 1 },
});
