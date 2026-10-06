/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  run_all_tests.ts
 *  Tập lệnh thực thi tất cả các bài kiểm thử Frontend, Mocking & Form Factor
 * ═════════════════════════════════════════════════════════════════════════════
 */

import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { runFunctionalTests } from './frontendCore.test';
import { runButtonAndActionTests } from './test_buttons_and_actions';
import { runAuthGoogleAndRbacTests } from './test_auth_google_and_rbac';
import { runCrossPlatformMockingTests } from './test_cross_platform_mocking';
import { runFormFactorUXTests } from './test_form_factor_physical_ux';

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
    return () => {};
  }

  const serverBin = path.resolve(__dirname, '../../../../backend_go/server');
  const serverProc = spawn(serverBin, ['-port', '5051'], {
    cwd: path.resolve(__dirname, '../../../../backend_go'),
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
  console.log('🚀 KHỞI ĐỘNG HỆ THỐNG KIỂM THỬ TOÀN DIỆN FRONTEND & MULTI-PLATFORM');
  console.log('================================================================');

  const cleanup = await ensureBackend();
  let totalPassed = 0;
  let totalFailed = 0;

  try {
    // 1. Core Logic Tests
    const coreRes = await runFunctionalTests();
    totalPassed += coreRes.passed;
    totalFailed += coreRes.failed;

    // 2. Buttons & Actions Tests
    const btnRes = await runButtonAndActionTests();
    totalPassed += btnRes.passed;
    totalFailed += btnRes.failed;

    // 3. Auth & RBAC Tests
    const authRes = await runAuthGoogleAndRbacTests();
    totalPassed += authRes.passed;
    totalFailed += authRes.failed;

    // 4. Cross-Platform Mocking Tests
    const crossRes = await runCrossPlatformMockingTests();
    totalPassed += crossRes.passed;
    totalFailed += crossRes.failed;

    // 5. Form Factor & Physical Device UX Tests
    const uxRes = await runFormFactorUXTests();
    totalPassed += uxRes.passed;
    totalFailed += uxRes.failed;
  } finally {
    cleanup();
  }

  console.log('\n================================================================');
  console.log(`🏆 TỔNG KẾT TOÀN BỘ KIỂM THỬ: ${totalPassed} PASSED | ${totalFailed} FAILED`);
  console.log('================================================================\n');

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal error during test execution:', err);
  process.exit(1);
});
