/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  autoApiHealth.test.ts — CONTRACT TEST TỰ ĐỘNG QUÉT 100% ENDPOINTS
 * ═════════════════════════════════════════════════════════════════════════════
 *  - Tự động đệ quy duyệt qua toàn bộ cây ENDPOINTS.
 *  - Gửi probe request trực tiếp lên Server.
 *  - Xác nhận:
 *    1. Endpoint không bị 404 (Route tồn tại trên server thật).
 *    2. Endpoint không bị sập 500 (Server xử lý an toàn).
 * ═════════════════════════════════════════════════════════════════════════════
 */

import axios from 'axios';
import { ENDPOINTS, EndpointMeta } from '../../core/constants/endpoints';
import { BasePointManager } from '../../core/platform/basePoint';

const BASE_URL = BasePointManager.getBaseUrl();

// Hàm đệ quy bóc tách toàn bộ API từ ENDPOINTS object
export function extractEndpoints(obj: any, prefix = ''): { name: string; meta: EndpointMeta }[] {
  let results: { name: string; meta: EndpointMeta }[] = [];
  for (const key in obj) {
    const value = obj[key];
    const currentName = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && 'path' in value && 'method' in value) {
      results.push({ name: currentName, meta: value as EndpointMeta });
    } else if (typeof value === 'object') {
      results = results.concat(extractEndpoints(value, currentName));
    }
  }
  return results;
}

export async function runContractCrawler() {
  const routes = extractEndpoints(ENDPOINTS);
  console.log(`\n🔍 Đang tự động quét ${routes.length} endpoint contracts...\n`);

  let passed = 0;
  let failed = 0;

  for (const { name, meta } of routes) {
    const resolvedPath = typeof meta.path === 'function' ? meta.path('101', '0') : meta.path;
    const targetUrl = `${BASE_URL}${resolvedPath}`;

    try {
      const res = await axios({
        url: targetUrl,
        method: meta.method,
        timeout: 4000,
        validateStatus: () => true, // Không throw lỗi để kiểm tra HTTP code
        data: meta.method === 'POST' ? {} : undefined,
      });

      // 1. Không được 404
      if (res.status === 404) {
        console.error(`  ❌ [404 NOT FOUND] ${name} -> ${targetUrl}`);
        failed++;
        continue;
      }

      // 2. Không được >= 500
      if (res.status >= 500) {
        console.error(`  🔥 [500 SERVER ERROR] ${name} -> ${targetUrl} (Status ${res.status})`);
        failed++;
        continue;
      }

      console.log(`  ✅ [${res.status}] ${name} -> ${targetUrl}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ [NETWORK ERROR] ${name} -> ${err.message}`);
      failed++;
    }
  }

  console.log(`\n==================================================`);
  console.log(`  📊 KẾT QUẢ QUÉT TỰ ĐỘNG: ${passed}/${routes.length} passed | ${failed} failed`);
  console.log(`==================================================\n`);

  return failed === 0;
}
