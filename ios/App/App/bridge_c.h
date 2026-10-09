#ifndef NATIVE_CORE_BRIDGE_C_H
#define NATIVE_CORE_BRIDGE_C_H

#ifdef __cplusplus
extern "C" {
#endif

// ─── Core Engine Lifecycle ───
// Khởi tạo toàn bộ mô hình On-Device (Trie, HanLP, CMLM, Matcha-TTS)
int NativeCore_Init(const char* models_base_dir);

// Kiểm tra trạng thái sẵn sàng của Native Core
int NativeCore_IsReady(void);

// Giải phóng bộ nhớ chuỗi đã cấp phát qua C ABI
void NativeCore_FreeString(char* str);


// ─── On-Device AI: In-Memory Translation (Modes 0..7) ───
// Dịch thuật văn bản với toàn bộ các chế độ Mode 0, 1, 2, 3, 4, 5, 7
const char* NativeCore_Translate(const char* text, int mode);


// ─── On-Device TTS: Text Normalization & Processing ───
// Chuẩn hóa ngữ âm tiếng Việt (số, la mã, ngày tháng, tiền tệ, latin)
const char* NativeCore_NormalizeTTS(const char* text);

// Tách đoạn văn bản thành danh sách câu chuẩn JSON array
const char* NativeCore_SplitSentences(const char* text);

// Sinh file âm thanh WAV trực tiếp từ văn bản trong RAM
int NativeCore_SynthesizeWav(const char* text, const char* out_path, float speed);


// ─── On-Device Edge: Offline Document Readers ───
const char* NativeCore_FetchAndSanitizeWeb(const char* target_url, int is_desktop);
const char* NativeCore_ParseEpub(const char* epub_path);
const char* NativeCore_ParseTxt(const char* txt_path, const char* title);

#ifdef __cplusplus
}
#endif

#endif // NATIVE_CORE_BRIDGE_C_H
