import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { searchPatients } from '@/api/patients';
import { calcAge } from '@/api/types';
import { BottomSheet } from '@/components/lumina/BottomSheet';
import { EmptyState } from '@/components/lumina/EmptyState';
import { LoadingSkeleton } from '@/components/lumina/ErrorState';
import { SearchBar } from '@/components/lumina/SearchBar';
import { PatientCard as LuminaPatientCard } from '@/components/lumina/PatientCard';
import { SheetOptionRow, SheetSectionLabel } from '@/components/lumina/SheetOptionRow';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { LuminaFontFamily, LuminaRadius, LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { triggerHaptic } from '@/utils/haptics';

type PatientFilter = 'all' | 'recent' | 'followup';
type PatientSort = 'name_asc' | 'name_desc' | 'recent_visit';

export default function DoctorPatientsTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useLuminaTheme({ role: 'doctor' });
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<PatientFilter>('all');
  const [sortBy, setSortBy] = useState<PatientSort>('name_asc');
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [draftFilter, setDraftFilter] = useState<PatientFilter>('all');
  const [draftSort, setDraftSort] = useState<PatientSort>('name_asc');
  const debouncedSearch = useDebouncedValue(search, 400);

  const { data, isLoading, isFetching, refetch, isRefetching } = useQuery({
    queryKey: ['patients', debouncedSearch],
    queryFn: () => searchPatients({ search: debouncedSearch || undefined, page: 1 }),
  });

  const patients = data?.items ?? [];
  const showSkeleton = isLoading || (isFetching && debouncedSearch !== search);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      if (activeFilter === 'followup') {
        return !!(p as { has_pending_followup?: boolean }).has_pending_followup;
      }
      if (activeFilter === 'recent') {
        const last = (p as { last_appointment_date?: string }).last_appointment_date;
        if (!last) return false;
        const diff = (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24);
        return diff <= 30;
      }
      return true;
    });
  }, [patients, activeFilter]);

  const sortedPatients = useMemo(() => {
    const list = [...filteredPatients];
    if (sortBy === 'name_asc') {
      list.sort((a, b) => a.full_name.localeCompare(b.full_name));
    } else if (sortBy === 'name_desc') {
      list.sort((a, b) => b.full_name.localeCompare(a.full_name));
    } else if (sortBy === 'recent_visit') {
      list.sort((a, b) => {
        const da = (a as { last_appointment_date?: string }).last_appointment_date ?? '';
        const db = (b as { last_appointment_date?: string }).last_appointment_date ?? '';
        return db.localeCompare(da);
      });
    }
    return list;
  }, [filteredPatients, sortBy]);

  const hasActiveSortFilter = activeFilter !== 'all' || sortBy !== 'name_asc';

  const openSortSheet = () => {
    triggerHaptic('light');
    setDraftFilter(activeFilter);
    setDraftSort(sortBy);
    setShowSortSheet(true);
  };

  const applySortFilter = () => {
    triggerHaptic('medium');
    setActiveFilter(draftFilter);
    setSortBy(draftSort);
    setShowSortSheet(false);
  };

  const resetSortFilter = () => {
    triggerHaptic('light');
    setDraftFilter('all');
    setDraftSort('name_asc');
  };

  const clearSortFilter = () => {
    resetSortFilter();
    setActiveFilter('all');
    setSortBy('name_asc');
    setShowSortSheet(false);
  };

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + LuminaSpacing.md }]}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
            My Patients
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            From your appointment history
          </Text>
        </View>
        <Pressable
          style={[
            styles.sortBtn,
            {
              backgroundColor: hasActiveSortFilter ? colors.tealSoft : colors.surface,
              borderColor: hasActiveSortFilter ? colors.teal : colors.border,
            },
          ]}
          onPress={openSortSheet}
          accessibilityLabel="Sort and filter patients"
          accessibilityHint="Opens sort and filter options"
        >
          <Ionicons
            name="swap-vertical-outline"
            size={18}
            color={hasActiveSortFilter ? colors.teal : colors.textSecondary}
          />
          {hasActiveSortFilter ? (
            <View style={[styles.sortDot, { backgroundColor: colors.teal }]} />
          ) : null}
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or condition..."
        />
      </View>

      {hasActiveSortFilter ? (
        <Pressable
          onPress={openSortSheet}
          style={[styles.activeFilterBanner, { backgroundColor: colors.tealSoft, borderColor: colors.teal + '33' }]}
        >
          <Ionicons name="options-outline" size={14} color={colors.teal} />
          <Text style={[styles.activeFilterText, { color: colors.teal }]} numberOfLines={1}>
            {[
              activeFilter === 'recent' ? 'Recent' : null,
              activeFilter === 'followup' ? 'Follow-up due' : null,
              sortBy === 'name_desc' ? 'Z → A' : null,
              sortBy === 'recent_visit' ? 'Recent visit' : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          <Pressable onPress={clearSortFilter} hitSlop={8}>
            <Ionicons name="close" size={16} color={colors.teal} />
          </Pressable>
        </Pressable>
      ) : null}

      {showSkeleton ? (
        <LoadingSkeleton count={6} />
      ) : filteredPatients.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title={debouncedSearch ? 'No patients found' : 'No patients yet'}
          message={
            debouncedSearch
              ? `No results for "${debouncedSearch}". Try a different name.`
              : 'Patients will appear here after your first appointments.'
          }
          role="doctor"
        />
      ) : (
        <FlatList
          style={styles.list}
          data={sortedPatients}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={colors.teal} />
          }
          renderItem={({ item }) => {
            const conditions = (item as { existing_conditions?: string }).existing_conditions
              ?.split(',')
              .map((c) => c.trim())
              .filter(Boolean) ?? [];

            return (
              <LuminaPatientCard
                name={item.full_name}
                age={calcAge(item.date_of_birth) ?? undefined}
                gender={item.gender ?? undefined}
                bloodGroup={item.blood_group ?? undefined}
                conditions={conditions}
                lastVisit={(item as { last_appointment_date?: string }).last_appointment_date}
                hasFollowUp={!!(item as { has_pending_followup?: boolean }).has_pending_followup}
                onPress={() => router.push(`/(doctor)/patients/${item.id}` as never)}
              />
            );
          }}
        />
      )}

      <BottomSheet visible={showSortSheet} onClose={() => setShowSortSheet(false)} height={520}>
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>Sort & Filter</Text>
          <Pressable onPress={() => setShowSortSheet(false)} hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          <SheetSectionLabel label="Filter by" />
          {([
            { key: 'all' as PatientFilter, label: 'All patients', subtitle: 'Everyone in your list', icon: 'people-outline' as const },
            { key: 'recent' as PatientFilter, label: 'Recent', subtitle: 'Visited in the last 30 days', icon: 'time-outline' as const },
            { key: 'followup' as PatientFilter, label: 'Follow-up due', subtitle: 'Pending follow-up appointments', icon: 'calendar-outline' as const },
          ]).map((opt) => (
            <SheetOptionRow
              key={opt.key}
              icon={opt.icon}
              label={opt.label}
              subtitle={opt.subtitle}
              selected={draftFilter === opt.key}
              onPress={() => setDraftFilter(opt.key)}
            />
          ))}

          <SheetSectionLabel label="Sort by" />
          {([
            { key: 'name_asc' as PatientSort, label: 'Name A → Z', icon: 'text-outline' as const },
            { key: 'name_desc' as PatientSort, label: 'Name Z → A', icon: 'text-outline' as const },
            { key: 'recent_visit' as PatientSort, label: 'Most recent visit', icon: 'calendar-outline' as const },
          ]).map((opt) => (
            <SheetOptionRow
              key={opt.key}
              icon={opt.icon}
              label={opt.label}
              selected={draftSort === opt.key}
              onPress={() => setDraftSort(opt.key)}
            />
          ))}
        </ScrollView>

        <View style={[styles.sheetFooter, { borderTopColor: colors.border }]}>
          <Pressable
            onPress={resetSortFilter}
            style={[styles.sheetSecondaryBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.sheetSecondaryText, { color: colors.textSecondary }]}>Reset</Text>
          </Pressable>
          <Pressable
            onPress={applySortFilter}
            style={[styles.sheetPrimaryBtn, { backgroundColor: colors.teal }]}
          >
            <Text style={styles.sheetPrimaryText}>Apply</Text>
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
    alignItems: 'flex-start',
    paddingHorizontal: LuminaSpacing.xl,
    paddingBottom: LuminaSpacing.sm,
    gap: LuminaSpacing.md,
  },
  headerText: { flex: 1 },
  title: { fontFamily: LuminaFontFamily.nunitoBold, fontSize: 22 },
  subtitle: { fontSize: 13, fontFamily: LuminaFontFamily.dmSansRegular, marginTop: 2 },
  sortBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  sortDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  searchWrap: { paddingHorizontal: LuminaSpacing.xl, marginBottom: LuminaSpacing.sm },
  activeFilterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: LuminaSpacing.xl,
    marginBottom: LuminaSpacing.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1,
  },
  activeFilterText: {
    flex: 1,
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 13,
  },
  list: { flex: 1 },
  listContent: { paddingHorizontal: LuminaSpacing.xl, paddingBottom: 100 },
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
  sheetScroll: { maxHeight: 380 },
  sheetContent: {
    paddingHorizontal: LuminaSpacing.xl,
    paddingBottom: LuminaSpacing.md,
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
