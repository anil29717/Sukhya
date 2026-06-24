import React, { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { listVitals } from '@/api/medications';
import { getHealthTimeline } from '@/api/timeline';
import { TimelineEvent } from '@/api/types';
import { BottomSheet } from '@/components/lumina/BottomSheet';
import { LoadingSkeleton } from '@/components/lumina/ErrorState';
import { HealthCalendar, toIsoDate } from '@/components/lumina/HealthCalendar';
import { useActivePatient } from '@/hooks/useActivePatient';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { triggerHaptic } from '@/utils/haptics';

type EventMeta = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  accent: string;
};

const EVENT_META: Record<string, EventMeta> = {
  appointment: {
    icon: 'calendar',
    iconColor: '#0BA5EC',
    iconBg: '#E0F2FE',
    label: 'Appointment',
    accent: '#0BA5EC',
  },
  doctor_visit: {
    icon: 'medical',
    iconColor: '#0D9B76',
    iconBg: '#E6F7F2',
    label: 'Doctor visit',
    accent: '#0D9B76',
  },
  prescription: {
    icon: 'medkit',
    iconColor: '#F79009',
    iconBg: '#FEF3C7',
    label: 'Prescription',
    accent: '#F79009',
  },
  medical_record: {
    icon: 'document-text',
    iconColor: '#7C3AED',
    iconBg: '#EDE9FE',
    label: 'Health record',
    accent: '#7C3AED',
  },
  vital: {
    icon: 'pulse',
    iconColor: '#F05A2A',
    iconBg: '#FEF0EB',
    label: 'Vital sign',
    accent: '#F05A2A',
  },
};

const LEGEND_ITEMS = [
  EVENT_META.appointment,
  EVENT_META.doctor_visit,
  EVENT_META.prescription,
  EVENT_META.medical_record,
  EVENT_META.vital,
];

function getEventMeta(eventType: string): EventMeta {
  const key = Object.keys(EVENT_META).find((k) => eventType.toLowerCase().includes(k));
  return EVENT_META[key ?? ''] ?? EVENT_META.vital;
}

function cleanTitle(title: string) {
  return title.replace(/\bDr\.\s+Dr\.\s*/gi, 'Dr. ');
}

function formatDayHeading(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const todayKey = toIsoDate(today);
  const yesterdayKey = toIsoDate(yesterday);
  if (iso === todayKey) return 'Today';
  if (iso === yesterdayKey) return 'Yesterday';
  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDatePill(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  const todayKey = toIsoDate(new Date());
  if (iso === todayKey) return 'Today';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatEventTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function eventDayKey(iso: string) {
  return iso.slice(0, 10);
}

function getMonthBounds(year: number, month: number) {
  const from = toIsoDate(new Date(year, month, 1));
  const to = toIsoDate(new Date(year, month + 1, 0));
  return { from, to };
}

function vitalToEvent(v: {
  id: number;
  vital_type: string;
  value: string;
  unit?: string | null;
  recorded_at: string;
  patient_id: number;
}): TimelineEvent {
  const label = v.vital_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    event_type: 'vital',
    reference_id: v.id,
    title: label,
    summary: `${v.value}${v.unit ? ` ${v.unit}` : ''}`,
    event_at: v.recorded_at,
    patient_id: v.patient_id,
    extra: null,
  };
}

function DayEventCard({
  event,
  colors,
  onPress,
}: {
  event: TimelineEvent;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
  onPress?: () => void;
}) {
  const meta = getEventMeta(event.event_type);
  const content = (
    <View style={[styles.eventCard, LuminaShadow.sm, { backgroundColor: colors.surface }]}>
      <View style={[styles.eventAccent, { backgroundColor: meta.accent }]} />
      <View style={[styles.eventIcon, { backgroundColor: meta.iconBg }]}>
        <Ionicons name={meta.icon} size={18} color={meta.iconColor} />
      </View>
      <View style={styles.eventBody}>
        <View style={styles.eventTopRow}>
          <Text style={[styles.eventType, { color: meta.iconColor }]}>{meta.label}</Text>
          <Text style={[styles.eventTime, { color: colors.textMuted }]}>
            {formatEventTime(event.event_at)}
          </Text>
        </View>
        <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>
          {cleanTitle(event.title)}
        </Text>
        {event.summary ? (
          <Text style={[styles.eventSummary, { color: colors.textSecondary }]} numberOfLines={2}>
            {event.summary}
          </Text>
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={() => { triggerHaptic('light'); onPress(); }} style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
        {content}
      </Pressable>
    );
  }
  return content;
}

export default function TimelineScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useLuminaTheme({ role: 'patient' });
  const { activePatientId } = useActivePatient();

  const [selectedDate, setSelectedDate] = useState(toIsoDate(new Date()));
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [showCalendar, setShowCalendar] = useState(false);
  const monthBounds = getMonthBounds(viewYear, viewMonth);
  const isToday = selectedDate === toIsoDate(new Date());

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['timeline', activePatientId, monthBounds.from, monthBounds.to],
    queryFn: () =>
      getHealthTimeline({
        patient_id: activePatientId ?? undefined,
        from_date: monthBounds.from,
        to_date: monthBounds.to,
        page_size: 100,
      }),
  });

  const { data: vitals } = useQuery({
    queryKey: ['vitals-timeline', activePatientId],
    queryFn: () => listVitals({ patient_id: activePatientId ?? undefined }),
  });

  const monthEvents = useMemo(() => {
    const items: TimelineEvent[] = [...(data?.items ?? [])];
    vitals?.forEach((v) => {
      const day = eventDayKey(v.recorded_at);
      if (day >= monthBounds.from && day <= monthBounds.to) {
        items.push(vitalToEvent(v));
      }
    });
    return items.sort((a, b) => new Date(b.event_at).getTime() - new Date(a.event_at).getTime());
  }, [data?.items, vitals, monthBounds.from, monthBounds.to]);

  const eventDates = useMemo(() => {
    const set = new Set<string>();
    monthEvents.forEach((e) => set.add(eventDayKey(e.event_at)));
    return set;
  }, [monthEvents]);

  const dayEvents = useMemo(
    () => monthEvents.filter((e) => eventDayKey(e.event_at) === selectedDate),
    [monthEvents, selectedDate]
  );

  const hasAnyEvents = monthEvents.length > 0;

  const openCalendar = () => {
    triggerHaptic('light');
    setShowCalendar(true);
  };

  const goToday = () => {
    triggerHaptic('light');
    const today = toIsoDate(new Date());
    setSelectedDate(today);
    const d = new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={openCalendar}
          style={[styles.calBtn, LuminaShadow.sm, { backgroundColor: colors.surface, borderColor: colors.border }]}
          accessibilityLabel="Open calendar"
          accessibilityHint="Select a date to view health activity"
        >
          <Ionicons name="calendar-outline" size={20} color={colors.coral} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
            Health Timeline
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your daily health activity
          </Text>
        </View>

        {!isToday ? (
          <Pressable
            onPress={goToday}
            style={[styles.todayBtn, { backgroundColor: colors.coralSoft, borderColor: colors.coral + '33' }]}
          >
            <Text style={[styles.todayBtnText, { color: colors.coral }]}>Today</Text>
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {/* Selected date pill */}
      <Pressable
        onPress={openCalendar}
        style={[styles.datePill, LuminaShadow.sm, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Ionicons name="calendar" size={16} color={colors.coral} />
        <Text style={[styles.datePillText, { color: colors.text }]}>{formatDatePill(selectedDate)}</Text>
        {dayEvents.length > 0 ? (
          <View style={[styles.datePillBadge, { backgroundColor: colors.coralSoft }]}>
            <Text style={[styles.datePillBadgeText, { color: colors.coral }]}>
              {dayEvents.length}
            </Text>
          </View>
        ) : null}
        <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
      </Pressable>

      {/* Compact legend */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.legendScroll}
        style={styles.legendBar}
      >
        {LEGEND_ITEMS.map((m) => (
          <View key={m.label} style={[styles.legendChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.legendDot, { backgroundColor: m.accent }]} />
            <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>{m.label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Day events */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.coral} />
        }
      >
        <Text style={[styles.dayHeading, { color: colors.text }]}>
          {formatDayHeading(selectedDate)}
        </Text>

        {isLoading ? (
          <LoadingSkeleton count={2} />
        ) : dayEvents.length === 0 ? (
          <View style={[styles.emptyDay, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.emptyDayIcon, { backgroundColor: colors.neutral100 }]}>
              <Ionicons name="leaf-outline" size={28} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyDayTitle, { color: colors.text }]}>
              {hasAnyEvents ? 'Nothing logged this day' : 'No health activity yet'}
            </Text>
            <Text style={[styles.emptyDayBody, { color: colors.textSecondary }]}>
              {hasAnyEvents
                ? 'Tap the calendar to pick another date.'
                : 'Book a visit, log vitals, or upload a record to start.'}
            </Text>
            <Pressable
              onPress={openCalendar}
              style={[styles.emptyDayCta, { backgroundColor: colors.coralSoft, borderColor: colors.coral + '33' }]}
            >
              <Ionicons name="calendar-outline" size={16} color={colors.coral} />
              <Text style={[styles.emptyDayCtaText, { color: colors.coral }]}>Choose a date</Text>
            </Pressable>
            {!hasAnyEvents ? (
              <Pressable
                onPress={() => router.push('/(patient)/(tabs)/doctors')}
                style={[styles.emptyDayCtaPrimary, { backgroundColor: colors.coral }]}
              >
                <Text style={styles.emptyDayCtaPrimaryText}>Book Appointment</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.eventsList}>
            {dayEvents.map((ev) => (
              <DayEventCard
                key={`${ev.event_type}-${ev.reference_id}-${ev.event_at}`}
                event={ev}
                colors={colors}
                onPress={
                  ev.event_type.includes('appointment')
                    ? () => router.push(`/(patient)/appointments/${ev.reference_id}`)
                    : ev.event_type === 'prescription'
                      ? () => router.push(`/(patient)/prescriptions/${ev.reference_id}`)
                      : ev.event_type === 'medical_record'
                        ? () => router.push(`/(patient)/records/${ev.reference_id}`)
                        : ev.event_type === 'vital'
                          ? () => router.push('/(patient)/vitals')
                          : undefined
                }
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Calendar bottom sheet */}
      <BottomSheet visible={showCalendar} onClose={() => setShowCalendar(false)} height={520}>
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>Select date</Text>
          <Pressable onPress={() => setShowCalendar(false)} hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>
        <Text style={[styles.sheetHint, { color: colors.textSecondary }]}>
          Dots mark days with health activity
        </Text>
        <HealthCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          eventDates={eventDates}
          onMonthChange={(y, m) => {
            setViewYear(y);
            setViewMonth(m);
          }}
          embedded
          onDaySelected={() => setShowCalendar(false)}
          role="patient"
        />
        {!isToday ? (
          <Pressable
            onPress={() => {
              goToday();
              setShowCalendar(false);
            }}
            style={[styles.sheetTodayBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.sheetTodayText, { color: colors.coral }]}>Jump to today</Text>
          </Pressable>
        ) : null}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: LuminaSpacing.xl,
    paddingTop: LuminaSpacing.lg,
    gap: LuminaSpacing.md,
  },
  calBtn: {
    width: 42,
    height: 42,
    borderRadius: LuminaRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  headerText: { flex: 1 },
  headerSpacer: { width: 52 },
  title: {
    fontFamily: LuminaFontFamily.nunitoBold,
    fontSize: 24,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 13,
    marginTop: 2,
  },
  todayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: LuminaRadius.full,
    borderWidth: 1,
    marginTop: 4,
  },
  todayBtnText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 13 },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: LuminaSpacing.xl,
    marginTop: LuminaSpacing.md,
    marginBottom: LuminaSpacing.sm,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1,
  },
  datePillText: {
    flex: 1,
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 15,
  },
  datePillBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  datePillBadgeText: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 11 },
  legendBar: { maxHeight: 36, marginBottom: LuminaSpacing.sm },
  legendScroll: {
    paddingHorizontal: LuminaSpacing.xl,
    gap: 8,
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: LuminaRadius.full,
    borderWidth: 1,
  },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendLabel: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 11 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: LuminaSpacing.xl,
    paddingBottom: 120,
    paddingTop: LuminaSpacing.sm,
  },
  dayHeading: {
    fontFamily: LuminaFontFamily.nunitoSemiBold,
    fontSize: 17,
    marginBottom: LuminaSpacing.md,
  },
  eventsList: { gap: 10 },
  eventCard: {
    flexDirection: 'row',
    borderRadius: LuminaRadius.lg,
    overflow: 'hidden',
    alignItems: 'stretch',
  },
  eventAccent: { width: 4 },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: LuminaRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginLeft: 12,
    flexShrink: 0,
  },
  eventBody: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 3,
  },
  eventTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  eventType: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 11,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  eventTime: {
    fontFamily: LuminaFontFamily.dmMonoMedium,
    fontSize: 12,
  },
  eventTitle: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  eventSummary: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyDay: {
    alignItems: 'center',
    padding: LuminaSpacing.xl,
    borderRadius: LuminaRadius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 10,
  },
  emptyDayIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyDayTitle: {
    fontFamily: LuminaFontFamily.nunitoSemiBold,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyDayBody: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  emptyDayCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1,
  },
  emptyDayCtaText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 14 },
  emptyDayCtaPrimary: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: LuminaRadius.lg,
  },
  emptyDayCtaPrimaryText: {
    fontFamily: LuminaFontFamily.dmSansSemiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LuminaSpacing.xl,
    paddingBottom: 4,
  },
  sheetTitle: { fontFamily: LuminaFontFamily.nunitoBold, fontSize: 20 },
  sheetHint: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 13,
    paddingHorizontal: LuminaSpacing.xl,
    marginBottom: LuminaSpacing.sm,
  },
  sheetTodayBtn: {
    marginHorizontal: LuminaSpacing.xl,
    marginTop: LuminaSpacing.sm,
    height: 44,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTodayText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 14 },
});
