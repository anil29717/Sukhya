import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { listFamilyMembers, createFamilyMember } from '@/api/family';
import { FamilyMember } from '@/api/types';
import { BottomSheet } from '@/components/lumina/BottomSheet';
import { EmptyState } from '@/components/lumina/EmptyState';
import { LoadingSkeleton } from '@/components/lumina/ErrorState';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { useActivePatient } from '@/hooks/useActivePatient';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { triggerHaptic } from '@/utils/haptics';

const RELATIONSHIPS = [
  { key: 'parent', label: 'Parent', icon: 'people-outline' as const, color: '#0D9B76', bg: '#D1FAE5' },
  { key: 'child', label: 'Child', icon: 'happy-outline' as const, color: '#0BA5EC', bg: '#E0F2FE' },
  { key: 'spouse', label: 'Spouse', icon: 'heart-outline' as const, color: '#F05A2A', bg: '#FEF0EB' },
  { key: 'sibling', label: 'Sibling', icon: 'git-branch-outline' as const, color: '#7C3AED', bg: '#EDE9FE' },
  { key: 'other', label: 'Other', icon: 'person-outline' as const, color: '#868E96', bg: '#F1F3F5' },
];

function getMemberDisplayName(member: FamilyMember): string {
  return (
    member.full_name?.trim() ||
    member.nickname?.trim() ||
    member.dependent?.display_name?.trim() ||
    'Family member'
  );
}

function getInitials(name?: string | null) {
  const safe = (name ?? '').trim();
  if (!safe) return '?';
  return safe
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';
}

function getRelationshipStyle(rel?: string | null) {
  const key = (rel ?? 'other').toLowerCase();
  return RELATIONSHIPS.find((r) => r.key === key) ?? RELATIONSHIPS[4];
}

function GuardianCard({
  isActive,
  onPress,
  colors,
}: {
  isActive: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
}) {
  return (
    <Pressable
      onPress={() => { triggerHaptic('light'); onPress(); }}
      style={({ pressed }) => [
        guardianStyles.wrap,
        LuminaShadow.md,
        {
          backgroundColor: colors.surface,
          borderColor: isActive ? colors.coral : 'rgba(255,255,255,0.65)',
          borderWidth: isActive ? 2 : 1,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={[guardianStyles.accent, { backgroundColor: colors.coral }]} />
      <View style={[guardianStyles.avatar, { backgroundColor: colors.coralSoft }]}>
        <Ionicons name="person" size={22} color={colors.coral} />
      </View>
      <View style={guardianStyles.body}>
        <Text style={[guardianStyles.title, { color: colors.text }]}>My profile</Text>
        <Text style={[guardianStyles.sub, { color: colors.textSecondary }]}>Your primary health account</Text>
      </View>
      {isActive ? (
        <View style={[guardianStyles.activeBadge, { backgroundColor: colors.coralSoft }]}>
          <View style={[guardianStyles.activeDot, { backgroundColor: colors.coral }]} />
          <Text style={[guardianStyles.activeText, { color: colors.coral }]}>Active</Text>
        </View>
      ) : (
        <View style={[guardianStyles.switchBtn, { backgroundColor: colors.neutral100 }]}>
          <Text style={[guardianStyles.switchText, { color: colors.textSecondary }]}>Switch</Text>
        </View>
      )}
    </Pressable>
  );
}

const guardianStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingRight: 14,
    borderRadius: LuminaRadius.xl,
    overflow: 'hidden',
    marginBottom: LuminaSpacing.lg,
  },
  accent: { width: 4, alignSelf: 'stretch' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  body: { flex: 1, gap: 2 },
  title: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 16 },
  sub: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 12 },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: LuminaRadius.full,
  },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  activeText: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 11 },
  switchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: LuminaRadius.full,
  },
  switchText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 12 },
});

function MemberCard({
  member,
  isActive,
  onPress,
  onSwitch,
  colors,
}: {
  member: FamilyMember;
  isActive: boolean;
  onPress: () => void;
  onSwitch: () => void;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
}) {
  const rel = getRelationshipStyle(member.relationship);
  const displayName = getMemberDisplayName(member);

  return (
    <Pressable
      onPress={() => { triggerHaptic('light'); onPress(); }}
      style={({ pressed }) => [
        memberStyles.wrap,
        LuminaShadow.sm,
        {
          backgroundColor: colors.surface,
          borderColor: isActive ? rel.color + '66' : 'rgba(255,255,255,0.65)',
          borderWidth: isActive ? 1.5 : 1,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={[memberStyles.accent, { backgroundColor: rel.color }]} />
      <View style={[memberStyles.avatar, { backgroundColor: rel.bg }]}>
        <Text style={[memberStyles.initials, { color: rel.color }]}>{getInitials(displayName)}</Text>
      </View>
      <View style={memberStyles.body}>
        <Text style={[memberStyles.name, { color: colors.text }]} numberOfLines={1}>
          {displayName}
        </Text>
        <View style={[memberStyles.relBadge, { backgroundColor: rel.bg }]}>
          <Ionicons name={rel.icon} size={10} color={rel.color} />
          <Text style={[memberStyles.relText, { color: rel.color }]}>
            {(member.relationship ?? 'other').charAt(0).toUpperCase() + (member.relationship ?? 'other').slice(1)}
          </Text>
        </View>
      </View>
      {isActive ? (
        <View style={[memberStyles.activeBadge, { backgroundColor: rel.bg }]}>
          <Text style={[memberStyles.activeText, { color: rel.color }]}>Active</Text>
        </View>
      ) : (
        <Pressable
          onPress={() => { triggerHaptic('light'); onSwitch(); }}
          style={[memberStyles.switchBtn, { backgroundColor: colors.neutral100 }]}
        >
          <Text style={[memberStyles.switchText, { color: rel.color }]}>Switch</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const memberStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingRight: 14,
    borderRadius: LuminaRadius.xl,
    overflow: 'hidden',
  },
  accent: { width: 4, alignSelf: 'stretch' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: LuminaRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    flexShrink: 0,
  },
  initials: { fontFamily: LuminaFontFamily.nunitoBold, fontSize: 16 },
  body: { flex: 1, gap: 5 },
  name: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 15 },
  relBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: LuminaRadius.full,
  },
  relText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 10 },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: LuminaRadius.full,
  },
  activeText: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 11 },
  switchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: LuminaRadius.full,
  },
  switchText: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 12 },
});

export default function FamilyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { colors } = useLuminaTheme({ role: 'patient' });
  const { switchToFamilyMember, switchToGuardian, activePatientId, guardianPatientId } = useActivePatient();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [fullName, setFullName] = useState('');
  const [relationship, setRelationship] = useState('child');
  const [nameFocused, setNameFocused] = useState(false);

  const { data: members, isLoading } = useQuery({
    queryKey: ['family-members'],
    queryFn: listFamilyMembers,
  });

  const createMutation = useMutation({
    mutationFn: () => createFamilyMember({ full_name: fullName.trim(), relationship }),
    onSuccess: () => {
      triggerHaptic('medium');
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      setSheetVisible(false);
      setFullName('');
      setRelationship('child');
    },
  });

  const isGuardianActive = activePatientId === guardianPatientId;
  const canAdd = !!fullName.trim();

  const openSheet = () => {
    triggerHaptic('light');
    setFullName('');
    setRelationship('child');
    setSheetVisible(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Family Management"
        subtitle={members?.length ? `${members.length + 1} profiles` : 'Manage family profiles'}
        role="patient"
        large
      />

      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : (
        <FlatList
          data={members ?? []}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <GuardianCard
                isActive={isGuardianActive}
                onPress={switchToGuardian}
                colors={colors}
              />
              {(members?.length ?? 0) > 0 ? (
                <Text style={[styles.sectionLabel, { color: colors.coral }]}>FAMILY MEMBERS</Text>
              ) : null}
            </>
          }
          ListEmptyComponent={
            <EmptyState
              role="patient"
              icon="people-outline"
              title="No family members yet"
              message="Add dependents to manage their appointments, records, and medications from one account."
              actionLabel="Add first member"
              onAction={openSheet}
            />
          }
          renderItem={({ item }) => {
            const pid = item.dependent?.patient_id;
            const isActive = pid != null && activePatientId === pid;
            return (
              <MemberCard
                member={item}
                isActive={isActive}
                colors={colors}
                onPress={() => router.push(`/(patient)/family/${item.id}`)}
                onSwitch={() => {
                  if (pid) switchToFamilyMember(pid, getMemberDisplayName(item));
                }}
              />
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}

      {/* Sticky add button */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, 16),
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Pressable
          onPress={openSheet}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: colors.coral, opacity: pressed ? 0.92 : 1 },
            styles.addBtnShadow,
          ]}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add family member</Text>
        </Pressable>
      </View>

      {/* Add member sheet */}
      <BottomSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} height={520} maxHeight="88%">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetBody}>
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Add family member</Text>
              <Text style={[styles.sheetHint, { color: colors.textSecondary }]}>
                Create a profile for a dependent
              </Text>
            </View>
            <Pressable
              onPress={() => setSheetVisible(false)}
              hitSlop={8}
              style={[styles.closeBtn, { backgroundColor: colors.neutral100 }]}
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.sheetSection, { color: colors.coral }]}>FULL NAME</Text>
            <View
              style={[
                styles.nameWrap,
                LuminaShadow.sm,
                {
                  backgroundColor: colors.neutral100,
                  borderColor: nameFocused ? colors.coral : 'transparent',
                  borderWidth: nameFocused ? 1.5 : 0,
                },
              ]}
            >
              <TextInput
                style={[styles.nameInput, { color: colors.text }]}
                placeholder="e.g. Priya Sharma"
                placeholderTextColor={colors.textHint}
                value={fullName}
                onChangeText={setFullName}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                autoFocus
              />
            </View>

            <Text style={[styles.sheetSection, { color: colors.coral, marginTop: LuminaSpacing.lg }]}>
              RELATIONSHIP
            </Text>
            <View style={styles.relGrid}>
              {RELATIONSHIPS.map((rel) => {
                const selected = relationship === rel.key;
                return (
                  <Pressable
                    key={rel.key}
                    onPress={() => { triggerHaptic('light'); setRelationship(rel.key); }}
                    style={[
                      styles.relTile,
                      LuminaShadow.sm,
                      {
                        backgroundColor: selected ? rel.bg : colors.neutral100,
                        borderColor: selected ? rel.color + '55' : 'transparent',
                        borderWidth: selected ? 1.5 : 0,
                      },
                    ]}
                  >
                    <View style={[styles.relIcon, { backgroundColor: selected ? rel.color + '22' : rel.bg }]}>
                      <Ionicons name={rel.icon} size={18} color={rel.color} />
                    </View>
                    <Text
                      style={[
                        styles.relLabel,
                        { color: selected ? rel.color : colors.textSecondary },
                        selected && { fontFamily: LuminaFontFamily.dmSansMedium },
                      ]}
                    >
                      {rel.label}
                    </Text>
                    {selected ? (
                      <View style={[styles.relCheck, { backgroundColor: rel.color }]}>
                        <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={[styles.sheetFooter, { borderTopColor: colors.border }]}>
            <Pressable
              onPress={() => canAdd && createMutation.mutate()}
              disabled={!canAdd || createMutation.isPending}
              style={[
                styles.sheetCta,
                {
                  backgroundColor: canAdd ? colors.coral : colors.neutral100,
                },
                canAdd && styles.addBtnShadow,
              ]}
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="person-add-outline"
                    size={20}
                    color={canAdd ? '#FFFFFF' : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.sheetCtaText,
                      { color: canAdd ? '#FFFFFF' : colors.textMuted },
                    ]}
                  >
                    Add member
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: LuminaSpacing.xl, paddingTop: LuminaSpacing.sm },
  sectionLabel: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: LuminaSpacing.xl,
    paddingTop: LuminaSpacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'transparent',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: LuminaRadius.lg,
    gap: 8,
  },
  addBtnShadow: {
    shadowColor: '#F05A2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
  addBtnText: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 16, color: '#FFFFFF' },

  sheetBody: { flex: 1 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: LuminaSpacing.xl,
    paddingBottom: LuminaSpacing.md,
    gap: 12,
  },
  sheetTitle: { fontFamily: LuminaFontFamily.nunitoBold, fontSize: 20 },
  sheetHint: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 13, marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScroll: { flex: 1 },
  sheetScrollContent: { paddingHorizontal: LuminaSpacing.xl, paddingBottom: LuminaSpacing.md },
  sheetSection: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  nameWrap: {
    borderRadius: LuminaRadius.xl,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: 'center',
  },
  nameInput: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 15,
    padding: 0,
  },
  relGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relTile: {
    width: '31%',
    flexGrow: 1,
    minWidth: '30%',
    maxWidth: '33%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: LuminaRadius.lg,
    gap: 6,
    position: 'relative',
  },
  relIcon: {
    width: 36,
    height: 36,
    borderRadius: LuminaRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  relLabel: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 11,
    textAlign: 'center',
  },
  relCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetFooter: {
    paddingHorizontal: LuminaSpacing.xl,
    paddingTop: LuminaSpacing.md,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sheetCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: LuminaRadius.lg,
    gap: 8,
  },
  sheetCtaText: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 16 },
});
