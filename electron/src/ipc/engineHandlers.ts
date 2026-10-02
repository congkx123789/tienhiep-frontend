import { ipcMain, app, shell } from 'electron';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import JSZip from 'jszip';
import { writeAppLog } from '../utils/logger';
import { startBackend, stopBackend, backendState, backendProcess } from '../backend/backendManager';
import { stopHealthMonitor } from '../backend/healthMonitor';

export async function extractZipFile(zipPath: string, destDir: string): Promise<boolean> {
  try {
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    const zipData = fs.readFileSync(zipPath);
    const zip = await JSZip.loadAsync(zipData);
    for (const filename of Object.keys(zip.files)) {
      const file = zip.files[filename];
      const destPath = path.join(destDir, filename);
      if (file.dir) {
        fs.mkdirSync(destPath, { recursive: true });
      } else {
        const parentDir = path.dirname(destPath);
        if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });
        const content = await file.async('nodebuffer');
        fs.writeFileSync(destPath, content);
      }
    }
    return true;
  } catch (err: any) {
    writeAppLog(`[Zip Extract Fallback] JSZip error: ${err?.message}. Thử lệnh hệ thống.`);
    const cmd = process.platform === 'win32'
      ? `powershell -Command "Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${destDir}' -Force"`
      : `unzip -o "${zipPath}" -d "${destDir}"`;
    return new Promise((resolve) => {
      exec(cmd, (e) => resolve(!e));
    });
  }
}

export function registerEngineHandlers(): void {
  ipcMain.handle('start-backend', async () => {
    try {
      const ok = await startBackend();
      return { success: ok };
    } catch (e: any) {
      return { success: false, error: e?.message };
    }
  });

  ipcMain.handle('stop-backend', async () => {
    try {
      stopHealthMonitor();
      stopBackend();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message };
    }
  });

  ipcMain.handle('check-backend-status', async () => {
    let isAlive = false;
    if (backendProcess) {
      try { isAlive = backendProcess.kill(0); } catch { isAlive = false; }
    }
    backendState.running = isAlive;
    if (isAlive) backendState.error = null;
    return backendState;
  });

  ipcMain.handle('download-engine', async (event, { type }) => {
    try {
      const isWin = process.platform === 'win32';
      const platform = isWin ? 'windows' : 'linux';
      const zipFilename = `${platform}_${type}.zip`;
      const url = `https://huggingface.co/datasets/Cong123779/Local-TTS-Engine/resolve/main/${type}/${zipFilename}`;
      const tempZipPath = path.join(app.getPath('temp'), zipFilename);
      const destDir = path.join(app.getPath('userData'), 'bin');

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const totalBytes = parseInt(response.headers.get('content-length') || '0', 10);
      const fileStream = fs.createWriteStream(tempZipPath);
      const reader = response.body?.getReader();
      let downloadedBytes = 0;

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        fileStream.write(Buffer.from(value));
        downloadedBytes += value.length;
        if (totalBytes > 0) {
          const percent = Math.round((downloadedBytes / totalBytes) * 100);
          event.sender.send('download-progress', { filename: zipFilename, percent, downloadedBytes, totalBytes });
        }
      }
      await new Promise((res) => fileStream.end(res));
      await extractZipFile(tempZipPath, destDir);
      try { fs.unlinkSync(tempZipPath); } catch {}
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message };
    }
  });

  ipcMain.handle('quick-patch-update', async (event, { url, version }) => {
    try {
      const tempZip = path.join(app.getPath('temp'), `patch_${version}.zip`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const totalBytes = parseInt(res.headers.get('content-length') || '0', 10);
      const stream = fs.createWriteStream(tempZip);
      const reader = res.body?.getReader();
      let downloadedBytes = 0;
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        stream.write(Buffer.from(value));
        downloadedBytes += value.length;
        if (totalBytes > 0) {
          const percent = Math.round((downloadedBytes / totalBytes) * 100);
          event.sender.send('quick-patch-progress', { percent, downloadedBytes, totalBytes });
        }
      }
      await new Promise((r) => stream.end(r));
      const targetDir = path.join(app.getAppPath(), 'dist');
      await extractZipFile(tempZip, targetDir);
      try { fs.unlinkSync(tempZip); } catch {}
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message };
    }
  });

  ipcMain.handle('download-and-run-update', async (event, { url, filename }) => {
    try {
      const tempPath = path.join(app.getPath('temp'), filename);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const totalBytes = parseInt(res.headers.get('content-length') || '0', 10);
      const stream = fs.createWriteStream(tempPath);
      const reader = res.body?.getReader();
      let downloadedBytes = 0;
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        stream.write(Buffer.from(value));
        downloadedBytes += value.length;
        if (totalBytes > 0) {
          const percent = Math.round((downloadedBytes / totalBytes) * 100);
          event.sender.send('update-download-progress', { percent, downloadedBytes, totalBytes });
        }
      }
      await new Promise((r) => stream.end(r));
      if (process.platform === 'win32') {
        shell.openPath(tempPath);
      } else {
        exec(`chmod +x "${tempPath}" && "${tempPath}" &`);
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message };
    }
  });

  ipcMain.handle('uninstall-app', async () => {
    try {
      if (process.platform === 'linux') {
        const destDir = path.join(os.homedir(), '.local/share/applications');
        ['tienhiepai.desktop', 'TienHiepAI.desktop', 'tienhiepai-dev.desktop'].forEach((f) => {
          const p = path.join(destDir, f);
          if (fs.existsSync(p)) fs.unlinkSync(p);
        });
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message };
    }
  });

  ipcMain.handle('check-for-update', async () => {
    try {
      const res = await fetch('https://raw.githubusercontent.com/congkx123789/ttS/main/releases.json');
      if (!res.ok) return { updateAvailable: false };
      const data: any = await res.json();
      return { updateAvailable: true, release: data };
    } catch {
      return { updateAvailable: false };
    }
  });
}
