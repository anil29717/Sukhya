/**
 * Patient context strip — shown at the top of clinical forms
 * (create prescription, create note, record detail).
 */
import { StyleSheet, Text, View } from 'react-native';

import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaFontFamily, LuminaSpacing } from '@/theme/lumina';

type ContextStripProps = {
  name: string;
  age?: number;
  gender?: string;
  info?: string;
};

export function ContextStrip({ name, age, gender, info }: ContextStripProps) {
  const { colors } = useLuminaTheme({ role: 'doctor' });

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const meta = [age ? `${age} yrs` : null, gender, info].filter(Boolean).join(' · ');

  return (
    <View style={[styles.strip, { backgroundColor: colors.tealSoft }]}>
      <View style={[styles.avatar, { backgroundColor: colors.teal }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{name}</Text>
        {meta ? (
          <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>{meta}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: LuminaSpacing.xl,
    paddingVertical: LuminaSpacing.md,
    gap: LuminaSpacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontFamily: LuminaFontFamily.nunitoBold,
    color: '#FFFFFF',
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontFamily: LuminaFontFamily.dmSansSemiBold },
  meta: { fontSize: 12, fontFamily: LuminaFontFamily.dmSansRegular, marginTop: 1 },
});
