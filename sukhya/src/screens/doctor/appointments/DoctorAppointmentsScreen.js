import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../../hooks/useTheme';
import { FontFamily, FontSize } from '../../../theme/typography';
import { Spacing, Radius, Shadow } from '../../../theme/spacing';
import { apiFetch } from '../../../api/client';
import { formatTime, formatShortDate, formatFullDate, getPatientDisplayName } from '../../../utils/format';

const { width } = Dimensions.get('window');

// ─── API ──────────────────────────────────────────────────────────
const fetchToday    = () => apiFetch('/appointments/today');
const fetchUpcoming = () => apiFetch('/appointments/upcoming?page=1&page_size=50');
const fetchHistory  = () => apiFetch('/appointments/history?page=1&page_size=50');

// ─── Status config ────────────────────────────────────────────────
const STATUS = {
  pending:   { color: '#F79009', bg: '#FEF3C7', label: 'Pending' },
  confirmed: { color: '#0BA5EC', bg: '#E0F2FE', label: 'Confirmed' },
  completed: { color: '#12B76A', bg: '#DCFCE7', label: 'Completed' },
  cancelled: { color: '#F04438', bg: '#FEE2E2', label: 'Cancelled' },
};

// ─── Segmented control ────────────────────────────────────────────
function SegmentedControl({ tabs, activeIndex, onChange, colors }) {
  return (
    <View style={[segStyles.container, { backgroundColor: colors.neutral100 ?? '#F1F3F5' }]}>
      {tabs.map((tab, i) => (
        <TouchableOpacity
          key={tab}
          style={[
            segStyles.tab,
            activeIndex === i && { backgroundColor: colors.teal },
          ]}
          onPress={() => onChange(i)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              segStyles.tabText,
              { color: activeIndex === i ? '#FFFFFF' : colors.textSecondary },
              activeIndex === i && { fontFamily: FontFamily.dmSansMedium },
            ]}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const segStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    padding: 4,
    marginHorizontal: Spacing[5],
    marginBottom: Spacing[4],
  },
  tab: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
  },
});

// ─── Date group header ────────────────────────────────────────────
function DateGroupHeader({ date, colors }) {
  const isToday = new Date(date).toDateString() === new Date().toDateString();
  const label = isToday ? 'Today' : formatShortDate(date);
  return (
    <View style={[dgStyles.row, { borderBottomColor: colors.border }]}>
      <View style={[dgStyles.dot, { backgroundColor: colors.teal }]} />
      <Text style={[dgStyles.text, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const dgStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: Spacing[2],
    marginBottom: Spacing[2],
    borderBottomWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.sm,
  },
});

// ─── Filter chips (History tab) ───────────────────────────────────
function FilterChips({ options, active, onChange, colors }) {
  return (
    <View style={chipStyles.row}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          style={[
            chipStyles.chip,
            {
              backgroundColor: active === opt.value ? colors.teal : colors.surface,
              borderColor: active === opt.value ? colors.teal : colors.border,
            },
          ]}
          onPress={() => onChange(opt.value)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              chipStyles.chipText,
              { color: active === opt.value ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const chipStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[5],
    gap: 8,
    marginBottom: Spacing[3],
  },
  chip: {
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
  },
});

// ─── Appointment card (full version) ─────────────────────────────
function AppointmentCard({ item, onPress, onQuickAction, showActions, colors }) {
  const status = STATUS[item.status] ?? STATUS.pending;
  const isCancelledOrCompleted = item.status === 'cancelled' || item.status === 'completed';

  return (
    <TouchableOpacity
      style={[
        cardStyles.card,
        Shadow.sm,
        {
          backgroundColor: colors.surface,
          opacity: item.status === 'cancelled' ? 0.65 : 1,
        },
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.82}
    >
      {/* Left status bar */}
      <View style={[cardStyles.statusBar, { backgroundColor: status.color }]} />

      <View style={cardStyles.inner}>
        {/* Row 1: Time + Status badge */}
        <View style={cardStyles.row1}>
          <Text style={[cardStyles.time, { color: colors.textPrimary }]}>
            {item.start_time ? formatTime(item.start_time) : '--:--'}
          </Text>
          <View style={[cardStyles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[cardStyles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        {/* Row 2: Patient + token */}
        <View style={cardStyles.row2}>
          <Text style={[cardStyles.patientName, { color: colors.textPrimary }]} numberOfLines={1}>
            {getPatientDisplayName(item)}
          </Text>
          <View style={[cardStyles.tokenChip, { backgroundColor: colors.tealLight }]}>
            <Text style={[cardStyles.tokenText, { color: colors.teal }]}>
              Token #{item.token_number ?? '—'}
            </Text>
          </View>
        </View>

        {/* Row 3: Reason + duration */}
        <View style={cardStyles.row3}>
          <Text style={[cardStyles.reason, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.reason ?? 'General consultation'}
          </Text>
          <Text style={[cardStyles.duration, { color: colors.textSecondary }]}>30 min</Text>
        </View>

        {/* Action row — only for actionable statuses */}
        {showActions && !isCancelledOrCompleted && (
          <>
            <View style={[cardStyles.actionDivider, { backgroundColor: colors.border }]} />
            <View style={cardStyles.actionRow}>
              {item.status === 'pending' && (
                <TouchableOpacity
                  style={cardStyles.actionBtn}
                  onPress={() => onQuickAction('confirm', item)}
                >
                  <Text style={[cardStyles.actionText, { color: colors.teal }]}>Confirm</Text>
                </TouchableOpacity>
              )}
              {item.status === 'confirmed' && (
                <TouchableOpacity
                  style={cardStyles.actionBtn}
                  onPress={() => onQuickAction('complete', item)}
                >
                  <Text style={[cardStyles.actionText, { color: '#12B76A' }]}>Complete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={cardStyles.actionBtn}
                onPress={() => onQuickAction('reschedule', item)}
              >
                <Text style={[cardStyles.actionText, { color: colors.textSecondary }]}>
                  Reschedule
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: Spacing[3],
  },
  statusBar: { width: 4 },
  inner: {
    flex: 1,
    padding: Spacing[4],
  },
  row1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[2],
  },
  time: {
    fontFamily: FontFamily.dmMonoMedium,
    fontSize: FontSize.base,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  statusText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.xs,
  },
  row2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  patientName: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.base,
    flex: 1,
  },
  tokenChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tokenText: {
    fontFamily: FontFamily.dmMonoMedium,
    fontSize: FontSize.xs,
  },
  row3: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reason: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
    flex: 1,
  },
  duration: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
  },
  actionDivider: {
    height: 1,
    marginVertical: Spacing[3],
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing[5],
  },
  actionBtn: {
    paddingVertical: 2,
  },
  actionText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.sm,
  },
});

// ─── Empty state ──────────────────────────────────────────────────
function EmptyState({ icon, title, body, colors }) {
  return (
    <View style={emptyStyles.container}>
      <View style={[emptyStyles.icon, { backgroundColor: colors.tealLight }]}>
        <Ionicons name={icon} size={32} color={colors.teal} />
      </View>
      <Text style={[emptyStyles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[emptyStyles.body, { color: colors.textSecondary }]}>{body}</Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing[10],
    paddingHorizontal: Spacing[8],
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[4],
  },
  title: {
    fontFamily: FontFamily.nunitoSemiBold,
    fontSize: FontSize.md,
    marginBottom: Spacing[2],
    textAlign: 'center',
  },
  body: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});

// ─── Group appointments by date ───────────────────────────────────
function groupByDate(appointments) {
  const groups = {};
  appointments.forEach((a) => {
    const key = a.appointment_date ?? 'Unknown';
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  });
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

// ─── Main Screen ─────────────────────────────────────────────────
export default function DoctorAppointmentsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab]         = useState(0); // 0=Today, 1=Upcoming, 2=History
  const [historyFilter, setHistoryFilter] = useState('all');
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [refreshing, setRefreshing]       = useState(false);

  const tabs = ['Today', 'Upcoming', 'History'];

  const { data: todayData,    isLoading: lt, refetch: rt } = useQuery({ queryKey: ['appts-today'],    queryFn: fetchToday });
  const { data: upcomingData, isLoading: lu, refetch: ru } = useQuery({ queryKey: ['appts-upcoming'], queryFn: fetchUpcoming });
  const { data: historyData,  isLoading: lh, refetch: rh } = useQuery({ queryKey: ['appts-history'],  queryFn: fetchHistory });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([rt(), ru(), rh()]);
    setRefreshing(false);
  }, []);

  // Normalize list from response
  const normalize = (data) => data?.items ?? data ?? [];

  const todayList    = normalize(todayData);
  const upcomingList = normalize(upcomingData);
  const historyList  = normalize(historyData);

  // Filter history
  const filteredHistory = historyList.filter((a) => {
    const matchesFilter = historyFilter === 'all' || a.status === historyFilter;
    const matchesSearch = !searchQuery ||
      getPatientDisplayName(a).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleQuickAction = (action, item) => {
    if (action === 'reschedule') {
      navigation.navigate('Reschedule', { appointmentId: item.id });
    } else {
      navigation.navigate('DoctorAppointmentDetail', {
        appointmentId: item.id,
        autoAction: action,
      });
    }
  };

  const handleCardPress = (item) => {
    navigation.navigate('DoctorAppointmentDetail', { appointmentId: item.id });
  };

  // ── Today tab content ──
  const renderTodayContent = () => {
    if (lt) return <EmptyState icon="time-outline" title="Loading..." body="" colors={colors} />;

    const statsChips = [
      { label: `${todayList.length} Total`, icon: 'list-outline' },
      { label: `${todayList.filter(a => a.status === 'pending').length} Pending`, icon: 'time-outline' },
      { label: `${todayList.filter(a => a.status === 'completed').length} Done`, icon: 'checkmark-circle-outline' },
    ];

    return (
      <>
        {/* Date header */}
        <View style={[styles.dateHeader, { borderBottomColor: colors.border }]}>
          <View style={[styles.dateDot, { backgroundColor: colors.teal }]} />
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {formatFullDate(new Date().toISOString().split('T')[0])}
          </Text>
        </View>

        {/* Summary chips */}
        <View style={styles.summaryChips}>
          {statsChips.map((chip) => (
            <View key={chip.label} style={[styles.summaryChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.summaryChipText, { color: colors.textSecondary }]}>{chip.label}</Text>
            </View>
          ))}
        </View>

        {todayList.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No appointments today"
            body="Your schedule is clear. Enjoy your day!"
            colors={colors}
          />
        ) : (
          todayList.map((item) => (
            <AppointmentCard
              key={item.id}
              item={item}
              onPress={handleCardPress}
              onQuickAction={handleQuickAction}
              showActions
              colors={colors}
            />
          ))
        )}
      </>
    );
  };

  // ── Upcoming tab content ──
  const renderUpcomingContent = () => {
    if (lu) return <EmptyState icon="time-outline" title="Loading..." body="" colors={colors} />;
    if (upcomingList.length === 0) {
      return (
        <EmptyState
          icon="calendar-outline"
          title="No upcoming appointments"
          body="You have no appointments scheduled ahead."
          colors={colors}
        />
      );
    }
    const groups = groupByDate(upcomingList);
    return groups.map(([date, items]) => (
      <View key={date}>
        <DateGroupHeader date={date} colors={colors} />
        {items.map((item) => (
          <AppointmentCard
            key={item.id}
            item={item}
            onPress={handleCardPress}
            onQuickAction={handleQuickAction}
            showActions
            colors={colors}
          />
        ))}
      </View>
    ));
  };

  // ── History tab content ──
  const renderHistoryContent = () => {
    return (
      <>
        {/* Filter chips */}
        <FilterChips
          options={[
            { value: 'all',       label: 'All' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
          active={historyFilter}
          onChange={setHistoryFilter}
          colors={colors}
        />

        {/* Search */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surface,
              borderColor: searchFocused ? colors.teal : colors.border,
              borderWidth: searchFocused ? 1.5 : 1,
              marginHorizontal: Spacing[5],
              marginBottom: Spacing[4],
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={searchFocused ? colors.teal : colors.textSecondary}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary, fontFamily: FontFamily.dmSansRegular }]}
            placeholder="Search patient name..."
            placeholderTextColor={colors.textHint ?? colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {lh ? (
          <EmptyState icon="time-outline" title="Loading..." body="" colors={colors} />
        ) : filteredHistory.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title="No history found"
            body="No appointments match your current filter."
            colors={colors}
          />
        ) : (
          filteredHistory.map((item) => (
            <AppointmentCard
              key={item.id}
              item={item}
              onPress={handleCardPress}
              onQuickAction={handleQuickAction}
              showActions={false}
              colors={colors}
            />
          ))
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bg }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Appointments</Text>
        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {}}
        >
          <Ionicons name="options-outline" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Segmented control */}
      <SegmentedControl
        tabs={tabs}
        activeIndex={activeTab}
        onChange={setActiveTab}
        colors={colors}
      />

      {/* Content */}
      <FlatList
        data={[]}
        ListHeaderComponent={
          <View style={styles.listContent}>
            {activeTab === 0 && renderTodayContent()}
            {activeTab === 1 && renderUpcomingContent()}
            {activeTab === 2 && renderHistoryContent()}
            <View style={{ height: 100 }} />
          </View>
        }
        renderItem={null}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.teal}
            colors={[colors.teal]}
          />
        }
        keyExtractor={() => 'header'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[4],
  },
  headerTitle: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 22,
  },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── List content ──
  listContent: {
    paddingHorizontal: Spacing[5],
  },

  // ── Date header ──
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: Spacing[3],
    marginBottom: Spacing[3],
    borderBottomWidth: 1,
  },
  dateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dateText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.sm,
  },

  // ── Summary chips ──
  summaryChips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing[4],
  },
  summaryChip: {
    paddingHorizontal: 12,
    height: 30,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryChipText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
  },

  // ── Search bar ──
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[4],
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    height: '100%',
  },
});