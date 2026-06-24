import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  getTodayAppointments,
  getUpcomingAppointments,
  getAppointmentHistory,
} from '@/api/appointments';
import { Appointment, formatTime12 } from '@/api/types';
import { BottomSheet } from '@/components/lumina/BottomSheet';
import { EmptyState } from '@/components/lumina/EmptyState';
import { LoadingSkeleton } from '@/components/lumina/ErrorState';
import { SegmentedControl } from '@/components/lumina/SegmentedControl';
import { SheetOptionRow, SheetSectionLabel } from '@/components/lumina/SheetOptionRow';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { getStatusStyle } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { triggerHaptic } from '@/utils/haptics';

type Tab = 'today' | 'upcoming' | 'history';
type HistoryFilter = 'all' | 'completed' | 'cancelled';
type TodayFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

function formatFullDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr);
  const isToday = d.toDateString() === new Date().toDateString();
  if (isToday) return 'Today';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function groupByDate(appointments: Appointment[]) {
  const groups: Record<string, Appointment[]> = {};
  appointments.forEach((a) => {
    const key = a.appointment_date ?? 'Unknown';
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  });
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

function DoctorAppointmentCard({
  item,
  onPress,
  colors,
}: {
  item: Appointment;
  onPress: () => void;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
}) {
  const { color: statusColor, bg: statusBg } = getStatusStyle(item.status, colors);
  const isCancelled = item.status?.toLowerCase() === 'cancelled';
  const statusLabel = item.status.charAt(0).toUpperCase() + item.status.slice(1);

  return (
    <Pressable
      onPress={() => { triggerHaptic('light'); onPress(); }}
      style={({ pressed }) => [
        cardStyles.card,
        LuminaShadow.sm,
        { backgroundColor: colors.surface, opacity: isCancelled ? 0.65 : pressed ? 0.82 : 1 },
      ]}
    >
      <View style={[cardStyles.statusBar, { backgroundColor: statusColor }]} />
      <View style={cardStyles.inner}>
        <View style={cardStyles.row1}>
          <Text style={[cardStyles.time, { color: colors.text }]}>
            {item.start_time ? formatTime12(item.start_time) : '--:--'}
          </Text>
          <View style={[cardStyles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[cardStyles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
        <View style={cardStyles.row2}>
          <Text style={[cardStyles.patientName, { color: colors.text }]} numberOfLines={1}>
            {item.patient?.full_name ?? 'Patient'}
          </Text>
        </View>
        <View style={cardStyles.row3}>
          <Text style={[cardStyles.reason, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.reason ?? 'General consultation'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: LuminaRadius.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: LuminaSpacing.md,
  },
  statusBar: { width: 4 },
  inner: { flex: 1, padding: LuminaSpacing.md, gap: 6 },
  row1: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  time: { fontFamily: LuminaFontFamily.dmMonoMedium, fontSize: 14 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999 },
  statusText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 11 },
  row2: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  patientName: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 15, flex: 1 },
  row3: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reason: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 13, flex: 1 },
});

export default function DoctorAppointmentsTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useLuminaTheme({ role: 'doctor' });
  const [tab, setTab] = useState<Tab>('today');
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');
  const [todayFilter, setTodayFilter] = useState<TodayFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [draftSearch, setDraftSearch] = useState('');
  const [draftHistoryFilter, setDraftHistoryFilter] = useState<HistoryFilter>('all');
  const [draftTodayFilter, setDraftTodayFilter] = useState<TodayFilter>('all');

  const today = useQuery({ queryKey: ['appointments', 'today'], queryFn: getTodayAppointments, enabled: tab === 'today' });
  const upcoming = useQuery({
    queryKey: ['appointments', 'upcoming'],
    queryFn: () => getUpcomingAppointments(),
    enabled: tab === 'upcoming',
  });
  const history = useQuery({
    queryKey: ['appointments', 'history', historyFilter],
    queryFn: () =>
      getAppointmentHistory({
        page: 1,
        status: historyFilter === 'all' ? undefined : historyFilter,
      }),
    enabled: tab === 'history',
  });

  const activeQuery = tab === 'today' ? today : tab === 'upcoming' ? upcoming : history;
  const rawItems: Appointment[] = activeQuery.data?.items ?? [];

  const items = useMemo(() => {
    let result = rawItems;

    if (tab === 'today' && todayFilter !== 'all') {
      result = result.filter((a) => a.status?.toLowerCase() === todayFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a) =>
        (a.patient?.full_name ?? '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [rawItems, searchQuery, tab, todayFilter]);

  const hasActiveFilters = useMemo(() => {
    if (searchQuery.trim()) return true;
    if (tab === 'history' && historyFilter !== 'all') return true;
    if (tab === 'today' && todayFilter !== 'all') return true;
    return false;
  }, [searchQuery, tab, historyFilter, todayFilter]);

  const openFilterSheet = () => {
    triggerHaptic('light');
    setDraftSearch(searchQuery);
    setDraftHistoryFilter(historyFilter);
    setDraftTodayFilter(todayFilter);
    setShowFilterSheet(true);
  };

  const applyFilters = () => {
    triggerHaptic('medium');
    setSearchQuery(draftSearch.trim());
    setHistoryFilter(draftHistoryFilter);
    setTodayFilter(draftTodayFilter);
    setShowFilterSheet(false);
  };

  const resetFilters = () => {
    triggerHaptic('light');
    setDraftSearch('');
    setDraftHistoryFilter('all');
    setDraftTodayFilter('all');
  };

  const clearAllFilters = () => {
    resetFilters();
    setSearchQuery('');
    setHistoryFilter('all');
    setTodayFilter('all');
    setShowFilterSheet(false);
  };

  const onRefresh = useCallback(async () => {
    await activeQuery.refetch();
  }, [activeQuery]);

  const todayItems = today.data?.items ?? [];
  const todayStats = useMemo(
    () => [
      { label: `${todayItems.length} Total` },
      { label: `${todayItems.filter((a) => a.status === 'pending').length} Pending` },
      { label: `${todayItems.filter((a) => a.status === 'completed').length} Done` },
    ],
    [todayItems]
  );

  const renderListHeader = () => (
    <View>
      {tab === 'today' && (
        <>
          <View style={[styles.dateHeader, { borderBottomColor: colors.border }]}>
            <View style={[styles.dateDot, { backgroundColor: colors.teal }]} />
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              {formatFullDate(new Date().toISOString().split('T')[0])}
            </Text>
          </View>
          <View style={styles.summaryChips}>
            {todayStats.map((chip) => (
              <View
                key={chip.label}
                style={[styles.summaryChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={[styles.summaryChipText, { color: colors.textSecondary }]}>{chip.label}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {hasActiveFilters ? (
        <Pressable
          onPress={openFilterSheet}
          style={[styles.activeFilterBanner, { backgroundColor: colors.tealSoft, borderColor: colors.teal + '33' }]}
        >
          <Ionicons name="funnel-outline" size={14} color={colors.teal} />
          <Text style={[styles.activeFilterText, { color: colors.teal }]} numberOfLines={1}>
            {[
              searchQuery.trim() ? `"${searchQuery.trim()}"` : null,
              tab === 'history' && historyFilter !== 'all'
                ? historyFilter.charAt(0).toUpperCase() + historyFilter.slice(1)
                : null,
              tab === 'today' && todayFilter !== 'all'
                ? todayFilter.charAt(0).toUpperCase() + todayFilter.slice(1)
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          <Pressable onPress={clearAllFilters} hitSlop={8}>
            <Ionicons name="close" size={16} color={colors.teal} />
          </Pressable>
        </Pressable>
      ) : null}
    </View>
  );

  const emptyMessages: Record<Tab, { title: string; message: string; icon: 'calendar-outline' | 'document-text-outline' }> = {
    today: { title: 'No appointments today', message: 'Your schedule is clear. Enjoy your day!', icon: 'calendar-outline' },
    upcoming: { title: 'No upcoming appointments', message: 'You have no appointments scheduled ahead.', icon: 'calendar-outline' },
    history: { title: 'No history found', message: 'No appointments match your current filter.', icon: 'document-text-outline' },
  };

  const renderUpcomingGroups = () => {
    const groups = groupByDate(items);
    return groups.map(([date, groupItems]) => (
      <View key={date}>
        <View style={[styles.dateHeader, { borderBottomColor: colors.border }]}>
          <View style={[styles.dateDot, { backgroundColor: colors.teal }]} />
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>{formatShortDate(date)}</Text>
        </View>
        {groupItems.map((item) => (
          <DoctorAppointmentCard
            key={item.id}
            item={item}
            colors={colors}
            onPress={() => router.push(`/(doctor)/appointments/${item.id}` as never)}
          />
        ))}
      </View>
    ));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + LuminaSpacing.md }]}>
        <Text style={[styles.title, { color: colors.text }]}>Appointments</Text>
        <Pressable
          style={[
            styles.filterBtn,
            {
              backgroundColor: hasActiveFilters ? colors.tealSoft : colors.surface,
              borderColor: hasActiveFilters ? colors.teal : colors.border,
            },
          ]}
          onPress={openFilterSheet}
          accessibilityLabel="Filter appointments"
          accessibilityHint="Opens filter and search options"
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={hasActiveFilters ? colors.teal : colors.textSecondary}
          />
          {hasActiveFilters ? (
            <View style={[styles.filterDot, { backgroundColor: colors.teal }]} />
          ) : null}
        </Pressable>
      </View>

      <SegmentedControl
        segments={[
          { key: 'today' as Tab, label: 'Today' },
          { key: 'upcoming' as Tab, label: 'Upcoming' },
          { key: 'history' as Tab, label: 'History' },
        ]}
        active={tab}
        onChange={setTab}
        role="doctor"
      />

      {activeQuery.isLoading ? (
        <LoadingSkeleton count={3} />
      ) : tab === 'upcoming' && items.length > 0 ? (
        <FlatList
          data={[{ key: 'content' }]}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.list}
          ListHeaderComponent={renderListHeader}
          refreshControl={
            <RefreshControl refreshing={activeQuery.isRefetching} onRefresh={onRefresh} tintColor={colors.teal} />
          }
          renderItem={() => <>{renderUpcomingGroups()}</>}
        />
      ) : items.length === 0 ? (
        <View style={styles.list}>
          {renderListHeader()}
          <EmptyState
            icon={emptyMessages[tab].icon}
            title={emptyMessages[tab].title}
            message={emptyMessages[tab].message}
            role="doctor"
          />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListHeaderComponent={renderListHeader}
          refreshControl={
            <RefreshControl refreshing={activeQuery.isRefetching} onRefresh={onRefresh} tintColor={colors.teal} />
          }
          renderItem={({ item }) => (
            <DoctorAppointmentCard
              item={item}
              colors={colors}
              onPress={() => router.push(`/(doctor)/appointments/${item.id}` as never)}
            />
          )}
        />
      )}

      <BottomSheet visible={showFilterSheet} onClose={() => setShowFilterSheet(false)} height={480}>
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>Filter & Search</Text>
          <Pressable onPress={() => setShowFilterSheet(false)} hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SheetSectionLabel label="Search" />
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: colors.neutral100,
                borderColor: searchFocused ? colors.teal : 'transparent',
                borderWidth: searchFocused ? 1.5 : 0,
              },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color={searchFocused ? colors.teal : colors.textSecondary}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search by patient name..."
              placeholderTextColor={colors.textMuted}
              value={draftSearch}
              onChangeText={setDraftSearch}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              autoCapitalize="words"
              returnKeyType="search"
            />
            {draftSearch.length > 0 ? (
              <Pressable onPress={() => setDraftSearch('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          {tab === 'today' ? (
            <>
              <SheetSectionLabel label="Status" />
              {([
                { key: 'all' as TodayFilter, label: 'All statuses', icon: 'layers-outline' as const },
                { key: 'pending' as TodayFilter, label: 'Pending', icon: 'time-outline' as const },
                { key: 'confirmed' as TodayFilter, label: 'Confirmed', icon: 'checkmark-circle-outline' as const },
                { key: 'completed' as TodayFilter, label: 'Completed', icon: 'checkmark-done-outline' as const },
                { key: 'cancelled' as TodayFilter, label: 'Cancelled', icon: 'close-circle-outline' as const },
              ]).map((opt) => (
                <SheetOptionRow
                  key={opt.key}
                  icon={opt.icon}
                  label={opt.label}
                  selected={draftTodayFilter === opt.key}
                  onPress={() => setDraftTodayFilter(opt.key)}
                />
              ))}
            </>
          ) : null}

          {tab === 'history' ? (
            <>
              <SheetSectionLabel label="Status" />
              {([
                { key: 'all' as HistoryFilter, label: 'All appointments', icon: 'layers-outline' as const },
                { key: 'completed' as HistoryFilter, label: 'Completed', icon: 'checkmark-done-outline' as const },
                { key: 'cancelled' as HistoryFilter, label: 'Cancelled', icon: 'close-circle-outline' as const },
              ]).map((opt) => (
                <SheetOptionRow
                  key={opt.key}
                  icon={opt.icon}
                  label={opt.label}
                  selected={draftHistoryFilter === opt.key}
                  onPress={() => setDraftHistoryFilter(opt.key)}
                />
              ))}
            </>
          ) : null}

          {tab === 'upcoming' ? (
            <Text style={[styles.sheetHint, { color: colors.textSecondary }]}>
              Search narrows upcoming appointments by patient name.
            </Text>
          ) : null}
        </ScrollView>

        <View style={[styles.sheetFooter, { borderTopColor: colors.border }]}>
          <Pressable
            onPress={resetFilters}
            style={[styles.sheetSecondaryBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.sheetSecondaryText, { color: colors.textSecondary }]}>Reset</Text>
          </Pressable>
          <Pressable
            onPress={applyFilters}
            style={[styles.sheetPrimaryBtn, { backgroundColor: colors.teal }]}
          >
            <Text style={styles.sheetPrimaryText}>Apply filters</Text>
          </Pressable>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LuminaSpacing.xl,
    paddingBottom: LuminaSpacing.sm,
  },
  title: {
    fontFamily: LuminaFontFamily.nunitoBold,
    fontSize: 22,
    flex: 1,
  },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  list: { paddingHorizontal: LuminaSpacing.xl, paddingBottom: 100 },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: LuminaSpacing.sm,
    marginBottom: LuminaSpacing.sm,
    borderBottomWidth: 1,
  },
  dateDot: { width: 6, height: 6, borderRadius: 3 },
  dateText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 13 },
  summaryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: LuminaSpacing.md,
  },
  summaryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
  },
  summaryChipText: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 12 },
  activeFilterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1,
    marginBottom: LuminaSpacing.md,
  },
  activeFilterText: {
    flex: 1,
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 13,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: LuminaRadius.lg,
    paddingHorizontal: LuminaSpacing.md,
    gap: 8,
    marginBottom: LuminaSpacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: LuminaFontFamily.dmSansRegular,
    paddingVertical: 0,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LuminaSpacing.xl,
    paddingBottom: LuminaSpacing.sm,
  },
  sheetTitle: {
    fontFamily: LuminaFontFamily.nunitoBold,
    fontSize: 20,
  },
  sheetScroll: { maxHeight: 340 },
  sheetContent: {
    paddingHorizontal: LuminaSpacing.xl,
    paddingBottom: LuminaSpacing.md,
  },
  sheetHint: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: LuminaSpacing.sm,
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: LuminaSpacing.xl,
    paddingTop: LuminaSpacing.md,
    borderTopWidth: 1,
  },
  sheetSecondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSecondaryText: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 15,
  },
  sheetPrimaryBtn: {
    flex: 2,
    height: 48,
    borderRadius: LuminaRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetPrimaryText: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
