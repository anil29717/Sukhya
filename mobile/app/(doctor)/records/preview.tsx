import React, { useCallback } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';

import {
  buildPdfPreviewHtml,
  isImageMime,
  isPdfMime,
  shareDownloadedFile,
} from '@/api/download';
import { LuminaButton } from '@/components/lumina/LuminaButton';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { useRecordFile } from '@/hooks/useRecordFile';
import { LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

export default function DoctorRecordPreviewScreen() {
  const { id, mimeType, fileName } = useLocalSearchParams<{ id: string; mimeType?: string; fileName?: string }>();
  const { colors } = useLuminaTheme({ role: 'doctor' });
  const recordId = id ? parseInt(id, 10) : null;
  const { file, loading, error, reload } = useRecordFile(recordId, fileName, mimeType);

  const resolvedMime = file?.mimeType ?? mimeType ?? null;
  const showImage = file && isImageMime(resolvedMime);
  const showPdf = file && isPdfMime(resolvedMime, file.fileName);

  const handleShare = useCallback(async () => {
    if (!file) return;
    try {
      await shareDownloadedFile(file);
    } catch {
      Alert.alert('Share failed', 'Could not open the share menu.');
    }
  }, [file]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Preview" role="doctor" rightIcon="share-outline" onRightPress={handleShare} />
      {loading ? (
        <ActivityIndicator size="large" color={colors.teal} style={{ marginTop: 80 }} />
      ) : error || !file ? (
        <View style={{ padding: LuminaSpacing.lg }}>
          <LuminaButton label="Try again" onPress={reload} />
        </View>
      ) : showImage ? (
        <Image source={{ uri: file.uri }} style={styles.image} resizeMode="contain" />
      ) : showPdf ? (
        <WebView source={{ html: buildPdfPreviewHtml(file.base64) }} style={styles.webview} originWhitelist={['*']} />
      ) : (
        <View style={{ padding: LuminaSpacing.lg }}>
          <LuminaButton label="Share file" onPress={handleShare} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  image: { flex: 1, margin: LuminaSpacing.lg },
  webview: { flex: 1 },
});
