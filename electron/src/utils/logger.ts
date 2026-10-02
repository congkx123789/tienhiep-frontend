import { app } from 'electron';
import fs from 'fs';
import path from 'path';

let logFilePath: string | null = null;

export function getAppLogPath(): string {
  if (!logFilePath) {
    try {
      const userData = app.getPath('userData');
      logFilePath = path.join(userData, 'app.log');
    } catch {
      logFilePath = path.join(process.cwd(), 'app.log');
    }
  }
  return logFilePath;
}

export function writeAppLog(message: string): void {
  const time = new Date().toISOString();
  const line = `[${time}] ${message}\n`;
  try {
    const p = getAppLogPath();
    fs.appendFileSync(p, line, 'utf8');
  } catch (e) {
    console.error('Failed to write app log:', e);
  }
  console.log(`[AppLog] ${message}`);
}
