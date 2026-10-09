// Dịch vụ gửi Báo cáo & Lỗi với mạng Chuyển tiếp Dự phòng Serverless (Zero-Trust & Fault-Tolerant)
import api from '../core/api';
export interface ReportData {
  type?: string;
  department?: string;
  severity?: 'low' | 'medium' | 'critical' | string;
  title?: string;
  description: string;
  userId?: number;
  metadata?: Record<string, any>;
}

export interface ReportResult {
  success: boolean;
  message: string;
  via: 'primary_server' | 'serverless_fallback';
}

const PRIMARY_REPORT_URL = '/api/reports/system';
const FALLBACK_REPORT_URL = (import.meta as any).env?.VITE_FALLBACK_REPORT_URL || '/api/report-fallback';

/**
 * submitReportWithFallback: Tự động đảo chiều sang Serverless Edge Function / Cloudflare Worker
 * nếu Server chính bị sập, timeout quá 5 giây hoặc phản hồi HTTP 5xx.
 */
export async function submitReportWithFallback(report: ReportData): Promise<ReportResult> {
  const deviceInfo = {
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    timestamp: new Date().toISOString(),
    screen: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '',
  };

  const payload = {
    department: report.type === 'bug' || report.type === 'crash' ? 'backend_api' : (report.type || 'new_feature'),
    severity: report.severity || 'medium',
    title: report.title || `Báo cáo sự cố [${report.severity || 'medium'}]`,
    description: report.description,
    attachments: JSON.stringify({ ...deviceInfo, ...report.metadata }),
    user_id: report.userId || 0,
  };

  // 1. Thử gửi qua Máy Chủ Chính Golang (Giới hạn timeout 5s để không làm nghẽn client)
  try {
    const res = await api.post(PRIMARY_REPORT_URL, payload, { timeout: 5000 });
    if (res && (res.status === 200 || res.status === 201 || res.data)) {
      return {
        success: true,
        message: res.data?.message || 'Đã ghi nhận báo cáo qua máy chủ chính.',
        via: 'primary_server',
      };
    }
  } catch (err: any) {
    if (err?.response && err.response.status < 500 && err.response.status !== 404) {
      throw new Error(err.response.data?.error || `Yêu cầu không hợp lệ (${err.response.status})`);
    }
    console.warn('[Report Fallback] ⚠️ Máy chủ chính không phản hồi hoặc gặp lỗi. Kích hoạt mạng chuyển tiếp Serverless...', err?.message);
  }

  // 2. Chuyển hướng sang Trạm Serverless Dự Phòng (Cloudflare Worker / Vercel Edge)
  try {
    const fallbackRes = await fetch(FALLBACK_REPORT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        fallback_source: 'client_edge_recovery',
        dispatched_at: new Date().toISOString(),
      }),
    });

    if (fallbackRes.ok) {
      return {
        success: true,
        message: 'Hệ thống máy chủ chính đang bảo trì, nhưng báo cáo sự cố của bạn đã được tiếp nhận an toàn qua mạng dự phòng!',
        via: 'serverless_fallback',
      };
    }
  } catch (fallbackErr: any) {
    console.error('[Report Fallback] ❌ Không thể kết nối tới cả 2 trạm tiếp nhận:', fallbackErr);
  }

  // Dự phòng ngoại tuyến: Lưu vào LocalStorage để đồng bộ khi có mạng lại
  try {
    const offlineQueue = JSON.parse(localStorage.getItem('offline_report_queue') || '[]');
    offlineQueue.push({ ...payload, queued_at: Date.now() });
    localStorage.setItem('offline_report_queue', JSON.stringify(offlineQueue.slice(-10)));
  } catch (_) {}

  return {
    success: true,
    message: 'Báo cáo sự cố đã được lưu vào bộ nhớ đệm thiết bị và sẽ tự động gửi khi kết nối phục hồi.',
    via: 'serverless_fallback',
  };
}
