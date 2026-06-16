import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../hooks/useTheme';
import { FontFamily, FontSize } from '../../../theme/typography';
import { Spacing, Radius, Shadow } from '../../../theme/spacing';
import { apiFetch } from '../../../api/client';

// ─── API ──────────────────────────────────────────────────────────
const fetchAvailability = () => apiFetch('/doctors/me/availability');
const updateAvailability = (slots) =>
  apiFetch('/doctors/me/availability', {
    method: 'PUT',
    body: JSON.stringify({ slots }),
  });

// ─── Day config ───────────────────────────────────────────────────
const DAYS = [
  { value: 0, label: 'Monday',    short: 'Mon' },
  { value: 1, label: 'Tuesday',   short: 'Tue' },
  { value: 2, label: 'Wednesday', short: 'Wed' },
  { value: 3, label: 'Thursday',  short: 'Thu' },
  { value: 4, label: 'Friday',    short: 'Fri' },
  { value: 5, label: 'Saturday',  short: 'Sat' },
  { value: 6, label: 'Sunday',    short: 'Sun' },
];

// ─── Time options ─────────────────────────────────────────────────
const TIME_OPTIONS = [
  '06:00:00', '07:00:00', '08:00:00', '09:00:00', '10:00:00',
  '11:00:00', '12:00:00', '13:00:00', '14:00:00', '15:00:00',
  '16:00:00', '17:00:00', '18:00:00', '19:00:00', '20:00:00',
  '21:00:00', '22:00:00',
];

const formatTime12 = (time24) => {
  if (!time24) return '—';
  const [h, m] = time24.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
};

// ─── Time picker ─────────────────────────────────────────────────
function TimePicker({ value, onChange, label, colors }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ flex: 1 }}>
      <Text style={[tpS.label, { color: colors.textSecondary }]}>{label}</Text>
      <TouchableOpacity
        style={[tpS.btn, { backgroundColor: colors.bg, borderColor: open ? colors.teal : colors.border, borderWidth: open ? 1.5 : 1 }]}
        onPress={() => setOpen(!open)}
        activeOpacity={0.8}
      >
        <Text style={[tpS.value, { color: value ? colors.textPrimary : colors.textSecondary }]}>
          {value ? formatTime12(value) : 'Select'}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textSecondary} />
      </TouchableOpacity>
      {open && (
        <View style={[tpS.dropdown, Shadow.md, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {TIME_OPTIONS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[tpS.option, { borderBottomColor: colors.border }, value === t && { backgroundColor: colors.tealLight }]}
                onPress={() => { onChange(t); setOpen(false); }}
              >
                <Text style={[tpS.optionText, { color: value === t ? colors.teal : colors.textPrimary }]}>
                  {formatTime12(t)}
                </Text>
                {value === t && <Ionicons name="checkmark" size={14} color={colors.teal} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const tpS = StyleSheet.create({
  label: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.xs, marginBottom: 6 },
  btn: {
    height: 44,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.sm },
  dropdown: {
    position: 'absolute',
    top: 66,
    left: 0,
    right: 0,
    borderRadius: Radius.sm,
    borderWidth: 1,
    zIndex: 999,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[3],
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
  optionText: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.base },
});

// ─── Day slot card ────────────────────────────────────────────────
function DaySlotCard({ day, slot, onChange, colors }) {
  const isActive = slot?.is_active ?? false;

  return (
    <View style={[dayS.card, Shadow.sm, { backgroundColor: colors.surface }]}>
      {/* Day row */}
      <View style={dayS.topRow}>
        <View style={dayS.dayInfo}>
          <View style={[dayS.dayBadge, { backgroundColor: isActive ? colors.tealLight : colors.neutral100 ?? '#F1F3F5' }]}>
            <Text style={[dayS.dayShort, { color: isActive ? colors.teal : colors.textSecondary }]}>
              {day.short}
            </Text>
          </View>
          <Text style={[dayS.dayLabel, { color: isActive ? colors.textPrimary : colors.textSecondary }]}>
            {day.label}
          </Text>
        </View>
        <Switch
          value={isActive}
          onValueChange={(v) => onChange({ ...slot, is_active: v, day_of_week: day.value })}
          trackColor={{ false: colors.border, true: colors.teal }}
          thumbColor="#FFFFFF"
        />
      </View>

      {/* Time pickers — only if active */}
      {isActive && (
        <View style={dayS.timeRow}>
          <TimePicker
            label="START TIME"
            value={slot?.start_time}
            onChange={(v) => onChange({ ...slot, start_time: v, day_of_week: day.value, is_active: true })}
            colors={colors}
          />
          <View style={{ width: Spacing[3] }} />
          <TimePicker
            label="END TIME"
            value={slot?.end_time}
            onChange={(v) => onChange({ ...slot, end_time: v, day_of_week: day.value, is_active: true })}
            colors={colors}
          />
        </View>
      )}
    </View>
  );
}

const dayS = StyleSheet.create({
  card: { borderRadius: Radius.lg, padding: Spacing[4], marginBottom: Spacing[3] },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  dayBadge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dayShort: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.sm },
  dayLabel: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.base },
  timeRow: { flexDirection: 'row', marginTop: Spacing[4], zIndex: 1 },
});

// ─── Main Screen ─────────────────────────────────────────────────
export default function AvailabilityScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [slots, setSlots] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const syncedKeyRef = useRef(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['doctor-availability'],
    queryFn: fetchAvailability,
  });

  useEffect(() => {
    if (!data || isDirty) return;
    const syncKey = JSON.stringify(data);
    if (syncedKeyRef.current === syncKey) return;
    syncedKeyRef.current = syncKey;

    const list = data?.slots ?? data ?? [];
    const map = {};
    list.forEach((s) => { map[s.day_of_week] = s; });
    const filled = DAYS.map((d) => map[d.value] ?? { day_of_week: d.value, start_time: '09:00:00', end_time: '17:00:00', is_active: false });
    setSlots(filled);
  }, [data, isDirty]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, []);

  const mutation = useMutation({
    mutationFn: () => updateAvailability(slots),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-availability'] });
      setIsDirty(false);
      Alert.alert('Saved', 'Your availability has been updated.');
    },
    onError: (err) => {
      Alert.alert('Error', err.message ?? 'Failed to save availability.');
    },
  });

  const handleSlotChange = (dayValue, updated) => {
    setSlots((prev) => prev.map((s) => s.day_of_week === dayValue ? { ...updated, day_of_week: dayValue } : s));
    setIsDirty(true);
  };

  const activeDays = slots?.filter((s) => s.is_active).length ?? 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (isDirty) {
              Alert.alert('Unsaved changes', 'You have unsaved changes. Discard them?', [
                { text: 'Keep editing', style: 'cancel' },
                { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
              ]);
            } else {
              navigation.goBack();
            }
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Availability</Text>
        <TouchableOpacity
          onPress={() => mutation.mutate()}
          disabled={!isDirty || mutation.isPending || !slots}
        >
          {mutation.isPending ? (
            <ActivityIndicator size="small" color={colors.teal} />
          ) : (
            <Text style={[styles.saveBtn, { color: isDirty ? colors.teal : colors.textSecondary }]}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {isLoading || !slots ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.teal} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.teal} />}
        >
          {/* Summary */}
          <View style={[styles.summaryCard, { backgroundColor: colors.tealLight }]}>
            <Ionicons name="calendar-outline" size={18} color={colors.teal} />
            <Text style={[styles.summaryText, { color: colors.tealDark ?? colors.teal }]}>
              {activeDays === 0
                ? 'No working days set. Toggle days below to add availability.'
                : `Working ${activeDays} day${activeDays > 1 ? 's' : ''} per week.`}
            </Text>
          </View>

          {/* Day cards */}
          {DAYS.map((day) => {
            const slot = slots.find((s) => s.day_of_week === day.value);
            return (
              <DaySlotCard
                key={day.value}
                day={day}
                slot={slot}
                onChange={(updated) => handleSlotChange(day.value, updated)}
                colors={colors}
              />
            );
          })}

          {/* Save button */}
          <TouchableOpacity
            style={[
              styles.saveFullBtn,
              { backgroundColor: isDirty && !mutation.isPending ? colors.coral : colors.border },
            ]}
            onPress={() => mutation.mutate()}
            disabled={!isDirty || mutation.isPending}
            activeOpacity={0.88}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveFullBtnText}>Save Availability</Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Changes take effect immediately. Existing appointments are not affected.
          </Text>

          <View style={{ height: Spacing[8] }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FontFamily.nunitoBold, fontSize: 18, flex: 1, textAlign: 'center' },
  saveBtn: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.base },
  scroll: { paddingHorizontal: Spacing[5], paddingTop: Spacing[4] },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: Spacing[4],
    borderRadius: Radius.md,
    marginBottom: Spacing[4],
  },
  summaryText: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.sm, flex: 1, lineHeight: 20 },
  saveFullBtn: {
    height: 54,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[3],
  },
  saveFullBtnText: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.md, color: '#FFFFFF' },
  hint: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs, textAlign: 'center', lineHeight: 18 },
});