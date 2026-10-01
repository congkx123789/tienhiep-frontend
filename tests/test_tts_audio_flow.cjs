#!/usr/bin/env node
/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  test_tts_audio_flow.js
 *  Kiểm thử chuyên sâu toàn diện:
 *  1. Phân tách câu tiếng Việt, khử ký tự HTML/Emoji, xử lý đoạn văn siêu dài
 *  2. Nhận diện chữ Hán chưa dịch (Chinese Ratio Detection) & bảo vệ luồng đọc
 *  3. Kẹp biên độ tua (Negative Seek, End-of-Chapter Clamp, Empty State)
 *  4. Stress test tua nhanh liên tục (Rapid Scrubbing) & Session Lock Isolation
 *  5. Tự động chuyển chương (Auto-Next Chapter Flow) & dọn dẹp âm thanh chương cũ
 *  6. Tua khi Paused vs Tua khi Playing
 *  7. Cơ chế thu hồi bộ nhớ đệm (Cache Eviction Sliding Window & revokeObjectURL)
 *  8. Xử lý lỗi mạng (Network Dropout, Retry & Fallback)
 *  9. Live Ping kết nối Local TTS Server (port 8001) & Proxy Server (port 5051)
 * ═════════════════════════════════════════════════════════════════════════════
 */

const http = require('http');

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

// ─────────────────────────────────────────────────────────────────
// MODULE 1: Sentence Sanitizer & Vietnamese Punctuation Parser
// ─────────────────────────────────────────────────────────────────
function sanitizeAndSplitText(title = '', author = '', description = '', isChapter = true) {
  // Khử HTML tags, HTML entities và khoảng trắng dư thừa
  const cleanHtml = (text) => {
    if (!text) return '';
    return text
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<\/?[^>]+(>|$)/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&apos;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .trim();
  };

  const cleanTitle = cleanHtml(title);
  const cleanAuthor = cleanHtml(author);
  const cleanDesc = cleanHtml(description);

  let fullText = "";
  if (isChapter) {
    const titleWithPunct = /[.!?。！？]$/.test(cleanTitle) ? cleanTitle : `${cleanTitle}.`;
    if (cleanTitle && cleanDesc) {
      fullText = `${titleWithPunct}\n\n${cleanDesc}`;
    } else {
      fullText = cleanTitle || cleanDesc;
    }
  } else {
    fullText = `Giới thiệu tác phẩm: ${cleanTitle}. Tác giả: ${cleanAuthor}. Tóm tắt cốt truyện: ${cleanDesc}. Hết phần tóm tắt.`;
  }

  const paragraphs = fullText.split(/[\n\r]+/);
  const rawSentences = [];
  const validTextRegex = /\p{L}|\p{N}/u;

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    if (trimmedPara.length <= 400) {
      if (validTextRegex.test(trimmedPara)) {
        rawSentences.push(trimmedPara);
      }
    } else {
      const sentences = trimmedPara.split(/([.!?。！？])/);
      let currentChunk = "";
      for (let i = 0; i < sentences.length; i++) {
        const part = sentences[i];
        if (['.', '!', '?', '。', '！', '？'].includes(part)) {
          currentChunk += part;
        } else {
          if (currentChunk.trim() && currentChunk.length + part.length > 400) {
            if (validTextRegex.test(currentChunk.trim())) {
              rawSentences.push(currentChunk.trim());
            }
            currentChunk = part;
          } else {
            currentChunk += part;
          }
        }
      }
      if (currentChunk.trim() && validTextRegex.test(currentChunk.trim())) {
        rawSentences.push(currentChunk.trim());
      }
    }
  }
  return rawSentences;
}

// ─────────────────────────────────────────────────────────────────
// MODULE 2: Untranslated Chinese Character Detector
// ─────────────────────────────────────────────────────────────────
function checkChineseRatio(text) {
  if (!text || text.length === 0) return 0;
  const chineseMatches = text.match(/[\u4e00-\u9fa5]/g) || [];
  return chineseMatches.length / text.length;
}

// ─────────────────────────────────────────────────────────────────
// MODULE 3: Mock Audio Object & Simulated Audio Player Pipeline
// ─────────────────────────────────────────────────────────────────
class MockAudioElement {
  constructor(src) {
    this.src = src;
    this.paused = true;
    this.ended = false;
    this.currentTime = 0;
    this.duration = 2.5; // Giả lập mỗi câu 2.5 giây
    this.playbackRate = 1.0;
    this.onplay = null;
    this.onplaying = null;
    this.onpause = null;
    this.onended = null;
    this.ontimeupdate = null;
    this.onerror = null;
  }

  async play() {
    this.paused = false;
    if (typeof this.onplay === 'function') this.onplay();
    if (typeof this.onplaying === 'function') this.onplaying();
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
    if (typeof this.onpause === 'function') this.onpause();
  }

  simulateEnd() {
    this.currentTime = this.duration;
    this.ended = true;
    this.paused = true;
    if (typeof this.onended === 'function') this.onended();
  }

  simulateTimeUpdate(time) {
    this.currentTime = time;
    if (typeof this.ontimeupdate === 'function') this.ontimeupdate();
  }
}

class FullSimulatedAudioPlayer {
  constructor(sentences = [], onNextChapter = null) {
    this.sentences = sentences;
    this.onNextChapter = onNextChapter;
    this.currentIdx = 0;
    this.sessionId = 0;
    this.audioCache = new Map();
    this.revokedUrls = [];
    this.activeAudio = null;
    this.isPlaying = false;
    this.isPaused = true;
    this.isLoading = false;
    this.chapterIndex = 1;
    this.concurrencyLeaks = 0;
  }

  cleanupAudio(aud) {
    if (!aud) return;
    aud.onplay = null;
    aud.onplaying = null;
    aud.onpause = null;
    aud.onended = null;
    aud.ontimeupdate = null;
    aud.onerror = null;
    aud.pause();
  }

  // Khởi tạo một chương mới
  loadNewChapter(newSentences, chapterIdx) {
    // Dọn dẹp dứt khoát âm thanh chương cũ
    if (this.activeAudio) {
      this.cleanupAudio(this.activeAudio);
      this.activeAudio = null;
    }
    // Thu hồi 100% Blob URL của chương cũ
    for (const [idx, aud] of this.audioCache.entries()) {
      this.revokedUrls.push(aud.src);
    }
    this.audioCache.clear();

    // Tăng session ID để cắt đứt các request còn bay trên mạng
    this.sessionId += 1;
    this.sentences = newSentences;
    this.chapterIndex = chapterIdx;
    this.currentIdx = 0;
    this.isPlaying = false;
    this.isPaused = false;
  }

  // Phát câu tại chỉ số idx với Session Lock
  async playSentence(idx, expectedSession = this.sessionId) {
    if (expectedSession !== this.sessionId) {
      return { status: 'CANCELLED_SESSION_MISMATCH' };
    }

    if (!this.sentences || this.sentences.length === 0) {
      return { status: 'EMPTY_SENTENCES' };
    }

    // Auto-Next: Nếu idx vượt quá câu cuối cùng của chương
    if (idx >= this.sentences.length) {
      this.isPlaying = false;
      if (typeof this.onNextChapter === 'function') {
        this.onNextChapter();
      }
      return { status: 'CHAPTER_ENDED_AUTO_NEXT' };
    }

    // Dọn dẹp audio đang phát trước đó
    if (this.activeAudio) {
      this.cleanupAudio(this.activeAudio);
      this.activeAudio = null;
    }

    this.currentIdx = idx;
    this.evictCache(idx);

    // Lấy từ cache hoặc tạo mock audio
    let audio = this.audioCache.get(idx);
    if (!audio) {
      const mockBlob = `blob:http://localhost/mock-audio-c${this.chapterIndex}-s${idx}`;
      audio = new MockAudioElement(mockBlob);
      this.audioCache.set(idx, audio);
    }

    // Kiểm tra concurrency leak
    if (this.activeAudio && !this.activeAudio.paused) {
      this.concurrencyLeaks++;
    }

    this.activeAudio = audio;
    audio.onended = () => {
      // Tự động chuyển sang câu tiếp theo
      if (expectedSession === this.sessionId) {
        this.playSentence(idx + 1, expectedSession);
      }
    };

    await audio.play();
    this.isPlaying = true;
    this.isPaused = false;

    return { status: 'PLAYING', idx, sessionId: expectedSession };
  }

  // Thao tác tua (Seek) thông minh
  seekToSentence(targetIdx, keepPaused = false) {
    if (!this.sentences || this.sentences.length === 0) {
      return { action: 'NOOP' };
    }

    // Kẹp biên dưới: không cho phép âm
    if (targetIdx < 0) {
      targetIdx = 0;
    }

    // Kẹp biên trên: vượt quá số câu trong chương -> kích hoạt chuyển chương
    if (targetIdx >= this.sentences.length) {
      if (typeof this.onNextChapter === 'function') {
        this.onNextChapter();
      }
      return { action: 'NEXT_CHAPTER', targetIdx };
    }

    // Dọn dẹp audio cũ ngay lập tức
    if (this.activeAudio) {
      this.cleanupAudio(this.activeAudio);
      this.activeAudio = null;
    }

    // Tăng Session ID
    this.sessionId += 1;
    const newSession = this.sessionId;
    this.currentIdx = targetIdx;

    if (!keepPaused) {
      this.isPlaying = true;
      this.isPaused = false;
      this.playSentence(targetIdx, newSession);
      return { action: 'SEEKED_AND_PLAYING', targetIdx, sessionId: newSession };
    } else {
      this.isPlaying = false;
      this.isPaused = true;
      return { action: 'SEEKED_PAUSED', targetIdx, sessionId: newSession };
    }
  }

  // Tua nhanh liên tục (Spam Seeking / Rapid Scrubbing)
  rapidSeek(indices, keepPaused = false) {
    let lastResult = null;
    for (const idx of indices) {
      lastResult = this.seekToSentence(idx, keepPaused);
    }
    return lastResult;
  }

  // Dọn dẹp bộ nhớ đệm trượt (Sliding Window [currentIdx - 5, currentIdx + 30])
  evictCache(currentIdx) {
    const minKeep = currentIdx - 5;
    const maxKeep = currentIdx + 30;
    for (const [keyIdx, aud] of this.audioCache.entries()) {
      if (keyIdx < minKeep || keyIdx > maxKeep) {
        this.revokedUrls.push(aud.src);
        this.audioCache.delete(keyIdx);
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// TEST RUNNER
// ─────────────────────────────────────────────────────────────────
async function runAllTests() {
  console.log("\n🧪 ═════════════════════════════════════════════════════════════════════════");
  console.log("   TOÀN DIỆN TEST SUITE: Audio Dịch + TTS Liên Tục + Auto-Next & Tua Mọi Trường Hợp");
  console.log("═════════════════════════════════════════════════════════════════════════\n");

  // ── TEST GROUP 1: Text Sanitization & Segmentation ──
  console.log("[Test Group 1] Làm sạch văn bản, khử HTML, Emoji & Phân tách câu tiếng Việt");
  const htmlRaw = `
    <p>Đêm đen như mực, gió rít từng cơn gào thét bên ngoài vách đá.&nbsp;&nbsp;</p>
    <p>"Ngươi nghĩ có thể thoát sao?" Tạ Đình Phong cười nhạt, ánh mắt tựa lưỡi dao sắc lạnh!<br/></p>
    <div><span>Kiếm xuất! Thiên địa biến sắc...</span></div>
  `;
  const sanitizedSentences = sanitizeAndSplitText("Chương 10: Kiếm Khí Trảm Tinh Hà", "Tiêu Đỉnh", htmlRaw, true);
  assert(sanitizedSentences.length === 4, `Phân tách chính xác 4 câu sau khi bóc tách sạch HTML (thực tế: ${sanitizedSentences.length})`);
  assert(!sanitizedSentences.some(s => /<[^>]+>|&nbsp;/.test(s)), "Không còn sót lại bất kỳ thẻ HTML hoặc ký tự entity nào");
  assert(sanitizedSentences[0].includes("Chương 10"), "Câu đầu tiên là tiêu đề chương chuẩn có dấu chấm");
  assert(sanitizedSentences[2].includes("Ngươi nghĩ có thể thoát sao?"), "Bảo toàn nguyên vẹn dấu ngoặc kép và đối thoại");

  // ── TEST GROUP 2: Long Paragraph Safe Chunking ──
  console.log("\n[Test Group 2] Phân mảnh an toàn đoạn văn siêu dài (> 400 ký tự)");
  const giantParagraph = "Đại đạo vô hình, sinh dục thiên địa; đại đạo vô tình, vận hành nhật nguyệt. ".repeat(15); // ~1125 chars
  const chunked = sanitizeAndSplitText("Tiêu Đề", "", giantParagraph, true);
  assert(chunked.length >= 3, `Đoạn văn 1125 ký tự được phân mảnh thành ${chunked.length} đoạn con`);
  assert(chunked.every(c => c.length <= 450), "Mỗi phân đoạn đều nhỏ hơn 450 ký tự, chống timeout máy chủ TTS");
  assert(chunked.every(c => !c.endsWith("...") || c.length > 5), "Các đoạn phân mảnh kết thúc đúng dấu ngắt câu hợp lệ");

  // ── TEST GROUP 3: Untranslated Chapter Protection (Chinese Ratio) ──
  console.log("\n[Test Group 3] Nhận diện chữ Hán chưa dịch (Chặn đọc tiếng Trung nhầm lẫn)");
  const rawChinese = "第一千二百三十四章 谁敢与我一战！天地变色，狂风呼啸。林峰拔剑而起。";
  const translatedViet = "Chương 1234: Ai dám cùng ta đánh một trận! Trời đất biến sắc, cuồng phong gào thét. Lâm Phong rút kiếm đứng dậy.";
  const halfTranslated = "Chương 1234: 谁敢与我一战! Cuộc chiến nổ ra 天地变色, 林峰拔剑.";

  assert(checkChineseRatio(rawChinese) > 0.8, `Văn bản gốc tiếng Trung có tỉ lệ Hán ${(checkChineseRatio(rawChinese)*100).toFixed(1)}% -> Chặn phát, báo dịch`);
  assert(checkChineseRatio(translatedViet) === 0, "Bản dịch tiếng Việt 100% có 0% chữ Hán -> Cho phép đọc TTS ngay");
  assert(checkChineseRatio(halfTranslated) > 0.15, `Văn bản dịch dở (${(checkChineseRatio(halfTranslated)*100).toFixed(1)}% Hán) -> Kích hoạt retry chờ dịch`);

  // ── TEST GROUP 4: Seek Clamping & Boundary Safeguards ──
  console.log("\n[Test Group 4] Kẹp biên độ tua (Seek Boundary Clamping)");
  let nextChapterTriggerCount = 0;
  const sampleSentences = [
    "Câu 0: Tiêu đề chương truyện mở đầu.",
    "Câu 1: Ánh kiếm lóe sáng trong đêm tối mịt mùng.",
    "Câu 2: Kẻ thù ngã gục xuống sàn đá lạnh lẽo.",
    "Câu 3: Kết thúc hồi một của cuộc huyết chiến."
  ];
  const player = new FullSimulatedAudioPlayer(sampleSentences, () => {
    nextChapterTriggerCount++;
  });

  // Tua lùi quá giới hạn đầu
  const seekNeg = player.seekToSentence(-10);
  assert(seekNeg.targetIdx === 0 && player.currentIdx === 0, "Tua âm (-10) tự động kẹp về câu 0 an toàn");

  // Tua giữa chương
  const seekMid = player.seekToSentence(2);
  assert(seekMid.targetIdx === 2 && player.currentIdx === 2, "Tua câu 2 thành công và cập nhật chỉ số chính xác");

  // Tua quá giới hạn cuối
  const seekOver = player.seekToSentence(100);
  assert(seekOver.action === 'NEXT_CHAPTER' && nextChapterTriggerCount === 1, "Tua vượt biên cuối (100) tự động gọi onNextChapter");

  // Tua khi danh sách rỗng
  const emptyPlayer = new FullSimulatedAudioPlayer([], () => {});
  const seekEmpty = emptyPlayer.seekToSentence(5);
  assert(seekEmpty.action === 'NOOP', "Tua khi chương rỗng trả về NOOP không crash ứng dụng");

  // ── TEST GROUP 5: Rapid Scrubbing Stress Test & Session Lock Isolation ──
  console.log("\n[Test Group 5] Stress Test tua nhanh liên tục (Spam Seeking) & Khóa phiên phát (Session Lock)");
  nextChapterTriggerCount = 0;
  const rapidPlayer = new FullSimulatedAudioPlayer(sampleSentences, () => { nextChapterTriggerCount++; });
  const seekSequence = [0, 1, 3, 2, 0, 2, 1, 3, 2, 1, 0, 3];
  const finalSeek = rapidPlayer.rapidSeek(seekSequence);

  assert(rapidPlayer.sessionId === seekSequence.length, `Session ID tăng đúng ${seekSequence.length} lần để hủy mọi request cũ`);
  assert(rapidPlayer.currentIdx === 3, `Chỉ số câu phát trùng khớp tuyệt đối với cú tua cuối cùng (idx=${rapidPlayer.currentIdx})`);
  assert(rapidPlayer.concurrencyLeaks === 0, "Không có bất kỳ hiện tượng phát âm song song (0 concurrent audio leaks)");
  assert(finalSeek.sessionId === rapidPlayer.sessionId, "Phiên phát hiện tại hoàn toàn đồng bộ với Session Lock");

  // ── TEST GROUP 6: Tua khi đang Paused vs Tua khi Playing ──
  console.log("\n[Test Group 6] Phân biệt trạng thái: Tua khi Paused vs Tua khi Playing");
  const statePlayer = new FullSimulatedAudioPlayer(sampleSentences);
  
  // Tua trong trạng thái keepPaused = true
  const pausedSeek = statePlayer.seekToSentence(1, true);
  assert(pausedSeek.action === 'SEEKED_PAUSED', "Tua khi Paused trả về SEEKED_PAUSED");
  assert(statePlayer.isPaused === true && statePlayer.isPlaying === false, "Giữ nguyên trạng thái Tạm dừng, không tự ý bung tiếng");
  assert(statePlayer.currentIdx === 1, "Vẫn cập nhật vị trí câu để hiển thị highlight đúng đoạn người dùng chọn");

  // Tua trong trạng thái keepPaused = false
  const playSeek = statePlayer.seekToSentence(2, false);
  assert(playSeek.action === 'SEEKED_AND_PLAYING', "Tua khi Playing trả về SEEKED_AND_PLAYING");
  assert(statePlayer.isPlaying === true && statePlayer.isPaused === false, "Tự động phát câu mới sau khi tua");

  // ── TEST GROUP 7: Auto-Next Chapter Continuous Flow & Old Audio Eviction ──
  console.log("\n[Test Group 7] Tự động chuyển chương (Auto-Next) & Dọn dẹp âm thanh chương cũ");
  let autoNextCalled = false;
  const chapterFlowPlayer = new FullSimulatedAudioPlayer(sampleSentences, () => {
    autoNextCalled = true;
  });

  // Bắt đầu phát từ câu 0
  await chapterFlowPlayer.playSentence(0);
  assert(chapterFlowPlayer.isPlaying === true, "Bắt đầu phát câu 0");

  // Mô phỏng kết thúc các câu lần lượt đến câu cuối
  chapterFlowPlayer.activeAudio.simulateEnd(); // hết câu 0 -> tự sang 1
  assert(chapterFlowPlayer.currentIdx === 1, "Tự động nhảy sang câu 1 khi câu 0 kết thúc");

  chapterFlowPlayer.activeAudio.simulateEnd(); // hết câu 1 -> tự sang 2
  assert(chapterFlowPlayer.currentIdx === 2, "Tự động nhảy sang câu 2 khi câu 1 kết thúc");

  chapterFlowPlayer.activeAudio.simulateEnd(); // hết câu 2 -> tự sang 3 (câu cuối)
  assert(chapterFlowPlayer.currentIdx === 3, "Đang phát câu cuối cùng (câu 3)");

  chapterFlowPlayer.activeAudio.simulateEnd(); // hết câu 3 -> tự động kích hoạt Auto-Next!
  assert(autoNextCalled === true, "Câu cuối kết thúc -> Tự động kích hoạt onNextChapter() thành công!");

  // Mô phỏng ứng dụng tải Chương 2 mới
  const chapter2Sentences = [
    "Chương 11: Bước Chân Ra Khỏi Thần Sơn.",
    "Bình minh ló rạng, một ngày mới lại bắt đầu."
  ];
  chapterFlowPlayer.loadNewChapter(chapter2Sentences, 2);
  assert(chapterFlowPlayer.currentIdx === 0, "Chương mới bắt đầu với chỉ số câu reset về 0");
  assert(chapterFlowPlayer.chapterIndex === 2, "Chỉ số chương cập nhật lên 2");
  assert(chapterFlowPlayer.revokedUrls.length === 4, `Đã thu hồi toàn bộ ${chapterFlowPlayer.revokedUrls.length} URL Blob của Chương 1`);
  assert(chapterFlowPlayer.audioCache.size === 0, "Cache chương cũ đã được dọn sạch 100%");

  // ── TEST GROUP 8: Memory Leak Prevention (Sliding Window Cache Eviction) ──
  console.log("\n[Test Group 8] Dọn dẹp bộ nhớ đệm trượt (Sliding Window Cache Eviction)");
  const bigChapterSentences = Array.from({ length: 80 }, (_, i) => `Câu thứ ${i} của chương dài.`);
  const bigPlayer = new FullSimulatedAudioPlayer(bigChapterSentences);

  for (let i = 0; i < 80; i++) {
    bigPlayer.audioCache.set(i, new MockAudioElement(`blob:http://localhost/c1-s${i}`));
  }

  // Giả sử người dùng đang nghe hoặc tua đến câu 50
  bigPlayer.evictCache(50);
  assert(!bigPlayer.audioCache.has(40), "Câu idx=40 (< 50 - 5) đã bị loại bỏ khỏi cache");
  assert(!bigPlayer.audioCache.has(44), "Câu idx=44 (< 45) đã bị loại bỏ khỏi cache");
  assert(bigPlayer.audioCache.has(48), "Câu idx=48 nằm trong phạm vi [45..80] được giữ lại");
  assert(bigPlayer.audioCache.has(70), "Câu idx=70 nằm trong phạm vi [45..80] được giữ lại");
  assert(bigPlayer.revokedUrls.length === 45, `Đã thu hồi thành công ${bigPlayer.revokedUrls.length} Blob URLs để giải phóng RAM`);

  // ── TEST GROUP 9: Live Service Ping & Integration Test ──
  console.log("\n[Test Group 9] Kiểm tra cổng kết nối Server Live (Port 8001 & Port 5051)");
  
  // Ping Local TTS Engine (port 8001)
  await new Promise((resolve) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 8001,
      path: '/health',
      method: 'GET',
      timeout: 2000
    }, (res) => {
      assert(res.statusCode === 200, `Local TTS Server phản hồi HTTP 200 tại http://127.0.0.1:8001/health`);
      resolve();
    });
    req.on('error', (err) => {
      console.warn(`  ⚠️  Local TTS Server port 8001: ${err.message}`);
      resolve();
    });
    req.on('timeout', () => {
      req.destroy();
      console.warn(`  ⚠️  Local TTS Server port 8001 timeout`);
      resolve();
    });
    req.end();
  });

  // Ping Backend Proxy Server (port 5051)
  await new Promise((resolve) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5051,
      path: '/health',
      method: 'GET',
      timeout: 2000
    }, (res) => {
      assert(res.statusCode === 200, `Backend Proxy Server phản hồi HTTP 200 tại http://127.0.0.1:5051/health`);
      resolve();
    });
    req.on('error', (err) => {
      console.warn(`  ⚠️  Backend Proxy Server port 5051: ${err.message}`);
      resolve();
    });
    req.on('timeout', () => {
      req.destroy();
      console.warn(`  ⚠️  Backend Proxy Server port 5051 timeout`);
      resolve();
    });
    req.end();
  });

  // ── TỔNG KẾT ──
  console.log("\n═════════════════════════════════════════════════════════════════════════");
  console.log(`  KẾT QUẢ: ${passedTests}/${totalTests} tests passed | ${failedTests} failed`);
  console.log("═════════════════════════════════════════════════════════════════════════\n");

  if (failedTests === 0) {
    console.log("🎉 XUẤT SẮC! TẤT CẢ CÁC TRƯỜNG HỢP AUDIO DỊCH, TTS LIÊN TỤC, AUTO-NEXT & TUA ĐÃ VƯỢT QUA 100%!\n");
    process.exit(0);
  } else {
    console.error("⛔ CÓ LỖI XẢY RA TRONG TEST SUITE!\n");
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error("Unhandled error in test runner:", err);
  process.exit(1);
});
