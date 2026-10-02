import { BrowserWindow } from 'electron';

export interface BackendState {
  running: boolean;
  error: string | null;
  checkedPaths: { path: string; exists: boolean }[];
}

export interface AppGlobals {
  mainWindow: BrowserWindow | null;
  backendState: BackendState;
  backendProcess: any;
  backendEverConnected: boolean;
  isQuitting: boolean;
}
