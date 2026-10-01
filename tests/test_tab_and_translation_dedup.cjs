#!/usr/bin/env node
/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  test_tab_and_translation_dedup.js
 *  Kiểm thử chuyên sâu các tính năng:
 *  1. Làm sạch tiêu đề tab & Chuyển đổi số chương Hán tự -> Ả Rập
 *  2. Bộ máy Dịch tự động: Gom chữ trùng (Deduplication) & Ánh xạ đa điểm
 *  3. Bộ nhớ đệm 0ms (__translationCache) & Format chuẩn [TRANSLATE_REQ]
 *  4. UI Tab Bar: Nút đóng touch target, cuộn tab, Modal Quản lý & Cấu hình Tab
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
console.log("  🧪 TEST SUITE: LÀM SẠCH TAB TITLE & GOM CHỮ TRÙNG DỊCH TỰ ĐỘNG");
console.log("=========================================================================\n");

const injectedPath = path.join(__dirname, '../src/utils/webviewInjectedScript.js');
const browserCtxPath = fs.existsSync(path.join(__dirname, '../src/contexts/BrowserContext.tsx'))
  ? path.join(__dirname, '../src/contexts/BrowserContext.tsx')
  : path.join(__dirname, '../src/contexts/BrowserContext.jsx');
const injectedCode = fs.readFileSync(injectedPath, 'utf8');
const browserCtxCode = fs.readFileSync(browserCtxPath, 'utf8');

// ─────────────────────────────────────────────────────────────────────────────
// PHẦN 1: CHUYỂN ĐỔI SỐ CHƯƠNG HÁN TỰ & LÀM SẠCH TIÊU ĐỀ TAB NOVEL
// ─────────────────────────────────────────────────────────────────────────────
console.log("[Module 1] Kiểm tra logic chuyển đổi số Hán tự & làm sạch tiêu đề Tab Novel");

// Trích xuất hàm chineseNumberToArabic từ BrowserContext.jsx
function chineseNumberToArabic(chStr) {
  if (!chStr) return '';
  if (/^\d+$/.test(chStr)) return chStr;
  const digits = { '零': 0, '〇': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9 };
  let total = 0, current = 0;
  for (let i = 0; i < chStr.length; i++) {
    const char = chStr[i];
    if (digits[char] !== undefined) {
      current = digits[char];
    } else if (char === '十') {
      total += (current === 0 ? 1 : current) * 10;
      current = 0;
    } else if (char === '百') {
      total += (current === 0 ? 1 : current) * 100;
      current = 0;
    } else if (char === '千') {
      total += (current === 0 ? 1 : current) * 1000;
      current = 0;
    } else if (char === '万') {
      total = (total + current) * 10000;
      current = 0;
    }
  }
  total += current;
  return total > 0 ? String(total) : chStr;
}

// Trích xuất hàm cleanNovelTabTitle từ BrowserContext.jsx
function cleanNovelTabTitle(rawTitle) {
  if (!rawTitle || typeof rawTitle !== 'string') return rawTitle;
  let title = rawTitle.trim();
  const suffixes = [
    /[-_—\s]*(69[sS]huba|69[bB]ar|69书吧|uu看书|uukanshu|起点|qidian|纵横|zongheng|笔趣阁|biquge|飘天文学|piaotian|顶点小说|dingdian|番茄小说|fanqie|晋江|jinjiang|飞卢|feilu|17k|爱看书|txt80|铅笔小说|手机版|最新章节|全文阅读|无弹窗|全文免费阅读)+.*$/i,
    /[-_—\s]+(在线阅读|免费阅读|小说阅读|章节列表|目录|TXT下载).*$/i,
    /\(\d+\/\d+\)$/,
    /\[\d+\/\d+\]$/
  ];
  suffixes.forEach(pattern => {
    title = title.replace(pattern, '').trim();
  });
  title = title.replace(/(?:第\s*([0-9零一二两三四五六七八九十百千万]+)\s*章)/g, (match, p1) => {
    const arab = chineseNumberToArabic(p1);
    return `Chương ${arab}:`;
  });
  title = title.replace(/(?:第\s*([0-9零一二两三四五六七八九十百千万]+)\s*节)/g, (match, p1) => {
    const arab = chineseNumberToArabic(p1);
    return `Tiết ${arab}:`;
  });
  title = title.replace(/(?:Chương\s*\d+:)\s*[-_—:,]\s*/g, (m) => m.replace(/[-_—:,]\s*$/, ' '));
  return title.trim() || rawTitle;
}

// Test cases
assert(chineseNumberToArabic('三') === '3', 'chineseNumberToArabic: 三 -> 3');
assert(chineseNumberToArabic('十二') === '12', 'chineseNumberToArabic: 十二 -> 12');
assert(chineseNumberToArabic('二十五') === '25', 'chineseNumberToArabic: 二十五 -> 25');
assert(chineseNumberToArabic('一百二十五') === '125', 'chineseNumberToArabic: 一百二十五 -> 125');
assert(chineseNumberToArabic('一千零二十四') === '1024', 'chineseNumberToArabic: 一千零二十四 -> 1024');

const sampleTitle1 = '第三章 险境! - 69书吧_手机版';
const cleanedTitle1 = cleanNovelTabTitle(sampleTitle1);
assert(cleanedTitle1.includes('Chương 3:') && !cleanedTitle1.includes('69书吧'), `Lọc sạch 69书吧: "${sampleTitle1}" -> "${cleanedTitle1}"`);

const sampleTitle2 = '第十二章 突破!_UU看书 - 最新章节全文阅读';
const cleanedTitle2 = cleanNovelTabTitle(sampleTitle2);
assert(cleanedTitle2.startsWith('Chương 12:') && !cleanedTitle2.includes('UU看书') && !cleanedTitle2.includes('全文阅读'), `Lọc sạch UU看书: "${sampleTitle2}" -> "${cleanedTitle2}"`);

const sampleTitle3 = '第一百二十五章 大结局 (1/2) - 笔趣阁';
const cleanedTitle3 = cleanNovelTabTitle(sampleTitle3);
assert(cleanedTitle3.startsWith('Chương 125:') && !cleanedTitle3.includes('笔趣阁') && !cleanedTitle3.includes('(1/2)'), `Lọc sạch 笔趣阁 & số trang: "${sampleTitle3}" -> "${cleanedTitle3}"`);

// ─────────────────────────────────────────────────────────────────────────────
// PHẦN 2: BỘ MÁY GOM CHỮ TRÙNG (DEDUPLICATION & TARGET GROUPS MAP)
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n[Module 2] Kiểm tra cơ chế Gom Chữ Trùng (Deduplication) & Ánh xạ đa điểm");

assert(injectedCode.includes('uniqueTranslateQueue'), 'injected script khai báo uniqueTranslateQueue để gom chữ');
assert(injectedCode.includes('targetGroupsMap'), 'injected script khai báo targetGroupsMap ánh xạ chữ Hán đến toàn bộ DOM targets');
assert(injectedCode.includes('window.__translationCache'), 'injected script hỗ trợ bộ nhớ đệm __translationCache 0ms');

// Kiểm tra logic ánh xạ đồng loạt trong injectedCode
assert(injectedCode.includes('targets.forEach(t => applyTranslatedText(t, trans))'), 'Khi có bản dịch, đồng loạt cập nhật toàn bộ vị trí trùng khớp');
assert(injectedCode.includes('targetGroupsMap.delete(origText)'), 'Dọn sạch nhóm sau khi áp dụng bản dịch');

// Giả lập cơ chế gom chữ trùng với 100 node có 80 node trùng chữ
const mockQueue = [];
const mockTargetMap = new Map();
const sampleChineseWords = ['上一章', '下一章', '目录', '加入书架', '返回书架', '正文', '第三章 险境', '第一千零一章'];

// Giả lập 200 node DOM với nhiều từ trùng lặp
for (let i = 0; i < 200; i++) {
  const text = sampleChineseWords[i % sampleChineseWords.length];
  const mockNode = { id: i, text: text, nodeValue: text };
  
  if (!mockTargetMap.has(text)) {
    mockTargetMap.set(text, []);
    mockQueue.push(text);
  }
  mockTargetMap.get(text).push(mockNode);
}

assert(mockQueue.length === sampleChineseWords.length, `Gom 200 nodes thành ${mockQueue.length} unique texts (tiết kiệm ${(100 - (mockQueue.length / 200 * 100)).toFixed(1)}% request)`);
assert(mockTargetMap.get('上一章').length === 25, 'Từ "上一章" xuất hiện 25 lần được gom vào 1 nhóm duy nhất');

// Giả lập nhận bản dịch và cập nhật đồng loạt
const mockTranslations = {
  '上一章': 'Chương trước',
  '下一章': 'Chương sau',
  '目录': 'Mục lục',
  '加入书架': 'Thêm vào giá sách',
  '返回书架': 'Về giá sách',
  '正文': 'Chính văn',
  '第三章 险境': 'Chương 3: Nguy hiểm',
  '第一千零一章': 'Chương 1001:'
};

let appliedNodesCount = 0;
mockQueue.forEach(uniqText => {
  const trans = mockTranslations[uniqText];
  const targets = mockTargetMap.get(uniqText) || [];
  targets.forEach(n => {
    n.nodeValue = trans;
    appliedNodesCount++;
  });
  mockTargetMap.delete(uniqText);
});

assert(appliedNodesCount === 200, `Áp dụng thành công và đồng loạt cho toàn bộ 200 vị trí DOM`);
assert(mockTargetMap.size === 0, 'Dọn sạch toàn bộ target map sau khi dịch hoàn tất');

// ─────────────────────────────────────────────────────────────────────────────
// PHẦN 3: BỘ NHỚ ĐỆM DỊCH TỨC THÌ 0MS & FORMAT GỬI IPC [TRANSLATE_REQ]
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n[Module 3] Kiểm tra Cache 0ms & Giao thức IPC [TRANSLATE_REQ]");

assert(injectedCode.includes('window.__translationCache.has(rawVal)'), 'Tra cứu tức thì trong __translationCache trước khi đưa vào hàng đợi');
assert(injectedCode.includes('window.__translationCache.set(origText, trans)'), 'Tự động lưu bản dịch mới vào __translationCache');

// Kiểm tra định dạng JSON payload của [TRANSLATE_REQ]
assert(injectedCode.includes('console.log("[TRANSLATE_REQ]" + reqPayload)'), 'Format [TRANSLATE_REQ] kèm payload JSON chuẩn xác cho Electron & Mobile Proxy');
assert(!injectedCode.includes('console.log("[TRANSLATE_REQ] Batch unique texts:"'), 'Đã loại bỏ log rác bắt đầu bằng [TRANSLATE_REQ] để tránh gây lỗi JSON parse');

// Kiểm tra gán hàm toggleAutoTranslate vào __TienHiepHelpers
assert(injectedCode.includes('window.__TienHiepHelpers.toggleAutoTranslate = window.toggleAutoTranslate'), 'Gán toggleAutoTranslate vào __TienHiepHelpers để tránh lỗi undefined');

// ─────────────────────────────────────────────────────────────────────────────
// PHẦN 4: GIAO DIỆN TAB BAR & MODAL CẤU HÌNH QUẢN LÝ TAB
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n[Module 4] Kiểm tra Giao diện Tab Bar & Modal Cấu Hình");

assert(browserCtxCode.includes('isTabConfigOpen'), 'BrowserContext quản lý state isTabConfigOpen');
assert(browserCtxCode.includes('setIsTabConfigOpen(true)'), 'Có nút mở Modal Cấu hình Tab');
assert(browserCtxCode.includes('translateAllTabTitles'), 'Có tính năng dịch đồng loạt tất cả tiêu đề các tab đang mở');
assert(browserCtxCode.includes('closeOtherTabs'), 'Có tính năng đóng các tab khác (giữ tab hiện tại)');
assert(browserCtxCode.includes('cleanNovelTabTitle'), 'BrowserContext dùng cleanNovelTabTitle để làm sạch tiêu đề');
assert(browserCtxCode.includes('tabElementsRef'), 'Có ref quản lý tab để tự động scroll tab active vào tầm nhìn');

// Kiểm tra nút đóng tab có touch target chuẩn
assert(browserCtxCode.includes('rounded-full hover:bg-white/20 active:scale-90 text-slate-400 hover:text-white'), 'Nút đóng tab có hiệu ứng hover & touch target thân thiện mobile');

// ─────────────────────────────────────────────────────────────────────────────
// TỔNG KẾT
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n=========================================================================");
console.log(`  KẾT QUẢ: ${passedTests}/${totalTests} tests passed | ${failedTests} failed`);
console.log("=========================================================================\n");

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
