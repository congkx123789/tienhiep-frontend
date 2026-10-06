import { runFunctionalTests, runButtonAndActionTests, runAuthGoogleAndRbacTests } from './functional';
import { runApiContractTests, runContractCrawler } from './contracts';

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║ 🛡️ TIÊN HIỆP AI — BỘ KIỂM THỬ TOÀN DIỆN CHỨC NĂNG & API     ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');

  let totalFailed = 0;

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

  // 2. Chạy API Contract Tests
  try {
    const apiResult = await runApiContractTests();
    totalFailed += apiResult.failed;
  } catch (err: any) {
    console.error('❌ Lỗi ngoại lệ trong API Contract Tests:', err.message);
    totalFailed++;
  }

  // 3. Chạy Crawler quét toàn bộ 35 Endpoints
  try {
    const crawlerSuccess = await runContractCrawler();
    if (!crawlerSuccess) {
      totalFailed++;
    }
  } catch (err: any) {
    console.error('❌ Lỗi ngoại lệ trong Contract Crawler:', err.message);
    totalFailed++;
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
