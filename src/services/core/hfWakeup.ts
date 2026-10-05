/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  hfWakeup.ts — TỰ ĐỘNG THỨC TỈNH & KHỞI ĐỘNG LẠI HUGGING FACE SPACE KHI LỖI
 * ═════════════════════════════════════════════════════════════════════════════
 */

const HF_SPACE_REPO = 'Cong123779/tienhiep-api';
const HF_PUBLIC_URL = 'https://cong123779-tienhiep-api.hf.space';
const RESTART_COOLDOWN_MS = 60 * 1000; // Tối thiểu 1 phút giữa 2 lần restart
let lastRestartAttempt = 0;

/**
 * Kiểm tra trạng thái máy chủ HuggingFace Space và tự động gửi lệnh Restart nếu bị lỗi/ngủ đông
 */
export async function wakeUpRemoteSpace(hfToken?: string): Promise<{ success: boolean; stage?: string; message: string }> {
  const now = Date.now();
  if (now - lastRestartAttempt < RESTART_COOLDOWN_MS) {
    return { success: false, message: 'Đang trong thời gian chờ giữa 2 lần kích hoạt (Cooldown 60s).' };
  }

  try {
    // 1. Thử ping /api/health trước
    const healthRes = await fetch(`${HF_PUBLIC_URL}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    if (healthRes.ok) {
      return { success: true, message: 'Máy chủ Hugging Face đang hoạt động bình thường.' };
    }
  } catch (_) {
    // Ping thất bại -> Cần đánh thức / kiểm tra trạng thái
  }

  // 2. Tra cứu trạng thái từ Hugging Face Hub API
  try {
    const statusRes = await fetch(`https://huggingface.co/api/spaces/${HF_SPACE_REPO}`, {
      method: 'GET',
      headers: hfToken ? { Authorization: `Bearer ${hfToken}` } : {},
      signal: AbortSignal.timeout(5000),
    });

    if (statusRes.ok) {
      const data = await statusRes.json();
      const stage = data?.runtime?.stage || 'UNKNOWN';

      if (stage === 'RUNNING' || stage === 'READY') {
        // Space đã chạy nhưng có thể worker đang lag -> Gửi request GET để kích hoạt traffic
        fetch(`${HF_PUBLIC_URL}/health`).catch(() => {});
        return { success: true, stage, message: 'Máy chủ đang chạy và đã nhận tín hiệu kích hoạt traffic.' };
      }

      // Nếu trạng thái là PAUSED, SLEEPING, STOPPED, hoặc RUNTIME_ERROR -> Gọi API Restart
      if (['PAUSED', 'SLEEPING', 'STOPPED', 'RUNTIME_ERROR', 'DEGRADED'].includes(stage)) {
        if (!hfToken) {
          return {
            success: false,
            stage,
            message: `Máy chủ đang ở trạng thái [${stage}]. Cần token HuggingFace để tự động khởi động lại.`,
          };
        }

        lastRestartAttempt = now;
        const restartRes = await fetch(`https://huggingface.co/api/spaces/${HF_SPACE_REPO}/restart`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${hfToken}` },
          signal: AbortSignal.timeout(10000),
        });

        if (restartRes.ok) {
          return { success: true, stage: 'RESTARTING', message: 'Đã gửi lệnh tự động khởi động lại máy chủ Hugging Face thành công!' };
        }
      }

      return { success: false, stage, message: `Trạng thái hiện tại của máy chủ: ${stage}` };
    }
  } catch (err: any) {
    return { success: false, message: `Lỗi kết nối tới Hugging Face API: ${err.message}` };
  }

  return { success: false, message: 'Không thể kích hoạt tự động khởi động.' };
}
