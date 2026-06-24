import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

import { client } from './client';

export type DownloadedFile = {
  uri: string;
  base64: string;
  mimeType: string;
  fileName: string;
};

const RECORDS_CACHE_DIR = `${FileSystem.cacheDirectory ?? ''}records/`;

function sanitizeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? 'document';
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_');
  return cleaned || 'document';
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function guessMimeType(fileName: string, fallback = 'application/octet-stream'): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'heic':
      return 'image/heic';
    default:
      return fallback;
  }
}

async function ensureRecordsCacheDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(RECORDS_CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(RECORDS_CACHE_DIR, { intermediates: true });
  }
}

/** Download an authenticated API path and cache the file locally. */
export async function downloadAuthenticatedFile(
  path: string,
  fileName: string,
  mimeType?: string
): Promise<DownloadedFile> {
  const safeName = sanitizeFileName(fileName);
  await ensureRecordsCacheDir();

  const response = await client.get(path, { responseType: 'arraybuffer' });
  const resolvedMime =
    mimeType ??
    (typeof response.headers?.['content-type'] === 'string'
      ? response.headers['content-type'].split(';')[0]
      : guessMimeType(safeName));

  const base64 = arrayBufferToBase64(response.data as ArrayBuffer);
  const dest = `${RECORDS_CACHE_DIR}${Date.now()}-${safeName}`;

  await FileSystem.writeAsStringAsync(dest, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return {
    uri: dest,
    base64,
    mimeType: resolvedMime,
    fileName: safeName,
  };
}

export function getRecordDownloadPath(recordId: number): string {
  return `/medical-records/${recordId}/download`;
}

export function getPrescriptionDownloadPath(prescriptionId: number): string {
  return `/prescriptions/${prescriptionId}/download`;
}

function ensureFileUri(uri: string): string {
  if (uri.startsWith('file://')) return uri;
  return `file://${uri}`;
}

export async function shareFile(
  uri: string,
  options?: { mimeType?: string; fileName?: string }
): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(ensureFileUri(uri), {
    mimeType: options?.mimeType,
    dialogTitle: options?.fileName ? `Share ${options.fileName}` : 'Share document',
    UTI: options?.mimeType === 'application/pdf' ? 'com.adobe.pdf' : undefined,
  });
}

/** Save / export — opens the native sheet so users can save to Files, Drive, etc. */
export async function shareDownloadedFile(file: DownloadedFile): Promise<void> {
  await shareFile(file.uri, { mimeType: file.mimeType, fileName: file.fileName });
}

/** Download to app cache and confirm with the user. */
export async function saveDownloadedFile(file: DownloadedFile): Promise<void> {
  const permanentDir = `${FileSystem.documentDirectory ?? ''}downloads/`;
  const dirInfo = await FileSystem.getInfoAsync(permanentDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(permanentDir, { intermediates: true });
  }

  const dest = `${permanentDir}${file.fileName}`;
  const existing = await FileSystem.getInfoAsync(dest);
  if (existing.exists) {
    await FileSystem.deleteAsync(dest, { idempotent: true });
  }
  await FileSystem.copyAsync({ from: file.uri, to: dest });

  Alert.alert(
    'Downloaded',
    `${file.fileName} is saved on your device.`,
    [
      {
        text: 'Open',
        onPress: () => {
          shareFile(dest, { mimeType: file.mimeType, fileName: file.fileName }).catch(() => {
            Alert.alert('Error', 'Could not open the file.');
          });
        },
      },
      { text: 'OK', style: 'cancel' },
    ]
  );
}

export function isImageMime(mimeType?: string | null): boolean {
  return !!mimeType?.startsWith('image/');
}

export function isPdfMime(mimeType?: string | null, fileName?: string | null): boolean {
  if (mimeType === 'application/pdf') return true;
  return fileName?.toLowerCase().endsWith('.pdf') ?? false;
}

/** HTML wrapper for in-app PDF preview via WebView. */
export function buildPdfPreviewHtml(base64: string): string {
  const bg = Platform.OS === 'ios' ? '#f8f9fa' : '#ffffff';
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
  <style>
    html, body { margin: 0; padding: 0; height: 100%; background: ${bg}; overflow: hidden; }
    embed, iframe, object { width: 100%; height: 100%; border: 0; display: block; }
  </style>
</head>
<body>
  <embed src="data:application/pdf;base64,${base64}" type="application/pdf" width="100%" height="100%" />
</body>
</html>`;
}
