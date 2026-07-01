const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const os = require('os');
const http = require('http');
const https = require('https');
const fs = require('fs');
const { exec } = require('child_process');
const JSZip = require('jszip');

// Định nghĩa helper ghi log hệ thống
function writeAppLog(msg) {
  try {
    const logPath = path.join(app.getPath('userData'), 'tts_playback_debug.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] [App] ${msg}\n`, 'utf8');
    console.log(`[AppLog] ${msg}`);
  } catch (err) {
    console.error('Failed to write app log:', err);
  }
}

// Log khởi động hệ thống ban đầu
writeAppLog('========================================');
writeAppLog('--- KHỞI ĐỘNG ỨNG DỤNG TIÊN HIỆP AI ---');
writeAppLog(`Phiên bản App: ${app.getVersion()}`);
writeAppLog(`Hệ điều hành: ${process.platform} (${os.release()})`);
writeAppLog(`Kiến trúc CPU: ${process.arch}, RAM trống: ${(os.freemem() / (1024 * 1024 * 1024)).toFixed(2)} GB / ${(os.totalmem() / (1024 * 1024 * 1024)).toFixed(2)} GB`);
writeAppLog('========================================');

let mainWindow;
let oauthServer = null;
const OAUTH_PORT = 53241;
let isQuitting = false;
let backendRestartCount = 0;
const MAX_BACKEND_RESTARTS = 3;
let healthMonitorInterval = null;
let backendEverConnected = false;

function registerLinuxDevProtocol() {
  if (process.platform !== 'linux' || app.isPackaged) return;

  const homeDir = os.homedir();
  const destDir = path.join(homeDir, '.local/share/applications');
  const iconPath = path.join(path.resolve(app.getAppPath()), 'public/icon.png');

  // Set desktop name to match filename (excluding .desktop)
  app.desktopName = 'tienhiepai.desktop';

  const desktopContent = `[Desktop Entry]
Name=Tiên Hiệp AI Dev
Exec="${process.execPath}" "${path.resolve(app.getAppPath())}" %u
Icon=${iconPath}
Type=Application
Terminal=false
MimeType=x-scheme-handler/tienhiepai;
`;

  try {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    const files = ['tienhiepai.desktop', 'TienHiepAI.desktop', 'tienhiepai-dev.desktop'];
    for (const file of files) {
      const filePath = path.join(destDir, file);
      fs.writeFileSync(filePath, desktopContent, 'utf-8');
      exec(`chmod +x "${filePath}"`);
    }
    
    // Register the mime type handler with the OS
    exec(`update-desktop-database ${destDir}`, (err) => {
      if (err) console.error('[Linux Dev Protocol] Failed to update desktop database:', err);
    });
    exec(`xdg-mime default tienhiepai.desktop x-scheme-handler/tienhiepai`, (err) => {
      if (err) console.error('[Linux Dev Protocol] Failed to set default handler:', err);
    });
    
    console.log('[Linux Dev Protocol] Dev protocol handler registered.');
  } catch (e) {
    console.error('[Linux Dev Protocol] Error registering protocol:', e);
  }
}

function killBackendOnPort(port) {
  return new Promise((resolve) => {
    try {
      if (process.platform === 'win32') {
        // Force kill any orphaned App_Doc_Truyen_Engine processes first
        exec(`taskkill /F /IM App_Doc_Truyen_Engine.exe`, { stdio: 'ignore' }, () => {
          // Then kill the process listening on port 8001
          exec(`cmd.exe /c "for /f \\"tokens=5\\" %a in ('netstat -aon ^| findstr :${port}') do taskkill /F /PID %a"`, { stdio: 'ignore' }, () => {
            writeAppLog(`[Port Killer] Đã giải phóng port ${port}`);
            resolve();
          });
        });
      } else {
        // Linux/macOS fallback
        exec(`pkill -9 -f App_Doc_Truyen_Engine`, { stdio: 'ignore' }, () => {
          exec(`fuser -k ${port}/tcp`, { stdio: 'ignore' }, () => {
            writeAppLog(`[Port Killer] Đã giải phóng port ${port}`);
            resolve();
          });
        });
      }
    } catch (e) {
      resolve();
    }
  });
}

async function startOAuthServer() {
  if (oauthServer) return; // Already running

  try {
    writeAppLog('[OAuth Server] Đang kiểm tra giải phóng cổng 53241...');
    await killBackendOnPort(OAUTH_PORT);
  } catch (err) {
    writeAppLog(`[OAuth Server] Lỗi khi giải phóng cổng: ${err.message}`);
  }

  oauthServer = http.createServer((req, res) => {
    // Add CORS headers so the browser page can fetch it
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    const parsedUrl = new URL(req.url, `http://127.0.0.1:${OAUTH_PORT}`);
    if (parsedUrl.pathname === '/callback') {
      const token = parsedUrl.searchParams.get('token');
      const refreshToken = parsedUrl.searchParams.get('refresh_token');
      const user = parsedUrl.searchParams.get('user');
      
      if (token && mainWindow) {
        mainWindow.webContents.send('oauth-callback-token', { token, refreshToken, user });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        return;
      }
    }
    
    res.writeHead(400);
    res.end('Yêu cầu không hợp lệ');
  });

  oauthServer.on('error', (err) => {
    writeAppLog(`[OAuth Server] Gặp lỗi server: ${err.message}`);
  });

  oauthServer.listen(OAUTH_PORT, '127.0.0.1', () => {
    writeAppLog(`[OAuth Server] Listening on http://127.0.0.1:${OAUTH_PORT}`);
  });
}

// Register custom protocol client
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('tienhiepai', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('tienhiepai');
}

const gotTheLock = app.requestSingleInstanceLock();

function createWindow() {
  startOAuthServer();

  const isDev = !app.isPackaged;
  const isWin = process.platform === 'win32';
  const iconExt = isWin ? 'ico' : 'png';
  let iconPath;
  if (isDev) {
    iconPath = path.join(__dirname, `../public/icon.${iconExt}`);
  } else {
    // In production, icon is inside .asar — Windows can't read it for taskbar/shortcut.
    // Extract to a real file on disk that the OS can access.
    const asarIconPath = path.join(__dirname, `../dist/icon.${iconExt}`);
    const extractedIconPath = path.join(app.getPath('userData'), `icon.${iconExt}`);
    try {
      if (!fs.existsSync(extractedIconPath)) {
        const iconData = fs.readFileSync(asarIconPath);
        fs.writeFileSync(extractedIconPath, iconData);
      }
      iconPath = extractedIconPath;
    } catch (e) {
      writeAppLog(`[App] Icon extraction failed: ${e.message}`);
      iconPath = asarIconPath; // fallback
    }
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Tiên Hiệp AI",
    icon: iconPath,
    frame: false, // Make window frameless
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    backgroundColor: '#060613', // Deep dark theme background color matching web styling to prevent white flash
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
    },
  });

  // Remove default menu bar to make it match the web interface
  Menu.setApplicationMenu(null);
  mainWindow.setAutoHideMenuBar(true);

  // Prevent web page SEO HTML title from overriding the clean application window title
  mainWindow.on('page-title-updated', (event) => {
    event.preventDefault();
  });

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-state-change', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-state-change', false);
  });

  // Bypass Google OAuth 2.0 security policy block inside Electron by using a clean Chrome User-Agent
  mainWindow.webContents.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

  // Toggle DevTools on F12/Ctrl+Shift+I keypress, and allow Ctrl+R to reload in production
  mainWindow.webContents.on('before-input-event', (event, input) => {
    const key = input.key.toLowerCase();
    const isDevToolsShortcut = (input.key === 'F12' || (input.control && input.shift && key === 'i'));
    if (isDevToolsShortcut && input.type === 'keyDown') {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
    const isReloadShortcut = (input.control && key === 'r');
    if (isReloadShortcut && input.type === 'keyDown') {
      mainWindow.webContents.reload();
      event.preventDefault();
    }
  });

  // Detect mode
  if (isDev) {
    mainWindow.loadURL('http://localhost:3532');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Focus existing window or recreate it
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      
      // On Windows/Linux: Extract the deep link URL from arguments
      const url = commandLine.find(arg => arg.startsWith('tienhiepai://'));
      if (url) {
        mainWindow.webContents.send('oauth-callback', url);
      }
    } else {
      createWindow();
    }
  });
} // end else gotTheLock

const { spawn, execSync } = require('child_process');
let backendProcess = null;
let backendState = { running: false, error: null, checkedPaths: [] };

// killBackendOnPort moved to top to prevent hoisting issues

function findExecutable(dir, filename) {
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
      } catch (e) {
        // Bỏ qua lỗi truy cập file
      }
    }
  } catch (dirErr) {
    // Bỏ qua lỗi truy cập thư mục
  }
  return null;
}

function extractZip(zipPath, destDir) {
  return new Promise(async (resolve, reject) => {
    try {
      writeAppLog(`[Engine Extractor] Bắt đầu giải nén bằng JSZip từ: ${zipPath}`);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      const zipData = fs.readFileSync(zipPath);
      const zip = await JSZip.loadAsync(zipData);
      
      const files = Object.keys(zip.files);
      for (const filename of files) {
        const file = zip.files[filename];
        const destPath = path.join(destDir, filename);
        
        if (file.dir) {
          fs.mkdirSync(destPath, { recursive: true });
        } else {
          const parentDir = path.dirname(destPath);
          if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir, { recursive: true });
          }
          
          const content = await file.async('nodebuffer');
          fs.writeFileSync(destPath, content);
        }
      }
      writeAppLog(`[Engine Extractor] Giải nén bằng JSZip thành công.`);
      resolve(true);
    } catch (err) {
      writeAppLog(`[Engine Extractor] Giải nén bằng JSZip thất bại: ${err.message}. Đang thử fallback sang lệnh hệ thống...`);
      
      // Wipe out the corrupted destDir first to prevent namespace collisions during fallback extraction
      try {
        if (fs.existsSync(destDir)) {
          writeAppLog(`[Engine Extractor Fallback] Đang dọn dẹp thư mục lỗi trước khi giải nén lại...`);
          fs.rmSync(destDir, { recursive: true, force: true });
        }
        fs.mkdirSync(destDir, { recursive: true });
      } catch (cleanErr) {
        writeAppLog(`[Engine Extractor Fallback] Cảnh báo dọn dẹp thất bại: ${cleanErr.message}`);
      }

      let cmd;
      if (process.platform === 'win32') {
        cmd = `powershell -Command "Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${destDir}' -Force"`;
      } else {
        cmd = `unzip -o "${zipPath}" -d "${destDir}"`;
      }
      writeAppLog(`[Engine Extractor Fallback] Đang giải nén bằng lệnh: ${cmd}`);
      exec(cmd, (fallErr, stdout, stderr) => {
        if (fallErr) {
          writeAppLog(`[Engine Extractor Fallback] Giải nén thất bại: ${fallErr.message}. Stderr: ${stderr}`);
          reject(fallErr);
        } else {
          writeAppLog(`[Engine Extractor Fallback] Giải nén thành công.`);
          resolve(true);
        }
      });
    }
  });
}


async function ensureEngineExtracted() {
  const isWin = process.platform === 'win32';
  const binaryName = isWin ? 'App_Doc_Truyen_Engine.exe' : 'App_Doc_Truyen_Engine';
  const destDir = path.join(app.getPath('userData'), 'bin');
  const finalBinary = findExecutable(destDir, binaryName);

  const versionFilePath = path.join(destDir, 'version.txt');
  const currentAppVersion = app.getVersion();
  
  let needsExtraction = true;
  if (finalBinary && fs.existsSync(finalBinary) && fs.existsSync(versionFilePath)) {
    try {
      const savedVersion = fs.readFileSync(versionFilePath, 'utf8').trim();
      if (savedVersion === currentAppVersion) {
        needsExtraction = false;
      }
    } catch (e) {
      writeAppLog(`[Engine Auto-Prep] Lỗi đọc version.txt: ${e.message}`);
    }
  }

  if (!needsExtraction) {
    writeAppLog(`[Engine Auto-Prep] Engine binary đã tồn tại đúng phiên bản (${currentAppVersion}) tại: ${finalBinary}. Không cần giải nén.`);
    return true;
  }

  // Nếu cần giải nén, dọn dẹp thư mục cũ trước để đảm bảo sạch sẽ
  if (fs.existsSync(destDir)) {
    try {
      writeAppLog(`[Engine Auto-Prep] Đang dọn dẹp thư mục cũ để cập nhật phiên bản mới...`);
      fs.rmSync(destDir, { recursive: true, force: true });
    } catch (cleanErr) {
      writeAppLog(`[Engine Auto-Prep] Cảnh báo dọn dẹp thư mục cũ thất bại: ${cleanErr.message}`);
    }
  }

  // Engine does not exist, look for the zip in resources
  const zipFilename = isWin ? 'windows_cpu.zip' : 'linux_cpu.zip';
  const resourcesBinDir = app.isPackaged
    ? path.join(process.resourcesPath, 'bin')
    : path.join(__dirname, '../../TTS_ONNX_Deploy');
  
  const zipPath = path.join(resourcesBinDir, zipFilename);
  if (!fs.existsSync(zipPath)) {
    writeAppLog(`[Engine Auto-Prep] Không tìm thấy file zip đóng gói sẵn tại: ${zipPath}`);
    return false;
  }

  writeAppLog(`[Engine Auto-Prep] Đang giải nén engine đi kèm từ: ${zipPath} sang ${destDir}...`);
  try {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    await extractZip(zipPath, destDir);
    writeAppLog(`[Engine Auto-Prep] Giải nén thành công.`);

    // Post-extraction flattener logic
    const foundBinary = findExecutable(destDir, binaryName);
    if (foundBinary) {
      const foundDir = path.dirname(foundBinary);
      if (foundDir !== destDir) {
        writeAppLog(`[Engine Auto-Prep] Phát hiện thư mục lồng. Di chuyển các file từ ${foundDir} lên ${destDir}`);
        const items = fs.readdirSync(foundDir);
        for (const item of items) {
          const src = path.join(foundDir, item);
          const dst = path.join(destDir, item);
          if (fs.existsSync(dst)) {
            const srcStat = fs.statSync(src);
            if (srcStat.isDirectory()) {
              fs.rmSync(dst, { recursive: true, force: true });
            } else {
              fs.unlinkSync(dst);
            }
          }
          fs.renameSync(src, dst);
        }
        try {
          fs.rmSync(foundDir, { recursive: true, force: true });
        } catch (e) {}
      }
    }

    // Set permission on Linux
    if (!isWin) {
      const linuxBinary = findExecutable(destDir, binaryName);
      if (linuxBinary) {
        fs.chmodSync(linuxBinary, 0o755);
        writeAppLog(`[Engine Auto-Prep] Đã cấp quyền thực thi cho ${linuxBinary}`);
      }
    }

    // Synchronize models
    if (fs.existsSync(resourcesBinDir)) {
      const models = fs.readdirSync(resourcesBinDir).filter(f => f.endsWith('.onnx'));
      for (const model of models) {
        const srcModel = path.join(resourcesBinDir, model);
        const dstModel = path.join(destDir, model);
        if (!fs.existsSync(dstModel)) {
          fs.copyFileSync(srcModel, dstModel);
          writeAppLog(`[Engine Auto-Prep] Đã đồng bộ model ${model} thành công.`);
        }
      }
    }

    // Ghi version.txt để đánh dấu phiên bản cài đặt thành công
    try {
      fs.writeFileSync(versionFilePath, currentAppVersion, 'utf8');
      writeAppLog(`[Engine Auto-Prep] Đã ghi nhận phiên bản cài đặt mới: ${currentAppVersion}`);
    } catch (versionErr) {
      writeAppLog(`[Engine Auto-Prep] Lỗi ghi version.txt: ${versionErr.message}`);
    }

    writeAppLog(`[Engine Auto-Prep] ✅ Hoàn tất cài đặt tự động engine.`);
    return true;
  } catch (err) {
    writeAppLog(`[Engine Auto-Prep] ❌ Lỗi giải nén engine tự động: ${err.stack || err.message || String(err)}`);
    return false;
  }
}


async function startBackend() {
  const isDev = !app.isPackaged;
  
  if (app.isPackaged) {
    writeAppLog('[Backend Daemon] Đang kiểm tra động cơ đi kèm ứng dụng...');
    await ensureEngineExtracted();
  }
  let command;
  let args = [];
  
  const env = { ...process.env };
  
  if (process.platform === 'linux') {
    // Tiêm các thư viện CUDA/cuDNN vào LD_LIBRARY_PATH để chạy GPU trên Linux
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
      writeAppLog(`[Backend Daemon] Đã tự động tiêm LD_LIBRARY_PATH CUDA/cuDNN: ${env.LD_LIBRARY_PATH}`);
    }
  }

  let spawnOptions = {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
    env: env
  };

  // Giải phóng port 8001 trước khi khởi chạy
  writeAppLog('[Backend Daemon] Đang kiểm tra giải phóng cổng 8001...');
  await killBackendOnPort(8001);

  if (isDev) {
    // Trong môi trường Dev, ưu tiên chạy trực tiếp bằng python3 api_server.py để nhận thư viện GPU
    const devScriptPath = path.join(__dirname, '../../TTS_ONNX_Deploy/api_server.py');
    if (fs.existsSync(devScriptPath)) {
      command = process.platform === 'win32' ? 'python' : 'python3';
      args = [devScriptPath];
      spawnOptions.cwd = path.dirname(devScriptPath);
      writeAppLog(`[Backend Daemon] Khởi chạy engine ở chế độ DEV (Python Script): ${command} ${args.join(' ')}`);
    }
  }

  if (!command) {
    // Tìm file binary đã đóng gói (App_Doc_Truyen_Engine)
    const binaryName = process.platform === 'win32' ? 'App_Doc_Truyen_Engine.exe' : 'App_Doc_Truyen_Engine';
    
    // Tìm kiếm đệ quy trong thư mục userData/bin trước để tránh bị lồng thư mục zip
    const userDataBin = path.join(app.getPath('userData'), 'bin');
    let checkedPaths = [];
    checkedPaths.push({ path: userDataBin + ' (Tìm kiếm đệ quy)', exists: fs.existsSync(userDataBin) });
    let foundPath = findExecutable(userDataBin, binaryName);
    
    if (!foundPath) {
      // Các đường dẫn tĩnh dự phòng khác
      const possiblePaths = [
        path.join(app.getPath('userData'), binaryName),
        path.join(__dirname, '../../TTS_ONNX_Deploy', binaryName),
        path.join(process.resourcesPath, binaryName),
        path.join(process.resourcesPath, 'bin', binaryName),
        path.join(app.getAppPath(), '..', binaryName)
      ];
      possiblePaths.forEach(p => {
        checkedPaths.push({ path: p, exists: fs.existsSync(p) });
      });
      foundPath = possiblePaths.find(p => fs.existsSync(p));
    }
    
    backendState.checkedPaths = checkedPaths;
    
    if (foundPath) {
      command = foundPath;
      spawnOptions.cwd = path.dirname(command);
      writeAppLog(`[Backend Daemon] Khởi chạy engine dạng Binary từ: ${command}`);
      backendState.error = null;
      
      // Tự động sao chép package regex từ _internal ra ngoài thư mục gốc để bypass PyInstaller import block
      try {
        const internalRegex = path.join(spawnOptions.cwd, '_internal', 'regex');
        const targetRegex = path.join(spawnOptions.cwd, 'regex');
        if (fs.existsSync(internalRegex) && !fs.existsSync(targetRegex)) {
          writeAppLog('[Backend Daemon] Đang copy thư mục regex ra ngoài thư mục gốc để tránh lỗi import...');
          const copyRecursive = (src, dest) => {
            const exists = fs.existsSync(src);
            const stats = exists && fs.statSync(src);
            const isDirectory = stats && stats.isDirectory();
            if (isDirectory) {
              if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest, { recursive: true });
              }
              fs.readdirSync(src).forEach((childItemName) => {
                copyRecursive(path.join(src, childItemName), path.join(dest, childItemName));
              });
            } else {
              fs.copyFileSync(src, dest);
            }
          };
          copyRecursive(internalRegex, targetRegex);
          writeAppLog('[Backend Daemon] Đã copy thành công thư mục regex.');
        }
      } catch (copyErr) {
        writeAppLog(`[Backend Daemon] Lỗi copy thư mục regex: ${copyErr.stack || copyErr.message || String(copyErr)}`);
      }
      
      // Tự động đồng bộ/sao chép model ONNX sang đúng thư mục chạy thực tế của engine
      try {
        const resourcesBinDir = isDev 
          ? path.join(__dirname, '../../TTS_ONNX_Deploy')
          : path.join(process.resourcesPath, 'bin');
          
        if (fs.existsSync(resourcesBinDir) && fs.existsSync(spawnOptions.cwd)) {
          const files = fs.readdirSync(resourcesBinDir);
          for (const file of files) {
            if (file.endsWith('.onnx')) {
              const srcFile = path.join(resourcesBinDir, file);
              const destFile = path.join(spawnOptions.cwd, file);
              if (!fs.existsSync(destFile)) {
                writeAppLog(`[Backup Sync] Đang sao chép file ${file} từ resources sang ${spawnOptions.cwd}...`);
                fs.copyFileSync(srcFile, destFile);
              }
            }
          }
        }
      } catch (syncErr) {
        writeAppLog(`[Backup Sync] Lỗi đồng bộ model: ${syncErr.stack || syncErr.message || String(syncErr)}`);
      }
    } else {
      writeAppLog('[Backend Daemon] LỖI CỰC KỲ NGHIÊM TRỌNG: Không tìm thấy file chạy Engine ở tất cả các đường dẫn dự phòng!');
      writeAppLog('[Backend Daemon] Chi tiết danh sách các đường dẫn đã kiểm tra:');
      checkedPaths.forEach(item => {
        writeAppLog(`  - [${item.exists ? 'TỒN TẠI' : 'THIẾU'}] ${item.path}`);
      });
      writeAppLog('[Backend Daemon] HƯỚNG DẪN KHẮC PHỤC: Vui lòng vào mục Cài đặt -> Cấu hình Đọc/Quản lý Giọng AI -> click "Tải Động Cơ CPU" hoặc "Tải Động Cơ GPU" để tải bộ động cơ chạy offline.');
      backendState.error = 'missing_engine';
      backendState.running = false;
      return;
    }
  }
  try {
    const logPath = path.join(app.getPath('userData'), 'tts_playback_debug.log');
    const logStream = fs.createWriteStream(logPath, { flags: 'a' });
    
    // Khởi chạy tiến trình, lắng nghe pipe stdout và stderr
    writeAppLog(`[Backend Daemon] Đang spawn process: ${command} ${args.join(' ')}`);
    backendProcess = spawn(command, args, spawnOptions);
    backendState.error = null;
    
    backendProcess.stdout.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg) {
        logStream.write(`[${new Date().toISOString()}] [Python Server STDOUT] ${msg}\n`);
      }
    });
    
    backendProcess.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg) {
        logStream.write(`[${new Date().toISOString()}] [Python Server STDERR] ${msg}\n`);
      }
    });
 
    backendProcess.on('error', (err) => {
      writeAppLog(`[Backend Daemon] Lỗi khởi chạy tiến trình: ${err.stack || err.message || String(err)}`);
      backendState.error = 'spawn_failed';
      backendState.running = false;
    });
 
    backendProcess.on('exit', (code, signal) => {
      writeAppLog(`[Backend Daemon] Engine chạy ngầm đã thoát. Exit Code: ${code}, Signal: ${signal}`);
      backendState.running = false;
      stopHealthMonitor();
      if (code !== 0 && code !== null) {
        backendState.error = `process_exited_with_code_${code}`;
      }
      
      // Tự động khởi động lại Engine nếu bị đột tử (Crash recovery)
      if (!isQuitting && code !== 0 && code !== null) {
        if (backendRestartCount < MAX_BACKEND_RESTARTS) {
          backendRestartCount++;
          const delay = 3000;
          writeAppLog(`[Backend Daemon] Phát hiện sự cố bất thường! Đang tự động khởi động lại Engine (Lần ${backendRestartCount}/${MAX_BACKEND_RESTARTS}) sau ${delay/1000} giây...`);
          setTimeout(() => {
            if (!isQuitting) {
              startBackend().then(() => {
                waitForBackendReady(15000).then((ready) => {
                  if (ready) {
                    writeAppLog('[Backend Daemon] Khởi động lại và kết nối lại thành công.');
                    backendRestartCount = 0;
                    backendEverConnected = true;
                    startHealthMonitor();
                    if (mainWindow && !mainWindow.isDestroyed()) {
                      mainWindow.webContents.send('backend-ready', { ready: true });
                    }
                  } else {
                    writeAppLog('[Backend Daemon] Thử kết nối lại thất bại (Timeout).');
                  }
                });
              });
            }
          }, delay);
        } else {
          // Đã hết lượt thử nhanh → chờ 60s rồi reset counter và thử lại
          writeAppLog(`[Backend Daemon] Đã vượt quá ${MAX_BACKEND_RESTARTS} lần thử nhanh. Chờ 60 giây rồi thử lại...`);
          setTimeout(() => {
            if (!isQuitting) {
              writeAppLog('[Backend Daemon] Hết thời gian chờ cooldown. Reset counter và thử khởi động lại...');
              backendRestartCount = 0;
              startBackend().then(() => {
                waitForBackendReady(20000).then((ready) => {
                  if (ready) {
                    writeAppLog('[Backend Daemon] Khởi động lại sau cooldown thành công!');
                    backendEverConnected = true;
                    startHealthMonitor();
                    if (mainWindow && !mainWindow.isDestroyed()) {
                      mainWindow.webContents.send('backend-ready', { ready: true });
                    }
                  } else {
                    writeAppLog('[Backend Daemon] Khởi động lại sau cooldown vẫn thất bại.');
                  }
                });
              });
            }
          }, 60000);
        }
      }
    });
  } catch (e) {
    writeAppLog(`[Backend Daemon] Gặp lỗi crash khi gọi tiến trình: ${e.stack || e.message || String(e)}`);
    backendState.error = 'exception_during_spawn';
  }
}

function stopBackend() {
  isQuitting = true;
  if (backendProcess) {
    writeAppLog('[Backend Daemon] Đang tắt engine chạy ngầm...');
    try {
      if (process.platform === 'win32') {
        backendProcess.kill();
      } else {
        process.kill(-backendProcess.pid, 'SIGKILL');
      }
    } catch (e) {
      try { backendProcess.kill(); } catch (err) {}
    }
    backendProcess = null;
    writeAppLog('[Backend Daemon] Đã tắt engine thành công.');
  }
}

// Poll /health until server responds or timeout
function waitForBackendReady(timeoutMs = 20000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const interval = setInterval(() => {
      const req = http.get('http://127.0.0.1:8001/health', (res) => {
        if (res.statusCode === 200) {
          clearInterval(interval);
          resolve(true);
        }
        res.resume();
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          resolve(false);
        }
      });
      req.setTimeout(800, () => req.destroy());
    }, 600);
  });
}

// ── Health Monitor: Tự động phát hiện engine chết và khởi động lại ────────────
function startHealthMonitor() {
  stopHealthMonitor();
  writeAppLog('[Health Monitor] Bắt đầu giám sát sức khỏe engine (mỗi 30 giây).');
  healthMonitorInterval = setInterval(() => {
    if (isQuitting) {
      stopHealthMonitor();
      return;
    }
    const req = http.get('http://127.0.0.1:8001/health', (res) => {
      res.resume();
      // Engine vẫn sống, không cần làm gì
    });
    req.on('error', () => {
      writeAppLog('[Health Monitor] Engine không phản hồi /health! Đang kiểm tra process...');
      let processAlive = false;
      if (backendProcess) {
        try { processAlive = backendProcess.kill(0); } catch (e) { processAlive = false; }
      }
      if (!processAlive && !isQuitting) {
        writeAppLog('[Health Monitor] Process đã chết. Tự động khởi động lại engine...');
        stopHealthMonitor();
        backendProcess = null;
        backendRestartCount = 0;
        startBackend().then(() => {
          waitForBackendReady(20000).then((ready) => {
            if (ready) {
              writeAppLog('[Health Monitor] Engine khởi động lại thành công!');
              backendState.running = true;
              backendState.error = null;
              startHealthMonitor();
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('backend-ready', { ready: true });
              }
            } else {
              writeAppLog('[Health Monitor] Engine khởi động lại thất bại. Sẽ thử lại sau 30 giây...');
              startHealthMonitor();
            }
          });
        });
      }
    });
    req.setTimeout(5000, () => req.destroy());
  }, 30000);
}

function stopHealthMonitor() {
  if (healthMonitorInterval) {
    clearInterval(healthMonitorInterval);
    healthMonitorInterval = null;
  }
}

app.whenReady().then(() => {
  registerLinuxDevProtocol();
  createWindow();

  // Khởi động backend bất đồng bộ để tránh block cửa sổ chính
  setTimeout(async () => {
    await startBackend();
    if (!backendProcess) {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('backend-ready', { ready: false, error: backendState.error || 'missing_engine', checkedPaths: backendState.checkedPaths });
      }
      return;
    }
    waitForBackendReady(25000).then((ready) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (ready) {
          backendState.running = true;
          backendState.error = null;
          backendEverConnected = true;
          startHealthMonitor();
          mainWindow.webContents.send('backend-ready', { ready: true });
        } else {
          backendState.running = false;
          backendState.error = 'timeout_start_failed';
          mainWindow.webContents.send('backend-ready', { ready: false, error: 'timeout_start_failed' });
        }
      }
    });
  }, 100);

  app.on('web-contents-created', (event, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
      if (contents.getType() === 'webview') {
        contents.loadURL(url);
        return { action: 'deny' };
      }
      return { action: 'allow' };
    });
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// On macOS: Handle URL open
app.on('open-url', (event, url) => {
  event.preventDefault();
  if (mainWindow) {
    mainWindow.webContents.send('oauth-callback', url);
  }
});

app.on('window-all-closed', () => {
  stopBackend();
  app.exit(0);
});

app.on('will-quit', () => {
  stopBackend();
});

// IPC Handler examples (Electron-only features)
ipcMain.handle('get-system-info', async () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: app.getVersion(),
    cpuCount: os.cpus().length,
    freeMemoryGB: (os.freemem() / (1024 * 1024 * 1024)).toFixed(2),
    totalMemoryGB: (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2),
  };
});

ipcMain.handle('log-debug', async (event, msg) => {
  try {
    const logPath = path.join(app.getPath('userData'), 'tts_playback_debug.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] [Frontend] ${msg}\n`, 'utf8');
    return true;
  } catch (e) {
    console.error('Failed to write frontend log:', e);
    return false;
  }
});

ipcMain.handle('open-log-folder', async () => {
  try {
    const logDir = app.getPath('userData');
    shell.openPath(logDir);
    return { success: true };
  } catch (e) {
    console.error('Failed to open log folder:', e);
    return { success: false, error: e.message };
  }
});

ipcMain.handle('get-log-content', async () => {
  try {
    const logPath = path.join(app.getPath('userData'), 'tts_playback_debug.log');
    if (!fs.existsSync(logPath)) {
      return 'Chưa có dữ liệu log.';
    }
    const stats = fs.statSync(logPath);
    if (stats.size > 1 * 1024 * 1024) { // file > 1MB, chỉ lấy 100KB cuối
      const fd = fs.openSync(logPath, 'r');
      const bufferSize = 100 * 1024;
      const buffer = Buffer.alloc(bufferSize);
      const startPos = stats.size - bufferSize;
      fs.readSync(fd, buffer, 0, bufferSize, startPos);
      fs.closeSync(fd);
      return '... [Log quá dài, chỉ hiển thị 100KB cuối] ...\n' + buffer.toString('utf8');
    }
    return fs.readFileSync(logPath, 'utf8');
  } catch (e) {
    return `Lỗi đọc log: ${e.message}`;
  }
});

ipcMain.handle('clear-log', async () => {
  try {
    const logPath = path.join(app.getPath('userData'), 'tts_playback_debug.log');
    fs.writeFileSync(logPath, `[${new Date().toISOString()}] [App] Đã xóa nhật ký cũ.\n`, 'utf8');
    return true;
  } catch (e) {
    console.error('Failed to clear log:', e);
    return false;
  }
});

ipcMain.handle('select-directory', async (event, title) => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: title || 'Chọn thư mục',
    properties: ['openDirectory']
  });
  if (result.canceled) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('open-external', async (event, url) => {
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    await shell.openExternal(url);
    return true;
  }
  return false;
});

// Window control IPC handlers
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// Permanent File-Based Store IPC Handlers
ipcMain.handle('store-get', async (event, key) => {
  try {
    const configPath = path.join(app.getPath('userData'), 'app_config.json');
    if (!fs.existsSync(configPath)) return null;
    const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return data[key] || null;
  } catch (e) {
    console.error('[Electron Store] Error reading config:', e);
    return null;
  }
});

ipcMain.handle('store-set', async (event, key, val) => {
  try {
    const configPath = path.join(app.getPath('userData'), 'app_config.json');
    let data = {};
    if (fs.existsSync(configPath)) {
      data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    data[key] = val;
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('[Electron Store] Error writing config:', e);
    return false;
  }
});

ipcMain.handle('store-delete', async (event, key) => {
  try {
    const configPath = path.join(app.getPath('userData'), 'app_config.json');
    if (!fs.existsSync(configPath)) return true;
    const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    delete data[key];
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('[Electron Store] Error deleting config:', e);
    return false;
  }
});

// Download Model IPC Handler
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
    
    const reader = response.body.getReader();
    let downloadedBytes = 0;
    
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
  } catch (e) {
    writeAppLog(`[Download Model] Thất bại: ${e.stack || e.message || String(e)}`);
    return { success: false, error: e.stack || e.message || String(e) };
  }
});

// Download Engine Binary IPC Handler
ipcMain.handle('download-engine', async (event, { type }) => {
  try {
    const isWin = process.platform === 'win32';
    const platform = isWin ? 'windows' : 'linux';
    
    // Tên file zip tải về từ HF: windows_cpu.zip, windows_gpu.zip, linux_cpu.zip...
    const zipFilename = `${platform}_${type}.zip`;
    const subfolder = type === 'gpu' ? 'gpu' : 'cpu';
    const baseUrl = 'https://huggingface.co/datasets/Cong123779/Local-TTS-Engine/resolve/main';
    const url = `${baseUrl}/${subfolder}/${zipFilename}`;
    
    const tempDir = app.getPath('temp');
    const tempZipPath = path.join(tempDir, zipFilename);
    const destDir = path.join(app.getPath('userData'), 'bin');
    
    writeAppLog(`[Download Engine] Bắt đầu tiến trình tải engine: ${zipFilename}`);
    writeAppLog(`[Download Engine] URL nguồn: ${url}`);
    writeAppLog(`[Download Engine] Nơi lưu file tạm: ${tempZipPath}`);
    writeAppLog(`[Download Engine] Thư mục giải nén đích: ${destDir}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const totalBytes = parseInt(response.headers.get('content-length') || '0', 10);
    writeAppLog(`[Download Engine] Dung lượng header trả về: ${(totalBytes/1024/1024).toFixed(2)} MB (${totalBytes} bytes)`);
    
    // Kiểm tra file tải về có quá nhỏ không (dưới 1MB = không phải engine thật)
    if (totalBytes > 0 && totalBytes < 1024 * 1024) {
      throw new Error(`File tải về quá nhỏ (${totalBytes} bytes). Engine chưa được đóng gói cho platform ${platform}. Vui lòng liên hệ nhà phát triển.`);
    }
    
    const fileStream = fs.createWriteStream(tempZipPath);
    const reader = response.body.getReader();
    let downloadedBytes = 0;
    let lastLoggedPercent = -1;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      fileStream.write(Buffer.from(value));
      downloadedBytes += value.length;
      
      if (totalBytes > 0) {
        const percent = Math.round((downloadedBytes / totalBytes) * 100);
        
        // Ghi log tiến độ mỗi 10% để người dùng theo dõi chi tiết
        if (percent % 10 === 0 && percent !== lastLoggedPercent) {
          writeAppLog(`[Download Engine] Tiến độ tải: ${percent}% (${(downloadedBytes/1024/1024).toFixed(2)} MB / ${(totalBytes/1024/1024).toFixed(2)} MB)`);
          lastLoggedPercent = percent;
        }
        
        // Gửi progress với tên file binary giả định để khớp UI
        const uiFilename = isWin ? 'App_Doc_Truyen_Engine.exe' : 'App_Doc_Truyen_Engine';
        event.sender.send('download-progress', { filename: uiFilename, percent, downloadedBytes, totalBytes });
      }
    }
    
    await new Promise((resolve) => fileStream.end(resolve));
    writeAppLog(`[Download Engine] Tải file zip hoàn tất. Bắt đầu giải nén vào thư mục: ${destDir}`);
    
    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Giải nén zip
    await extractZip(tempZipPath, destDir);
    writeAppLog(`[Download Engine] Giải nén zip thành công.`);
    
    // Xóa file zip tạm
    try {
      fs.unlinkSync(tempZipPath);
      writeAppLog(`[Download Engine] Đã dọn dẹp file zip tạm.`);
    } catch (unlinkErr) {
      writeAppLog(`[Download Engine] Không thể dọn dẹp file zip tạm: ${unlinkErr.message}`);
    }
    
    // ── POST-EXTRACTION: Flatten thư mục lồng ──────────────────────────────
    const binaryName = isWin ? 'App_Doc_Truyen_Engine.exe' : 'App_Doc_Truyen_Engine';
    writeAppLog(`[Download Engine] Đang tìm kiếm file thực thi: ${binaryName}`);
    const foundBinary = findExecutable(destDir, binaryName);
    
    if (foundBinary) {
      writeAppLog(`[Download Engine] Đã tìm thấy file thực thi tại: ${foundBinary}`);
      const foundDir = path.dirname(foundBinary);
      
      // Nếu binary nằm trong thư mục con (không phải trực tiếp trong destDir)
      if (foundDir !== destDir) {
        writeAppLog(`[Download Engine] Phát hiện thư mục lồng. Tiến hành di chuyển các file từ ${foundDir} lên ${destDir}`);
        try {
          const items = fs.readdirSync(foundDir);
          writeAppLog(`[Download Engine] Số lượng items cần di chuyển: ${items.length}`);
          for (const item of items) {
            const src = path.join(foundDir, item);
            const dst = path.join(destDir, item);
            try {
              if (fs.existsSync(dst)) {
                const srcStat = fs.statSync(src);
                if (srcStat.isDirectory()) {
                  fs.rmSync(dst, { recursive: true, force: true });
                } else {
                  fs.unlinkSync(dst);
                }
              }
              fs.renameSync(src, dst);
            } catch (moveErr) {
              writeAppLog(`[Download Engine] Lỗi di chuyển item ${item}: ${moveErr.message}`);
            }
          }
          // Xóa thư mục con rỗng
          try { 
            fs.rmSync(foundDir, { recursive: true, force: true }); 
            writeAppLog(`[Download Engine] Đã xóa thư mục con rỗng: ${foundDir}`);
          } catch (e) {}
        } catch (flattenErr) {
          writeAppLog(`[Download Engine] Lỗi trong quá trình flatten thư mục lồng: ${flattenErr.message}`);
        }
      }
    } else {
      writeAppLog(`[Download Engine] ⚠️ Cảnh báo: Không tìm thấy file thực thi ${binaryName} trong các file đã giải nén!`);
    }
    
    // Cấp quyền thực thi nếu chạy trên linux
    if (!isWin) {
      const finalBinary = findExecutable(destDir, binaryName);
      if (finalBinary) {
        try {
          writeAppLog(`[Download Engine] Đang cấp quyền thực thi (chmod 755) cho: ${finalBinary}`);
          fs.chmodSync(finalBinary, 0o755);
          writeAppLog(`[Download Engine] Cấp quyền thực thi thành công.`);
        } catch (chmodErr) {
          writeAppLog(`[Download Engine] Lỗi cấp quyền thực thi: ${chmodErr.message}`);
        }
      }
    }
    
    // ── Đồng bộ ONNX models vào thư mục engine ─────────────────────────────
    try {
      const isDev = !app.isPackaged;
      const resourcesBinDir = isDev 
        ? path.join(__dirname, '../../TTS_ONNX_Deploy')
        : path.join(process.resourcesPath, 'bin');
        
      writeAppLog(`[Download Engine] Bắt đầu đồng bộ models ONNX. Thư mục nguồn: ${resourcesBinDir}`);
      if (fs.existsSync(resourcesBinDir)) {
        const models = fs.readdirSync(resourcesBinDir).filter(f => f.endsWith('.onnx'));
        writeAppLog(`[Download Engine] Các models phát hiện trong resources: ${models.join(', ')}`);
        for (const model of models) {
          const srcModel = path.join(resourcesBinDir, model);
          const dstModel = path.join(destDir, model);
          if (!fs.existsSync(dstModel)) {
            writeAppLog(`[Download Engine] Đang đồng bộ model ${model} sang thư mục engine...`);
            fs.copyFileSync(srcModel, dstModel);
            writeAppLog(`[Download Engine] Đồng bộ ${model} thành công.`);
          } else {
            writeAppLog(`[Download Engine] Model ${model} đã tồn tại trong thư mục engine, bỏ qua sao chép.`);
          }
        }
      } else {
        writeAppLog(`[Download Engine] Thư mục resources/bin không tồn tại: ${resourcesBinDir}`);
      }
    } catch (modelErr) {
      writeAppLog(`[Download Engine] Cảnh báo đồng bộ model: ${modelErr.message}`);
    }
    
    writeAppLog(`[Download Engine] ✅ Hoàn tất cài đặt engine tại: ${destDir}`);
    
    // Tự động khởi động lại Backend Engine chạy ngầm mới tải
    setTimeout(async () => {
      writeAppLog(`[Download Engine] Đang tự động khởi chạy backend daemon mới cài đặt...`);
      try {
        stopBackend();
        await startBackend();
        if (backendProcess) {
          waitForBackendReady(25000).then((ready) => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              if (ready) {
                backendState.running = true;
                backendState.error = null;
                mainWindow.webContents.send('backend-ready', { ready: true });
                writeAppLog(`[Download Engine] Backend daemon đã khởi động và hoạt động ổn định.`);
              } else {
                backendState.running = false;
                backendState.error = 'timeout_start_failed';
                mainWindow.webContents.send('backend-ready', { ready: false, error: 'timeout_start_failed' });
                writeAppLog(`[Download Engine] Lỗi: Timeout chờ backend daemon khởi động.`);
              }
            }
          });
        } else {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('backend-ready', { ready: false, error: backendState.error || 'missing_engine' });
          }
        }
      } catch (startErr) {
        writeAppLog(`[Download Engine] Lỗi khi tự động khởi chạy backend: ${startErr.message}`);
      }
    }, 500);

    return { success: true, path: destDir };
  } catch (e) {
    writeAppLog(`[Download Engine] ❌ Thất bại: ${e.stack || e.message || String(e)}`);
    return { success: false, error: e.stack || e.message || String(e) };
  }
});

// List Models IPC Handler
ipcMain.handle('list-models', async (event, folderPath) => {
  try {
    if (!fs.existsSync(folderPath)) {
      return [];
    }
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
  } catch (e) {
    console.error('Error listing models:', e);
    return [];
  }
});

// Delete Model IPC Handler
ipcMain.handle('delete-model', async (event, filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return { success: true };
    }
    return { success: false, error: 'File not found' };
  } catch (e) {
    console.error('Error deleting model:', e);
    return { success: false, error: e.message };
  }
});

// Read Dictionary IPC Handler
ipcMain.handle('read-dictionary', async (event, filename) => {
  const isDev = !app.isPackaged;
  let dictPath;
  if (isDev) {
    dictPath = path.join(__dirname, '../public/dictionaries', filename);
  } else {
    dictPath = path.join(__dirname, '../dist/dictionaries', filename);
  }
  
  try {
    if (fs.existsSync(dictPath)) {
      return fs.readFileSync(dictPath, 'utf-8');
    } else {
      const altPath = path.join(app.getAppPath(), 'dist/dictionaries', filename);
      if (fs.existsSync(altPath)) {
        return fs.readFileSync(altPath, 'utf-8');
      }
    }
  } catch (err) {
    console.error(`Failed to read dictionary ${filename}:`, err);
  }
  throw new Error(`Dictionary file not found: ${filename}`);
});

// Get Models Path IPC Handler
ipcMain.handle('get-models-path', async () => {
  const isDev = !app.isPackaged;
  const binaryName = process.platform === 'win32' ? 'App_Doc_Truyen_Engine.exe' : 'App_Doc_Truyen_Engine';
  
  // Tìm kiếm đệ quy trong userData/bin (xử lý cả thư mục lồng từ zip)
  const userDataBin = path.join(app.getPath('userData'), 'bin');
  const foundInUserData = findExecutable(userDataBin, binaryName);
  if (foundInUserData) {
    return path.dirname(foundInUserData);
  }

  // Kiểm tra custom binary trong userData gốc (bản cũ nếu có)
  const customPath = path.join(app.getPath('userData'), binaryName);
  if (fs.existsSync(customPath)) {
    return app.getPath('userData');
  }

  if (isDev) {
    return path.join(__dirname, '../../TTS_ONNX_Deploy');
  } else {
    const possiblePaths = [
      path.join(process.resourcesPath, binaryName),
      path.join(process.resourcesPath, 'bin', binaryName),
      path.join(app.getAppPath(), '..', binaryName)
    ];
    const foundPath = possiblePaths.find(p => fs.existsSync(p));
    if (foundPath) {
      return path.dirname(foundPath);
    }
    return path.join(process.resourcesPath, 'bin');
  }
});

// ── Quick Patch Update (Tải ~1.5MB thay vì 95MB) ────────────────────────────
// Chỉ tải zip chứa code JS/CSS mới, ghi đè trực tiếp vào app đã cài đặt
ipcMain.handle('quick-patch-update', async (event, { url, version }) => {
  try {
    const tempDir = app.getPath('temp');
    const patchZip = path.join(tempDir, `patch-${version}.zip`);
    
    writeAppLog(`[Quick Patch] Bắt đầu tải bản patch từ: ${url}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const totalBytes = parseInt(response.headers.get('content-length') || '0', 10);
    const fileStream = fs.createWriteStream(patchZip);
    const reader = response.body.getReader();
    let downloadedBytes = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fileStream.write(Buffer.from(value));
      downloadedBytes += value.length;
      if (totalBytes > 0) {
        const percent = Math.round((downloadedBytes / totalBytes) * 100);
        event.sender.send('update-download-progress', { 
          filename: `patch-${version}.zip`, percent, downloadedBytes, totalBytes 
        });
      }
    }
    await new Promise((resolve) => fileStream.end(resolve));
    writeAppLog(`[Quick Patch] Tải bản patch hoàn tất. Dung lượng: ${(totalBytes/1024).toFixed(1)} KB`);
    
    // Tìm thư mục app đang chạy (nơi chứa app.asar)
    const appPath = app.getAppPath(); // ví dụ: .../resources/app.asar hoặc .../resources/app
    let resourcesDir;
    if (appPath.endsWith('.asar')) {
      resourcesDir = path.dirname(appPath); // .../resources/
    } else {
      resourcesDir = path.join(appPath, '..'); // .../resources/
    }
    
    // Giải nén patch vào thư mục tạm
    const patchExtractDir = path.join(tempDir, `patch-extract-${version}`);
    if (fs.existsSync(patchExtractDir)) {
      fs.rmSync(patchExtractDir, { recursive: true, force: true });
    }
    await extractZip(patchZip, patchExtractDir);
    
    // Ghi đè file bằng cách thay thế app.asar bằng app.asar mới (nếu có trong patch)
    const patchedAsar = path.join(patchExtractDir, 'app.asar');
    if (fs.existsSync(patchedAsar)) {
      const targetAsar = path.join(resourcesDir, 'app.asar');
      writeAppLog(`[Quick Patch] Phát hiện app.asar mới. Đang ghi đè: ${targetAsar}`);
      fs.copyFileSync(patchedAsar, targetAsar);
    } else {
      // Nếu patch chỉ chứa file riêng lẻ, ghi đè từng file
      // (dành cho trường hợp patch chứa dist/assets/, electron/, dist/index.html)
      const asarPath = path.join(resourcesDir, 'app.asar');
      if (fs.existsSync(asarPath)) {
        writeAppLog(`[Quick Patch] Đang unpack và vá file trong app.asar: ${asarPath}`);
        // Giải nén app.asar hiện tại, ghi đè, đóng gói lại
        const asarExtractDir = path.join(tempDir, 'asar-extract-temp');
        if (fs.existsSync(asarExtractDir)) {
          fs.rmSync(asarExtractDir, { recursive: true, force: true });
        }
        
        // Giải nén asar
        const asar = require('@electron/asar');
        asar.extractAll(asarPath, asarExtractDir);
        
        // Copy patch files đè lên
        function copyDirRecursive(src, dest) {
          if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
          const items = fs.readdirSync(src);
          for (const item of items) {
            const srcPath = path.join(src, item);
            const destPath = path.join(dest, item);
            const stat = fs.statSync(srcPath);
            if (stat.isDirectory()) {
              copyDirRecursive(srcPath, destPath);
            } else {
              fs.copyFileSync(srcPath, destPath);
            }
          }
        }
        copyDirRecursive(patchExtractDir, asarExtractDir);
        
        // Đóng gói lại asar
        writeAppLog('[Quick Patch] Đang đóng gói lại app.asar...');
        await asar.createPackage(asarExtractDir, asarPath);
        
        // Dọn dẹp
        fs.rmSync(asarExtractDir, { recursive: true, force: true });
      }
    }
    
    // Dọn dẹp
    try { fs.unlinkSync(patchZip); } catch (e) {}
    try { fs.rmSync(patchExtractDir, { recursive: true, force: true }); } catch (e) {}
    
    writeAppLog(`[Quick Patch] ✅ Nâng cấp bản vá v${version} thành công! Đang tự động khởi động lại...`);
    
    // Restart app
    app.relaunch();
    app.quit();
    
    return { success: true };
  } catch (e) {
    writeAppLog(`[Quick Patch] Lỗi khi nâng cấp bản vá: ${e.stack || e.message || String(e)}`);
    return { success: false, error: e.stack || e.message || String(e) };
  }
});

// Download and Run Update IPC Handler
ipcMain.handle('download-and-run-update', async (event, { url, filename }) => {
  try {
    const tempDir = app.getPath('temp');
    const dest = path.join(tempDir, filename);
    
    console.log(`[Update Downloader] Starting download from ${url} to ${dest}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const totalBytes = parseInt(response.headers.get('content-length') || '0', 10);
    const fileStream = fs.createWriteStream(dest);
    const reader = response.body.getReader();
    let downloadedBytes = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      fileStream.write(Buffer.from(value));
      downloadedBytes += value.length;
      
      if (totalBytes > 0) {
        const percent = Math.round((downloadedBytes / totalBytes) * 100);
        event.sender.send('update-download-progress', { filename, percent, downloadedBytes, totalBytes });
      }
    }
    
    await new Promise((resolve) => fileStream.end(resolve));
    console.log(`[Update Downloader] Download complete. Launching silent upgrade: ${dest}`);

    // Launch based on platform — SỬ DỤNG SILENT MODE để cập nhật đè, không hiện setup wizard
    if (process.platform === 'win32') {
      // Chạy Setup.exe ở chế độ silent (/S) để tự động cài đè bản cũ
      // Không xóa userData/config/models — chỉ cập nhật file app
      const installDir = path.dirname(app.getPath('exe'));
      const child = spawn(dest, ['/S', `/D=${installDir}`], {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();
      console.log(`[Update Downloader] Launched silent installer: ${dest} /S /D=${installDir}`);
    } else if (process.platform === 'linux') {
      if (filename.endsWith('.AppImage')) {
        // Ghi đè AppImage cũ bằng file mới
        const currentExe = app.getPath('exe');
        try {
          // Sao chép AppImage mới đè lên file hiện tại
          fs.copyFileSync(dest, currentExe);
          fs.chmodSync(currentExe, 0o755);
          console.log(`[Update Downloader] Replaced AppImage: ${currentExe}`);
        } catch (replaceErr) {
          // Nếu không ghi đè được (permission), chạy file mới độc lập
          console.warn(`[Update Downloader] Cannot replace in-place, launching new:`, replaceErr.message);
          fs.chmodSync(dest, 0o755);
          const child = spawn(dest, [], {
            detached: true,
            stdio: 'ignore'
          });
          child.unref();
        }
      }
    }
    
    // Đóng app hiện tại sau 2s để installer kịp khởi chạy
    setTimeout(() => {
      app.quit();
    }, 2000);
    
    return { success: true };
  } catch (e) {
    writeAppLog(`[Update Downloader] Lỗi: ${e.stack || e.message || String(e)}`);
    return { success: false, error: e.stack || e.message || String(e) };
  }
});

// Manual Backend Control IPC Handlers
ipcMain.handle('start-backend', async () => {
  try {
    isQuitting = false;
    backendRestartCount = 0;
    if (backendProcess) {
      try {
        const isAlive = backendProcess.kill(0);
        if (isAlive) {
          console.log('[Backend Daemon] Engine is already running.');
          return { success: true, alreadyRunning: true };
        }
      } catch (e) {
        backendProcess = null;
      }
    }
    startBackend();
    return { success: true, started: true };
  } catch (e) {
    console.error('[Backend Control] Failed to start backend:', e);
    return { success: false, error: e.message };
  }
});

ipcMain.handle('stop-backend', async () => {
  try {
    stopHealthMonitor();
    stopBackend();
    return { success: true };
  } catch (e) {
    console.error('[Backend Control] Failed to stop backend:', e);
    return { success: false, error: e.message };
  }
});

ipcMain.handle('check-backend-status', async () => {
  let isAlive = false;
  if (backendProcess) {
    try {
      isAlive = backendProcess.kill(0);
    } catch (e) {
      isAlive = false;
    }
  }
  backendState.running = isAlive;
  if (isAlive) {
    backendState.error = null;
  }
  return backendState;
});

// ── Uninstall App IPC Handler ─────────────────────────────────────────────────
ipcMain.handle('uninstall-app', async () => {
  try {
    if (process.platform === 'linux') {
      // 1. Xóa các file .desktop đã đăng ký
      const homeDir = os.homedir();
      const desktopDir = path.join(homeDir, '.local/share/applications');
      const desktopFiles = ['tienhiepai.desktop', 'TienHiepAI.desktop', 'tienhiepai-dev.desktop'];
      for (const file of desktopFiles) {
        const filePath = path.join(desktopDir, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`[Uninstall] Đã xóa: ${filePath}`);
        }
      }
      // Cập nhật lại MIME database
      exec(`update-desktop-database ${desktopDir}`, () => {});
      exec(`xdg-mime default "" x-scheme-handler/tienhiepai`, () => {});

      // 2. Xóa AppImage nếu đang chạy từ /usr/local/bin hoặc PATH
      const execPath = app.getPath('exe');
      const sudoPaths = ['/usr/local/bin/tienhiep-ai', '/usr/bin/tienhiep-ai'];
      for (const p of sudoPaths) {
        if (fs.existsSync(p)) {
          try {
            exec(`pkexec rm -f "${p}"`, (err) => {
              if (err) console.warn(`[Uninstall] Không thể xóa ${p}:`, err.message);
            });
          } catch (e) {}
        }
      }

      // 3. Xóa userData (config, logs, models cache nếu user đồng ý)
      return { 
        success: true, 
        platform: 'linux',
        userDataPath: app.getPath('userData'),
        execPath
      };

    } else if (process.platform === 'win32') {
      // Chạy uninstaller.exe (do NSIS tạo ra) nếu tồn tại
      const uninstallerPaths = [
        path.join(app.getAppPath(), '..', '..', 'Uninstall TienHiepAI.exe'),
        path.join(process.resourcesPath, '..', 'Uninstall TienHiepAI.exe'),
      ];
      const uninstaller = uninstallerPaths.find(p => fs.existsSync(p));
      if (uninstaller) {
        const { spawn } = require('child_process');
        spawn(uninstaller, ['/S'], { detached: true, stdio: 'ignore' }).unref();
        setTimeout(() => app.quit(), 1500);
        return { success: true, platform: 'win32', launched: true };
      }
      return { success: false, platform: 'win32', error: 'Không tìm thấy uninstaller. Hãy gỡ cài đặt qua Control Panel > Add/Remove Programs.' };

    } else {
      return { success: false, error: 'Platform không được hỗ trợ.' };
    }
  } catch (e) {
    console.error('[Uninstall] Lỗi:', e);
    return { success: false, error: e.message };
  }
});

// ── Clear UserData IPC Handler ────────────────────────────────────────────────
ipcMain.handle('clear-userdata', async () => {
  try {
    const userDataPath = app.getPath('userData');
    // Chỉ xóa các file config/log, không xóa toàn bộ thư mục userData
    const filesToClear = [
      'app_config.json',
      'tts_playback_debug.log',
    ];
    let cleared = [];
    for (const file of filesToClear) {
      const filePath = path.join(userDataPath, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        cleared.push(file);
      }
    }
    return { success: true, cleared, userDataPath };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ── Check For Update IPC Handler ─────────────────────────────────────────────
ipcMain.handle('check-for-update', async () => {
  try {
    const currentVersion = app.getVersion();
    const platform = process.platform === 'win32' ? 'desktop_windows' : 'desktop_linux';
    const apiUrl = 'https://cong123779-tienhiep-api.hf.space/api/releases';

    const response = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    if (!data.success || !data.releases) throw new Error('Invalid API response');

    const releaseInfo = data.releases[platform];
    if (!releaseInfo) throw new Error(`No release found for platform: ${platform}`);

    const latestVersion = releaseInfo.version;

    // Compare semver
    const parseV = (v) => v.replace(/^v/, '').split('.').map(Number);
    const [cMaj, cMin, cPat] = parseV(currentVersion);
    const [lMaj, lMin, lPat] = parseV(latestVersion);

    const hasUpdate =
      lMaj > cMaj ||
      (lMaj === cMaj && lMin > cMin) ||
      (lMaj === cMaj && lMin === cMin && lPat > cPat);

    return {
      success: true,
      hasUpdate,
      currentVersion,
      latestVersion,
      downloadUrl: releaseInfo.download_url,
      patchUrl: releaseInfo.patch_url || null,
      fileSize: releaseInfo.file_size,
      releaseNotes: releaseInfo.release_notes,
      platform
    };
  } catch (e) {
    console.error('[AutoUpdate] Check failed:', e.message);
    return { success: false, error: e.message, hasUpdate: false };
  }
});

