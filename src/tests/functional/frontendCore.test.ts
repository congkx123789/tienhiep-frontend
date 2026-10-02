import { BasePointManager, BASE_POINT_CONFIG } from '../../core/platform/basePoint';
import { ENDPOINTS } from '../../core/constants/endpoints';
import { localTranslator } from '../../utils/localTranslator';

export async function runFunctionalTests(): Promise<{ passed: number; failed: number }> {
  console.log(`\n🧪 BẮT ĐẦU CHẠY KIỂM THỬ CHỨC NĂNG FRONTEND CORE...\n`);
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (!condition) {
      throw new Error(`Assertion failed: ${msg}`);
    }
  }

  async function testCase(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name} -> ${err.message}`);
      failed++;
    }
  }

  // 1. Kiểm tra BasePointManager logic
  await testCase('BasePointManager trả về đúng cấu hình mặc định', () => {
    const url = BasePointManager.getBaseUrl();
    assert(url.length > 0, 'Base URL không được để trống');
    assert(url.startsWith('http'), 'Base URL phải có tiền tố http');
    assert(BasePointManager.getApiPrefix() === '', 'API Prefix mặc định rỗng');
  });

  await testCase('BasePointManager override thủ công hoạt động chuẩn xác', () => {
    const mockHost = 'http://192.168.1.100:5051';
    BasePointManager.setManualHost(mockHost);
    assert(BasePointManager.getBaseUrl() === mockHost, 'Phải trả về đúng override host');
    BasePointManager.setManualHost(null);
    assert(BasePointManager.getBaseUrl() === BASE_POINT_CONFIG.LOCAL_HOST, 'Phải reset về local host');
  });

  // 2. Kiểm tra ENDPOINTS mapping
  await testCase('ENDPOINTS parameters generator tạo URL chính xác', () => {
    const bookDetail = ENDPOINTS.BOOKS.DETAIL(123);
    assert(bookDetail.path === '/api/books/123', `Book detail URL sai: ${bookDetail.path}`);
    assert(bookDetail.method === 'GET', 'Book detail method phải là GET');

    const paymentStatus = ENDPOINTS.PAYMENTS.STATUS('ORDER_999');
    assert(paymentStatus.path === '/api/payment/status/ORDER_999', `Payment status URL sai: ${paymentStatus.path}`);

    const chapterContent = ENDPOINTS.CHAPTERS.CONTENT('123', '5');
    assert(chapterContent.path === '/api/chapter/content?book_id=123&chapter_idx=5', `Chapter content URL sai: ${chapterContent.path}`);
  });

  // 3. Kiểm tra LocalTranslator Engine
  await testCase('LocalTranslator cache và fallback văn bản rỗng', async () => {
    const emptyResult = await localTranslator.translate('');
    assert(emptyResult === '', 'Chuỗi rỗng dịch phải ra chuỗi rỗng');

    const batchEmpty = await localTranslator.translateBatch([]);
    assert(Array.isArray(batchEmpty) && batchEmpty.length === 0, 'Batch rỗng phải trả mảng rỗng');
  });

  // 4. Kiểm tra Chế độ Nguyên bản (Raw / Tắt dịch)
  await testCase('Chế độ raw / none giữ nguyên vẹn 100% văn bản gốc', async () => {
    const rawInput = ['第1章 开封神殿', '武之极，破苍穹'];
    const { executeTranslate } = await import('../../contexts/browser/browserHelpers');
    const result = await executeTranslate(rawInput, 'raw');
    assert(result.length === 2, 'Số lượng văn bản phải khớp');
    assert(result[0] === rawInput[0], 'Văn bản gốc không được bị biến đổi');
    assert(result[1] === rawInput[1], 'Văn bản gốc không được bị biến đổi');
  });

  console.log(`\n==================================================`);
  console.log(`  📊 KẾT QUẢ FRONTEND CORE TESTS: ${passed} passed | ${failed} failed`);
  console.log(`==================================================\n`);

  return { passed, failed };
}
