import http from 'http';
import { writeAppLog } from '../utils/logger';

let healthMonitorInterval: NodeJS.Timeout | null = null;

export function stopHealthMonitor(): void {
  if (healthMonitorInterval) {
    clearInterval(healthMonitorInterval);
    healthMonitorInterval = null;
  }
}

export function waitForBackendReady(timeoutMs: number = 20000): Promise<boolean> {
  return new Promise((resolve) => {
    const start = Date.now();
    const interval = setInterval(() => {
      const probePort = (port: number, next: () => void) => {
        const req = http.get(`http://127.0.0.1:${port}/health`, (res) => {
          if (res.statusCode === 200) {
            clearInterval(interval);
            resolve(true);
          } else {
            next();
          }
          res.resume();
        });
        req.on('error', next);
        req.setTimeout(600, () => req.destroy());
      };

      probePort(5051, () => {
        probePort(8001, () => {
          if (Date.now() - start > timeoutMs) {
            clearInterval(interval);
            resolve(false);
          }
        });
      });
    }, 600);
  });
}

export function startHealthMonitor(
  isQuitting: () => boolean,
  getBackendProcess: () => any,
  restartCallback: () => void
): void {
  stopHealthMonitor();
  writeAppLog('[Health Monitor] Bắt đầu giám sát sức khỏe engine (mỗi 30 giây).');

  healthMonitorInterval = setInterval(() => {
    if (isQuitting()) {
      stopHealthMonitor();
      return;
    }

    const checkPort = (port: number, fallback: () => void) => {
      const req = http.get(`http://127.0.0.1:${port}/health`, (res) => {
        res.resume();
      });
      req.on('error', fallback);
      req.setTimeout(1000, () => req.destroy());
    };

    checkPort(5051, () => {
      checkPort(8001, () => {
        writeAppLog('[Health Monitor] Engine không phản hồi /health! Đang kiểm tra process...');
        let processAlive = false;
        const proc = getBackendProcess();
        if (proc) {
          try { processAlive = proc.kill(0); } catch { processAlive = false; }
        }
        if (!processAlive && !isQuitting()) {
          writeAppLog('[Health Monitor] Process đã chết. Tự động kích hoạt khởi động lại...');
          restartCallback();
        }
      });
    });
  }, 30000);
}
