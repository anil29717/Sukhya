import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../hooks/useTheme';
import { FontFamily, FontSize } from '../../../theme/typography';
import { Spacing, Radius, Shadow } from '../../../theme/spacing';
import { apiFetch } from '../../../api/client';
import { formatShortDate, formatFullDate } from '../../../utils/format';

// ─── API ──────────────────────────────────────────────────────────
const fetchLeaves  = () => apiFetch('/doctors/me/leaves');
const addLeave     = (payload) => apiFetch('/doctors/me/leaves', { method: 'POST', body: JSON.stringify(payload) });
const deleteLeave  = (id) => apiFetch(`/doctors/me/leaves/${id}`, { method: 'DELETE' });

const leaveStartDate = (item) => item.start_date ?? item.leave_date;
const leaveEndDate = (item) => item.end_date ?? item.start_date ?? item.leave_date;

const formatLeaveRange = (item) => {
  const start = leaveStartDate(item);
  const end = leaveEndDate(item);
  if (!start) return '—';
  if (end && end !== start) return `${formatFullDate(start)} – ${formatFullDate(end)}`;
  return formatFullDate(start);
};

// ─── Date strip ───────────────────────────────────────────────────
function DateStrip({ selectedDate, onSelect, colors }) {
  const days = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
    >
      {days.map((d) => {
        const iso = d.toISOString().split('T')[0];
        const isSelected = selectedDate === iso;
        const isToday = i === 0;
        return (
          <TouchableOpacity
            key={iso}
            style={[
              dsS.cell,
              {
                backgroundColor: isSelected ? colors.coral : colors.surface,
                borderColor: isSelected ? colors.coral : isToday ? colors.teal : colors.border,
                borderWidth: isSelected || isToday ? 1.5 : 1,
              },
            ]}
            onPress={() => onSelect(iso === selectedDate ? '' : iso)}
            activeOpacity={0.8}
          >
            <Text style={[dsS.dayName, { color: isSelected ? 'rgba(255,255,255,0.8)' : colors.textSecondary }]}>
              {dayNames[d.getDay()]}
            </Text>
            <Text style={[dsS.dayNum, { color: isSelected ? '#FFFFFF' : isToday ? colors.teal : colors.textPrimary }]}>
              {d.getDate()}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const dsS = StyleSheet.create({
  cell: { width: 48, height: 62, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', gap: 3 },
  dayName: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs },
  dayNum: { fontFamily: FontFamily.dmMonoMedium, fontSize: 15 },
});

// ─── Add leave bottom sheet ───────────────────────────────────────
function AddLeaveSheet({ visible, onClose, onSave, colors }) {
  const slideAnim = useState(new Animated.Value(400))[0];
  const [selectedDate, setSelectedDate] = useState('');
  const [reason, setReason] = useState('');
  const [focused, setFocused] = useState(false);

  useState(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 400, duration: 220, useNativeDriver: true }).start();
    }
  });

  const handleSave = () => {
    if (!selectedDate) { Alert.alert('Select a date', 'Please select a leave date.'); return; }
    onSave({ start_date: selectedDate, end_date: selectedDate, reason: reason.trim() || undefined });
    setSelectedDate('');
    setReason('');
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={sheetS.backdrop} onTouchEnd={onClose} />
      <Animated.View style={[sheetS.sheet, { backgroundColor: colors.surface, transform: [{ translateY: slideAnim }] }]}>
        <View style={sheetS.handleWrap}>
          <View style={[sheetS.handle, { backgroundColor: colors.border }]} />
        </View>

        <View style={sheetS.titleRow}>
          <Text style={[sheetS.title, { color: colors.textPrimary }]}>Add Leave Day</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[sheetS.divider, { backgroundColor: colors.border }]} />

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={[sheetS.label, { color: colors.teal }]}>SELECT DATE</Text>
          <DateStrip selectedDate={selectedDate} onSelect={setSelectedDate} colors={colors} />
          {selectedDate && (
            <View style={[sheetS.selectedInfo, { backgroundColor: colors.tealLight }]}>
              <Ionicons name="calendar-outline" size={15} color={colors.teal} />
              <Text style={[sheetS.selectedText, { color: colors.teal }]}>
                {formatFullDate(selectedDate)}
              </Text>
            </View>
          )}

          <Text style={[sheetS.label, { color: colors.teal, marginTop: Spacing[4] }]}>
            REASON (OPTIONAL)
          </Text>
          <View style={[sheetS.input, { backgroundColor: colors.bg, borderColor: focused ? colors.teal : colors.border, borderWidth: focused ? 1.5 : 1 }]}>
            <TextInput
              style={[sheetS.inputText, { color: colors.textPrimary, fontFamily: FontFamily.dmSansRegular }]}
              placeholder="e.g. Personal leave, Conference attendance..."
              placeholderTextColor={colors.textSecondary}
              value={reason}
              onChangeText={setReason}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoCapitalize="sentences"
            />
          </View>

          <View style={[sheetS.divider, { backgroundColor: colors.border, marginVertical: Spacing[4] }]} />

          <TouchableOpacity
            style={[sheetS.saveBtn, { backgroundColor: selectedDate ? colors.coral : colors.border }]}
            onPress={handleSave}
            disabled={!selectedDate}
            activeOpacity={0.88}
          >
            <Text style={sheetS.saveBtnText}>Add Leave Day</Text>
          </TouchableOpacity>

          <View style={{ height: Spacing[8] }} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const sheetS = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.50)' },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingHorizontal: Spacing[5],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 20,
  },
  handleWrap: { alignItems: 'center', paddingTop: 14, paddingBottom: 4 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing[3] },
  title: { fontFamily: FontFamily.nunitoSemiBold, fontSize: 18 },
  divider: { height: 1 },
  label: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.xs, letterSpacing: 0.8, marginBottom: Spacing[3], marginTop: Spacing[3] },
  selectedInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing[3], borderRadius: Radius.sm, marginTop: Spacing[2] },
  selectedText: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.sm },
  input: { height: 52, borderRadius: Radius.sm, paddingHorizontal: Spacing[3], justifyContent: 'center' },
  inputText: { fontSize: FontSize.base },
  saveBtn: { height: 54, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.md, color: '#FFFFFF' },
});

// ─── Leave row ────────────────────────────────────────────────────
function LeaveRow({ item, onDelete, colors }) {
  const start = leaveStartDate(item);
  const isPast = start ? new Date(leaveEndDate(item)) < new Date(new Date().toDateString()) : false;
  return (
    <View style={[leaveS.row, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={[leaveS.dateBadge, { backgroundColor: isPast ? colors.neutral100 ?? '#F1F3F5' : colors.coralLight }]}>
        <Text style={[leaveS.dateDay, { color: isPast ? colors.textSecondary : colors.coral }]}>
          {start ? new Date(start).getDate() : '—'}
        </Text>
        <Text style={[leaveS.dateMonth, { color: isPast ? colors.textSecondary : colors.coral }]}>
          {start ? new Date(start).toLocaleString('default', { month: 'short' }) : ''}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[leaveS.dateText, { color: isPast ? colors.textSecondary : colors.textPrimary }]}>
          {formatLeaveRange(item)}
        </Text>
        {item.reason && (
          <Text style={[leaveS.reason, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.reason}
          </Text>
        )}
        {isPast && (
          <Text style={[leaveS.pastLabel, { color: colors.textSecondary }]}>Past</Text>
        )}
      </View>
      {!isPast && (
        <TouchableOpacity
          onPress={() => onDelete(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[leaveS.deleteBtn, { backgroundColor: colors.errorBg }]}
        >
          <Ionicons name="trash-outline" size={15} color={colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const leaveS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing[3], borderBottomWidth: 1, gap: Spacing[3] },
  dateBadge: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  dateDay: { fontFamily: FontFamily.dmMonoMedium, fontSize: 16, lineHeight: 18 },
  dateMonth: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs },
  dateText: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.base, marginBottom: 2 },
  reason: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs },
  pastLabel: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs, fontStyle: 'italic' },
  deleteBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});

// ─── Main Screen ─────────────────────────────────────────────────
export default function LeaveManagementScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const [showSheet, setShowSheet] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['doctor-leaves'],
    queryFn: fetchLeaves,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, []);

  const addMutation = useMutation({
    mutationFn: addLeave,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-leaves'] });
      setShowSheet(false);
    },
    onError: (err) => Alert.alert('Error', err.message ?? 'Failed to add leave.'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLeave,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['doctor-leaves'] }),
    onError: (err) => Alert.alert('Error', err.message ?? 'Failed to delete leave.'),
  });

  const handleDelete = (id) => {
    Alert.alert('Remove leave?', 'This leave day will be removed and patients can book on this date.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  const leaves = data?.items ?? data ?? [];
  const todayStart = new Date(new Date().toDateString());
  const upcoming = leaves.filter((l) => leaveEndDate(l) && new Date(leaveEndDate(l)) >= todayStart);
  const past = leaves.filter((l) => leaveEndDate(l) && new Date(leaveEndDate(l)) < todayStart);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Leave Management</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.coral }]}
          onPress={() => setShowSheet(true)}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
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
          {/* Info card */}
          <View style={[styles.infoCard, { backgroundColor: colors.tealLight }]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.teal} />
            <Text style={[styles.infoText, { color: colors.tealDark ?? colors.teal }]}>
              Patients cannot book appointments on leave days. Existing appointments are not affected.
            </Text>
          </View>

          {/* Upcoming leaves */}
          <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardLabel, { color: colors.teal }]}>UPCOMING LEAVES</Text>
              <Text style={[styles.cardCount, { color: colors.textSecondary }]}>{upcoming.length} days</Text>
            </View>
            {upcoming.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No upcoming leave days. Tap + to add one.
              </Text>
            ) : (
              upcoming.map((l) => (
                <LeaveRow key={l.id} item={l} onDelete={handleDelete} colors={colors} />
              ))
            )}
          </View>

          {/* Past leaves */}
          {past.length > 0 && (
            <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardLabel, { color: colors.teal }]}>PAST LEAVES</Text>
                <Text style={[styles.cardCount, { color: colors.textSecondary }]}>{past.length} days</Text>
              </View>
              {past.map((l) => (
                <LeaveRow key={l.id} item={l} onDelete={() => {}} colors={colors} />
              ))}
            </View>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      <AddLeaveSheet
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        onSave={(payload) => addMutation.mutate(payload)}
        colors={colors}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[5], paddingVertical: Spacing[3], borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FontFamily.nunitoBold, fontSize: 18, flex: 1, textAlign: 'center' },
  addBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: Spacing[5], paddingTop: Spacing[4] },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: Spacing[3], borderRadius: Radius.md, marginBottom: Spacing[4] },
  infoText: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.sm, lineHeight: 20, flex: 1 },
  card: { borderRadius: Radius.lg, padding: Spacing[4], marginBottom: Spacing[3] },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing[3] },
  cardLabel: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.xs, letterSpacing: 0.8 },
  cardCount: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs },
  emptyText: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.sm, paddingVertical: Spacing[3] },
});