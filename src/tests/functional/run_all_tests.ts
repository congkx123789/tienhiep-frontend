/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  run_all_tests.ts
 *  Tập lệnh thực thi tất cả các bài kiểm thử Frontend, Mocking & Form Factor
 * ═════════════════════════════════════════════════════════════════════════════
 */

import { runFunctionalTests } from './frontendCore.test';
import { runButtonAndActionTests } from './test_buttons_and_actions';
import { runAuthGoogleAndRbacTests } from './test_auth_google_and_rbac';
import { runCrossPlatformMockingTests } from './test_cross_platform_mocking';
import { runFormFactorUXTests } from './test_form_factor_physical_ux';

async function main() {
  console.log('🚀 KHỞI ĐỘNG HỆ THỐNG KIỂM THỬ TOÀN DIỆN FRONTEND & MULTI-PLATFORM');
  console.log('================================================================');

  let totalPassed = 0;
  let totalFailed = 0;

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
