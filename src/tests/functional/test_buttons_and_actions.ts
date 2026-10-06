/**
 * test_buttons_and_actions.ts
 * Kiểm tra toàn diện tất cả các nút bấm trong giao diện & các API Action tương ứng
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, '../../');
const API_BASE = 'http://127.0.0.1:5051';

export async function runButtonAndActionTests() {
  console.log('\n🔘 BẮT ĐẦU KIỂM THỬ TOÀN BỘ CÁC NÚT BẤM (BUTTONS) & HÀNH ĐỘNG API...');
  let passed = 0;
  let failed = 0;

  // 1. Quét tĩnh toàn bộ các thẻ <button> trong src/
  const buttonIssues: string[] = [];
  let totalButtons = 0;

  function scanDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== 'tests') {
          scanDir(fullPath);
        }
      } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const matches = content.match(/<button([^>]*)>/g) || [];
        for (const m of matches) {
          totalButtons++;
          const hasOnClick = m.includes('onClick');
          const hasSubmit = m.includes('type="submit"') || m.includes("type='submit'");
          const isDisabled = m.includes('disabled');
          if (!hasOnClick && !hasSubmit && !isDisabled) {
            buttonIssues.push(`${path.relative(SRC_DIR, fullPath)}: ${m.slice(0, 60)}`);
          }
        }
      }
    }
  }

  scanDir(SRC_DIR);

  if (buttonIssues.length === 0) {
    console.log(`  ✅ [PASS] Quét hoàn tất ${totalButtons} nút bấm: 100% nút đều có onClick/submit/disabled, không có nút chết.`);
    passed++;
  } else {
    console.log(`  ❌ [FAIL] Phát hiện ${buttonIssues.length} nút bấm không có hành động:`);
    buttonIssues.forEach(iss => console.log(`     -> ${iss}`));
    failed++;
  }

  // 2. Kiểm tra API Action của các nút cốt lõi
  const actionTests = [
    {
      name: 'Nút Nạp VIP (Yêu cầu đăng nhập, chặn thanh toán vô danh)',
      test: async () => {
        try {
          const res = await axios.post(`${API_BASE}/api/payment/create`, { plan: 'month' });
          return res.status === 400 || res.status === 401;
        } catch (e: any) {
          return e.response?.status === 400 || e.response?.status === 401;
        }
      }
    },
    {
      name: 'Nút Danh sách Gói VIP (Lấy bảng giá nạp)',
      test: async () => {
        const res = await axios.get(`${API_BASE}/api/payments/plans`);
        return res.status === 200 && Array.isArray(res.data?.plans) && res.data.plans.length > 0;
      }
    },
    {
      name: 'Nút Khám Phá & Tủ Sách (Lấy danh mục sách)',
      test: async () => {
        const res = await axios.get(`${API_BASE}/api/books`);
        return res.status === 200 && Array.isArray(res.data?.books);
      }
    },
    {
      name: 'Nút Tông Môn (Lấy danh sách các môn phái)',
      test: async () => {
        const res = await axios.get(`${API_BASE}/api/sects`);
        return res.status === 200 && Array.isArray(res.data?.sects);
      }
    },
    {
      name: 'Nút Phát Âm TTS C++ (Tổng hợp giọng đọc)',
      test: async () => {
        const res = await axios.post(`${API_BASE}/api/tts/speak`, { text: 'Kiểm tra nút bấm đọc truyện' }, { responseType: 'arraybuffer' });
        return res.status === 200 && res.data.byteLength > 1000;
      }
    },
    {
      name: 'Nút Dịch Thuật AI (Chuyển ngữ văn bản)',
      test: async () => {
        const res = await axios.post(`${API_BASE}/api/translate`, { text: '你好世界' });
        return res.status === 200 && (typeof res.data?.translation === 'string' || Array.isArray(res.data?.translations));
      }
    },
    {
      name: 'Nút Kiểm Tra Hạn Mức Dùng Thử & Giờ Free (/api/user/quota)',
      test: async () => {
        const res = await axios.get(`${API_BASE}/api/user/quota`);
        return res.status === 200 && res.data?.success === true && typeof res.data?.daily_minutes === 'number';
      }
    },
    {
      name: 'Nút Kiểm Tra Sự Kiện Toàn Server (/api/system/event)',
      test: async () => {
        const res = await axios.get(`${API_BASE}/api/system/event`);
        return res.status === 200 && res.data?.success === true && res.data?.event !== undefined;
      }
    },
    {
      name: 'Bảo Vệ Quản Trị: Chặn truy cập Audit Logs nếu thiếu Admin Key (401 Unauthorized)',
      test: async () => {
        try {
          const res = await axios.get(`${API_BASE}/api/admin/audit-logs`);
          return res.status === 401;
        } catch (e: any) {
          return e.response?.status === 401;
        }
      }
    },
    {
      name: 'Bảo Vệ Quản Trị: Cho phép truy cập Audit Logs khi có X-Admin-Key hợp lệ',
      test: async () => {
        const res = await axios.get(`${API_BASE}/api/admin/audit-logs`, {
          headers: { 'X-Admin-Key': 'LYVUHA_ADMIN_2026' }
        });
        return res.status === 200 && res.data?.success === true && Array.isArray(res.data?.logs);
      }
    }
  ];

  for (const act of actionTests) {
    try {
      const ok = await act.test();
      if (ok) {
        console.log(`  ✅ [PASS] ${act.name}`);
        passed++;
      } else {
        console.log(`  ❌ [FAIL] ${act.name} -> Kết quả trả về không đúng mong đợi`);
        failed++;
      }
    } catch (err: any) {
      console.log(`  ❌ [FAIL] ${act.name} -> Lỗi kết nối: ${err.message}`);
      failed++;
    }
  }

  console.log('==================================================');
  console.log(`  📊 KẾT QUẢ KIỂM THỬ NÚT BẤM & ACTION: ${passed} passed | ${failed} failed`);
  console.log('==================================================\n');

  return { passed, failed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runButtonAndActionTests().then(({ failed }) => {
    if (failed > 0) process.exit(1);
  });
}
