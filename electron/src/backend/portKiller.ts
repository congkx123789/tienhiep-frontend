import { exec } from 'child_process';
import { writeAppLog } from '../utils/logger';

export function killBackendOnPort(port: number): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (process.platform === 'win32') {
        exec('taskkill /F /IM App_Doc_Truyen_Engine.exe', { stdio: 'ignore' } as any, () => {
          exec(`cmd.exe /c "for /f \\"tokens=5\\" %a in ('netstat -aon ^| findstr :${port}') do taskkill /F /PID %a"`, { stdio: 'ignore' } as any, () => {
            writeAppLog(`[Port Killer] Đã giải phóng port ${port}`);
            resolve();
          });
        });
      } else {
        exec('pkill -9 -f App_Doc_Truyen_Engine', { stdio: 'ignore' } as any, () => {
          exec(`fuser -k ${port}/tcp`, { stdio: 'ignore' } as any, () => {
            writeAppLog(`[Port Killer] Đã giải phóng port ${port}`);
            resolve();
          });
        });
      }
    } catch {
      resolve();
    }
  });
}
