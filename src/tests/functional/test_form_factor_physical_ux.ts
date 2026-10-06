/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  test_form_factor_physical_ux.ts
 *  Kiểm định Form Factor thiết bị vật lý: Keyboard Overlap, Notch & Gesture
 * ═════════════════════════════════════════════════════════════════════════════
 */

export interface FormFactorTestResult {
  passed: number;
  failed: number;
}

/**
 * 1. Logic giả lập tính toán Viewport khi Bàn phím ảo (Virtual Keyboard) xuất hiện
 */
export function calculateKeyboardAdjustedOffset(params: {
  viewportHeight: number;
  keyboardHeight: number;
  elementTop: number;
  elementHeight: number;
}): { isOverlapped: boolean; requiredScrollOffset: number } {
  const visibleHeight = params.viewportHeight - params.keyboardHeight;
  const elementBottom = params.elementTop + params.elementHeight;

  if (elementBottom > visibleHeight) {
    const requiredScrollOffset = elementBottom - visibleHeight + 16; // Thêm 16px padding an toàn
    return { isOverlapped: true, requiredScrollOffset };
  }
  return { isOverlapped: false, requiredScrollOffset: 0 };
}

/**
 * 2. Logic kiểm tra Safe Area & Tai thỏ (Notch / Dynamic Island)
 */
export function validateSafeAreaMetrics(params: {
  hasNotch: boolean;
  safeAreaTop: number;
  safeAreaBottom: number;
  headerPaddingTop: number;
  bottomBarPaddingBottom: number;
}): { topValid: boolean; bottomValid: boolean } {
  const topValid = !params.hasNotch || params.headerPaddingTop >= params.safeAreaTop;
  const bottomValid = !params.hasNotch || params.bottomBarPaddingBottom >= params.safeAreaBottom;
  return { topValid, bottomValid };
}

/**
 * 3. Logic xử lý xung đột cử chỉ vuốt (Gesture Conflicts) giữa Ứng dụng & iOS/Android
 */
export function resolveReadingSwipeGesture(params: {
  startX: number;
  endX: number;
  startY: number;
  endY: number;
  isIOS: boolean;
}): { action: 'SYSTEM_BACK' | 'PREV_CHAPTER' | 'NEXT_CHAPTER' | 'SCROLL' | 'IGNORED' } {
  const deltaX = params.endX - params.startX;
  const deltaY = params.endY - params.startY;

  // Trên iOS: Cạnh viền trái (0 - 25px) dành riêng cho Back của hệ thống
  if (params.isIOS && params.startX <= 25 && deltaX > 30) {
    return { action: 'SYSTEM_BACK' };
  }

  // Nếu thao tác là vuốt dọc (để cuộn đọc truyện)
  if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 20) {
    return { action: 'SCROLL' };
  }

  // Thao tác vuốt ngang lật trang từ vùng an toàn
  const SWIPE_THRESHOLD = 50;
  if (Math.abs(deltaX) >= SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
    return { action: deltaX < 0 ? 'NEXT_CHAPTER' : 'PREV_CHAPTER' };
  }

  return { action: 'IGNORED' };
}

export async function runFormFactorUXTests(): Promise<FormFactorTestResult> {
  console.log('\n📐 BẮT ĐẦU KIỂM ĐỊNH FORM FACTOR & THIẾT KẾ VẬT LÝ (UI/UX)...');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, msg: string) => {
    if (condition) {
      console.log(`  ✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${msg}`);
      failed++;
    }
  };

  // ─── 1. KIỂM THỬ KEYBOARD OVERLAP (BÀN PHÍM CHE MẤT FORM) ───
  // Giả lập iPhone/Android: Viewport cao 844px, ô input thanh toán ở vị trí y=650px (cao 48px).
  // Khi người dùng bấm vào ô nhập, bàn phím cao 336px bật lên.
  const normalForm = calculateKeyboardAdjustedOffset({
    viewportHeight: 844,
    keyboardHeight: 0,
    elementTop: 650,
    elementHeight: 48,
  });
  assert(normalForm.isOverlapped === false, 'Khi chưa mở bàn phím: Ô input hiển thị đầy đủ');

  const keyboardOpened = calculateKeyboardAdjustedOffset({
    viewportHeight: 844,
    keyboardHeight: 336,
    elementTop: 650,
    elementHeight: 48,
  });
  assert(
    keyboardOpened.isOverlapped === true && keyboardOpened.requiredScrollOffset === 206,
    `Khi bàn phím bật lên (336px): Phát hiện overlap chính xác, yêu cầu cuộn bù trừ ${keyboardOpened.requiredScrollOffset}px`
  );

  // ─── 2. KIỂM THỬ SAFE AREA & NOTCH (TAI THỎ / DYNAMIC ISLAND) ───
  // iPhone 14/15 Pro: Tai thỏ/Dynamic Island cần top 47px, thanh Home Bar đáy cần 34px.
  const safeLayout = validateSafeAreaMetrics({
    hasNotch: true,
    safeAreaTop: 47,
    safeAreaBottom: 34,
    headerPaddingTop: 48, // Header có đệm chuẩn
    bottomBarPaddingBottom: 36, // Bottom nav có đệm chuẩn
  });
  assert(
    safeLayout.topValid && safeLayout.bottomValid,
    'Header & Bottom Bar đáp ứng 100% khoảng đệm Safe Area (Không bị tai thỏ hay Home bar che)'
  );

  const invalidLayout = validateSafeAreaMetrics({
    hasNotch: true,
    safeAreaTop: 47,
    safeAreaBottom: 34,
    headerPaddingTop: 10, // Đệm quá bé, sẽ bị tai thỏ cắt mất nút Back
    bottomBarPaddingBottom: 36,
  });
  assert(
    invalidLayout.topValid === false,
    'Cảnh báo chuẩn xác: Header không đủ padding sẽ bị Notch che mất nút điều hướng'
  );

  // ─── 3. KIỂM THỬ GESTURE CONFLICTS (XUNG ĐỘT THAO TÁC VUỐT) ───
  // Case A: Vuốt từ cạnh viền trái x=10px trên iOS -> Phải nhường cho SYSTEM_BACK
  const edgeSwipeIOS = resolveReadingSwipeGesture({
    startX: 10,
    endX: 120,
    startY: 400,
    endY: 405,
    isIOS: true,
  });
  assert(
    edgeSwipeIOS.action === 'SYSTEM_BACK',
    'iOS Edge Swipe: Cử chỉ vuốt cạnh trái (x=10px) được bảo lưu cho System Back, không gây xung đột lật trang'
  );

  // Case B: Vuốt ngang lật trang ở giữa màn hình (x=200px sang x=80px) -> Lật chương sau
  const nextChapterSwipe = resolveReadingSwipeGesture({
    startX: 200,
    endX: 80,
    startY: 400,
    endY: 410,
    isIOS: true,
  });
  assert(
    nextChapterSwipe.action === 'NEXT_CHAPTER',
    'Vuốt ngang từ giữa màn hình (dx=-120px): Nhận diện đúng thao tác NEXT_CHAPTER'
  );

  // Case C: Vuốt dọc đọc tiếp chương (dy=150px) -> Trả về SCROLL mượt mà
  const verticalScroll = resolveReadingSwipeGesture({
    startX: 200,
    endX: 205,
    startY: 300,
    endY: 480,
    isIOS: true,
  });
  assert(
    verticalScroll.action === 'SCROLL',
    'Vuốt dọc màn hình: Giữ nguyên chế độ cuộn tự nhiên (SCROLL), không kích hoạt nhầm lật trang'
  );

  console.log('==================================================');
  console.log(`  📊 KẾT QUẢ FORM FACTOR & PHYSICAL UX: ${passed} passed | ${failed} failed`);
  console.log('==================================================\n');

  return { passed, failed };
}
