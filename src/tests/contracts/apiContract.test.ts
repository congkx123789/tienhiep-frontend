import axios from 'axios';
import { ENDPOINTS } from '../../core/constants/endpoints';
import { BasePointManager } from '../../core/platform/basePoint';

const BASE = `${BasePointManager.getBaseUrl()}${BasePointManager.getApiPrefix()}`;

export async function runApiContractTests(): Promise<{ passed: number; failed: number }> {
  console.log(`\n🧪 BẮT ĐẦU CHẠY KIỂM THỬ HỢP ĐỒNG API (BASE: ${BASE})...\n`);
  let passed = 0;
  let failed = 0;

  async function testCase(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name} -> ${err.message}`);
      failed++;
    }
  }

  await testCase('API Health ROOT phải phản hồi HTTP 200', async () => {
    const res = await axios.get(`${BASE}${ENDPOINTS.HEALTH.ROOT.path}`, { validateStatus: () => true });
    if (![200, 204].includes(res.status)) throw new Error(`Status ${res.status}`);
  });

  await testCase('API Stats phải phản hồi HTTP 200 và có thống kê sách', async () => {
    const res = await axios.get(`${BASE}${ENDPOINTS.HEALTH.STATS.path}`, { validateStatus: () => true });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.data || typeof res.data.total_books !== 'number') throw new Error('Missing total_books');
  });

  await testCase('API Books LIST phải hoạt động và trả về HTTP 200', async () => {
    const res = await axios.get(`${BASE}${ENDPOINTS.BOOKS.LIST.path}?limit=5`, { validateStatus: () => true });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.data || !Array.isArray(res.data.books)) throw new Error('Missing books array');
  });

  await testCase('API Books DETAIL phải phản hồi khớp đường dẫn động', async () => {
    const detailRoute = ENDPOINTS.BOOKS.DETAIL(285);
    const res = await axios.get(`${BASE}${detailRoute.path}`, { validateStatus: () => true });
    if (![200, 404].includes(res.status)) throw new Error(`Status ${res.status}`);
  });

  await testCase('API Sects LIST phải hoạt động và phản hồi HTTP 200', async () => {
    const res = await axios.get(`${BASE}${ENDPOINTS.SECTS.LIST.path}`, { validateStatus: () => true });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await testCase('API Releases phải hoạt động và trả về danh sách link tải', async () => {
    const res = await axios.get(`${BASE}${ENDPOINTS.SYSTEM.RELEASES.path}`, { validateStatus: () => true });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.data || !res.data.releases) throw new Error('Missing releases object');
  });

  console.log(`\n==================================================`);
  console.log(`  📊 KẾT QUẢ CONTRACT TESTS: ${passed} passed | ${failed} failed`);
  console.log(`==================================================\n`);

  return { passed, failed };
}
