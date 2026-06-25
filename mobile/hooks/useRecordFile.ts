import { useCallback, useEffect, useState } from 'react';

import {
  downloadAuthenticatedFile,
  DownloadedFile,
  getRecordDownloadPath,
} from '@/api/download';
import { getApiErrorMessage } from '@/utils/apiErrors';

type UseRecordFileResult = {
  file: DownloadedFile | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useRecordFile(
  recordId: number | null,
  fileName?: string | null,
  mimeType?: string | null
): UseRecordFileResult {
  const [file, setFile] = useState<DownloadedFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!recordId) {
      setFile(null);
      setError('Invalid record.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const downloaded = await downloadAuthenticatedFile(
        getRecordDownloadPath(recordId),
        fileName ?? 'document',
        mimeType ?? undefined
      );
      setFile(downloaded);
    } catch (e) {
      setFile(null);
      setError(getApiErrorMessage(e, 'Could not load file.'));
    } finally {
      setLoading(false);
    }
  }, [recordId, fileName, mimeType]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { file, loading, error, reload };
}
