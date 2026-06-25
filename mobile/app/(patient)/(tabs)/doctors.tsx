import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { listDoctors } from '@/api/doctors';
import { formatDoctorName } from '@/api/types';
import { BottomSheet } from '@/components/lumina/BottomSheet';
import { EmptyState } from '@/components/lumina/EmptyState';
import { LoadingSkeleton } from '@/components/lumina/ErrorState';
import { DoctorCard } from '@/components/lumina/PatientCard';
import { SearchBar } from '@/components/lumina/SearchBar';
import { SheetOptionRow, SheetSectionLabel } from '@/components/lumina/SheetOptionRow';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { triggerHaptic } from '@/utils/haptics';

const SPECIALIZATIONS = ['All', 'Cardiology', 'Pediatrics', 'Dermatology', 'General Medicine', 'Neurology', 'Orthopedics', 'Psychiatry'];

const SPEC_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  All: 'layers-outline',
  Cardiology: 'heart-outline',
  Pediatrics: 'happy-outline',
  Dermatology: 'sunny-outline',
  'General Medicine': 'medical-outline',
  Neurology: 'pulse-outline',
  Orthopedics: 'body-outline',
  Psychiatry: 'mind-outline',
};

export default function DoctorsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useLuminaTheme({ role: 'patient' });
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [draftSpecialty, setDraftSpecialty] = useState('All');
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const hasActiveFilter = selectedSpecialty !== 'All';

  const { data, isLoading } = useQuery({
    queryKey: ['doctors', search, selectedSpecialty],
    queryFn: () =>
      listDoctors({
        search: search || undefined,
        specialization: selectedSpecialty !== 'All' ? selectedSpecialty : undefined,
      }),
  });

  const doctors = data?.items ?? [];

  const openFilter = () => {
    triggerHaptic('light');
    setDraftSpecialty(selectedSpecialty);
    setShowFilterSheet(true);
  };

  const applyFilter = () => {
    triggerHaptic('medium');
    setSelectedSpecialty(draftSpecialty);
    setShowFilterSheet(false);
  };

  const clearFilter = () => {
    setSelectedSpecialty('All');
    setDraftSpecialty('All');
    setShowFilterSheet(false);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
            Find care
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Trusted specialists · book in minutes
          </Text>
        </View>
        <Pressable
          style={[
            styles.filterBtn,
            {
              backgroundColor: hasActiveFilter ? colors.coralSoft : colors.surface,
              borderColor: hasActiveFilter ? colors.coral : colors.border,
            },
            LuminaShadow.sm,
          ]}
          onPress={openFilter}
          accessibilityLabel="Filter specialization"
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={hasActiveFilter ? colors.coral : colors.textSecondary}
          />
          {hasActiveFilter ? (
            <View style={[styles.filterDot, { backgroundColor: colors.coral }]} />
          ) : null}
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search name or specialty..."
        />
      </View>

      {/* Active filter banner */}
      {hasActiveFilter ? (
        <Pressable
          onPress={openFilter}
          style={[styles.filterBanner, { backgroundColor: colors.coralSoft, borderColor: colors.coral + '33' }]}
        >
          <Ionicons name="funnel-outline" size={13} color={colors.coral} />
          <Text style={[styles.filterBannerText, { color: colors.coral }]}>{selectedSpecialty}</Text>
          <Pressable onPress={clearFilter} hitSlop={8}>
            <Ionicons name="close" size={15} color={colors.coral} />
          </Pressable>
        </Pressable>
      ) : null}

      {/* Doctor list */}
      {isLoading ? (
        <LoadingSkeleton count={4} />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={doctors}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="medical-outline"
              title="No doctors found"
              message="Try a different specialty or search term."
              actionLabel="Clear filters"
              onAction={clearFilter}
              role="patient"
            />
          }
          renderItem={({ item }) => (
            <DoctorCard
              name={formatDoctorName(item.full_name ?? item.user?.full_name)}
              specialty={item.specialization}
              fee={item.consultation_fee}
              onPress={() => router.push(`/(patient)/doctors/${item.id}`)}
              onBook={() => router.push({ pathname: '/(patient)/book', params: { doctorId: String(item.id) } })}
            />
          )}
        />
      )}

      {/* Specialization filter sheet */}
      <BottomSheet visible={showFilterSheet} onClose={() => setShowFilterSheet(false)} height={540}>
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>Specialization</Text>
          <Pressable onPress={() => setShowFilterSheet(false)} hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          <SheetSectionLabel label="Select specialty" />
          {SPECIALIZATIONS.map((spec) => (
            <SheetOptionRow
              key={spec}
              icon={SPEC_ICONS[spec] ?? 'medical-outline'}
              label={spec}
              selected={draftSpecialty === spec}
              onPress={() => setDraftSpecialty(spec)}
              role="patient"
            />
          ))}
        </ScrollView>

        <View style={[styles.sheetFooter, { borderTopColor: colors.border }]}>
          <Pressable
            onPress={() => setDraftSpecialty('All')}
            style={[styles.sheetSecBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.sheetSecText, { color: colors.textSecondary }]}>Reset</Text>
          </Pressable>
          <Pressable
            onPress={applyFilter}
            style={[styles.sheetPriBtn, { backgroundColor: colors.coral }]}
          >
            <Text style={styles.sheetPriText}>Apply</Text>
          </Pressable>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: LuminaSpacing.xl,
    paddingBottom: LuminaSpacing.md,
    gap: LuminaSpacing.md,
  },
  title: {
    fontFamily: LuminaFontFamily.nunitoBold,
    fontSize: 26,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 14,
    marginTop: 3,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: LuminaRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  filterDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  searchWrap: {
    paddingHorizontal: LuminaSpacing.xl,
    marginBottom: LuminaSpacing.sm,
  },
  filterBanner: {
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
  filterBannerText: {
    flex: 1,
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: LuminaSpacing.xl,
    paddingBottom: 120,
    paddingTop: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LuminaSpacing.xl,
    paddingBottom: LuminaSpacing.sm,
  },
  sheetTitle: { fontFamily: LuminaFontFamily.nunitoBold, fontSize: 20 },
  sheetScroll: { maxHeight: 380 },
  sheetContent: { paddingHorizontal: LuminaSpacing.xl, paddingBottom: LuminaSpacing.md },
  sheetFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: LuminaSpacing.xl,
    paddingTop: LuminaSpacing.md,
    borderTopWidth: 1,
  },
  sheetSecBtn: {
    flex: 1,
    height: 48,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSecText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 15 },
  sheetPriBtn: {
    flex: 2,
    height: 48,
    borderRadius: LuminaRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetPriText: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 15, color: '#FFFFFF' },
});
