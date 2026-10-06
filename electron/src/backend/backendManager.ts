import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';
import { BackendState } from '../types';
import { writeAppLog } from '../utils/logger';
import { killBackendOnPort } from './portKiller';
import { startHealthMonitor, stopHealthMonitor, waitForBackendReady } from './healthMonitor';

export const backendState: BackendState = {
  running: false,
  error: null,
  checkedPaths: []
};

export let backendProcess: any = null;
let isQuitting = false;
let backendRestartCount = 0;
const MAX_RESTARTS = 3;

export function setQuitting(val: boolean): void {
  isQuitting = val;
}

export function findExecutable(dir: string, filename: string): string | null {
  if (!fs.existsSync(dir)) return null;
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          const found = findExecutable(fullPath, filename);
          if (found) return found;
        } else if (file === filename) {
          return fullPath;
        }
      } catch {}
    }
  } catch {}
  return null;
}

export async function startBackend(): Promise<boolean> {
  // 1. Pre-check nếu Go Backend đã đang chạy sẵn trên cổng 5051
  try {
    const isAlreadyRunning = await new Promise<boolean>((res) => {
      const r = http.get('http://127.0.0.1:5051/health', (resp) => {
        resp.resume();
        res(resp.statusCode === 200);
      });
      r.on('error', () => res(false));
      r.setTimeout(800, () => { r.destroy(); res(false); });
    });
    if (isAlreadyRunning) {
      writeAppLog('[Backend Daemon] Backend Go đã đang chạy tại http://127.0.0.1:5051. Tự động kết nối.');
      backendState.running = true;
      backendState.error = null;
      startHealthMonitor(() => isQuitting, () => backendProcess, () => triggerBackendRestart());
      return true;
    }
  } catch {}

  let command: string | null = null;
  let args: string[] = [];
  const env: NodeJS.ProcessEnv = { ...process.env };

  if (process.platform === 'linux') {
    const possibleCudaPaths = [
      '/usr/local/cuda/lib64',
      '/usr/local/cuda-12/lib64',
      '/usr/local/cuda-12.8/lib64',
      '/usr/lib/x86_64-linux-gnu'
    ];
    const libraryPaths = possibleCudaPaths.filter(p => fs.existsSync(p));
    if (libraryPaths.length > 0) {
      const existingLdPath = process.env.LD_LIBRARY_PATH ? `${process.env.LD_LIBRARY_PATH}:` : '';
      env.LD_LIBRARY_PATH = `${existingLdPath}${libraryPaths.join(':')}`;
    }
  }

  const spawnOptions: any = {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
    env
  };

  await killBackendOnPort(8001);

  // Ưu tiên Go Server Engine (Resources Path khi đóng gói hoặc Dev Path)
  const isWin = process.platform === 'win32';
  const binName = isWin ? 'server.exe' : 'server';
  const resourcesPath = (process as any).resourcesPath || '';

  const possibleGoBins = [
    path.join(resourcesPath, 'backend_go/bin', binName),
    path.join(resourcesPath, 'bin', binName),
    path.join(__dirname, '../../backend_go/bin', binName),
    path.join(app.getAppPath(), '../backend_go/bin', binName),
  ];

  for (const p of possibleGoBins) {
    if (fs.existsSync(p)) {
      command = p;
      args = [];
      spawnOptions.cwd = path.dirname(path.dirname(p));
      writeAppLog(`[Backend Daemon] Khởi chạy Go Backend Server: ${command}`);
      break;
    }
  }

  if (!command) {
    const binaryName = process.platform === 'win32' ? 'App_Doc_Truyen_Engine.exe' : 'App_Doc_Truyen_Engine';
    const userDataBin = path.join(app.getPath('userData'), 'bin');
    command = findExecutable(userDataBin, binaryName);
    if (command) spawnOptions.cwd = path.dirname(command);
  }

  if (!command) {
    writeAppLog('[Backend Daemon] CẢNH BÁO: Chưa tìm thấy engine binary cục bộ.');
    backendState.error = 'missing_engine';
    backendState.running = false;
    return false;
  }

  try {
    writeAppLog(`[Backend Daemon] Đang spawn process: ${command} ${args.join(' ')}`);
    backendProcess = spawn(command, args, spawnOptions);
    backendState.error = null;

    backendProcess.stdout?.on('data', (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) console.log(`[Backend STDOUT] ${msg}`);
    });

    backendProcess.stderr?.on('data', (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) console.error(`[Backend STDERR] ${msg}`);
    });

    backendProcess.on('exit', (code: number, signal: string) => {
      writeAppLog(`[Backend Daemon] Engine chạy ngầm đã thoát. Exit Code: ${code}, Signal: ${signal}`);
      backendState.running = false;
      stopHealthMonitor();
      if (code !== 0 && code !== null) {
        backendState.error = `process_exited_with_code_${code}`;
      }
      triggerBackendRestart();
    });

    startHealthMonitor(() => isQuitting, () => backendProcess, () => triggerBackendRestart());
    return true;
  } catch (err: any) {
    writeAppLog(`[Backend Daemon] Lỗi spawn process: ${err?.message}`);
    backendState.error = 'spawn_failed';
    return false;
  }
}

function triggerBackendRestart(): void {
  if (isQuitting || backendRestartCount >= MAX_RESTARTS) return;
  backendRestartCount++;
  writeAppLog(`[Backend Daemon] Tự động khởi động lại lần ${backendRestartCount}/${MAX_RESTARTS}...`);
  setTimeout(() => {
    startBackend().then(() => {
      waitForBackendReady(20000).then((ready) => {
        if (ready) {
          backendRestartCount = 0;
          backendState.running = true;
          backendState.error = null;
        }
      });
    });
  }, 2000);
}

export function stopBackend(): void {
  isQuitting = true;
  stopHealthMonitor();
  if (backendProcess) {
    writeAppLog('[Backend Daemon] Đang tắt engine chạy ngầm...');
    try {
      if (process.platform === 'win32') {
        backendProcess.kill();
      } else {
        process.kill(-backendProcess.pid, 'SIGKILL');
      }
    } catch {
      try { backendProcess.kill(); } catch {}
    }
    backendProcess = null;
    writeAppLog('[Backend Daemon] Đã tắt engine thành công.');
  }
}
