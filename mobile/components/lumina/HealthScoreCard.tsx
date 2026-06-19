import { StyleSheet, Text, View } from 'react-native';

import { LuminaCard } from './LuminaCard';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaRadius, LuminaSpacing, LuminaTypography } from '@/theme/lumina';

type HealthScoreProps = {
  score: number;
  profileComplete: number;
  recordsCount: number;
  vitalsCount: number;
  appointmentsCount: number;
};

export function HealthScoreCard({ score, profileComplete, recordsCount, vitalsCount, appointmentsCount }: HealthScoreProps) {
  const { colors } = useLuminaTheme();
  const clamped = Math.min(100, Math.max(0, score));

  return (
    <LuminaCard elevated>
      <View style={styles.header}>
        <View>
          <Text style={[styles.overline, { color: colors.textMuted }]}>Health engagement</Text>
          <Text style={[styles.score, { color: colors.text }]}>{clamped}%</Text>
        </View>
        <View style={[styles.ring, { borderColor: colors.primary }]}>
          <View style={[styles.ringInner, { backgroundColor: colors.primarySoft }]}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>{clamped}</Text>
          </View>
        </View>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${clamped}%`, backgroundColor: colors.primary }]} />
      </View>
      <View style={styles.metrics}>
        <MiniStat label="Profile" value={`${profileComplete}%`} colors={colors} />
        <MiniStat label="Records" value={String(recordsCount)} colors={colors} />
        <MiniStat label="Vitals" value={String(vitalsCount)} colors={colors} />
        <MiniStat label="Visits" value={String(appointmentsCount)} colors={colors} />
      </View>
    </LuminaCard>
  );
}

function MiniStat({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useLuminaTheme>['colors'] }) {
  return (
    <View style={styles.mini}>
      <Text style={[styles.miniValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.miniLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

export function computeHealthScore(input: {
  hasDob?: boolean;
  hasBloodGroup?: boolean;
  hasEmergency?: boolean;
  recordsCount: number;
  vitalsCount: number;
  appointmentsCount: number;
}): { score: number; profileComplete: number } {
  let profile = 0;
  if (input.hasDob) profile += 34;
  if (input.hasBloodGroup) profile += 33;
  if (input.hasEmergency) profile += 33;
  const activity = Math.min(100, input.recordsCount * 15 + input.vitalsCount * 10 + Math.min(input.appointmentsCount, 3) * 10);
  const score = Math.round(profile * 0.4 + activity * 0.6);
  return { score, profileComplete: profile };
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: LuminaSpacing.md },
  overline: { ...LuminaTypography.overline, fontSize: 10 },
  score: { ...LuminaTypography.display, fontSize: 32 },
  ring: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  ringInner: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  barTrack: { height: 6, borderRadius: LuminaRadius.full, backgroundColor: '#E2E8F0', overflow: 'hidden', marginBottom: LuminaSpacing.lg },
  barFill: { height: '100%', borderRadius: LuminaRadius.full },
  metrics: { flexDirection: 'row', justifyContent: 'space-between' },
  mini: { alignItems: 'center', flex: 1 },
  miniValue: { fontWeight: '700', fontSize: 16 },
  miniLabel: { fontSize: 11, marginTop: 2 },
});
