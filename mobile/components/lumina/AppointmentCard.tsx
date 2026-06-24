import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing, LuminaTypography, getStatusStyle } from '@/theme/lumina';
import { triggerHaptic } from '@/utils/haptics';

export type AppointmentCardData = {
  id: number;
  patientName?: string;
  doctorName?: string;
  time?: string;
  date?: string;
  status: string;
  reason?: string;
  specialty?: string;
};

type AppointmentCardProps = {
  appointment: AppointmentCardData;
  onPress?: () => void;
  /** 'patient' shows doctor name; 'doctor' shows patient name */
  role?: 'patient' | 'doctor';
};

export function AppointmentCard({ appointment, onPress, role = 'patient' }: AppointmentCardProps) {
  const { colors } = useLuminaTheme({ role });
  const { color: statusColor, bg: statusBg } = getStatusStyle(appointment.status, colors);
  const isCancelled = appointment.status?.toLowerCase() === 'cancelled';

  const displayName = role === 'doctor'
    ? appointment.patientName
    : appointment.doctorName;

  const content = (
    <View
      style={[
        styles.card,
        LuminaShadow.sm,
        { backgroundColor: colors.surface, opacity: isCancelled ? 0.65 : 1 },
      ]}
    >
      {/* Left status bar */}
      <View style={[styles.statusBar, { backgroundColor: statusColor }]} />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.nameBlock}>
            {appointment.time ? (
              <Text style={[styles.time, { color: colors.textSecondary }]}>
                {appointment.time}
              </Text>
            ) : null}
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {displayName ?? 'Unknown'}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {appointment.status.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>

        {(appointment.reason || appointment.specialty) ? (
          <View style={styles.bottomRow}>
            {appointment.specialty ? (
              <View style={[styles.tokenChip, { backgroundColor: colors.tealSoft }]}>
                <Text style={[styles.tokenText, { color: colors.teal }]}>
                  {appointment.specialty}
                </Text>
              </View>
            ) : null}
            {appointment.reason ? (
              <Text style={[styles.reason, { color: colors.textSecondary }]} numberOfLines={1}>
                {appointment.reason}
              </Text>
            ) : null}
          </View>
        ) : null}

        {appointment.date ? (
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
            <Text style={[styles.dateText, { color: colors.textMuted }]}>{appointment.date}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => { triggerHaptic('light'); onPress(); }}
        accessibilityRole="button"
        style={({ pressed }) => [{ opacity: pressed ? 0.82 : 1 }]}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: LuminaRadius.md,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: LuminaSpacing.md,
  },
  statusBar: { width: 4 },
  body: { flex: 1, padding: LuminaSpacing.md, gap: 6 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: LuminaSpacing.sm },
  nameBlock: { flex: 1 },
  time: {
    fontSize: 12,
    fontFamily: LuminaFontFamily.dmMonoMedium,
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  name: { ...LuminaTypography.h3 },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: LuminaRadius.full,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 10,
    fontFamily: LuminaFontFamily.dmSansMedium,
    textTransform: 'capitalize',
  },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: LuminaSpacing.sm, flexWrap: 'wrap' },
  tokenChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tokenText: { fontSize: 11, fontFamily: LuminaFontFamily.dmSansMedium },
  reason: { ...LuminaTypography.bodySmall, flex: 1 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 11, fontFamily: LuminaFontFamily.dmSansRegular },
});
