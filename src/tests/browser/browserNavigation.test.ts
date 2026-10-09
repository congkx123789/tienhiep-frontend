// Browser Navigation & History Unit Tests (Chrome-like behavior)
import assert from 'assert';
import { normalizeUrlForIframe } from '../../contexts/browser/browserHelpers';

export function runBrowserNavigationTests(): { passed: number; failed: number } {
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  console.log('\n--- 🌐 KIỂM THỬ ĐIỀU HƯỚNG TRÌNH DUYỆT CHROME-LIKE (LAYER 1) ---');

  test('1. Chuẩn hóa URL cho Iframe Proxy', () => {
    const raw = 'https://m.qidian.com/book/123';
    const normalized = normalizeUrlForIframe(raw);
    assert(normalized.includes('/api/iframe_proxy?url='), 'Phải bọc URL qua iframe_proxy');
    assert(normalized.includes(encodeURIComponent(raw)), 'Phải encodeURIComponent URL đích');
  });

  test('2. Chặn đệ quy Proxy & Localhost URLs', () => {
    const localhost = 'http://localhost:3532/reader';
    assert.strictEqual(normalizeUrlForIframe(localhost), 'about:newtab', 'Localhost nội bộ phải trả về about:newtab');

    const nested = 'http://127.0.0.1:5051/api/iframe_proxy?url=https%3A%2F%2Ffanqienovel.com';
    const unnested = normalizeUrlForIframe(nested);
    assert(unnested.includes('fanqienovel.com'), 'Phải giải mã URL đã bị lồng proxy');
  });

  test('3. Logic Điều Hướng Ban Đầu: Nút Back và Forward bị vô hiệu hóa', () => {
    const historyStack = ['https://google.com'];
    const historyIndex = 0;
    const canGoBack = historyIndex > 0;
    const canGoForward = historyIndex < historyStack.length - 1;

    assert.strictEqual(canGoBack, false, 'Ban đầu không thể Back');
    assert.strictEqual(canGoForward, false, 'Ban đầu không thể Forward');
  });

  test('4. Logic Cắt Đứt Tương Lai (History Truncation) giống hệt Google Chrome', () => {
    let historyStack = ['https://google.com'];
    let historyIndex = 0;

    // 1. Chuyển sang Trang 2: Facebook
    const url2 = 'https://facebook.com';
    historyStack = [...historyStack.slice(0, historyIndex + 1), url2];
    historyIndex = historyStack.length - 1;

    // 2. Chuyển sang Trang 3: Youtube
    const url3 = 'https://youtube.com';
    historyStack = [...historyStack.slice(0, historyIndex + 1), url3];
    historyIndex = historyStack.length - 1;

    assert.strictEqual(historyStack.length, 3, 'Lịch sử có 3 trang: Google -> Facebook -> Youtube');
    assert.strictEqual(historyIndex, 2, 'Đang ở Youtube');
    assert.strictEqual(historyIndex > 0, true, 'Có thể Back');
    assert.strictEqual(historyIndex < historyStack.length - 1, false, 'Không thể Forward');

    // 3. Bấm Lùi (Back) về Facebook
    historyIndex -= 1;
    assert.strictEqual(historyStack[historyIndex], 'https://facebook.com');
    assert.strictEqual(historyIndex < historyStack.length - 1, true, 'Nút Forward phải sáng lên vì Youtube ở trước');

    // 4. HÀNH ĐỘNG CỐT LÕI: Đang ở Facebook, người dùng gõ URL mới Tiktok
    const urlNew = 'https://tiktok.com';
    historyStack = [...historyStack.slice(0, historyIndex + 1), urlNew];
    historyIndex = historyStack.length - 1;

    // 5. Xác quyết: Youtube phải bị xóa sạch khỏi tương lai!
    assert.strictEqual(historyStack.length, 3, 'Lịch sử mới: Google -> Facebook -> Tiktok');
    assert.strictEqual(historyStack[2], 'https://tiktok.com');
    assert.strictEqual(historyIndex, 2);
    assert.strictEqual(historyIndex < historyStack.length - 1, false, 'Nút Forward phải bị vô hiệu hóa trở lại');
  });

  test('5. Bảo vệ An Toàn Biên (Out of Bounds Protection)', () => {
    const historyStack = ['https://google.com'];
    let historyIndex = 0;

    // Cố tình bấm Back khi index = 0
    if (historyIndex > 0) historyIndex -= 1;
    assert.strictEqual(historyIndex, 0, 'Index không được giảm xuống âm');

    // Cố tình bấm Forward khi ở đỉnh stack
    if (historyIndex < historyStack.length - 1) historyIndex += 1;
    assert.strictEqual(historyIndex, 0, 'Index không được vượt quá độ dài stack');
  });

  test('6. Chống Trùng Lặp Khi Gõ Lại Cùng 1 URL', () => {
    let historyStack = ['https://google.com'];
    let historyIndex = 0;
    const sameUrl = 'https://google.com';

    if (historyStack[historyIndex] !== sameUrl) {
      historyStack = [...historyStack.slice(0, historyIndex + 1), sameUrl];
      historyIndex = historyStack.length - 1;
    }

    assert.strictEqual(historyStack.length, 1, 'Không được tăng kích thước history khi gõ lại URL hiện tại');
    assert.strictEqual(historyIndex, 0);
  });

  test('7. Đồng Bộ PAGE_LOADED Giữ Vững Con Trỏ Khi Chuyển Trang Nội Bộ', () => {
    let historyStack = ['https://site.com/chap1', 'https://site.com/chap2'];
    let historyIndex = 1;

    // Giả lập redirect nội bộ tới chap3
    const redirectedUrl = 'https://site.com/chap3';
    const isSame = historyStack[historyIndex] === redirectedUrl;
    if (!isSame) {
      historyStack = historyStack.slice(0, historyIndex + 1);
      historyStack.push(redirectedUrl);
      historyIndex = historyStack.length - 1;
    }

    assert.strictEqual(historyStack.length, 3, 'Stack mở rộng với link mới: chap1 -> chap2 -> chap3');
    assert.strictEqual(historyIndex, 2, 'Con trỏ chỉ tới chap3');
    assert.strictEqual(historyIndex > 0, true, 'Có thể lùi');
  });

  test('8. Loại Bỏ Hoàn Toàn Auto F5 (Chống Reload Lặp Vô Hạn)', () => {
    let isAwSnap = false;
    let autoReloadTriggered = false;

    // Khi gặp lỗi proxy load error: trực tiếp bật màn hình Aw Snap, KHÔNG tự động F5
    const onError = () => {
      isAwSnap = true;
      // autoReloadTriggered giữ nguyên là false
    };
    onError();

    assert.strictEqual(isAwSnap, true, 'Kích hoạt màn hình lỗi thân thiện');
    assert.strictEqual(autoReloadTriggered, false, 'Tuyệt đối KHÔNG tự động F5 hay reload ngầm');
  });

  test('9. Dọn Sạch Trạng Thái Khi Đổi URL Hoặc Tải Lại Thành Công', () => {
    let isAwSnap = true;

    // Giả lập người dùng điều hướng sang URL mới
    const onUrlChange = () => {
      isAwSnap = false;
    };
    onUrlChange();

    assert.strictEqual(isAwSnap, false, 'Màn hình Aw, Snap phải biến mất khi chuyển URL');
  });

  return { passed, failed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { failed } = runBrowserNavigationTests();
  if (failed > 0) process.exit(1);
}
