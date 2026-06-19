import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';

import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaRadius, LuminaShadow, LuminaSpacing, LuminaTouch } from '@/theme/lumina';

type SearchBarProps = TextInputProps & {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
};

export function SearchBar({ value, onChangeText, onClear, placeholder = 'Search...', ...rest }: SearchBarProps) {
  const { colors } = useLuminaTheme();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }, LuminaShadow.sm]}>
      <Ionicons name="search" size={20} color={colors.textMuted} />
      <TextInput
        {...rest}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { color: colors.text }]}
        returnKeyType="search"
        clearButtonMode="never"
        accessibilityRole="search"
      />
      {value.length > 0 ? (
        <Pressable onPress={() => (onClear ? onClear() : onChangeText(''))} hitSlop={LuminaTouch.hitSlop} accessibilityLabel="Clear search">
          <Ionicons name="close-circle" size={20} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: LuminaTouch.minTarget,
    borderRadius: LuminaRadius.lg,
    paddingHorizontal: LuminaSpacing.lg,
    gap: LuminaSpacing.sm,
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: LuminaSpacing.md },
});
