import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { LuminaColors, LuminaSpacing, LuminaTypography } from '@/theme/lumina';

type AppHeaderProps = {
  userName?: string;
  avatarUri?: string;
  showSettings?: boolean;
  onSettingsPress?: () => void;
};

export function AppHeader({
  userName,
  avatarUri,
  showSettings = true,
  onSettingsPress,
}: AppHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.brandRow}>
        <View style={styles.avatar}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={18} color={LuminaColors.textSecondary} />
          )}
        </View>
        <Text style={styles.brand}>Lumina Health</Text>
      </View>
      {showSettings && (
        <Pressable onPress={onSettingsPress} hitSlop={12} style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={22} color={LuminaColors.text} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: LuminaSpacing.lg,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: LuminaSpacing.md },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: LuminaColors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 36, height: 36 },
  brand: { ...LuminaTypography.brand, color: LuminaColors.text },
  settingsBtn: { padding: LuminaSpacing.xs },
});
