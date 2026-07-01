const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getModelsPath: () => ipcRenderer.invoke('get-models-path'),
  logDebug: (msg) => ipcRenderer.invoke('log-debug', msg),
  selectDirectory: (title) => ipcRenderer.invoke('select-directory', title),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onWindowStateChange: (callback) => {
    const subscription = (event, val) => callback(val);
    ipcRenderer.on('window-state-change', subscription);
    return () => ipcRenderer.off('window-state-change', subscription);
  },
  onOAuthCallback: (callback) => {
    const subscription = (event, data) => {
      if (typeof data === 'string') {
        callback(data);
      } else if (data && data.token) {
        const virtualUrl = `tienhiepai://auth-callback?token=${encodeURIComponent(data.token)}&refresh_token=${encodeURIComponent(data.refreshToken || '')}&user=${encodeURIComponent(data.user || '')}`;
        callback(virtualUrl);
      }
    };
    ipcRenderer.on('oauth-callback', subscription);
    ipcRenderer.on('oauth-callback-token', subscription);
    return () => {
      ipcRenderer.off('oauth-callback', subscription);
      ipcRenderer.off('oauth-callback-token', subscription);
    };
  },
  storeGet: (key) => ipcRenderer.invoke('store-get', key),
  storeSet: (key, val) => ipcRenderer.invoke('store-set', key, val),
  storeDelete: (key) => ipcRenderer.invoke('store-delete', key),
  downloadModel: (url, folderPath, filename) => ipcRenderer.invoke('download-model', { url, folderPath, filename }),
  downloadEngine: (type) => ipcRenderer.invoke('download-engine', { type }),
  listModels: (folderPath) => ipcRenderer.invoke('list-models', folderPath),
  deleteModel: (filePath) => ipcRenderer.invoke('delete-model', filePath),
  onDownloadProgress: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('download-progress', subscription);
    return () => ipcRenderer.off('download-progress', subscription);
  },
  readDictionary: (filename) => ipcRenderer.invoke('read-dictionary', filename),
  downloadAndRunUpdate: (url, filename) => ipcRenderer.invoke('download-and-run-update', { url, filename }),
  onUpdateDownloadProgress: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('update-download-progress', subscription);
    return () => ipcRenderer.off('update-download-progress', subscription);
  },
  startBackend: () => ipcRenderer.invoke('start-backend'),
  stopBackend: () => ipcRenderer.invoke('stop-backend'),
  checkBackendStatus: () => ipcRenderer.invoke('check-backend-status'),
  uninstallApp: () => ipcRenderer.invoke('uninstall-app'),
  clearUserData: () => ipcRenderer.invoke('clear-userdata'),
  checkForUpdate: () => ipcRenderer.invoke('check-for-update'),
  onBackendReady: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('backend-ready', subscription);
    return () => ipcRenderer.off('backend-ready', subscription);
  },
  openLogFolder: () => ipcRenderer.invoke('open-log-folder'),
  quickPatchUpdate: (url, version) => ipcRenderer.invoke('quick-patch-update', { url, version }),
  getLogContent: () => ipcRenderer.invoke('get-log-content'),
  clearLog: () => ipcRenderer.invoke('clear-log')
});
