import { app, session } from 'electron';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { exec } from 'child_process';
import { setupAdBlockerForSession } from './adblock/adFilter';
import { createWindow, getMainWindow } from './window/windowManager';
import { startBackend, stopBackend, backendState, backendProcess, setQuitting } from './backend/backendManager';
import { waitForBackendReady } from './backend/healthMonitor';
import { registerWindowHandlers } from './ipc/windowHandlers';
import { registerSystemHandlers } from './ipc/systemHandlers';
import { registerStoreHandlers } from './ipc/storeHandlers';
import { registerModelHandlers } from './ipc/modelHandlers';
import { registerEngineHandlers } from './ipc/engineHandlers';
import { writeAppLog } from './utils/logger';

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu-sandbox');
}
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-web-security');
app.commandLine.appendSwitch('disable-site-isolation-trials');

const gotTheLock = app.requestSingleInstanceLock();

function registerLinuxDevProtocol(): void {
  if (process.platform !== 'linux' || app.isPackaged) return;
  try {
    const destDir = path.join(os.homedir(), '.local/share/applications');
    const iconPath = path.join(path.resolve(app.getAppPath()), 'public/icon.png');
    (app as any).desktopName = 'tienhiepai.desktop';
    const desktopContent = `[Desktop Entry]\nName=Tiên Hiệp AI Dev\nExec="${process.execPath}" "${path.resolve(app.getAppPath())}" %u\nIcon=${iconPath}\nType=Application\nTerminal=false\nMimeType=x-scheme-handler/tienhiepai;\n`;
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    ['tienhiepai.desktop', 'TienHiepAI.desktop', 'tienhiepai-dev.desktop'].forEach((file) => {
      const filePath = path.join(destDir, file);
      fs.writeFileSync(filePath, desktopContent, 'utf-8');
      exec(`chmod +x "${filePath}"`);
    });
    exec(`update-desktop-database ${destDir}`);
    exec(`xdg-mime default tienhiepai.desktop x-scheme-handler/tienhiepai`);
  } catch (e: any) {
    console.error('[Linux Dev Protocol] Error registering:', e?.message);
  }
}

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    const win = getMainWindow();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
      const url = commandLine.find((arg) => arg.startsWith('tienhiepai://'));
      if (url) win.webContents.send('oauth-callback', url);
    } else {
      createWindow();
    }
  });

  app.whenReady().then(() => {
    writeAppLog('--- KHỞI ĐỘNG TIÊN HIỆP AI ELECTRON (TYPESCRIPT) ---');
    // Bỏ logic Clean Ad theo yêu cầu người dùng, giữ nguyên vẹn 100% tài nguyên trang web
    // setupAdBlockerForSession(session.defaultSession);

    app.on('web-contents-created', (_event, contents) => {
      contents.setWindowOpenHandler((details) => {
        const targetUrl = details.url;
        if (targetUrl && /^https?:\/\//i.test(targetUrl)) {
          const win = getMainWindow();
          if (win && !win.isDestroyed()) {
            win.webContents.send('open-in-new-tab', targetUrl);
          }
        }
        return { action: 'deny' };
      });
    });

    // Register all IPC module handlers
    registerWindowHandlers(getMainWindow);
    registerSystemHandlers(getMainWindow);
    registerStoreHandlers();
    registerModelHandlers();
    registerEngineHandlers();

    createWindow();

    setTimeout(async () => {
      await startBackend();
      const win = getMainWindow();
      if (!backendProcess && !backendState.running) {
        if (win && !win.isDestroyed()) {
          win.webContents.send('backend-ready', { ready: false, error: backendState.error || 'missing_engine' });
        }
        return;
      }
      waitForBackendReady(25000).then((ready) => {
        if (win && !win.isDestroyed()) {
          if (ready) {
            backendState.running = true;
            backendState.error = null;
            win.webContents.send('backend-ready', { ready: true });
          }
        }
      });
    }, 500);
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      setQuitting(true);
      stopBackend();
      app.quit();
    }
  });

  app.on('activate', () => {
    if (!getMainWindow()) createWindow();
  });

  app.on('before-quit', () => {
    setQuitting(true);
    stopBackend();
  });
}
