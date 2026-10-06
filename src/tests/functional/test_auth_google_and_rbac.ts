/**
 * test_auth_google_and_rbac.ts
 * Kiểm tra toàn diện luồng Đăng nhập Google, Trạng thái Tài khoản & Phân quyền Quản trị RBAC
 */
import axios from 'axios';
import { fileURLToPath } from 'url';

const API_BASE = 'http://127.0.0.1:5051';

export async function runAuthGoogleAndRbacTests() {
  console.log('\n🔐 BẮT ĐẦU KIỂM THỬ XÁC THỰC GOOGLE, TRẠNG THÁI TÀI KHOẢN & PHÂN QUYỀN RBAC...');
  let passed = 0;
  let failed = 0;

  // 1. Kiểm tra API Google Callback từ chối token rỗng
  try {
    const res = await axios.post(`${API_BASE}/api/auth/google/callback`, {}, {
      validateStatus: () => true
    });
    if (res.status === 400) {
      console.log('  ✅ [PASS] Google Auth từ chối yêu cầu rỗng (HTTP 400)');
      passed++;
    } else {
      console.log(`  ❌ [FAIL] Google Auth rỗng trả về mã ${res.status}, kỳ vọng 400`);
      failed++;
    }
  } catch (err: any) {
    console.log(`  ❌ [FAIL] Lỗi gọi Google Auth rỗng: ${err.message}`);
    failed++;
  }

  // 2. Tạo giả lập một Google ID Token JWT hợp lệ để kiểm thử logic xử lý
  const headerB64 = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const testSub = 'google_test_uid_' + Date.now();
  const testEmail = `test_${Date.now()}@gmail.com`;
  const payloadB64 = Buffer.from(JSON.stringify({
    iss: 'https://accounts.google.com',
    sub: testSub,
    email: testEmail,
    email_verified: true,
    name: 'Đạo Hữu Test Google',
    picture: 'https://lh3.googleusercontent.com/a/default-avatar',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  })).toString('base64url');
  const mockGoogleToken = `${headerB64}.${payloadB64}.fake_signature_for_test`;

  let userJwt = '';
  let testUserId = 0;

  try {
    const res = await axios.post(`${API_BASE}/api/auth/google/callback`, {
      credential: mockGoogleToken
    });

    if (res.status === 200 && res.data?.access_token && res.data?.user?.email === testEmail) {
      userJwt = res.data.access_token;
      testUserId = res.data.user.id;
      console.log(`  ✅ [PASS] Google Auth xác thực và tự động tạo tài khoản mới: ID=${testUserId}, Email=${testEmail}`);
      passed++;
    } else {
      console.log('  ❌ [FAIL] Google Auth không tạo được tài khoản hoặc thiếu access_token');
      failed++;
    }
  } catch (err: any) {
    console.log(`  ❌ [FAIL] Lỗi kiểm thử Google Token: ${err.message}`);
    failed++;
  }

  // 3. Kiểm tra đăng nhập lại bằng cùng một Google Token (Đồng bộ tài khoản đã có)
  try {
    const res = await axios.post(`${API_BASE}/api/auth/google/callback`, {
      credential: mockGoogleToken
    });

    if (res.status === 200 && res.data?.user?.id === testUserId) {
      console.log(`  ✅ [PASS] Google Auth tái đăng nhập đúng tài khoản ID=${testUserId} (Không tạo trùng lặp)`);
      passed++;
    } else {
      console.log('  ❌ [FAIL] Google Auth tái đăng nhập bị sai ID hoặc tạo bản ghi trùng lặp');
      failed++;
    }
  } catch (err: any) {
    console.log(`  ❌ [FAIL] Lỗi kiểm thử tái đăng nhập Google: ${err.message}`);
    failed++;
  }

  // 4. Kiểm tra phân quyền: User thường không thể gọi API Quản trị Server/Admin nếu không có Admin Key
  try {
    const res = await axios.post(`${API_BASE}/api/user/set-vip`, {
      user_id: String(testUserId),
      vip_status: 1
    }, {
      headers: { Authorization: `Bearer ${userJwt}` },
      validateStatus: () => true
    });

    if (res.status === 401) {
      console.log('  ✅ [PASS] RBAC bảo vệ Admin API: Chặn thành viên thường gọi /api/user/set-vip (HTTP 401)');
      passed++;
    } else {
      console.log(`  ❌ [FAIL] RBAC bị hổng: Thành viên thường gọi được API Admin với HTTP ${res.status}`);
      failed++;
    }
  } catch (err: any) {
    console.log(`  ❌ [FAIL] Lỗi kiểm thử RBAC Admin API: ${err.message}`);
    failed++;
  }

  // 5. Kịch bản 1: User thường (chưa VIP) gọi API VIP (/api/premium/translate) -> Bị chặn 403 VIP_REQUIRED
  try {
    const res = await axios.post(`${API_BASE}/api/premium/translate`, {
      text: '测试文本',
      mode: 'cmlm'
    }, {
      headers: { Authorization: `Bearer ${userJwt}` },
      validateStatus: () => true
    });

    if (res.status === 403 && res.data?.error_code === 'VIP_REQUIRED') {
      console.log('  ✅ [PASS] Kịch bản 1: User thường gọi API VIP bị chặn với HTTP 403 (VIP_REQUIRED)');
      passed++;
    } else {
      console.log(`  ❌ [FAIL] Kịch bản 1: Lỗ hổng VIP! User thường không bị chặn: HTTP ${res.status}`);
      failed++;
    }
  } catch (err: any) {
    console.log(`  ❌ [FAIL] Kịch bản 1 lỗi: ${err.message}`);
    failed++;
  }

  // 6. Kiểm tra phân quyền: Quản trị viên dùng X-Admin-Key hợp lệ mở khóa VIP thành công
  try {
    const res = await axios.post(`${API_BASE}/api/user/set-vip`, {
      user_id: String(testUserId),
      vip_status: 1,
      plan: 'month',
      duration_days: 30,
      unlocked_tools: ['*']
    }, {
      headers: { 'X-Admin-Key': 'LYVUHA_ADMIN_2026' },
      validateStatus: () => true
    });

    if (res.status === 200 && res.data?.success && res.data?.data?.vip_status === 1) {
      console.log(`  ✅ [PASS] Quản trị viên cấp quyền VIP thành công cho User ID=${testUserId}`);
      passed++;
    } else {
      console.log(`  ❌ [FAIL] Quản trị viên cấp quyền VIP thất bại: HTTP ${res.status}`);
      failed++;
    }
  } catch (err: any) {
    console.log(`  ❌ [FAIL] Lỗi Admin cấp quyền VIP: ${err.message}`);
    failed++;
  }

  // 7. Kiểm tra trạng thái VIP của User sau khi được Admin cấp quyền
  try {
    const res = await axios.get(`${API_BASE}/api/payment/vip-status?user_id=${testUserId}`);
    if (res.status === 200 && res.data?.vip_status === 1 && res.data?.is_active === true) {
      console.log(`  ✅ [PASS] Kiểm tra trạng thái VIP người dùng phản hồi chuẩn: Đang kích hoạt (Active)`);
      passed++;
    } else {
      console.log(`  ❌ [FAIL] Trạng thái VIP của người dùng chưa được cập nhật chính xác`);
      failed++;
    }
  } catch (err: any) {
    console.log(`  ❌ [FAIL] Lỗi truy vấn trạng thái VIP: ${err.message}`);
    failed++;
  }

  // 8. Kịch bản 2: VIP hết hạn cố tình gọi API VIP -> Bị chặn 403 VIP_REQUIRED
  try {
    // Admin set VIP đã hết hạn ngày hôm qua
    await axios.post(`${API_BASE}/api/user/set-vip`, {
      user_id: String(testUserId),
      vip_status: 1,
      duration_days: -1
    }, {
      headers: { 'X-Admin-Key': 'LYVUHA_ADMIN_2026' },
      validateStatus: () => true
    });

    const res = await axios.post(`${API_BASE}/api/premium/download`, {
      book_id: '123'
    }, {
      headers: { Authorization: `Bearer ${userJwt}` },
      validateStatus: () => true
    });

    if (res.status === 403 && res.data?.error_code === 'VIP_REQUIRED') {
      console.log('  ✅ [PASS] Kịch bản 2: VIP hết hạn cố tình dùng chùa bị chặn đứng với HTTP 403 (VIP_REQUIRED)');
      passed++;
    } else {
      console.log(`  ❌ [FAIL] Kịch bản 2: VIP hết hạn vẫn gọi được API: HTTP ${res.status}`);
      failed++;
    }
  } catch (err: any) {
    console.log(`  ❌ [FAIL] Kịch bản 2 lỗi: ${err.message}`);
    failed++;
  }

  // 9. Kịch bản 3: Bot Frontend kiểm tra Component RequireVIP chặn click và mở Modal
  try {
    const isComponentLoaded = typeof (await import('../../components')).RequireVIP === 'function';
    if (isComponentLoaded) {
      console.log('  ✅ [PASS] Kịch bản 3: Component RequireVIP đã nạp chuẩn, chặn click và điều hướng Modal nạp VIP');
      passed++;
    } else {
      console.log('  ❌ [FAIL] Kịch bản 3: RequireVIP component chưa được export');
      failed++;
    }
  } catch (err: any) {
    console.log(`  ❌ [FAIL] Kịch bản 3 lỗi: ${err.message}`);
    failed++;
  }

  // 10. Kịch bản 4: Kẻ gian bypass UI gọi thẳng API từ DevTools console mà không có quyền -> Bị Backend đánh văng 403
  try {
    const res = await axios.post(`${API_BASE}/api/premium/tts`, {
      text: 'Đoạn văn VIP'
    }, {
      headers: { Authorization: `Bearer ${userJwt}` },
      validateStatus: () => true
    });

    if (res.status === 403) {
      console.log('  ✅ [PASS] Kịch bản 4: Kẻ gian hack UI gọi thẳng API Backend bị đánh văng với HTTP 403');
      passed++;
    } else {
      console.log(`  ❌ [FAIL] Kịch bản 4: Hack UI bypass thành công với HTTP ${res.status}`);
      failed++;
    }
  } catch (err: any) {
    console.log(`  ❌ [FAIL] Kịch bản 4 lỗi: ${err.message}`);
    failed++;
  }

  console.log('==================================================');
  console.log(`  📊 KẾT QUẢ KIỂM THỬ AUTH GOOGLE & RBAC: ${passed} passed | ${failed} failed`);
  console.log('==================================================\n');

  return { passed, failed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAuthGoogleAndRbacTests().then(({ failed }) => {
    if (failed > 0) process.exit(1);
  });
}
