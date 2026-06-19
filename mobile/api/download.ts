import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { API_URL } from './client';
import { tokenStorage, ACCESS_TOKEN_KEY } from './storage';

export async function downloadAuthenticatedFile(
  path: string,
  fileName: string
): Promise<string> {
  const token = await tokenStorage.getItem(ACCESS_TOKEN_KEY);
  const url = path.startsWith('http') ? path : `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const dest = `${FileSystem.documentDirectory ?? ''}${fileName}`;
  const result = await FileSystem.downloadAsync(url, dest, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (result.status !== 200) {
    throw new Error(`Download failed (${result.status})`);
  }
  return result.uri;
}

export async function shareFile(uri: string): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri);
  }
}

export function getRecordDownloadPath(recordId: number): string {
  return `/medical-records/${recordId}/download`;
}

export function getPrescriptionDownloadPath(prescriptionId: number): string {
  return `/prescriptions/${prescriptionId}/download`;
}
