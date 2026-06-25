import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { listMedications, getDueReminders, logMedicationDose, getMedicationLogs } from '@/api/medications';
import { Medication, MedicationReminder } from '@/api/types';
import { EmptyState } from '@/components/lumina/EmptyState';
import { LoadingSkeleton } from '@/components/lumina/ErrorState';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { useActivePatient } from '@/hooks/useActivePatient';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { triggerHaptic } from '@/utils/haptics';

const MED_COLOR = '#0D9B76';
const MED_BG = '#D1FAE5';

function doseKey(medId: number, scheduledFor: string) {
  return `${medId}-${scheduledFor}`;
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function formatDueTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

function MedicationCard({
  med,
  due,
  loggedStatus,
  logging,
  onLog,
  colors,
}: {
  med: Medication;
  due?: MedicationReminder;
  loggedStatus?: 'taken' | 'missed';
  logging?: 'taken' | 'missed' | null;
  onLog: (status: 'taken' | 'missed') => void;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
}) {
  const isDue = !!due && !loggedStatus;
  const isTaken = loggedStatus === 'taken';
  const isMissed = loggedStatus === 'missed';

  const accentColor = isTaken ? colors.teal : isMissed ? colors.errorText : MED_COLOR;
  const accentBg = isTaken ? colors.tealSoft : isMissed ? colors.errorSoft : MED_BG;

  return (
    <View
      style={[
        cardStyles.wrap,
        LuminaShadow.md,
        {
          backgroundColor: colors.surface,
          borderColor: isDue ? colors.coral + '44' : 'rgba(255,255,255,0.65)',
          borderWidth: isDue ? 1.5 : 1,
        },
      ]}
    >
      <View style={[cardStyles.accent, { backgroundColor: accentColor }]} />

      <View style={cardStyles.body}>
        <View style={cardStyles.topRow}>
          <View style={[cardStyles.iconWrap, { backgroundColor: accentBg }]}>
            <Ionicons name="medical-outline" size={20} color={accentColor} />
          </View>
          <View style={cardStyles.titleBlock}>
            <Text style={[cardStyles.name, { color: colors.text }]} numberOfLines={1}>
              {med.name}
            </Text>
            <View style={cardStyles.metaRow}>
              {med.dosage ? (
                <View style={[cardStyles.chip, { backgroundColor: colors.neutral100 }]}>
                  <Text style={[cardStyles.chipText, { color: colors.textSecondary }]}>{med.dosage}</Text>
                </View>
              ) : null}
              {med.frequency ? (
                <View style={[cardStyles.chip, { backgroundColor: colors.neutral100 }]}>
                  <Text style={[cardStyles.chipText, { color: colors.textSecondary }]}>{med.frequency}</Text>
                </View>
              ) : null}
            </View>
          </View>
          {isDue ? (
            <View style={[cardStyles.dueBadge, { backgroundColor: colors.coralSoft }]}>
              <Ionicons name="alarm-outline" size={11} color={colors.coral} />
              <Text style={[cardStyles.dueText, { color: colors.coral }]}>{formatDueTime(due.scheduled_for)}</Text>
            </View>
          ) : null}
        </View>

        {med.instructions ? (
          <Text style={[cardStyles.instructions, { color: colors.textMuted }]} numberOfLines={2}>
            {med.instructions}
          </Text>
        ) : null}

        {loggedStatus ? (
          <View
            style={[
              cardStyles.statusBar,
              { backgroundColor: isTaken ? colors.tealSoft : colors.errorSoft, borderColor: isTaken ? colors.teal + '33' : colors.errorText + '33' },
            ]}
          >
            <Ionicons
              name={isTaken ? 'checkmark-circle' : 'close-circle'}
              size={18}
              color={isTaken ? colors.teal : colors.errorText}
            />
            <View style={{ flex: 1 }}>
              <Text style={[cardStyles.statusTitle, { color: isTaken ? colors.teal : colors.errorText }]}>
                {isTaken ? 'Dose taken' : 'Marked as missed'}
              </Text>
              <Text style={[cardStyles.statusSub, { color: colors.textSecondary }]}>
                {isTaken ? 'Logged for today' : 'You can log again tomorrow'}
              </Text>
            </View>
          </View>
        ) : isDue ? (
          <View style={cardStyles.actionRow}>
            <Pressable
              onPress={() => onLog('taken')}
              disabled={!!logging}
              style={({ pressed }) => [
                cardStyles.actionBtn,
                {
                  backgroundColor: logging === 'taken' ? colors.teal : colors.tealSoft,
                  borderColor: colors.teal,
                  opacity: pressed ? 0.88 : logging && logging !== 'taken' ? 0.5 : 1,
                },
              ]}
            >
              {logging === 'taken' ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color={colors.teal} />
                  <Text style={[cardStyles.actionText, { color: colors.teal }]}>Taken</Text>
                </>
              )}
            </Pressable>
            <Pressable
              onPress={() => onLog('missed')}
              disabled={!!logging}
              style={({ pressed }) => [
                cardStyles.actionBtn,
                {
                  backgroundColor: logging === 'missed' ? colors.errorText : colors.errorSoft,
                  borderColor: colors.errorText,
                  opacity: pressed ? 0.88 : logging && logging !== 'missed' ? 0.5 : 1,
                },
              ]}
            >
              {logging === 'missed' ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={18} color={colors.errorText} />
                  <Text style={[cardStyles.actionText, { color: colors.errorText }]}>Missed</Text>
                </>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={[cardStyles.upToDateBar, { backgroundColor: colors.neutral100 }]}>
            <Ionicons name="checkmark-done-outline" size={14} color={colors.textMuted} />
            <Text style={[cardStyles.upToDateText, { color: colors.textMuted }]}>No dose due right now</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  wrap: {
    borderRadius: LuminaRadius.xl,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accent: { width: 4 },
  body: { flex: 1, padding: LuminaSpacing.lg, gap: 10 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: LuminaRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleBlock: { flex: 1, gap: 6 },
  name: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 16, lineHeight: 20 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: LuminaRadius.full,
  },
  chipText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 11 },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: LuminaRadius.full,
    flexShrink: 0,
  },
  dueText: { fontFamily: LuminaFontFamily.dmMonoMedium, fontSize: 11 },
  instructions: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1.5,
  },
  actionText: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 14 },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1,
    marginTop: 2,
  },
  statusTitle: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 14 },
  statusSub: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 12, marginTop: 1 },
  upToDateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: LuminaRadius.md,
  },
  upToDateText: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 12 },
});

export default function MedicationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { colors } = useLuminaTheme({ role: 'patient' });
  const { activePatientId } = useActivePatient();

  const [doseStates, setDoseStates] = useState<Record<string, 'taken' | 'missed'>>({});
  const [loggingKey, setLoggingKey] = useState<string | null>(null);

  const { data: meds, isLoading } = useQuery({
    queryKey: ['medications', activePatientId],
    queryFn: () => listMedications({ patient_id: activePatientId ?? undefined, active_only: true }),
  });

  const { data: reminders } = useQuery({ queryKey: ['medication-reminders'], queryFn: getDueReminders });

  const { data: todayLogs } = useQuery({
    queryKey: ['medication-logs', activePatientId],
    queryFn: () => getMedicationLogs({ patient_id: activePatientId ?? undefined }),
    select: (logs) => logs.filter((l) => isToday(l.scheduled_for)),
  });

  const dueCount = reminders?.length ?? 0;

  const logMutation = useMutation({
    mutationFn: ({ medId, scheduledFor, status }: { medId: number; scheduledFor: string; status: 'taken' | 'missed' }) => {
      setLoggingKey(doseKey(medId, scheduledFor));
      return logMedicationDose(medId, { scheduled_for: scheduledFor, status });
    },
    onSuccess: (_, vars) => {
      triggerHaptic(vars.status === 'taken' ? 'success' : 'light');
      const key = doseKey(vars.medId, vars.scheduledFor);
      setDoseStates((prev) => ({ ...prev, [key]: vars.status }));
      setLoggingKey(null);
      queryClient.invalidateQueries({ queryKey: ['medication-reminders'] });
      queryClient.invalidateQueries({ queryKey: ['medication-logs'] });
    },
    onError: () => setLoggingKey(null),
  });

  const getLoggedStatus = (medId: number, scheduledFor?: string): 'taken' | 'missed' | undefined => {
    if (scheduledFor) {
      const key = doseKey(medId, scheduledFor);
      if (doseStates[key]) return doseStates[key];
    }
    const log = todayLogs?.find((l) => l.medication_id === medId);
    if (log?.status === 'taken' || log?.status === 'missed') return log.status;
    return undefined;
  };

  const sortedMeds = useMemo(() => {
    if (!meds) return [];
    return [...meds].sort((a, b) => {
      const aDue = reminders?.some((r) => r.medication_id === a.id) ? 0 : 1;
      const bDue = reminders?.some((r) => r.medication_id === b.id) ? 0 : 1;
      return aDue - bDue;
    });
  }, [meds, reminders]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Medications"
        subtitle={dueCount > 0 ? `${dueCount} dose${dueCount === 1 ? '' : 's'} due today` : 'Schedule & dose tracking'}
        role="patient"
        large
        rightIcon="stats-chart-outline"
        onRightPress={() => router.push('/(patient)/medications/history')}
      />

      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : !meds?.length ? (
        <EmptyState
          role="patient"
          icon="medkit-outline"
          title="No active medications"
          message="Medications prescribed by your doctor will appear here."
        />
      ) : (
        <FlatList
          data={sortedMeds}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            dueCount > 0 ? (
              <View style={[styles.dueBanner, { backgroundColor: colors.coralSoft, borderColor: colors.coral + '33' }]}>
                <View style={[styles.dueBannerIcon, { backgroundColor: colors.coral + '22' }]}>
                  <Ionicons name="alarm-outline" size={20} color={colors.coral} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dueBannerTitle, { color: colors.text }]}>
                    {dueCount} dose{dueCount === 1 ? '' : 's'} due today
                  </Text>
                  <Text style={[styles.dueBannerSub, { color: colors.textSecondary }]}>
                    Tap Taken or Missed to log each dose
                  </Text>
                </View>
              </View>
            ) : (
              <View style={[styles.allClearBanner, { backgroundColor: colors.tealSoft, borderColor: colors.teal + '33' }]}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.teal} />
                <Text style={[styles.allClearText, { color: colors.teal }]}>You're all caught up for today</Text>
              </View>
            )
          }
          renderItem={({ item }) => {
            const due = reminders?.find((r) => r.medication_id === item.id);
            const scheduledFor = due?.scheduled_for;
            const key = scheduledFor ? doseKey(item.id, scheduledFor) : '';
            const loggedStatus = getLoggedStatus(item.id, scheduledFor);
            const logging =
              loggingKey === key
                ? (logMutation.variables?.status ?? null)
                : null;

            return (
              <MedicationCard
                med={item}
                due={due}
                loggedStatus={loggedStatus}
                logging={logging}
                colors={colors}
                onLog={(status) => {
                  if (!scheduledFor) return;
                  logMutation.mutate({ medId: item.id, scheduledFor, status });
                }}
              />
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: LuminaSpacing.xl, paddingTop: LuminaSpacing.sm },
  dueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: LuminaSpacing.lg,
    borderRadius: LuminaRadius.xl,
    borderWidth: 1,
    marginBottom: LuminaSpacing.lg,
  },
  dueBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: LuminaRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dueBannerTitle: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 15 },
  dueBannerSub: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 12, marginTop: 2 },
  allClearBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1,
    marginBottom: LuminaSpacing.lg,
  },
  allClearText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 13 },
});
