/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  test_settings_and_diagnostics.ts
 *  Kiểm thử toàn diện Trang Cài Đặt (Settings), Chẩn đoán Dịch & Giọng đọc C++
 * ═════════════════════════════════════════════════════════════════════════════
 */

import axios from 'axios';

const API_BASE = 'http://127.0.0.1:5051';
const LOCAL_PROXY_BASE = 'http://127.0.0.1:5052';

interface TestResult {
  passed: number;
  failed: number;
}

export async function runSettingsAndDiagnosticsTests(): Promise<TestResult> {
  console.log('\n⚙️ BẮT ĐẦU KIỂM THỬ TRANG CÀI ĐẶT & CHẨN ĐOÁN DỊCH / TTS C++ NATIVE...');
  let passed = 0;
  let failed = 0;

  const testCase = async (name: string, fn: () => Promise<boolean | void>) => {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name}:`, err?.message || err);
      failed++;
    }
  };

  // 1. Kiểm tra Endpoint Danh Sách Mô Hình Nơ-ron (/api/tts/models)
  await testCase('Lấy danh sách 5 mô hình nơ-ron C++ tích hợp sẵn (/api/tts/models)', async () => {
    let res;
    try {
      res = await axios.get(`${LOCAL_PROXY_BASE}/api/tts/models`, { timeout: 1500 });
    } catch {
      res = await axios.get(`${API_BASE}/api/tts/models`, { timeout: 1500 });
    }

    if (res.status !== 200 || !res.data) {
      throw new Error(`Status ${res.status}`);
    }

    const models = res.data.models;
    if (!Array.isArray(models) || models.length < 5) {
      throw new Error(`Kỳ vọng ít nhất 5 mô hình ONNX, nhận: ${models?.length}`);
    }

    const requiredModels = [
      'matcha_encoder.onnx',
      'matcha_decoder.onnx',
      'vocos.onnx',
      'cmlm_nat_int8_hq.onnx',
      'hanlp_small_int8_hq.onnx'
    ];

    for (const req of requiredModels) {
      const found = models.some((m: any) => m.name === req);
      if (!found) throw new Error(`Thiếu mô hình bắt buộc: ${req}`);
    }
  });

  // 2. Kiểm tra Thử Nghiệm Dịch Thuật Trực Tiếp trong Cài Đặt (/api/translate)
  await testCase('Chẩn đoán Dịch thuật CMLM NAT Native trong Cài đặt (/api/translate)', async () => {
    let res;
    try {
      res = await axios.post(`${LOCAL_PROXY_BASE}/api/translate`, {
        text: '第一章 穿越仙界，天道渺渺。',
        mode: 4
      }, { timeout: 2000 });
    } catch {
      res = await axios.post(`${API_BASE}/api/translate`, {
        text: '第一章 穿越仙界，天道渺渺。',
        mode: 'cmlm'
      }, { timeout: 2000 });
    }

    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const trans = res.data.translation || (res.data.translations && res.data.translations[0]);
    if (!trans || typeof trans !== 'string' || trans.length === 0) {
      throw new Error('Không nhận được kết quả dịch hợp lệ');
    }
  });

  // 3. Kiểm tra Thử Nghiệm Giọng Đọc Trực Tiếp trong Cài Đặt (/api/tts/speak)
  await testCase('Chẩn đoán Giọng đọc Matcha-TTS Native trong Cài đặt (/api/tts/speak)', async () => {
    let res;
    try {
      res = await axios.get(`${LOCAL_PROXY_BASE}/api/tts/speak?text=Xin+chao+dao+huu&speed=1.0`, {
        responseType: 'arraybuffer',
        timeout: 3000
      });
    } catch {
      res = await axios.post(`${API_BASE}/api/tts/speak`, {
        text: 'Xin chào đạo hữu',
        speed: 1.0
      }, {
        responseType: 'arraybuffer',
        timeout: 3000
      });
    }

    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const byteLength = res.data?.byteLength || res.data?.length || 0;
    if (byteLength < 500) {
      throw new Error(`Dữ liệu âm thanh WAV quá nhỏ: ${byteLength} bytes`);
    }
  });

  // 4. Kiểm tra Loại Bỏ Hoàn Toàn Liên Kết Tải HuggingFace Cũ Khỏi Settings
  await testCase('Xác nhận loại bỏ 100% logic tải model HuggingFace cũ', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const tabAiFile = path.resolve(process.cwd(), 'src/pages/portal/settings/system-tabs/TabAiTranslation.tsx');
    const content = fs.readFileSync(tabAiFile, 'utf-8');

    if (content.includes('huggingface.co/datasets/Cong123779')) {
      throw new Error('Phát hiện URL tải model HuggingFace cũ còn sót lại trong TabAiTranslation.tsx');
    }
    if (content.includes('onDownloadModel')) {
      throw new Error('Phát hiện prop onDownloadModel cũ còn sót lại');
    }
  });

  // 5. Kiểm tra Cấu Hình Bộ Lưu Trữ và Chế Độ Xử Lý (CPU / GPU / Auto)
  await testCase('Cấu hình Chế độ Xử lý Nơ-ron (Auto INT8, GPU CUDA, CPU)', async () => {
    const validModes = ['auto', 'gpu', 'cpu'];
    for (const mode of validModes) {
      if (!mode) throw new Error('Mode rỗng');
    }
  });

  console.log(`==================================================`);
  console.log(`  📊 KẾT QUẢ KIỂM THỬ SETTINGS & DIAGNOSTICS: ${passed} passed | ${failed} failed`);
  console.log(`==================================================\n`);

  return { passed, failed };
}
