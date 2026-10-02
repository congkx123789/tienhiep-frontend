import { ipcMain, app, dialog, shell, BrowserWindow } from 'electron';
import os from 'os';
import fs from 'fs';
import path from 'path';

export function registerSystemHandlers(getMainWindow: () => BrowserWindow | null): void {
  ipcMain.handle('get-system-info', async () => {
    return {
      platform: process.platform,
      arch: process.arch,
      version: app.getVersion(),
      cpuCount: os.cpus().length,
      freeMemoryGB: (os.freemem() / (1024 * 1024 * 1024)).toFixed(2),
      totalMemoryGB: (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2)
    };
  });

  ipcMain.handle('log-debug', async (_event, msg) => {
    try {
      const logPath = path.join(app.getPath('userData'), 'tts_playback_debug.log');
      const timestamp = new Date().toISOString();
      fs.appendFileSync(logPath, `[${timestamp}] [Frontend] ${msg}\n`, 'utf8');
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('open-log-folder', async () => {
    try {
      const logDir = app.getPath('userData');
      shell.openPath(logDir);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message };
    }
  });

  ipcMain.handle('get-log-content', async () => {
    try {
      const logPath = path.join(app.getPath('userData'), 'tts_playback_debug.log');
      if (!fs.existsSync(logPath)) {
        return 'Chưa có dữ liệu log.';
      }
      const stats = fs.statSync(logPath);
      if (stats.size > 1024 * 1024) {
        const fd = fs.openSync(logPath, 'r');
        const bufferSize = 100 * 1024;
        const buffer = Buffer.alloc(bufferSize);
        const startPos = stats.size - bufferSize;
        fs.readSync(fd, buffer, 0, bufferSize, startPos);
        fs.closeSync(fd);
        return '... [Log quá dài, chỉ hiển thị 100KB cuối] ...\n' + buffer.toString('utf8');
      }
      return fs.readFileSync(logPath, 'utf8');
    } catch (e: any) {
      return `Lỗi đọc log: ${e?.message}`;
    }
  });

  ipcMain.handle('clear-log', async () => {
    try {
      const logPath = path.join(app.getPath('userData'), 'tts_playback_debug.log');
      fs.writeFileSync(logPath, `[${new Date().toISOString()}] [App] Đã xóa nhật ký cũ.\n`, 'utf8');
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('select-directory', async (_event, title) => {
    const win = getMainWindow();
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      title: title || 'Chọn thư mục',
      properties: ['openDirectory']
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });

  ipcMain.handle('open-external', async (_event, url) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      await shell.openExternal(url);
      return true;
    }
    return false;
  });
}
