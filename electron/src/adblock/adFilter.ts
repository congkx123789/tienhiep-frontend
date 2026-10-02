import { Session } from 'electron';
import { AD_DOMAINS, AD_PATH_PATTERNS } from './adRules';

export function isAdUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  if (
    rawUrl.startsWith('http://localhost') ||
    rawUrl.startsWith('http://127.0.0.1') ||
    rawUrl.startsWith('tienhiepai:') ||
    rawUrl.startsWith('file:') ||
    rawUrl.startsWith('devtools:')
  ) {
    return false;
  }
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();
    for (const domain of AD_DOMAINS) {
      if (host === domain || host.endsWith('.' + domain)) {
        return true;
      }
    }
    const full = rawUrl.toLowerCase();
    for (const pattern of AD_PATH_PATTERNS) {
      if (pattern.test(full)) {
        return true;
      }
    }
  } catch {
    const lower = rawUrl.toLowerCase();
    for (const domain of AD_DOMAINS) {
      if (lower.includes(domain)) return true;
    }
  }
  return false;
}

export function setupAdBlockerForSession(sess: Session): void {
  if (!sess || (sess as any).__adBlockerInstalled) return;
  (sess as any).__adBlockerInstalled = true;

  try {
    sess.setPermissionRequestHandler((_webContents, permission, callback) => {
      // Chặn hoàn toàn mọi nỗ lực xin quyền thông báo / vị trí từ web truyện
      if (permission === 'notifications' || permission === 'geolocation' || permission === 'media') {
        return callback(false);
      }
      callback(true);
    });
  } catch {}

  try {
    sess.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
      if (isAdUrl(details.url)) {
        console.log(`[Network AdBlock] 🚫 Đã chặn request quảng cáo: ${details.url.substring(0, 100)}...`);
        return callback({ cancel: true });
      }
      return callback({ cancel: false });
    });

    sess.webRequest.onHeadersReceived({ urls: ['*://*/*'] }, (details, callback) => {
      const responseHeaders = { ...(details.responseHeaders || {}) };
      delete responseHeaders['x-frame-options'];
      delete responseHeaders['X-Frame-Options'];
      delete responseHeaders['content-security-policy'];
      delete responseHeaders['Content-Security-Policy'];
      delete responseHeaders['content-security-policy-report-only'];
      delete responseHeaders['Content-Security-Policy-Report-Only'];
      responseHeaders['Access-Control-Allow-Origin'] = ['*'];
      callback({ responseHeaders });
    });
  } catch (err) {
    console.error('[Network AdBlock] Lỗi gắn bộ lọc request:', err);
  }
}
