import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/lumina/EmptyState';
import { LoadingSkeleton } from '@/components/lumina/ErrorState';
import { NotificationItem } from '@/components/lumina/NotificationItem';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { useNotifications } from '@/hooks/useNotifications';
import { LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

export default function NotificationsScreen() {
  const { colors } = useLuminaTheme({ role: 'patient' });
  const [refreshing, setRefreshing] = useState(false);

  const { items, unreadCount, dismiss, isLoading, refetch, isRefetching } = useNotifications();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Notifications" role="patient" />
      {unreadCount > 0 ? (
        <Text style={[styles.summary, { color: colors.textSecondary }]}>
          {unreadCount} unread · tap to mark as read
        </Text>
      ) : null}
      {isLoading ? (
        <LoadingSkeleton count={5} />
      ) : items.length === 0 ? (
        <EmptyState
          role="patient"
          icon="notifications-off-outline"
          title="All caught up"
          message="You're up to date. Appointment reminders and health updates will appear here."
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          onRefresh={onRefresh}
          refreshing={refreshing || isRefetching}
          renderItem={({ item }) => (
            <NotificationItem item={item} unread role="patient" onPress={() => dismiss(item)} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summary: { ...LuminaTypography.bodySmall, paddingHorizontal: LuminaSpacing.lg, marginBottom: LuminaSpacing.sm },
  list: { padding: LuminaSpacing.lg, paddingBottom: 40, gap: LuminaSpacing.md },
});
