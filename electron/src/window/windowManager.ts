import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import fs from 'fs';
import { writeAppLog } from '../utils/logger';
import { startOAuthServer } from '../oauth/oauthServer';

let mainWindow: BrowserWindow | null = null;

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export function createWindow(): BrowserWindow {
  startOAuthServer(() => mainWindow);

  const isDev = !app.isPackaged;
  const isWin = process.platform === 'win32';
  const iconExt = isWin ? 'ico' : 'png';
  let iconPath: string;

  if (isDev) {
    iconPath = path.join(__dirname, `../public/icon.${iconExt}`);
  } else {
    const asarIconPath = path.join(__dirname, `../dist/icon.${iconExt}`);
    const extractedIconPath = path.join(app.getPath('userData'), `icon.${iconExt}`);
    try {
      if (!fs.existsSync(extractedIconPath) && fs.existsSync(asarIconPath)) {
        fs.writeFileSync(extractedIconPath, fs.readFileSync(asarIconPath));
      }
      iconPath = extractedIconPath;
    } catch {
      iconPath = asarIconPath;
    }
  }

  const isLinux = process.platform === 'linux';

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Tiên Hiệp AI',
    icon: iconPath,
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    backgroundColor: '#060613',
    webPreferences: {
      preload: path.join(__dirname, './preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      webSecurity: false
    }
  });

  Menu.setApplicationMenu(null);
  mainWindow.setAutoHideMenuBar(true);

  mainWindow.on('page-title-updated', (event) => {
    event.preventDefault();
  });

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window-state-change', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window-state-change', false);
  });

  mainWindow.webContents.setUserAgent(
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  );

  mainWindow.webContents.on('before-input-event', (event, input) => {
    const key = input.key.toLowerCase();
    const isDevTools = input.key === 'F12' || (input.control && input.shift && key === 'i');
    if (isDevTools && input.type === 'keyDown') {
      mainWindow?.webContents.toggleDevTools();
      event.preventDefault();
    }
    const isReload = (input.control && key === 'r') || input.key === 'F5';
    if (isReload && input.type === 'keyDown') {
      mainWindow?.webContents.send('active-tab-reload');
      event.preventDefault();
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3532');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}
