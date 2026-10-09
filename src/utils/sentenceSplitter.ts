/**
 * Thuật toán tách và gộp câu thông minh phục vụ TTS (Google Smart Chunking Standard).
 * - Đảm bảo không bỏ sót bất kỳ câu/lời thoại ngắn nào (kể cả 1 từ như "Ừ.", "Được.").
 * - Gộp các câu ngắn (< 45 ký tự) vào câu kế tiếp để tạo cụm âm thanh tự nhiên (3-12s/chunk),
 *   loại bỏ triệt để hiện tượng giật lag, drop chunk hoặc méo tiếng ở các đoạn quá ngắn.
 * - Độc lập 100% (Level 0 Foundation Utility).
 */
export function splitAndMergeSentences(rawContent: string): string[] {
  if (!rawContent || !rawContent.trim()) return [];

  // Tách văn bản theo các dấu kết thúc câu và ngắt dòng
  const parts = rawContent.split(/([.!?。！？…]+["”'’」]*\s*|\n+)/);
  const rawList: string[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    const full = (parts[i] + (parts[i + 1] || '')).trim();
    if (full.length > 0 && /[a-zA-Z0-9\u4e00-\u9fa5\u00C0-\u1EF9]/u.test(full)) {
      rawList.push(full);
    }
  }

  if (rawList.length === 0) return [rawContent.trim()];

  const isCompleteSentence = (s: string) => /[.!?。！？…]["”'’」]*$/.test(s.trim());
  const MIN_CHUNK_CHARS = 45;   // Ngưỡng tối thiểu để đứng thành 1 chunk độc lập
  const MAX_CHUNK_CHARS = 220;  // Ngưỡng tối đa cho một chunk đọc nơ-ron

  const result: string[] = [];
  let buffer = '';

  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i];
    if (!buffer) {
      buffer = item;
    } else {
      const combinedLen = buffer.length + 1 + item.length;
      // Nếu buffer chưa đủ độ dài chuẩn (< 45 ký tự) HOẶC câu chưa trọn vẹn:
      // Tiếp tục gộp với câu sau nếu không vượt quá MAX_CHUNK_CHARS
      const shouldMerge = (!isCompleteSentence(buffer) || buffer.length < MIN_CHUNK_CHARS) && (combinedLen <= MAX_CHUNK_CHARS);

      if (shouldMerge) {
        buffer = buffer + ' ' + item;
      } else {
        result.push(buffer);
        buffer = item;
      }
    }
  }

  if (buffer) {
    result.push(buffer);
  }

  return result;
}
