import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { downloadAuthenticatedFile, getRecordDownloadPath, shareFile } from '@/api/download';
import { LuminaButton } from '@/components/lumina/LuminaButton';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

export default function DoctorRecordPreviewScreen() {
  const { id, mimeType, fileName } = useLocalSearchParams<{ id: string; mimeType?: string; fileName?: string }>();
  const { colors } = useLuminaTheme();
  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const localUri = await downloadAuthenticatedFile(
          getRecordDownloadPath(parseInt(id!, 10)),
          fileName ?? 'record'
        );
        setUri(localUri);
      } catch {
        setUri(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, fileName]);

  const isImage = mimeType?.startsWith('image/');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Preview" rightIcon="share-outline" onRightPress={() => uri && shareFile(uri)} />
      {loading ? (
        <ActivityIndicator size="large" color={colors.accentTeal} style={{ marginTop: 80 }} />
      ) : uri && isImage ? (
        <Image source={{ uri }} style={styles.image} resizeMode="contain" />
      ) : uri && Platform.OS === 'web' ? (
        <iframe
          src={uri}
          style={{ flex: 1, width: '100%', height: '100%', border: 'none', margin: LuminaSpacing.lg } as React.CSSProperties}
          title="Record preview"
        />
      ) : uri ? (
        <View style={{ padding: LuminaSpacing.lg }}>
          <LuminaButton label="Download / Share" onPress={() => shareFile(uri)} />
        </View>
      ) : (
        <View style={{ padding: LuminaSpacing.lg }}>
          <LuminaButton label="Could not preview" variant="outline" disabled />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  image: { flex: 1, margin: LuminaSpacing.lg },
});
