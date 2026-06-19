import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Notification } from '@/api/types';
import { LuminaRadius, LuminaShadow, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { triggerHaptic } from '@/utils/haptics';

function iconForEventType(eventType: string): keyof typeof Ionicons.glyphMap {
  const t = eventType.toLowerCase();
  if (t.includes('appointment')) return 'calendar-outline';
  if (t.includes('medication') || t.includes('prescription')) return 'medkit-outline';
  if (t.includes('record') || t.includes('document')) return 'document-text-outline';
  if (t.includes('family')) return 'people-outline';
  if (t.includes('vital')) return 'pulse-outline';
  if (t.includes('follow')) return 'arrow-redo-outline';
  return 'notifications-outline';
}

type NotificationItemProps = {
  item: Notification;
  unread?: boolean;
  onPress?: () => void;
};

export function NotificationItem({ item, unread = true, onPress }: NotificationItemProps) {
  const { colors } = useLuminaTheme();
  const icon = iconForEventType(item.event_type);

  return (
    <Pressable
      style={[
        styles.card,
        LuminaShadow.sm,
        {
          backgroundColor: unread ? colors.primarySoft : colors.surfaceElevated,
          borderColor: unread ? colors.primary + '22' : colors.borderSubtle,
        },
      ]}
      onPress={() => {
        triggerHaptic('light');
        onPress?.();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${unread ? 'Unread notification: ' : ''}${item.title}`}
    >
      {unread ? <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} /> : null}
      <View style={[styles.iconWrap, { backgroundColor: unread ? colors.primary + '18' : colors.surface }]}>
        <Ionicons name={icon} size={20} color={unread ? colors.primary : colors.textSecondary} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }, !unread && styles.titleRead]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={3}>
          {item.message}
        </Text>
        <Text style={[styles.time, { color: colors.textMuted }]}>
          {new Date(item.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: LuminaSpacing.md,
    padding: LuminaSpacing.lg,
    borderRadius: LuminaRadius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: LuminaSpacing.lg,
    right: LuminaSpacing.lg,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  title: { ...LuminaTypography.label, fontSize: 15, fontWeight: '700' },
  titleRead: { fontWeight: '600' },
  message: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  time: { fontSize: 11, marginTop: 8 },
});
