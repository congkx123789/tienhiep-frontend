/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  test_cross_platform_mocking.ts
 *  Kiểm thử Unit Test đa nền tảng (Single Source of Truth) với Mocking Engine
 * ═════════════════════════════════════════════════════════════════════════════
 */

import {
  setMockPlatform,
  detectPlatform,
  getPlatformCapabilities,
  isAndroid,
  isIOS,
  isElectron,
  isWeb,
  isNativeApp,
  PlatformCapabilities,
} from '../../core/platform/detector';

export interface TestResult {
  passed: number;
  failed: number;
}

export async function runCrossPlatformMockingTests(): Promise<TestResult> {
  console.log('\n📱 BẮT ĐẦU KIỂM THỬ SINGLE SOURCE OF TRUTH — CROSS-PLATFORM MOCKING...');
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

  try {
    // ─── 1. TEST MÔI TRƯỜNG WEB BROWSER ───
    setMockPlatform('web');
    assert(isWeb() === true && detectPlatform() === 'web', 'Giả lập nền tảng Web thành công');
    assert(isNativeApp() === false, 'Web không phải là Native App');
    
    let caps: PlatformCapabilities = getPlatformCapabilities();
    assert(caps.supportsOfflineEpub === false, 'Web: Tắt quyền ghi file EPUB trực tiếp vào hệ điều hành');
    assert(caps.preferredAudioEngine === 'web_audio_api', 'Web: Sử dụng Web Audio API / Remote Server');
    assert(caps.allowsGoogleAdSense === true, 'Web: Cho phép nạp mã quảng cáo Google AdSense');
    assert(caps.requiresNotchSafeArea === false, 'Web: Không yêu cầu bù trừ tai thỏ di động');

    // ─── 2. TEST MÔI TRƯỜNG ANDROID NATIVE ───
    setMockPlatform('android');
    assert(isAndroid() === true && isNativeApp() === true, 'Giả lập nền tảng Android Native thành công');
    
    caps = getPlatformCapabilities();
    assert(caps.supportsOfflineEpub === true, 'Android: Bật tính năng tải & lưu trữ EPUB Offline vào máy');
    assert(caps.preferredAudioEngine === 'cpp_native_daemon', 'Android: Ưu tiên C++ Native Engine daemon tốc độ cao');
    assert(caps.supportsBackgroundAudio === true, 'Android: Bật Background Audio Service khi tắt màn hình');
    assert(caps.supportsNativeShareIntent === true, 'Android: Kích hoạt Native Share Intent');
    assert(caps.allowsGoogleAdSense === false, 'Android: Chặn Google AdSense để tuân thủ Google Play Store Policy');
    assert(caps.requiresNotchSafeArea === true, 'Android: Kích hoạt bù trừ Safe Area & Notch');

    // ─── 3. TEST MÔI TRƯỜNG IOS NATIVE ───
    setMockPlatform('ios');
    assert(isIOS() === true && isNativeApp() === true, 'Giả lập nền tảng iOS Native thành công');
    
    caps = getPlatformCapabilities();
    assert(caps.supportsOfflineEpub === true, 'iOS: Hỗ trợ lưu trữ truyện Offline');
    assert(caps.supportsBackgroundAudio === true, 'iOS: Kích hoạt AVAudioSession phát nền');
    assert(caps.supportsNativeShareIntent === true, 'iOS: Kích hoạt UIActivityViewController Share');
    assert(caps.requiresNotchSafeArea === true, 'iOS: Bắt buộc đệm Dynamic Island / Notch');

    // ─── 4. TEST MÔI TRƯỜNG ELECTRON DESKTOP ───
    setMockPlatform('electron');
    assert(isElectron() === true && isNativeApp() === true, 'Giả lập nền tảng Electron Desktop thành công');
    
    caps = getPlatformCapabilities();
    assert(caps.supportsOfflineEpub === true, 'Desktop: Cho phép ghi trực tiếp vào ổ cứng qua Node.js fs');
    assert(caps.preferredAudioEngine === 'cpp_native_daemon', 'Desktop: Chạy daemon C++ TTS 100% native offline');
    assert(caps.hasVirtualKeyboard === false, 'Desktop: Không có bàn phím ảo đẩy khung nhìn');
    assert(caps.allowsGoogleAdSense === false, 'Desktop: Chặn quảng cáo web rác trong ứng dụng Desktop');

  } finally {
    // Reset mock platform về trạng thái ban đầu sau khi kiểm thử
    setMockPlatform(null);
  }

  console.log('==================================================');
  console.log(`  📊 KẾT QUẢ CROSS-PLATFORM MOCKING: ${passed} passed | ${failed} failed`);
  console.log('==================================================\n');

  return { passed, failed };
}
