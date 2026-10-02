import http from 'http';
import { BrowserWindow } from 'electron';
import { writeAppLog } from '../utils/logger';
import { killBackendOnPort } from '../backend/portKiller';

const OAUTH_PORT = 53241;
let oauthServer: http.Server | null = null;

export async function startOAuthServer(getMainWindow: () => BrowserWindow | null): Promise<void> {
  if (oauthServer) return;

  try {
    writeAppLog(`[OAuth Server] Đang kiểm tra giải phóng cổng ${OAUTH_PORT}...`);
    await killBackendOnPort(OAUTH_PORT);
  } catch (err: any) {
    writeAppLog(`[OAuth Server] Lỗi khi giải phóng cổng: ${err?.message}`);
  }

  oauthServer = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    try {
      const parsedUrl = new URL(req.url || '', `http://127.0.0.1:${OAUTH_PORT}`);
      if (parsedUrl.pathname === '/callback') {
        const token = parsedUrl.searchParams.get('token');
        const refreshToken = parsedUrl.searchParams.get('refresh_token');
        const user = parsedUrl.searchParams.get('user');
        const win = getMainWindow();

        if (token && win && !win.isDestroyed()) {
          win.webContents.send('oauth-callback-token', { token, refreshToken, user });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }
      }
    } catch {}

    res.writeHead(400);
    res.end('Yêu cầu không hợp lệ');
  });

  oauthServer.on('error', (err: any) => {
    writeAppLog(`[OAuth Server] Gặp lỗi server: ${err?.message}`);
  });

  oauthServer.listen(OAUTH_PORT, '127.0.0.1', () => {
    writeAppLog(`[OAuth Server] Listening on http://127.0.0.1:${OAUTH_PORT}`);
  });
}
