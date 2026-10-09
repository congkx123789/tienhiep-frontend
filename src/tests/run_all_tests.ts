import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  runFunctionalTests,
  runButtonAndActionTests,
  runAuthGoogleAndRbacTests,
  runCrossPlatformMockingTests,
  runFormFactorUXTests,
} from './functional';
import { runApiContractTests, runContractCrawler } from './contracts';
import { runBrowserNavigationTests } from './browser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkServerAlive(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const req = http.get('http://127.0.0.1:5051/health', (res) => resolve(res.statusCode === 200));
    req.on('error', () => resolve(false));
    req.setTimeout(500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureBackend(): Promise<() => void> {
  if (await checkServerAlive()) {
    return () => {}; // Server đã chạy sẵn
  }

  const serverBin = path.resolve(__dirname, '../../../server/server');
  const serverProc = spawn(serverBin, ['-port', '5051'], {
    cwd: path.resolve(__dirname, '../../../server'),
    stdio: 'ignore',
  });

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 100));
    if (await checkServerAlive()) break;
  }

  return () => {
    try {
      serverProc.kill('SIGTERM');
    } catch {}
  };
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║ 🛡️ TIÊN HIỆP AI — BỘ KIỂM THỬ TOÀN DIỆN CHỨC NĂNG & API     ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');

  const cleanup = await ensureBackend();
  let totalFailed = 0;

  try {
    // 1. Chạy Functional Tests Core
    try {
      const fnResult = await runFunctionalTests();
      totalFailed += fnResult.failed;
    } catch (err: any) {
      console.error('❌ Lỗi ngoại lệ trong Functional Tests:', err.message);
      totalFailed++;
    }

    // 2. Chạy kiểm thử toàn bộ các nút bấm và Action API
    try {
      const btnResult = await runButtonAndActionTests();
      totalFailed += btnResult.failed;
    } catch (err: any) {
      console.error('❌ Lỗi ngoại lệ trong Button & Action Tests:', err.message);
      totalFailed++;
    }

    // 3. Chạy kiểm thử Google Auth & Phân quyền RBAC
    try {
      const authResult = await runAuthGoogleAndRbacTests();
      totalFailed += authResult.failed;
    } catch (err: any) {
      console.error('❌ Lỗi ngoại lệ trong Auth & RBAC Tests:', err.message);
      totalFailed++;
    }

    // 4. Chạy Cross-Platform Mocking Tests
    try {
      const crossResult = await runCrossPlatformMockingTests();
      totalFailed += crossResult.failed;
    } catch (err: any) {
      console.error('❌ Lỗi ngoại lệ trong Cross-Platform Mocking Tests:', err.message);
      totalFailed++;
    }

    // 5. Chạy Form Factor & Physical Device UX Tests
    try {
      const uxResult = await runFormFactorUXTests();
      totalFailed += uxResult.failed;
    } catch (err: any) {
      console.error('❌ Lỗi ngoại lệ trong Form Factor UX Tests:', err.message);
      totalFailed++;
    }

    // 4. Chạy API Contract Tests
    try {
      const apiResult = await runApiContractTests();
      totalFailed += apiResult.failed;
    } catch (err: any) {
      console.error('❌ Lỗi ngoại lệ trong API Contract Tests:', err.message);
      totalFailed++;
    }

    // 6. Chạy Kiểm thử Trình duyệt Chrome-like Navigation (Layer 1)
    try {
      const browserResult = runBrowserNavigationTests();
      totalFailed += browserResult.failed;
    } catch (err: any) {
      console.error('❌ Lỗi ngoại lệ trong Browser Navigation Tests:', err.message);
      totalFailed++;
    }

    // 7. Chạy Crawler quét toàn bộ 35 Endpoints
    try {
      const crawlerSuccess = await runContractCrawler();
      if (!crawlerSuccess) totalFailed++;
    } catch (err: any) {
      console.error('❌ Lỗi ngoại lệ trong Contract Crawler:', err.message);
      totalFailed++;
    }
  } finally {
    cleanup();
  }

  if (totalFailed > 0) {
    console.error(`\n🚨 PHÁT HIỆN ${totalFailed} BÀI TEST THẤT BẠI! CHẶN TIẾN TRÌNH BUILD NGAY LẬP TỨC!\n`);
    process.exit(1);
  }

  console.log('\n🎉 TẤT CẢ CÁC BÀI TEST CHỨC NĂNG VÀ API ĐỀU ĐẠT 100%! CHO PHÉP BUILD.\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
