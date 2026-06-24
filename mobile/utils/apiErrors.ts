import axios from 'axios';

function extractDetail(data: unknown): string | null {
  if (typeof data === 'string' && data.trim()) return data;
  if (data && typeof data === 'object' && 'detail' in data) {
    const detail = (data as { detail?: unknown }).detail;
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      if (typeof first === 'object' && first && 'msg' in first) {
        return String((first as { msg: unknown }).msg);
      }
    }
  }
  return null;
}

export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(err)) {
    const detail = extractDetail(err.response?.data);
    if (detail) return detail;

    const status = err.response?.status;
    if (status === 404) return 'File not found on the server.';
    if (status === 503) return 'File storage is temporarily unavailable.';
    if (status === 500) return 'Server error while loading this file.';
    if (err.message) return err.message;
  }

  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
