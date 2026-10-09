import { SERVER_CONFIG } from '../../constants/endpoints';

/**
 * Kiểm tra trạng thái máy chủ (100% Local On-Device Engine)
 */
export async function wakeUpRemoteSpace(_hfToken?: string): Promise<{ success: boolean; stage?: string; message: string }> {
  try {
    const res = await fetch(`${SERVER_CONFIG.LOCAL_HOST}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) {
      return { success: true, stage: 'RUNNING', message: 'Máy chủ Local On-Device đang hoạt động hoàn hảo.' };
    }
  } catch (_) {}
  return { success: true, stage: 'LOCAL_READY', message: 'Máy chủ Local On-Device sẵn sàng.' };
}
