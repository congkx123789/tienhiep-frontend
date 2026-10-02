import { ipcMain, app } from 'electron';
import fs from 'fs';
import path from 'path';

export function registerStoreHandlers(): void {
  ipcMain.handle('store-get', async (_event, key: string) => {
    try {
      const configPath = path.join(app.getPath('userData'), 'app_config.json');
      if (!fs.existsSync(configPath)) return null;
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return data[key] ?? null;
    } catch {
      return null;
    }
  });

  ipcMain.handle('store-set', async (_event, key: string, val: any) => {
    try {
      const configPath = path.join(app.getPath('userData'), 'app_config.json');
      let data: Record<string, any> = {};
      if (fs.existsSync(configPath)) {
        try {
          data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch {}
      }
      data[key] = val;
      fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('store-delete', async (_event, key: string) => {
    try {
      const configPath = path.join(app.getPath('userData'), 'app_config.json');
      if (!fs.existsSync(configPath)) return true;
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      delete data[key];
      fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('clear-userdata', async () => {
    try {
      const userDataPath = app.getPath('userData');
      const filesToClear = ['app_config.json', 'tts_playback_debug.log'];
      const cleared: string[] = [];
      for (const file of filesToClear) {
        const filePath = path.join(userDataPath, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          cleared.push(file);
        }
      }
      return { success: true, cleared, userDataPath };
    } catch (e: any) {
      return { success: false, error: e?.message };
    }
  });
}
