import { ipcMain, app } from 'electron';
import fs from 'fs';
import path from 'path';
import { writeAppLog } from '../utils/logger';
import { findExecutable } from '../backend/backendManager';

export function registerModelHandlers(): void {
  ipcMain.handle('download-model', async (event, { url, folderPath, filename }) => {
    try {
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      const dest = path.join(folderPath, filename);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const totalBytes = parseInt(response.headers.get('content-length') || '0', 10);
      const fileStream = fs.createWriteStream(dest);
      const reader = response.body?.getReader();
      let downloadedBytes = 0;

      if (!reader) throw new Error('Cannot acquire response stream reader');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        fileStream.write(Buffer.from(value));
        downloadedBytes += value.length;

        if (totalBytes > 0) {
          const percent = Math.round((downloadedBytes / totalBytes) * 100);
          event.sender.send('download-progress', { filename, percent, downloadedBytes, totalBytes });
        }
      }

      await new Promise((resolve) => fileStream.end(resolve));
      return { success: true, path: dest };
    } catch (e: any) {
      writeAppLog(`[Download Model] Thất bại: ${e?.message}`);
      return { success: false, error: e?.message };
    }
  });

  ipcMain.handle('list-models', async (_event, folderPath: string) => {
    try {
      if (!fs.existsSync(folderPath)) return [];
      const files = fs.readdirSync(folderPath);
      const models = [];
      for (const file of files) {
        if (file.endsWith('.onnx') || file.endsWith('.zip') || file.endsWith('.pt')) {
          const stats = fs.statSync(path.join(folderPath, file));
          models.push({
            name: file,
            sizeMB: (stats.size / (1024 * 1024)).toFixed(1)
          });
        }
      }
      return models;
    } catch {
      return [];
    }
  });

  ipcMain.handle('delete-model', async (_event, filePath: string) => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return { success: true };
      }
      return { success: false, error: 'File not found' };
    } catch (e: any) {
      return { success: false, error: e?.message };
    }
  });

  ipcMain.handle('read-dictionary', async (_event, filename: string) => {
    const isDev = !app.isPackaged;
    let dictPath = isDev
      ? path.join(__dirname, '../../../public/dictionaries', filename)
      : path.join(__dirname, '../../dist/dictionaries', filename);

    if (fs.existsSync(dictPath)) {
      return fs.readFileSync(dictPath, 'utf-8');
    }
    const altPath = path.join(app.getAppPath(), 'dist/dictionaries', filename);
    if (fs.existsSync(altPath)) {
      return fs.readFileSync(altPath, 'utf-8');
    }
    throw new Error(`Dictionary file not found: ${filename}`);
  });

  ipcMain.handle('get-models-path', async () => {
    const isDev = !app.isPackaged;
    const binaryName = process.platform === 'win32' ? 'App_Doc_Truyen_Engine.exe' : 'App_Doc_Truyen_Engine';
    const userDataBin = path.join(app.getPath('userData'), 'bin');
    const foundInUserData = findExecutable(userDataBin, binaryName);
    if (foundInUserData) {
      return path.dirname(foundInUserData);
    }
    if (isDev) {
      return path.join(__dirname, '../../../native-core/tts/models_onnx');
    }
    const possiblePaths = [
      path.join(process.resourcesPath, binaryName),
      path.join(process.resourcesPath, 'bin', binaryName),
      path.join(app.getAppPath(), '..', binaryName)
    ];
    const foundPath = possiblePaths.find((p) => fs.existsSync(p));
    return foundPath ? path.dirname(foundPath) : path.join(process.resourcesPath, 'bin');
  });
}
