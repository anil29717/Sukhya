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
const fetchSettings  = () => apiFetch('/doctors/me/scheduling');
const updateSettings = (payload) =>
  apiFetch('/doctors/me/scheduling', { method: 'PUT', body: JSON.stringify(payload) });

// ─── Stepper ─────────────────────────────────────────────────────
function Stepper({ value, min, max, step = 1, onChange, unit, colors }) {
  return (
    <View style={stepS.row}>
      <TouchableOpacity
        style={[stepS.btn, { backgroundColor: colors.neutral100 ?? '#F1F3F5', borderColor: colors.border }]}
        onPress={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        activeOpacity={0.75}
      >
        <Ionicons name="remove" size={18} color={value <= min ? colors.textSecondary : colors.textPrimary} />
      </TouchableOpacity>

      <View style={[stepS.valueWrap, { backgroundColor: colors.tealLight }]}>
        <Text style={[stepS.value, { color: colors.teal }]}>{value}</Text>
        {unit && <Text style={[stepS.unit, { color: colors.tealDark ?? colors.teal }]}>{unit}</Text>}
      </View>

      <TouchableOpacity
        style={[stepS.btn, { backgroundColor: colors.neutral100 ?? '#F1F3F5', borderColor: colors.border }]}
        onPress={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
        activeOpacity={0.75}
      >
        <Ionicons name="add" size={18} color={value >= max ? colors.textSecondary : colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const stepS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueWrap: {
    minWidth: 80,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: Spacing[3],
  },
  value: { fontFamily: FontFamily.dmMonoMedium, fontSize: 20 },
  unit: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs, marginTop: 3 },
});

// ─── Setting row ─────────────────────────────────────────────────
function SettingRow({ icon, iconBg, iconColor, title, description, children, colors }) {
  return (
    <View style={[rowS.row, { borderBottomColor: colors.border }]}>
      <View style={[rowS.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={17} color={iconColor} />
      </View>
      <View style={rowS.texts}>
        <Text style={[rowS.title, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[rowS.desc, { color: colors.textSecondary }]}>{description}</Text>
      </View>
      {children}
    </View>
  );
}

const rowS = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    gap: Spacing[3],
  },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  texts: { flex: 1 },
  title: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.base, marginBottom: 3 },
  desc: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs, lineHeight: 16 },
});

// ─── Info card ────────────────────────────────────────────────────
function InfoCard({ icon, text, colors }) {
  return (
    <View style={[infoS.card, { backgroundColor: colors.tealLight }]}>
      <Ionicons name={icon} size={15} color={colors.teal} style={{ marginTop: 1 }} />
      <Text style={[infoS.text, { color: colors.tealDark ?? colors.teal }]}>{text}</Text>
    </View>
  );
}

const infoS = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: Spacing[3], borderRadius: Radius.sm },
  text: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs, lineHeight: 18, flex: 1 },
});

// ─── Main Screen ─────────────────────────────────────────────────
export default function SchedulingSettingsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Settings state
  const [bufferTime, setBufferTime]   = useState(0);   // minutes
  const [maxPerDay, setMaxPerDay]     = useState(20);  // appointments
  const [slotDuration, setSlotDuration] = useState(30); // minutes
  const syncedKeyRef = useRef(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['doctor-scheduling'],
    queryFn: fetchSettings,
  });

  useEffect(() => {
    if (!data || isDirty) return;
    const syncKey = JSON.stringify(data);
    if (syncedKeyRef.current === syncKey) return;
    syncedKeyRef.current = syncKey;

    setBufferTime(data?.slot_buffer_minutes ?? 0);
    setMaxPerDay(data?.max_appointments_per_day ?? 20);
    setSlotDuration(data?.slot_duration_minutes ?? 30);
  }, [data, isDirty]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, []);

  const mutation = useMutation({
    mutationFn: () =>
      updateSettings({
        slot_buffer_minutes:      bufferTime,
        max_appointments_per_day: maxPerDay,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-scheduling'] });
      setIsDirty(false);
      Alert.alert('Saved', 'Scheduling settings updated successfully.');
    },
    onError: (err) => Alert.alert('Error', err.message ?? 'Failed to save settings.'),
  });

  const handleChange = (setter) => (value) => {
    setter(value);
    setIsDirty(true);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (isDirty) {
              Alert.alert('Unsaved changes', 'Discard changes?', [
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Scheduling Settings</Text>
        <TouchableOpacity
          onPress={() => mutation.mutate()}
          disabled={!isDirty || mutation.isPending}
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

      {isLoading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color={colors.teal} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.teal} />}
        >
          {/* Buffer time */}
          <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionLabel, { color: colors.teal }]}>APPOINTMENT BUFFER</Text>

            <SettingRow
              icon="timer-outline"
              iconBg="#E6F7F2"
              iconColor={colors.teal}
              title="Buffer time between appointments"
              description="Gap between one appointment ending and the next starting. Use this for notes, preparation, or rest."
              colors={colors}
            >
              <Stepper
                value={bufferTime}
                min={0}
                max={60}
                step={5}
                unit="min"
                onChange={handleChange(setBufferTime)}
                colors={colors}
              />
            </SettingRow>

            <View style={{ paddingTop: Spacing[3] }}>
              <InfoCard
                icon="information-circle-outline"
                text={bufferTime === 0
                  ? 'No buffer — back-to-back appointments allowed.'
                  : `${bufferTime} minutes gap after each appointment. Patients cannot book in this window.`}
                colors={colors}
              />
            </View>
          </View>

          {/* Max per day */}
          <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionLabel, { color: colors.teal }]}>DAILY LIMIT</Text>

            <SettingRow
              icon="people-outline"
              iconBg="#E0F2FE"
              iconColor="#0369A1"
              title="Maximum appointments per day"
              description="Once this limit is reached, no new bookings are accepted for that day."
              colors={colors}
            >
              <Stepper
                value={maxPerDay}
                min={1}
                max={50}
                step={1}
                unit="appts"
                onChange={handleChange(setMaxPerDay)}
                colors={colors}
              />
            </SettingRow>

            <View style={{ paddingTop: Spacing[3] }}>
              <InfoCard
                icon="information-circle-outline"
                text={`Patients can book up to ${maxPerDay} appointments per day. Adjust based on your capacity.`}
                colors={colors}
              />
            </View>
          </View>

          {/* Slot duration */}
          <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionLabel, { color: colors.teal }]}>SLOT DURATION</Text>

            <SettingRow
              icon="hourglass-outline"
              iconBg="#FEF3C7"
              iconColor="#B45309"
              title="Appointment slot duration"
              description="How long each appointment slot is. All available slots will use this duration."
              colors={colors}
            >
              <Stepper
                value={slotDuration}
                min={10}
                max={120}
                step={10}
                unit="min"
                onChange={handleChange(setSlotDuration)}
                colors={colors}
              />
            </SettingRow>

            <View style={{ paddingTop: Spacing[3] }}>
              <InfoCard
                icon="information-circle-outline"
                text={`Each appointment will be ${slotDuration} minutes long. Slots are automatically calculated from your availability.`}
                colors={colors}
              />
            </View>
          </View>

          {/* Summary */}
          <View style={[styles.summaryCard, { backgroundColor: colors.tealLight, borderColor: colors.teal + '30' }]}>
            <Text style={[styles.summaryTitle, { color: colors.teal }]}>Current Setup</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.teal }]}>{slotDuration}min</Text>
                <Text style={[styles.summaryLabel, { color: colors.tealDark ?? colors.teal }]}>Per slot</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.teal + '30' }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.teal }]}>{bufferTime}min</Text>
                <Text style={[styles.summaryLabel, { color: colors.tealDark ?? colors.teal }]}>Buffer</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.teal + '30' }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.teal }]}>{maxPerDay}</Text>
                <Text style={[styles.summaryLabel, { color: colors.tealDark ?? colors.teal }]}>Max/day</Text>
              </View>
            </View>
          </View>

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
              <Text style={styles.saveFullBtnText}>Save Settings</Text>
            )}
          </TouchableOpacity>

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
  card: { borderRadius: Radius.lg, padding: Spacing[4], marginBottom: Spacing[3] },
  sectionLabel: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.xs, letterSpacing: 0.8, marginBottom: Spacing[3] },
  summaryCard: {
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[4],
    borderWidth: 1,
  },
  summaryTitle: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.xs, letterSpacing: 0.8, marginBottom: Spacing[3] },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontFamily: FontFamily.dmMonoMedium, fontSize: 22, marginBottom: 3 },
  summaryLabel: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs },
  summaryDivider: { width: 1, height: 36 },
  saveFullBtn: { height: 54, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[3] },
  saveFullBtnText: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.md, color: '#FFFFFF' },
});

