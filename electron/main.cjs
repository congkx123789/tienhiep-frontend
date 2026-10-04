"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/src/main.ts
var import_electron9 = require("electron");

// electron/src/window/windowManager.ts
var import_electron2 = require("electron");
var import_path2 = __toESM(require("path"), 1);
var import_fs2 = __toESM(require("fs"), 1);

// electron/src/oauth/oauthServer.ts
var import_http = __toESM(require("http"), 1);

// electron/src/utils/logger.ts
var import_electron = require("electron");
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var logFilePath = null;
function getAppLogPath() {
  if (!logFilePath) {
    try {
      const userData = import_electron.app.getPath("userData");
      logFilePath = import_path.default.join(userData, "app.log");
    } catch {
      logFilePath = import_path.default.join(process.cwd(), "app.log");
    }
  }
  return logFilePath;
}
function writeAppLog(message) {
  const time = (/* @__PURE__ */ new Date()).toISOString();
  const line = `[${time}] ${message}
`;
  try {
    const p = getAppLogPath();
    import_fs.default.appendFileSync(p, line, "utf8");
  } catch (e) {
    console.error("Failed to write app log:", e);
  }
  console.log(`[AppLog] ${message}`);
}

// electron/src/backend/portKiller.ts
var import_child_process = require("child_process");
function killBackendOnPort(port) {
  return new Promise((resolve) => {
    try {
      if (process.platform === "win32") {
        (0, import_child_process.exec)("taskkill /F /IM App_Doc_Truyen_Engine.exe", { stdio: "ignore" }, () => {
          (0, import_child_process.exec)(`cmd.exe /c "for /f \\"tokens=5\\" %a in ('netstat -aon ^| findstr :${port}') do taskkill /F /PID %a"`, { stdio: "ignore" }, () => {
            writeAppLog(`[Port Killer] \u0110\xE3 gi\u1EA3i ph\xF3ng port ${port}`);
            resolve();
          });
        });
      } else {
        (0, import_child_process.exec)("pkill -9 -f App_Doc_Truyen_Engine", { stdio: "ignore" }, () => {
          (0, import_child_process.exec)(`fuser -k ${port}/tcp`, { stdio: "ignore" }, () => {
            writeAppLog(`[Port Killer] \u0110\xE3 gi\u1EA3i ph\xF3ng port ${port}`);
            resolve();
          });
        });
      }
    } catch {
      resolve();
    }
  });
}

// electron/src/oauth/oauthServer.ts
var OAUTH_PORT = 53241;
var oauthServer = null;
async function startOAuthServer(getMainWindow2) {
  if (oauthServer) return;
  try {
    writeAppLog(`[OAuth Server] \u0110ang ki\u1EC3m tra gi\u1EA3i ph\xF3ng c\u1ED5ng ${OAUTH_PORT}...`);
    await killBackendOnPort(OAUTH_PORT);
  } catch (err) {
    writeAppLog(`[OAuth Server] L\u1ED7i khi gi\u1EA3i ph\xF3ng c\u1ED5ng: ${err?.message}`);
  }
  oauthServer = import_http.default.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }
    try {
      const parsedUrl = new URL(req.url || "", `http://127.0.0.1:${OAUTH_PORT}`);
      if (parsedUrl.pathname === "/callback") {
        const token = parsedUrl.searchParams.get("token");
        const refreshToken = parsedUrl.searchParams.get("refresh_token");
        const user = parsedUrl.searchParams.get("user");
        const win = getMainWindow2();
        if (token && win && !win.isDestroyed()) {
          win.webContents.send("oauth-callback-token", { token, refreshToken, user });
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
          return;
        }
      }
    } catch {
    }
    res.writeHead(400);
    res.end("Y\xEAu c\u1EA7u kh\xF4ng h\u1EE3p l\u1EC7");
  });
  oauthServer.on("error", (err) => {
    writeAppLog(`[OAuth Server] G\u1EB7p l\u1ED7i server: ${err?.message}`);
  });
  oauthServer.listen(OAUTH_PORT, "127.0.0.1", () => {
    writeAppLog(`[OAuth Server] Listening on http://127.0.0.1:${OAUTH_PORT}`);
  });
}

// electron/src/window/windowManager.ts
var mainWindow = null;
function getMainWindow() {
  return mainWindow;
}
function createWindow() {
  startOAuthServer(() => mainWindow);
  const isDev = !import_electron2.app.isPackaged;
  const isWin = process.platform === "win32";
  const iconExt = isWin ? "ico" : "png";
  let iconPath;
  if (isDev) {
    iconPath = import_path2.default.join(__dirname, `../public/icon.${iconExt}`);
  } else {
    const asarIconPath = import_path2.default.join(__dirname, `../dist/icon.${iconExt}`);
    const extractedIconPath = import_path2.default.join(import_electron2.app.getPath("userData"), `icon.${iconExt}`);
    try {
      if (!import_fs2.default.existsSync(extractedIconPath) && import_fs2.default.existsSync(asarIconPath)) {
        import_fs2.default.writeFileSync(extractedIconPath, import_fs2.default.readFileSync(asarIconPath));
      }
      iconPath = extractedIconPath;
    } catch {
      iconPath = asarIconPath;
    }
  }
  const isLinux = process.platform === "linux";
  mainWindow = new import_electron2.BrowserWindow({
    width: 1280,
    height: 800,
    title: "Ti\xEAn Hi\u1EC7p AI",
    icon: iconPath,
    frame: false,
    titleBarStyle: "hidden",
    titleBarOverlay: false,
    backgroundColor: "#060613",
    webPreferences: {
      preload: import_fs2.default.existsSync(import_path2.default.join(__dirname, "preload.cjs")) ? import_path2.default.join(__dirname, "preload.cjs") : import_path2.default.join(__dirname, "../electron/preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      webSecurity: false
    }
  });
  import_electron2.Menu.setApplicationMenu(null);
  mainWindow.setAutoHideMenuBar(true);
  mainWindow.on("page-title-updated", (event) => {
    event.preventDefault();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    const targetUrl = details.url;
    if (targetUrl && /^https?:\/\//i.test(targetUrl)) {
      mainWindow?.webContents.send("open-in-new-tab", targetUrl);
    }
    return { action: "deny" };
  });
  mainWindow.on("maximize", () => {
    mainWindow?.webContents.send("window-state-change", true);
  });
  mainWindow.on("unmaximize", () => {
    mainWindow?.webContents.send("window-state-change", false);
  });
  mainWindow.webContents.setUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
  );
  mainWindow.webContents.on("before-input-event", (event, input) => {
    const key = input.key.toLowerCase();
    const isDevTools = input.key === "F12" || input.control && input.shift && key === "i";
    if (isDevTools && input.type === "keyDown") {
      mainWindow?.webContents.toggleDevTools();
      event.preventDefault();
    }
    const isReload = input.control && key === "r" || input.key === "F5";
    if (isReload && input.type === "keyDown") {
      mainWindow?.webContents.send("active-tab-reload");
      event.preventDefault();
    }
  });
  if (isDev) {
    mainWindow.loadURL("http://localhost:3532");
  } else {
    mainWindow.loadFile(import_path2.default.join(__dirname, "../dist/index.html"));
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  return mainWindow;
}

// electron/src/backend/backendManager.ts
var import_electron3 = require("electron");
var import_fs3 = __toESM(require("fs"), 1);
var import_path3 = __toESM(require("path"), 1);
var import_http3 = __toESM(require("http"), 1);
var import_child_process2 = require("child_process");

// electron/src/backend/healthMonitor.ts
var import_http2 = __toESM(require("http"), 1);
var healthMonitorInterval = null;
function stopHealthMonitor() {
  if (healthMonitorInterval) {
    clearInterval(healthMonitorInterval);
    healthMonitorInterval = null;
  }
}
function waitForBackendReady(timeoutMs = 2e4) {
  return new Promise((resolve) => {
    const start = Date.now();
    const interval = setInterval(() => {
      const probePort = (port, next) => {
        const req = import_http2.default.get(`http://127.0.0.1:${port}/health`, (res) => {
          if (res.statusCode === 200) {
            clearInterval(interval);
            resolve(true);
          } else {
            next();
          }
          res.resume();
        });
        req.on("error", next);
        req.setTimeout(600, () => req.destroy());
      };
      probePort(5051, () => {
        probePort(8001, () => {
          if (Date.now() - start > timeoutMs) {
            clearInterval(interval);
            resolve(false);
          }
        });
      });
    }, 600);
  });
}
function startHealthMonitor(isQuitting2, getBackendProcess, restartCallback) {
  stopHealthMonitor();
  writeAppLog("[Health Monitor] B\u1EAFt \u0111\u1EA7u gi\xE1m s\xE1t s\u1EE9c kh\u1ECFe engine (m\u1ED7i 30 gi\xE2y).");
  healthMonitorInterval = setInterval(() => {
    if (isQuitting2()) {
      stopHealthMonitor();
      return;
    }
    const checkPort = (port, fallback) => {
      const req = import_http2.default.get(`http://127.0.0.1:${port}/health`, (res) => {
        res.resume();
      });
      req.on("error", fallback);
      req.setTimeout(1e3, () => req.destroy());
    };
    checkPort(5051, () => {
      checkPort(8001, () => {
        writeAppLog("[Health Monitor] Engine kh\xF4ng ph\u1EA3n h\u1ED3i /health! \u0110ang ki\u1EC3m tra process...");
        let processAlive = false;
        const proc = getBackendProcess();
        if (proc) {
          try {
            processAlive = proc.kill(0);
          } catch {
            processAlive = false;
          }
        }
        if (!processAlive && !isQuitting2()) {
          writeAppLog("[Health Monitor] Process \u0111\xE3 ch\u1EBFt. T\u1EF1 \u0111\u1ED9ng k\xEDch ho\u1EA1t kh\u1EDFi \u0111\u1ED9ng l\u1EA1i...");
          restartCallback();
        }
      });
    });
  }, 3e4);
}

// electron/src/backend/backendManager.ts
var backendState = {
  running: false,
  error: null,
  checkedPaths: []
};
var backendProcess = null;
var isQuitting = false;
var backendRestartCount = 0;
var MAX_RESTARTS = 3;
function setQuitting(val) {
  isQuitting = val;
}
function findExecutable(dir, filename) {
  if (!import_fs3.default.existsSync(dir)) return null;
  try {
    const files = import_fs3.default.readdirSync(dir);
    for (const file of files) {
      const fullPath = import_path3.default.join(dir, file);
      try {
        const stat = import_fs3.default.statSync(fullPath);
        if (stat.isDirectory()) {
          const found = findExecutable(fullPath, filename);
          if (found) return found;
        } else if (file === filename) {
          return fullPath;
        }
      } catch {
      }
    }
  } catch {
  }
  return null;
}
async function startBackend() {
  try {
    const isAlreadyRunning = await new Promise((res) => {
      const r = import_http3.default.get("http://127.0.0.1:5051/health", (resp) => {
        resp.resume();
        res(resp.statusCode === 200);
      });
      r.on("error", () => res(false));
      r.setTimeout(800, () => {
        r.destroy();
        res(false);
      });
    });
    if (isAlreadyRunning) {
      writeAppLog("[Backend Daemon] Backend Go \u0111\xE3 \u0111ang ch\u1EA1y t\u1EA1i http://127.0.0.1:5051. T\u1EF1 \u0111\u1ED9ng k\u1EBFt n\u1ED1i.");
      backendState.running = true;
      backendState.error = null;
      startHealthMonitor(() => isQuitting, () => backendProcess, () => triggerBackendRestart());
      return true;
    }
  } catch {
  }
  let command = null;
  let args = [];
  const env = { ...process.env };
  if (process.platform === "linux") {
    const possibleCudaPaths = [
      "/usr/local/cuda/lib64",
      "/usr/local/cuda-12/lib64",
      "/usr/local/cuda-12.8/lib64",
      "/usr/lib/x86_64-linux-gnu"
    ];
    const libraryPaths = possibleCudaPaths.filter((p) => import_fs3.default.existsSync(p));
    if (libraryPaths.length > 0) {
      const existingLdPath = process.env.LD_LIBRARY_PATH ? `${process.env.LD_LIBRARY_PATH}:` : "";
      env.LD_LIBRARY_PATH = `${existingLdPath}${libraryPaths.join(":")}`;
    }
  }
  const spawnOptions = {
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
    env
  };
  await killBackendOnPort(8001);
  const goServerBin = process.platform === "win32" ? import_path3.default.join(__dirname, "../../backend_go/bin/server.exe") : import_path3.default.join(__dirname, "../../backend_go/bin/server");
  if (import_fs3.default.existsSync(goServerBin)) {
    command = goServerBin;
    args = [];
    spawnOptions.cwd = import_path3.default.dirname(import_path3.default.dirname(goServerBin));
    writeAppLog(`[Backend Daemon] Kh\u1EDFi ch\u1EA1y Go Backend Server: ${command}`);
  }
  if (!command) {
    const binaryName = process.platform === "win32" ? "App_Doc_Truyen_Engine.exe" : "App_Doc_Truyen_Engine";
    const userDataBin = import_path3.default.join(import_electron3.app.getPath("userData"), "bin");
    command = findExecutable(userDataBin, binaryName);
    if (command) spawnOptions.cwd = import_path3.default.dirname(command);
  }
  if (!command) {
    writeAppLog("[Backend Daemon] C\u1EA2NH B\xC1O: Ch\u01B0a t\xECm th\u1EA5y engine binary c\u1EE5c b\u1ED9.");
    backendState.error = "missing_engine";
    backendState.running = false;
    return false;
  }
  try {
    writeAppLog(`[Backend Daemon] \u0110ang spawn process: ${command} ${args.join(" ")}`);
    backendProcess = (0, import_child_process2.spawn)(command, args, spawnOptions);
    backendState.error = null;
    backendProcess.stdout?.on("data", (data) => {
      const msg = data.toString().trim();
      if (msg) console.log(`[Backend STDOUT] ${msg}`);
    });
    backendProcess.stderr?.on("data", (data) => {
      const msg = data.toString().trim();
      if (msg) console.error(`[Backend STDERR] ${msg}`);
    });
    backendProcess.on("exit", (code, signal) => {
      writeAppLog(`[Backend Daemon] Engine ch\u1EA1y ng\u1EA7m \u0111\xE3 tho\xE1t. Exit Code: ${code}, Signal: ${signal}`);
      backendState.running = false;
      stopHealthMonitor();
      if (code !== 0 && code !== null) {
        backendState.error = `process_exited_with_code_${code}`;
      }
      triggerBackendRestart();
    });
    startHealthMonitor(() => isQuitting, () => backendProcess, () => triggerBackendRestart());
    return true;
  } catch (err) {
    writeAppLog(`[Backend Daemon] L\u1ED7i spawn process: ${err?.message}`);
    backendState.error = "spawn_failed";
    return false;
  }
}
function triggerBackendRestart() {
  if (isQuitting || backendRestartCount >= MAX_RESTARTS) return;
  backendRestartCount++;
  writeAppLog(`[Backend Daemon] T\u1EF1 \u0111\u1ED9ng kh\u1EDFi \u0111\u1ED9ng l\u1EA1i l\u1EA7n ${backendRestartCount}/${MAX_RESTARTS}...`);
  setTimeout(() => {
    startBackend().then(() => {
      waitForBackendReady(2e4).then((ready) => {
        if (ready) {
          backendRestartCount = 0;
          backendState.running = true;
          backendState.error = null;
        }
      });
    });
  }, 2e3);
}
function stopBackend() {
  isQuitting = true;
  stopHealthMonitor();
  if (backendProcess) {
    writeAppLog("[Backend Daemon] \u0110ang t\u1EAFt engine ch\u1EA1y ng\u1EA7m...");
    try {
      if (process.platform === "win32") {
        backendProcess.kill();
      } else {
        process.kill(-backendProcess.pid, "SIGKILL");
      }
    } catch {
      try {
        backendProcess.kill();
      } catch {
      }
    }
    backendProcess = null;
    writeAppLog("[Backend Daemon] \u0110\xE3 t\u1EAFt engine th\xE0nh c\xF4ng.");
  }
}

// electron/src/ipc/windowHandlers.ts
var import_electron4 = require("electron");
function registerWindowHandlers(getMainWindow2) {
  import_electron4.ipcMain.on("window-minimize", () => {
    const win = getMainWindow2();
    if (win) win.minimize();
  });
  import_electron4.ipcMain.on("window-maximize", () => {
    const win = getMainWindow2();
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
  });
  import_electron4.ipcMain.on("window-close", () => {
    const win = getMainWindow2();
    if (win) win.close();
  });
  import_electron4.ipcMain.handle("window-is-maximized", () => {
    const win = getMainWindow2();
    return win ? win.isMaximized() : false;
  });
  import_electron4.ipcMain.on("window-move", (_event, { deltaX, deltaY }) => {
    const win = getMainWindow2();
    if (win && !win.isMaximized()) {
      const [x, y] = win.getPosition();
      win.setPosition(Math.round(x + deltaX), Math.round(y + deltaY));
    }
  });
}

// electron/src/ipc/systemHandlers.ts
var import_electron5 = require("electron");
var import_os = __toESM(require("os"), 1);
var import_fs4 = __toESM(require("fs"), 1);
var import_path4 = __toESM(require("path"), 1);
function registerSystemHandlers(getMainWindow2) {
  import_electron5.ipcMain.handle("get-system-info", async () => {
    return {
      platform: process.platform,
      arch: process.arch,
      version: import_electron5.app.getVersion(),
      cpuCount: import_os.default.cpus().length,
      freeMemoryGB: (import_os.default.freemem() / (1024 * 1024 * 1024)).toFixed(2),
      totalMemoryGB: (import_os.default.totalmem() / (1024 * 1024 * 1024)).toFixed(2)
    };
  });
  import_electron5.ipcMain.handle("log-debug", async (_event, msg) => {
    try {
      const logPath = import_path4.default.join(import_electron5.app.getPath("userData"), "tts_playback_debug.log");
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      import_fs4.default.appendFileSync(logPath, `[${timestamp}] [Frontend] ${msg}
`, "utf8");
      return true;
    } catch {
      return false;
    }
  });
  import_electron5.ipcMain.handle("open-log-folder", async () => {
    try {
      const logDir = import_electron5.app.getPath("userData");
      import_electron5.shell.openPath(logDir);
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.message };
    }
  });
  import_electron5.ipcMain.handle("get-log-content", async () => {
    try {
      const logPath = import_path4.default.join(import_electron5.app.getPath("userData"), "tts_playback_debug.log");
      if (!import_fs4.default.existsSync(logPath)) {
        return "Ch\u01B0a c\xF3 d\u1EEF li\u1EC7u log.";
      }
      const stats = import_fs4.default.statSync(logPath);
      if (stats.size > 1024 * 1024) {
        const fd = import_fs4.default.openSync(logPath, "r");
        const bufferSize = 100 * 1024;
        const buffer = Buffer.alloc(bufferSize);
        const startPos = stats.size - bufferSize;
        import_fs4.default.readSync(fd, buffer, 0, bufferSize, startPos);
        import_fs4.default.closeSync(fd);
        return "... [Log qu\xE1 d\xE0i, ch\u1EC9 hi\u1EC3n th\u1ECB 100KB cu\u1ED1i] ...\n" + buffer.toString("utf8");
      }
      return import_fs4.default.readFileSync(logPath, "utf8");
    } catch (e) {
      return `L\u1ED7i \u0111\u1ECDc log: ${e?.message}`;
    }
  });
  import_electron5.ipcMain.handle("clear-log", async () => {
    try {
      const logPath = import_path4.default.join(import_electron5.app.getPath("userData"), "tts_playback_debug.log");
      import_fs4.default.writeFileSync(logPath, `[${(/* @__PURE__ */ new Date()).toISOString()}] [App] \u0110\xE3 x\xF3a nh\u1EADt k\xFD c\u0169.
`, "utf8");
      return true;
    } catch {
      return false;
    }
  });
  import_electron5.ipcMain.handle("select-directory", async (_event, title) => {
    const win = getMainWindow2();
    if (!win) return null;
    const result = await import_electron5.dialog.showOpenDialog(win, {
      title: title || "Ch\u1ECDn th\u01B0 m\u1EE5c",
      properties: ["openDirectory"]
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });
  import_electron5.ipcMain.handle("open-external", async (_event, url) => {
    if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
      await import_electron5.shell.openExternal(url);
      return true;
    }
    return false;
  });
}

// electron/src/ipc/storeHandlers.ts
var import_electron6 = require("electron");
var import_fs5 = __toESM(require("fs"), 1);
var import_path5 = __toESM(require("path"), 1);
function registerStoreHandlers() {
  import_electron6.ipcMain.handle("store-get", async (_event, key) => {
    try {
      const configPath = import_path5.default.join(import_electron6.app.getPath("userData"), "app_config.json");
      if (!import_fs5.default.existsSync(configPath)) return null;
      const data = JSON.parse(import_fs5.default.readFileSync(configPath, "utf8"));
      return data[key] ?? null;
    } catch {
      return null;
    }
  });
  import_electron6.ipcMain.handle("store-set", async (_event, key, val) => {
    try {
      const configPath = import_path5.default.join(import_electron6.app.getPath("userData"), "app_config.json");
      let data = {};
      if (import_fs5.default.existsSync(configPath)) {
        try {
          data = JSON.parse(import_fs5.default.readFileSync(configPath, "utf8"));
        } catch {
        }
      }
      data[key] = val;
      import_fs5.default.writeFileSync(configPath, JSON.stringify(data, null, 2), "utf8");
      return true;
    } catch {
      return false;
    }
  });
  import_electron6.ipcMain.handle("store-delete", async (_event, key) => {
    try {
      const configPath = import_path5.default.join(import_electron6.app.getPath("userData"), "app_config.json");
      if (!import_fs5.default.existsSync(configPath)) return true;
      const data = JSON.parse(import_fs5.default.readFileSync(configPath, "utf8"));
      delete data[key];
      import_fs5.default.writeFileSync(configPath, JSON.stringify(data, null, 2), "utf8");
      return true;
    } catch {
      return false;
    }
  });
  import_electron6.ipcMain.handle("clear-userdata", async () => {
    try {
      const userDataPath = import_electron6.app.getPath("userData");
      const filesToClear = ["app_config.json", "tts_playback_debug.log"];
      const cleared = [];
      for (const file of filesToClear) {
        const filePath = import_path5.default.join(userDataPath, file);
        if (import_fs5.default.existsSync(filePath)) {
          import_fs5.default.unlinkSync(filePath);
          cleared.push(file);
        }
      }
      return { success: true, cleared, userDataPath };
    } catch (e) {
      return { success: false, error: e?.message };
    }
  });
}

// electron/src/ipc/modelHandlers.ts
var import_electron7 = require("electron");
var import_fs6 = __toESM(require("fs"), 1);
var import_path6 = __toESM(require("path"), 1);
function registerModelHandlers() {
  import_electron7.ipcMain.handle("download-model", async (event, { url, folderPath, filename }) => {
    try {
      if (!import_fs6.default.existsSync(folderPath)) {
        import_fs6.default.mkdirSync(folderPath, { recursive: true });
      }
      const dest = import_path6.default.join(folderPath, filename);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const totalBytes = parseInt(response.headers.get("content-length") || "0", 10);
      const fileStream = import_fs6.default.createWriteStream(dest);
      const reader = response.body?.getReader();
      let downloadedBytes = 0;
      if (!reader) throw new Error("Cannot acquire response stream reader");
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fileStream.write(Buffer.from(value));
        downloadedBytes += value.length;
        if (totalBytes > 0) {
          const percent = Math.round(downloadedBytes / totalBytes * 100);
          event.sender.send("download-progress", { filename, percent, downloadedBytes, totalBytes });
        }
      }
      await new Promise((resolve) => fileStream.end(resolve));
      return { success: true, path: dest };
    } catch (e) {
      writeAppLog(`[Download Model] Th\u1EA5t b\u1EA1i: ${e?.message}`);
      return { success: false, error: e?.message };
    }
  });
  import_electron7.ipcMain.handle("list-models", async (_event, folderPath) => {
    try {
      if (!import_fs6.default.existsSync(folderPath)) return [];
      const files = import_fs6.default.readdirSync(folderPath);
      const models = [];
      for (const file of files) {
        if (file.endsWith(".onnx") || file.endsWith(".zip") || file.endsWith(".pt")) {
          const stats = import_fs6.default.statSync(import_path6.default.join(folderPath, file));
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
  import_electron7.ipcMain.handle("delete-model", async (_event, filePath) => {
    try {
      if (import_fs6.default.existsSync(filePath)) {
        import_fs6.default.unlinkSync(filePath);
        return { success: true };
      }
      return { success: false, error: "File not found" };
    } catch (e) {
      return { success: false, error: e?.message };
    }
  });
  import_electron7.ipcMain.handle("read-dictionary", async (_event, filename) => {
    const isDev = !import_electron7.app.isPackaged;
    let dictPath = isDev ? import_path6.default.join(__dirname, "../../../public/dictionaries", filename) : import_path6.default.join(__dirname, "../../dist/dictionaries", filename);
    if (import_fs6.default.existsSync(dictPath)) {
      return import_fs6.default.readFileSync(dictPath, "utf-8");
    }
    const altPath = import_path6.default.join(import_electron7.app.getAppPath(), "dist/dictionaries", filename);
    if (import_fs6.default.existsSync(altPath)) {
      return import_fs6.default.readFileSync(altPath, "utf-8");
    }
    throw new Error(`Dictionary file not found: ${filename}`);
  });
  import_electron7.ipcMain.handle("get-models-path", async () => {
    const isDev = !import_electron7.app.isPackaged;
    const binaryName = process.platform === "win32" ? "App_Doc_Truyen_Engine.exe" : "App_Doc_Truyen_Engine";
    const userDataBin = import_path6.default.join(import_electron7.app.getPath("userData"), "bin");
    const foundInUserData = findExecutable(userDataBin, binaryName);
    if (foundInUserData) {
      return import_path6.default.dirname(foundInUserData);
    }
    if (isDev) {
      return import_path6.default.join(__dirname, "../../../backend_go/engines/tts/models_onnx");
    }
    const possiblePaths = [
      import_path6.default.join(process.resourcesPath, binaryName),
      import_path6.default.join(process.resourcesPath, "bin", binaryName),
      import_path6.default.join(import_electron7.app.getAppPath(), "..", binaryName)
    ];
    const foundPath = possiblePaths.find((p) => import_fs6.default.existsSync(p));
    return foundPath ? import_path6.default.dirname(foundPath) : import_path6.default.join(process.resourcesPath, "bin");
  });
}

// electron/src/ipc/engineHandlers.ts
var import_electron8 = require("electron");
var import_fs7 = __toESM(require("fs"), 1);
var import_path7 = __toESM(require("path"), 1);
var import_os2 = __toESM(require("os"), 1);
var import_child_process3 = require("child_process");
var import_jszip = __toESM(require("jszip"), 1);
async function extractZipFile(zipPath, destDir) {
  try {
    if (!import_fs7.default.existsSync(destDir)) import_fs7.default.mkdirSync(destDir, { recursive: true });
    const zipData = import_fs7.default.readFileSync(zipPath);
    const zip = await import_jszip.default.loadAsync(zipData);
    for (const filename of Object.keys(zip.files)) {
      const file = zip.files[filename];
      const destPath = import_path7.default.join(destDir, filename);
      if (file.dir) {
        import_fs7.default.mkdirSync(destPath, { recursive: true });
      } else {
        const parentDir = import_path7.default.dirname(destPath);
        if (!import_fs7.default.existsSync(parentDir)) import_fs7.default.mkdirSync(parentDir, { recursive: true });
        const content = await file.async("nodebuffer");
        import_fs7.default.writeFileSync(destPath, content);
      }
    }
    return true;
  } catch (err) {
    writeAppLog(`[Zip Extract Fallback] JSZip error: ${err?.message}. Th\u1EED l\u1EC7nh h\u1EC7 th\u1ED1ng.`);
    const cmd = process.platform === "win32" ? `powershell -Command "Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${destDir}' -Force"` : `unzip -o "${zipPath}" -d "${destDir}"`;
    return new Promise((resolve) => {
      (0, import_child_process3.exec)(cmd, (e) => resolve(!e));
    });
  }
}
function registerEngineHandlers() {
  import_electron8.ipcMain.handle("start-backend", async () => {
    try {
      const ok = await startBackend();
      return { success: ok };
    } catch (e) {
      return { success: false, error: e?.message };
    }
  });
  import_electron8.ipcMain.handle("stop-backend", async () => {
    try {
      stopHealthMonitor();
      stopBackend();
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.message };
    }
  });
  import_electron8.ipcMain.handle("check-backend-status", async () => {
    let isAlive = false;
    if (backendProcess) {
      try {
        isAlive = backendProcess.kill(0);
      } catch {
        isAlive = false;
      }
    }
    backendState.running = isAlive;
    if (isAlive) backendState.error = null;
    return backendState;
  });
  import_electron8.ipcMain.handle("download-engine", async (event, { type }) => {
    try {
      const isWin = process.platform === "win32";
      const platform = isWin ? "windows" : "linux";
      const zipFilename = `${platform}_${type}.zip`;
      const url = `https://huggingface.co/datasets/Cong123779/Local-TTS-Engine/resolve/main/${type}/${zipFilename}`;
      const tempZipPath = import_path7.default.join(import_electron8.app.getPath("temp"), zipFilename);
      const destDir = import_path7.default.join(import_electron8.app.getPath("userData"), "bin");
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const totalBytes = parseInt(response.headers.get("content-length") || "0", 10);
      const fileStream = import_fs7.default.createWriteStream(tempZipPath);
      const reader = response.body?.getReader();
      let downloadedBytes = 0;
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        fileStream.write(Buffer.from(value));
        downloadedBytes += value.length;
        if (totalBytes > 0) {
          const percent = Math.round(downloadedBytes / totalBytes * 100);
          event.sender.send("download-progress", { filename: zipFilename, percent, downloadedBytes, totalBytes });
        }
      }
      await new Promise((res) => fileStream.end(res));
      await extractZipFile(tempZipPath, destDir);
      try {
        import_fs7.default.unlinkSync(tempZipPath);
      } catch {
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.message };
    }
  });
  import_electron8.ipcMain.handle("quick-patch-update", async (event, { url, version }) => {
    try {
      const tempZip = import_path7.default.join(import_electron8.app.getPath("temp"), `patch_${version}.zip`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const totalBytes = parseInt(res.headers.get("content-length") || "0", 10);
      const stream = import_fs7.default.createWriteStream(tempZip);
      const reader = res.body?.getReader();
      let downloadedBytes = 0;
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        stream.write(Buffer.from(value));
        downloadedBytes += value.length;
        if (totalBytes > 0) {
          const percent = Math.round(downloadedBytes / totalBytes * 100);
          event.sender.send("quick-patch-progress", { percent, downloadedBytes, totalBytes });
        }
      }
      await new Promise((r) => stream.end(r));
      const targetDir = import_path7.default.join(import_electron8.app.getAppPath(), "dist");
      await extractZipFile(tempZip, targetDir);
      try {
        import_fs7.default.unlinkSync(tempZip);
      } catch {
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.message };
    }
  });
  import_electron8.ipcMain.handle("download-and-run-update", async (event, { url, filename }) => {
    try {
      const tempPath = import_path7.default.join(import_electron8.app.getPath("temp"), filename);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const totalBytes = parseInt(res.headers.get("content-length") || "0", 10);
      const stream = import_fs7.default.createWriteStream(tempPath);
      const reader = res.body?.getReader();
      let downloadedBytes = 0;
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        stream.write(Buffer.from(value));
        downloadedBytes += value.length;
        if (totalBytes > 0) {
          const percent = Math.round(downloadedBytes / totalBytes * 100);
          event.sender.send("update-download-progress", { percent, downloadedBytes, totalBytes });
        }
      }
      await new Promise((r) => stream.end(r));
      if (process.platform === "win32") {
        import_electron8.shell.openPath(tempPath);
      } else {
        (0, import_child_process3.exec)(`chmod +x "${tempPath}" && "${tempPath}" &`);
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.message };
    }
  });
  import_electron8.ipcMain.handle("uninstall-app", async () => {
    try {
      if (process.platform === "linux") {
        const destDir = import_path7.default.join(import_os2.default.homedir(), ".local/share/applications");
        ["tienhiepai.desktop", "TienHiepAI.desktop", "tienhiepai-dev.desktop"].forEach((f) => {
          const p = import_path7.default.join(destDir, f);
          if (import_fs7.default.existsSync(p)) import_fs7.default.unlinkSync(p);
        });
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.message };
    }
  });
  import_electron8.ipcMain.handle("check-for-update", async () => {
    try {
      const res = await fetch("https://raw.githubusercontent.com/congkx123789/ttS/main/releases.json");
      if (!res.ok) return { updateAvailable: false };
      const data = await res.json();
      return { updateAvailable: true, release: data };
    } catch {
      return { updateAvailable: false };
    }
  });
}

// electron/src/main.ts
if (process.platform === "linux") {
  import_electron9.app.commandLine.appendSwitch("no-sandbox");
  import_electron9.app.commandLine.appendSwitch("disable-gpu-sandbox");
}
import_electron9.app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
import_electron9.app.commandLine.appendSwitch("disable-web-security");
import_electron9.app.commandLine.appendSwitch("disable-site-isolation-trials");
var gotTheLock = import_electron9.app.requestSingleInstanceLock();
if (!gotTheLock) {
  import_electron9.app.quit();
} else {
  import_electron9.app.on("second-instance", (_event, commandLine) => {
    const win = getMainWindow();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
      const url = commandLine.find((arg) => arg.startsWith("tienhiepai://"));
      if (url) win.webContents.send("oauth-callback", url);
    } else {
      createWindow();
    }
  });
  import_electron9.app.whenReady().then(() => {
    writeAppLog("--- KH\u1EDEI \u0110\u1ED8NG TI\xCAN HI\u1EC6P AI ELECTRON (TYPESCRIPT) ---");
    import_electron9.app.on("web-contents-created", (_event, contents) => {
      contents.setWindowOpenHandler((details) => {
        const targetUrl = details.url;
        if (targetUrl && /^https?:\/\//i.test(targetUrl)) {
          const win = getMainWindow();
          if (win && !win.isDestroyed()) {
            win.webContents.send("open-in-new-tab", targetUrl);
          }
        }
        return { action: "deny" };
      });
    });
    registerWindowHandlers(getMainWindow);
    registerSystemHandlers(getMainWindow);
    registerStoreHandlers();
    registerModelHandlers();
    registerEngineHandlers();
    createWindow();
    setTimeout(async () => {
      await startBackend();
      const win = getMainWindow();
      if (!backendProcess && !backendState.running) {
        if (win && !win.isDestroyed()) {
          win.webContents.send("backend-ready", { ready: false, error: backendState.error || "missing_engine" });
        }
        return;
      }
      waitForBackendReady(25e3).then((ready) => {
        if (win && !win.isDestroyed()) {
          if (ready) {
            backendState.running = true;
            backendState.error = null;
            win.webContents.send("backend-ready", { ready: true });
          }
        }
      });
    }, 500);
  });
  import_electron9.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      setQuitting(true);
      stopBackend();
      import_electron9.app.quit();
    }
  });
  import_electron9.app.on("activate", () => {
    if (!getMainWindow()) createWindow();
  });
  import_electron9.app.on("before-quit", () => {
    setQuitting(true);
    stopBackend();
  });
}
