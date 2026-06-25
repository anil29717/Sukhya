import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

import {
  buildPdfPreviewHtml,
  isImageMime,
  isPdfMime,
  saveDownloadedFile,
  shareDownloadedFile,
} from '@/api/download';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { useRecordFile } from '@/hooks/useRecordFile';
import { LuminaFontFamily, LuminaRadius, LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { triggerHaptic } from '@/utils/haptics';

export default function FilePreviewScreen() {
  const { id, mimeType, fileName } = useLocalSearchParams<{
    id: string;
    mimeType?: string;
    fileName?: string;
  }>();
  const insets = useSafeAreaInsets();
  const { colors } = useLuminaTheme({ role: 'patient' });
  const recordId = id ? parseInt(id, 10) : null;
  const { file, loading, error, reload } = useRecordFile(recordId, fileName, mimeType);

  const resolvedMime = file?.mimeType ?? mimeType ?? null;
  const showImage = file && isImageMime(resolvedMime);
  const showPdf = file && isPdfMime(resolvedMime, file.fileName);

  const pdfHtml = useMemo(
    () => (file && showPdf ? buildPdfPreviewHtml(file.base64) : null),
    [file, showPdf]
  );

  const handleShare = useCallback(async () => {
    if (!file) return;
    try {
      triggerHaptic('light');
      await shareDownloadedFile(file);
    } catch (e) {
      Alert.alert('Share failed', getApiErrorMessage(e, 'Could not open the share menu. Please try again.'));
    }
  }, [file]);

  const handleDownload = useCallback(async () => {
    if (!file) return;
    try {
      triggerHaptic('medium');
      await saveDownloadedFile(file);
    } catch (e) {
      Alert.alert('Download failed', getApiErrorMessage(e, 'Could not save the file. Please try again.'));
    }
  }, [file]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Preview"
        role="patient"
        rightIcon="share-outline"
        onRightPress={handleShare}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.coral} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading document…
          </Text>
        </View>
      ) : error || !file ? (
        <View style={styles.centered}>
          <View style={[styles.errorIcon, { backgroundColor: colors.coralSoft }]}>
            <Ionicons name="document-outline" size={32} color={colors.coral} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Could not load preview</Text>
          <Text style={[styles.errorBody, { color: colors.textSecondary }]}>
            {error ?? 'Check your connection and try again.'}
          </Text>
          <Pressable
            onPress={reload}
            style={[styles.retryBtn, { backgroundColor: colors.coral }]}
          >
            <Text style={styles.retryBtnText}>Try again</Text>
          </Pressable>
        </View>
      ) : showImage ? (
        <Image source={{ uri: file.uri }} style={styles.image} resizeMode="contain" />
      ) : showPdf && pdfHtml ? (
        <WebView
          source={{ html: pdfHtml }}
          style={styles.webview}
          originWhitelist={['*']}
          scalesPageToFit
          startInLoadingState
          renderLoading={() => (
            <View style={styles.webviewLoader}>
              <ActivityIndicator size="large" color={colors.coral} />
            </View>
          )}
        />
      ) : (
        <View style={styles.centered}>
          <View style={[styles.errorIcon, { backgroundColor: colors.neutral100 }]}>
            <Ionicons name="document-text-outline" size={32} color={colors.textSecondary} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Preview not available</Text>
          <Text style={[styles.errorBody, { color: colors.textSecondary }]}>
            This file type cannot be previewed in the app. Download or share to open it.
          </Text>
        </View>
      )}

      {file && !loading ? (
        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(insets.bottom, 16),
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <Pressable
            onPress={handleDownload}
            style={[styles.footerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Ionicons name="download-outline" size={18} color={colors.coral} />
            <Text style={[styles.footerBtnText, { color: colors.coral }]}>Download</Text>
          </Pressable>
          <Pressable
            onPress={handleShare}
            style={[styles.footerBtn, styles.footerBtnPrimary, { backgroundColor: colors.coral }]}
          >
            <Ionicons name="share-outline" size={18} color="#FFFFFF" />
            <Text style={styles.footerBtnPrimaryText}>Share</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: LuminaSpacing.xl,
    gap: 10,
  },
  loadingText: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 14,
    marginTop: LuminaSpacing.sm,
  },
  errorIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: LuminaSpacing.sm,
  },
  errorTitle: {
    fontFamily: LuminaFontFamily.nunitoBold,
    fontSize: 18,
    textAlign: 'center',
  },
  errorBody: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: LuminaSpacing.sm,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: LuminaRadius.lg,
    marginTop: LuminaSpacing.sm,
  },
  retryBtnText: {
    fontFamily: LuminaFontFamily.dmSansSemiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  image: { flex: 1, margin: LuminaSpacing.lg },
  webview: { flex: 1, backgroundColor: 'transparent' },
  webviewLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: LuminaSpacing.xl,
    paddingTop: LuminaSpacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1,
    gap: 7,
  },
  footerBtnPrimary: {
    borderWidth: 0,
    shadowColor: '#F05A2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  footerBtnText: {
    fontFamily: LuminaFontFamily.dmSansSemiBold,
    fontSize: 15,
  },
  footerBtnPrimaryText: {
    fontFamily: LuminaFontFamily.dmSansSemiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
