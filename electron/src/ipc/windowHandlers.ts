import { ipcMain, BrowserWindow } from 'electron';

export function registerWindowHandlers(getMainWindow: () => BrowserWindow | null): void {
  ipcMain.on('window-minimize', () => {
    const win = getMainWindow();
    if (win) win.minimize();
  });

  ipcMain.on('window-maximize', () => {
    const win = getMainWindow();
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
  });

  ipcMain.on('window-close', () => {
    const win = getMainWindow();
    if (win) win.close();
  });

  ipcMain.handle('window-is-maximized', () => {
    const win = getMainWindow();
    return win ? win.isMaximized() : false;
  });

  ipcMain.on('window-move', (_event, { deltaX, deltaY }) => {
    const win = getMainWindow();
    if (win && !win.isMaximized()) {
      const [x, y] = win.getPosition();
      win.setPosition(Math.round(x + deltaX), Math.round(y + deltaY));
    }
  });
}
