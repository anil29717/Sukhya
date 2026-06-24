/**
 * 4-segment password strength meter.
 */
import { StyleSheet, Text, View } from 'react-native';

import { LuminaFontFamily, LuminaRadius } from '@/theme/lumina';

type Strength = 0 | 1 | 2 | 3 | 4;

function getStrength(password: string): Strength {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score as Strength;
}

const LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const COLORS = ['#E9ECEF', '#F04438', '#F79009', '#0BA5EC', '#12B76A'];

type PasswordStrengthBarProps = { password: string };

export function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  const strength = getStrength(password);
  const label = LABELS[strength];
  const activeColor = COLORS[strength];

  return (
    <View style={styles.wrap}>
      <View style={styles.bars}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              styles.bar,
              { backgroundColor: i <= strength ? activeColor : '#E9ECEF' },
            ]}
          />
        ))}
      </View>
      {label ? (
        <Text style={[styles.label, { color: activeColor }]}>{label}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, marginBottom: 4 },
  bars: { flex: 1, flexDirection: 'row', gap: 4 },
  bar: { flex: 1, height: 4, borderRadius: LuminaRadius.xs },
  label: { fontSize: 11, fontFamily: LuminaFontFamily.dmSansMedium, minWidth: 40, textAlign: 'right' },
});
