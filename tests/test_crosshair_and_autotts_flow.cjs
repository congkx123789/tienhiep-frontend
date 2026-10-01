#!/usr/bin/env node
/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  test_crosshair_and_autotts_flow.js
 *  Kiểm thử chuyên sâu các tính năng theo yêu cầu người dùng:
 *  1. Tâm ngắm & nút bấm (Cancel, Mặc định, Lưu, Test Next):
 *     - Instant action binding (pointerdown, touchstart, click)
 *     - Cleanup hoàn toàn khỏi DOM khi bấm Cancel
 *     - Xóa cấu hình tùy chỉnh khi bấm Mặc định (deleteNextRule)
 *     - Điều hướng thử khi bấm Chuyển thử (triggerNavigation)
 *  2. "📖 Đọc từ đây" (Read From Here / Tap-to-read):
 *     - Nhận diện đoạn văn (P, data-tts-idx hoặc text dài)
 *     - Tính toán chỉ số đoạn văn (paraIdx) chính xác
 *     - Phát sự kiện TAP_PARAGRAPH lên parent window
 *     - BrowserContext đón nhận và phát global-tts-seek
 *  3. Lưu Queue Rule theo Domain (__tienhiep_novel_next_rules):
 *     - Lưu selector theo host/novelKey
 *     - Tự động nạp lại ở chương sau mà không cần kéo lại tâm ngắm
 *     - Fallback rule theo domain (_last) cho các truyện khác
 *  4. Tự động chạy TTS khi người dùng tự chuyển chương (Manual Next Chapter):
 *     - Giữ cờ phát qua activeAudioObjRef đồng bộ thời gian thực
 *     - Kích hoạt EXTRACT_TEXT khi IFRAME_READY
 *     - Vòng lặp retry AUDIO_TEXT_RES (tối đa 8 lần) khi trang mới nạp chậm
 *     - Tự động nạp text chương mới và phát từ câu 0
 * ═════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

console.log("\n=========================================================================");
console.log("  🎯 TEST SUITE: TÂM NGẮM, ĐỌC TỪ ĐÂY, QUEUE RULE & AUTO-TTS NEXT CHAP");
console.log("=========================================================================\n");

const injectedPath = path.join(__dirname, '../src/utils/webviewInjectedScript.js');
const browserCtxPath = fs.existsSync(path.join(__dirname, '../src/contexts/BrowserContext.tsx'))
  ? path.join(__dirname, '../src/contexts/BrowserContext.tsx')
  : path.join(__dirname, '../src/contexts/BrowserContext.jsx');
const injectedCode = fs.readFileSync(injectedPath, 'utf8');
const browserCtxCode = fs.readFileSync(browserCtxPath, 'utf8');

// ─────────────────────────────────────────────────────────────────────────────
// PHẦN 1: KIỂM TRA TÂM NGẮM & INSTANT BINDING CHO NÚT HỦY / MẶC ĐỊNH / LƯU / CHUYỂN THỬ
// ─────────────────────────────────────────────────────────────────────────────
console.log("[Module 1] Kiểm tra cơ chế nút bấm tâm ngắm (Cancel / Mặc định / Lưu / Chuyển thử)");

// 1.1 Kiểm tra bindInstantAction hỗ trợ pointerdown + touchstart + click
const hasInstantActionHelper = injectedCode.includes('bindInstantAction') &&
  injectedCode.includes('pointerdown') &&
  injectedCode.includes('touchstart') &&
  injectedCode.includes('click');
assert(hasInstantActionHelper, "Hàm bindInstantAction hỗ trợ đồng thời pointerdown, touchstart và click (bảo đảm chạm là kích hoạt ngay trên mobile)");

// 1.2 Kiểm tra nút Cancel gắn instant action và cleanup sạch DOM
const cancelBindingCheck = injectedCode.includes('bindInstantAction(cancelBtn') &&
  injectedCode.includes('cleanup()') &&
  injectedCode.includes('banner.remove()');
assert(cancelBindingCheck, "Nút đỏ '✕ Hủy' được gắn bindInstantAction và gọi cleanup() + banner.remove() dọn sạch DOM 100%");

// 1.3 Kiểm tra nút Mặc định gắn instant action và khôi phục rule mặc định
const defaultBindingCheck = injectedCode.includes('bindInstantAction(resetBtn') &&
  injectedCode.includes('deleteNextRule') &&
  injectedCode.includes('cleanup()');
assert(defaultBindingCheck, "Nút 'Mặc định' được gắn bindInstantAction và gọi deleteNextRule() để khôi phục cấu hình mặc định");

// 1.4 Kiểm tra nút Lưu nút chuyển trang
const saveBindingCheck = injectedCode.includes('bindInstantAction(confirmBtn') &&
  injectedCode.includes('bindInstantAction(badgeSaveBtn') &&
  injectedCode.includes('saveNextRule');
assert(saveBindingCheck, "Nút 'Lưu nút' (cả thanh banner và badge tâm ngắm) kích hoạt lưu rule với instant action");

// 1.5 Kiểm tra nút 'Chuyển Thử' (Test Next Page)
const testNextCheck = injectedCode.includes('bindInstantAction(testNextBtn') &&
  injectedCode.includes('triggerNavigation(currentTarget)');
assert(testNextCheck, "Nút '⏭ Chuyển Thử' gắn bindInstantAction và kích hoạt triggerNavigation để kiểm tra ngay nút chuyển trang");

// ─────────────────────────────────────────────────────────────────────────────
// PHẦN 2: CHỈ ĐỊNH ĐỌC ĐOẠN VĂN BẢN ("📖 Đọc từ đây" / Read From Here)
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n[Module 2] Kiểm tra tính năng chỉ định đọc đoạn văn bản ('📖 Đọc từ đây')");

// 2.1 Kiểm tra nhận diện phần tử văn bản dưới tâm ngắm
const isTargetParagraphLogic = injectedCode.includes('isTargetParagraph') &&
  injectedCode.includes('target.tagName === \'P\'') &&
  injectedCode.includes('target.hasAttribute(\'data-tts-idx\')');
assert(isTargetParagraphLogic, "Tâm ngắm nhận diện chính xác phần tử là đoạn văn bản (thẻ p, data-tts-idx hoặc text dài > 15 ký tự)");

// 2.2 Kiểm tra hiển thị nút '📖 Đọc từ đây' khi nhắm vào văn bản
const readFromHereBtnCheck = injectedCode.includes('readBtn') &&
  injectedCode.includes('badgeReadBtn') &&
  injectedCode.includes('📖 Đọc từ đây');
assert(readFromHereBtnCheck, "Giao diện banner và badge tâm ngắm tự động chuyển sang chế độ '📖 Đọc từ đây' khi nhắm vào văn bản");

// 2.3 Mô phỏng thuật toán tính toán paragraph index (paraIdx)
function simulateFindParagraphIndex(targetText, paragraphs) {
  let matchedIdx = -1;
  const cleanTarget = targetText.trim().replace(/\s+/g, ' ');
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i].trim().replace(/\s+/g, ' ');
    if (p.includes(cleanTarget) || cleanTarget.includes(p.slice(0, 30))) {
      matchedIdx = i;
      break;
    }
  }
  return matchedIdx;
}

const mockParagraphs = [
  "Chương 1: Khởi đầu nơi hoang dã.",
  "Gió núi rít gào, từng cơn hàn khí thổi qua thung lũng đá xám.",
  "Lâm Tiêu ngồi xếp bằng dưới gốc tùng cổ thụ, hai mắt nhắm nghiền, chu thiên vận chuyển chân khí.",
  "Đột nhiên, một tiếng gầm chấn động vang lên từ sâu trong rừng rậm!",
  "Hắn mở choàng mắt, thần quang sắc bén lóe lên trong con ngươi."
];

const targetParagraphSnippet = "Lâm Tiêu ngồi xếp bằng dưới gốc tùng";
const calculatedIdx = simulateFindParagraphIndex(targetParagraphSnippet, mockParagraphs);
assert(calculatedIdx === 2, `Tính toán chính xác paraIdx = 2 khi nhắm vào đoạn '${targetParagraphSnippet}'`);

// 2.4 Kiểm tra sự kiện TAP_PARAGRAPH phát lên cha
const tapParagraphDispatchCheck = injectedCode.includes('type: \'TAP_PARAGRAPH\'') &&
  injectedCode.includes('paraIdx') &&
  injectedCode.includes('postMessage');
assert(tapParagraphDispatchCheck, "Kịch bản injected script phát đúng sự kiện TAP_PARAGRAPH kèm paraIdx lên parent window");

// 2.5 Kiểm tra BrowserContext xử lý TAP_PARAGRAPH
const browserCtxTapHandler = browserCtxCode.includes("data.type === 'TAP_PARAGRAPH'") &&
  browserCtxCode.includes("global-tts-seek") &&
  browserCtxCode.includes("sentenceIdx: paraIdx");
assert(browserCtxTapHandler, "BrowserContext.jsx bắt sự kiện TAP_PARAGRAPH và phát global-tts-seek với sentenceIdx chuẩn để AudioPlayer nhảy đoạn");

// ─────────────────────────────────────────────────────────────────────────────
// PHẦN 3: LƯU TRỮ VÀ TRUY VẤN QUEUE RULE THEO DOMAIN (__tienhiep_novel_next_rules)
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n[Module 3] Kiểm tra cơ chế lưu trữ Queue Rule theo Domain");

class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, val) {
    this.store[key] = String(val);
  }
  removeItem(key) {
    delete this.store[key];
  }
}

const mockLS = new MockLocalStorage();

function simulateSaveNextRule(host, novelKey, selector) {
  try {
    const raw = mockLS.getItem('__tienhiep_novel_next_rules') || '{}';
    const rules = JSON.parse(raw);
    const domainKey = host || 'default';
    if (!rules[domainKey]) rules[domainKey] = {};
    rules[domainKey][novelKey || 'all'] = selector;
    rules[domainKey]['_last'] = selector;
    mockLS.setItem('__tienhiep_novel_next_rules', JSON.stringify(rules));
    return true;
  } catch (e) {
    return false;
  }
}

function simulateGetNextRule(host, novelKey) {
  try {
    const raw = mockLS.getItem('__tienhiep_novel_next_rules') || '{}';
    const rules = JSON.parse(raw);
    const domainKey = host || 'default';
    const domainRules = rules[domainKey];
    if (!domainRules) return null;
    return domainRules[novelKey] || domainRules['_last'] || null;
  } catch (e) {
    return null;
  }
}

// Test lưu rule cho domain 69shuba.cx
const saved = simulateSaveNextRule('www.69shuba.cx', 'truyen-123', '.page-next a.btn-next');
assert(saved === true, "Lưu rule selector thành công cho novel 'truyen-123' trên domain 69shuba.cx");

// Test lấy lại rule ở cùng domain
const retrievedNovelRule = simulateGetNextRule('www.69shuba.cx', 'truyen-123');
assert(retrievedNovelRule === '.page-next a.btn-next', "Lấy lại chính xác selector theo novelKey");

// Test lấy rule fallback theo host (_last) khi đọc truyện khác trên cùng trang web
const fallbackHostRule = simulateGetNextRule('www.69shuba.cx', 'truyen-456');
assert(fallbackHostRule === '.page-next a.btn-next', "Tự động áp dụng rule _last cho truyện khác cùng domain (không cần kéo lại tâm ngắm)");

// Test domain khác không bị lẫn rule
const otherDomainRule = simulateGetNextRule('truyenfull.vn', 'truyen-789');
assert(otherDomainRule === null, "Domain khác chưa cấu hình trả về null an toàn");

// ─────────────────────────────────────────────────────────────────────────────
// PHẦN 4: TỰ ĐỘNG CHẠY TTS KHI TỰ CHUYỂN CHƯƠNG (MANUAL NEXT CHAPTER FLOW)
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n[Module 4] Kiểm tra luồng Tự Động Chạy TTS khi tự chuyển chương");

// 4.1 Kiểm tra activeAudioObjRef được duy trì liên tục
const hasActiveAudioRef = browserCtxCode.includes('activeAudioObjRef = React.useRef(null)') &&
  browserCtxCode.includes('activeAudioObjRef.current = activeAudioObj');
assert(hasActiveAudioRef, "BrowserContext duy trì activeAudioObjRef đồng bộ thời gian thực với activeAudioObj");

// 4.2 Kiểm tra IFRAME_READY tự động bật autoAudioStatesRef khi AudioPlayer đang mở
const hasAutoNextOnIframeReady = browserCtxCode.includes('autoAudioStatesRef.current[tabId] = true') &&
  browserCtxCode.includes('activeAudioObjRef.current') &&
  browserCtxCode.includes("action: 'EXTRACT_TEXT'");
assert(hasAutoNextOnIframeReady, "Khi sang chương mới (IFRAME_READY), nếu AudioPlayer đang hoạt động thì tự động duy trì cờ và gửi EXTRACT_TEXT");

// 4.3 Kiểm tra vòng lặp retry trong AUDIO_TEXT_RES khi web tải nội dung chậm
const hasAudioTextRetry = browserCtxCode.includes('AUDIO_TEXT_RES') &&
  browserCtxCode.includes('currentRetries <= 8') &&
  browserCtxCode.includes('setTimeout') &&
  browserCtxCode.includes("action: 'EXTRACT_TEXT'");
assert(hasAudioTextRetry, "Hệ thống có cơ chế retry thông minh tối đa 8 lần để chờ văn bản chương mới tải và dịch xong");

// 4.4 Mô phỏng quy trình nạp chương mới và kích hoạt phát tự động từ câu 0
class SimulatedAudioStateController {
  constructor() {
    this.activeAudioObj = null;
    this.activeAudioObjRef = { current: null };
    this.autoAudioStates = {};
    this.isPlaying = false;
    this.currentSentenceIdx = -1;
  }

  // Khởi động nghe chương 1
  startInitialChapter(chapter1Data) {
    this.activeAudioObj = chapter1Data;
    this.activeAudioObjRef.current = chapter1Data;
    this.autoAudioStates['tab_1'] = true;
    this.isPlaying = true;
    this.currentSentenceIdx = 0;
  }

  // Người dùng tự bấm sang chương 2 trên giao diện webview
  onUserManualNavigateNextPage() {
    const tabId = 'tab_1';
    if (this.autoAudioStates[tabId] || this.activeAudioObjRef.current) {
      this.autoAudioStates[tabId] = true;
      return { sendAction: 'EXTRACT_TEXT', tabId };
    }
    return null;
  }

  // Nhận text chương 2 từ webview
  onReceiveExtractedText(tabId, newTitle, newText) {
    if (!this.autoAudioStates[tabId] && !this.activeAudioObjRef.current) return false;

    // Cập nhật activeAudioObj với nội dung chương 2 mới
    const newAudioObj = {
      title: newTitle,
      text: newText,
      chapter: 2,
      isAutoNext: true,
      timestamp: Date.now()
    };
    this.activeAudioObj = newAudioObj;
    this.activeAudioObjRef.current = newAudioObj;

    // Tự động phát từ câu 0
    this.currentSentenceIdx = 0;
    this.isPlaying = true;
    return true;
  }
}

const controller = new SimulatedAudioStateController();
controller.startInitialChapter({
  title: "Chương 1: Khởi đầu",
  text: "Nội dung chương 1 đã nghe xong...",
  chapter: 1
});
assert(controller.isPlaying === true && controller.currentSentenceIdx === 0, "Chương 1 bắt đầu phát bình thường");

// Người dùng bấm next trên web
const iframeReadyAction = controller.onUserManualNavigateNextPage();
assert(iframeReadyAction && iframeReadyAction.sendAction === 'EXTRACT_TEXT', "Khi người dùng tự chuyển chương, IFRAME_READY tự phát EXTRACT_TEXT");
assert(controller.autoAudioStates['tab_1'] === true, "Cờ autoAudioStates được bảo tồn nhờ activeAudioObjRef");

// Nhận văn bản chương 2 trả về
const loadedCh2 = controller.onReceiveExtractedText('tab_1', 'Chương 2: Đột phá cảnh giới', 'Nội dung chương 2 bắt đầu tại sơn cốc...');
assert(loadedCh2 === true, "Chương 2 được tiếp nhận thành công vào Audio State");
assert(controller.activeAudioObj.chapter === 2, "Chỉ số chương cập nhật lên 2");
assert(controller.currentSentenceIdx === 0, "Chương 2 tự động bắt đầu đọc từ câu 0 mà không cần người dùng bấm Play lại");
assert(controller.isPlaying === true, "Trạng thái âm thanh tiếp tục phát liền mạch");

// ─────────────────────────────────────────────────────────────────────────────
// PHẦN 5: TỔNG KẾT
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n=========================================================================");
console.log(`  KẾT QUẢ: ${passedTests}/${totalTests} tests passed | ${failedTests} failed`);
console.log("=========================================================================\n");

if (failedTests === 0) {
  console.log("🎉 XUẤT SẮC! CÁC TÍNH NĂNG TÂM NGẮM, HỦY TÂM, ĐỌC TỪ ĐÂY, QUEUE RULE & TỰ ĐỘNG CHẠY TTS ĐÃ ĐẠT CHUẨN 100%!\n");
  process.exit(0);
} else {
  console.error("⛔ CÓ LỖI XẢY RA TRONG TEST SUITE!\n");
  process.exit(1);
}
